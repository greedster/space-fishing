# Space Fishing Design Notes

This file captures deferred ideas, design direction, and open questions. Keep `TODO.md` focused on actionable tasks; use this file for future systems and decisions that should not be forgotten.

## Core Vision

Space Fishing is a cozy Discord space-fishing game. Fishing is the core minigame, but the shared ship is the long-term social and progression layer.

The game should feel like a vibe game: players return to a cozy ship, interact with physical stations, collect strange fish, and contribute to shared progress. Avoid drifting back into dashboard or spreadsheet UI where every system is visible at once.

## Personal vs Shared Systems

- Tackle Box: personal player fish inventory.
- Cargo Bay: future shared ship/server storage.
- My Fish Codex: personal fish discoveries derived from the player's Tackle Box.
- Ship Codex / Aquarium Codex: future shared server discoveries across the whole ship.

Future UI may separate `My Codex` and `Ship Codex`, especially once Discord guild/server state exists.

## Future Economy / Cargo Rework

Current instant fish-to-coins rewards are temporary prototype behavior for testing. The final direction should make fish items/cargo first.

Future flow:

1. Catch fish.
2. Fish enters personal inventory / Tackle Box.
3. Player chooses what to do with the fish.
4. That choice creates coins, resources, ship progress, research progress, buffs, or storage.

Possible fish uses:

- Sell at a market or trade terminal for coins.
- Donate to ship projects.
- Store in the shared Ship Cargo Bay.
- Submit to Codex, Aquarium, or research systems.
- Process into materials.
- Cook/use for temporary buffs.

Player upgrades and ship upgrades may eventually require coins, resources, fish, materials, or mixed recipes instead of only instant catch coins.

`Bigger Cargo` currently only increases a capacity value and does not enforce an inventory limit. Treat it as placeholder/non-enforced until the cargo and inventory rework decides whether capacity limits, shared cargo storage, fish item stacks, or a rename make the most sense.

## Future Bait System

Bait should be a player intent selector, not a catch difficulty modifier.

- Basic bait: cozy, common-heavy fishing.
- Better bait: progression-focused fishing with better odds for uncommon/rare fish.
- Legendary bait: high-risk/high-reward fishing for intense Epic/Legendary attempts.

Bait should affect hook odds and session intent. It should not make the minigame controls easier or harder by itself.

## Future Legendary Hook Presentation

When a Legendary fish bites, add a short anticipation sequence before the fight begins. This should make the moment feel massive and rare without making the fight easier.

Possible effects:

- Screen shake.
- Fishing hole pulse.
- Ship lights flicker.
- Low cosmic rumble.
- Line snap or tension warning sound.
- Text such as `Something massive is pulling...`

The warning should be short, around 1-2 seconds. It is presentation and anticipation only, not a nerf. After the warning, the Legendary fight should stay hard, tense, and memorable.

## Fish Art Direction / Asset Pipeline Notes

The game needs a coherent art bible before generating or adding production assets. Avoid inconsistent generated assets and obvious AI slop.

Preferred direction:

- Stylized cozy cosmic fish, not realistic/painterly fish.
- Gameplay sprites/icons should be readable, simple, and consistent at small sizes.
- Codex/card art can be more detailed than in-game sprites.
- Rarity should be readable through color, silhouette, and framing.
- Assets need real transparency; avoid baked checkerboard backgrounds.

Future asset pipeline should define sprite sizes, card sizes, transparent PNG requirements, animation frame layout, naming conventions, and import paths.

## Ship Hub Direction

Current panels and station circles are temporary. The long-term ship should feel like a place players inhabit.

Stations should become physical interactable ship objects:

- Fishing Hole
- Gear Bench
- Reactor
- Scanner
- Tackle Box
- Codex
- Future Cargo Bay

Panels should open contextually from stations. They should not all be visible by default. Long-term, the hub may become walkable, with player avatars and room/module views.

The current DEV station and rarity-forcing controls are useful for local testing, but they should be hidden, gated by environment, or moved into a proper debug menu before public/friend testing.

## Zone Presentation

Nebula Drift currently has zone-specific fish tables and unlock progression, but it reuses the starter fishing visuals and audio. Later zone work should add distinct visual and audio treatment for zones without changing the core fishing rules prematurely.

## Discord / Multiplayer Direction

Future Discord integration should map one Discord server/guild id to one shared ship.

Potential Discord-facing features:

- Shared ship state per guild/server.
- Bot posts for catch milestones and ship upgrade milestones.
- Multiplayer/walking ship hub later.
- Shared server goals, aquarium, and leaderboards.

Backend persistence will be required before real Discord/server state. Local `local-dev-ship` should remain a stand-in only.

## Open Questions

- What should be personal vs shared?
- How should fish selling and donating work?
- Should ship upgrades consume coins, resources, fish, or mixed materials?
- Should Codex be personal only, shared only, or both?
- How much multiplayer is needed for beta?
- How many ship rooms are needed before the ship feels like the main ownership layer?
- What is the minimum viable art style that feels intentional without requiring a full art production pass?
