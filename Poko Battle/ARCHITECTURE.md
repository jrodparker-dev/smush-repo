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
