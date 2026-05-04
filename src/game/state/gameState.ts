import type { FishingSessionState } from '../systems/fishingSystem';
import { createPlayerState, type CaughtFish, type PlayerState } from './playerState';
import { createShipState, type ShipState } from './shipState';

export type CastState = 'ready' | 'waiting' | 'reeling' | 'result';

export interface GameState {
  // Cloud save can later persist this whole plain object.
  player: PlayerState;
  ship: ShipState;
  castState: CastState;
  statusText: string;
  activeFishing: FishingSessionState | null;
  lastCatch: CaughtFish | null;
}

export function createGameState(player: PlayerState = createPlayerState(), ship: ShipState = createShipState()): GameState {
  return {
    player,
    ship,
    castState: 'ready',
    statusText: 'Ready to cast',
    activeFishing: null,
    lastCatch: player.caughtFish[0] ?? null,
  };
}
