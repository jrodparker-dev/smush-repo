# Poko Battle Architecture

## Runtime components

- **Poko API (`src/server/app.js`)**
  - Team Builder CRUD
  - Battle lifecycle endpoints
  - Team packing/validation via Showdown CLI

- **Engine bridge (`src/brain/engineBridge.js`)**
  - Spawns `pokemon-showdown simulate-battle`
  - Streams battle protocol updates into in-memory snapshots

- **Showdown server process**
  - Started by `scripts/dev.mjs` for native Showdown multiplayer surface and compatibility

## Data integration

- `scripts/build-data-manifest.mjs` compares:
  - `../pokemon-showdown/data` (official base)
  - `../DH2/data` (custom overrides)

## Single working format

For this phase, all team legality/validation is run in:
- `gen9customgame`

This provides one permissive ruleset while the custom format layer is built later.
# Poko Battle Architecture (v0 skeleton)

## Core principles

1. **Simulator correctness first**: use official Pokemon Showdown battle/data model as the baseline.
2. **Custom data as overlays**: treat DH2 edits as explicit overrides over the upstream baseline.
3. **Product decoupling**: expose your own API/protocol independent from legacy PS client internals.

## Directory map

- `src/brain/`
  - `engineBridge.js`: boundary for simulator integration.
  - `dataMerge.js`: deterministic merge behavior for base+override data.
- `src/server/`
  - `app.js`: starter API for health and battle-creation flow.
- `src/shared/`
  - `protocol.js`: shared event names for web/mobile clients.
- `scripts/`
  - `build-data-manifest.mjs`: inspects and reports divergence between official and custom data files.
- `generated/`
  - `data-manifest.json`: generated status report used to track upgrade work.

## Upgrade flow for staying current with Showdown

1. Pull latest upstream `pokemon-showdown`.
2. Run `npm run data:manifest` from this folder.
3. Review files marked `custom-overrides-official`.
4. Port only intended custom differences into modular override files (future step), reducing long-term merge pain.

This gives you a clean path to preserve your custom metagame/data while continuously adopting upstream mechanics/features.
