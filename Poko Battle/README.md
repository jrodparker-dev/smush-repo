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
