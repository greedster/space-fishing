import { fishRarities, fishTypes, type FishRarity, type FishType } from '../data/fish';
import type { PlayerState } from '../state/playerState';

export interface CodexFishEntry {
  fish: FishType;
  discovered: boolean;
  quantityCaught: number;
}

export interface CodexRarityProgress {
  rarity: FishRarity;
  discovered: number;
  total: number;
}

export interface CodexProgress {
  discovered: number;
  total: number;
  byRarity: CodexRarityProgress[];
}

export function getFishCaughtCount(player: PlayerState, fishId: string) {
  return player.caughtFish.filter((caughtFish) => caughtFish.fishId === fishId).length;
}

export function hasDiscoveredFish(player: PlayerState, fishId: string) {
  return getFishCaughtCount(player, fishId) > 0;
}

export function getCodexEntries(player: PlayerState): CodexFishEntry[] {
  return fishTypes.map((fish) => {
    const quantityCaught = getFishCaughtCount(player, fish.id);

    return {
      fish,
      discovered: quantityCaught > 0,
      quantityCaught,
    };
  });
}

export function getCodexProgress(player: PlayerState): CodexProgress {
  const entries = getCodexEntries(player);
  const byRarity = fishRarities.map((rarity) => {
    const rarityEntries = entries.filter((entry) => entry.fish.rarity === rarity);

    return {
      rarity,
      discovered: rarityEntries.filter((entry) => entry.discovered).length,
      total: rarityEntries.length,
    };
  });

  return {
    discovered: entries.filter((entry) => entry.discovered).length,
    total: entries.length,
    byRarity,
  };
}
