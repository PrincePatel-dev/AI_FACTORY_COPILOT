"""
AI Factory Copilot - Flask backend (v2 pipeline)
Run: python app_v2.py
Requires: pip install flask pandas google-genai

Set your Gemini API key before running:
  set GEMINI_API_KEY=your-key-here     (Windows cmd)
Optional: GEMINI_MODEL to pick a model (default: gemini-3.5-flash-lite)

v2 pipeline: LLM compiles the question into a pandas expression -> sandboxed
execution on the real data -> numbers verified -> LLM only phrases the result.
"""

import os

from flask import Flask, request, jsonify, send_from_directory
from google import genai

from data_engine_v2 import (
    load_data,
    compile_query,
    execute_compiled,
    build_facts_block,
    build_phrase_prompt,
    verify_answer,
    fallback_answer,
    generate_with_retry,
)

app = Flask(__name__)

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY and os.path.exists(".env"):
    # Tiny fallback so the repo's .env is honored without extra deps.
    with open(".env", "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line.startswith("GEMINI_API_KEY="):
                API_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")
                break

MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")

client = genai.Client(api_key=API_KEY) if API_KEY else None

df = load_data()

FALLBACK_MSG = (
    "Bhai, main is sawal ko dataset se clearly samajh nahi paya. "
    "Thoda alag tarike se poochhein."
)


def _is_empty(result):
    if isinstance(result, (list, dict)):
        return len(result) == 0
    if hasattr(result, "__len__"):
        return len(result) == 0
    return False


def run_pipeline(query):
    """compile -> execute -> facts -> phrase -> verify. Returns (answer, debug)."""
    feedback = ""
    parsed = None
    last_err = None
    for attempt in range(2):
        try:
            parsed = compile_query(query, client, MODEL_NAME, df, feedback=feedback)
            result = execute_compiled(df, parsed["code"])
            if _is_empty(result):
                raise ValueError("query returned an empty result (check dates/filters)")
            break
        except Exception as e:
            last_err = e
            feedback = f"Previous attempt failed with: {e}. Fix the code."

    if parsed is None:
        raise ValueError(f"Could not compile question: {last_err}")

    facts_block = build_facts_block(df, query, result, parsed["question_type"], parsed.get("summary", ""))
    prompt = build_phrase_prompt(query, facts_block)
    resp = generate_with_retry(client, MODEL_NAME, prompt)
    answer = (resp.text or "").strip()

    ok, problems = verify_answer(facts_block, answer)
    if not ok:
        answer = fallback_answer(facts_block, query)

    return answer, {
        "code": parsed["code"],
        "question_type": parsed["question_type"],
        "facts": facts_block,
        "verified": ok,
        "verify_problems": problems if not ok else None,
    }


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/chat", methods=["POST"])
def chat():
    body = request.get_json(force=True)
    query = body.get("query", "").strip()
    if not query:
        return jsonify({"error": "empty query"}), 400
    if not client:
        return jsonify({"error": "GEMINI_API_KEY not configured on server"}), 500

    try:
        answer, debug = run_pipeline(query)
        return jsonify({
            "answer": answer,
            "context_used": debug["facts"],
            "verified": debug["verified"],
            "code": debug["code"],
        })
    except Exception as e:
        return jsonify({
            "answer": FALLBACK_MSG,
            "error": str(e),
        }), 200


@app.route("/kpi-summary", methods=["GET"])
def kpi_summary():
    if not client:
        return jsonify({"error": "GEMINI_API_KEY not configured on server"}), 500
    try:
        answer, _ = run_pipeline(
            "Today's overall factory performance summary: average OEE, "
            "the machine with the biggest average downtime, and the top scrap reason."
        )
        return jsonify({"summary": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print(f"Model: {MODEL_NAME} | dataset rows: {len(df)}")
    app.run(debug=True, port=5001)
