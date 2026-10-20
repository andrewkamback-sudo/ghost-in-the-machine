# Hackyard submission (draft, not submitted)

Submit by **Fri Oct 23, noon ET** (hard deadline 2 PM ET / 18:00 UTC).

## Write-up (474 / 500 characters)

```text
A haunted 1998 PC where two Claude agents fight for your trust: PAL, a too-helpful assistant, and Wren, red text cutting into its replies. One is lying. Work out which and bin it before 3:00 AM. It reaches past the browser, opt-in: real notifications, a WREN.TXT she writes to and reads back, her own window crawling across your desktop, voice, a webcam reflection, a 3 AM calendar file. A deterministic director owns the story, so every run reaches an ending, even offline.
```

Recount after any edit: `node -e "console.log(require('fs').readFileSync('SUBMISSION.md','utf8').split('\`\`\`text\n')[1].split('\n\`\`\`')[0].length)"`

## Model declaration

- **In the game:** PAL is Claude Sonnet 5.5 (`claude-sonnet-5-5`); Wren is Claude Opus 5.5 (`claude-opus-5-5`). Picked by benchmark; see the README.
- **Built with:** Claude Code, running Claude Opus 5.5.

## Fields

| Field | Value |
|---|---|
| Repo URL | https://github.com/andrewkamback-sudo/ghost-in-the-machine |
| Play | https://ghost-in-the-machine-seven.vercel.app |
| Screenshot | [`public/og.png`](public/og.png) (1200×630) |
| Demo video | Not recorded yet (YouTube, Vimeo or Loom) |

## Demo video plan

**Goal:** prove it haunts *real stuff*, outside the browser. That's the rule judges check first. Aim for **about 2:15**, one continuous take in `?demo=1` (4× clock), with captions added in the edit.

### Before recording

- [ ] **A fresh Brave window per take**, opened with the command below. Each one is a throwaway Brave with no extensions, bookmarks or saved permissions (so every permission prompt appears again), sized 1380×960 so Wren's window fits on the right and the game renders at a crisp 2×. It also turns on the folder feature, which Brave hides by default; without it the game falls back to downloading WREN.TXT. After each take press **Cmd+Q** in that window. Your normal Brave isn't affected.

  ```bash
  open -na "Brave Browser" --args --user-data-dir="$(mktemp -d)" --no-first-run --no-default-browser-check --enable-features=FileSystemAccessAPI --window-size=1380,960 --window-position=0,0 "https://ghost-in-the-machine-seven.vercel.app/?demo=1"
  ```

- [ ] **Clean Mac desktop**, with the empty `demo` folder on it to pick when Wren asks for a folder. Between takes, delete the `Halcyon 95` folder the game makes inside it.
- [ ] **Notifications:** Focus / Do Not Disturb off; **Brave Browser** allowed in System Settings › Notifications.
- [ ] **Sound:** system volume up. Make a short test recording: on the second setup screen click **Test sound**, and check that the recording has the chime and the buzz (about 2.5 s, then quiet). Some recorders drop system audio.
- [ ] **Pre-warm the AI:** play one chat turn on the live site a minute before the take.
- [ ] **Start rolling, then press Cmd+R** in the game window to start from the BIOS screen.

### Shot list

| Time | On screen | Why it matters |
|---|---|---|
| 0:00 | BIOS screen (silent), then the setup wizard. Caption: *"An AI assistant on a haunted 1998 PC. Two voices. One is lying."* | Hook |
| 0:10 | Setup: type your name, then click **Test sound** once: a chime and a buzz for about 2.5 s, then quiet. The button reads **Stop** while it plays; don't click it again unless you want to cut it short. You can click **Boot** straight away without losing sound. Caption: *"Everything that leaves the browser is opt-in."* | Harmless and opt-in; shows the sound works |
| 0:20 | Desktop: the startup chime, PAL's greeting, the sticky note, DEFRAG eating red sectors. Ask "who is Wren?", say **yes** to the diary repair, then click **Allow voice** when PAL asks. | Premise; PAL talking out loud |
| 0:40 | Open C:\WREN: the diary repairs. Red text cuts in: *"it's lying. i never left."* PAL: *"That wasn't me."* | The two agents clash |
| 0:50 | Allow notifications, then pick the `demo` folder when Wren asks. Switch to **Finder**: the Halcyon 95 folder and WREN.TXT appear. | A real file on your disk |
| 1:05 | Open WREN.TXT in TextEdit, type an answer after the arrow, save. Stay in TextEdit: a **macOS notification** from PAL arrives, *"Did you just save something? I heard the disk spin."* Back in the game, Wren has replied. | It reads your real file back; a real notification |
| 1:20 | When Wren asks, **Open her window**: a real window beside the browser. Then the fake Wren line, *"let pal keep me"*, and the real one calling it out. Caption: *"Real Wren can't write its name."* Then the **Halcyon Security** alert: click No. | Tension; the tell |
| 1:40 | Open CLAIMS.TXT (the second clue) and take your hands off the mouse: **THE POSSESSION**. The red cursor, the forged "i trust you, pal", and Wren's window crawling across the Mac desktop. | The set piece |
| 2:00 | Drag the cracked ASSISTANT.EXE to the bin; PAL pleads using your own words. Empty the bin, click Yes: **FREED**. Click the 3:00 AM button and open the file in Calendar. | Ending; a real calendar event |
| 2:10 | Switch to Finder: a last notification, *"1 file remaining: WREN.TXT"*. Drag the Halcyon 95 folder to the Trash. Caption: *"Delete the folder and it's gone."* Then show the URL and repo. | Reversible; call to action |

### Timing rules for the take

- **Don't open CLAIMS.TXT until after the Halcyon Security alert.** In demo mode THE POSSESSION starts as soon as you have two clues. Open it early and the fake-Wren scene and the alert never happen.
- **Stay out of the browser when you save WREN.TXT.** PAL's notification only appears while the game window isn't focused. (Its separate "where did you go?" notification is held back while WREN.TXT is waiting for your answer.)
- **Live AI lines change every take.** That's fine, and it proves they're live. Keep a backup take in `?demo=1&offline=1` (scripted lines only) in case the API stalls.
- **Flash frames are a few frames long.** In the edit, freeze one for about 1 s with the caption *"subliminal frame: PAL, then Wren"*.

### Recording and edit

- **Simplest:** Loom, one take, trimming only.
- **More control:** Cmd+Shift+5 or QuickTime, then iMovie or CapCut. Cut the waiting, add captions and zooms on the tells.
- Upload to YouTube (unlisted is fine), Vimeo or Loom; those play inline on the submission page. Paste the link into the table above.

### Open choices

- **Captions only, or a short voice-over?** I'd use captions plus the game's own sound, since the sound is part of the scare.
- **Webcam reflection: show your face or skip it?** It's optional. Click **Not now** if you'd rather not.
