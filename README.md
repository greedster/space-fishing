# Space Fishing

Space Fishing is a browser prototype for a cozy Discord Activity game. Players are astronauts fishing alien creatures from a glowing pool inside a circular spaceship hub.

This version is intentionally simple:

- Phaser 3
- TypeScript
- Vite
- Single-player only
- Simple in-memory upgrades and coins
- Serializable local player/game state
- Reusable pure systems for fishing, economy, inventory, and upgrades
- No Discord integration yet
- No backend or multiplayer yet

## Run Locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

The app redirects `127.0.0.1` to `localhost` in local development so browser saves use one localStorage origin.

## Build

```bash
npm run build
```

## Project Docs

- `GAME_DESIGN.md`: design direction, current loop, future ideas, and polish targets.
- `ROADMAP.md`: milestone plan.
- `ARCHITECTURE.md`: current file/module responsibilities and boundaries.
- `TODO.md`: active next task list.
- `NOTES.md`: messy development notes, bugs, temporary observations, and implementation details.
- `PROJECT_BRIEF.md`: compact stable context for future sessions.
- `SESSION_HANDOFF.md`: current state, verification, known rough edges, and next steps.
