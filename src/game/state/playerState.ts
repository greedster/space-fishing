import type { FishRarity } from '../data/fish';
import type { UpgradeId } from '../data/upgrades';

export type CatchQuality = 'Messy Catch' | 'Clean Catch' | 'Perfect Catch';

export const localPlayerId = 'local-player';
export const localPlayerName = 'Local Player';

export interface CaughtFish {
  id: string;
  fishId: string;
  name: string;
  rarity: FishRarity;
  value: number;
  quality: CatchQuality;
  flavorText: string;
  caughtAt: number;
}

export interface PlayerState {
  // Hydrated from PlatformProvider. Local uses a stable fake user; Discord can later provide real user identity.
  playerId: string;
  displayName: string;
  coins: number;
  cargoCapacity: number;
  caughtFish: CaughtFish[];
  upgrades: Record<UpgradeId, number>;
}

export function createPlayerState(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    playerId: localPlayerId,
    displayName: localPlayerName,
    coins: 0,
    cargoCapacity: 10,
    caughtFish: [],
    upgrades: {
      strongerLine: 0,
      betterLure: 0,
      biggerCargo: 0,
    },
    ...overrides,
  };
}
