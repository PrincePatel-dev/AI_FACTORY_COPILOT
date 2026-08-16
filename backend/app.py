import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.data_service import FactoryDataService
from backend.query_parser import QueryParser
from backend.llm_service import LLMService

app = Flask(__name__)
CORS(app)

CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "factory_data.csv")
data_service = FactoryDataService(CSV_PATH)
llm_service = LLMService(data_service)

@app.route('/api/health', methods=['GET'])
def health():
    meta = data_service.get_dataset_metadata()
    return jsonify({
        "status": "online",
        "dataset_rows": meta["total_rows"],
        "dataset_columns": meta["total_columns"],
        "columns": meta["columns"],
        "machines_tracked": meta["total_machines"],
        "date_range": meta["date_range"]
    })

@app.route('/api/export-csv', methods=['GET'])
def export_csv():
    timeframe = request.args.get('timeframe', 'all')
    start_d, end_d = data_service.parse_timeframe(timeframe)
    filtered_df = data_service.filter_data(start_date=start_d, end_date=end_d)
    
    csv_data = filtered_df.to_csv(index=False)
    return (
        csv_data,
        200,
        {
            'Content-Type': 'text/csv',
            'Content-Disposition': f'attachment; filename=factory_telemetry_{timeframe}.csv'
        }
    )

@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    timeframe = request.args.get('timeframe', 'this week')
    kpi = data_service.get_kpi_overview(timeframe=timeframe)
    summary = data_service.get_aggregated_summary(timeframe=timeframe)
    shift_comp = data_service.get_shift_comparison(timeframe=timeframe)
    trend = data_service.get_trend_series(timeframe=timeframe)
    meta = data_service.get_dataset_metadata()
    
    return jsonify({
        "kpi_overview": kpi,
        "machine_summaries": summary,
        "shift_comparison": shift_comp,
        "trend_series": trend,
        "dataset_metadata": meta
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json or {}
    query = data.get('message', '').strip()

    if not query:
        return jsonify({"error": "Message is required"}), 400

    parsed_meta = QueryParser.parse(query)

    answer, model_used = llm_service.generate_response(query, parsed_meta, context_data=None)

    return jsonify({
        "query": query,
        "answer": answer,
        "parsed_metadata": parsed_meta,
        "model_used": model_used
    })

@app.route('/api/kpi-insight', methods=['POST'])
def generate_kpi_insight():
    data = request.json or {}
    timeframe = data.get('timeframe', 'this week')

    kpi = data_service.get_kpi_overview(timeframe=timeframe)

    parsed_meta = {
        "intent": "kpi_insight",
        "timeframe": timeframe,
        "language": data.get('language', 'english')
    }

    prompt = (
        f"Generate a comprehensive daily KPI insight report for the timeframe "
        f"'{timeframe}', covering plant OEE, downtime, and scrap trends, and "
        f"identifying the single biggest operational concern. Use your tools "
        f"to fetch the real KPI overview, per-machine summary, and shift "
        f"comparison for this timeframe before writing the report."
    )

    report, _ = llm_service.generate_response(prompt, parsed_meta, context_data=None)

    return jsonify({
        "report": report,
        "timeframe": timeframe,
        "kpi_highlights": kpi
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting MFGX Factory Copilot API on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)