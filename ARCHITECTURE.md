# Space Fishing Architecture

## Current Shape

Space Fishing is a browser-only Phaser 3 prototype built with TypeScript and Vite. The current architecture keeps the local game loop working while separating reusable game rules from Phaser rendering.

## Runtime Flow

- `src/main.ts` creates the Phaser game from `src/game/config.ts`.
- `src/main.ts` redirects `127.0.0.1` to `localhost` during local development so saves use one localStorage origin.
- `src/game/config.ts` owns Phaser sizing, scaling, parent container, and scene registration.
- `src/game/scenes/MainScene.ts` owns rendering, pointer input, tweens, timers, and HUD drawing.
- `MainScene` reads and mutates a plain `GameState`, then delegates gameplay rules to systems.

## Scene UI Structure

`MainScene` now treats the ship screen as a hub instead of a dashboard. The default canvas keeps only compact HUD text, station buttons, the Cast button, and fishing meters when a fish is actively hooked.

Large UI surfaces are Phaser containers managed by a small one-panel-at-a-time modal flow in `MainScene`:

- Gear Bench -> player upgrade panel.
- Reactor Console -> shared ship upgrade panel.
- Tackle Box -> personal fish inventory panel.
- Codex -> personal fish discovery and collection panel. A future shared Ship Codex/Aquarium should be modeled separately.
- Deep Space Scanner -> zone selector panel.
- DEV -> reset save and rarity forcing controls.

The panel manager is intentionally local to the scene for now because the UI is still prototype art and layout. Game rules, save format, fish data, upgrades, ship upgrades, and zone data remain outside the scene.

## Serializable State

- `src/game/state/playerState.ts` defines `PlayerState`, caught fish, coins, cargo capacity, and upgrade levels as plain JSON-friendly data.
- `src/game/state/shipState.ts` defines `ShipState`, including local server id, ship name, ship level, shared contributed coins, ship upgrade levels, unlocked zones, active zone, and recent contribution log.
- `src/game/state/gameState.ts` defines `GameState`, including player state, cast status, active fishing session, and last catch.
- `src/game/save/saveTypes.ts` defines the versioned save envelope and provider interface.
- `src/game/save/localStorageSaveProvider.ts` implements the current local-only save/load/reset provider using `localStorage`. Save version 2 stores both `player` and `ship`; older player-only saves are normalized with a default local ship.
- The local ship uses `local-dev-ship` as a fake server id. This should later become the Discord guild/server id used by backend persistence.

## Data Config

- `src/game/data/fish.ts` defines fish ids, names, rarity order, coin value, difficulty tuning, dynamic safe-zone behavior, surge behavior, minigame behavior type, flavor text, display color, and lookup helpers.
- `src/game/data/upgrades.ts` defines upgrade config and ids.
- `src/game/data/shipUpgrades.ts` defines shared ship upgrade config and ids.
- `src/game/data/zones.ts` defines fishing zones and ship-upgrade unlock requirements.

## Reusable Systems

- `src/game/systems/fishingSystem.ts` handles weighted rarity picking, exposes rarity weight/chance helpers for tests, fish picking, fishing session creation, tension updates, dynamic safe-zone movement, fish surges, fish behavior pulls, catch quality, safe-zone checks, and active safe-zone widening.
- `src/game/systems/inventorySystem.ts` creates caught-fish records, adds them to player inventory, and summarizes inventory grouped by rarity for the HUD.
- `src/game/systems/codexSystem.ts` derives personal discovered fish, caught counts, and collection progress from existing player inventory.
- `src/game/systems/economySystem.ts` calculates catch value and coin spending helpers.
- `src/game/systems/upgradeSystem.ts` calculates upgrade cost, affordability, levels, cargo capacity, lure bonus, and rarity-scaled stronger-line bonus.
- `src/game/systems/shipSystem.ts` calculates shared ship upgrade cost, affordability, contributions, ship level, unlocked zones, and zone switching.

## Current Fish Tuning

- Fish rarity now includes Common, Uncommon, Rare, Epic, and Legendary.
- Better Lure changes the rarity weights in the fishing system while keeping Legendary hooks very rare. At level 0, Legendary is about 0.25%; at level 5, it is about 0.95%.
- Higher rarity fish are tuned with smaller safe zones, faster tension behavior, slower progress gain, and faster progress drain. The current target feel is easy Common, mildly harder Uncommon, attentive Rare, stressful but fair Epic, and very hard but possible Legendary.
- Fish data now includes `safeZoneDriftSpeed`, `safeZoneDriftRange`, `safeZoneWiggleAmplitude`, `safeZoneWiggleSpeed`, `surgeChance`, `surgeStrength`, `surgeDuration`, `targetCatchDuration`, `progressGainMultiplier`, and `progressDrainMultiplier`.
- Catch progress starts low and is capped by `targetCatchDuration` so lower-rarity fish stay easy without becoming instant catches.
- Safe-zone movement is recalculated in the fishing system every update, then clamped inside the 0..1 tension bar before progress/failure checks run.
- Stronger Line applies diminishing returns by rarity so it helps every fish but does not make Epic or Legendary catches trivial.
- The Phaser scene reads fish name, rarity, value, difficulty label, and flavor text from state/data for display only.
- `MainScene` includes a small dev/test-only rarity override button and an `L` shortcut for forcing the next hook to Legendary. This should stay local to testing until a proper debug menu exists.

## Future Plug-In Points

- Discord identity: hydrate `PlayerState.playerId` and `displayName` before scene creation.
- Discord guild identity: hydrate `ShipState.serverId` from the current guild/server id instead of `local-dev-ship`.
- Cloud save: replace `LocalStorageSaveProvider` with another `SaveProvider` implementation that persists player state per user and ship state per guild/server.
- Multiplayer sync: share `GameState` or selected `FishingSessionState` snapshots through a later session transport.
- Shared Codex: later add server/ship-level discovery tracking separately from the current personal Codex, likely surfaced as `Ship Codex` or `Ship Aquarium`.

Do not add Discord SDK, backend, WebSockets, accounts, multiplayer, PostgreSQL, or persistence until the single-player loop feels good.
