# Space Fishing Game Design

## Core Vision

Space Fishing is a chill multiplayer Discord Activity game where each Discord server eventually becomes one spaceship crew. The prototype is currently single-player and browser-only, focused on finding a cozy, readable fishing loop before adding Discord, backend, or multiplayer.

## Player Fantasy

Players are astronauts relaxing aboard a shared ship, casting into a glowing cosmic pool and pulling strange alien fish out of space. The feeling should be calm, social, slightly mysterious, and rewarding without becoming stressful.

## Current Gameplay Loop

1. The player starts in a circular spaceship fishing hub.
2. The player clicks `Cast`.
3. After a short random delay, a fish bites.
4. The player holds and releases mouse/touch input to manage line tension.
5. Keeping tension in the target zone builds catch progress.
6. A successful catch currently awards coins, shows a catch result with fish name, rarity, value earned, and flavor text, then adds the fish to the local inventory summary.
7. Coins can be spent on personal player upgrades and can also be contributed/spent on shared ship upgrades.

## Fishing Minigame

The current minigame uses a horizontal line tension meter:

- Holding mouse/touch applies pressure and raises the tension marker.
- Releasing removes pressure and lowers the tension marker.
- A red target zone appears on the tension meter.
- The target zone is labeled as the safe zone and pulses subtly for readability.
- Catch progress increases while the marker is inside the red zone.
- Catch progress decreases while the marker is outside the red zone.
- If progress drains to zero, the fish escapes.
- If tension stays too high or too low for too long, the catch fails.

The intended feel is a pressure-control minigame: too low tension lets the fish slip away, safe tension builds catch progress, and too high tension strains the line. The player should constantly feather input with short holds and releases. Fish behavior can wobble the pressure, but the basic control loop must stay recoverable: releasing after overshooting moves the marker left, and holding after undershooting moves it right.

Every fish should now create a small playable moment. Catches start with low progress, and each fish has a target catch duration that caps perfect-play progress gain so low-rarity fish cannot complete instantly.

Fish rarity now also changes the red safe zone itself:

- Common fish have very small, slow drift so the player can learn the mechanic.
- Uncommon fish drift slowly and readably.
- Rare fish drift farther and ask for steadier correction.
- Epic fish combine drift, wiggle, harsher progress drain, and occasional small escape surges.
- Legendary fish have the most aggressive drift/wiggle and stronger surges, but movement is still smooth and clamped inside the tension bar.

Surges are short pushes in the fish's escape direction. They do not teleport the safe zone or permanently override player control; they create a brief reaction moment, then normal pressure control resumes.

This feels clearer than a filling tension bar, but still needs tuning for readability, forgiveness, and fish-specific behavior.

## Fish Types and Rarity

Current prototype fish are defined in `src/game/data/fish.ts` instead of the Phaser scene. Each fish has an id, name, rarity, coin value, catch difficulty values, flavor text, behavior type, and placeholder color.

Current rarity spread:

- Common: Space Minnow, Moon Guppy, Jellyfish Drifter, Orbital Sardine.
- Uncommon: Comet Koi, Nebula Betta, Solar Flare Fin.
- Rare: Void Eel, Aurora Ray.
- Epic: Quasar Lionfish, Cosmic Manta.
- Legendary: Black Hole Carp.

When a bite starts, the fishing system selects a rarity using weighted odds, then chooses a fish from that rarity. Better Lure shifts noticeable weight away from Common fish and toward Uncommon, Rare, Epic, and Legendary fish. Legendary fish remain extremely rare in normal play: about 0.25% at Better Lure level 0 and about 0.95% at level 5.

Fishing zones now define their own fish tables. Cosmic Pool is the cozy starter pool with mostly shared Common and Uncommon fish, while Nebula Drift adds stranger zone-specific Uncommon, Rare, and Epic fish plus access to the Legendary target. Hook selection combines the current zone's fish list, the existing rarity odds, Better Lure bonuses, and small zone rarity modifiers. If a rarity is rolled but that rarity is not present in the current zone, the picker falls back to a nearby available rarity in that zone.

Higher rarity fish are harder through smaller target zones, faster recoverable tension movement, slower catch progress gain, and faster catch progress drain. Common fish are forgiving, Uncommon fish ask for light timing, Rare fish require steady correction, Epic fish should feel stressful but fair, and Legendary fish are very hard without being impossible. During the minigame, the HUD shows the hooked fish name, rarity, value, simple difficulty label, and flavor text so rare hooks feel more meaningful.

Current target catch-duration ladder for good play:

- Common: about 3-5 seconds.
- Uncommon: about 5-8 seconds.
- Rare: about 8-12 seconds.
- Epic: about 12-18 seconds.
- Legendary: about 20-35 seconds.

Better Lure only changes which rarity/fish bites; it should not make the catch easier. Stronger Line widens the safe zone but should not remove the need to play, even on Common and Uncommon fish.

The prototype includes a small `DEV rarity` button and an `L` keyboard shortcut for testing. The button cycles a sticky forced-rarity mode through Common, Uncommon, Rare, Epic, Legendary, then back to Normal odds; `L` switches the mode to Legendary. These are marked as dev/test controls and do not affect normal fishing once returned to Normal.

## Coins and Progression

The current prototype grants coins instantly when a fish is caught. This is temporary behavior for fast testing; the future economy should make fish enter inventory first, then let the player sell, donate, process, research, or store them. Catch quality affects the current prototype coin value:

- Messy Catch
- Clean Catch
- Perfect Catch

Coins and caught fish are saved locally through a versioned localStorage save provider. Coins can currently be spent on personal player upgrades:

- Stronger Line: widens the red target zone, making fishing more forgiving.
- Better Lure: improves odds for uncommon, rare, epic, and legendary fish.
- Bigger Cargo: increases the prepared cargo capacity value, but this is placeholder/non-enforced until the future cargo and inventory rework.

Upgrade levels start at level 0. Coin costs increase each level. Buttons are disabled when the player cannot afford the upgrade.

Stronger Line has rarity-based diminishing returns. It gives the full safe-zone bonus to Common fish, less to Uncommon and Rare fish, and much less to Epic and Legendary fish. The upgrade should make hard catches more manageable without deleting their movement, wiggle, and surge challenge.

The same personal coins can also be contributed/spent on shared ship upgrades from the Reactor Console. Later versions can use coins, resources, fish, materials, or mixed recipes for rods, bait, ship modules, cosmetics, and crew progression.

## Shared Ship Progression

The ship is the long-term ownership layer. The current prototype uses a local fake server id, `local-dev-ship`, as a stand-in for a future Discord guild/server id. The player still earns personal coins from fishing, then can spend those coins on shared ship upgrades. This instant coin reward is temporary prototype behavior.

Current shared ship upgrades:

- Reactor Upgrade: raises shared ship level for future systems.
- Cargo Bay Upgrade: prepares future shared storage, cargo, and aquarium capacity.
- Deep Space Scanner: level 1 unlocks the Nebula Drift fishing zone.

Shared ship state tracks ship name, ship level, total shared contributions, upgrade levels, unlocked zones, current zone, and recent contribution activity. Nebula Drift currently reuses the existing fishing visuals/audio, but it has its own fish table to prove the shared progression and zone-unlock loop before adding richer zone presentation.

## Ship Hub and Contextual UI

The prototype is moving away from an always-open dashboard and toward a ship hub/vibe scene. The default view should feel like standing aboard the shared ship, with only a small title/status HUD, coins/cargo, current zone, and fishing controls visible.

Large systems are now opened from simple ship stations:

- Fishing Hole: focuses casting and the core fishing interaction.
- Gear Bench: opens player upgrades.
- Reactor Console: opens shared ship upgrades.
- Tackle Box: opens the player's personal fish inventory grouped by rarity.
- Codex: opens the player's research and collection log.
- Deep Space Scanner: opens zone selection.
- DEV station: opens reset save and rarity-forcing tools for local testing.

Only one large panel should be open at a time. This keeps the center of the ship cleaner, makes stations feel like interactable ship objects, and preserves the current simple visual style while preparing for future walking, rooms, and multiplayer presence.

The ship hub now has an early walkable-interaction prototype. A small player avatar can move around the ship interior with WASD or arrow keys, and nearby stations show a `Press E` prompt. Regular stations open panels; the Fishing Hole casts directly. For now this is intentionally rough: movement is clamped to a walkable ring outside the central fishing core, panels and active fishing pause movement, and the Cast button is only visible/active when the avatar is near the Fishing Hole.

## Future Bait System

Bait is intentionally deferred until the core fishing loop and progression feel solid. The future direction is to let players choose their desired fishing mood before casting:

- Basic bait: cozy, common-heavy fishing for relaxed play.
- Better bait: progression-focused fishing with stronger odds for uncommon and rare fish.
- Legendary bait: high-risk, high-reward fishing for intense Epic/Legendary attempts.

Bait should eventually affect the kind of session the player opts into, not replace the current core tuning. No bait UI, bait inventory, bait economy, or bait data exists yet.

## Inventory / Tackle Box

Personal fish inventory now lives behind the Tackle Box station instead of staying open by default. The panel is still grouped by rarity and includes the freshest catch. Each populated rarity group shows total quantity, total value, and up to three fish rows with fish name, rarity, quantity caught, and total value earned from that fish. The panel intentionally stays simple so it supports playtesting without becoming a major UI redesign.

## Fish Codex / Collection

The implemented Codex is the first collection layer. For now, it is the player's personal research log opened from the Codex station in the ship hub. It lists every fish definition from the data layer, tracks total discovered fish, and shows discovery progress by rarity.

Discovered fish show name, rarity, prototype coin value, flavor text, and how many the player has caught. Undiscovered fish appear as `???` with a simple hint. Discovery is derived from the player's existing Tackle Box inventory, so old saves do not need a migration and refreshed saves rebuild the Codex from caught fish. The first usable prototype uses paginated text cards, showing four fish per page so entries stay inside the panel.

The Codex should feel like a research/collection goal, not a shop. Future versions can add fish sprites, richer cards, rarity/zone filters, aquarium display entries, collection milestones, zone-specific discovery, and research rewards.

A future Discord/server version may add a shared Ship Codex or Ship Aquarium that tracks discoveries across the whole server/ship. That should be separate from the current personal Codex. Future UI may explicitly split this into `My Codex` and `Ship Codex`.

## Future Economy / Cargo Rework

The current instant fish-to-coins reward is temporary prototype behavior for fast testing. In the final direction, catching a fish should place it in the player's personal Tackle Box or inventory first, and should not automatically grant spendable coins.

The intended long-term flow is:

1. Catch fish.
2. Fish enters the player's personal Tackle Box.
3. Player chooses what to do with the fish.
4. That choice produces coins, resources, ship progress, collection progress, buffs, or storage.

Personal Inventory / Tackle Box is personal player storage. Ship Cargo Bay should become future shared ship/server storage, separate from the player's caught-fish list.

Possible fish uses:

- Sell at a market or trade terminal for coins.
- Donate to ship projects.
- Submit to an aquarium, codex, or research system.
- Process into materials.
- Cook or consume for temporary buffs.
- Store in a shared Ship Cargo Bay.

Player upgrades and ship upgrades may eventually require coins, resources, fish, materials, or mixed recipes instead of only instant catch coins. Future fish sprites/cards will likely require a rework of the inventory UI so fish can feel like objects, not just text rows.

## Ship/Base Ideas

Future versions can make each Discord server feel like a shared spaceship:

- Upgradeable fishing deck
- Crew aquarium or specimen wall
- Shared ship modules
- Cosmetic room themes
- Server-wide fish collection
- Ship/server leaderboard

The ship should feel like a cozy place players return to together, not just a menu.

## Sound and Vibe Direction

The vibe should lean soft, cozy, and cosmic:

- Low ambient ship hum
- Gentle space water/pool shimmer
- Soft bite cue
- Warm catch success chime
- Subtle warning sound when tension is outside the target zone
- No harsh alarms unless used very sparingly

Visuals should stay readable and calm: dark space, soft glow, clean UI, slow movement, and playful alien fish silhouettes.

## Future Ideas

- Discord Embedded App SDK
- Each Discord server as one ship
- Multiplayer shared fishing sessions
- WebSocket presence
- Server and global leaderboards
- Player upgrades
- Rods, bait, ship modules
- Persistent accounts and PostgreSQL storage
- Fish collection log
- Aquarium display
- Daily or weekly cozy crew goals

## Polish Later

- Rename meter labels:
  - `Tension` -> `Line Tension`
  - `Catch` -> `Catch Progress`
- Make the tension marker more readable:
  - Add stronger feedback when catch progress is draining versus increasing.
  - Consider a small `+catch` label while inside the safe zone.
- Tune catch progress drain so early attempts feel forgiving.
- Add clearer feedback when progress is draining versus increasing.
- Make the red target zone move slowly for harder fish.
- Improve the visual representation of the red/safe zone so its purpose is immediately obvious.
- Add clearer upgrade affordances and a dedicated shop view if the HUD gets crowded.
- Polish the existing first-time fishing tips if playtesting shows the wording, placement, or timing is unclear.
- Add sound and subtle screen/pool feedback for bite, target zone, catch, and escape.
