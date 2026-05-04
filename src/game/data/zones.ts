import type { ShipUpgradeId } from './shipUpgrades';
import type { FishRarity } from './fish';

export type FishingZoneId = 'cosmicPool' | 'nebulaDrift';

export interface ZoneUnlockRequirement {
  shipUpgradeId: ShipUpgradeId;
  level: number;
  label: string;
}

export interface FishingZoneDefinition {
  id: FishingZoneId;
  name: string;
  description: string;
  fishIds: string[];
  rarityWeightModifiers?: Partial<Record<FishRarity, number>>;
  unlockRequirement: ZoneUnlockRequirement | null;
}

export const defaultFishingZoneId: FishingZoneId = 'cosmicPool';

export const fishingZoneDefinitions: FishingZoneDefinition[] = [
  {
    id: 'cosmicPool',
    name: 'Cosmic Pool',
    description: 'The cozy shipboard fishing pool. Shared common fish and gentle oddities make it ideal for learning.',
    fishIds: [
      'space-minnow',
      'moon-guppy',
      'jellyfish-drifter',
      'orbital-sardine',
      'starlight-tadpole',
      'comet-koi',
      'nebula-betta',
      'solar-flare-fin',
      'void-eel',
    ],
    rarityWeightModifiers: {
      Common: 10,
      Uncommon: 2,
      Rare: -1.2,
      Epic: -0.85,
      Legendary: -0.08,
    },
    unlockRequirement: null,
  },
  {
    id: 'nebulaDrift',
    name: 'Nebula Drift',
    description: 'A hazy drift field with stranger silhouettes, brighter currents, and more exciting rare signals.',
    fishIds: [
      'space-minnow',
      'jellyfish-drifter',
      'orbital-sardine',
      'nebula-betta',
      'prism-puffer',
      'mistwhale-fry',
      'aurora-ray',
      'ion-seahorse',
      'cosmic-manta',
      'nebula-seraph',
      'black-hole-carp',
    ],
    rarityWeightModifiers: {
      Common: -18,
      Uncommon: 7,
      Rare: 5,
      Epic: 2,
      Legendary: 0.18,
    },
    unlockRequirement: {
      shipUpgradeId: 'deepSpaceScanner',
      level: 1,
      label: 'Requires Deep Space Scanner Lv 1',
    },
  },
];

export function getFishingZoneDefinition(id: FishingZoneId) {
  return fishingZoneDefinitions.find((zone) => zone.id === id);
}

export function getFishingZoneDefinitionOrDefault(id: FishingZoneId) {
  return getFishingZoneDefinition(id) ?? fishingZoneDefinitions[0];
}

export function getZoneIdsForFish(fishId: string) {
  return fishingZoneDefinitions
    .filter((zone) => zone.fishIds.includes(fishId))
    .map((zone) => zone.id);
}

export function getZoneNamesForFish(fishId: string) {
  return fishingZoneDefinitions
    .filter((zone) => zone.fishIds.includes(fishId))
    .map((zone) => zone.name);
}
