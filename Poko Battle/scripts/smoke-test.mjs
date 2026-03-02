const base = process.env.POKO_BASE_URL || 'http://localhost:4080';

const demoMon = {
  species: 'Pikachu',
  item: 'Light Ball',
  ability: 'Static',
  moves: ['Thunderbolt', 'Volt Tackle', 'Grass Knot', 'Protect'],
  evs: {hp: 4, spa: 252, spe: 252},
  ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
  nature: 'Timid',
  teraType: 'Electric',
  shiny: false,
  happiness: 255,
  level: 100,
  gender: 'M',
};

async function createTeam(name) {
  const res = await fetch(`${base}/api/teams`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name, pokemon: [demoMon]}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Team create failed: ${JSON.stringify(json)}`);
  return json;
}

async function run() {
  const p1Team = await createTeam('Smoke P1');
  const p2Team = await createTeam('Smoke P2');

  const createRes = await fetch(`${base}/battle/create`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({p1TeamId: p1Team.id, p2TeamId: p2Team.id, p1Name: 'Ash', p2Name: 'Gary'}),
  });
  const battle = await createRes.json();
  if (!createRes.ok) throw new Error(`Battle create failed: ${JSON.stringify(battle)}`);

  await new Promise((r) => setTimeout(r, 400));

  const actionRes = await fetch(`${base}/battle/${battle.id}/action`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({actor: 'p1', action: {choice: 'move 1'}}),
  });
  const action = await actionRes.json();
  if (!actionRes.ok) throw new Error(`Action failed: ${JSON.stringify(action)}`);

  console.log('Smoke test passed.');
  console.log({battleId: battle.id, updatesSeen: action.updates.length, lastLine: action.updates.at(-1)});
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
