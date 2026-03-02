import {spawn} from 'node:child_process';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '..');
const showdownBin = path.join(repoRoot, process.env.SHOWDOWN_ROOT || 'DH2', 'pokemon-showdown');

function runShowdown(args, stdin = '') {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [showdownBin, ...args], {
      cwd: path.join(repoRoot, process.env.SHOWDOWN_ROOT || 'DH2'),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) return resolve({stdout: stdout.trim(), stderr: stderr.trim(), code});
      reject(new Error(stderr.trim() || `Showdown command failed with code ${code}`));
    });

    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });
}

export async function validatePackedTeam(packed, format = 'gen9customgame') {
  try {
    await runShowdown(['validate-team', format], packed);
    return {valid: true, errors: []};
  } catch (error) {
    return {valid: false, errors: String(error.message).split('\n').filter(Boolean)};
  }
}

export async function packTeamFromJson(teamJson) {
  const input = `${JSON.stringify(teamJson, null, 2)}\n`;
  const {stdout} = await runShowdown(['pack-team'], input);
  return stdout;
}
