import http from 'node:http';
import {randomUUID} from 'node:crypto';

import {EngineBridge} from '../brain/engineBridge.js';
import {TeamBuilderService} from './teamBuilder.js';

const engine = new EngineBridge();
const teams = new TeamBuilderService();

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  return json(res, 404, {error: 'Not found'});
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, {ok: true, service: 'poko-battle'});
  }

  if (req.method === 'POST' && req.url === '/battle/create') {
    const body = await readJsonBody(req).catch((error) => json(res, 400, {error: error.message}));
    if (!body || res.writableEnded) return;

    const battleId = `pb-${randomUUID()}`;
    const battle = engine.createBattle({
      battleId,
      format: body.format || 'gen9ou',
      p1: body.p1 || {id: 'p1', name: 'Player 1'},
      p2: body.p2 || {id: 'p2', name: 'Player 2'},
    });
    return json(res, 201, battle);
  }

  if (req.method === 'POST' && req.url?.startsWith('/battle/') && req.url.endsWith('/action')) {
    const battleId = req.url.split('/')[2];
    const body = await readJsonBody(req).catch((e) => json(res, 400, {error: e.message}));
    if (!body || res.writableEnded) return;

    try {
      const update = engine.applyAction({battleId, actor: body.actor, action: body.action});
      return json(res, 200, update);
    } catch (error) {
      return json(res, 404, {error: error.message});
    }
  }

  if (req.method === 'GET' && req.url?.startsWith('/battle/')) {
    const battleId = req.url.split('/')[2];
    const snapshot = engine.getSnapshot(battleId);
    if (!snapshot) return json(res, 404, {error: `Unknown battle: ${battleId}`});
    return json(res, 200, snapshot);
  }

  return notFound(res);
});

const port = Number(process.env.PORT || 4080);
server.listen(port, () => {
  console.log(`Poko Battle API listening on http://localhost:${port}`);
});
