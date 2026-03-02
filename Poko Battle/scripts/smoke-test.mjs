const base = process.env.POKO_BASE_URL || 'http://localhost:4080';
const timeoutMs = Number(process.env.POKO_HEALTH_TIMEOUT_MS || 60000);

const sampleTeam = {
  name: 'Smoke Team',
  format: 'gen9customgame',
  pokemon: [
    {
      species: 'Pikachu',
      item: 'Light Ball',
      ability: 'Static',
      moves: ['Thunderbolt', 'Volt Tackle', 'Grass Knot', 'Protect'],
      evs: {hp: 4, spa: 252, spe: 252},
      nature: 'Timid',
      level: 100,
    },
  ],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function reportSmoke(status, details) {
  try {
    await fetch(`${base}/smoke/result`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({status, details}),
    });
  } catch {
    // Best-effort reporting only.
  }
}

async function waitForHealth() {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < timeoutMs) {
    attempt += 1;
    try {
      const response = await fetch(`${base}/health`);
      const payload = await response.json();
      if (response.ok && payload.ok) return payload;
    } catch {
      // retry
    }
    await sleep(Math.min(5000, 500 * (2 ** Math.min(attempt, 4))));
  }
  throw new Error(`Timed out waiting for ${base}/health`);
}

async function createTeam(nameSuffix) {
  const response = await fetch(`${base}/api/teams`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({...sampleTeam, name: `Smoke Team ${nameSuffix}`}),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`Team creation failed: ${JSON.stringify(payload)}`);
  return payload;
}

async function run() {
  await waitForHealth();

  const p1Team = await createTeam('P1');
  const p2Team = await createTeam('P2');

  const createRes = await fetch(`${base}/battle/create`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      format: 'gen9customgame',
      p1TeamId: p1Team.id,
      p2TeamId: p2Team.id,
      p1Name: 'Ash',
      p2Name: 'Gary',
    }),
  });
  const created = await createRes.json();
  if (!createRes.ok) throw new Error(`Create failed: ${JSON.stringify(created)}`);

  const actionRes = await fetch(`${base}/battle/${created.id}/action`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({actor: 'p1', action: {choice: 'move 1'}}),
  });
  const action = await actionRes.json();
  if (!actionRes.ok) throw new Error(`Action failed: ${JSON.stringify(action)}`);

  const snapRes = await fetch(`${base}/battle/${created.id}`);
  const snapshot = await snapRes.json();
  if (!snapRes.ok) throw new Error(`Snapshot failed: ${JSON.stringify(snapshot)}`);

  await reportSmoke('pass', `battleId=${created.id}`);
  console.log('Smoke test passed.');
  console.log({battleId: created.id, turn: snapshot.turn, updates: snapshot.updates.length});
}

run().catch(async (error) => {
  await reportSmoke('fail', error.message);
  console.error(error);
  process.exit(1);
});
