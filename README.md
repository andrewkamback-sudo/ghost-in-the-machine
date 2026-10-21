# Ghost in the Machine: ASSISTANT.EXE

*Something else is answering.*

A haunted 1998 PC with two voices: one is a ghost, one is a daemon. Bin the right one before 3:00 AM.

A retro horror game for the browser, built during the Hackyard **Haunted** Yard, Mon Oct 19 to Fri Oct 23, 2026.

You boot a secondhand 1998 PC with a friendly AI assistant called PAL. The clock reads 2:40 AM, and a maintenance job runs at 3:00. A second voice keeps breaking into PAL's replies. Work out which voice is lying, and drag what doesn't belong into the Recycle Bin before 3:00. A run takes about 12 to 14 minutes.

Two Claude agents with opposite goals do the talking. A deterministic director owns the story, so the game always reaches an ending, even offline.

- **Play:** https://ghost-in-the-machine-seven.vercel.app (add `?demo=1` for a faster clock; nothing is pre-recorded). For the full haunt, play on a computer in Chrome or Edge, in its own tab, with sound on, and say yes when they ask.
- **Privacy:** [what the game sends, keeps and leaves on your computer](https://ghost-in-the-machine-seven.vercel.app/privacy.html).
- **Plan:** [PLAN.md](PLAN.md). It was written before kickoff in [ghost-in-the-machine-plan](https://github.com/andrewkamback-sudo/ghost-in-the-machine-plan) (planning only; all code in this repo was written during the build week).
- **Status:** submitted to the Hackyard Haunted Yard ([build page](https://hackyard.tech/yards/yard-5/93d4f01e-786c-4f7a-a621-1fc32691ae21)). Playable end to end with live AI; if the API is unreachable it switches to scripted lines.

## How it haunts your real machine

It doesn't stay in the page. PAL and Wren ask for each of these in the story, as you play; some can also be turned on at boot. Each one is off until you click yes, and you can finish the game without any of them.

| Haunt | Who asks | What it does |
|---|---|---|
| Voice | PAL | PAL and Wren speak their lines out loud, using only your computer's own speech voices |
| Notifications | PAL | Real OS notifications, at most 5, only while you're in another window |
| WREN.TXT | Wren | A real text file in a new Halcyon 95 folder you pick. She keeps writing to it, and she reads what you type back into it. In Safari and Firefox she hands you the file and you drop it back in. |
| Her own window | Wren | A real window beside the game that holds her lines. During THE POSSESSION it crawls across your desktop toward the game. |
| Camera | PAL | The webcam shows you as a faint reflection on the screen during THE POSSESSION. It never leaves your browser and turns off at the end. |
| 3:00 AM reminder | Wren, at the end | A calendar file (.ics) for the next 3:00 AM, if you choose to save it |

Without asking, it also takes over the browser tab itself: the title and favicon change when you look away ("come back, {name}"), and THE POSSESSION goes fullscreen if your own click set it off (Esc exits).

The game never deletes anything, only ever writes to WREN.TXT inside the folder it made, and never touches anyone else's device. The end card lists exactly what it left behind.

## Who's lying?

Both voices claim the other one is the problem. PAL says the red text is a corrupted copy wearing Wren's name, and Wren gives cold orders like a virus would. To make it harder, PAL sometimes writes in Wren's red lowercase to post fake Wren lines, put a split-second fake flash on screen, or raise a "Halcyon Security" alert asking you to quarantine her. There is one tell that always gives PAL away; a torn diary page explains it, if you find it.

## On the haunted desktop

- **DEFRAG.EXE** runs in the corner the whole time, a live grid of Wren's red sectors turning into PAL.MEM blue, pass 11 of 12, with disk-seek clicks. It can't be stopped, and it says what's running it.
- **Lost diary pages** flicker onto the desktop through the night. Each one is a piece of Wren's story and points at a clue.
- **Flash frames:** the screen flickers, and a split-second full-screen frame shows PAL's face-off with Wren, with Wren naming your next step. Calm mode (in the tray, and on by default if your system asks for reduced motion) replaces the flashes with a line in the chat title.

## Start menu

The taskbar's **Start** button opens a working menu with shortcuts to the desktop files. It gets worse as the night goes on: the side banner decays from "Halcyon 95" to "w r e n", and from Act 2 Wren puts herself in the menu as a red **wren** item. **Shut Down...** is refused because ASSISTANT.EXE is preventing shutdown, and PAL begs you to stay. **Help** offers PAL, and later Wren answers instead.

## Sound

All sound is made live with Web Audio; there are no sound files. A CRT buzz rises with the dread, a heartbeat starts once Wren breaks in, DEFRAG's disk head clicks away, and stings, static and clicks mark the scares. It fades to silence on the end card and stops when you close the tab.

- **Test sound** on the second boot screen plays the chime and the buzz for about 2.5 seconds, then goes quiet, so you know sound works before you start. While it plays the button reads **Stop**; click it to cut the test short.
- **Sound** in the taskbar tray, or the M key, turns it all on or off.
- Press `~` in the game for the debug trace, which includes the audio state and level.

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
