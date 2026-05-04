export type UpgradeId = 'strongerLine' | 'betterLure' | 'biggerCargo';

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  baseCost: number;
  maxLevel: number;
}

export const upgradeDefinitions: UpgradeDefinition[] = [
  {
    id: 'strongerLine',
    name: 'Stronger Line',
    description: 'Widens red zone',
    baseCost: 12,
    maxLevel: 5,
  },
  {
    id: 'betterLure',
    name: 'Better Lure',
    description: 'Better rarity odds',
    baseCost: 18,
    maxLevel: 5,
  },
  {
    id: 'biggerCargo',
    name: 'Bigger Cargo',
    description: 'More future storage',
    baseCost: 14,
    maxLevel: 5,
  },
];

export function getUpgradeDefinition(id: UpgradeId) {
  return upgradeDefinitions.find((definition) => definition.id === id);
}

