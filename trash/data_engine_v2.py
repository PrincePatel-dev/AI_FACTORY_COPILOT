"""
data_engine_v2.py — Compiler + Sandboxed Executor pipeline.

Replaces the v1 "filter + aggregate + hope the LLM computes correctly" approach.

Pipeline:
1. compile_query()  : LLM translates ANY user question (any language/phrasing)
                      into a SINGLE pandas expression (structured JSON output).
2. execute_compiled(): the expression is AST-validated against a strict allowlist
                      and executed deterministically on the FULL dataset.
3. build_facts_block(): the computed result becomes a FACTS block (ground truth).
4. build_phrase_prompt(): a second LLM call ONLY rephrases the facts into natural
                      language. It is forbidden to compute or invent numbers.
5. verify_answer(): every number in the final answer must exist in the facts;
                      otherwise a 100%-accurate fallback sentence is returned.

Numbers are always computed by pandas on the real data — never guessed by the LLM.
"""

import ast
import json
import re
import threading

import pandas as pd
from google.genai import types

DATA_PATH = "factory_data.csv"

COLUMNS = [
    "date", "shift", "machine_id", "operator",
    "planned_runtime_min", "actual_runtime_min", "downtime_min",
    "downtime_reason", "units_produced", "units_planned",
    "scrap_units", "scrap_reason", "oee_percent",
]

ALLOWED_METHODS = {
    "groupby", "agg", "aggregate", "mean", "sum", "max", "min", "count",
    "std", "median", "var", "first", "last", "iloc", "loc", "iat", "at",
    "sort_values", "sort_index", "head", "tail", "unique", "nunique",
    "value_counts", "tolist", "round", "between", "isin", "quantile", "size",
    "mode", "values", "index", "keys", "get", "columns", "item", "reindex",
    "describe", "astype", "rename", "reset_index", "dropna", "fillna",
    "nlargest", "nsmallest", "notna", "shift", "diff", "pct_change",
    "cumsum", "idxmax", "idxmin", "to_dict", "to_frame", "corr",
    "contains", "startswith", "endswith", "lower", "upper", "replace",
}

PD_ATTRS = {"Timedelta", "to_datetime", "DateOffset", "NaT", "Series", "DataFrame"}

DT_ATTRS = {
    "year", "month", "day", "weekday", "dayofweek", "week", "hour", "minute",
    "strftime", "dt",
}

ALLOWED_ATTRS = set(COLUMNS) | ALLOWED_METHODS | PD_ATTRS | DT_ATTRS | {"str"}

ALLOWED_BUILTINS = {
    "len", "round", "abs", "min", "max", "sum", "list", "str", "int",
    "float", "bool", "sorted", "dict", "tuple", "any", "all",
}

ALLOWED_NAMES = {"df", "pd", "True", "False", "None"}

ALLOWED_NODE_TYPES = (
    ast.Expression, ast.Constant, ast.Name, ast.Attribute, ast.Call,
    ast.BinOp, ast.UnaryOp, ast.Compare, ast.BoolOp, ast.Subscript, ast.Slice,
    ast.List, ast.Tuple, ast.Dict, ast.keyword, ast.Load, ast.IfExp,
    ast.And, ast.Or, ast.Not, ast.In, ast.NotIn, ast.Is, ast.IsNot,
    ast.Lt, ast.Gt, ast.Eq, ast.NotEq, ast.LtE, ast.GtE,
    ast.Add, ast.Sub, ast.Mult, ast.Div, ast.FloorDiv, ast.Mod, ast.Pow,
    ast.USub, ast.UAdd, ast.Invert, ast.BitOr, ast.BitAnd, ast.BitXor,
)

COMPILE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "code": {
            "type": "STRING",
            "description": "A single pandas expression computing the exact answer",
        },
        "question_type": {
            "type": "STRING",
            "enum": ["aggregate", "top_n", "comparison", "trend", "raw_row", "count", "filter", "other"],
        },
        "is_exact": {
            "type": "BOOLEAN",
            "description": "true if the answer is one precise value (one number or one row)",
        },
        "summary": {
            "type": "STRING",
            "description": "A short plain-English description of what the code computes, e.g. 'shift with the most electrical faults' or 'Weld-02 average OEE' or '6th row'",
        },
    },
    "required": ["code", "question_type", "is_exact", "summary"],
}

COMPILE_SYSTEM = """You translate a factory-floor manager's question into ONE pandas expression that computes the EXACT answer from a pandas DataFrame named `df`.

DataFrame schema (df keeps the ORIGINAL CSV row order; "first row" = df.iloc[0], "last row" = df.iloc[-1]):
- date: datetime64 (YYYY-MM-DD)
- shift: str - one of Morning, Afternoon, Night
- machine_id: str - one of CNC-01, CNC-02, Press-01, Press-02, Weld-01, Weld-02, Assembly-01, Assembly-02, Paint-01, Paint-02
- operator: str
- planned_runtime_min: int
- actual_runtime_min: int
- downtime_min: int
- downtime_reason: str (Operator Break, Mechanical Failure, Electrical Fault, Material Shortage, Quality Hold, Tool Change, Changeover, Planned Maintenance, No Downtime)
- units_produced: int
- units_planned: int
- scrap_units: int
- scrap_reason: str (Dimension Mismatch, Weld Crack, Paint Run, Surface Defect)
- oee_percent: float

HARD RULES FOR THE CODE:
1. A SINGLE Python expression, one line. NO imports, NO assignments, NO semicolons, NO loops, NO lambdas, NO function definitions.
2. Use ONLY `df` and `pd` plus builtins like len, round, min, max, sum.
3. ALWAYS access columns with bracket notation df["col"] - NEVER df.col attribute access. Some column names shadow DataFrame methods (e.g. df.shift, df.first, df.last, df.sum would return a method, not the column, and break the result).
4. Allowed patterns (examples):
   - df.iloc[0].to_dict()                      -> full first row, all columns
   - df.iloc[-1].to_dict()                     -> full last row
   - df.iloc[5]["oee_percent"]                 -> 6th row's OEE
   - len(df)                                   -> total rows
   - df[df["machine_id"] == "Weld-02"]["oee_percent"].mean().round(2)
   - df[df["date"] >= df["date"].max() - pd.Timedelta(days=7)].groupby("machine_id")["downtime_min"].mean().round(1).sort_values(ascending=False).head(5)
   - df[df["downtime_reason"] == "Electrical Fault"].groupby("shift").size()
   - df[df["shift"] == "Night"]["scrap_units"].sum()
   - (df[df["date"] >= df["date"].max() - pd.Timedelta(days=7)]["oee_percent"].mean() - df[(df["date"] >= df["date"].max() - pd.Timedelta(days=14)) & (df["date"] < df["date"].max() - pd.Timedelta(days=7))]["oee_percent"].mean()).round(2)
5. Keep results SMALL: .head(N) with N <= 10 for lists, .round(1) or .round(2) on floats.
6. For first/last/Nth row questions output df.iloc[...].to_dict(). For a single best/worst row output df.sort_values("oee_percent").head(1).to_dict("records").
7. NEVER invent values - compute only from df. NEVER use a year other than {year} - the dataset spans {dmin} to {dmax}, so a date the user mentions must use pd.to_datetime("YYYY-MM-DD") with the correct year ({year}).
8. For "improved/worsened/trend" questions NEVER return a boolean. Return a dict with both values instead, e.g. dict(previous_week_avg=65.2, this_week_avg=64.4). Same for comparing two machines/shifts: return both sides, e.g. dict(cnc_avg=40.1, press_avg=55.2).
9. Dict keys MUST identify the entity from the question, so the answer can be attributed correctly. For a question about Weld-02, use keys like dict(weld02_total_scrap=..., weld02_top_scrap_reason=...). For shifts: dict(night_..., morning_...). For machine comparison: dict(cnc_avg=..., press_avg=...).
10. summary: ALWAYS fill it with a short plain-English description of what the code computes, e.g. "shift with the most electrical faults" or "Weld-02 total scrap" or "6th row of the dataset". This label is shown to the answering model so it knows what the value means - never leave it empty.
11. question_type: aggregate | top_n | comparison | trend | raw_row | count | filter | other.
12. is_exact: true if the answer is a single precise value.

Return ONLY a JSON object with keys: code, question_type, is_exact."""


def load_data():
    df = pd.read_csv(DATA_PATH)
    df["date"] = pd.to_datetime(df["date"])
    return df


def fmt_value(v):
    if isinstance(v, bool):
        return str(v)
    if isinstance(v, float):
        if v != v:  # NaN
            return "NaN"
        r = round(v, 2)
        return str(int(r)) if float(r).is_integer() else str(r)
    if isinstance(v, int):
        return str(v)
    if isinstance(v, pd.Timestamp):
        return str(v.date())
    if isinstance(v, (list, tuple)):
        return ", ".join(fmt_value(x) for x in v)
    return str(v)


def _strip_code_fences(code):
    code = code.strip()
    if code.startswith("```"):
        code = re.sub(r"^```[a-zA-Z]*\n?", "", code)
        code = re.sub(r"\n?```$", "", code)
    return code.strip()


def _parse_json(text):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end + 1]
    return json.loads(text)


def generate_with_retry(client, model_name, prompt, config=None, attempts=3):
    """Generate content, backing off on free-tier 429 quota errors."""
    import time

    for i in range(attempts):
        try:
            if config is not None:
                return client.models.generate_content(
                    model=model_name, contents=prompt, config=config
                )
            return client.models.generate_content(model=model_name, contents=prompt)
        except Exception as e:
            msg = str(e)
            if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                wait = 30 + 10 * i
                m = re.search(r"retry in (\d+(?:\.\d+)?)s", msg)
                if m:
                    wait = max(wait, float(m.group(1)) + 2)
                time.sleep(wait)
                continue
            raise
    raise RuntimeError("Still rate-limited after retries")


def compile_query(query, client, model_name, df, feedback=""):
    """Turn the user's natural-language question into a pandas expression."""
    machines = ", ".join(sorted(df["machine_id"].unique().tolist()))
    dmin, dmax = df["date"].min().date(), df["date"].max().date()
    year = dmax.year
    system = COMPILE_SYSTEM.format(year=year, dmin=dmin, dmax=dmax)
    prompt = (
        system
        + f"\n\nmachine_id values in df: {machines}"
        + (f"\n\nFEEDBACK FROM A FAILED PREVIOUS ATTEMPT (fix this): {feedback}" if feedback else "")
        + f"\n\nUSER QUESTION: {query}"
    )
    try:
        resp = generate_with_retry(
            client,
            model_name,
            prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=COMPILE_SCHEMA,
            ),
        )
        data = _parse_json(resp.text)
    except Exception:
        # Fallback: plain-text generation, then parse the JSON out of it.
        resp = generate_with_retry(client, model_name, prompt)
        data = _parse_json(resp.text)

    code = _strip_code_fences(data.get("code", ""))
    if not code:
        raise ValueError("LLM returned an empty expression")
    return {
        "code": code,
        "question_type": data.get("question_type", "other"),
        "is_exact": bool(data.get("is_exact", False)),
        "summary": str(data.get("summary", "")).strip(),
    }


def validate_code(code):
    """AST allowlist: reject anything unsafe before it ever runs."""
    try:
        tree = ast.parse(code, mode="eval")
    except SyntaxError as e:
        raise ValueError(f"Invalid expression syntax: {e}")

    for node in ast.walk(tree):
        if not isinstance(node, ALLOWED_NODE_TYPES):
            raise ValueError(f"Disallowed construct: {type(node).__name__}")
        if isinstance(node, ast.Name):
            if node.id not in ALLOWED_NAMES and node.id not in ALLOWED_BUILTINS:
                raise ValueError(f"Disallowed name: {node.id}")
        elif isinstance(node, ast.Attribute):
            if node.attr not in ALLOWED_ATTRS:
                raise ValueError(f"Disallowed attribute: {node.attr}")
        elif isinstance(node, ast.Call):
            f = node.func
            if isinstance(f, ast.Name) and f.id not in ALLOWED_BUILTINS:
                raise ValueError(f"Disallowed call: {f.id}")
    return tree


def execute_compiled(df, code, timeout=5):
    """Run the validated expression in a restricted namespace with a timeout."""
    tree = validate_code(code)
    compiled = compile(tree, "<factory_query>", "eval")
    out = {}

    def run():
        try:
            out["result"] = eval(compiled, {"df": df, "pd": pd}, {})
            out["ok"] = True
        except Exception as e:
            out["err"] = e

    t = threading.Thread(target=run, daemon=True)
    t.start()
    t.join(timeout)
    if t.is_alive():
        raise ValueError("Query timed out (took longer than 5 seconds)")
    if not out.get("ok"):
        raise ValueError(f"Execution error: {out['err']}")
    return out["result"]


def result_to_facts(result, question_type, label="answer"):
    facts = []
    if isinstance(result, dict):
        for k, v in list(result.items())[:14]:
            facts.append(f"{k} = {fmt_value(v)}")
    elif isinstance(result, pd.DataFrame):
        cols = list(result.columns)[:10]
        for i, row in result.head(8).iterrows():
            facts.append(" | ".join(f"{c} = {fmt_value(row[c])}" for c in cols))
    elif isinstance(result, pd.Series):
        for idx, val in list(result.items())[:12]:
            facts.append(f"{fmt_value(idx)} -> {fmt_value(val)}")
    elif isinstance(result, list) and result and isinstance(result[0], dict):
        cols = list(result[0].keys())[:10]
        for row in result[:8]:
            facts.append(" | ".join(f"{c} = {fmt_value(row[c])}" for c in cols))
    else:
        facts.append(f"{label} = {fmt_value(result)}")
    if not facts:
        facts.append(f"{label} = (empty)")
    return facts


def build_facts_block(df, query, result, question_type, summary=""):
    first = df.iloc[0]
    last = df.iloc[-1]
    first_line = ", ".join(
        f"{c}={fmt_value(first[c])}" for c in COLUMNS
    )
    last_line = ", ".join(
        f"{c}={fmt_value(last[c])}" for c in COLUMNS
    )
    lines = [
        f"TOTAL_RECORDS_IN_SYSTEM: {len(df)}",
        f"DATA_DATE_RANGE: {first['date'].date()} to {last['date'].date()}",
        f"FIRST_RECORD_IN_DATASET (row index 0): {first_line}",
        f"LAST_RECORD_IN_DATASET (row index {len(df)-1}): {last_line}",
        "",
        "EXACT COMPUTED ANSWERS (ground truth, computed by pandas on the real data):",
    ]
    for i, f in enumerate(result_to_facts(result, question_type, label=summary or "answer"), 1):
        lines.append(f"FACT {i}: {f}")
    return "\n".join(lines)


def build_phrase_prompt(query, facts_block):
    return f"""You are the AI Factory Copilot speaking to a busy factory-floor manager (not a data person).

The FACTS below were computed EXACTLY from the factory dataset by a program. They are ground truth.

STRICT RULES:
1. Your ONLY job is to rephrase the FACTS into a natural, friendly answer.
2. Copy every number and every machine/name EXACTLY as written in the FACTS (same digits, same values). Never round, estimate, compare, or compute anything yourself.
3. Reply in the same language/script the user used (e.g. Hinglish if they wrote Hinglish, Gujarati if Gujarati, English if English). Match their style.
4. 2-3 short sentences, spoken like a helpful colleague. No tables, no column names, no code, no internal labels like FACT or oee_percent.
5. The FACTS directly answer the user's question. If they contain values, answer with them CONFIDENTLY - never say data is missing, never apologize, never add disclaimers.
6. A fact may be terse, like "shift with the most electrical faults = Night" or "answer = Night". Map it to the user's question naturally: that value IS the answer. Do not question it.
7. Never mention any machine, shift, date, or group that is NOT present in the FACTS. For example, if the FACTS are about one machine, do not talk about "the whole factory" - the facts are about that machine only.
8. Never add commentary, suggestions, or claims not supported by the FACTS (no "records updated", "system fine", "sab kuch theek hai", etc.). Answer only what the facts show.
9. If the FACTS truly do NOT contain an answer to the question, say honestly that you could not find that in the data - never invent a number.

FACTS (internal - use the values only, never repeat the labels):
{facts_block}

USER'S QUESTION: {query}

Now reply directly to the manager:"""


_DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")
_MACHINE_TOKEN_RE = re.compile(r"[A-Za-z]+-\d+")


def _mask_dates(text):
    """Replace full YYYY-MM-DD dates with just their year for number checking."""

    def repl(m):
        return str(int(m.group()[:4]))

    return _DATE_RE.sub(repl, text)


def _extract_numbers(text):
    # Machine IDs like Weld-02, CNC-01 contain "-NN" - strip them so "-02"
    # is not treated as the number -2.
    text = _MACHINE_TOKEN_RE.sub(lambda m: m.group().split("-")[0], text)
    return [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", _mask_dates(text))]


def _facts_date_parts(facts_block):
    """Day/month/year fragments present in the facts' first/last record dates."""
    dates = _DATE_RE.findall(facts_block)
    days, months, years = set(), set(), set()
    for d in dates:
        y, m, day = d.split("-")
        years.add(int(y))
        months.add(int(m))
        days.add(int(day))
    return days, months, years


_FACT_PREFIX_RE = re.compile(r"^FACT\s+\d+:\s*")


def _fact_lines(facts_block):
    """FACT lines with the 'FACT N:' index stripped (so the index digit is not
    mistaken for a data number)."""
    return [_FACT_PREFIX_RE.sub("", l) for l in facts_block.splitlines() if l.startswith("FACT")]


def _fact_tokens(facts_block):
    """Non-numeric labels (machine names, shifts, reasons...) from FACT lines."""
    tokens = set()
    for line in _fact_lines(facts_block):
        for t in re.findall(r"[A-Za-z][A-Za-z0-9-]*", line):
            if len(t) >= 2 and t.lower() not in {"fact", "result", "answer"}:
                tokens.add(t.lower())
    return tokens


def verify_answer(facts_block, answer):
    """
    Anti-hallucination check (only FACT lines count - the meta block is ignored):
    - every number in the answer must already exist in the facts (tolerance 0.05)
    - if the facts contain numbers, the answer must use at least one of them
    - if the facts are string-only (e.g. a machine/shift name), the answer must
      mention at least one of those fact labels.
    Returns (ok, problems).
    """
    if not answer or not answer.strip():
        return False, ["empty answer"]

    facts_text = "\n".join(_fact_lines(facts_block))
    fact_nums = _extract_numbers(facts_text)
    ans_nums = _extract_numbers(answer)
    problems = []

    days, months, years = _facts_date_parts(facts_block)
    for a in ans_nums:
        matched = any(abs(a - f) <= 0.05 for f in fact_nums)
        if not matched:
            a_int = int(round(a))
            if a == float(a_int) and (a_int in days or a_int in months or a_int in years):
                matched = True
        if not matched:
            problems.append(f"number {a:g} not found in facts")

    if fact_nums:
        used_fact = any(abs(a - f) <= 0.05 for a in ans_nums for f in fact_nums)
        if not used_fact:
            problems.append("answer uses none of the fact numbers")
    else:
        # String-only facts: answer must echo at least one fact label.
        tokens = _fact_tokens(facts_block)
        low = answer.lower()
        if not any(t in low for t in tokens):
            problems.append(f"answer mentions none of the fact labels {sorted(tokens)}")
    return (len(problems) == 0), problems


def fallback_answer(facts_block, query):
    facts = [l for l in facts_block.splitlines() if l.startswith("FACT")]
    if not facts:
        return "Bhai, main is sawal ka jawab dataset se nikal nahi paya."
    body = "; ".join(
        l.split(": ", 1)[1] if ": " in l else l for l in facts
    )
    return f"Bhai, data se exact jawab ye hai: {body}."
