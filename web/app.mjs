import { displayValue, measures, observationsCsv, periodLabel, readSelection, valueFor } from './model.mjs';

const byId = id => document.getElementById(id);
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function breakdown(target, entries, percent = false) {
  const container = byId(target);
  container.replaceChildren();
  if (entries.length === 0) {
    container.append(element('p', 'No breakdown listed in this snapshot.', 'missing'));
    return;
  }
  const list = element('dl', undefined, 'breakdown');
  for (const [label, value] of entries) {
    const row = element('div');
    row.append(element('dt', label), element('dd', percent ? value + '%' : value));
    if (percent) row.style.setProperty('--share', value + '%');
    list.append(row);
  }
  container.append(list);
}

function start(data) {
  const periods = data.periods;
  const periodInput = byId('period');
  const measureInput = byId('measure');
  for (const period of periods.slice().reverse()) periodInput.add(new Option(periodLabel(period), period.end));
  for (const [key, measure] of Object.entries(measures)) measureInput.add(new Option(measure.label, key));
  byId('coverage').textContent = periods[0].start.slice(0, 4) + ' — ' + periods.at(-1).end.slice(0, 4);
  byId('reviewed').textContent = periods.length + ' half-year reports · reviewed ' + data.reviewed;
  byId('csv').href = URL.createObjectURL(new Blob([observationsCsv(periods)], {type: 'text/csv;charset=utf-8'}));

  function select(period, measure) {
    history.replaceState(null, '', '#' + new URLSearchParams({period: period.end, measure}));
    render(period, measure);
  }

  function render(period, measure) {
    periodInput.value = period.end;
    measureInput.value = measure;
    byId('total').textContent = displayValue(period, 'submissions');
    byId('weekly').textContent = displayValue(period, 'weekly');
    byId('forms').textContent = displayValue(period, 'onlineForms');
    byId('detail-title').textContent = periodLabel(period);
    byId('source').href = period.source;
    byId('metric-note').textContent = measures[measure].note;
    const chart = byId('chart');
    const focused = chart.contains(document.activeElement);
    chart.replaceChildren();
    const largest = Math.max(1, ...periods.map(row => valueFor(row, measure) ?? 0));
    for (const row of periods) {
      const button = element('button', undefined, 'chart-row');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(row.end === period.end));
      button.append(element('span', periodLabel(row), 'label'));
      const track = element('span', undefined, 'track');
      track.setAttribute('aria-hidden', 'true');
      const bar = element('span', undefined, 'bar');
      bar.style.width = ((valueFor(row, measure) ?? 0) / largest * 100) + '%';
      track.append(bar);
      button.append(track, element('span', displayValue(row, measure), 'count'));
      button.addEventListener('click', () => select(row, measure));
      chart.append(button);
      if (focused && row.end === period.end) button.focus({preventScroll: true});
    }
    breakdown('channels', Object.entries(period.channels), true);
    breakdown('sms', Object.entries(period.sms), true);
    breakdown('actions', Object.entries(period.actions));
    const ranks = byId('ranks');
    ranks.replaceChildren();
    if (period.scamRanks.length) {
      const list = element('ol');
      for (const name of period.scamRanks) list.append(element('li', name));
      ranks.append(list);
    } else {
      ranks.append(element('p', 'No ranked list of scam categories in this snapshot.', 'missing'));
    }
    byId('source-note').hidden = !period.note;
    byId('source-note').textContent = period.note;
  }

  function fromLocation() {
    const {period, measure} = readSelection(location.hash, periods);
    render(period, measure);
  }
  periodInput.addEventListener('change', () => select(periods.find(row => row.end === periodInput.value), measureInput.value));
  measureInput.addEventListener('change', () => select(periods.find(row => row.end === periodInput.value), measureInput.value));
  window.addEventListener('hashchange', fromLocation);
  fromLocation();
  byId('loading').hidden = true;
  byId('explorer').hidden = false;
}

try {
  const response = await fetch(new URL('./data/snapshots.json', import.meta.url));
  if (!response.ok) throw new Error('Failed to load snapshots.');
  start(await response.json());
} catch {
  byId('coverage').textContent = 'Unavailable';
  byId('loading').textContent = 'The snapshot could not be loaded. Reload this page to try again.';
}
