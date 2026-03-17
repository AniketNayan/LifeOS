import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';

const frontend = spawn('npm run dev:frontend', {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true,
});

const backend = spawn('npm run dev:backend', {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true,
});

const shutdown = () => {
  if (!frontend.killed) {
    frontend.kill(isWindows ? 'SIGTERM' : 'SIGINT');
  }
  if (!backend.killed) {
    backend.kill(isWindows ? 'SIGTERM' : 'SIGINT');
  }
};

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

frontend.on('exit', (code) => {
  if (code && code !== 0) {
    shutdown();
    process.exit(code);
  }
});

backend.on('exit', (code) => {
  if (code && code !== 0) {
    shutdown();
    process.exit(code);
  }
});
