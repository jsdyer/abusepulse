import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {displayValue, observationsCsv, periodLabel, readSelection, valueFor} from '../web/model.mjs';
const snapshot = JSON.parse(readFileSync(new URL('../web/data/snapshots.json', import.meta.url)));
const {periods} = snapshot;

test('published periods are consecutive and carry traceable counts', () => {
  assert.ok(periods.length >= 12);
  let previous;
  for (const row of periods) {
    assert.match(row.source, /^https:\/\/crtc\.gc\.ca\/eng\/internet\/pub\/\d{8}\.htm$/);
    assert.ok(row.source.endsWith(row.end.replaceAll('-', '') + '.htm'));
    assert.ok(row.end <= snapshot.reviewed && row.end > row.start);
    if (previous) assert.equal(Date.parse(row.start) - Date.parse(previous.end), 86400000);
    previous = row;
    assert.ok(row.submissions > row.onlineForms && row.onlineForms > 0);
    assert.ok(Math.abs(row.weekly * 26 - row.submissions) / row.submissions < 0.04);
    for (const shares of [row.channels, row.sms]) {
      if (Object.keys(shares).length) {
        const total = Object.values(shares).reduce((a,b) => a + b, 0);
        assert.ok(total >= 97 && total <= 103, String(total));
      }
    }
  }
});
test('preserves changed SMS categories and imprecision', () => {
  const earlier = periods.find(row => row.end === '2025-09-30');
  const later = periods.find(row => row.end === '2026-03-31');
  assert.equal(earlier.sms.Phishing, 18);
  assert.equal(later.sms.Phishing, undefined);
  assert.equal(later.sms['Scams (including phishing)'], 29);
  assert.equal(displayValue(later,'onlineForms'), '≈4,545');
  assert.equal(displayValue(periods[0], 'submissions'), '>140,945');
  assert.equal(valueFor(periods.find(row => row.end === '2024-03-31'), 'demands'), 1);
  assert.equal(valueFor({actions: {}}, 'demands'), null);
});
test('share links restore the selection and handle unrecognized input', () => {
  assert.equal(readSelection('#period=2024-03-31&measure=notices', periods).period.end, '2024-03-31');
  assert.deepEqual(readSelection('#period=bad&measure=__proto__', periods), {period:periods.at(-1),measure:'submissions'});
  assert.equal(periodLabel(periods[0]), 'Apr – Sep 2020');
});
test('export includes observation units, qualifiers and original categories', () => {
  const csv = observationsCsv(periods);
  assert.match(csv,/"SMS spam type reported via online form","Scams \(including phishing\)","29","percent"/);
  assert.match(csv,/"Intake","Online forms","4545","complaints","approximately"/);
  assert.match(csv,/"CASL enforcement","Warning or Information Letters","11","measures"/);
  assert.match(csv,/"2025-10-01","2026-03-31"/);
});
