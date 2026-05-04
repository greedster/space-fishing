import { createGameState, type GameState } from '../state/gameState';
import { createPlayerState, localPlayerId, localPlayerName } from '../state/playerState';
import { createShipState, localDevShipId } from '../state/shipState';

export type PlatformKind = 'local' | 'discord';

export interface PlatformContext {
  platform: PlatformKind;
  isDiscord: boolean;
  playerId: string;
  playerName: string;
  serverId: string;
  guildId: string | null;
}

export interface PlatformProvider {
  getContext(): PlatformContext;
}

export class LocalPlatformProvider implements PlatformProvider {
  getContext(): PlatformContext {
    return {
      platform: 'local',
      isDiscord: false,
      playerId: localPlayerId,
      playerName: localPlayerName,
      serverId: localDevShipId,
      guildId: null,
    };
  }
}

export function createGameStateForPlatform(context: PlatformContext): GameState {
  return createGameState(
    createPlayerState({
      playerId: context.playerId,
      displayName: context.playerName,
    }),
    createShipState({
      // In Discord, this should be hydrated from the guild/server id before loading ship state.
      serverId: context.serverId,
    }),
  );
}
