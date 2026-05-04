export type ShipUpgradeId = 'reactorUpgrade' | 'cargoBayUpgrade' | 'deepSpaceScanner';

export interface ShipUpgradeDefinition {
  id: ShipUpgradeId;
  name: string;
  description: string;
  effectDescription: string;
  baseCost: number;
  maxLevel: number;
}

export const shipUpgradeDefinitions: ShipUpgradeDefinition[] = [
  {
    id: 'reactorUpgrade',
    name: 'Reactor Upgrade',
    description: 'Powers future ship modules',
    effectDescription: 'Raises shared ship level for future systems.',
    baseCost: 120,
    maxLevel: 5,
  },
  {
    id: 'cargoBayUpgrade',
    name: 'Cargo Bay Upgrade',
    description: 'Expands shared storage plans',
    effectDescription: 'Prepares future shared cargo and aquarium capacity.',
    baseCost: 100,
    maxLevel: 5,
  },
  {
    id: 'deepSpaceScanner',
    name: 'Deep Space Scanner',
    description: 'Finds distant fishing zones',
    effectDescription: 'Level 1 unlocks Nebula Drift.',
    baseCost: 160,
    maxLevel: 3,
  },
];

export function getShipUpgradeDefinition(id: ShipUpgradeId) {
  return shipUpgradeDefinitions.find((definition) => definition.id === id);
}
