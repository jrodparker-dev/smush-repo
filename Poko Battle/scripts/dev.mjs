import {spawn} from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const repoRoot = path.resolve(root, '..');

function run(name, cmd, args, cwd) {
  const p = spawn(cmd, args, {cwd, stdio: 'inherit'});
  p.on('exit', (code) => {
    if (code !== 0) console.error(`${name} exited with code ${code}`);
  });
  return p;
}

const api = run('poko-api', 'node', ['src/server/app.js'], root);
const showdown = run('showdown', 'node', ['pokemon-showdown', 'start', '--no-security'], path.join(repoRoot, process.env.SHOWDOWN_ROOT || 'DH2'));

function shutdown() {
  api.kill('SIGTERM');
  showdown.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('Poko Battle dev stack started:');
console.log('- API: http://localhost:4080');
console.log('- Showdown battle server: http://localhost:8000');
