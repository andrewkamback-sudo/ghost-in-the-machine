# Ghost in the Machine: ASSISTANT.EXE

*Something else is answering.*

A haunted 1998 PC with two voices: one is a ghost, one is a daemon. Bin the right one before 3:00 AM.

A retro horror game for the browser, built during the Hackyard **Haunted** Yard, Mon Oct 19 to Fri Oct 23, 2026.

You boot a secondhand 1998 PC with a friendly AI assistant called PAL. The clock reads 2:48 AM, and a maintenance job runs at 3:00. A second voice keeps breaking into PAL's replies. Work out which voice is lying, and drag what doesn't belong into the Recycle Bin before 3:00.

Two Claude agents with opposite goals do the talking. A deterministic director owns the story, so the game always reaches an ending, even offline.

If you opt in at boot, it haunts your real desktop, not just the page: PAL sends real OS notifications, and Wren leaves a real text file, WREN.TXT, in a folder you pick, then reads what you type into it. Both are off unless you turn them on, and the game never deletes anything.

- **Play:** https://ghost-in-the-machine-seven.vercel.app (add `?demo=1` for a faster clock; nothing is pre-recorded). For the full haunt, play on a computer in Chrome or Edge, in its own tab, and turn on both options at boot.
- **Privacy:** [what the game sends, keeps and leaves on your computer](https://ghost-in-the-machine-seven.vercel.app/privacy.html).
- **Plan:** [PLAN.md](PLAN.md). It was written before kickoff in [ghost-in-the-machine-plan](https://github.com/andrewkamback-sudo/ghost-in-the-machine-plan) (planning only; all code in this repo was written during the build week).
- **Status:** building. Playable end to end; live AI turns switch on once the API key is set.

## Develop

```bash
vercel dev
```

```bash
npm test
```

`npm test` also runs as the Vercel build, so a failing test (including the house-rules scan of `public/haunt.js`) blocks the deploy.

A Cinderway Interactive game.
