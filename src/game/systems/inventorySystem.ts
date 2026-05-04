import { fishRarities, type FishRarity, type FishType } from '../data/fish';
import { getCatchValue } from './economySystem';
import type { CatchQuality, CaughtFish, PlayerState } from '../state/playerState';

export interface AddCatchOptions {
  caughtAt?: number;
  id?: string;
}

export function createCaughtFish(fish: FishType, quality: CatchQuality, options: AddCatchOptions = {}): CaughtFish {
  return {
    id: options.id ?? crypto.randomUUID(),
    fishId: fish.id,
    name: fish.name,
    rarity: fish.rarity,
    value: getCatchValue(fish.value, quality),
    quality,
    flavorText: fish.flavorText,
    caughtAt: options.caughtAt ?? Date.now(),
  };
}

export function addCatchToInventory(player: PlayerState, fish: FishType, quality: CatchQuality, options?: AddCatchOptions) {
  const caughtFish = createCaughtFish(fish, quality, options);

  player.caughtFish.unshift(caughtFish);
  player.coins += caughtFish.value;

  return caughtFish;
}

export interface InventoryFishSummary {
  fishId: string;
  name: string;
  rarity: FishRarity;
  quantity: number;
  totalValue: number;
  latestValue: number;
}

export interface InventoryRaritySummary {
  rarity: FishRarity;
  quantity: number;
  totalValue: number;
  fish: InventoryFishSummary[];
}

export function getInventoryByRarity(player: PlayerState): InventoryRaritySummary[] {
  const summaries = new Map<FishRarity, Map<string, InventoryFishSummary>>();

  fishRarities.forEach((rarity) => summaries.set(rarity, new Map()));

  player.caughtFish.forEach((caughtFish) => {
    const rarityGroup = summaries.get(caughtFish.rarity);

    if (!rarityGroup) {
      return;
    }

    const current = rarityGroup.get(caughtFish.fishId);
    if (current) {
      current.quantity += 1;
      current.totalValue += caughtFish.value;
      current.latestValue = caughtFish.value;
      return;
    }

    rarityGroup.set(caughtFish.fishId, {
      fishId: caughtFish.fishId,
      name: caughtFish.name,
      rarity: caughtFish.rarity,
      quantity: 1,
      totalValue: caughtFish.value,
      latestValue: caughtFish.value,
    });
  });

  return fishRarities.map((rarity) => {
    const fish = Array.from(summaries.get(rarity)?.values() ?? [])
      .sort((left, right) => right.totalValue - left.totalValue || left.name.localeCompare(right.name));

    return {
      rarity,
      quantity: fish.reduce((sum, entry) => sum + entry.quantity, 0),
      totalValue: fish.reduce((sum, entry) => sum + entry.totalValue, 0),
      fish,
    };
  });
}
