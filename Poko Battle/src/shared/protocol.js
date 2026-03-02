/**
 * Shared message contracts for web/mobile clients and backend services.
 * Keep this transport-agnostic so it can be used with WS, SSE, or native sockets.
 */

export const ClientEvents = Object.freeze({
  QUEUE_JOIN: 'queue:join',
  QUEUE_LEAVE: 'queue:leave',
  BATTLE_ACTION: 'battle:action',
  SPECTATE_JOIN: 'spectate:join',
});

export const ServerEvents = Object.freeze({
  QUEUE_STATE: 'queue:state',
  BATTLE_STARTED: 'battle:started',
  BATTLE_UPDATE: 'battle:update',
  BATTLE_FINISHED: 'battle:finished',
  ERROR: 'error',
});
