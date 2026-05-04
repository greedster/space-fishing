import type { PlayerState } from '../state/playerState';
import type { ShipState } from '../state/shipState';

export const CURRENT_SAVE_VERSION = 2;

export interface SavedGameData {
  player: PlayerState;
  ship: ShipState;
}

export interface SaveEnvelope {
  saveVersion: typeof CURRENT_SAVE_VERSION;
  savedAt: number;
  player: PlayerState;
  ship: ShipState;
}

export interface SaveProvider {
  load(): SavedGameData | null;
  save(player: PlayerState, ship: ShipState): boolean;
  reset(): boolean;
}

export function createSaveEnvelope(player: PlayerState, ship: ShipState): SaveEnvelope {
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    savedAt: Date.now(),
    player,
    ship,
  };
}

// A future localStorage adapter, cloud save endpoint, or Discord-guild save can share this shape.
export type SerializedSave = SaveEnvelope;
