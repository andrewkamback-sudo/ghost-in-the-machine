// House rules (§N), checked against the source as text, so a failing scan blocks
// the Vercel deploy: haunt.js never deletes, moves, lists, truncates or stores,
// and it is the only file that touches the real machine.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const src = (f) => readFileSync(new URL(`../public/${f}`, import.meta.url), 'utf8');
const haunt = src('haunt.js');

test('haunt.js never deletes, moves, lists, truncates or stores anything', () => {
  const banned = /\.(removeEntry|remove|move|entries|values|keys|truncate)\s*\(|type:\s*['"]truncate|showSaveFilePicker|indexedDB|localStorage|sessionStorage|serviceWorker|\bcaches\b|document\.cookie|navigator\.storage/;
  const hit = haunt.match(banned);
  assert.equal(hit, null, `banned call in haunt.js: ${hit?.[0]}`);
});

test('every writable keeps existing data', () => {
  const all = haunt.match(/createWritable\([^)]*\)/g) || [];
  assert.ok(all.length > 0);
  for (const w of all) assert.equal(w, 'createWritable({ keepExistingData: true })');
});

test('no other public file touches the real machine', () => {
  const touch = /showDirectoryPicker|getFileHandle|getDirectoryHandle|createWritable|\bnew Notification\b|Notification\.requestPermission|window\.open\(|\.download\s*=|getUserMedia/;
  for (const f of readdirSync(new URL('../public/', import.meta.url))) {
    if (!f.endsWith('.js') || f === 'haunt.js') continue;
    assert.doesNotMatch(src(f), touch, `${f} must leave the real machine to haunt.js`);
  }
});

test('no public file uses browser storage or innerHTML with outside text', () => {
  for (const f of readdirSync(new URL('../public/', import.meta.url))) {
    if (!f.endsWith('.js')) continue;
    assert.doesNotMatch(src(f), /localStorage|sessionStorage|indexedDB|serviceWorker/, f);
    assert.doesNotMatch(src(f), /\.innerHTML\s*=/, `${f}: use textContent`);
  }
});
