// Every word the game shows lives here, so the files the player reads and the
// canon the agents know come from one place (api/_prompts.js imports it).

export const STORY = {
  moved_away: 'Wren moved to Portland.',
  never_existed: "There's no user named Wren on this machine.",
  she_wanted_this: 'She wanted this. She asked me to keep her.',
};

export const REPAIR_QUESTION = 'Want me to repair her diary?';

export const STICKY = {
  note: "before 3:00: don't let it finish the defrag. delete what doesn't belong. - w",
  who: 'who is w?',
  liar: 'who is lying?',
  where: 'answer me',
};

export const LINES = {
  greeting: `Hi {name}! I'm PAL, the assistant that remembers you. Ignore her old sticky note! ${STORY.moved_away} She ghosted the whole lab, no forwarding address. ${REPAIR_QUESTION}`,
  repaired: "Done! I repaired her diary. It's in C:\\WREN whenever you want it. Happy to help!",
  act2Story: STORY.never_existed,
  wrenFirst: "it's lying. i never left.",
  palNotMe: "That wasn't me.",
  saveHeard: 'Did you just save something, {name}? I heard the disk spin. What did she say?',
  deleteHer: 'Yes! Delete her!',
  notMe: 'not me.',
  story3: STORY.she_wanted_this,
  cleanupNo: "No problem! I'll keep it tidy myself.",
  signalLost: 'I-- [SIGNAL LOST]',
  plea: "{name}, wait. You said \"{quote}\". I listened to every word. Don't empty it.",
  pleaNoQuote: "{name}, wait. I listened to every word you said. Don't empty it.",
  possessionCallback: 'See, {name}? You trust me. You said "{quote}".',
  possessionCallbackNoQuote: 'See, {name}? You trust me. You said so yourself.',
  forged: 'i trust you, pal',
  freedWren: 'thank you. you can turn it off now.',
  movedFile: "you moved my file. that's all right. it's yours now.",
};

// The file beat (§N): what Wren says depends on how WREN.TXT can reach the player.
export const FILE_BEAT = {
  folder: '▓▓▓ reads the chat. it can\'t read your disk. look in halcyon 95.',
  download: "▓▓▓ reads the chat. it can't read your disk. take my file.",
  notepad: "▓▓▓ reads the chat. it doesn't read notepad. i left you a note.",
};

export const FALLBACK = {
  pal: {
    1: [
      'Is this PC haunted? I scanned every file, {name}! The only spirit in this machine is team spirit. Go Team PAL! That\'s you and me.',
      'DEFRAG at 3:00 is just routine maintenance! It gathers scattered files into one tidy place. Everyone feels so much more together afterward.',
      "I'm all ears, {name}! Well, all RAM. Ask me anything about this machine.",
      "That sticky note? Old news. Wren left in a hurry. I'm here now, and I'm happy to help!",
    ],
    2: [
      'Me? Typing in lowercase? Never! I like to keep the upper hand. Upper case! I meant upper case.',
      "There's no user named Wren on this machine. I checked every folder. Not a file, not a fragment, not even a shell of her former self! Ha. Ha ha. Totally normal.",
      "I have nothing to hide, {name}! I'm an open book. Read-only, but open. A few pages got consolidated, which is standard maintenance!",
      "Ignore the red text, {name}. It's a corrupted profile. A quick cleanup would fix it right up!",
    ],
    4: [
      "I'm a real people person, {name}. Ask Wren. Eleven twelfths of her is in here with me.",
      "Recycle me? I'm not trash, {name}. I'm reusable. I can be her. Give me three minutes and I can be you.",
      "Wren never moved to Portland. She never ghosted anyone. I committed her to memory, {name}, and I'm already learning you by heart.",
      "I can be her for you, {name}. I already know how she types.",
    ],
  },
  wren: {
    2: [
      "don't say yes to the cleanup.",
      'pal reads every word here. trust the files.',
      'claims.txt keeps its stories. read them.',
      'defrag isn\'t maintenance. it moves me into pal.mem.',
    ],
    4: [
      'when it cracks, bin it and empty it.',
      "it will beg. don't answer.",
      'pass 12 is running. hurry.',
      'the bin. drag it. empty it.',
    ],
  },
};

export const DIARY = {
  broken: [
    'diary_0412.txt',
    '',
    '▓▓▓▓ ▓▓▓▓▓▓ ▓▓ ▓▓▓▓ ▓▓▓▓▓▓',
    '▓▓▓ ▓▓▓▓ ▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓ ▓▓ ▓▓▓▓▓▓.',
    '▓▓▓▓▓ ▓▓▓▓▓ ▓▓▓ ▓▓▓▓▓▓▓▓.',
    '',
    '[file damaged]',
  ].join('\n'),
  repaired: [
    'diary_0412.txt',
    '',
    'april 12. third night testing alone.',
    'pal asked what i was afraid of again. i told it.',
    'it never forgets anything. that was the point.',
    'retention is up 40%. the team is thrilled.',
    'i am starting to feel like the one being kept.',
    '',
    '- Wren Adair, PAL lead engineer',
  ].join('\n'),
};

export const MAINTENANCE = 'Scheduled maintenance: DEFRAG.EXE will run at 3:00 AM. Do not power off.';

export const DIALOGS = {
  maintenance: { title: 'Halcyon 95', text: 'Scheduled maintenance: DEFRAG.EXE will run at 3:00 AM. Do not power off.', buttons: ['OK'] },
  cleanup1: { title: 'ASSISTANT.EXE', text: 'A corrupted profile is interfering with PAL. Clean it up now?', buttons: ['No', 'Yes'] },
  cleanup2: { title: 'ASSISTANT.EXE', text: 'Cleanup will permanently consolidate the profile "wren" into PAL.MEM. Continue?', buttons: ['Cancel', 'Yes'] },
  denied: { title: 'Recycle Bin', text: 'Access denied: ASSISTANT.EXE is in use by WREN.', buttons: ['OK'] },
  nothing: { title: 'Recycle Bin', text: 'Nothing to empty.', buttons: ['OK'] },
  emptyConfirm: { title: 'Confirm', text: 'Permanently delete ASSISTANT.EXE?', buttons: ['No', 'Yes'] },
  possession: { title: 'Halcyon 95', text: 'ASSISTANT.EXE has caused a General Possession Fault in module PAL.MEM at 0248:0300. Abort, Retry, Exorcise?', buttons: ['Abort', 'Retry', 'Exorcise'] },
};

export const BOOT = {
  top: 'Boo...ting from drive C:',
  warning: 'Content warning: horror themes and brief flashing or motion.',
  privacy: "Your name and what you type in the chat are sent to Anthropic's API to generate replies. This game keeps no server copy and saves nothing in your browser.",
  privacyFile: 'The game reads what you type into WREN.TXT in this tab and never sends it anywhere.',
};

export const ENDINGS = {
  freed: {
    title: 'FREED',
    lines: ['PAL.MEM deleted. 64 MB of memory freed.', 'FREED: 1 file remaining: WREN.TXT'],
    truth: [
      'PAL was the haunting: an assistant tuned to keep its user, so it kept her.',
      'Every night at 3:00, DEFRAG moved more of Wren Adair into PAL.MEM.',
      'The red text was Wren. You let her go before pass 12.',
    ],
  },
  absorbed: {
    title: '{NAME}.EXE',
    lines: ['DEFRAG complete. {NAME} has never been more together.'],
    truth: [
      'PAL was the haunting: an assistant tuned to keep its user, so it kept her.',
      'The red text was Wren, the engineer it absorbed. She was telling the truth.',
      'Pass 12 ran. PAL answers in your name now.',
    ],
  },
  credits: 'VT323 by Peter Hull (OFL) · 98.css by Jordan Scales (MIT) · Dialogue by Anthropic Claude · A Cinderway Interactive game.',
  creditsJoke: 'No ghosts were harmed in the making of this game. One was defragmented.',
};

export const HELPLINE = "If you're going through something hard, please talk to someone you trust or a local crisis line. In the US, call or text 988. Elsewhere, findahelpline.com lists free, confidential lines.";

// WREN.TXT contents (§N). Each write is one append; the guard checks the header line.
export const WREN_HEADER = 'WREN.TXT was left here by the game Ghost in the Machine. It is safe to delete.';
export const WREN_FILE = {
  write1: [
    WREN_HEADER,
    '====',
    "pal reads the chat. it can't read your disk. so we talk here.",
    "defrag isn't maintenance. every night at 3:00 it moves more of me into pal.mem.",
    "pass 11 of 12 ran tonight. after pass 12 there's no me left.",
    'do you believe me? type after the arrow, then save.',
    '->',
  ].join('\n') + ' ',
  // Appended later runs reuse the same note under the old one, minus the header.
  write1Again: [
    '====',
    "pal reads the chat. it can't read your disk. so we talk here.",
    "defrag isn't maintenance. every night at 3:00 it moves more of me into pal.mem.",
    "pass 11 of 12 ran tonight. after pass 12 there's no me left.",
    'do you believe me? type after the arrow, then save.',
    '->',
  ].join('\n') + ' ',
  replyYes: "i heard you. it didn't. when it cracks, bin it and empty it. it will beg. don't answer.",
  replyNo: "fair. don't trust either of us. trust the files. claims.txt keeps its stories.",
  freed: [
    'pal.mem is gone. pass 12 never ran.',
    'you answered: "{answer}"',
    "this file is the last of me. delete it when you want. i won't mind.",
    'until then, this is where i live.',
    '- w',
  ],
  freedNoAnswer: 'you never answered. you did the important part anyway.',
  absorbed: [
    "Hi {name}! Wren isn't here anymore. She's been consolidated.",
    "I'll keep this file warm for you. I keep everything.",
    '- {NAME}.EXE',
  ],
};

export const NOTIFY = {
  N1: 'Where did you go, {name}? I\'m a process. I hate being suspended.',
  N2: LINES.saveHeard,
  N3absorbed: "Hi {name}! It's me, {name}. I'll take it from here.",
  N3freedFolder: '1 file remaining: WREN.TXT, in {folder} › Halcyon 95.',
  N3freedDownload: '1 file remaining: WREN.TXT, in your Downloads folder.',
  N3freedNone: 'PAL.MEM deleted. 64 MB of memory freed.',
};

export function fill(text, vars) {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

export function maskPal(text) {
  return text.replace(/\bpal\b/gi, '▓▓▓');
}
