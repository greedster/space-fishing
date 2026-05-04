# Space Fishing Session Handoff

## Current Status

The prototype is running as a Phaser/Vite browser game at:

```text
http://localhost:5173
```

The current playable loop works:

- Cast.
- Wait for bite.
- Hold/release to move the cyan tension marker.
- Keep marker in red target zone.
- Catch progress rises in the zone and drains outside it.
- Catch progress starts low, so every catch needs at least a short playable moment.
- Holding input raises line tension; releasing input lowers line tension.
- Overshooting above the red zone is recoverable by releasing, and dropping below it is recoverable by holding.
- Fish rarity/difficulty is data-driven. Higher-rarity fish have smaller zones, dynamic safe-zone drift/wiggle, harsher drain, and short escape surges.
- Fishing zones now have data-driven fish tables. Cosmic Pool is the cozy starter pool; Nebula Drift has more uncommon/rare/epic zone-specific fish and access to the Legendary target.
- The local shared ship can be upgraded with personal coins.
- Deep Space Scanner Lv 1 unlocks Nebula Drift, which can be selected as the active fishing zone.
- The default screen is now a ship hub with contextual stations instead of an always-open dashboard.
- A small player avatar can walk around the ship interior with WASD or arrow keys.
- Nearby stations show a `Press E` prompt; pressing `E` opens panels for regular stations and casts at the Fishing Hole.
- The Cast button is only visible/active when the avatar is near the Fishing Hole, except while fishing is already waiting/reeling.
- A small `? Help` button opens controls/prototype notes. It also opens automatically once per browser profile using a standalone localStorage flag.
- First-time fishing hints appear near the tension bars for early attempts, explaining hold/release and the safe zone. They can be hidden manually and auto-retire after 3 attempts or 2 catches using a standalone localStorage flag.
- Successful catches award instant prototype coins.
- Coins can buy personal player upgrades and can also be contributed/spent on shared ship upgrades.
- Hooked fish now show name, rarity, value, difficulty, and flavor text during the minigame.
- Successful catch results show fish name, rarity, earned value, and flavor text.
- Personal fish inventory is opened from the Tackle Box station and grouped by rarity.
- The Codex station opens `My Fish Codex`, a personal fish discovery/collection log derived from the player's Tackle Box.
- `My Fish Codex` uses paginated text cards: four fish per page, with discovered/undiscovered visual states and collection progress.
- Current instant fish-to-coins behavior is temporary prototype behavior; the future economy should make fish items/cargo first.
- Inventory/capacity enforcement is intentionally deferred. Do not enforce Tackle Box limits or change catch storage until the future economy/cargo loop is designed.
- Future economy/cargo, bait, art pipeline, ship hub, Discord/multiplayer direction, and open design questions are captured in `DESIGN_NOTES.md`.
- `ART_BIBLE.md` and `ASSET_PIPELINE.md` now define the visual direction and asset workflow. Future generated fish, ship, UI, and audio assets should follow them.
- Current audio files are procedurally generated placeholders credited in `AUDIO_CREDITS.md`; several sounds should be replaced or intentionally reworked in a later audio pass.
- Discord-ready provider seams now exist without Discord SDK/backend/multiplayer:
  - `LocalPlatformProvider` supplies local player and local ship/server identity
  - `SaveProvider` accepts an optional identity scope while localStorage behavior and save version remain unchanged
- Desktop scaling uses a fixed 1280x720 Phaser coordinate space with `Scale.FIT`; page CSS now caps the displayed canvas at native size and fits it down for smaller desktop/iframe windows to avoid blurry oversized text.
- `DISCORD_ACTIVITY_PLAN.md` documents the minimum Discord Activity proof-of-concept plan, including Developer Portal setup, URL mapping, GitHub Pages feasibility, SDK integration points, local fallback behavior, risks, and implementation order.

## Recent Changes

- Refactored core rules out of `MainScene.ts` into reusable systems:
  - `src/game/systems/fishingSystem.ts`
  - `src/game/systems/upgradeSystem.ts`
  - `src/game/systems/inventorySystem.ts`
  - `src/game/systems/economySystem.ts`
- Added serializable state shapes:
  - `src/game/state/playerState.ts`
  - `src/game/state/gameState.ts`
  - `src/game/save/saveTypes.ts`
- Added local save/load/reset:
  - `src/game/save/localStorageSaveProvider.ts`
  - Versioned save envelope with `saveVersion: 1`
  - Auto-loads player progress on startup
  - Saves after successful catches and upgrade purchases
  - Saves on page hide/close when the player has progress
  - Redirects `127.0.0.1` to `localhost` so local saves use one browser origin
  - Reset Save button clears local progress for testing
- Added lightweight Discord-ready provider boundaries:
  - `src/game/platform/platformProvider.ts`
  - local context returns `local-player`, `Local Player`, and `local-dev-ship`
  - new local sessions hydrate initial player/ship identity from the platform provider
  - existing saves still load through the same localStorage key and save envelope
  - no Discord SDK, backend, multiplayer, or save format change was added
- Added a focused desktop/embedded scaling pass:
  - the game still renders in a stable 1280x720 internal layout
  - the page wrapper centers the canvas and caps display size at 1280x720
  - smaller desktop/iframe windows fit the canvas down while preserving 16:9
  - Help notes that mobile/touch controls are not fully supported yet
- Tuned the early catch feel so the first safe zone starts near the initial tension marker and catch progress is more forgiving.
- Moved upgrade definitions into `src/game/data/upgrades.ts`.
- `MainScene.ts` now focuses on Phaser rendering, input, timers, and HUD updates while systems own fishing, economy, inventory, and upgrade rules.
- Replaced the old filling tension bar with a moving cyan marker.
- Red target zone is now the minigame target.
- Catch progress increases only inside the red zone and decreases outside it.
- Added live percentage labels for tension and catch progress.
- Added fish rarity and difficulty label during the minigame.
- Expanded fish data to 12 fish:
  - 4 Common
  - 3 Uncommon
  - 2 Rare
  - 2 Epic
  - 1 Legendary
- Added fish-specific coin values, flavor text, safe-zone size, tension speed, progress gain, and progress drain.
- Added weighted rarity selection in the fishing system, with Better Lure improving odds for Uncommon, Rare, Epic, and Legendary fish while keeping Legendary very rare.
- Added zone-specific fish tables:
  - Cosmic Pool shares starter Common fish and mostly Common/Uncommon catches.
  - Nebula Drift adds zone-specific Prism Puffer, Mistwhale Fry, Ion Seahorse, and Nebula Seraph, plus stronger rare/epic/legendary access.
  - Hook selection uses current zone, zone fish ids, existing rarity odds, Better Lure bonuses, and zone rarity modifiers.
  - If a rolled rarity is absent in the current zone, the picker falls back to a nearby available rarity in that zone.
- Exposed rarity weight/chance helpers from `fishingSystem.ts` so fish odds can be covered by pure TypeScript tests later.
- Retuned Better Lure from level 0 to 5:
  - Level 0 odds are approximately Common 74%, Uncommon 19%, Rare 5.4%, Epic 1.35%, Legendary 0.25%.
  - Level 5 odds are approximately Common 48%, Uncommon 32.4%, Rare 13.2%, Epic 5.5%, Legendary 0.95%.
- Retuned fish difficulty so Common is forgiving, Uncommon slightly harder, Rare attentive, Epic stressful but fair, and Legendary very hard but possible.
- Fixed the tension control loop in `fishingSystem.ts`:
  - player input now owns the main direction of tension movement
  - hold increases tension
  - release decreases tension
  - fish behavior is a recoverable disturbance rather than a force that can overpower release forever
  - tension remains clamped between 0 and 1
- Retuned high-rarity tension speeds so Epic and Legendary fish remain hard but controllable.
- Added fish data fields for safe-zone drift, safe-zone wiggle, surge chance/strength/duration, and progress gain/drain multipliers.
- Added `targetCatchDuration` to fish data and capped perfect-play progress gain against that duration.
- Added dynamic safe-zone movement in `fishingSystem.ts`:
  - Common fish barely drift.
  - Uncommon fish drift slowly.
  - Rare fish drift farther.
  - Epic fish drift, wiggle, drain faster, and can surge.
  - Legendary fish drift/wiggle aggressively and has stronger surges.
- Added escape surges as short smooth tension pushes away from the safe zone, with cooldowns so they are reactive moments rather than unfair random jumps.
- Adjusted Stronger Line to use rarity-based diminishing returns:
  - Common gets full bonus.
  - Uncommon gets 85%.
  - Rare gets 65%.
  - Epic gets 45%.
  - Legendary gets 28%.
- Retuned catch pacing:
  - Common targets roughly 3-5 seconds.
  - Uncommon targets roughly 5-8 seconds.
  - Rare targets roughly 8-12 seconds.
  - Epic targets roughly 12-18 seconds.
  - Legendary targets roughly 20-35 seconds and keeps its current movement/surge feel.
- Lowered starting catch progress from 32% to 12% so easy fish are no longer nearly complete at bite start.
- Retuned Common, Uncommon, Rare, and Epic gain/drain values; Legendary behavior was preserved aside from the shared pacing cap.
- Slightly lengthened Common target durations to about 4.2-5.2 seconds and Uncommon target durations to about 6.6-8 seconds so easy catches remain cozy but less automatic.
- Discussed a future bait system for choosing fishing mood:
  - Basic bait for cozy/common-heavy play.
  - Better bait for progression-focused uncommon/rare fishing.
  - Legendary bait for high-risk/high-reward attempts.
- Bait was intentionally deferred. No bait UI, bait inventory, bait economy, or bait data has been added; current focus remains the core fishing loop and progression.
- Added grouped inventory HUD rows with fish name, rarity, caught quantity, and total value.
- Added catch result feedback in the Last Catch panel with value earned and flavor text.
- Added a larger Legendary catch banner.
- Added a short Legendary hook warning presentation before the fight starts:
  - only Legendary hooks trigger it, including dev-forced Legendary hooks
  - the warning shows anticipation text, pulses the fishing core/bobber, shakes the camera, and plays the existing Legendary warning sound
  - the active fishing session is not created until the warning ends, so no escape/progress/balance changes happen during the presentation
- Added a small `DEV rarity` test button that cycles a sticky forced-rarity mode through rarities and back to normal.
- Added `L` as a dev/test shortcut to keep forcing Legendary hooks until the mode is changed back to Normal.
- Added first shared ship progression pass:
  - `ShipState` stores `serverId`, ship name, ship level, shared contributed coins, upgrade levels, unlocked zones, current zone, and recent contribution log.
  - `serverId` is currently `local-dev-ship`, a local stand-in for a future Discord guild/server id.
  - Ship upgrades are Reactor Upgrade, Cargo Bay Upgrade, and Deep Space Scanner.
  - Personal coins can be spent on ship upgrades.
  - Deep Space Scanner Lv 1 unlocks Nebula Drift.
  - Zone selector supports Cosmic Pool and Nebula Drift, with locked-zone text before scanner unlock.
- Added a first ship hub/contextual UI pass:
  - Gear Bench opens player upgrades.
  - Reactor Console opens shared ship upgrades.
  - Tackle Box opens personal fish inventory.
  - Codex opens discovered fish and collection progress.
  - Deep Space Scanner opens zone selection.
  - DEV opens reset save and rarity-forcing tools.
  - Fishing Hole focuses the casting area.
  - Only one large panel is visible at a time.
  - Tension and catch meters are hidden unless a fish is actively hooked.
  - Last Catch moved from a permanent panel to a temporary toast.
- Added a first rough walkable ship interaction pass:
  - a small avatar moves around the circular ship floor with WASD or arrow keys
  - movement is clamped to a walkable ring inside the visible ship interior, outside the central fishing core
  - nearby ship stations show a `Press E` interaction prompt
  - pressing `E` opens regular station panels, while Fishing Hole casts directly
  - Spacebar also applies fishing tension during the minigame
  - clicking stations still works
  - opening a large panel or actively fishing pauses avatar movement
  - the Cast button is gated by Fishing Hole proximity
- Added a small Help / Controls panel:
  - explains movement, station interaction, casting, and fishing tension controls
  - lists current stations and their purpose
  - notes that saves are local-only, visuals are placeholder, economy is temporary, and Discord/multiplayer is not implemented
  - opens automatically once using `space-fishing-help-seen-v1`, separate from the game save format
- Renamed the current player fish inventory from Cargo Bay to Tackle Box. Future Ship Cargo Bay should be shared server/ship storage instead.
- Documented the future economy/cargo rework:
  - instant catch coins are temporary
  - final flow should be catch fish -> personal inventory -> sell/donate/store/research/process/cook
  - Tackle Box is personal storage; future Ship Cargo Bay should be shared server/ship storage
  - Bigger Cargo enforcement is deferred until slot/stack/weight/material rules are designed
  - no economy rework or save data change was implemented
- Added first Fish Codex / Collection pass:
  - Codex lists every fish from `src/game/data/fish.ts`.
  - Discovered entries are derived from caught fish in the player's Tackle Box.
  - Undiscovered entries show as `???` with simple hints.
  - Total discovered and per-rarity progress are shown.
  - First-time catches show a `New Codex Entry!` toast.
  - No save schema changes were made.
- Polished the first Codex panel from a raw text dump into paginated text cards:
  - four fish are shown per page
  - all 12 fish are reachable with Prev/Next
  - discovered entries are brighter and show count/value/flavor
  - undiscovered entries are dimmer and show hints
  - entries no longer overflow past the panel bottom
- Clarified Codex scope:
  - current Codex is personal only
  - no shared/server-wide Codex has been implemented
  - future Discord version may add a shared Ship Codex/Aquarium
  - future UI may separate `My Codex` and `Ship Codex`
- Save envelope moved to version 2 and now persists both player and ship state. Version-1 player-only saves migrate by creating a default local ship.
- `SaveProvider` accepts an optional identity scope for future per-player/per-guild persistence. `LocalStorageSaveProvider` ignores the scope for now so existing local saves keep working.
- Added save migration fallback for older caught fish entries that do not have flavor text yet.
- Added upgrade panel:
  - Stronger Line
  - Better Lure
  - Bigger Cargo
- Added documentation:
  - `README.md`
  - `GAME_DESIGN.md`
  - `DESIGN_NOTES.md`
  - `ART_BIBLE.md`
  - `ASSET_PIPELINE.md`
  - `ROADMAP.md`
  - `NOTES.md`
  - `PROJECT_BRIEF.md`
  - `ARCHITECTURE.md`
  - `TODO.md`
  - `SESSION_HANDOFF.md`
- Added `DESIGN_NOTES.md` as a place for deferred design direction and open questions. Read it before major new features.
- Added `ART_BIBLE.md` and `ASSET_PIPELINE.md` to lock the cozy cosmic visual style, fish/ship/UI asset rules, prompt templates, acceptance checklist, and audio replacement guidance.

## Verification Done

- `npm run build` passes.
- MCP browser visual checks after the refactor confirmed:
  - Phaser canvas is visible.
  - Cast enters waiting and bite/minigame states.
  - Fish name, rarity, and difficulty display during reeling.
  - Red target zone displays.
  - Catch progress updates.
  - Failed catches return to the result state and allow another cast.
  - Upgrade panel renders and unaffordable buttons stay disabled at 0 coins.
- MCP browser save/load checks confirmed:
  - A successful catch persisted coins and inventory.
  - Buying Stronger Line saved spent coins and upgrade level.
  - Refreshing restored coins, inventory, last catch, and upgrade level.
  - Reset Save cleared local progress.
  - Refreshing after reset stayed at 0 coins, 0/10 cargo, and level 0 upgrades.
  - Opening `http://127.0.0.1:5173/` redirects to `http://localhost:5173/`.
- Previous MCP checks before the architecture refactor confirmed successful catches, coin awards, and upgrade purchases.
- The minigame shows a labeled safe zone, a wider glowing cyan marker, pulsing target zone, and green catch progress feedback while tension is safe.
- `npm run build` passes after the architecture refactor.
- `npm run build` passes after local save/load and catch-forgiveness tuning.
- `npm run build` passes after fish rarity, difficulty, and value data expansion.
- `npm run build` passes after the inventory, catch result, dev rarity helper, Better Lure odds, and difficulty tuning pass.
- `npm run build` passes after the recoverable tension-control fix.
- `npm run build` passes after the dynamic safe-zone, surge, and Stronger Line scaling pass.
- `npm run build` passes after the catch-duration pacing pass.
- `npm run build` passes after the shared ship progression pass.
- `npm run build` passes after the ship hub/contextual UI pass.
- A deterministic simulation confirmed Common, Rare, Epic, and Legendary recover from high overshoot back into the safe zone on release and recover from low undershoot back into the safe zone on hold.
- In-app browser check confirmed the updated app reloads, the dev Legendary force path still works, and low-tension Legendary failure still occurs when the player does not apply tension.
- In-app browser check after the dynamic behavior pass confirmed the app reloads, forced Legendary starts, the Legendary safe zone is visibly small, and there were no warning/error console logs.
- In-app browser check after the pacing pass confirmed the app reloads and has no warning/error console logs.
- In-app browser check after ship progression confirmed:
  - old local player save loaded with a default local ship
  - Deep Space Scanner upgrade spent personal coins
  - shared contribution total and scanner level updated
  - Nebula Drift unlocked
  - switching to Nebula Drift persisted after refresh
  - casting still enters the fishing minigame after switching zones
- MCP browser check after the fish expansion confirmed the local app tab loads at `http://localhost:5173/`, accepts a cast click, and reports no browser console warnings or errors. Screenshot capture timed out in the browser plugin during this pass, so visual verification should be repeated next session.

## Known Rough Edges

- Saves are localStorage-only for now; the provider boundary is ready for a later cloud/Discord-backed save.
- Old saves made under `127.0.0.1` cannot be read from `localhost` because browsers isolate localStorage by origin.
- Multiplayer and Discord identity are only documented plug-in points.
- The red/safe zone is clearer now, but still needs playtesting for first-time readability.
- Harder fish now have smaller red zones and stronger tension/progress tuning, but the exact balance still needs playtesting.
- Some harder or rarer fish may later have moving red zones.
- Catch tuning is more forgiving now, but still needs a dedicated feel pass.
- Browser automation could not perform a clean sustained mouse hold for full manual recovery testing, so hands-on player testing should still verify hold/release feel directly.
- New drift/surge values are first-pass tuning and should be hand-playtested across several catches.
- Common/Uncommon target durations are data-driven estimates; hand testing should confirm they feel chill but no longer automatic.
- Ship hub UI is a first pass with simple station circles and modal panels; it still needs hand playtesting for spacing and click affordance.
- Walkable movement is intentionally rough: there is no pathfinding, collision with station objects, avatar animation, room transitions, or multiplayer presence yet.
- Nebula Drift currently reuses existing visuals/audio, but now has its own fish table and zone-specific fish. Zone-specific presentation should come later.
- Bigger Cargo only updates capacity data; inventory limit is not enforced yet. Treat it as placeholder until the future cargo/inventory rework, and do not implement limits before the economy decisions are made.
- Upgrade UI is functional but visually basic.
- The `DEV` station and rarity override are intentionally available for local testing and should be hidden or environment-gated before public/friend testing.
- Inventory shows up to three fish rows per rarity group to fit the current HUD.
- Coin rewards are still granted instantly on catch for prototype speed; this should be removed when selling/processing/research/storage decisions exist.
- Current Tackle Box is personal player storage. A future Ship Cargo Bay should be shared per Discord server/ship.
- Codex is paginated and text-only for now; future sprites, richer cards, rarity/zone filters, rewards, `My Codex` / `Ship Codex`, and aquarium display are still TODO.

## Recommended Next Steps

Before major new features, read `DESIGN_NOTES.md` alongside `GAME_DESIGN.md`, `ARCHITECTURE.md`, `TODO.md`, and this handoff.

1. Use `ART_BIBLE.md` and `ASSET_PIPELINE.md` before generating or accepting new fish, ship, UI, or audio assets.
2. Playtest the pressure-control minigame by hand:
   - catch progress rate
   - drain rate
   - tension rise/fall speed
   - failure timers
   - recovery after overshooting right
   - recovery after falling too far left
3. Playtest shared ship progression:
   - upgrade cost pacing
   - contribution feedback
   - zone selector readability
   - persistence after refresh
4. Playtest the ship hub flow:
   - open and close every station panel
   - make sure only one large panel is visible
   - confirm the default screen feels like a ship hub, not a dashboard
5. Playtest and polish the rough walkable ship hub:
   - avatar readability
   - station interaction ranges
   - Cast visibility near the Fishing Hole
   - whether DEV should remain in the walkable floor for local builds
6. Add pure-system tests for:
   - `getRarityWeights`
   - `pickRarity`
   - inventory grouping
   - Codex discovery derived from inventory
   - save normalization
   - ship upgrade unlocks
7. Later: Discord/server integration:
   - add a Discord platform provider
   - add a scoped backend/cloud save provider
   - map Discord guild/server id to `ShipState.serverId`
8. Later: economy/cargo rework.

## Testing Notes

- Inventory persistence: catch any fish, confirm it appears under its rarity in the Tackle Box panel, refresh `http://localhost:5173`, and confirm coins, Last Catch, and inventory rows reload from localStorage.
- Provider seam testing: reset save in local mode, refresh, and confirm a new local profile starts as `local-player` / `Local Player` on `local-dev-ship`; then catch or upgrade and confirm localStorage persistence still works after refresh.
- Legendary testing: click `DEV rarity` until it reads `Legendary`, or press `L`, then cast. Every hooked fish will stay Legendary until `DEV rarity` is cycled back to `Normal`.
- Stronger Line testing: use existing saves/coins or catch fish to buy levels, then force Legendary with `L`. Compare level 0 versus upgraded safe-zone size; it should help, but the safe zone should still move and surge enough to demand attention.
- Rarity pacing testing: click `DEV rarity` to cycle Common, Uncommon, Rare, Epic, Legendary, and Normal. The selected rarity persists across catches, which makes repeated tuning passes easier. Stronger Line should make aiming easier but should not make the progress bar complete without active input.
- Ship persistence testing: spend coins on a ship upgrade, refresh `http://localhost:5173`, and confirm ship level, shared contributions, upgrade level, and current zone reload.
- Nebula Drift testing: buy Deep Space Scanner Lv 1, click `Nebula Drift`, refresh, and confirm Nebula Drift remains selected. Cast after switching to confirm fishing still works.
- Zone fish testing: use `DEV rarity` to force repeated Common/Uncommon/Rare/Epic/Legendary hooks in Cosmic Pool and Nebula Drift. Cosmic Pool should mostly return starter/shared fish and gracefully fall back if Epic/Legendary is forced. Nebula Drift should surface zone-specific fish such as Prism Puffer, Mistwhale Fry, Ion Seahorse, and Nebula Seraph. Scanner should show current zone description and discovered/available fish count.
- Ship station testing: click Gear Bench, Reactor Console, Tackle Box, Codex, Deep Space Scanner, and DEV. Confirm each opens its panel, the `X` close button hides it, and opening a second station hides the first.
- Walkable interaction testing: use WASD or arrow keys to move the avatar around the ship ring. Confirm the avatar cannot enter the central fishing core. Walk near Gear Bench, Reactor Console, Tackle Box, Codex, Deep Space Scanner, and DEV; confirm the `Press E to open ...` prompt appears, pressing `E` opens the matching panel, movement stops while the panel is open, and movement resumes after closing it.
- Fishing-hole proximity testing: walk away from the Fishing Hole and confirm the Cast button disappears or cannot start a cast. Walk back near the Fishing Hole and confirm `Press E to Cast` appears, Cast appears, pressing `E` starts waiting for a bite, and the existing fishing minigame still behaves the same. During reeling, confirm mouse hold and Spacebar both apply tension and avatar movement remains locked until the catch ends.
- Help panel testing: click `? Help` and confirm controls, stations, and prototype notes are readable. In a fresh browser/localStorage profile, confirm it opens once automatically, then closes with `X` or `Got it` and does not reopen automatically afterward.
- Scaling testing: test a normal desktop window, a large/fullscreen desktop window, and a narrower browser or iframe-sized window. Confirm the canvas stays centered, does not scale past 1280x720, text is not obviously blurry, and panels/station prompts remain usable.
- First-time fishing hint testing: in a fresh localStorage profile, cast and confirm a compact tip appears above the fishing meters. Confirm `Hide tips` removes it, or that it stops appearing after 3 fishing attempts or 2 successful catches.
- Fishing hub testing: click Fishing Hole or Cast, then cast as usual. Confirm tension/catch meters appear only during reeling, and a successful catch shows the temporary Last Catch toast.
- Codex testing: open Codex and confirm fish already in Tackle Box are discovered while uncaught fish are `???`. Use Prev/Next to confirm all 12 fish are reachable and entries stay inside the panel. Catch a fish already discovered and confirm no new-entry toast. Force a rarity/fish that has not been caught yet, catch it, and confirm `New Codex Entry!` appears. Refresh and confirm Codex discovery is still correct because it is derived from inventory.

## Useful Commands

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

Build:

```bash
npm run build
```

## Important Environment Note

On this machine, Node/npm may need the real Node path before the Codex app alias:

```powershell
$env:Path='C:\Program Files\nodejs;' + $env:Path
```

Then run npm commands normally.
