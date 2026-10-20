// The real haunts, on whatever OS this runs on (CI: Windows, Linux, macOS).
// The real-folder path runs against the browser's private file system, which
// gives haunt.js the same directory and file handles a picked folder does.
import { test, expect } from '@playwright/test';

const folderBrowsers = ['chromium', 'edge']; // showDirectoryPicker: Chrome and Edge only

test.beforeEach(async ({ page }) => {
  // A stand-in Notification so tests can see what would reach the OS.
  await page.addInitScript(() => {
    window.__sent = [];
    class FakeNotification {
      static permission = 'default';
      static requestPermission() { FakeNotification.permission = 'granted'; return Promise.resolve('granted'); }
      constructor(title, opts) { window.__sent.push({ title, body: opts?.body }); }
      close() {}
    }
    window.Notification = FakeNotification;
  });
  await page.goto('/?offline=1');
});

test('WREN.TXT: write, Windows-style save, read back, reply, epilogue', async ({ page }, info) => {
  test.skip(!folderBrowsers.includes(info.project.name), 'real folder is Chrome and Edge only');
  const out = await page.evaluate(async () => {
    const H = await import('/haunt.js');
    const C = await import('/content.js');
    const opfs = await navigator.storage.getDirectory();
    const root = await opfs.getDirectoryHandle(`save-${Date.now()}`, { create: true });
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    H.useFolder(root);
    const w1 = await H.writeWren(1, C.WREN_FILE.write1, C.WREN_FILE.write1Again);
    const fh = await (await root.getDirectoryHandle('Halcyon 95')).getFileHandle('WREN.TXT');
    const first = await (await fh.getFile()).text();
    // An editor saves the whole file back, Windows style (CRLF), with the answer after the arrow.
    await sleep(60);
    const w = await fh.createWritable();
    await w.write(first.replace(/\n/g, '\r\n') + 'yes, i believe you\r\n');
    await w.close();
    const polls = [];
    for (let i = 0; i < 4; i++) { polls.push(await H.pollWren()); await sleep(30); }
    const w2 = await H.writeWren(2, `\n====\n${C.WREN_FILE.replyYes}\n`);
    const afterReply = await (await fh.getFile()).text();
    const w3 = await H.writeWren(3, `\n====\n${C.WREN_FILE.freed.join('\n')}\n`);
    const final = await (await fh.getFile()).text();
    return { w1, w2, w3, first, polls, afterReply, final, parsed: H.parseAnswer(final), manifest: H.manifest({ fileMode: 'folder', notifications: false }) };
  });
  expect(out.w1.ok).toBe(true);
  expect(out.first.split('\n')[0]).toBe('WREN.TXT was left here by the game Ghost in the Machine. It is safe to delete.');
  expect(out.polls.find((p) => p?.answer)?.answer).toBe('yes, i believe you');
  expect(out.w2.ok && out.w3.ok).toBe(true);
  expect(out.afterReply).toContain('yes, i believe you'); // the player's words stay
  expect(out.parsed).toBe('yes, i believe you'); // Wren's reply is never read as the answer
  expect(out.final).toContain('pal.mem is gone');
  expect(out.manifest.items[0]).toContain('with one file in it, WREN.TXT');
});

test('the guard leaves files and folders it did not make alone', async ({ page }, info) => {
  test.skip(!folderBrowsers.includes(info.project.name), 'real folder is Chrome and Edge only');
  const out = await page.evaluate(async () => {
    const H = await import('/haunt.js');
    const C = await import('/content.js');
    const opfs = await navigator.storage.getDirectory();
    // A WREN.TXT someone else made.
    const a = await opfs.getDirectoryHandle(`foreign-${Date.now()}`, { create: true });
    const fa = await (await a.getDirectoryHandle('Halcyon 95', { create: true })).getFileHandle('WREN.TXT', { create: true });
    const wa = await fa.createWritable(); await wa.write('my own notes, do not touch\n'); await wa.close();
    H.useFolder(a);
    const foreignFile = await H.writeWren(1, C.WREN_FILE.write1, C.WREN_FILE.write1Again);
    const untouched = await (await fa.getFile()).text();
    // An empty Halcyon 95 folder someone else made.
    const b = await opfs.getDirectoryHandle(`folder-${Date.now()}`, { create: true });
    const hb = await b.getDirectoryHandle('Halcyon 95', { create: true });
    H.useFolder(b);
    const foreignFolder = await H.writeWren(1, C.WREN_FILE.write1, C.WREN_FILE.write1Again);
    let created = true;
    try { await hb.getFileHandle('WREN.TXT'); } catch { created = false; }
    return { foreignFile, untouched, foreignFolder, created, manifest: H.manifest({ fileMode: 'folder', notifications: false }) };
  });
  expect(out.foreignFile.ok).toBe(false);
  expect(out.foreignFile.reason).toBe('ForeignFile');
  expect(out.untouched).toBe('my own notes, do not touch\n');
  expect(out.foreignFolder.reason).toBe('ForeignFolder');
  expect(out.created).toBe(false);
  expect(out.manifest.items[0]).toContain('alone');
  expect(out.manifest.remove).toHaveLength(0);
});

test('a moved or deleted WREN.TXT stops all writes and is never recreated', async ({ page }, info) => {
  test.skip(!folderBrowsers.includes(info.project.name), 'real folder is Chrome and Edge only');
  const out = await page.evaluate(async () => {
    const H = await import('/haunt.js');
    const C = await import('/content.js');
    const opfs = await navigator.storage.getDirectory();
    const root = await opfs.getDirectoryHandle(`moved-${Date.now()}`, { create: true });
    H.useFolder(root);
    await H.writeWren(1, C.WREN_FILE.write1, C.WREN_FILE.write1Again);
    const dir = await root.getDirectoryHandle('Halcyon 95');
    await dir.removeEntry('WREN.TXT'); // the player deletes it (test code, not the game)
    const polls = [await H.pollWren(), await H.pollWren(), await H.pollWren()];
    const w2 = await H.writeWren(2, 'reply');
    let recreated = true;
    try { await dir.getFileHandle('WREN.TXT'); } catch { recreated = false; }
    return { polls, w2, recreated, manifest: H.manifest({ fileMode: 'folder', notifications: false }) };
  });
  expect(out.polls.at(-1)).toEqual({ moved: true });
  expect(out.w2.ok).toBe(false);
  expect(out.recreated).toBe(false);
  expect(out.manifest.items[0]).toContain('until you moved it');
});

test('Safari and Firefox path: the download, and reading the file back (LF and CRLF)', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.evaluate(async () => { const H = await import('/haunt.js'); const C = await import('/content.js'); H.downloadWren(C.WREN_FILE.write1); }),
  ]);
  expect(download.suggestedFilename()).toBe('WREN.TXT');
  const out = await page.evaluate(async () => {
    const H = await import('/haunt.js');
    const C = await import('/content.js');
    const crlf = new File([C.WREN_FILE.write1.replace(/\n/g, '\r\n') + 'nope\r\n'], 'WREN (1).TXT');
    const lf = new File([C.WREN_FILE.write1 + 'i believe you'], 'wren.txt');
    const wrongName = new File([C.WREN_FILE.write1 + 'x'], 'notes.txt');
    const wrongHead = new File(['hello\n-> yes'], 'WREN.TXT');
    return Promise.all([crlf, lf, wrongName, wrongHead].map((f) => H.readHerFile(f)));
  });
  expect(out[0]).toEqual({ ok: true, answer: 'nope' });
  expect(out[1]).toEqual({ ok: true, answer: 'i believe you' });
  expect(out[2].ok).toBe(false);
  expect(out[3].ok).toBe(false);
});

test('notifications: only after the click, at most 5, never before opting in', async ({ page }) => {
  const out = await page.evaluate(async () => {
    const H = await import('/haunt.js');
    const before = H.notify('ASSISTANT.EXE', 'too early');
    const status = await new Promise((r) => H.askNotify(r));
    const sent = [1, 2, 3, 4, 5, 6].map((i) => H.notify('ASSISTANT.EXE', `line ${i}`));
    H.stopNotify();
    return { before, status, sent, count: H.notifyCount(), log: window.__sent };
  });
  expect(out.before).toBe(false);
  expect(out.status).toBe('on');
  expect(out.sent).toEqual([true, true, true, true, true, false]);
  expect(out.log.map((n) => n.body)).toEqual(['line 1', 'line 2', 'line 3', 'line 4', 'line 5']);
});

test('the 3:00 AM calendar file: next 3 AM in local time, an alarm, folded lines', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.evaluate(async () => { const H = await import('/haunt.js'); H.saveIcs({ summary: 'DEFRAG.EXE: pass 12 of 12', description: "Hi José! It's me, José. I'll take it from here.\n\nFrom the game Ghost in the Machine. Delete this event to remove it." }); }),
  ]);
  expect(download.suggestedFilename()).toBe('wren-3am.ics');
  const fs = await import('node:fs/promises');
  const ics = await fs.readFile(await download.path(), 'utf8');
  expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/);
  expect(ics).toMatch(/DTSTART:\d{8}T030000\r\n/); // floating local time, no Z
  expect(ics).toContain('BEGIN:VALARM');
  expect(ics).toContain('SUMMARY:DEFRAG.EXE: pass 12 of 12');
  for (const line of ics.split('\r\n')) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
  const next = await page.evaluate(async () => {
    const H = await import('/haunt.js');
    return [H.nextThreeAM(new Date(2026, 9, 21, 2, 59)).getDate(), H.nextThreeAM(new Date(2026, 9, 21, 3, 1)).getDate()];
  });
  expect(next).toEqual([21, 22]);
});

test("Wren's window opens on a click, shows her lines, and closes itself", async ({ page, context }, info) => {
  test.skip(info.project.name === 'webkit', 'pop-up windows from script are not reliable in WebKit automation');
  await page.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<button id="t-open" style="position:fixed;top:0;left:0;z-index:9999">open</button>'); });
  await page.evaluate(async () => {
    window.H = await import('/haunt.js');
    document.getElementById('t-open').onclick = () => { window.opened = window.H.openWrenWindow(); };
  });
  const [popup] = await Promise.all([context.waitForEvent('page'), page.click('#t-open')]);
  await popup.waitForLoadState();
  await page.evaluate(async () => { await window.H.wrenWindowSay('defrag isn\'t maintenance.'); await window.H.wrenWindowDrift({ calm: true }); });
  await expect(popup.locator('#lines')).toContainText("defrag isn't maintenance.");
  await page.evaluate(() => window.H.closeWrenWindow(0));
  await popup.waitForEvent('close');
  expect(await page.evaluate(() => window.H.hasWrenWindow())).toBe(false);
});
