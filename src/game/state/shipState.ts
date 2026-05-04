import { shipUpgradeDefinitions, type ShipUpgradeId } from '../data/shipUpgrades';
import { defaultFishingZoneId, type FishingZoneId } from '../data/zones';

export const localDevShipId = 'local-dev-ship';

export interface ShipContributionLogEntry {
  id: string;
  playerId: string;
  playerName: string;
  upgradeId: ShipUpgradeId;
  upgradeName: string;
  amount: number;
  newLevel: number;
  contributedAt: number;
}

export interface ShipState {
  // Hydrated from PlatformProvider. local-dev-ship stands in for a future Discord guild/server id.
  serverId: string;
  shipName: string;
  level: number;
  sharedCoins: number;
  upgrades: Record<ShipUpgradeId, number>;
  unlockedZones: FishingZoneId[];
  currentZone: FishingZoneId;
  contributionLog: ShipContributionLogEntry[];
}

export function createShipState(overrides: Partial<ShipState> = {}): ShipState {
  const upgrades = shipUpgradeDefinitions.reduce((result, definition) => {
    result[definition.id] = 0;
    return result;
  }, {} as Record<ShipUpgradeId, number>);

  return {
    serverId: localDevShipId,
    shipName: 'Local Dev Ship',
    level: 1,
    sharedCoins: 0,
    upgrades,
    unlockedZones: [defaultFishingZoneId],
    currentZone: defaultFishingZoneId,
    contributionLog: [],
    ...overrides,
  };
}
