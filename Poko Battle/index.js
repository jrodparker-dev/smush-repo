import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const child = spawn('node', ['scripts/dev.mjs'], {cwd: dir, stdio: 'inherit'});
child.on('exit', (code) => process.exit(code ?? 0));
