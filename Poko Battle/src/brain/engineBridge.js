import {spawn} from 'node:child_process';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '..');
const showdownBin = path.join(repoRoot, process.env.SHOWDOWN_ROOT || 'DH2', 'pokemon-showdown');

function createBattleProcess() {
  const proc = spawn('node', [showdownBin, 'simulate-battle'], {
    cwd: path.join(repoRoot, process.env.SHOWDOWN_ROOT || 'DH2'),
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return proc;
}
/**
 * Adapter boundary between Poko Battle and a simulator engine.
 *
 * Phase 1 target: Pokemon Showdown simulator.
 * Later: swap/extend with custom simulation if desired.
 */

export class EngineBridge {
  constructor({logger = console} = {}) {
    this.logger = logger;
    this.battles = new Map();
  }

  createBattle({battleId, format, p1, p2}) {
    const proc = createBattleProcess();
    const battle = {
      id: battleId,
      format,
      players: {p1: {id: p1.id, name: p1.name}, p2: {id: p2.id, name: p2.name}},
      state: 'created',
      turn: 0,
      updates: [],
      choices: [],
      lastError: '',
      proc,
    };

    proc.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      battle.updates.push(...lines);
      if (lines.some((line) => line.includes('|turn|'))) battle.turn += 1;
    });
    proc.stderr.on('data', (chunk) => {
      battle.lastError = chunk.toString();
      this.logger.error?.(battle.lastError);
    });
    proc.on('close', () => {
      battle.state = 'finished';
    });

    proc.stdin.write(`>start ${JSON.stringify({formatid: format})}\n`);
    proc.stdin.write(`>player p1 ${JSON.stringify({name: p1.name, team: p1.team.packed})}\n`);
    proc.stdin.write(`>player p2 ${JSON.stringify({name: p2.name, team: p2.team.packed})}\n`);

    this.battles.set(battleId, battle);
    return this.getSnapshot(battleId);
  }

  applyAction({battleId, actor, action}) {
    const battle = this.battles.get(battleId);
    if (!battle) throw new Error(`Unknown battle: ${battleId}`);
    if (!action?.choice) throw new Error('action.choice is required (example: "move 1")');

    battle.proc.stdin.write(`>${actor || 'p1'} ${action.choice}\n`);
    battle.choices.push({actor: actor || 'p1', choice: action.choice, at: new Date().toISOString()});
    battle.state = 'running';

    return this.getSnapshot(battleId);
  }

  getSnapshot(battleId) {
    const battle = this.battles.get(battleId);
    if (!battle) return null;
    return {
      id: battle.id,
      format: battle.format,
      players: battle.players,
      state: battle.state,
      turn: battle.turn,
      choices: battle.choices,
      updates: battle.updates.slice(-50),
      lastError: battle.lastError,
    };
  }
}
