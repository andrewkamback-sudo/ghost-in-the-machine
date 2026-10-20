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
