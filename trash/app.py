"""
AI Factory Copilot - Flask backend
Run: python app.py
Requires: pip install flask pandas google-generativeai

Set your Gemini API key as an environment variable before running:
  export GEMINI_API_KEY="your-key-here"      (Mac/Linux)
  set GEMINI_API_KEY=your-key-here           (Windows cmd)

Get a free API key at: https://aistudio.google.com/apikey
"""

import os
from flask import Flask, request, jsonify, send_from_directory
import google.generativeai as genai
from data_engine import load_data, build_context, build_prompt

app = Flask(__name__)

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("WARNING: GEMINI_API_KEY not set. Set it before chatting.")
else:
    genai.configure(api_key=API_KEY)

model = genai.GenerativeModel("gemini-3.5-flash-lite") if API_KEY else None

# Load data once at startup
df = load_data()


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/chat", methods=["POST"])
def chat():
    body = request.get_json(force=True)
    query = body.get("query", "").strip()

    if not query:
        return jsonify({"error": "empty query"}), 400
    if not model:
        return jsonify({"error": "GEMINI_API_KEY not configured on server"}), 500

    try:
        context = build_context(df, query)
        prompt = build_prompt(query, context)
        response = model.generate_content(prompt)
        return jsonify({
            "answer": response.text,
            "context_used": context,  # useful for debugging/demo transparency
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/kpi-summary", methods=["GET"])
def kpi_summary():
    """Bonus feature: one-click daily KPI insight generation."""
    if not model:
        return jsonify({"error": "GEMINI_API_KEY not configured on server"}), 500
    try:
        context = build_context(df, "today's overall factory performance summary")
        prompt = build_prompt(
            "Generate a short daily KPI insight report covering OEE, downtime, "
            "and scrap trends. Highlight the single biggest concern.",
            context,
        )
        response = model.generate_content(prompt)
        return jsonify({"summary": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)