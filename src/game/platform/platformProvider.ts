import { DiscordSDK, Events, type EventPayloadData } from '@discord/embedded-app-sdk';
import { createGameState, type GameState } from '../state/gameState';
import { createPlayerState, localPlayerId, localPlayerName } from '../state/playerState';
import { createShipState, localDevShipId } from '../state/shipState';

export type PlatformKind = 'local' | 'discord';
export type DiscordReadyStatus = 'not-discord' | 'initializing' | 'ready' | 'missing-client-id' | 'error';

export interface PlatformContext {
  platform: PlatformKind;
  isDiscord: boolean;
  playerId: string;
  playerName: string;
  serverId: string;
  guildId: string | null;
  channelId: string | null;
  instanceId: string | null;
  discordReadyStatus: DiscordReadyStatus;
  discordError?: string;
}

export interface PlatformProvider {
  getContext(): PlatformContext;
  initialize(): Promise<PlatformContext>;
  onContextChange?(listener: (context: PlatformContext) => void): void;
}

type DiscordUserIdentity = {
  id: string;
  username: string;
  global_name?: string | null;
};

export class LocalPlatformProvider implements PlatformProvider {
  private readonly context: PlatformContext = {
    platform: 'local',
    isDiscord: false,
    playerId: localPlayerId,
    playerName: localPlayerName,
    serverId: localDevShipId,
    guildId: null,
    channelId: null,
    instanceId: null,
    discordReadyStatus: 'not-discord',
  };

  getContext(): PlatformContext {
    return this.context;
  }

  async initialize(): Promise<PlatformContext> {
    return this.context;
  }
}

export class DiscordPlatformProvider implements PlatformProvider {
  private context: PlatformContext = {
    platform: 'discord',
    isDiscord: true,
    playerId: localPlayerId,
    playerName: localPlayerName,
    serverId: localDevShipId,
    guildId: null,
    channelId: null,
    instanceId: null,
    discordReadyStatus: 'initializing',
  };

  private discordSdk?: DiscordSDK;
  private readonly contextListeners: Array<(context: PlatformContext) => void> = [];

  constructor(private readonly clientId?: string) {
    if (!clientId) {
      this.context = {
        ...this.context,
        discordReadyStatus: 'missing-client-id',
        discordError: 'Set VITE_DISCORD_CLIENT_ID to initialize Discord SDK.',
      };
    }
  }

  getContext(): PlatformContext {
    return this.context;
  }

  onContextChange(listener: (context: PlatformContext) => void): void {
    this.contextListeners.push(listener);
  }

  async initialize(): Promise<PlatformContext> {
    if (!this.clientId) {
      return this.context;
    }

    try {
      this.discordSdk = new DiscordSDK(this.clientId, { disableConsoleLogOverride: true });
      await this.discordSdk.subscribe(Events.READY, (ready) => {
        this.applyDiscordUser(ready.user);
      });
      await this.discordSdk.ready();
      await this.trySubscribeCurrentUserUpdates();

      const guildId = this.discordSdk.guildId;
      const authenticatedUser = await this.tryAuthenticateUser();
      const participants = await this.tryGetParticipants();
      const onlyParticipant = participants.length === 1 ? participants[0] : undefined;
      const player = authenticatedUser ?? onlyParticipant;

      this.context = {
        ...this.context,
        playerId: player?.id ?? this.context.playerId,
        playerName: getDiscordDisplayName(player) ?? this.context.playerName,
        serverId: guildId ?? localDevShipId,
        guildId,
        channelId: this.discordSdk.channelId,
        instanceId: this.discordSdk.instanceId,
        discordReadyStatus: 'ready',
        discordError: undefined,
      };
      this.notifyContextChange();
    } catch (error) {
      this.context = {
        ...this.context,
        discordReadyStatus: 'error',
        discordError: error instanceof Error ? error.message : 'Discord SDK initialization failed.',
      };
      this.notifyContextChange();
    }

    return this.context;
  }

  private async trySubscribeCurrentUserUpdates() {
    try {
      await this.discordSdk?.subscribe(Events.CURRENT_USER_UPDATE, (user: EventPayloadData<Events.CURRENT_USER_UPDATE>) => {
        this.applyDiscordUser(user);
      });
    } catch {
      // Identity can still come from READY, authenticate, participant fallback, or local placeholders.
    }
  }

  private async tryAuthenticateUser(): Promise<DiscordUserIdentity | undefined> {
    try {
      return (await this.discordSdk?.commands.authenticate({}))?.user;
    } catch {
      return undefined;
    }
  }

  private async tryGetParticipants() {
    try {
      return (await this.discordSdk?.commands.getInstanceConnectedParticipants())?.participants ?? [];
    } catch {
      return [];
    }
  }

  private applyDiscordUser(user?: DiscordUserIdentity | null) {
    if (!user?.id) {
      return;
    }

    this.context = {
      ...this.context,
      playerId: user.id,
      playerName: getDiscordDisplayName(user) ?? this.context.playerName,
    };
    this.notifyContextChange();
  }

  private notifyContextChange() {
    this.contextListeners.forEach((listener) => listener(this.context));
  }
}

export function createPlatformProvider(): PlatformProvider {
  return shouldUseDiscordPlatform()
    ? new DiscordPlatformProvider(import.meta.env.VITE_DISCORD_CLIENT_ID)
    : new LocalPlatformProvider();
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

function shouldUseDiscordPlatform() {
  if (import.meta.env.VITE_DISCORD_ACTIVITY === 'true') {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);

  return (
    params.get('discord') === '1'
    || params.get('discord_activity') === '1'
    || params.has('frame_id')
    || params.has('instance_id')
    || document.referrer.toLowerCase().includes('discord')
  );
}

function getDiscordDisplayName(user?: DiscordUserIdentity | null) {
  return user?.global_name ?? user?.username;
}
