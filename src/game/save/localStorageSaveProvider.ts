import { getFishById } from '../data/fish';
import { shipUpgradeDefinitions } from '../data/shipUpgrades';
import { defaultFishingZoneId, fishingZoneDefinitions } from '../data/zones';
import { createPlayerState, type PlayerState } from '../state/playerState';
import { createShipState, localDevShipId, type ShipContributionLogEntry, type ShipState } from '../state/shipState';
import { getShipLevel, refreshUnlockedZones } from '../systems/shipSystem';
import { getCargoCapacity } from '../systems/upgradeSystem';
import {
  createSaveEnvelope,
  type SavedGameData,
  type SaveEnvelope,
  type SaveProvider,
} from './saveTypes';

const defaultSaveKey = 'space-fishing-save';

export class LocalStorageSaveProvider implements SaveProvider {
  constructor(private readonly storageKey = defaultSaveKey) {}

  load(): SavedGameData | null {
    if (!this.canUseStorage()) {
      return null;
    }

    const rawSave = window.localStorage.getItem(this.storageKey);
    if (!rawSave) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawSave) as Partial<SaveEnvelope>;
      if (!parsed.player) {
        return null;
      }

      return {
        player: normalizePlayerState(parsed.player),
        ship: normalizeShipState(parsed.ship),
      };
    } catch {
      return null;
    }
  }

  save(player: PlayerState, ship: ShipState) {
    if (!this.canUseStorage()) {
      return false;
    }

    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(createSaveEnvelope(player, ship)));
      return true;
    } catch {
      return false;
    }
  }

  reset() {
    if (!this.canUseStorage()) {
      return false;
    }

    try {
      window.localStorage.removeItem(this.storageKey);
      return true;
    } catch {
      return false;
    }
  }

  private canUseStorage() {
    try {
      return typeof window !== 'undefined' && Boolean(window.localStorage);
    } catch {
      return false;
    }
  }
}

function normalizePlayerState(savedPlayer: Partial<PlayerState>): PlayerState {
  const player = createPlayerState();

  if (savedPlayer.playerId) {
    player.playerId = savedPlayer.playerId;
  }

  if (savedPlayer.displayName) {
    player.displayName = savedPlayer.displayName;
  }

  if (typeof savedPlayer.coins === 'number') {
    player.coins = savedPlayer.coins;
  }

  if (typeof savedPlayer.cargoCapacity === 'number') {
    player.cargoCapacity = savedPlayer.cargoCapacity;
  }

  if (Array.isArray(savedPlayer.caughtFish)) {
    player.caughtFish = savedPlayer.caughtFish.map((caughtFish) => {
      const fish = getFishById(caughtFish.fishId);

      return {
        ...caughtFish,
        flavorText: caughtFish.flavorText ?? fish?.flavorText ?? '',
      };
    });
  }

  player.upgrades = {
    strongerLine: savedPlayer.upgrades?.strongerLine ?? 0,
    betterLure: savedPlayer.upgrades?.betterLure ?? 0,
    biggerCargo: savedPlayer.upgrades?.biggerCargo ?? 0,
  };

  player.cargoCapacity = Math.max(player.cargoCapacity, getCargoCapacity(player));

  return player;
}

function normalizeShipState(savedShip?: Partial<ShipState>): ShipState {
  const ship = createShipState();

  ship.serverId = savedShip?.serverId ?? localDevShipId;
  ship.shipName = savedShip?.shipName || ship.shipName;
  ship.sharedCoins = typeof savedShip?.sharedCoins === 'number' ? savedShip.sharedCoins : 0;

  ship.upgrades = shipUpgradeDefinitions.reduce((result, definition) => {
    result[definition.id] = savedShip?.upgrades?.[definition.id] ?? 0;
    return result;
  }, ship.upgrades);

  if (Array.isArray(savedShip?.unlockedZones)) {
    const validZones = new Set(fishingZoneDefinitions.map((zone) => zone.id));
    ship.unlockedZones = savedShip.unlockedZones.filter((zoneId) => validZones.has(zoneId));
  }

  if (savedShip?.currentZone) {
    ship.currentZone = savedShip.currentZone;
  }

  if (Array.isArray(savedShip?.contributionLog)) {
    ship.contributionLog = savedShip.contributionLog
      .filter((entry): entry is ShipContributionLogEntry => Boolean(entry?.id && entry.upgradeId))
      .slice(0, 5);
  }

  refreshUnlockedZones(ship);
  ship.level = getShipLevel(ship);

  if (!ship.unlockedZones.includes(ship.currentZone)) {
    ship.currentZone = defaultFishingZoneId;
  }

  return ship;
}
