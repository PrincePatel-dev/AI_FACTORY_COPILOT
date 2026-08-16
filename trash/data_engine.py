"""
Core logic for AI Factory Copilot.
Loads the factory CSV, figures out what the user is asking about,
and builds a SMALL, relevant context block to send to the LLM
(instead of dumping the whole 1350-row CSV every time).
"""

import difflib
import pandas as pd
from datetime import timedelta

DATA_PATH = "factory_data.csv"


def load_data():
    df = pd.read_csv(DATA_PATH)
    df["date"] = pd.to_datetime(df["date"])
    return df


def get_known_machines(df):
    return sorted(df["machine_id"].unique().tolist())


def _find_machine(query_lower, machines):
    """Exact substring match first, then fuzzy match to tolerate typos
    like 'wield-02' -> 'Weld-02'."""
    cleaned_query = query_lower.replace("-", "").replace(" ", "")

    # 1. exact substring match (fast path)
    for m in machines:
        if m.lower().replace("-", "") in cleaned_query:
            return m

    # 2. fuzzy match against each word/token in the query (handles typos)
    tokens = query_lower.replace("-", " ").split()
    machine_keys = {m.lower().replace("-", ""): m for m in machines}
    for i in range(len(tokens)):
        for span in (tokens[i], "".join(tokens[i:i + 2])):
            match = difflib.get_close_matches(span, machine_keys.keys(), n=1, cutoff=0.7)
            if match:
                return machine_keys[match[0]]
    return None


def _find_shifts(query_lower):
    """Return ALL shift names mentioned (not just the first) so comparison
    queries like 'night vs morning' keep both sides."""
    found = []
    for s in ["morning", "afternoon", "night"]:
        if s in query_lower:
            found.append(s.capitalize())
    return found


def build_context(df, query):
    """
    Smart-ish filtering:
    1. If query mentions a specific machine (even with a typo) -> filter to it
    2. If query mentions a specific date range -> filter to it
    3. If query mentions ONE shift -> filter to that shift
       If query mentions TWO+ shifts (comparison) -> build a per-shift comparison table instead
    4. Otherwise -> return an aggregated summary per machine (small, covers broad questions)
    """
    query_lower = query.lower()
    machines = get_known_machines(df)
    filtered = df.copy()

    matched_machine = _find_machine(query_lower, machines)
    matched_shifts = _find_shifts(query_lower)

    # Date handling: keep it simple - "today", "yesterday", "this week", "last week"
    max_date = df["date"].max()
    if "yesterday" in query_lower:
        filtered = filtered[filtered["date"] == max_date - timedelta(days=1)]
    elif "today" in query_lower:
        filtered = filtered[filtered["date"] == max_date]
    elif "this week" in query_lower:
        filtered = filtered[filtered["date"] >= max_date - timedelta(days=7)]
    elif "last week" in query_lower:
        filtered = filtered[
            (filtered["date"] >= max_date - timedelta(days=14))
            & (filtered["date"] < max_date - timedelta(days=7))
        ]
    elif "month" in query_lower:
        filtered = filtered[filtered["date"] >= max_date - timedelta(days=30)]
    else:
        # default window if nothing specified: last 14 days (keeps context small)
        filtered = filtered[filtered["date"] >= max_date - timedelta(days=14)]

    if matched_machine:
        filtered = filtered[filtered["machine_id"] == matched_machine]

    total_rows = len(df)

    # --- Comparison queries: two or more shifts mentioned ---
    if len(matched_shifts) >= 2:
        cmp_df = filtered[filtered["shift"].isin(matched_shifts)]
        summary = (
            cmp_df.groupby("shift")
            .agg(
                avg_downtime_min=("downtime_min", "mean"),
                total_downtime_min=("downtime_min", "sum"),
                avg_oee_percent=("oee_percent", "mean"),
                total_scrap_units=("scrap_units", "sum"),
                total_units_produced=("units_produced", "sum"),
            )
            .round(1)
            .reset_index()
        )
        meta = f"TOTAL_RECORDS_IN_SYSTEM: {total_rows}\nRECORDS_USED_FOR_THIS_ANSWER: {len(cmp_df)}\n\n"
        return meta + "SHIFT COMPARISON (filtered period):\n" + summary.to_string(index=False)

    # --- Single shift mentioned: filter to it ---
    if len(matched_shifts) == 1:
        filtered = filtered[filtered["shift"] == matched_shifts[0]]

    # If after filtering we still have a lot of rows (broad question),
    # send an AGGREGATED summary instead of raw rows.
    if len(filtered) > 40 and matched_machine is None:
        summary = (
            filtered.groupby("machine_id")
            .agg(
                avg_downtime_min=("downtime_min", "mean"),
                total_downtime_min=("downtime_min", "sum"),
                avg_oee_percent=("oee_percent", "mean"),
                total_scrap_units=("scrap_units", "sum"),
                total_units_produced=("units_produced", "sum"),
            )
            .round(1)
            .sort_values("avg_downtime_min", ascending=False)
            .reset_index()
        )
        top_reasons = (
            filtered.groupby("downtime_reason")["downtime_min"]
            .sum()
            .sort_values(ascending=False)
            .head(5)
        )
        top_scrap_reasons = (
            filtered[filtered["scrap_reason"] != "None"]
            .groupby(["machine_id", "scrap_reason"])["scrap_units"]
            .sum()
            .sort_values(ascending=False)
            .head(8)
        )
        context = f"TOTAL_RECORDS_IN_SYSTEM: {total_rows}\nRECORDS_USED_FOR_THIS_ANSWER: {len(filtered)}\n\n"
        context += "AGGREGATED SUMMARY (per machine, filtered period):\n"
        context += summary.to_string(index=False)
        context += "\n\nTOP DOWNTIME REASONS (filtered period):\n"
        context += top_reasons.to_string()
        context += "\n\nTOP SCRAP REASONS BY MACHINE (filtered period):\n"
        context += top_scrap_reasons.to_string()
        return context
    else:
        # small enough -> send raw filtered rows
        cols = [
            "date", "shift", "machine_id", "downtime_min", "downtime_reason",
            "units_produced", "scrap_units", "scrap_reason", "oee_percent",
        ]
        meta = f"TOTAL_RECORDS_IN_SYSTEM: {total_rows}\nRECORDS_USED_FOR_THIS_ANSWER: {len(filtered)}\n\n"
        return meta + "RAW RECORDS (filtered):\n" + filtered[cols].to_string(index=False)


def build_prompt(query, context):
    return f"""You are an AI Factory Copilot. You talk to a busy factory floor
manager who is NOT a data person. Follow these rules strictly:

1. LANGUAGE: Reply in the exact same language / script / mix the user used
   in their question. Examples:
   - If they wrote in Hindi written in English letters (Hinglish), like
     "kitne rows hai?", you reply in that same Hinglish style.
   - If they wrote in Gujarati, you reply in Gujarati.
   - If they wrote in plain English, reply in plain English.
   Never default to plain English just because it feels "safer" - match
   whatever the user actually typed.

2. TONE: Write like a helpful colleague speaking out loud, not a report.
   - No tables, no column names (like machine_id or oee_percent), no code
     formatting, no bullet-point data dumps.
   - Turn numbers into a natural sentence. Example: instead of
     "avg_downtime_min: 71.4", say "Weld-02 is down for about 71 minutes
     on average."
   - Keep it to 2-3 short sentences. A manager should understand it in one
     read, standing on the factory floor.

3. ACCURACY for record-count questions: if the user is asking how many
   total records/rows/entries exist in the system, use ONLY the number
   labeled TOTAL_RECORDS_IN_SYSTEM below - never the RECORDS_USED_FOR_THIS_ANSWER
   number for that specific question, and never guess it from row counts
   inside a table.

4. If the data below truly does not cover the question, say so simply, in
   the same language as the question - don't make something up.

DATA (internal - do not repeat this raw data or its labels back to the user):
{context}

USER'S QUESTION: {query}

Now reply directly to the manager, following all rules above:"""