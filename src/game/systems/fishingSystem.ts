import { fishRarities, fishTypes, type FishRarity, type FishType } from '../data/fish';
import { defaultFishingZoneId, getFishingZoneDefinitionOrDefault, type FishingZoneId } from '../data/zones';
import { getStrongerLineBonus } from './upgradeSystem';
import type { CatchQuality, PlayerState } from '../state/playerState';

export interface FishingSessionState {
  // Multiplayer sync can later broadcast this serializable session state to spectators or crewmates.
  fishId: string;
  tension: number;
  progress: number;
  highDanger: number;
  lowDanger: number;
  safeMin: number;
  safeMax: number;
  safeZoneSize: number;
  safeZoneBaseCenter: number;
  safeZonePhase: number;
  timeInSafeZone: number;
  totalTime: number;
  elapsed: number;
  fishDrift: number;
  surgeRemaining: number;
  surgeDirection: number;
  surgeCooldown: number;
}

export interface FishingUpdateResult {
  session: FishingSessionState;
  inSafeZone: boolean;
  warning: string;
  finished: boolean;
  success: boolean;
  failedStatus: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const reelInputRate = 0.5;
const releaseInputRate = 0.48;
const fishDisturbanceScale = 0.32;
const minimumRecoveryRate = 0.2;
const startingCatchProgress = 0.12;

export interface RarityWeightEntry {
  rarity: FishRarity;
  weight: number;
  chance: number;
}

export const baseRarityWeights: Record<FishRarity, number> = {
  Common: 74,
  Uncommon: 19,
  Rare: 5.4,
  Epic: 1.35,
  Legendary: 0.25,
};

export const lureWeightBonus: Record<FishRarity, number> = {
  Common: -5.25,
  Uncommon: 2.65,
  Rare: 1.55,
  Epic: 0.82,
  Legendary: 0.14,
};

export function pickFish(lureLevel = 0, random = Math.random, zoneId: FishingZoneId = defaultFishingZoneId): FishType {
  const zoneFish = getFishForZone(zoneId);
  const rarity = pickRarity(lureLevel, random, zoneId);
  const candidates = getCandidatesForRarity(zoneFish, rarity);
  const fallbackCandidates = candidates.length > 0
    ? candidates
    : getFallbackFishForRarity(zoneFish, rarity);

  return fallbackCandidates[Math.floor(random() * fallbackCandidates.length)] ?? zoneFish[0] ?? fishTypes[0];
}

export function pickRarity(lureLevel = 0, random = Math.random, zoneId?: FishingZoneId): FishRarity {
  const weights = getRarityWeights(lureLevel, zoneId);
  const totalWeight = weights.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = random() * totalWeight;

  for (const entry of weights) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.rarity;
    }
  }

  return 'Common';
}

export function getRarityWeights(lureLevel = 0, zoneId?: FishingZoneId): RarityWeightEntry[] {
  const zone = zoneId ? getFishingZoneDefinitionOrDefault(zoneId) : undefined;
  const rawWeights = fishRarities.map((rarity) => {
    const bonus = lureWeightBonus[rarity] * lureLevel;
    const zoneModifier = zone?.rarityWeightModifiers?.[rarity] ?? 0;
    const minimum = rarity === 'Legendary' ? 0.12 : 0;

    return {
      rarity,
      weight: Math.max(minimum, baseRarityWeights[rarity] + bonus + zoneModifier),
      chance: 0,
    };
  });
  const totalWeight = rawWeights.reduce((sum, entry) => sum + entry.weight, 0);

  return rawWeights.map((entry) => ({
    ...entry,
    chance: entry.weight / totalWeight,
  }));
}

export function getFishForZone(zoneId: FishingZoneId): FishType[] {
  const zone = getFishingZoneDefinitionOrDefault(zoneId);
  const fishById = new Map(fishTypes.map((fish) => [fish.id, fish]));

  return zone.fishIds
    .map((fishId) => fishById.get(fishId))
    .filter((fish): fish is FishType => Boolean(fish));
}

export function getAvailableRaritiesForZone(zoneId: FishingZoneId): FishRarity[] {
  const zoneFish = getFishForZone(zoneId);

  return fishRarities.filter((rarity) => zoneFish.some((fish) => fish.rarity === rarity));
}

function getCandidatesForRarity(zoneFish: FishType[], rarity: FishRarity) {
  return zoneFish.filter((fish) => fish.rarity === rarity);
}

function getFallbackFishForRarity(zoneFish: FishType[], rarity: FishRarity) {
  const rarityIndex = fishRarities.indexOf(rarity);

  for (let offset = 1; offset < fishRarities.length; offset += 1) {
    const lowerRarity = fishRarities[rarityIndex - offset];
    const higherRarity = fishRarities[rarityIndex + offset];
    const lowerCandidates = lowerRarity ? getCandidatesForRarity(zoneFish, lowerRarity) : [];
    const higherCandidates = higherRarity ? getCandidatesForRarity(zoneFish, higherRarity) : [];
    const candidates = [...lowerCandidates, ...higherCandidates];

    if (candidates.length > 0) {
      return candidates;
    }
  }

  return zoneFish;
}

export function startFishingSession(player: PlayerState, fish: FishType, random = Math.random): FishingSessionState {
  const safeZoneSize = clamp(fish.safeZoneSize + getStrongerLineBonus(player, fish.rarity), 0.1, 0.48);
  const initialTension = 0.42;
  const safeZoneBaseCenter = clamp(initialTension + (random() - 0.5) * 0.08, safeZoneSize / 2, 1 - safeZoneSize / 2);
  const safeMin = clamp(safeZoneBaseCenter - safeZoneSize / 2, 0.05, 0.95 - safeZoneSize);

  return {
    fishId: fish.id,
    tension: initialTension,
    progress: startingCatchProgress,
    highDanger: 0,
    lowDanger: 0,
    safeMin,
    safeMax: safeMin + safeZoneSize,
    safeZoneSize,
    safeZoneBaseCenter,
    safeZonePhase: random() * Math.PI * 2,
    timeInSafeZone: 0,
    totalTime: 0,
    elapsed: 0,
    fishDrift: 0,
    surgeRemaining: 0,
    surgeDirection: 0,
    surgeCooldown: 0.85,
  };
}

export function updateFishingSession(
  session: FishingSessionState,
  fish: FishType,
  isReeling: boolean,
  delta: number,
  random = Math.random,
): FishingUpdateResult {
  session.elapsed += delta;
  session.totalTime += delta;
  updateSafeZone(session, fish, delta);

  const behaviorPull = (getBehaviorPull(session, fish, random) + getSurgePull(session, fish, delta, random)) * fishDisturbanceScale;
  const inputPull = (isReeling ? reelInputRate : -releaseInputRate) * fish.tensionSpeed;
  let tensionVelocity = inputPull + behaviorPull;

  // Pressure control loop: holding always trends tension right, releasing always trends it left.
  // Fish behavior adds recoverable wobble, but never creates an unrecoverable overshoot state.
  if (!isReeling && session.tension > session.safeMax) {
    tensionVelocity = Math.min(tensionVelocity, -minimumRecoveryRate * fish.tensionSpeed);
  }

  if (isReeling && session.tension < session.safeMin) {
    tensionVelocity = Math.max(tensionVelocity, minimumRecoveryRate * fish.tensionSpeed);
  }

  session.tension = clamp(session.tension + tensionVelocity * delta, 0, 1);

  const inSafeZone = isInSafeZone(session);
  if (inSafeZone) {
    session.timeInSafeZone += delta;
    const rawProgressGain = (0.28 * fish.progressGain * fish.progressGainMultiplier) / fish.difficulty;
    const pacedProgressGain = Math.min(rawProgressGain, getPacedProgressGain(fish));
    session.progress += pacedProgressGain * delta;
    session.highDanger = Math.max(0, session.highDanger - delta * 1.25);
    session.lowDanger = Math.max(0, session.lowDanger - delta * 1.25);
  } else {
    session.progress -= (0.07 * fish.difficulty * fish.progressDrain * fish.progressDrainMultiplier) * delta;
    session.highDanger += session.tension > session.safeMax ? delta : -delta * 0.8;
    session.lowDanger += session.tension < session.safeMin ? delta : -delta * 0.8;
    session.highDanger = clamp(session.highDanger, 0, 3.8);
    session.lowDanger = clamp(session.lowDanger, 0, 3.8);
  }

  session.progress = clamp(session.progress, 0, 1);

  if (session.progress <= 0 && session.totalTime > 1.8) {
    return finishUpdate(session, inSafeZone, false, 'Fish escaped. Keep tension in the red zone.');
  }

  if (session.highDanger >= 4.2) {
    return finishUpdate(session, inSafeZone, false, 'Line broke. Ease off the tension.');
  }

  if (session.lowDanger >= 4.2) {
    return finishUpdate(session, inSafeZone, false, 'Fish escaped. Add more tension.');
  }

  if (session.progress >= 1) {
    return finishUpdate(session, inSafeZone, true, '');
  }

  return {
    session,
    inSafeZone,
    warning: getFishingWarning(session, inSafeZone),
    finished: false,
    success: false,
    failedStatus: '',
  };
}

export function getCatchQuality(session: FishingSessionState): CatchQuality {
  const safeRatio = session.timeInSafeZone / Math.max(session.totalTime, 0.1);

  if (safeRatio >= 0.72) {
    return 'Perfect Catch';
  }

  if (safeRatio >= 0.42) {
    return 'Clean Catch';
  }

  return 'Messy Catch';
}

export function isInSafeZone(session: FishingSessionState) {
  return session.tension >= session.safeMin && session.tension <= session.safeMax;
}

export function getDifficultyLabel(fish: FishType) {
  if (fish.difficulty >= 1.55) {
    return 'Hard';
  }

  if (fish.difficulty >= 1.15) {
    return 'Tricky';
  }

  return 'Easy';
}

export function widenActiveSafeZone(session: FishingSessionState, amount = 0.035) {
  const currentCenter = (session.safeMin + session.safeMax) / 2;
  const newSize = clamp(session.safeZoneSize + amount, 0.12, 0.48);
  session.safeZoneSize = newSize;
  session.safeZoneBaseCenter = clamp(session.safeZoneBaseCenter, newSize / 2, 1 - newSize / 2);
  session.safeMin = clamp(currentCenter - newSize / 2, 0.05, 0.95 - newSize);
  session.safeMax = session.safeMin + newSize;
}

function finishUpdate(
  session: FishingSessionState,
  inSafeZone: boolean,
  success: boolean,
  failedStatus: string,
): FishingUpdateResult {
  return {
    session,
    inSafeZone,
    warning: getFishingWarning(session, inSafeZone),
    finished: true,
    success,
    failedStatus,
  };
}

function getFishingWarning(session: FishingSessionState, inSafeZone: boolean) {
  if (session.surgeRemaining > 0) {
    return 'Fish surge';
  }

  if (session.highDanger > 1.25) {
    return 'Too much tension';
  }

  if (session.lowDanger > 1.25) {
    return 'Add tension';
  }

  if (inSafeZone) {
    return 'In the red zone';
  }

  return 'Catch slipping';
}

function getPacedProgressGain(fish: FishType) {
  // Target catch duration caps perfect-play progress so low-rarity fish stay easy
  // without becoming automatic one-second catches.
  return (1 - startingCatchProgress) / fish.targetCatchDuration;
}

function updateSafeZone(session: FishingSessionState, fish: FishType, delta: number) {
  session.safeZonePhase += delta;

  // Fish rarity changes difficulty by moving the target, not by breaking the controls.
  // Drift is slow and readable; wiggle adds higher-rarity pressure while staying clamped in the bar.
  const drift = Math.sin(session.safeZonePhase * fish.safeZoneDriftSpeed) * fish.safeZoneDriftRange;
  const wiggle = Math.sin(session.safeZonePhase * fish.safeZoneWiggleSpeed) * fish.safeZoneWiggleAmplitude;
  const center = clamp(
    session.safeZoneBaseCenter + drift + wiggle,
    session.safeZoneSize / 2,
    1 - session.safeZoneSize / 2,
  );

  session.safeMin = clamp(center - session.safeZoneSize / 2, 0, 1 - session.safeZoneSize);
  session.safeMax = session.safeMin + session.safeZoneSize;
}

function getSurgePull(session: FishingSessionState, fish: FishType, delta: number, random: () => number) {
  if (fish.surgeChance <= 0 || fish.surgeStrength <= 0 || fish.surgeDuration <= 0) {
    return 0;
  }

  if (session.surgeRemaining > 0) {
    session.surgeRemaining = Math.max(0, session.surgeRemaining - delta);
    return session.surgeDirection * fish.surgeStrength;
  }

  session.surgeCooldown = Math.max(0, session.surgeCooldown - delta);
  if (session.surgeCooldown > 0 || random() > fish.surgeChance * delta) {
    return 0;
  }

  const safeCenter = (session.safeMin + session.safeMax) / 2;
  session.surgeDirection = session.tension >= safeCenter ? 1 : -1;
  session.surgeRemaining = fish.surgeDuration;
  session.surgeCooldown = 1.35 + random() * 1.25;

  return session.surgeDirection * fish.surgeStrength;
}

function getBehaviorPull(session: FishingSessionState, fish: FishType, random: () => number) {
  const wave = Math.sin(session.elapsed * (1.8 + fish.difficulty)) * 0.06 * fish.tensionSpeed;

  switch (fish.behavior) {
    case 'slow':
      return wave - 0.02 * fish.tensionSpeed;
    case 'spiky':
      return wave + (Math.sin(session.elapsed * 7) > 0.86 ? 0.52 * fish.tensionSpeed : 0);
    case 'darting':
      return wave + Math.sin(session.elapsed * 5.8) * 0.11 * fish.tensionSpeed;
    case 'unstable':
      session.fishDrift += random() * 0.08 - 0.04;
      session.fishDrift = clamp(session.fishDrift, -0.22, 0.22);
      return wave + session.fishDrift * fish.tensionSpeed;
    case 'singularity':
      return wave
        + Math.sin(session.elapsed * 4.2) * 0.2 * fish.tensionSpeed
        + (Math.sin(session.elapsed * 10) > 0.92 ? 0.72 * fish.tensionSpeed : 0);
    case 'steady':
    default:
      return wave;
  }
}
