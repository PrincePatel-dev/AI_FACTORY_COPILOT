# 🏭 MFGX AI Factory Copilot

MFGX AI Factory Copilot is an industry-grade, full-stack manufacturing assistant powered by AI. It provides real-time telemetry analytics, dynamic shift comparisons, and a natural language chat interface to interact directly with factory floor data.

Managers and operators can ask complex questions about downtime, scrap units, Overall Equipment Effectiveness (OEE), and get precise, data-driven answers computed securely in a Python sandbox.

## ✨ Features

- **📊 Dynamic Telemetry Dashboard:** Visualizes machine performance, OEE trends, and shift comparisons.
- **💬 AI Copilot Chat:** Ask natural language questions (supports English, Hinglish, and Gujlish) to analyze factory data.
- **🛡️ Secure Python Sandbox:** The AI dynamically generates and executes Pandas/Python code in an isolated OS process to compute complex statistical answers (e.g., correlations, standard deviations) without hallucinating numbers.
- **🏭 Deep Dive Analytics:** Discover bottlenecks, worst-performing machines, and top downtime/scrap reasons.
- **📱 Split View Mode:** Analyze charts and chat with the AI side-by-side.

## 🛠️ Technology Stack

- **Frontend:** React, Vite, Recharts, Lucide Icons, Vanilla CSS (Glassmorphic dark theme)
- **Backend:** Python, Flask, Pandas, multiprocessing
- **AI Model:** Google Gemini (gemini-3.1-flash-lite)

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python 3](https://www.python.org/) (v3.9+)
- A Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/mfgx-ai-factory-copilot.git
   cd mfgx-ai-factory-copilot
   ```

2. **Backend Setup:**
   ```bash
   # Create and activate a virtual environment
   python -m venv venv
   
   # Windows
   .\venv\Scripts\activate
   # Mac/Linux
   source venv/bin/activate

   # Install dependencies
   pip install -r backend/requirements.txt
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Environment Variables:**
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

### Running the Application

You can start both the Flask backend and Vite frontend simultaneously using the provided Node script:

```bash
npm run dev
```

- Frontend will be available at: `http://localhost:3005`
- Backend API will be available at: `http://127.0.0.1:5000`

## 🔒 Security Note
This project implements an AST-validated Secure Process Sandbox for executing AI-generated Python code. It ensures that the AI cannot access the system file system, execute malicious commands, or cause memory leaks.

## 📄 License
This project is licensed under the MIT License.
