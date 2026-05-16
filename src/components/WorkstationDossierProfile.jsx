import { formatEuro } from '../utils/formatters.js';

const fmt = (value) => (typeof value === 'number' ? value.toFixed(2) : '—');

const PILLAR_ABBREVS = {
  'EU Registration & Residency Pathway': 'Residency',
  'Diploma Recognition & Professional Accreditation': 'Diploma',
  'Real Estate & Healthy Housing': 'Real Estate',
  'Rental Market': 'Rental',
  'Home Ownership': 'Ownership',
  'Location & Infrastructure': 'Location',
  "The 'Clean' Shopping Basket": 'Basket',
  'Childcare & Educational Path': 'Childcare',
  'Health, Medical Access': 'Healthcare',
  'Environment & Pollution': 'Pollution',
  'Criminality and Street Safeness': 'Safety',
  'Infrastructure, Mobility & Logistics': 'Mobility',
  'Economy, Jobs, Taxes & Parity': 'Economy',
  'Climate & Resilience': 'Climate',
  'Social Capital & Work-Life Balance': 'Social',
};

const DossierSection = function dossierSection({ children, title }) {
  return (
    <div className="ws-dos-section">
      <div className="ws-dos-section__title">{title}</div>
      {children}
    </div>
  );
};

const DossierInfoRow = function dossierInfoRow({ accent = false, label, value }) {
  return (
    <div className="ws-dos-kv">
      <span className="ws-dos-kv__label">{label}</span>
      <span className={accent ? 'ws-dos-kv__value ws-dos-kv__value--accent' : 'ws-dos-kv__value'}>{value}</span>
    </div>
  );
};

const DossierPillarGrid = function dossierPillarGrid({ pillars }) {
  return (
    <div className="ws-dos-pillar-grid">
      {pillars.map((pillar) => {
        const tier = pillar.score >= 7.5 ? 'high' : pillar.score >= 6.0 ? 'mid' : 'low';
        return (
          <div key={pillar.key} className="ws-dos-pillar-row">
            <span className="ws-dos-pillar-label" title={pillar.label}>{PILLAR_ABBREVS[pillar.label] ?? pillar.label}</span>
            <span className={`ws-dos-pillar-score ws-dos-pillar-score--${tier}`}>{fmt(pillar.score)}</span>
          </div>
        );
      })}
    </div>
  );
};

const DossierProse = function dossierProse({ children, marginTop = 0 }) {
  return (
    <p className="ws-dos-prose" style={{ marginTop }}>
      {children}
    </p>
  );
};

const VerdictRow = function verdictRow({ label, labelColor, value }) {
  return (
    <div className="ws-dos-kv" style={{ alignItems: 'flex-start', marginTop: 4 }}>
      <span className="ws-dos-kv__label" style={{ color: labelColor }}>{label}</span>
      <span className="ws-dos-kv__value" style={{ whiteSpace: 'normal', color: 'var(--ws-ink-2)' }}>{value}</span>
    </div>
  );
};

export function DossierProfile({ city }) {
  if (!city) {
    return null;
  }

  const overview = city.city360 ?? {};
  const pillars = city.strategicBalance?.pillars ?? [];
  const childcareRows = [
    { label: 'Nursery / Net Cost', value: city.childcare?.nurseryNet ?? '—' },
    { label: 'School Starts Age', value: city.childcare?.schoolStart ?? '—' },
    { label: 'School Quality', value: city.childcare?.schoolQuality ?? '—' },
  ];
  const transitRows = [
    { accent: true, label: 'Monthly Pass', value: city.mobility?.pass ?? '—' },
    { label: 'Car Need', value: city.mobility?.carNeed ?? '—' },
    {
      label: 'Air Quality (PM2.5)',
      value: city.mobility?.pm25 != null ? `${city.mobility.pm25} µg/m³` : '—',
    },
  ];
  const verdictRows = [
    overview.moveHereIf && { label: '👍 Move if', labelColor: 'var(--ws-accent)', value: overview.moveHereIf },
    overview.stayAwayIf && { label: '👎 Avoid if', labelColor: 'var(--ws-rose)', value: overview.stayAwayIf },
  ].filter(Boolean);

  if (overview.stateAid) {
    childcareRows.push({ label: 'State Aid', value: overview.stateAid });
  }

  return (
    <>
      {city.tagline && <p className="ws-dos-tagline">{city.tagline}</p>}

      <DossierSection title="Pillar Scores">
        <DossierPillarGrid pillars={pillars} />
      </DossierSection>

      <DossierSection title="Housing &amp; Costs">
        <DossierInfoRow label="2BR Rent" value={city.housing?.rentSafe2Bed ?? '—'} accent />
        <DossierInfoRow label="Buy (Centre/sqm)" value={city.housing?.buyCentre ?? '—'} />
        <DossierInfoRow label="Buy (Suburbs/sqm)" value={city.housing?.buyOutside ?? '—'} />
        <DossierInfoRow label="Utilities /mo" value={overview.utilities ?? '—'} />
        <DossierInfoRow label="Budget A /mo" value={formatEuro(city.budgets?.oneParent?.midpoint ?? 0)} accent />
        <DossierInfoRow label="Budget B /mo" value={formatEuro(city.budgets?.bothWorking?.midpoint ?? 0)} />
      </DossierSection>

      <DossierSection title="Childcare &amp; Education">
        {childcareRows.map((row) => (
          <DossierInfoRow key={row.label} label={row.label} value={row.value} />
        ))}
      </DossierSection>

      <DossierSection title="Transit &amp; 360° Living">
        {transitRows.map((row) => (
          <DossierInfoRow key={row.label} label={row.label} value={row.value} accent={row.accent} />
        ))}
        {city.mobility?.transitSummary && <DossierProse marginTop={6}>{city.mobility.transitSummary}</DossierProse>}
        {overview.fifteenMinute && <DossierProse marginTop={4}>{overview.fifteenMinute}</DossierProse>}
      </DossierSection>

      {verdictRows.length > 0 && (
        <DossierSection title="Quick Verdict">
          {verdictRows.map((row, index) => (
            <VerdictRow key={row.label} label={row.label} labelColor={row.labelColor} value={row.value} />
          ))}
        </DossierSection>
      )}
    </>
  );
}
