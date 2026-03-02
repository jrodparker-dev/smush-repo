# Poko Battle

Poko Battle is a fresh, standalone battle-simulator framework that keeps **Pokemon Showdown's modern engine/data** while giving you a clean surface to build your own web + mobile experience.

## Current status (important)

**Not yet a fully playable simulator.**

Right now this project is a backend skeleton with a mocked in-memory battle flow (`EngineBridge`) so you can test battle lifecycle APIs before wiring in the full Pokemon Showdown simulator internals.

What works now:
- Create a battle room/session.
- Submit action payloads.
- Retrieve battle snapshots.
- Track official-vs-custom data divergence with a manifest.

What does **not** work yet:
- Full battle rules resolution (damage, turn order, abilities, statuses, etc).
- Team validation/parsing, ladder, chat, replays, or full client protocol parity.

## Why this structure

You currently run `dh2-client` against `pokemon-showdown` server files. This design separates concerns so you can evolve toward a new product:

1. Keep Showdown battle correctness by using Showdown data as the source of truth.
2. Layer your custom changes on top as deterministic overrides.
3. Decouple your front-end from legacy PS client assumptions.

## Quick start

```bash
cd "Poko Battle"
npm run data:manifest
npm test
npm start
```

Server runs on `http://localhost:4080` by default.

## How to test it right now

### Option A: one-command smoke test (recommended)

In terminal 1:
```bash
cd "Poko Battle"
npm start
```

In terminal 2:
```bash
cd "Poko Battle"
npm run smoke:test
```

### Option B: manual curl flow

Create battle:
```bash
curl -s -X POST http://localhost:4080/battle/create \
  -H 'Content-Type: application/json' \
  -d '{"format":"gen9ou","p1":{"id":"p1","name":"Ash"},"p2":{"id":"p2","name":"Gary"}}'
```

Submit action:
```bash
curl -s -X POST http://localhost:4080/battle/<BATTLE_ID>/action \
  -H 'Content-Type: application/json' \
  -d '{"actor":"p1","action":{"type":"move","move":"thunderbolt"}}'
```

Get snapshot:
```bash
curl -s http://localhost:4080/battle/<BATTLE_ID>
```

## Initial roadmap

- Wire `EngineBridge` into live Pokemon Showdown battle creation.
- Replace in-memory room storage with Redis/Postgres.
- Add auth + account system.
- Stand up a dedicated React/React Native front-end over `shared/protocol.js`.
