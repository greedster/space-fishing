import type { FishRarity } from '../data/fish';
import type { UpgradeId } from '../data/upgrades';

export type CatchQuality = 'Messy Catch' | 'Clean Catch' | 'Perfect Catch';

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
  // Discord SDK identity can later hydrate this id/name before the Phaser scene starts.
  playerId: string;
  displayName: string;
  coins: number;
  cargoCapacity: number;
  caughtFish: CaughtFish[];
  upgrades: Record<UpgradeId, number>;
}

export function createPlayerState(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    playerId: 'local-player',
    displayName: 'Local Astronaut',
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
