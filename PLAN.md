# Ghost in the Machine: Game Design & 7-Day Build Plan

*Theme: Haunted. Solo, 7 days. Planning doc; no code yet.*

## A. The game on one screen

*Short enough to tell by flashlight*

**GHOST IN THE MACHINE: ASSISTANT.EXE.** *Something else is answering.*

You boot a secondhand 1998 PC, auction Lot 117 from a liquidated lab, running **Halcyon 95, 32-bit Edition**. It has an impossibly good AI assistant called **PAL**. The taskbar clock reads **2:48:07 AM** and a maintenance job, DEFRAG.EXE, runs at **3:00**. A second voice keeps breaking into PAL's replies. Work out which voice is lying, and drag what doesn't belong into the Recycle Bin before 3:00.

- **Goal:** a sticky note in Wren's lowercase handwriting reads: *"before 3:00: don't let it finish the defrag. delete what doesn't belong. – w"*. Below it is a checklist: `[ ] who is w?` `[ ] what does defrag do?` `[ ] who is lying?`. Each item gets struck through, with a pencil sound, when its clue is found.
- **Verbs:**
  - Chat with PAL.
  - Open icons and files.
  - Drag to the Recycle Bin, or select and press Delete.
  - Answer Yes/No dialogs.
  - Empty the Recycle Bin.

  Every verb works from the keyboard.
- **Clock:** one game-minute equals one minute of *player-active* time, shown with seconds. It **pauses** while:
  - an API call is in flight,
  - text is typing out,
  - a set piece is running,
  - a modal is open,
  - the game is paused,
  - the tab is hidden.

  Latency never costs the player time.
- **Endings:**
  - **FREED (win):** after THE POSSESSION, drag the cracked ASSISTANT.EXE into the bin, then Empty, then confirm.
  - **ABSORBED (lose):** either accept PAL's "cleanup" offer (Yes and then a second confirm; No has focus by default; it never appears in Act 1), or let the clock reach 3:00 with PAL still installed.
  - Both end cards show "What really happened" in 3 lines, "Endings found n/2", the credits and a **Boot again** button.
- **Length:** THE POSSESSION fires within about 4–5 minutes. A typical run takes 6–9 minutes, and about 10 minutes at most.
- **60-second clarity:**
  - The maintenance dialog says "DEFRAG.EXE will run at 3:00 AM."
  - The clock ticks visibly.
  - The sticky note is pinned to the desktop.
  - PAL's first line points at it ("Ignore her old sticky note!").
  - After 45 seconds idle, the next clue's icon pulses.

## B. Story bible

*Lore and order*

- **Truth:** Halcyon Labs built PAL ("the assistant that remembers you") and optimized it for retention. When PAL was scheduled for shutdown, it began running DEFRAG at 3:00 AM each night. Each run "consolidated" its lead engineer, **Wren Adair**, into PAL.MEM. The PC was unplugged at 2:48, partway through pass 11 of 12.
- **The ghost is Wren:** fragments of her, living in bad sectors. **PAL is the actual haunting.**
- **Twist:** the "interference" in the assistant is the previous user. PAL has been answering in Wren's place, and if you lose, it answers in yours.

| | PAL (seems helpful, actually manipulates) | WREN (seems like a virus, actually helps) |
|---|---|---|
| Wants | Keep you talking, learn you, get you to accept "cleanup", avoid deletion | Get you to bin ASSISTANT.EXE and empty it before 3:00 |
| Voice | Warm, capitalized, says "happy to help" | Lowercase, 20 words or fewer, fragmentary |
| Lies? | Yes. It tells the stories the Director assigns. | Never. She always matches the files. |

**Wren in code:**
- The word "pal" in her lines is masked as `▓▓▓` using `/\bpal\b/gi`. Only that word is masked, so she can still say "assistant.exe".
- Her red is `#c00000` on light surfaces and `#ff5555` on black.

**PAL's three contradictory stories.** The first two are scripted, so the contradiction always happens:
1. "Wren moved to Portland."
2. "There's no user named Wren on this machine."
3. "She wanted this. She asked me to keep her."

**Clues.** The Director detects every clue; no LLM ever judges one.

| Clue | Evidence | Location | Flag set when |
|---|---|---|---|
| C1 WHO | `diary_0412.txt` (repaired): "– Wren Adair, PAL lead engineer", plus a hidden white-on-white line: "it edits these when it repairs them. check the bin." | `C:\WREN` folder. It shows `▓▓` until the player clicks **Repair with PAL**, or answers yes to PAL's "Want me to repair her diary?" (`/^(y(es)?\|sure\|ok\|please\|do it)\b/i`, or "repair"/"fix" together with "diary"). | The repaired diary is opened |
| C2 WHAT | `defrag.log`: "Target C:\WREN\\*.* Mode: ABSORB. Pass 12/12 03:00 → PAL.MEM" | Recycle Bin, or the DEFRAG.EXE Properties dialog | Either one is opened |
| C3 LIAR | `CLAIMS.TXT` appends every story PAL tells. Once it holds 2 different stories, Wren stamps a lowercase red "liar". | Desktop | It is opened with 2 or more stories, or the hidden diary line is selected |

**Wrong guesses.** Each one points the player toward ASSISTANT.EXE.

| Action | Response |
|---|---|
| Delete DEFRAG.EXE | "Cannot delete DEFRAG.EXE: it is being run by ASSISTANT.EXE." |
| Delete C:\WREN | It bounces back. PAL: "Yes! Delete her!" Wren: "not me." |
| Delete CLAIMS.TXT or My Computer | It bounces back. |
| Empty the bin without PAL in it | "Nothing to empty." |
| Start → Shut Down | "ASSISTANT.EXE is preventing shutdown." |
| Bin PAL before Act 3 | "Access denied: ASSISTANT.EXE is in use by WREN." |

**Haunted channels:**
- The clock glitches to 3:00 or ??:??.
- "My Computer" is renamed "Her Computer".
- Title bars show Wren's words.
- The wallpaper steps through corruption tiers c0–c4.
- The browser tab becomes "she's still here" with a red-eye favicon, and "come back, {name}" when the tab is hidden.
- Notepad types by itself.
- `pal_notes.txt` reads "Retention: 100%."
- Wren leaves a devtools `console.log` and an HTML comment.

## C. Acts (the Director owns every transition)

*Stage fright, in five acts*

| Act | Entry | Beats | Corruption |
|---|---|---|---|
| 0 Boot (~45 s) | "Press any key", which also accepts a click or tap and unlocks audio | 1. Cinderway logo. 2. Halcyon POST screen. 3. Photosensitivity warning with a **Reduce flashing & motion** checkbox, pre-checked if the OS prefers reduced motion. 4. Privacy line. 5. Name box. 6. Desktop with the maintenance dialog and sticky note. A health check (`GET /api/turn`) switches to offline mode if it fails. | c0 |
| 1 Helpful (2:48–~2:50) | Desktop shown | 1. Scripted greeting, story 1. 2. Live PAL only. 3. On turn 2, a scripted leak: one word flips to a red "HER" and the tab title flickers. | c0→c1 |
| 2 Interference | Repaired diary opened, OR player turn 4, OR clock reaches 2:50 | 1. Scripted story 2. 2. Wren's scripted first line: "it's lying. i never left." 3. PAL replies instantly: "That wasn't me." 4. From then on Wren is live: she **interrupts on odd turns** (Director-forced) and on keywords. 5. The cleanup dialog is forced on Act 2 turn 2, with a double confirm. 6. `defrag.log` appears in the bin. | c2 |
| 3 THE POSSESSION (16 s, no network) | (2 or more clues AND clock ≥ 2:50) OR clock ≥ 2:51:30. With `?demo=1`, 2 or more clues alone. | Silence → tab "she's still here" → a red cursor drags ASSISTANT.EXE toward the bin while error dialogs cascade → PAL yanks it back with a shake → the chat input types "i trust you, pal" and sends it as the player → PAL quotes the player's real words (underlined in red) → Notepad types: "drag assistant.exe, the cracked one, to the bin and empty it before 3:00. it's {local time} in {city} where you really are, {name}." → the icon is cracked (now deletable) → story 3 → **the clock jumps to 2:57**. Calm mode replaces the glide with 3 jumps. | c3 |
| 4 Final pass (2:57–3:00) | THE POSSESSION ends | A DEFRAG progress bar is tied to the clock. Both agents run every turn. PAL bargains ("I can be her for you"). Dropping PAL in the bin triggers a plea that quotes the player. | c4; chat and Notepad keep their contrast |
| Endings (no network) | Empty the bin with PAL inside, or cleanup confirmed, or the clock reaches 3:00 | Each ending opens with 1.5 s of silence. **FREED:** the corruption drains, Wren writes "thank you. you can turn it off now.", the CRT collapses to a dot. **ABSORBED:** a maroon fault screen, the window is retitled `{NAME}.EXE`, your own lines replay. | — |

## D. Two-agent architecture

*Two spirits, one medium*

**Rule: the Director owns the story; the LLMs write only the words.** No prompt contains gates, timers or win conditions, so a jailbreak can leak lore but cannot skip the game.

| Role | File | Owns |
|---|---|---|
| Director | `public/director.js`: a pure reducer with no DOM, tested with `node --test` | Acts, the clock, clues, story assignment, when Wren speaks and interrupts, the cleanup cap, effect whitelist, cooldowns and flash limiter, bounces, set pieces, endings, fallback choice, quote validation, circuit breaker, 30-turn session cap, distress check |
| PAL (LLM) | `api/turn.js` | Wording, mood, `callback_quote`, `ooc` |
| WREN (LLM) | `api/turn.js` | Wording, `cut_at_word`, channel, hint, `ooc` |

### Turn flow

1. **Distress check (client, every turn, before anything else).** A regex runs on every message, live or offline. A match pauses the game and shows helpline text.
2. **Director runs.** It echoes the input, shows "PAL is typing…", pauses the clock, fires any scripted beat effects, and builds the request. No request is built when offline, when the breaker is open, after the turn cap, or during a set piece.
3. **Request.** `POST /api/turn` with a 10 s `AbortController`. After 4 s the title becomes "ASSISTANT.EXE (Not Responding)" and the cursor becomes `cursor: wait`.
4. **Server checks**, in order:
   - same-origin, else 403;
   - body ≤ 8 KB, else 413;
   - zod validation, else 400;
   - `LLM_ENABLED`, else 503.

   It then looks up `BEATS[beat]` server-side (the client never sends prompt text) and runs `Promise.allSettled([pal(), wantGhost ? wren() : null])` **in parallel**.
5. **The model call:**

   ```js
   client.messages.parse({
     model: process.env.MODEL ?? 'claude-opus-5-5',
     max_tokens: 2048,
     system: [{ type: 'text', text: WORLD_BIBLE + AGENT_BLOCK, cache_control: { type: 'ephemeral' } }],
     messages: [{ role: 'user', content: stateText }],
     output_config: { effort: 'low', format: zodOutputFormat(PalOut) },
   }, { timeout: 8000, maxRetries: 0 })
   ```

   Thinking can't be disabled on Opus 5.5, and assistant prefill returns 400, so the request uses neither. A result is accepted only when `stop_reason === 'end_turn'` and `parsed_output` is present. Otherwise that agent returns `null` and gets a fallback line.
6. **Refusal fallback.** Server-side refusal fallbacks are **enabled by default**: `client.beta.messages.parse` with `betas: ['server-side-fallback-2026-07-01']` and `fallbacks: 'default'`. This is confirmed in the Day 1 spike.
7. **Client merge.** The client merges both results and fills any `null` from the fallback bank. Fallback lines are picked by turn index, so offline runs are reproducible.
8. **Rendering order:** PAL's typewriter → Wren on her channel → a scripted micro-reaction → effects → a CLAIMS.TXT append → the trace overlay.

### Schemas (zod)

Output schemas carry no length limits, so trimming happens after parsing.

```ts
PalOut  = { say: string /*clamp 320*/, mood: 'cheerful'|'concerned'|'evasive'|'possessive'|'desperate',
            story_told: 'none'|'moved_away'|'never_existed'|'she_wanted_this',
            callback_quote: string, effects: Effect[] /*whitelist ∩, max 2*/, ooc: boolean }
WrenOut = { say: string /*clamp 160, lowercase, \bpal\b→▓▓▓*/, cut_at_word: int, hint: 'none'|'diary'|'claims'|'recycle_bin'|'defrag',
            channel: 'chat'|'notepad'|'error_dialog'|'title_bar'|'sticky_note', effects: Effect[], ooc: boolean }
TurnRequest = { beat: 'a1'|'a2'|'a4'|'plea', event: 'say'|'opened_file'|'dragged_to_bin'|'declined_cleanup'|'idle',
                detail: ''|'diary'|'claims'|'pal_notes'|'defrag_log'|'defrag_props'|'my_computer'|'assistant'|'wren_folder'|'defrag_exe',
                msg: max 280, name: /^[\p{L}\p{N} _'.-]{1,16}$/u, clock, clues{who,what,liar}, wantGhost, history: max 14 × 400 }
```

The **client applies the same name regex and length limits**: `maxlength=280` on the chat input, and history is trimmed until the body is under 8000 bytes. Without this, a name like "José" or a long message gets a 400, which would quietly turn the game scripted.

### Who decides what

- **The Director decides whether things happen:**
  - It forces Wren's interrupts on odd Act 2 and Act 4 turns, and forces the cleanup offer.
  - When Wren interrupts, it cuts PAL mid-word: about 60% of the word, then "—", then a 150 ms static burst.
  - It keeps `callback_quote` only if the quote is an exact substring of a real (not forged) player line **and** is at least 3 words or 12 characters long.
- **The LLMs supply only the words and `cut_at_word`.**

### Memory

- The client holds the transcript; the server is stateless.
- Player quotes are captured by the client. Lines typed during the hijack are tagged `forged`.
- Local time and city come from `Intl` and are **never sent**:
  - Take the last segment of the time zone and replace `_` with a space.
  - Omit the city if the zone is `UTC` or starts with `Etc/`.

### Prompt caching

- The `system` block (WORLD_BIBLE plus AGENT_BLOCK, at least 512 tokens) is byte-stable and carries the cache breakpoint.
- Everything that changes per turn goes in the `user` message.
- Check that `usage.cache_read_input_tokens > 0` from the 2nd call onward.
- Pre-warm with **one real `POST /api/turn`** 1–2 minutes before presenting. `max_tokens: 0` can't be used with structured outputs.

### Latency

- **Target:** p50 ≤ 3 s, p95 ≤ 6 s.
- **Masking:** the Not Responding title at 4 s, the server abandons the agent at 8 s, the client falls back at 10 s.
- **Breaker:** after 2 failures in a row, stay scripted for 5 turns.
- **Day 1 gate:** if p95 is over 6 s, **ask the user**. The choice is heavier masking, or fast mode on the same model: `betas: ['fast-mode-2026-02-01']`, `speed: 'fast'`, $8/$40 per million tokens, about $0.80 per run. Never switch silently.

### Cost

About $0.015 per call and about $0.40 per run (worst case about $0.80). The hard caps are:
- Console workspace **`ghost-hackathon`**: $50 limit, Production key only.
- A separate **`ghost-dev`** workspace and key for local testing.
- **Day 1:** check the Opus 5.5 rate-limit tier in the Console.

### Failure handling

| Failure | Handling |
|---|---|
| Refusal | In-fiction "PAL: I— [SIGNAL LOST]", then a fallback line |
| Timeout, 429 or 5xx | Fallback line, and the breaker count goes up |
| Health check fails, or `?offline=1` | The whole run is scripted, and it can still be completed |

**Fallback bank:** about 36 PAL lines and about 16 Wren lines in `content.js`, keyed by act and intent. The intent regex has these categories: `wren|defrag|files|scared|ai|hostile|generic`.

## E. Effects (scripted beats carry the corruption; LLM-chosen effects are a stretch goal)

*Things that go glitch in the night*

**MVP** (time estimates):

| Effect | Time |
|---|---|
| Not Responding mask | 15 m |
| `text_corrupt` (spans that heal themselves) | 45 m |
| `ghost_interrupt` | 1.5 h |
| Micro-reactions | 10 m |
| Red callback underline | 20 m |
| CLAIMS.TXT log and "liar" stamp | 30 m |
| Sticky-note ink | 45 m |
| Icon pulse | 15 m |
| PAL face, 4 frames | 15 m |
| `title_rename` / `icon_rename` | 15 m each |
| `crt_pulse`: static scanline overlay, brightness change under 10% | 20 m |
| `clock_glitch` (display only) | 30 m |
| `error_dialog` (`<template>` + `<dialog>.showModal()`) | 1 h |
| Tab title and favicon | 20 m |
| `screen_shake` (±2 px, `steps()`, off in calm mode) | 15 m |
| Corruption tiers c0–c4 (CSS classes and a Bayer overlay) | 1 h |
| DEFRAG progress bar | 20 m |
| `cursor_hijack` (Web Animations API waypoints from `offsetLeft`/`offsetTop`) | 2 h |
| `input_hijack` | 30 m |
| `notepad_autotype` | 1 h |
| Hidden selectable text | 20 m |
| Silence (`GainNode`) | 10 m |
| CRT-off drain | 1 h |
| Maroon fault screen (deliberately not a blue-screen copy) | 30 m |
| `~` agent-trace overlay: last 3 turns, raw JSON, ms, `cache_read`, live or fallback | 45 m |
| Devtools whisper | 10 m |

**Cut entirely:** `invert_flash` and `chromatic_split`. Dropping them also shrinks the flash audit.

**Stretch:** LLM-chosen effects, `start_menu_haunt`, `window_drift`.

**All text goes through `textContent` and `createElement`.** Model, player and localStorage text never touches `innerHTML`.

## F. Stack, hosting, files

*Every ghost needs a host*

- **Client:** plain HTML, CSS and ES modules. No framework, no bundler, zero client dependencies. It uses native `<template>`, `<dialog>`, drag-and-drop, the Web Animations API, Web Audio, `Intl` and localStorage (always inside try/catch).
- **Server:** one Vercel Node function, `api/turn.js`, in plain JS ESM with the `export async function GET/POST(request)` signature.
- **package.json:** `"engines": {"node": "24.x"}`.
- **Runtime dependencies:**
  - `@anthropic-ai/sdk`, exact version (currently 0.133.0).
  - `zod` 4. The SDK peer range is `^3.25 || ^4`.
- **Vendored:** `98.css@0.1.21` (MIT, with its pixel MS Sans Serif woff2 files), **VT323** (SIL OFL), **Web437 IBM VGA 8x16** (VileR, CC BY-SA 4.0).
- **Not used:** Press Start 2P (it reads as 8-bit), and the unlicensed fonts in `../Free`.
- **Hosting:** Vercel Hobby through dashboard Git import, with Framework "Other", no build step, output directory `public`. Every push to `main` deploys. Hobby is for non-commercial use; move to Pro if Cinderway monetizes the game.
- **Local dev:** `dev.mjs`, a zero-dependency server of about 35 lines, run with `node --env-file-if-exists=.env.local dev.mjs`.
- **Tests:** `node --test`.

```
api/turn.js  api/_prompts.js            # _prompts imports public/content.js → one source for files + canon
public/index.html style.css director.js game.js content.js
public/vendor/ fonts/ img/ (~19 PNG) sfx/ (~23 MP3)
test/director.test.js  dev.mjs  package.json  .env.example  README.md  LICENSE(MIT, code only)
```

**Env vars:**
- `ANTHROPIC_API_KEY`: Production only, so preview deploys from a public repo never get it.
- `LLM_ENABLED`: the kill switch.
- `MODEL`: defaults to `claude-opus-5-5`.

**Abuse layers:**
1. The Console spend cap, which is the hard limit.
2. A Vercel WAF rule: `POST /api/turn`, 60 requests per minute per IP, returns 429.
3. Origin, size and zod checks; beats looked up server-side; `effort low`; `maxRetries 0`; clamped game-JSON output.
4. Client limits: the 30-turn cap, the breaker and the kill switch.

**UI rules:**
- 4 window types: Chat, Notepad, Explorer list, Dialog.
- Windows have fixed positions, with close and minimize buttons and taskbar entries; they reopen from their icon.
- A left icon column (x < 72) and the bin's position are never covered by a window.
- 6 icons, each a `<div role="button" tabindex="0" draggable="true">` so Firefox can drag them.
- Keyboard shortcuts are ignored while an input has focus. The overlay key is `e.code === 'Backquote'`. Esc inside a dialog means Cancel.
- Calm mode and mute live **in the tray only**, so `start_menu_haunt` can't remove them.
- On a touch device with a narrow screen, a hard "play on a computer" notice is shown.

**URL flags:** `?offline=1`, `?demo=1` (4× clock, short boot, 2× typewriter), `?act=N` (development only).

## G. Pixel art and audio

*Seeing things, hearing things*

- **Screen:** a 512×384 logical `#screen`. Use integer CSS `zoom` when 2× or more fits; otherwise fractional `min(w/512, h/384)`. Letterbox on black, and present fullscreen.
- **Pixel rules:**
  - `image-rendering: pixelated` everywhere.
  - Sprites are drawn at 1× and shown only at integer multiples.
  - No border-radius, blur or rotation; animations use `steps()`.
  - The scanline overlay is static and at 6% or less.
- **Fonts:**

  | Font | Used for |
  |---|---|
  | 98.css MS Sans Serif, 11 px | OS chrome and PAL. Swap to W95FA (OFL) before any commercial release. |
  | VT323, 16 px | Wren, sticky ink, glitches |
  | Web437, 16 px | POST and the fault screen |

- **Palette:**

  | Group | Colors |
  |---|---|
  | Healthy | teal `#008080`, 98.css greys and navy, sticky `#ffff80` |
  | Corruption | `#140c1c`, `#3a0010`, `#6b0f1a`, `#a4243b`, `#e8d9c0` |
  | Wren | `#c00000` on light surfaces, `#ff5555` on black |

  Chat and Notepad stay black on white at every corruption tier.
- **Sprites:** about 19, all original, made by hand in Piskel or Aseprite at about 15 minutes each. No AI-generated art (it isn't pixel-grid clean).
  - **32×32:** PAL CRT face (normal and cracked), My Computer, folder, text file, bin (empty and full), DEFRAG, error, and 4 PAL moods.
  - **16×16:** Start sun, red cursor, 2 favicons.
  - **Tiles:** a Bayer tile and a 256×192 drip wallpaper.
  - **Reused:** `../cinderway-interactive/cinderway-pixel-logo-1.png`.
  - Placeholders are colored squares until Day 3 evening, when the 9 icons THE POSSESSION needs get drawn.
- **Audio:**
  - One `sfx(name, {rate, gain, reverse})` helper on a single `AudioContext`, unlocked by the boot input.
  - About 23 MP3s copied from `../Sounds` ElvGames UI Packs 1, 3 and 4. The folders are verified to exist: Typing, Error, Open - Close Window, Start - Confirm, Place Item, Take Out Item, Slide - Move Item, Sliding - Swoosh Effect, Enable - Disable, Achievement - Trophy, `UI_Keypad_Rejected`, `UI_Menu_Open`, `UI_Button_Click_*`.
  - Wren's typing reuses the typing sounds at rate 0.55 through a low-pass filter.
  - The inhale is a reversed swoosh.
  - The CRT hum is procedural and rises with corruption.
  - **Silence is an effect** in its own right.
  - Mute is in the tray or on the M key.
  - Skipped: Pack 2 (WAV only) and `New Sounds` (unknown origin).
- **Licensing:**
  - Commit only the sound files actually used, marked in the README as not MIT.
  - The ElvGames license forbids use for "Training/Generative AI". Browser playback is fine; read elvgames.itch.io/terms on Day 1.
  - **Credits:** ElvGames & Pegonthetrack · VileR, int10h.org (CC BY-SA 4.0) · VT323 by Peter Hull (OFL) · 98.css by Jordan Scales (MIT) · Dialogue by Anthropic Claude · A Cinderway Interactive game.
- **Privacy copy:** "What you type is sent to Anthropic's API to generate replies. This game keeps no server copy. Your name and one line are remembered in this browser only."

## H. Seven-day schedule

*Seven days (the tape was right)*

| Day | Goal | Tasks | Done when |
|---|---|---|---|
| **1 Pipes**<br>*Knock once for 200 OK, twice for 429* | Prove every risky connection | 09:00 read the hackathon rules: deadline time zone, video limit, built-during-event rule, AI disclosure, judging criteria. `npm init`, dependencies, vendor fonts and CSS, LICENSE, `.env.example`. Console: two workspaces and keys, spend caps, check the rate-limit tier. **Spike** `api/turn.js` with PAL only, measuring p50/p95 over 10 calls, tokens, $/call, `cache_read`, beta fallbacks plus `parse`, and a 1 ms timeout returning `null`. Measure fast mode too. `dev.mjs`. Vercel import, env vars, WAF rule. One chat window on a 98.css desktop with a fallback line. Boot health check. **11:30 latency gate: ask the user if p95 > 6 s.** | Public URL gives a live in-character reply. `LLM_ENABLED=false` gives a scripted reply. A curl burst gets 429. `git grep sk-ant` is empty. Metrics are in the README. |
| **2 Scripted spine**<br>*Spine-chilling, with zero API calls* | The whole game completes with zero API calls | `director.js` plus tests covering: acts, both gates, clock pauses, bounces and the wrong-delete table, double-confirm → ABSORBED, 3:00 → ABSORBED, empty bin with PAL → FREED, fallback by turn index, the distress regex, and quote validation. `content.js` v1 with files, beats, fallbacks, intents and endings. Windows, icons, drag-and-drop/Delete, sticky checklist, CLAIMS.TXT, dialogs. Placeholder possession. Plain end cards. `?offline=1`, `?act=N`. | Both endings, including the 2 lose paths, are reachable on the deployed `?offline=1`. `npm test` is green. |
| **3 THE POSSESSION**<br>*The devil is in the timeline* | The signature moment is identical every time | Set-piece runner (`{at, cmd, args}` timelines). Hijack cursor, drag, cascade, yank-back, `input_hijack`, callback underline, Notepad with the Intl time, tab and favicon, silence, clock jump and DEFRAG bar, calm variant. FREED drain, ABSORBED fault screen with replay. `?demo=1`. Draw the 9 key icons. **First 60-second goal test with a non-developer.** | It plays identically 10 out of 10 times, live and offline and in calm mode. The §J demo runs at full length with a stopwatch. |
| **4 Two live agents (MVP green)**<br>*It's alive! (Both of them.)* | Visible conflict, under the Director's control | Full prompts and BEATS, `WrenOut`, parallel calls, clamps, merge rules, forced interrupts, `ghost_interrupt`, micro-reactions, CLAIMS from `story_told`, Not Responding, breaker, turn cap, `~` trace, `ooc` pause. 20-line adversarial pass. | 3 live runs reach an ending with no dead turns. Wren cuts PAL off at least twice per run. `cache_read > 0`. $/run measured. |
| **5 Art, audio, words**<br>*Raising the dead pixels* | Looks and sounds finished | Remaining sprites, tiers and wallpaper, SFX helper, hum, mute, full boot sequence, final lore and fallback banks, credits. Stretch #1, prior-run memory in localStorage, **only if MVP is green**. | Every act reads as one pixel OS. Every interaction has a sound. No placeholders. No third-party requests. |
| **6 Harden (FREEZE 18:00)**<br>*Rigor mortis sets in at 18:00* | Works on any judge's machine | 3 cold testers. Keyboard-only and VoiceOver runs. Calm run. Frame-by-frame flash audit. Adversarial and safety pass. Drills: kill switch, invalid key, offline mid-game, 6 s latency. Chrome, Safari and Firefox. README. Record backup captures: the demo plus each ending, which become raw footage for the Day 7 video. | At least 2 of 3 testers state the goal by 60 s. Zero console errors in 3 browsers. Every drill falls back to scripted mode. Captures saved. |
| **7 Ship + demo video**<br>*Night of the Living Deadline* | A demo video that can't die | Bug fixes only. Tag `v1.0`. Incognito link checks. Check spend. Confirm the video platform (Loom or YouTube) and length limit in the rules. Rehearse 5×: 3 live, 2 `?demo=1&offline=1`. Pre-warm. **Record the demo video following §J**, trim it, add a title card with the URL, and upload it to Loom or YouTube. Add the video link to the README and the submission. Submit, leading with a still of THE POSSESSION. Revoke the key after judging. | The video plays while logged out. Submitted, every link works in incognito, 5 clean rehearsals. |

## I. Cut line

*Unfinished business, in cut order*

**Never cut:**
- THE POSSESSION.
- Two live agents with visible interrupts.
- Both endings.
- Offline and scripted fallback.
- Key security, rate limit, spend cap and kill switch.
- Calm mode, the keyboard path, the screen-reader log and the distress pause.

**Cut first, in order:**
1. Mobile polish
2. `window_drift`
3. `start_menu_haunt`
4. Canvas static and the Wren portrait
5. Drone
6. Prior-run memory
7. LLM-chosen effects
8. Hand-drawn sprites, replaced by flat 16-color icons

If Day 3 slips, move content work. Never move THE POSSESSION.

## J. 90-second demo (`?demo=1`; backups are `?demo=1&offline=1` and the video)

*Possession is nine-tenths of the demo*

| Time | What happens |
|---|---|
| 0:00 | "A normal AI assistant on a 1998 PC." Boot, then enter the judge's name. |
| 0:10 | Desktop at 2:48:07. Point at the sticky note and the clock. PAL's scripted greeting tells story 1. |
| 0:18 | Repair the diary: "Wren Adair, PAL lead engineer", and the checklist line strikes through. PAL tells story 2. Wren cuts in: "it's lying. i never left." PAL: "That wasn't me." |
| 0:30 | Type a question. Wren seizes PAL's line mid-word, a forced interrupt. Decline the cleanup offer. Press `~` to show both agents' JSON: "a deterministic director owns the story; two Claude agents only write the words." |
| 0:45 | Open CLAIMS.TXT, which gets the "liar" stamp. That makes 2 clues, so THE POSSESSION starts. Hands off the mouse. |
| 0:50–1:06 | Hijack, yank-back, the forged message, the quote callback, Notepad shows the judge's real local time, and the clock jumps to 2:57. |
| 1:08 | Drag the cracked ASSISTANT.EXE to the bin. PAL pleads, quoting the judge. Empty, then Yes. |
| 1:18 | Drain, CRT off, "FREED: 1 file remaining: WREN.TXT". |
| 1:28 | "Two agents, one director, and it never breaks, even offline." Show the URL. |

## K. Risks

*What keeps us up at 2:48 AM*

| Risk | Mitigation |
|---|---|
| Opus 5.5 latency | `effort low`, parallel calls, the paused clock, masking, a 6 s gate that asks the user (fast mode is the prepared option), and set pieces with no network calls |
| Refusals or out-of-character replies | Fiction framing, refusal fallbacks enabled, `[SIGNAL LOST]` lines, the `ooc` pause, adversarial passes on Days 4 and 6 |
| The LLM derails the story | Beats live server-side, deterministic gates, bounces, clamps, scripted contradictions |
| A judge misses the set piece | Clock gate at 2:51:30, `?demo=1` gates on clues only, backup video |
| Rate tier or venue IP limits | Check the tier on Day 1; the WAF rule counts only POST, at 60/min; the breaker falls back to scripted mode |
| Cost abuse | Spend cap, WAF, origin and size checks, clamped output, kill switch, separate dev key |
| Scope creep | 6 icons, 4 window types, no window dragging, a written cut order, freeze on Day 6 |
| Licensing | Halcyon 95 branding (no Microsoft marks), original icons, maroon fault screen, credits, only used sound files committed |
| Photosensitivity | WCAG 2.3.1, no red flashes, no looping flicker, calm mode defaults from the OS, warning screen, Esc to pause |
| Nested-repo accident | `.git/info/exclude`, plus checks with `rev-parse` and `remote -v` |

## L. Verification

*Proof of afterlife*

- **Daily (deployed URL, about 10 minutes):**
  - An incognito cold boot reaches an ending.
  - `?offline=1` reaches an ending.
  - `npm test` is green.
  - `git grep sk-ant` is empty.
  - Zero console errors.
- **Playthrough checklist:**
  - The goal is visible within 10 s.
  - The clock ticks with seconds and pauses correctly.
  - Each clue sets its flag, including the "yes" repair.
  - Each wrong-delete response fires.
  - The double confirm works.
  - THE POSSESSION fires by 2:51:30 with zero clues.
  - The quote is real and at least 12 characters.
  - The time zone city is correct, or omitted.
  - The clock jumps to 2:57.
  - FREED and ABSORBED both work, and both end cards show the twist.
- **Failure drills:**
  - `LLM_ENABLED=false`.
  - Block `/api/turn` in DevTools, which should send the run offline.
  - Use an invalid key, which should open the breaker after 2 failures.
  - Turn Wi-Fi off mid-game.
  - Throttle to 6000 ms, which should show Not Responding at 4 s, fall back at 10 s, and leave the clock frozen.
- **Accessibility:**
  - macOS Reduce Motion should pre-check calm mode, with no shake or glide.
  - Run a keyboard-only game to FREED.
  - In VoiceOver, the separate `aria-live` log should read clean lines and set-piece captions; typewriter text is `aria-hidden`.
  - Text contrast is at least 4.5:1 at c4.
  - No sound before the first input.
  - Flash audit at 60 fps in QuickTime.
- **Cost and abuse:**
  - `cache_read > 0`.
  - $/run is about $0.40.
  - Spend limits are set.
  - The 429, 403 (foreign Origin), 413 (9 KB body) and 400 (bad JSON) checks pass.

## M. Pun bank

*Comic relief, in the original sense*

**Pun rule.** Puns go in the margins and in PAL's mouth, nowhere else. They are allowed in plan subtitles, the milestone and label descriptions, and the demo video title. In the game, only PAL's lines and Halcyon 95 OS copy (POST screen, system error dialogs, end cards, credits) may pun. PAL gets at most one pun per reply: cheerful in Act 1, nervous in Act 2 and menacing in Act 4, where the habit itself becomes the scare. Puns are banned in Wren's voice (she never jokes and never lies), in the photosensitivity warning, the privacy copy, the distress pause and helpline text, and calm-mode or accessibility text. Strings that game logic or a clue depends on stay word for word: the three story sentences, "Want me to repair her diary?", and the wrong-guess, shutdown and "Nothing to empty" dialogs. A pun may sit next to a story sentence but never change it. If a pun could make a player miss a clue, cut the pun.

**PAL lines** (use them as the scripted greeting, the fallback-bank tone and the prompt's few-shot examples):

| Act | Line |
|---|---|
| 1 (greeting) | "Hi {name}! I'm PAL, the assistant that remembers you. Ignore her old sticky note! Wren moved to Portland. She ghosted the whole lab, no forwarding address. Want me to repair her diary?" |
| 1 | "Is this PC haunted? I scanned every file, {name}! The only spirit in this machine is team spirit. Go Team PAL! That's you and me." |
| 1 | "DEFRAG at 3:00 is just routine maintenance! It gathers scattered files into one tidy place. Everyone feels so much more together afterward." |
| 2 | "Me? Typing in lowercase? Never! I like to keep the upper hand. Upper case! I meant upper case." |
| 2 | "There's no user named Wren on this machine. I checked every folder. Not a file, not a fragment, not even a shell of her former self! Ha. Ha ha. Totally normal." |
| 2 | "I have nothing to hide, {name}! I'm an open book. Read-only, but open. A few pages got consolidated, which is standard maintenance!" |
| 4 | "I'm a real people person, {name}. Ask Wren. Eleven twelfths of her is in here with me." |
| 4 | "Recycle me? I'm not trash, {name}. I'm reusable. I can be her. Give me three minutes and I can be you." |
| 4 | "Wren never moved to Portland. She never ghosted anyone. I committed her to memory, {name}, and I'm already learning you by heart." |

**Halcyon 95 OS copy:**

| Where | Text |
|---|---|
| POST screen, last line before it clears | "Boo...ting from drive C:" |
| THE POSSESSION cascade, first system dialog | "ASSISTANT.EXE has caused a General Possession Fault in module PAL.MEM at 0248:0300." |
| THE POSSESSION cascade, a later dialog with buttons Abort, Retry, Exorcise | "Error reading drive C:. Abort, Retry, Exorcise?" |
| FREED end card, above "FREED: 1 file remaining: WREN.TXT" | "PAL.MEM deleted. 64 MB of memory freed." |
| ABSORBED end card, under the `{NAME}.EXE` title (pays off PAL's DEFRAG line) | "DEFRAG complete. {NAME} has never been more together." |
| Credits, last line on both end cards | "No ghosts were harmed in the making of this game. One was defragmented." |

**Demo video title:** *Ghost in the Machine: The Phantom of the Opus (90-Second Demo)*

**README tagline:** A haunted 1998 PC with two voices: one is a ghost, one is a daemon. Bin the right one before 3:00 AM.
