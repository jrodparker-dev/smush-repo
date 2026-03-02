import {packTeamFromJson, validatePackedTeam} from '../brain/showdownCli.js';

const NATURES = new Set([
  'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty', 'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
  'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive', 'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
  'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky',
]);

function ensureStatBlock(stats = {}) {
  const fields = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  const out = {};
  for (const key of fields) out[key] = Number.isFinite(stats[key]) ? stats[key] : undefined;
  return out;
}

function validateMon(mon, index) {
  const errors = [];
  if (!mon.species) errors.push(`pokemon[${index}].species is required`);
  if (!Array.isArray(mon.moves) || mon.moves.length < 1 || mon.moves.length > 4) {
    errors.push(`pokemon[${index}].moves must have 1-4 moves`);
  }
  if (mon.level !== undefined && (mon.level < 1 || mon.level > 100)) {
    errors.push(`pokemon[${index}].level must be 1-100`);
  }
  if (mon.happiness !== undefined && (mon.happiness < 0 || mon.happiness > 255)) {
    errors.push(`pokemon[${index}].happiness must be 0-255`);
  }
  if (mon.nature && !NATURES.has(mon.nature)) {
    errors.push(`pokemon[${index}].nature is invalid`);
  }
  return errors;
}

function normalizeMon(mon) {
  return {
    name: mon.nickname || mon.species,
    species: mon.species,
    item: mon.item || '',
    ability: mon.ability || '',
    moves: mon.moves || [],
    nature: mon.nature || 'Serious',
    gender: mon.gender || '',
    evs: ensureStatBlock(mon.evs),
    ivs: ensureStatBlock(mon.ivs),
    level: mon.level ?? 100,
    shiny: Boolean(mon.shiny),
    happiness: mon.happiness ?? 255,
    teraType: mon.teraType || '',
  };
}

export class TeamBuilderService {
  constructor() {
    this.teams = new Map();
  }

  list() {
    return [...this.teams.values()];
  }

  get(id) {
    return this.teams.get(id) || null;
  }

  async save(team) {
    const errors = [];
    if (!team.name) errors.push('team.name is required');
    if (!Array.isArray(team.pokemon) || team.pokemon.length < 1 || team.pokemon.length > 6) {
      errors.push('team.pokemon must contain 1-6 Pokémon');
    }

    (team.pokemon || []).forEach((mon, i) => errors.push(...validateMon(mon, i)));
    if (errors.length) {
      return {ok: false, errors};
    }

    const normalized = {
      id: team.id,
      name: team.name,
      format: team.format || 'gen9customgame',
      pokemon: team.pokemon.map(normalizeMon),
      updatedAt: new Date().toISOString(),
    };

    const packed = await packTeamFromJson(normalized.pokemon);
    const legality = await validatePackedTeam(packed, normalized.format);

    const stored = {...normalized, packed, legality};
    this.teams.set(stored.id, stored);
    return {ok: true, team: stored};
  }
}
