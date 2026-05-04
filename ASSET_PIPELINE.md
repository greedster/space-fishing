# Space Fishing Asset Pipeline

This file defines how future visual and audio assets should be generated, reviewed, accepted, and integrated. Use it together with `ART_BIBLE.md`.

## Fish Sprite / Icon Requirements

Fish sprites and icons are gameplay-facing assets. They must be simple, readable, and consistent.

Requirements:

- Transparent PNG or WebP.
- Real transparency only.
- No baked checkerboard backgrounds.
- Consistent canvas size.
- Fish centered on canvas.
- Consistent side-view orientation by default.
- Consistent scale across fish.
- No text in the asset.
- No scene background.
- No decorative frame unless the asset is specifically a UI card.
- Readable at small UI size.
- Shape should still read when scaled down.

Recommended starting sizes:

- Gameplay icon: `256x256`.
- Small UI thumbnail: source can be `256x256`, displayed much smaller.
- Keep extra transparent padding consistent across fish.

## Fish Card / Codex Art Requirements

Fish card and Codex art can be larger and more detailed than gameplay sprites, but it must still follow `ART_BIBLE.md`.

Use cases:

- Future catch reveals.
- Codex detail views.
- Aquarium display.
- Legendary or Epic special moments.
- Collection milestone screens.

Rules:

- More detail is allowed, but keep the same stylized cozy cosmic direction.
- Fish should remain the focal point.
- Avoid busy backgrounds unless the card format explicitly calls for a controlled backdrop.
- Do not let card art redefine the fish so strongly that it no longer matches the sprite/icon.
- Keep rarity language consistent.

## Sprite Sheet Rules

Sprite sheets should be simple and easy to test in-game.

Rules:

- Consistent frame size.
- Centered subject in every frame.
- Transparent background.
- No animated background boxes.
- No baked checkerboards or matte artifacts.
- Simple idle animation first.
- Keep motion subtle enough for UI and Codex use.
- Test in-game before accepting.

Recommended first-pass animations:

- Idle bob.
- Gentle fin wave.
- Soft glow pulse.
- Small tail swish.

Avoid:

- Camera movement inside frames.
- Changing fish scale between frames.
- Background texture flicker.
- New details appearing/disappearing between frames.

## Asset Acceptance Checklist

Before accepting an asset, confirm:

- Matches `ART_BIBLE.md`.
- Readable at small size.
- Real transparency.
- No unwanted background.
- No baked checkerboard.
- Consistent scale.
- Consistent orientation.
- Not overly realistic.
- Not painterly unless explicitly approved for special card art.
- Not too noisy.
- No text baked into the image.
- Works in-game before final acceptance.

For generated assets, reject or regenerate if the asset has:

- Warped anatomy that distracts from the silhouette.
- Inconsistent lighting compared with the rest of the set.
- Strange extra fins, eyes, or objects that do not support the fish concept.
- Unwanted backgrounds.
- Cropped silhouettes.
- Tiny noisy details that only look good at full size.

## Prompt Templates

Use these as starting points. Replace bracketed sections.

### Fish Sprite / Icon

```text
Create a stylized 2D game sprite of [fish name], a [rarity] cozy cosmic alien fish for a space-fishing game.
Side view, clean readable silhouette, slightly cute chunky proportions, transparent background, centered on a square canvas.
Soft neon rim light, limited cosmic detail, one iconic gimmick: [gimmick].
Readable at small UI size, no text, no scene background, no frame, no checkerboard.
Not realistic, not painterly, not over-detailed.
```

### Fish Card / Codex Art

```text
Create detailed but stylized Codex card art for [fish name], a [rarity] cosmic fish in a cozy space-fishing game.
The fish is the focal point, side-view or three-quarter side-view, clean silhouette, soft neon rim light, playful alien design.
More detail than the gameplay sprite is allowed, but keep it consistent with a readable 2D game style.
Use [rarity visual language] and one iconic gimmick: [gimmick].
No text in the image. Avoid realism, painterly style, noisy detail, and mismatched lighting.
```

### Fish Sprite Sheet

```text
Create a transparent sprite sheet for [fish name], a stylized cozy cosmic fish.
[number] frames in a single row, consistent frame size, centered fish in every frame, transparent background.
Simple idle animation: [idle bob / tail swish / glow pulse].
No background, no checkerboard, no frame, no camera movement, no scale drift, no text.
Readable at small size and consistent with the Space Fishing art bible.
```

### Ship Station / Icon

```text
Create a stylized 2D ship station icon/object for [station name] in a cozy circular spaceship hub.
Dark metal base, soft neon station light, readable silhouette, game-friendly shape, transparent background.
It should look interactable and match a cozy space-fishing Discord ship vibe.
No text, no scene background, no checkerboard, not realistic, not over-detailed.
```

### Audio Replacement Direction

```text
Create or choose a short, subtle sound for [event name] in a cozy space-fishing game.
Mood: soft, warm, cosmic, satisfying, not harsh.
Length target: [duration].
Use case: [UI click / panel open / cast / bite / catch success / fish escape / upgrade / Legendary warning].
Avoid loud alarms, piercing beeps, clipping, heavy distortion, or distracting loops.
Document source and license in AUDIO_CREDITS.md.
```

## Audio Asset Rules

Audio must be tracked and replaceable.

Rules:

- Track sources and licenses in `AUDIO_CREDITS.md`.
- Placeholder generated sounds are acceptable for testing.
- Final sounds should be curated, replaced, or intentionally reworked later.
- Avoid loud or harsh sounds.
- Keep UI sounds short.
- Keep fishing sounds satisfying but gentle.
- Legendary warning should be deep and cosmic, not shrill.
- Normalize volume so sounds do not surprise the player.
- Test with mute/unmute before accepting.

Current placeholder audio:

- Generated locally.
- Stored in `public/assets/audio`.
- Credited in `AUDIO_CREDITS.md`.
- Temporary until a later audio pass.
