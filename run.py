import subprocess
import os
import sys
import signal

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    
    python_exe = os.path.join(root_dir, "venv", "Scripts", "python.exe") if os.name == 'nt' else os.path.join(root_dir, "venv", "bin", "python")
    
    print("=======================================================")
    print(" 🏭 Starting MFGX AI Factory Copilot (Full Stack)...  ")
    print("=======================================================")
    
    print("[1/2] Starting Flask Backend on http://127.0.0.1:5000 ...")
    backend_proc = subprocess.Popen([python_exe, "backend/app.py"], cwd=root_dir)
    
    print("[2/2] Starting Vite Frontend on http://localhost:3000 ...")
    npm_cmd = "npm.cmd" if os.name == 'nt' else "npm"
    frontend_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=frontend_dir)
    
    def shutdown(sig, frame):
        print("\nStopping services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        sys.exit(0)
        
    signal.signal(signal.SIGINT, shutdown)
    
    backend_proc.wait()
    frontend_proc.wait()

if __name__ == '__main__':
    main()
