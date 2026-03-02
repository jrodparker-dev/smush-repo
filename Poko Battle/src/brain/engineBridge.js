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
    const battle = {
      id: battleId,
      format,
      players: {p1, p2},
      state: 'created',
      turn: 0,
      log: [],
    };

    // Placeholder for Showdown integration:
    // - instantiate simulator battle object
    // - bind request/update events
    this.battles.set(battleId, battle);
    this.logger.info?.(`[EngineBridge] battle created: ${battleId} (${format})`);
    return battle;
  }

  applyAction({battleId, actor, action}) {
    const battle = this.battles.get(battleId);
    if (!battle) throw new Error(`Unknown battle: ${battleId}`);

    battle.turn += 1;
    battle.state = 'running';
    battle.log.push({turn: battle.turn, actor, action});

    // Placeholder for true engine command processing + result stream.
    return {
      battleId,
      turn: battle.turn,
      accepted: true,
      action,
    };
  }

  getSnapshot(battleId) {
    return this.battles.get(battleId) ?? null;
  }
}
