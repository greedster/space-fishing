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

export interface SaveScope {
  platform: string;
  playerId: string;
  serverId: string;
  guildId?: string | null;
}

export interface SaveProvider {
  // Implementations should scope player data by player.playerId and shared ship data by ship.serverId.
  // LocalStorageSaveProvider currently stores both together for the local prototype; future providers can
  // split local browser, backend/cloud, and Discord guild/server persistence behind this same boundary.
  load(scope?: SaveScope): SavedGameData | null;
  save(player: PlayerState, ship: ShipState, scope?: SaveScope): boolean;
  reset(scope?: SaveScope): boolean;
}

export function createSaveEnvelope(player: PlayerState, ship: ShipState): SaveEnvelope {
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    savedAt: Date.now(),
    player,
    ship,
  };
}

// A future localStorage adapter, cloud save endpoint, or Discord guild/server save can share this shape.
export type SerializedSave = SaveEnvelope;
