import type { CatchQuality } from '../state/playerState';

const qualityMultiplier: Record<CatchQuality, number> = {
  'Messy Catch': 1,
  'Clean Catch': 1.35,
  'Perfect Catch': 2,
};

export function getCatchValue(baseValue: number, quality: CatchQuality) {
  return Math.round(baseValue * qualityMultiplier[quality]);
}

export function canAfford(coins: number, cost: number | null) {
  return cost !== null && coins >= cost;
}

export function spendCoins(coins: number, cost: number) {
  return Math.max(0, coins - cost);
}

