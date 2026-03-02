# Poko Battle

Poko Battle is now set up as a **real next-step platform** around Pokémon Showdown:

- A local API (`:4080`) for team builder + match orchestration.
- A full Showdown server (`:8000`) for battle/websocket ecosystem.
- A simulator bridge that uses `pokemon-showdown simulate-battle` for actual battle engine behavior.

## What you can run now

From repo root, either command works:

```bash
npm --prefix "Poko Battle" run dev
```

or:

```bash
node "Poko Battle"
```

This starts:
- Poko API on `http://localhost:4080`
- Showdown server on `http://localhost:8000`

## Team Builder API (full 6-mon structure)

`POST /api/teams`

Supports all requested per-Pokémon fields:
- species
- moves (1-4)
- ability
- item
- EVs
- IVs
- nature
- teraType
- shiny
- happiness
- level
- gender

Example payload:

```json
{
  "name": "My Team",
  "pokemon": [
    {
      "species": "Pikachu",
      "item": "Light Ball",
      "ability": "Static",
      "moves": ["Thunderbolt", "Volt Tackle", "Grass Knot", "Protect"],
      "evs": {"hp": 4, "spa": 252, "spe": 252},
      "ivs": {"hp": 31, "atk": 31, "def": 31, "spa": 31, "spd": 31, "spe": 31},
      "nature": "Timid",
      "teraType": "Electric",
      "shiny": false,
      "happiness": 255,
      "level": 100,
      "gender": "M"
    }
  ]
}
```

The API also packs and validates teams against `gen9customgame` (one permissive format where everything is legal).

## Battle API

Create battle from stored teams:

`POST /battle/create`

```json
{
  "p1TeamId": "<team-id>",
  "p2TeamId": "<team-id>",
  "p1Name": "Ash",
  "p2Name": "Gary"
}
```

Submit action:

`POST /battle/:id/action`

```json
{
  "actor": "p1",
  "action": {"choice": "move 1"}
}
```

Read battle snapshot:

`GET /battle/:id`

## Quick verification

Start dev stack, then run:

```bash
npm --prefix "Poko Battle" run smoke:test
```

## Mobile-app pipeline direction

This repo layout is ready for the next stage:
1. Keep this API as the canonical backend for auth/team/match state.
2. Build React Native app that talks to `:4080` for team builder and match lifecycle.
3. Add websocket gateway in Poko API for real-time battle updates.
4. Deploy API + Showdown with shared account service so mobile players can match each other.

## ChatGPT handoff (truncated context)

Use this short section when pasting into regular ChatGPT for implementation help.

### What this project is

- `Poko Battle` is a Node.js backend project that wraps Pokémon Showdown tools.
- It runs:
  - a local API on `http://localhost:4080`
  - a Showdown server on `http://localhost:8000`
- It already has endpoints for:
  - creating teams (`POST /api/teams`)
  - creating battles (`POST /battle/create`)
  - sending actions (`POST /battle/:id/action`)
  - reading snapshots (`GET /battle/:id`)

### Current goals

- Make the local dev stack boot reliably on a new machine.
- Keep team creation and validation stable for Gen 9 formats.
- Bridge battle actions and state cleanly so a future mobile UI can drive battles.

### Next steps to ask ChatGPT about

1. Give me an exact, step-by-step startup checklist (Node version, install commands, required config files, run commands).
2. Diagnose why `smoke:test` cannot connect when API/Showdown are not fully started, and suggest guardrails (health checks/retries).
3. Add a `preflight` script that verifies required files, ports, and binaries before `npm run dev`.
4. Propose a minimal "first playable loop" test plan (create team -> create battle -> submit action -> fetch snapshot).
5. Suggest the cleanest way to expose battle updates to a React Native client (polling first, websocket second).

### Known blockers to mention

- Some scripts assume local Showdown build/config artifacts already exist.
- `smoke:test` expects the API to already be live at `:4080`.
