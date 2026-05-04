import { DiscordSDK, Events, type EventPayloadData } from '@discord/embedded-app-sdk';
import { createGameState, type GameState } from '../state/gameState';
import { createPlayerState, localPlayerId, localPlayerName } from '../state/playerState';
import { createShipState, localDevShipId } from '../state/shipState';

export type PlatformKind = 'local' | 'discord';
export type DiscordReadyStatus = 'not-discord' | 'initializing' | 'ready' | 'missing-client-id' | 'error';
export type DiscordAuthStatus = 'not-discord' | 'not-started' | 'authorizing' | 'authenticated' | 'fallback' | 'error';

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
  discordAuthStatus: DiscordAuthStatus;
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
    discordAuthStatus: 'not-discord',
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
    discordAuthStatus: 'not-started',
  };

  private discordSdk?: DiscordSDK;
  private readonly contextListeners: Array<(context: PlatformContext) => void> = [];

  constructor(
    private readonly clientId?: string,
    private readonly redirectUri = 'https://127.0.0.1',
  ) {
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
      const authenticatedUser = await this.tryHydrateAuthenticatedUser();
      const participants = await this.tryGetParticipants();
      const onlyParticipant = participants.length === 1 ? participants[0] : undefined;
      const player = authenticatedUser ?? onlyParticipant;
      const authStatus = authenticatedUser ? 'authenticated' : 'fallback';

      this.context = {
        ...this.context,
        playerId: player?.id ?? this.context.playerId,
        playerName: getDiscordDisplayName(player) ?? this.context.playerName,
        serverId: guildId ?? localDevShipId,
        guildId,
        channelId: this.discordSdk.channelId,
        instanceId: this.discordSdk.instanceId,
        discordReadyStatus: 'ready',
        discordAuthStatus: authStatus,
      };
      this.context.discordError = authenticatedUser ? undefined : this.context.discordError;
      this.notifyContextChange();
    } catch (error) {
      this.context = {
        ...this.context,
        discordReadyStatus: 'error',
        discordAuthStatus: 'error',
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

  private async tryHydrateAuthenticatedUser(): Promise<DiscordUserIdentity | undefined> {
    try {
      this.context = {
        ...this.context,
        discordAuthStatus: 'authorizing',
        discordError: undefined,
      };
      this.notifyContextChange();

      const accessToken = await this.requestDiscordAccessToken();
      const authentication = await this.discordSdk?.commands.authenticate({ access_token: accessToken });
      return authentication?.user;
    } catch (error) {
      this.context = {
        ...this.context,
        discordAuthStatus: 'fallback',
        discordError: formatDiscordAuthError(error),
      };
      this.notifyContextChange();
      return undefined;
    }
  }

  private async requestDiscordAccessToken() {
    if (!this.discordSdk || !this.clientId) {
      throw new Error('Discord SDK is not ready for auth.');
    }

    const verifier = createCodeVerifier();
    const challenge = await createCodeChallenge(verifier);
    const { code } = await this.discordSdk.commands.authorize({
      client_id: this.clientId,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify'],
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        code_verifier: verifier,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Discord token exchange failed (${tokenResponse.status}).`);
    }

    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) {
      throw new Error('Discord token response did not include an access token.');
    }

    return token.access_token;
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
    ? new DiscordPlatformProvider(import.meta.env.VITE_DISCORD_CLIENT_ID, import.meta.env.VITE_DISCORD_REDIRECT_URI)
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

function createCodeVerifier() {
  const randomBytes = new Uint8Array(48);
  window.crypto.getRandomValues(randomBytes);
  return base64UrlEncode(randomBytes);
}

async function createCodeChallenge(verifier: string) {
  if (!window.crypto.subtle) {
    throw new Error('Web Crypto PKCE support is unavailable.');
  }

  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array) {
  let value = '';
  bytes.forEach((byte) => {
    value += String.fromCharCode(byte);
  });

  return btoa(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function formatDiscordAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Discord auth failed.';
  return `Auth fallback: ${message}`;
}
