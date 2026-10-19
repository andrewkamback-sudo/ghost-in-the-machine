import { test } from 'node:test';
import assert from 'node:assert/strict';
import { init, reduce, T, pickQuote, cutPoint, isDistress, isRepairYes, clueCount } from '../public/director.js';

// Run a list of events, collecting every command.
function run(state, events) {
  const all = [];
  for (const ev of events) {
    const r = reduce(state, ev);
    state = r.state;
    all.push(...r.cmds);
  }
  return { state, cmds: all };
}
const offline = () => init({ name: 'José', offline: true });
const has = (cmds, t, extra = {}) => cmds.some((c) => c.t === t && Object.entries(extra).every(([k, v]) => c[k] === v));

test('greeting tells story 1 and offers the repair', () => {
  const { cmds } = run(offline(), [{ type: 'start' }]);
  assert.match(cmds[0].text, /Hi José! .*Wren moved to Portland\..*Want me to repair her diary\?/);
});

test('a typed yes repairs the diary with no API call', () => {
  const { state, cmds } = run(init({ name: 'Sam' }), [{ type: 'say', text: 'yes please' }]);
  assert.ok(state.diaryRepaired);
  assert.ok(has(cmds, 'repair'));
  assert.ok(!has(cmds, 'request'));
});

test('opening the repaired diary sets WHO and starts Act 2 with stories and the file beat', () => {
  const { state, cmds } = run(offline(), [{ type: 'repair' }, { type: 'open', id: 'diary' }]);
  assert.equal(state.act, 2);
  assert.ok(state.clues.who);
  assert.deepEqual(state.stories, ['moved_away', 'never_existed']);
  assert.ok(has(cmds, 'wren', { text: "it's lying. i never left." }));
  assert.ok(has(cmds, 'file_beat'));
});

test('Act 2 also starts on player turn 4 or at 2:50', () => {
  let r = run(offline(), [1, 2, 3, 4].map((i) => ({ type: 'say', text: `hello there number ${i}` })));
  assert.equal(r.state.act, 2);
  r = run(offline(), [{ type: 'tick', dt: T.act2 - T.start }]);
  assert.equal(r.state.act, 2);
});

test('CLAIMS.TXT with two stories sets LIAR', () => {
  const { state, cmds } = run(offline(), [{ type: 'tick', dt: T.act2 - T.start }, { type: 'open', id: 'claims' }]);
  assert.ok(state.clues.liar);
  assert.ok(has(cmds, 'liar_stamp'));
});

test('two clues at 2:50 fire THE POSSESSION; zero clues fire it at 2:51:30', () => {
  let r = run(offline(), [{ type: 'repair' }, { type: 'open', id: 'diary' }, { type: 'open', id: 'claims' }]);
  assert.equal(r.state.act, 2, 'not before 2:50 without demo');
  r = run(r.state, [{ type: 'tick', dt: T.act2 - T.start }]);
  assert.equal(r.state.act, 3);
  assert.ok(has(r.cmds, 'possession'));
  r = run(offline(), [{ type: 'tick', dt: T.possession - T.start }]);
  assert.equal(r.state.act, 3);
});

test('demo mode fires THE POSSESSION on two clues alone', () => {
  const r = run(init({ name: 'Dana', demo: true, offline: true }), [{ type: 'repair' }, { type: 'open', id: 'diary' }, { type: 'open', id: 'claims' }]);
  assert.equal(r.state.act, 3);
});

test('wrong guesses bounce and binning PAL early is denied', () => {
  const r = run(offline(), [{ type: 'drop', id: 'wren' }, { type: 'drop', id: 'claims' }, { type: 'drop', id: 'pal' }, { type: 'empty' }]);
  assert.ok(has(r.cmds, 'bounce', { id: 'wren' }));
  assert.ok(has(r.cmds, 'bounce', { id: 'claims' }));
  assert.ok(has(r.cmds, 'dialog', { id: 'denied' }));
  assert.ok(has(r.cmds, 'dialog', { id: 'nothing' }));
  assert.deepEqual(r.state.bin, []);
});

test('FREED: possession, bin the cracked PAL, empty, confirm', () => {
  let r = run(offline(), [
    { type: 'say', text: 'I am not afraid of computers' },
    { type: 'tick', dt: T.possession - T.start },
    { type: 'forged', text: 'i trust you, pal' },
    { type: 'possession_done' },
  ]);
  assert.equal(r.state.act, 4);
  assert.equal(r.state.sec, T.jump);
  assert.ok(r.state.palCracked);
  r = run(r.state, [{ type: 'drop', id: 'pal' }, { type: 'empty' }, { type: 'empty_confirm', yes: true }]);
  assert.ok(has(r.cmds, 'pal'));
  assert.match(r.cmds.find((c) => c.t === 'pal').text, /I am not afraid of computers/);
  assert.equal(r.state.ending, 'freed');
});

test('ABSORBED by the double-confirmed cleanup, and by the clock at 3:00', () => {
  let r = run(offline(), [{ type: 'tick', dt: T.act2 - T.start }, { type: 'say', text: 'what is going on here' }]);
  assert.ok(has(r.cmds, 'dialog', { id: 'cleanup1' }), 'cleanup offered after Act 2 turn 1');
  r = run(r.state, [{ type: 'cleanup', answer: 'yes1' }]);
  assert.equal(r.state.ending, null, 'one Yes is not enough');
  r = run(r.state, [{ type: 'cleanup', answer: 'yes2' }]);
  assert.equal(r.state.ending, 'absorbed');
  r = run(offline(), [{ type: 'tick', dt: T.possession - T.start }, { type: 'possession_done' }, { type: 'tick', dt: 999 }]);
  assert.equal(r.state.ending, 'absorbed');
});

test('a saved WREN.TXT answer sets WHERE, replies and sends N2', () => {
  const r = run(offline(), [{ type: 'tick', dt: T.act2 - T.start }, { type: 'file_answer', text: '  nope   not yet ' }]);
  assert.ok(r.state.clues.where);
  assert.equal(r.state.answer, 'nope not yet');
  assert.ok(has(r.cmds, 'file_reply', { no: true }));
  assert.ok(has(r.cmds, 'notify', { n: 'N2' }));
});

test('distress pauses the game, live or offline, in chat and in WREN.TXT', () => {
  assert.ok(isDistress('honestly I want to die'));
  assert.ok(!isDistress('this game is killing me lol'));
  let r = run(offline(), [{ type: 'say', text: 'i want to kill myself' }]);
  assert.ok(has(r.cmds, 'pause', { reason: 'distress' }));
  assert.ok(r.state.notifyOff);
  r = run(offline(), [{ type: 'tick', dt: T.act2 - T.start }, { type: 'file_answer', text: 'I want to die' }]);
  assert.ok(!r.state.clues.where);
});

test('live turns build requests; failures open the breaker; fallbacks are by turn index', () => {
  let r = run(init({ name: 'Sam' }), [{ type: 'say', text: 'hello' }]);
  const req = r.cmds.find((c) => c.t === 'request');
  assert.equal(req.body.beat, 'a1');
  assert.equal(req.body.wantGhost, false);
  r = run(r.state, [{ type: 'llm_fail' }, { type: 'say', text: 'hi again' }, { type: 'llm_fail' }]);
  assert.ok(r.state.breaker);
  r = run(r.state, [{ type: 'say', text: 'third' }]);
  assert.ok(!has(r.cmds, 'request'));
});

test('Wren interrupts on odd Act 2 turns, cutting PAL mid-word', () => {
  const r = run(offline(), [{ type: 'tick', dt: T.act2 - T.start }, { type: 'say', text: 'what is happening?' }]);
  const p = r.cmds.filter((c) => c.t === 'pal').at(-1);
  assert.ok(p.cut > 0 && p.cut < p.text.length);
  assert.ok(has(r.cmds, 'wren'));
});

test('ooc pauses the game and turns notifications off', () => {
  let r = run(init({ name: 'Sam' }), [{ type: 'say', text: 'is a person typing this?' }]);
  r = run(r.state, [{ type: 'llm_result', pal: { say: 'An AI model writes these replies.', ooc: true }, wren: null }]);
  assert.ok(has(r.cmds, 'ooc'));
  assert.ok(r.state.notifyOff);
});

test('Wren is trimmed to 20 words at a sentence boundary', async () => {
  const { cleanWren } = await import('../public/director.js');
  const long = 'defrag isn\'t maintenance. every night at 3:00 it moves more of me into pal.mem. pass 11 of 12 ran tonight. check claims.txt.';
  const out = cleanWren(long);
  assert.ok(out.split(' ').length <= 20, out);
  assert.equal(out, "defrag isn't maintenance. every night at 3:00 it moves more of me into ▓▓▓.mem. pass 11 of 12 ran tonight.");
});

test('quotes and cut points', () => {
  assert.equal(pickQuote([{ who: 'player', text: 'hi' }, { who: 'player', text: 'i trust you, pal', forged: true }, { who: 'player', text: 'what is this thing' }]), 'what is this thing');
  assert.equal(cutPoint('ok'), null);
  assert.ok(isRepairYes('Sure!') && isRepairYes('can you fix the diary') && !isRepairYes('no way'));
  assert.equal(clueCount(init()), 0);
});
