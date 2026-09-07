import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));
const apiUrl = 'http://127.0.0.1:3001/api/v1';
const environment = {
  ...process.env,
  API_BASE_URL: apiUrl,
  NEXT_PUBLIC_API_BASE_URL: apiUrl,
};
const web = startPnpm([
  '--filter',
  '@devsure/web',
  'dev',
  '--hostname',
  '127.0.0.1',
  '--port',
  '3000',
]);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => web.kill(signal));
}

web.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

function startPnpm(args) {
  const pnpmCli = process.env.npm_execpath;
  let command;
  let commandArgs;

  if (pnpmCli) {
    command = process.execPath;
    commandArgs = [pnpmCli, ...args];
  } else if (process.platform === 'win32') {
    command = process.env.ComSpec ?? process.env.COMSPEC ?? 'cmd.exe';
    commandArgs = ['/d', '/s', '/c', 'pnpm.cmd', ...args];
  } else {
    command = 'pnpm';
    commandArgs = args;
  }

  return spawn(command, commandArgs, {
    cwd: workspaceRoot,
    env: environment,
    stdio: 'inherit',
  });
}
