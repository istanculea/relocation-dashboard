const isBrowser = typeof window !== 'undefined';

const PILLAR_LABELS = [
  'EU Registration & Residency Pathway',
  'Diploma Recognition & Professional Accreditation',
  'Real Estate & Healthy Housing',
  'Rental Market',
  'Home Ownership',
  'Location & Infrastructure',
  "The 'Clean' Shopping Basket",
  'Childcare & Educational Path',
  'Health, Medical Access',
  'Environment & Pollution',
  'Criminality and Street Safeness',
  'Infrastructure, Mobility & Logistics',
  'Economy, Jobs, Taxes & Parity',
  'Climate & Resilience',
  'Social Capital & Work-Life Balance',
];

export const buildExportFileName = (stamp, extension) => `relocation-scorecard-${stamp}.${extension}`;

export const serializeCsvValue = (value) => {
  const text = String(value ?? '');

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

export const buildCsvDocument = (rows) => {
  if (!rows.length) {
    return '';
  }

  const headers = Object.keys(rows[0]);

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => serializeCsvValue(row[header])).join(',')),
  ].join('\n');
};

const escXml = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const buildXlsDocument = (rows, { lensLabel, scenarioLabel, selectedYear }) => {
  const headers = [
    'Rank', 'City', 'Country', 'Overall Score',
    ...PILLAR_LABELS,
    'Monthly Budget', 'Rent 2BR', 'Buy Price / sqm',
    'Air Quality (PM2.5) µg/m³', 'Park Score', 'Safety Index',
    'Childcare Cost', 'School Start', 'Private Health Cover',
    'Transit Pass', 'Car Need', 'Language Score',
    'Move Here If', 'Stay Away If',
    'Top Pro 1', 'Top Pro 2', 'Top Pro 3', 'Top Pro 4',
    'Top Con 1', 'Top Con 2', 'Top Con 3', 'Top Con 4',
    'Personality', 'Fitting In',
    'Audit Status', 'Verified Count', 'Last Reviewed',
    'Active Lens', 'Scenario', 'Year',
  ];

  const thStyle = 'background:#1a1a2e;color:#fff;font-weight:bold;white-space:nowrap;';
  const headerRow = `<tr>${headers.map((header) => `<th style="${thStyle}">${escXml(header)}</th>`).join('')}</tr>`;

  const dataRows = rows.map((row, index) => {
    const pillars = row.strategicBalance?.pillars ?? [];
    const pillarByLabel = new Map(pillars.map((pillar) => [pillar.label, pillar.score]));
    const good = row.city360?.honestTruth?.good ?? [];
    const bad = row.city360?.honestTruth?.bad ?? [];
    const safetyMatch = String(row.support?.safety ?? '').match(/[\d.]+/);
    const langScore = (() => {
      const country = String(row.country ?? '').toLowerCase();

      if (country.includes('romania')) return '9.5';
      if (country.includes('spain')) return '8.2';
      if (country.includes('italy')) return '7.2';
      if (country.includes('germany') || country.includes('austria')) return '4.0';

      return '5.5';
    })();

    const cells = [
      index + 1,
      row.city,
      row.country,
      row.activeWeightedScore?.toFixed(2) ?? '',
      ...PILLAR_LABELS.map((label) => {
        const score = pillarByLabel.get(label);

        return score !== undefined ? Number(score).toFixed(2) : '';
      }),
      row.scenarioBudget ?? '',
      row.housing?.rentSafe2Bed ?? '',
      row.housing?.buyCentre ?? '',
      row.mobility?.pm25 ?? '',
      row.mobility?.parkScore ?? '',
      safetyMatch ? safetyMatch[0] : '',
      row.childcare?.nurseryNet ?? '',
      row.childcare?.schoolStart ?? '',
      row.health?.privateCover ?? '',
      row.mobility?.pass ?? '',
      row.mobility?.carNeed ?? '',
      langScore,
      row.city360?.moveHereIf ?? '',
      row.city360?.stayAwayIf ?? '',
      good[0] ?? '', good[1] ?? '', good[2] ?? '', good[3] ?? '',
      bad[0] ?? '', bad[1] ?? '', bad[2] ?? '', bad[3] ?? '',
      row.city360?.personality ?? '',
      row.city360?.fittingIn ?? '',
      row.auditOverall ?? '',
      row.verifiedCount ?? '',
      row.lastReviewed ?? '',
      lensLabel,
      scenarioLabel,
      selectedYear,
    ];

    const rowStyle = index % 2 === 0 ? '' : ' style="background:#f5f5f5;"';

    return `<tr${rowStyle}>${cells.map((cell) => `<td>${escXml(cell)}</td>`).join('')}</tr>`;
  }).join('');

  return [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office"',
    ' xmlns:x="urn:schemas-microsoft-com:office:excel"',
    ' xmlns="http://www.w3.org/TR/REC-html40">',
    '<head><meta charset="UTF-8">',
    '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>',
    '<x:ExcelWorksheet><x:Name>Relocation Dashboard</x:Name>',
    '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>',
    '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->',
    '</head>',
    '<body>',
    '<table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;font-family:sans-serif;font-size:12px;">',
    `<thead>${headerRow}</thead>`,
    `<tbody>${dataRows}</tbody>`,
    '</table>',
    '</body></html>',
  ].join('');
};

export const downloadExportFile = (filename, content, mimeType) => {
  if (!isBrowser) {
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  let revokeTimerId;

  try {
    anchor.click();
  } finally {
    anchor.remove();
    revokeTimerId = window.setTimeout(() => {
      window.URL.revokeObjectURL(url);
      window.clearTimeout(revokeTimerId);
    }, 0);
  }
};
