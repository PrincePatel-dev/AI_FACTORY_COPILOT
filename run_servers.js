import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("\x1b[36m%s\x1b[0m", "=======================================================");
console.log("\x1b[36m%s\x1b[0m", " 🏭 Starting MFGX AI Factory Copilot (Full Stack)...  ");
console.log("\x1b[36m%s\x1b[0m", "=======================================================");

// 1. Start Python Flask Backend on Port 5000
const pythonExe = process.platform === 'win32' 
  ? path.join(__dirname, 'venv', 'Scripts', 'python.exe')
  : path.join(__dirname, 'venv', 'bin', 'python');

console.log("\x1b[33m%s\x1b[0m", "[Backend] Launching Flask API on http://127.0.0.1:5000 ...");
const backend = spawn(pythonExe, ['backend/app.py'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// 2. Start Vite Frontend Dev Server on Port 3005
console.log("\x1b[32m%s\x1b[0m", "[Frontend] Launching Vite on http://localhost:3005 ...");
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

// Handle termination
const cleanup = () => {
  console.log("\nStopping all services...");
  if (process.platform === 'win32') {
    import('child_process').then(({ spawn }) => {
      spawn('taskkill', ['/pid', backend.pid, '/f', '/t']);
      spawn('taskkill', ['/pid', frontend.pid, '/f', '/t']);
    });
  } else {
    backend.kill();
    frontend.kill();
  }
  setTimeout(() => process.exit(), 500);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
