import {spawn} from 'node:child_process';
import path from 'node:path';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';

const root = process.cwd();
const repoRoot = path.resolve(root, '..');

function resolveShowdownRoot() {
  if (process.env.SHOWDOWN_ROOT) return process.env.SHOWDOWN_ROOT;
  const candidates = ['DH2', 'pokemon-showdown'];
  for (const candidate of candidates) {
    const base = path.join(repoRoot, candidate);
    if (existsSync(path.join(base, 'pokemon-showdown'))) return candidate;
  }
  return 'pokemon-showdown';
}

function ensureShowdownConfigExample(showdownPath) {
  const configDir = path.join(showdownPath, 'config');
  const configExamplePath = path.join(configDir, 'config-example.js');
  if (existsSync(configExamplePath)) return;
  mkdirSync(configDir, {recursive: true});
  writeFileSync(configExamplePath, `'use strict';\n\nexports.Config = {};\n`);
}

function run(name, cmd, args, cwd) {
  const p = spawn(cmd, args, {cwd, stdio: 'inherit'});
  p.on('exit', (code) => {
    if (code !== 0) console.error(`${name} exited with code ${code}`);
  });
  return p;
}

const showdownRoot = resolveShowdownRoot();
const showdownPath = path.join(repoRoot, showdownRoot);
ensureShowdownConfigExample(showdownPath);

const api = run('poko-api', 'node', ['src/server/app.js'], root);
const showdown = run('showdown', 'node', ['pokemon-showdown', 'start', '--no-security', '--port', process.env.SHOWDOWN_PORT || '8000'], showdownPath);

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
console.log(`- Showdown root: ${showdownRoot}`);
