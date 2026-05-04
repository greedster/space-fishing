import { shipUpgradeDefinitions, type ShipUpgradeDefinition, type ShipUpgradeId } from '../data/shipUpgrades';
import { defaultFishingZoneId, fishingZoneDefinitions, type FishingZoneId } from '../data/zones';
import type { PlayerState } from '../state/playerState';
import type { ShipState } from '../state/shipState';
import { canAfford, spendCoins } from './economySystem';

export function getShipUpgradeLevel(ship: ShipState, id: ShipUpgradeId) {
  return ship.upgrades[id] ?? 0;
}

export function getShipUpgradeCost(ship: ShipState, definition: ShipUpgradeDefinition) {
  const level = getShipUpgradeLevel(ship, definition.id);

  if (level >= definition.maxLevel) {
    return null;
  }

  return definition.baseCost * (level + 1);
}

export function canBuyShipUpgrade(player: PlayerState, ship: ShipState, definition: ShipUpgradeDefinition) {
  return canAfford(player.coins, getShipUpgradeCost(ship, definition));
}

export function buyShipUpgrade(player: PlayerState, ship: ShipState, definition: ShipUpgradeDefinition) {
  const cost = getShipUpgradeCost(ship, definition);

  if (!canAfford(player.coins, cost) || cost === null) {
    return false;
  }

  player.coins = spendCoins(player.coins, cost);
  ship.sharedCoins += cost;
  ship.upgrades[definition.id] = getShipUpgradeLevel(ship, definition.id) + 1;
  ship.level = getShipLevel(ship);
  refreshUnlockedZones(ship);
  ship.contributionLog.unshift({
    id: crypto.randomUUID(),
    playerId: player.playerId,
    playerName: player.displayName,
    upgradeId: definition.id,
    upgradeName: definition.name,
    amount: cost,
    newLevel: ship.upgrades[definition.id],
    contributedAt: Date.now(),
  });
  ship.contributionLog = ship.contributionLog.slice(0, 5);

  return true;
}

export function getShipLevel(ship: ShipState) {
  const totalUpgradeLevels = shipUpgradeDefinitions.reduce((sum, definition) => {
    return sum + getShipUpgradeLevel(ship, definition.id);
  }, 0);

  return 1 + totalUpgradeLevels;
}

export function refreshUnlockedZones(ship: ShipState) {
  const unlocked = fishingZoneDefinitions
    .filter((zone) => {
      if (!zone.unlockRequirement) {
        return true;
      }

      return getShipUpgradeLevel(ship, zone.unlockRequirement.shipUpgradeId) >= zone.unlockRequirement.level;
    })
    .map((zone) => zone.id);

  ship.unlockedZones = unlocked;

  if (!ship.unlockedZones.includes(ship.currentZone)) {
    ship.currentZone = defaultFishingZoneId;
  }
}

export function isZoneUnlocked(ship: ShipState, zoneId: FishingZoneId) {
  return ship.unlockedZones.includes(zoneId);
}

export function switchFishingZone(ship: ShipState, zoneId: FishingZoneId) {
  if (!isZoneUnlocked(ship, zoneId)) {
    return false;
  }

  ship.currentZone = zoneId;
  return true;
}
