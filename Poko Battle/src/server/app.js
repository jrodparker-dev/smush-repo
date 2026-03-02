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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
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
  if (req.method === 'GET' && req.url === '/health') return json(res, 200, {ok: true});

  if (req.method === 'GET' && req.url === '/api/teams') return json(res, 200, teams.list());

  if (req.method === 'GET' && req.url?.startsWith('/api/teams/')) {
    const id = req.url.split('/')[3];
    const team = teams.get(id);
    return team ? json(res, 200, team) : json(res, 404, {error: 'Team not found'});
  }

  if (req.method === 'POST' && req.url === '/api/teams') {
    const body = await readJsonBody(req).catch((e) => json(res, 400, {error: e.message}));
    if (!body || res.writableEnded) return;

    const result = await teams.save({...body, id: randomUUID()});
    if (!result.ok) return json(res, 400, {errors: result.errors});
    return json(res, 201, result.team);
  }

  if (req.method === 'POST' && req.url === '/battle/create') {
    const body = await readJsonBody(req).catch((e) => json(res, 400, {error: e.message}));
    if (!body || res.writableEnded) return;

    const p1Team = teams.get(body.p1TeamId);
    const p2Team = teams.get(body.p2TeamId);
    if (!p1Team || !p2Team) return json(res, 400, {error: 'Both p1TeamId and p2TeamId are required'});

    const battle = engine.createBattle({
      battleId: `pb-${randomUUID()}`,
      format: 'gen9customgame',
      p1: {id: 'p1', name: body.p1Name || 'Player 1', team: p1Team},
      p2: {id: 'p2', name: body.p2Name || 'Player 2', team: p2Team},
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
    const battle = engine.getSnapshot(battleId);
    return battle ? json(res, 200, battle) : json(res, 404, {error: 'Battle not found'});
  }

  return json(res, 404, {error: 'Not found'});
});

const port = Number(process.env.PORT || 4080);
server.listen(port, () => console.log(`Poko API on http://localhost:${port}`));
