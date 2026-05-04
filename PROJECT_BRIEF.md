# Space Fishing Project Brief

## Project Summary

Space Fishing is a cozy browser prototype for a future Discord Activity game. The long-term idea is that each Discord server becomes one spaceship crew, and players relax together by fishing alien creatures from space.

The current project is intentionally scoped to a single-player browser prototype. Do not add Discord, backend, WebSockets, PostgreSQL, accounts, or multiplayer until the core loop feels good.

## Tech Stack

- Phaser 3
- TypeScript
- Vite
- Node/npm for local development

Future stack, not implemented yet:

- Discord Embedded App SDK
- Node.js backend
- WebSockets
- PostgreSQL

## Current Game State

The prototype has:

- A centered 16:9 Phaser canvas.
- A dark space background.
- A large circular ship/station hub.
- A glowing cosmic fishing pool.
- An astronaut fishing near the pool.
- Floating fish silhouettes.
- Phaser-rendered HUD inside the canvas.
- Cast button.
- Tension marker minigame.
- Labeled safe zone with a wider glowing tension marker.
- Catch progress bar.
- Last catch panel.
- Coins and cargo summary.
- Simple ship upgrade panel.

## Current Gameplay Loop

1. Player clicks `Cast`.
2. Game waits 1-4 seconds.
3. A fish bites.
4. Player holds mouse/touch to raise line tension and releases to lower it.
5. The cyan tension marker must be kept inside the labeled red safe zone.
6. Catch progress increases inside the red zone and decreases outside it.
7. Catch success grants fish, coins, rarity/value/quality feedback.
8. Coins can be spent on upgrades.

## Fish System

Current fish:

- Space Minnow: common, easy
- Jellyfish Drifter: common, slow
- Comet Koi: uncommon, tension spikes
- Void Eel: rare, unstable movement
- Black Hole Carp: legendary, hard

Each fish has:

- `id`
- `name`
- `rarity`
- `value`
- `difficulty`
- `safeZoneSize`
- `behavior`
- placeholder `color`

## Upgrade System

Current upgrades:

- Stronger Line: widens the red target zone.
- Better Lure: improves uncommon/rare/legendary fish odds.
- Bigger Cargo: updates prepared cargo capacity data, but inventory capacity is not enforced yet.

Upgrade levels start at 0. Costs increase per level. Buttons disable when the player cannot afford them. Buying subtracts coins immediately.

## Key Files

- `src/game/scenes/MainScene.ts`: main Phaser scene, HUD, fishing loop, minigame, upgrades UI.
- `src/game/data/fish.ts`: fish definitions and lookup helpers.
- `src/game/data/upgrades.ts`: upgrade definitions.
- `src/game/state/playerState.ts`: serializable player coins, caught fish, cargo capacity, and upgrades.
- `src/game/state/gameState.ts`: serializable current local game state.
- `src/game/systems/fishingSystem.ts`: fish picking, minigame state, tension updates, catch quality.
- `src/game/systems/inventorySystem.ts`: caught-fish creation and inventory updates.
- `src/game/systems/upgradeSystem.ts`: upgrade costs, levels, and effects.
- `src/game/systems/economySystem.ts`: catch value and coin helpers.
- `src/game/save/saveTypes.ts`: save envelope shape for future local/cloud saves.
- `src/game/config.ts`: Phaser config.
- `src/styles.css`: page/canvas layout.

## Design Priorities

- Cozy, vibey, relaxing, social.
- Readable before fancy.
- Shape-based placeholder art is fine.
- Keep gameplay simple and testable.
- Avoid overengineering.
- Preserve clean project structure.

## Do Not Implement Yet

- Discord SDK
- Backend
- Multiplayer
- WebSockets
- PostgreSQL
- Accounts
- Global/server leaderboard
- Full final game systems
