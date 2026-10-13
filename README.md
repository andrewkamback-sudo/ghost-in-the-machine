# Ghost in the Machine: ASSISTANT.EXE

*Something else is answering.*

A haunted 1998 PC with two voices: one is a ghost, one is a daemon. Bin the right one before 3:00 AM.

A retro horror game for the browser, made in a 96-hour AI hackathon, Mon Oct 19 to Fri Oct 23, 2026 (theme: **Haunted**).

You boot a secondhand 1998 PC with a friendly AI assistant called PAL. The clock reads 2:48 AM, and a maintenance job runs at 3:00. A second voice keeps breaking into PAL's replies. Work out which voice is lying, and drag what doesn't belong into the Recycle Bin before 3:00.

Two Claude agents with opposite goals do the talking. A deterministic director owns the story, so the game always reaches an ending, even offline.

If you opt in at boot, it haunts your real desktop, not just the page. PAL sends real OS notifications, and Wren leaves a real text file, WREN.TXT, in a folder you pick (Chrome and Edge; Safari and Firefox get it as a download), then reads what you type into it. Both are off unless you turn them on, and you can finish the game without them. It never deletes anything and never writes over a file it didn't make, the game never sends what you type into WREN.TXT anywhere, and the end card lists exactly what it left behind so you can drag it to the Trash.

For the full haunt, play on a computer in Chrome or Edge, in its own tab, and turn on both options at boot. The `?demo=1` link only makes the game faster (a 4x clock, 2x typing, THE POSSESSION on 2 clues); nothing is pre-recorded.

- **Design and build plan:** [PLAN.md](PLAN.md)
- **Real haunts and house rules:** [PLAN.md §N](PLAN.md#n-real-haunts-and-house-rules)
- **Privacy:** what the game sends, keeps and leaves on your computer, and how to remove it: [privacy.html](public/privacy.html), built on Thu Oct 22. Until then, its outline is in [PLAN.md §N](PLAN.md#privacy-page-publicprivacyhtml-plain-no-puns).
- **Status:** planning. The build starts at kickoff, Mon Oct 19, 2 PM ET, and ships by Fri Oct 23, 12 PM ET.

A Cinderway Interactive game.
