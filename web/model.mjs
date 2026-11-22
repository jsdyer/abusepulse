// A blank value means the snapshot did not publish the measure under this label.
export const measures = {
  submissions: {label: 'All submissions', note: 'Reports received by the Spam Reporting Centre through all intake channels.'},
  onlineForms: {label: 'Online forms', note: 'Approximate number of complaints filed through the detailed online form.'},
  weekly: {label: 'Weekly average', note: 'Weekly average stated by the CRTC for each six-month period.'},
  notices: {label: 'Notices to produce', note: 'CRTC notices requesting information in CASL investigations.'},
  demands: {label: 'Preservation demands', note: 'CRTC demands to preserve information in CASL investigations.'},
};

export function valueFor(row, key) {
  if (key === 'notices') return row.actions['Notices to Produce'] ?? row.actions['Notice to Produce'] ?? null;
  if (key === 'demands') return row.actions['Preservation Demands'] ?? row.actions['Preservation Demand'] ?? null;
  return row[key] ?? null;
}

export function displayValue(row, key) {
  const value = valueFor(row, key);
  if (value === null) return 'Unlisted';
  const over = (key === 'submissions' && row.submissionQualifier === 'over') ||
    (key === 'weekly' && row.weeklyQualifier === 'over');
  const prefix = over ? '>' : key === 'onlineForms' ? '≈' : '';
  return prefix + value.toLocaleString('en-CA');
}

export function periodLabel(row) {
  const startYear = row.start.slice(0, 4);
  const endYear = row.end.slice(0, 4);
  return row.start.slice(5, 7) === '10' ? `Oct ${startYear} – Mar ${endYear}` : `Apr – Sep ${endYear}`;
}

export function readSelection(hash, periods) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return {
    period: periods.find(row => row.end === params.get('period')) ?? periods.at(-1),
    measure: Object.hasOwn(measures, params.get('measure')) ? params.get('measure') : 'submissions',
  };
}

export function observationsCsv(periods) {
  const rows = [['period_start','period_end','series','measure','value','unit','qualifier','source']];
  for (const row of periods) {
    const add = (series, measure, value, unit, qualifier = 'as published') =>
      rows.push([row.start, row.end, series, measure, value, unit, qualifier, row.source]);
    add('Intake','Submissions',row.submissions,'submissions',row.submissionQualifier);
    add('Intake','Weekly average',row.weekly,'submissions per week',row.weeklyQualifier);
    add('Intake','Online forms',row.onlineForms,'complaints','approximately');
    for (const [label, value] of Object.entries(row.channels)) add('Spam source reported via online form',label,value,'percent');
    for (const [label, value] of Object.entries(row.sms)) add('SMS spam type reported via online form',label,value,'percent');
    for (const [label, value] of Object.entries(row.actions)) add('CASL enforcement',label,value,'measures');
    row.scamRanks.forEach((label, i) => add('Scam categories reported via online form',label,i + 1,'rank'));
  }
  return rows.map(row => row.map(cell => '"' + String(cell).replaceAll('"', '""') + '"').join(',')).join('\r\n') + '\r\n';
}
