# Space Fishing Development Notes

Use this file for messy development notes, bugs, temporary observations, and implementation details.

## Current Observations

- The minigame now uses a moving tension marker and red target zone.
- The safe zone now has an in-game label, subtle pulse, wider marker/glow, and green catch-bar feedback while the marker is inside the zone.
- Gameplay rules now live in reusable systems so future save, Discord identity, and multiplayer sync work can use the same logic outside Phaser.
- MCP visual checks confirmed the marker, red zone, and catch progress updates are visible.
- MCP caught a fish, bought Stronger Line, bought Better Lure, and confirmed the upgraded red zone appears wider in the next minigame.
- The next tuning pass should focus on feel, forgiveness, and clearer feedback.
- Keep playtesting the red/safe zone presentation with first-time players.
- Consider making harder fish have smaller red zones.
- Consider making the red zone move for some harder or rarer fish.

## Implementation Details

- The tension and catch meters use 1px base rectangles scaled at runtime. Avoid creating fill bars with zero width, because they may appear stuck or invisible in Phaser.
- The minigame reads `this.input.activePointer.isDown` each frame while reeling so holding on the bottom button area still counts as input.
- Bigger Cargo currently updates prepared cargo capacity data, but inventory capacity is not enforced yet.

## First non-gamer test:
- New player needed a few casts to understand movement/fishing controls.
- Common fish felt easy, maybe correctly cozy.
- Rare fish created a noticeable “aha” moment.
- Upgrades were understood and used.
- Epic fish felt challenging but catchable after retry.
- Legendary felt far beyond beginner skill, which may be fine as aspirational content.
- Do not nerf Legendary yet.
- Consider better first-time control hints and progressive onboarding.