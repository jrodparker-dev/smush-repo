import http from 'node:http';
import {randomUUID} from 'node:crypto';

import {EngineBridge} from '../brain/engineBridge.js';
import {TeamBuilderService} from './teamBuilder.js';

const engine = new EngineBridge();
const teams = new TeamBuilderService();

const showdownUrl = process.env.SHOWDOWN_URL || 'http://localhost:8000';
const smokeStatus = {
  status: 'never',
  updatedAt: null,
  details: 'Smoke test has not reported yet.',
};

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(payload));
}

function html(res, statusCode, body) {
  res.writeHead(statusCode, {'Content-Type': 'text/html; charset=utf-8'});
  res.end(body);
}

function notFound(res) {
  return json(res, 404, {error: 'Not found'});
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error('Request body too large'));
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

async function checkShowdownReachable() {
  try {
    const res = await fetch(showdownUrl, {redirect: 'manual'});
    return {ok: res.ok || res.status === 301 || res.status === 302, status: res.status};
  } catch (error) {
    return {ok: false, error: error.message};
  }
}

async function getSystemHealth() {
  const showdown = await checkShowdownReachable();
  const engineReady = await engine.checkReady();
  const ok = showdown.ok && engineReady.ok;
  return {
    ok,
    service: 'poko-battle',
    api: {ok: true},
    showdown,
    engine: engineReady,
  };
}

async function buildPlayer(bodyPlayer, fallbackName, fallbackTeamId, slotId) {
  const player = bodyPlayer || {};
  const name = player.name || fallbackName;
  if (player.team?.packed) {
    return {id: player.id || slotId, name, team: {packed: player.team.packed}};
  }
  const teamId = player.teamId || fallbackTeamId;
  if (!teamId) throw new Error(`Missing ${slotId} team data (provide ${slotId}TeamId or ${slotId}.team.packed)`);
  const stored = teams.get(teamId);
  if (!stored) throw new Error(`Unknown team id: ${teamId}`);
  return {id: player.id || slotId, name, team: {packed: stored.packed}};
}

function renderHome(health) {
  const readiness = health.ok ? 'Ready' : 'Not ready';
  const smoke = `${smokeStatus.status}${smokeStatus.updatedAt ? ` @ ${smokeStatus.updatedAt}` : ''}`;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Poko Battle</title>
    <style>body{font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;line-height:1.4;padding:0 1rem}code{background:#f1f1f1;padding:0.1rem 0.3rem;border-radius:4px}</style>
  </head>
  <body>
    <h1>Poko Battle</h1>
    <p>API status: <strong>${readiness}</strong></p>
    <ul>
      <li><a href="/health">API health JSON</a></li>
      <li><a href="/smoke">Smoke test status</a></li>
      <li><a href="${showdownUrl}">Showdown server (:8000)</a></li>
      <li><a href="https://play.pokemonshowdown.com/?server=localhost:8000">Official client (manual connect)</a></li>
    </ul>
    <pre>${JSON.stringify({showdown: health.showdown, engine: health.engine, smoke: smokeStatus}, null, 2)}</pre>
    <p>Last smoke result: <code>${smoke}</code></p>
  </body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    const health = await getSystemHealth();
    return html(res, health.ok ? 200 : 503, renderHome(health));
  }

  if (req.method === 'GET' && req.url === '/health') {
    const health = await getSystemHealth();
    return json(res, health.ok ? 200 : 503, health);
  }

  if (req.method === 'GET' && req.url === '/smoke') {
    return json(res, 200, smokeStatus);
  }

  if (req.method === 'POST' && req.url === '/smoke/result') {
    const body = await readJsonBody(req).catch((error) => json(res, 400, {error: error.message}));
    if (!body || res.writableEnded) return;
    smokeStatus.status = body.status || 'unknown';
    smokeStatus.updatedAt = new Date().toISOString();
    smokeStatus.details = body.details || '';
    return json(res, 200, {ok: true, smokeStatus});
  }

  if (req.method === 'POST' && req.url === '/api/teams') {
    const body = await readJsonBody(req).catch((error) => json(res, 400, {error: error.message}));
    if (!body || res.writableEnded) return;
    const saveResult = await teams.save({id: randomUUID(), ...body});
    if (!saveResult.ok) return json(res, 400, saveResult);
    return json(res, 201, saveResult.team);
  }

  if (req.method === 'GET' && req.url === '/api/teams') {
    return json(res, 200, {teams: teams.list()});
  }

  if (req.method === 'POST' && req.url === '/battle/create') {
    const body = await readJsonBody(req).catch((error) => json(res, 400, {error: error.message}));
    if (!body || res.writableEnded) return;

    try {
      const p1 = await buildPlayer(body.p1, body.p1Name || 'Player 1', body.p1TeamId, 'p1');
      const p2 = await buildPlayer(body.p2, body.p2Name || 'Player 2', body.p2TeamId, 'p2');
      const battle = engine.createBattle({
        battleId: `pb-${randomUUID()}`,
        format: body.format || 'gen9ou',
        p1,
        p2,
      });
      return json(res, 201, battle);
    } catch (error) {
      return json(res, 400, {error: error.message});
    }
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
