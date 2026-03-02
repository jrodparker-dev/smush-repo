const base = process.env.POKO_BASE_URL || 'http://localhost:4080';

async function run() {
  const createRes = await fetch(`${base}/battle/create`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      format: 'gen9ou',
      p1: {id: 'p1', name: 'Ash'},
      p2: {id: 'p2', name: 'Gary'},
    }),
  });
  const created = await createRes.json();
  if (!createRes.ok) throw new Error(`Create failed: ${JSON.stringify(created)}`);

  const actionRes = await fetch(`${base}/battle/${created.id}/action`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({actor: 'p1', action: {type: 'move', move: 'thunderbolt'}}),
  });
  const action = await actionRes.json();
  if (!actionRes.ok) throw new Error(`Action failed: ${JSON.stringify(action)}`);

  const snapRes = await fetch(`${base}/battle/${created.id}`);
  const snapshot = await snapRes.json();
  if (!snapRes.ok) throw new Error(`Snapshot failed: ${JSON.stringify(snapshot)}`);

  console.log('Smoke test passed.');
  console.log({battleId: created.id, turn: snapshot.turn, logEntries: snapshot.log.length});
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
