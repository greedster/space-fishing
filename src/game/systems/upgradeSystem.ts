import type { UpgradeDefinition, UpgradeId } from '../data/upgrades';
import type { FishRarity } from '../data/fish';
import { canAfford, spendCoins } from './economySystem';
import type { PlayerState } from '../state/playerState';

const cargoBaseCapacity = 10;
const cargoCapacityPerLevel = 5;
const strongerLineBonusPerLevel = 0.035;
const strongerLineRarityScale: Record<FishRarity, number> = {
  Common: 1,
  Uncommon: 0.85,
  Rare: 0.65,
  Epic: 0.45,
  Legendary: 0.28,
};

export function getUpgradeLevel(player: PlayerState, id: UpgradeId) {
  return player.upgrades[id];
}

export function getUpgradeCost(player: PlayerState, definition: UpgradeDefinition) {
  const level = getUpgradeLevel(player, definition.id);

  if (level >= definition.maxLevel) {
    return null;
  }

  return definition.baseCost * (level + 1);
}

export function canUpgrade(player: PlayerState, definition: UpgradeDefinition) {
  return canAfford(player.coins, getUpgradeCost(player, definition));
}

export function applyUpgrade(player: PlayerState, id: UpgradeId) {
  player.upgrades[id] += 1;

  if (id === 'biggerCargo') {
    player.cargoCapacity = getCargoCapacity(player);
  }
}

export function buyUpgrade(player: PlayerState, definition: UpgradeDefinition) {
  const cost = getUpgradeCost(player, definition);

  if (!canAfford(player.coins, cost) || cost === null) {
    return false;
  }

  player.coins = spendCoins(player.coins, cost);
  applyUpgrade(player, definition.id);

  return true;
}

export function getCargoCapacity(player: PlayerState) {
  return cargoBaseCapacity + getUpgradeLevel(player, 'biggerCargo') * cargoCapacityPerLevel;
}

export function getStrongerLineBonus(player: PlayerState, rarity: FishRarity = 'Common') {
  return getUpgradeLevel(player, 'strongerLine') * strongerLineBonusPerLevel * strongerLineRarityScale[rarity];
}

export function getBetterLureLevel(player: PlayerState) {
  return getUpgradeLevel(player, 'betterLure');
}
