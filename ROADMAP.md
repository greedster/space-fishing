# Space Fishing Roadmap

## 1. Clean Prototype — DONE

Goal: prove the basic game loop and technical foundation.

Completed:
- Phaser browser prototype.
- Refactored architecture.
- Serializable player state.
- Local save/load with versioned localStorage save provider.
- Fishing loop.
- Fish data layer.
- Player upgrades.
- Inventory/Tackle Box.
- Basic economy prototype.
- One complete gameplay loop.

## 2. MVP — CURRENT PHASE / LATE MVP

Goal: make the game fun as a single-player/local prototype before Discord integration.

Completed:
- Fish rarity and difficulty.
- Multiple fish types.
- Legendary fish behavior that feels tense and rewarding.
- Upgrades with levels and increasing costs.
- Personal Tackle Box inventory.
- My Fish Codex / collection log.
- Shared ship progression prototype.
- Zone unlock prototype.
- Contextual station UI.
- Basic walkable ship interaction.
- Local persistent save.

Remaining MVP tasks:
- Simple controls/help/tutorial panel.
- Basic sound placeholders.
- Friend-test readiness pass.
- Clearer catch/upgrade feedback polish.
- Hide or clean DEV/debug tools for testers.
- Decide whether cargo capacity belongs in MVP or later.
- Stabilize walkable ship interaction.

## 3. Discord-Ready MVP — NEXT PHASE

Goal: make the game ready to run as a Discord Activity without full multiplayer yet.

Tasks:
- Abstract player identity.
- Abstract save provider.
- Abstract platform provider.
- Responsive embedded-friendly UI.
- Mouse/touch input pass.
- Hosted web build for friends.
- Discord Embedded App SDK spike.
- Detect Discord user/context when running inside Discord.
- Keep browser/local mode working outside Discord.
- Clear integration points for future backend/shared ship state.

## 4. Alpha

Goal: expand content and add early social/shared features.

Tasks:
- 15–30 fish.
- Multiple zones/biomes with zone-specific fish tables.
- Deeper progression.
- Better atmosphere/audio.
- Fish sprites/cards guided by ART_BIBLE.md.
- Discord identity/invite/presence.
- Light shared-room features.
- Shared ship state prototype.
- Catch/upgrade activity feed.
- Early Discord channel/bot updates if appropriate.

## Not Yet

- No full real-time multiplayer yet.
- No heavy backend yet.
- No final economy/cargo rework yet.
- No major visual polish until core loop and Discord-ready flow are proven.
- No large AI-generated asset batch until ART_BIBLE.md and ASSET_PIPELINE.md exist.