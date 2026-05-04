# Discord Activity Spike Plan

This plan describes the minimum path to turn the current Space Fishing GitHub Pages build into a Discord Activity proof-of-concept. Do not add Discord SDK, backend, multiplayer, or save-format changes until a spike task explicitly starts.

References:

- [Discord Activities overview](https://docs.discord.com/developers/activities)
- [Building Your First Activity](https://docs.discord.com/developers/activities/building-an-activity)
- [How Activities Work](https://docs.discord.com/developers/activities/how-activities-work)
- [Activity networking and URL mappings](https://docs.discord.com/developers/activities/development-guides/networking)
- [Embedded App SDK reference](https://docs.discord.com/developers/developer-tools/embedded-app-sdk)

## What An Activity Means Here

In this project, a Discord Activity is the existing Phaser/Vite game running inside Discord's embedded iframe environment. The first proof-of-concept should prove that Discord can launch Space Fishing, load the canvas, initialize the Embedded App SDK, and hydrate local player/ship identity through the provider abstraction.

The first spike is not multiplayer. Treat it as "single-player Space Fishing launched inside Discord with Discord identity available."

## Developer Portal Setup

Create or reuse a Discord application for Space Fishing.

Minimum portal configuration:

- Enable Developer Mode on the Discord account used for testing.
- Create the app in the Discord Developer Portal.
- Configure installation contexts. For this project, support Guild Install for the future shared server ship direction; User Install may also be useful for quick testing in DMs or personal contexts.
- Add an OAuth2 redirect URI. Discord's tutorial uses a placeholder such as `https://127.0.0.1` for Activity-only authorization because the Embedded App SDK handles redirecting back into the Activity.
- Copy the public Client ID. The frontend will eventually use it as a Vite-exposed value such as `VITE_DISCORD_CLIENT_ID`.
- Under Activities, configure URL Mapping for the Activity host.
- Enable Activities for the app.
- Use the default Entry Point command initially unless a custom launch flow becomes necessary.

Do not commit client secrets, bot tokens, or backend credentials.

## URLs And Embedding

Current web URL:

```text
https://greedster.github.io/space-fishing/
```

GitHub Pages can probably be used for the first iframe launch spike because the game is a static Vite app over HTTPS. The main thing to verify is Discord URL Mapping behavior with a project-page path.

Likely first attempt:

- Activity URL mapping prefix: `/`
- Target: `greedster.github.io`
- Activity path: `/space-fishing/`

Risk: Discord URL mappings may be easiest when the app is served from domain root. If project-page path handling is awkward, use one of these alternatives for the spike:

- A custom domain pointed at GitHub Pages that serves Space Fishing from `/`.
- A temporary Cloudflare Pages/Netlify/Vercel deployment at domain root.
- A local tunnel for development, following Discord's local development guide.

The Vite build uses a relative base path (`./`) instead of absolute `/space-fishing/` asset URLs. This should keep GitHub Pages working while making the same static build more tolerant of Discord Activity proxy/path mappings.

## Code Changes Needed Later

Spike progress:

- `@discord/embedded-app-sdk` has been added.
- `DiscordPlatformProvider` now exists beside `LocalPlatformProvider`.
- The app reads `VITE_DISCORD_CLIENT_ID` from `import.meta.env`.
- Discord mode initializes only when iframe/query/referrer/env detection says it should.
- The provider calls `discordSdk.ready()` before reporting ready.
- A temporary bottom-left platform debug overlay shows platform, player, server/guild, channel, and ready status.

Still future work:

- Use SDK commands/events to get current user and guild/channel context.
- Map Discord user id/name to `PlayerState.playerId` and `displayName`.
- Map Discord guild/server id to `ShipState.serverId`.
- Pass the same platform context into the existing `SaveProvider` scope.
- Add a clear error/fallback state if the app is opened in Discord but SDK initialization fails.

The existing `PlatformProvider`, `PlatformContext`, and optional `SaveScope` are the intended integration points.

## Local Fallback Behavior

Keep these unchanged:

- Browser and GitHub Pages outside Discord use `LocalPlatformProvider`.
- Local player identity remains `local-player` / `Local Player`.
- Local ship/server identity remains `local-dev-ship`.
- Save provider remains `LocalStorageSaveProvider`.
- Save format remains version 2.
- LocalStorage saves remain browser-local and are not shared between testers.
- Fishing, walking, stations, Tackle Box, Codex, upgrades, zones, and ship progression behave the same outside Discord.

## First Spike Should Test

Minimum success criteria:

- Discord launches the Activity from the App Launcher/default Entry Point command.
- The iframe loads the GitHub Pages or temporary hosted Space Fishing build.
- Phaser canvas appears and is centered/scaled acceptably inside Discord.
- Embedded App SDK reaches ready state.
- The app can identify whether it is running in Discord.
- Current Discord user identity can be read and mapped into the platform context.
- Current guild/server id can be read when launched from a guild context, or the app can gracefully fall back when no guild is available.
- Local gameplay still works inside the iframe: station interaction, casting, reeling, catching, upgrades, Tackle Box, Codex, and zone selection.
- Existing non-Discord browser behavior still works.

Nice-to-have for spike:

- Confirm the temporary bottom-left debug overlay reports Discord ready status and guild/server id.
- Confirm GitHub Pages static audio files load through the Discord proxy.
- Confirm localStorage is available inside the Discord iframe, with the understanding that this is still prototype-only persistence.

## Explicitly Out Of Scope

- Multiplayer synchronization.
- Backend/cloud persistence.
- Discord bot commands beyond the default launch path.
- Server-wide authoritative ship state.
- Shared Codex/Aquarium implementation.
- Economy/cargo rework.
- Mobile/touch controls.
- Voice/chat features.
- Rich Presence polish.
- Monetization, SKUs, IAP, subscriptions, or entitlements.
- Production moderation, abuse, analytics, or observability systems.

## Risks And Questions

- GitHub Pages project path may complicate Discord URL Mapping. Verify whether `/space-fishing/` works cleanly through the Activity proxy.
- Discord Activity network traffic goes through the Discord proxy; external requests need URL mappings or SDK URL patching.
- OAuth/authentication may require a backend if the game needs trusted user or guild data. Client-provided Discord context should not be treated as authoritative for real economy or shared ship state.
- localStorage inside Discord iframe may behave differently from normal browser localStorage and should only be used for the proof-of-concept.
- The current game is desktop-focused; Discord can run Activities in mobile contexts too, but mobile/touch controls are deferred.
- Need to decide how to handle launches outside a guild, such as DMs or group DMs, when shared ship state eventually expects a guild/server id.
- Need to decide whether the first Activity app is a dev-only Discord app or the future production app.

## Recommended Implementation Order

1. Create/configure the Discord application in Developer Portal.
2. Try URL Mapping against `https://greedster.github.io/space-fishing/`.
3. If GitHub Pages path mapping is awkward, deploy the same static build to a root-hosted temporary domain.
4. Verify the current SDK detection spike inside Discord using `VITE_DISCORD_CLIENT_ID`.
5. Improve identity hydration if Discord exposes current user without backend auth, or add the required auth/backend path later.
6. Map Discord user and guild/server identity into `PlatformContext`.
7. Keep local fallback outside Discord.
8. Remove or gate the temporary platform debug overlay before friend/public testing.
9. Manually test normal browser, GitHub Pages, and Discord iframe launch.
10. Only after the spike works, design backend persistence for per-user player saves and per-guild ship saves.

## Spike Acceptance Checklist

The Discord Activity spike is considered successful when:

- The game launches from Discord.
- The Phaser canvas loads.
- The game calls Discord SDK ready successfully.
- The game can display platform = discord.
- The game can display Discord user id/name.
- The game can display guild/server id when launched from a server.
- Local browser/GitHub Pages mode still works.
- Fishing still works inside Discord.
- No backend/shared state is implemented yet.
