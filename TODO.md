# Space Fishing TODO

## Next Task

- Use `ART_BIBLE.md` and `ASSET_PIPELINE.md` for any future generated art/audio pass.

## Active Short List

- Playtest the current loop and station panels after the Codex polish:
  - fishing feel across rarities
  - Tackle Box readability
  - My Fish Codex pagination
  - shared ship upgrades
  - zone switching
- Playtest the rough walkable ship hub controls and station proximity prompts.
- Polish walkable hub affordances:
  - better avatar readability/animation
  - clearer station interaction ranges
  - decide whether DEV should remain in the walkable floor for local builds
- Add a small pure-system test suite for rarity odds, save migration, inventory grouping, Codex discovery, and upgrade effects.
- Polish the existing first-time fishing tips after playtesting:
  - they currently explain hold/release tension during early reeling
  - they can be hidden manually and auto-retire after 3 attempts or 2 catches
  - future polish should improve wording, placement, or timing only if needed
- Tune upgrade costs and effects after the new Better Lure odds have been playtested.
- Keep Bigger Cargo enforcement deferred until the future economy/cargo loop is designed; do not enforce Tackle Box limits yet.
- Hide or environment-gate the DEV station and rarity override before public/friend testing.
- Playtest the new safe-zone movement and surge values with no upgrades and with Stronger Line levels 1, 3, and 5.
- Consider a clearer visual/audio cue for incoming surges if they feel too sudden.
- Add zone-specific visuals/audio for Nebula Drift later; it currently has zone-specific fish tables but reuses the starter fishing presentation.
- Add a short Legendary hook anticipation sequence before the fight starts:
  - screen shake, fishing hole pulse, lights flicker, low cosmic rumble, tension warning sound, and/or `Something massive is pulling...`
  - keep it around 1-2 seconds
  - presentation only, not a nerf; the Legendary fight should remain hard after the warning
- Add lightweight automated system tests for minimum catch pacing so Common/Uncommon cannot regress into instant catches.
- Later: add mobile/touch controls and test them separately from desktop iframe scaling.
- Later: do a deeper responsive layout pass for very small windows after the core desktop layout is stable.
- Later: test the GitHub Pages build inside a Discord Activity iframe once Discord SDK work begins.
- Later: add Discord/server integration after local ship hub, persistence boundaries, and shared ship loop feel stable.
  - add a DiscordPlatformProvider once the Discord SDK is introduced
  - add a scoped backend/cloud SaveProvider for per-user player state and per-guild ship state
- Later: implement the economy/cargo rework after the prototype loop is stable.
  - decide Tackle Box slot/stack/weight rules before enforcing capacity
  - design sell/donate/store/research/process/cook choices
  - decide what Bigger Cargo upgrades in the final economy
  - then update UI/save/runtime behavior together
Future audio pass:
- follow `ART_BIBLE.md`, `ASSET_PIPELINE.md`, and `AUDIO_CREDITS.md`
- replace cast sound with softer line/whoosh
- replace bite sound with clearer but not annoying cue
- replace escape sound with less harsh fail cue
- replace Legendary warning with deep cosmic rumble / ship pulse
- add volume sliders later if needed

## Deferred Design Work

- See `DESIGN_NOTES.md` for personal vs shared systems, future economy/cargo direction, future bait system, art pipeline notes, ship hub direction, Discord/multiplayer direction, and open questions.
- Future: design a bait system for choosing fishing mood, but do not implement bait until the core fishing loop and progression are stable.
- Add real Discord guild/server identity for shared ship state.
- Split local save into user/player state and guild/server ship state when backend persistence exists.
- Design a multiplayer ship hub with room/module views.
- Add ship rooms such as aquarium, cargo bay, scanner room, and reactor room.
- Replace simple station circles with final ship objects once the interaction map feels right.
- Add multiplayer crew presence around ship stations after local hub flow is solid.
- Add zone-specific fish tables and visual treatment for Nebula Drift.
- Add fish sprite/card inventory for the personal Tackle Box.
- Add fish sprites/cards to the Codex.
- Add aquarium display views for discovered fish.
- Add research rewards for Codex discoveries.
- Add collection milestones and completion rewards.
- Add zone-specific fish discovery and Codex filters.
- Add future shared Ship Codex/Aquarium for server-wide discoveries.
- Decide UI split between `My Codex` and `Ship Codex`.
- Add fish selling or trade terminal.
- Add fish processing/conversion station.
- Remove instant coin rewards from catches once the economy loop exists.
- Add cargo decisions after catching fish.
- Decide Tackle Box capacity rules before enforcing Bigger Cargo.
- Add aquarium/codex/research uses for fish.
- Create real shared Ship Cargo Bay storage.
- Add donation flow for fish/resources into ship storage or ship projects.
- Decide whether ship upgrades consume coins, resources, fish, mixed materials, or recipes.

## Recently Done

- Refactored player/game state into serializable objects and moved fishing, inventory, economy, and upgrade rules into reusable systems outside Phaser.
- Added versioned localStorage save/load/reset through a swappable save provider.
- Added 12 fish definitions across Common, Uncommon, Rare, Epic, and Legendary rarities.
- Added weighted rarity selection, Better Lure rarity bonuses, fish-specific value, flavor text, and difficulty tuning.
- Updated the minigame HUD to show hooked fish name, rarity, value, difficulty, and flavor text.
- Added an inventory panel grouped by rarity with fish name, rarity, quantity, and total value.
- Added catch result text with fish name, rarity, value earned, and flavor text in the Last Catch panel.
- Added a larger Legendary catch banner.
- Added a clearly marked dev/test rarity override button plus `L` shortcut for forcing Legendary test hooks.
- Exposed rarity weight/chance helpers from the fishing system so odds can be tested without Phaser.
- Retuned Better Lure odds and fish difficulty values for a clearer rarity ladder.
- Fixed tension control so holding raises pressure, releasing lowers pressure, and fish behavior cannot trap the marker unrecoverably outside the safe zone.
- Added comments near the tension update logic documenting the intended pressure-control loop.
- Retuned high-rarity tension speeds so Epic and Legendary fish are difficult because of timing, drain, and safe-zone size rather than one-way control failure.
- Added data-driven safe-zone drift, safe-zone wiggle, fish surge, and progress multiplier parameters to fish data.
- Added dynamic safe-zone movement and short escape surges to the fishing system.
- Adjusted Stronger Line to use rarity-based diminishing returns so hard fish remain meaningful with upgrades.
- Added `targetCatchDuration` pacing and lowered starting catch progress so Common/Uncommon fish remain easy but require interaction.
- Retuned Common, Uncommon, Rare, and Epic progress gain/drain values while preserving the Legendary movement/surge feel.
- Slightly lengthened Common and Uncommon catch pacing while keeping them chill and forgiving.
- Added a future bait-system design note without implementing bait.
- Added first local shared-ship progression state, ship upgrades, contribution spending, and a zone selector.
- Added Deep Space Scanner level 1 unlock for Nebula Drift.
- Updated saves to version 2 with player and ship state, while keeping old player-only saves loadable.
- Verified catch/save, upgrade/save, refresh/load, reset, and reset persistence in the in-app browser.
- Made catch starts more forgiving by placing the first safe zone near the starting tension marker.
- Improved minigame readability with a labeled safe zone, wider glowing tension marker, pulsing target zone, and catch-bar color feedback while tension is safe.
- Reworked the always-open dashboard into a first-pass ship hub with clickable stations and hidden contextual panels.
- Renamed the personal fish inventory station/panel from Cargo Bay to Tackle Box and documented the future economy/cargo rework.
- Added first-time fishing tips that appear during early reeling, can be hidden, and auto-retire after 3 attempts or 2 catches.

## Later

- Add ambient ship and cosmic pool sounds.
- Add bite, catch, escape, and tension feedback sounds.
- Improve responsive layout across more screen sizes.
- Add accessibility checks for text size and contrast.
- Add Discord integration only after the browser prototype loop feels good.
