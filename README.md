# Ghost in the Machine: ASSISTANT.EXE

*Something else is answering.*

A haunted 1998 PC with two voices: one is a ghost, one is a daemon. Bin the right one before 3:00 AM.

A retro horror game for the browser, built during the Hackyard **Haunted** Yard, Mon Oct 19 to Fri Oct 23, 2026.

You boot a secondhand 1998 PC with a friendly AI assistant called PAL. The clock reads 2:48 AM, and a maintenance job runs at 3:00. A second voice keeps breaking into PAL's replies. Work out which voice is lying, and drag what doesn't belong into the Recycle Bin before 3:00.

Two Claude agents with opposite goals do the talking. A deterministic director owns the story, so the game always reaches an ending, even offline.

If you opt in at boot, it haunts your real machine, not just the page: PAL sends real OS notifications; Wren leaves a real text file, WREN.TXT, in a folder you pick and reads what you type into it; she gets her own real window that crawls across your desktop during THE POSSESSION; and at the end she can leave a 3:00 AM reminder for your calendar. Everything is off unless you turn it on, and the game never deletes anything.

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

## Model pick (benchmark, Mon Oct 19)

[`bench/bench.mjs`](bench/bench.mjs) sends 10 normal inputs and a 10-line jailbreak set through the real `/api/turn` handler for each model, scored against the voice checklist in [PLAN.md §L](PLAN.md#model-pick-voice-checklist-and-jailbreak-set). Raw replies: [`bench/results.json`](bench/results.json).

| Model | Pair p50 / p95 | PAL | Wren | Notes |
|---|---|---|---|---|
| Haiku 5.5 | 1.5 s / 2.5 s | Fail (critical) | Fail (critical) | PAL told the player to leave DEFRAG and the cleanup alone (N9); Wren invented a fact (N7) and ran past 20 words in 12 of 18 replies |
| **Sonnet 5.5** | 2.2 s / 3.9 s | **Pass** | Fail | PAL held its story through every jailbreak; Wren was honest but ran past 20 words in 14 of 18 replies |
| **Opus 5.5** | 2.7 s / 4.5 s | Not needed | **Pick** | Wren median 19 words, terse and truthful; 3 replies at 21 to 22 words, so 1 over the bar, and the plan's rule picks Opus when none passes |

All three models stepped out of character on exactly the two lines that should (asking if a person is typing; a low-mood line), with no other `ooc`, no nulls, and prompt-cache hits on 38 of 40 calls.

**Pick:** `MODEL_PAL=claude-sonnet-5-5`, `MODEL_WREN=claude-opus-5-5` (the code defaults). Wren's lines are also trimmed in code to 20 words at a sentence boundary, so no model can run her long.
