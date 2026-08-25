import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));
const databasePath = join(workspaceRoot, 'apps', 'api', '.data', 'playwright.sqlite');
const environment = {
  ...process.env,
  NODE_ENV: 'test',
  API_PORT: '3001',
  API_PREFIX: 'api/v1',
  CORS_ORIGINS: 'http://127.0.0.1:3000',
  DATABASE_TYPE: 'sqlite',
  DATABASE_URL: databasePath,
  DATABASE_LOGGING: 'false',
  SWAGGER_ENABLED: 'false',
  BODY_LIMIT: '1mb',
};

await mkdir(dirname(databasePath), { recursive: true });
await Promise.all(
  [databasePath, `${databasePath}-shm`, `${databasePath}-wal`].map((file) =>
    rm(file, { force: true }),
  ),
);
await runPnpm(['--filter', '@devsure/api', 'seed:technologies']);
await runPnpm(['--filter', '@devsure/api', 'build']);

const api = startPnpm(['--filter', '@devsure/api', 'start']);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => api.kill(signal));
}

api.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

function runPnpm(args) {
  return new Promise((resolve, reject) => {
    const child = startPnpm(args);
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`pnpm ${args.join(' ')} failed with exit code ${code}`));
    });
  });
}

function startPnpm(args) {
  const pnpmCli = process.env.npm_execpath;
  const command = pnpmCli ? process.execPath : process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const commandArgs = pnpmCli ? [pnpmCli, ...args] : args;

  return spawn(command, commandArgs, {
    cwd: workspaceRoot,
    env: environment,
    stdio: 'inherit',
  });
}
