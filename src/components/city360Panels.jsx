import {
  auditStatusMeta,
} from '../data/dashboardConfig.js';
import { formatEuro } from '../utils/formatters.js';
import { CarFreeMatrix, SunshineRainfallTimeline } from './ClimateLogisticsPanel';
import { LensAwareScoreBreakdown } from './LensAwareScoreDisplay.jsx';
import { PillarScoreGrid } from './PillarScoreDisplay.jsx';

const formatScore = (value) => value.toFixed(2);

const formatPm = (value) => (Number.isFinite(value) ? `${value} ug/m3` : 'n/a');

// Returns value if set, otherwise a styled "Data pending" placeholder
const orPending = (val) =>
  (val != null && val !== '') ? val : <span className="detail-pending">Data pending.</span>;

const hasFiniteTrendValues = (first, last) => Number.isFinite(first) && Number.isFinite(last);

const formatTrendDelta = (delta, isPm25 = false) => {
  if (delta === 0) {
    return 'Flat since 2023';
  }

  if (isPm25) {
    return `${delta > 0 ? '+' : ''}${delta} since 2023`;
  }

  return `${delta > 0 ? '+' : ''}${formatScore(delta)} since 2023`;
};

const buildTrendDelta = (trends, key, positiveWhenDown = false) => {
  if (!trends?.length || trends.length < 2) {
    return null;
  }

  const first = trends[0][key];
  const last = trends[trends.length - 1][key];

  if (!hasFiniteTrendValues(first, last)) {
    return null;
  }

  const delta = last - first;
  const isPositive = positiveWhenDown ? delta < 0 : delta > 0;
  const isNegative = positiveWhenDown ? delta > 0 : delta < 0;

  return { delta, isPositive, isNegative };
};

const buildBudgetTrendDelta = (trends, key) => {
  if (!trends?.length || trends.length < 2) {
    return null;
  }

  const first = trends[0][key];
  const last = trends[trends.length - 1][key];

  if (!Number.isFinite(first) || !Number.isFinite(last)) {
    return null;
  }

  const delta = last - first;
  const pct = Math.round((delta / first) * 100);

  return { delta, pct };
};

const renderScoreDelta = (info) => {
  if (!info) {
    return <span className="trend-delta trend-delta--flat">—</span>;
  }

  const { delta, isPositive, isNegative } = info;
  const cls = isPositive ? 'trend-delta trend-delta--positive' : isNegative ? 'trend-delta trend-delta--negative' : 'trend-delta trend-delta--flat';
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';

  return (
    <span className={cls}>
      {arrow} {delta > 0 ? '+' : ''}{formatScore(delta)}
    </span>
  );
};

const renderBudgetDelta = (info) => {
  if (!info) {
    return <span className="trend-delta trend-delta--flat">—</span>;
  }

  const { delta, pct } = info;
  const cls = delta > 0 ? 'trend-delta trend-delta--pressure' : 'trend-delta trend-delta--positive';
  const arrow = delta > 0 ? '↑' : '↓';

  return (
    <span className={cls}>
      {arrow} {formatEuro(delta)} ({pct > 0 ? `+${pct}` : pct}%)
    </span>
  );
};

const trendNarrativeBuilders = [
  (first, last) => {
    if (!hasFiniteTrendValues(first.overallScore, last.overallScore)) {
      return null;
    }

    const delta = last.overallScore - first.overallScore;

    if (delta < -0.3) {
      return `Score has declined ${Math.abs(delta).toFixed(2)} points since 2023, reflecting rising cost pressure across the tracked pillars.`;
    }

    if (delta > 0.3) {
      return `Score has improved ${delta.toFixed(2)} points since 2023, a signal of favorable drift relative to the rest of the roster.`;
    }

    return `Score has stayed within ${Math.abs(delta).toFixed(2)} points of the 2023 baseline — unusually stable by roster standards.`;
  },
  (first, last) => {
    if (!Number.isFinite(first.oneParentBudget) || !Number.isFinite(last.oneParentBudget) || first.oneParentBudget === 0) {
      return null;
    }

    const pct = Math.round(((last.oneParentBudget - first.oneParentBudget) / first.oneParentBudget) * 100);

    if (pct >= 12) {
      return `Single-income monthly budget has grown ${pct}% since 2023 — above the roster median for cost trajectory.`;
    }

    if (pct <= 2) {
      return `Budget pressure has been minimal, tracking within ${pct}% of the 2023 baseline.`;
    }

    return `Single-income budget is running ${pct}% above the 2023 level, in line with the broader roster average.`;
  },
  (first, last) => {
    if (!Number.isFinite(first.pm25) || !Number.isFinite(last.pm25)) {
      return null;
    }

    const delta = last.pm25 - first.pm25;

    if (delta < 0) {
      return `Air quality has improved ${Math.abs(delta)} µg/m³ from the 2023 capture — a meaningful quality-of-life gain across the trend window.`;
    }

    if (delta > 0) {
      return `PM2.5 has risen ${delta} µg/m³ from 2023, adding marginal respiratory-risk pressure to the multi-year picture.`;
    }

    return `PM2.5 has held flat at ${last.pm25} µg/m³ across all four years — air quality is stable.`;
  },
];

const buildTrendNarrative = (trends) => {
  if (!trends?.length || trends.length < 2) {
    return [];
  }

  const first = trends[0];
  const last = trends[trends.length - 1];

  return trendNarrativeBuilders.map((buildItem) => buildItem(first, last)).filter(Boolean);
};

export const City360OverviewPanel = function city360OverviewPanel({
  city,
  scenarioKey,
  rankingRows,
  thresholds,
  embedded = false,
}) {
  if (!city) {
    return null;
  }

  const overview = city.city360;
  const rankPosition = rankingRows.findIndex((row) => row.key === city.key) + 1;
  const wrapperClassName = embedded ? 'stack-gap-lg' : 'panel stack-gap-lg';

  const balancedScore = city.strategicBalance?.weightedScore ?? city.activeWeightedScore;
  const pillars = city.strategicBalance?.pillars ?? [];
  const profileTypeByScenario = {
    oneParent: 'single_income',
    bothWorking: 'dual_income',
    twoKids: 'family_of_four',
    oneIncTwoKids: 'single_income_two_kids',
  };

  return (
    <section className={wrapperClassName}>

      {/* ── Hero ── */}
      <div className="detail-report__hero">
        <div className="detail-report__hero-top">
          <div className="detail-report__hero-left">
            <h2 className="detail-report__city-name">{city.city}</h2>
            <p className="detail-report__meta">{city.country}</p>
          </div>
          <div className="detail-report__hero-right">
            <div className="detail-report__rank-badge">
              <span className="detail-report__rank-label">Rank</span>
              <span className="detail-report__rank-num">#{rankPosition}</span>
              <span className="detail-report__rank-of">of {rankingRows.length}</span>
            </div>
            <div className="detail-report__score-badge">{formatScore(balancedScore)}<span>/10</span></div>
          </div>
        </div>
        <div className="detail-report__hero-meta">
          <span className={`detail-report__audit-badge detail-report__audit-badge--${city.audit.overall}`}>
            {auditStatusMeta[city.audit.overall].label} evidence
          </span>
        </div>
        {city.tagline && <p className="detail-report__tagline">{city.tagline}</p>}
      </div>

      {/* ── 📊 Quick Summary & Scores ── */}
      <section className="report-section">
        <h3 className="report-section__title">📊 Quick Summary &amp; Scores</h3>
        <ul className="report-list">
          <li>
            <strong>Overall Family Value Score:</strong> {formatScore(balancedScore)}/10 —{' '}
            <em>Rank #{rankPosition} of {rankingRows.length}. Weighted index: Purchasing Power Parity (35%), Childcare Financial Parity (25%), PM2.5 baseline (20%), Public Safety (20%).</em>
          </li>
          <li>
            <strong>Monthly Budget — Option A (One Income, 1 Child):</strong> {formatEuro(city.budgets.oneParent.midpoint)}/mo —{' '}
            <em>Covers a 3-room suburban apartment, utilities, conventional groceries, basic health cover, and public childcare after single-income discounts.</em>
          </li>
          <li>
            <strong>Monthly Budget — Option B (Both Working, 1 Child):</strong> {formatEuro(city.budgets.bothWorking.midpoint)}/mo —{' '}
            <em>Adds a nicer apartment, organic food, transit passes for both parents, full-day childcare at dual-income tariffs, and convenience services. No stay-at-home tax credits applied.</em>
          </li>
          <li>
            <strong>Monthly Budget — Option C (Both Working, 2 Children):</strong> {formatEuro(city.budgets.twoKids.midpoint)}/mo —{' '}
            <em>Scales to a 3-bedroom apartment, two children in full-time childcare (second child at sibling-discount rates), and household groceries for four. Transport unchanged from Option B.</em>
          </li>
          <li>
            <strong>Monthly Budget — Option D (One Income, 2 Children):</strong> {formatEuro(city.budgets.oneIncTwoKids.midpoint)}/mo —{' '}
            <em>One parent working; the other at home with two children. Childcare costs are significantly lower than Option C — part-time activities and kindergarten only. Single-commuter transport and a 3-bedroom apartment.</em>
          </li>
          <li>
            <strong>Suburban Air Quality (PM2.5):</strong> {formatPm(city.mobility.pm25)} —{' '}
            <em>3-year rolling average in the recommended family suburban ring. WHO annual limit: 5 µg/m³ | EU limit: 25 µg/m³.</em>
          </li>
          <li>
            <strong>Neighborhood Safety Rating:</strong> {city.support.safety} —{' '}
            <em>Localised safety perception score (0–100) for recommended family residential zones.</em>
          </li>
        </ul>
        {pillars.length > 0 && (
          <div className="balanced-evidence-grid report-pillars">
            {pillars.map((pillar) => {
              const pct = Math.min(100, Math.round((pillar.score / 10) * 100));
              const tier = pillar.score >= 8 ? 'strong' : pillar.score >= 6.5 ? 'good' : pillar.score >= 5 ? 'mixed' : 'drag';
              const minRequired = thresholds?.[pillar.key] ?? 0;
              const belowThreshold = minRequired > 0 && pillar.score < minRequired;
              return (
                <div key={pillar.key} className={`balanced-evidence-row balanced-evidence-row--${tier}${belowThreshold ? ' balanced-evidence-row--below-threshold' : ''}`}>
                  <div className="balanced-evidence-row__label">
                    <span className="balanced-evidence-row__name">
                      {belowThreshold && <span className="balanced-evidence-row__flag" aria-label="below minimum threshold">⚠️</span>}
                      {pillar.label}
                    </span>
                    <span className="balanced-evidence-row__score">
                      {formatScore(pillar.score)}
                      {belowThreshold && <span className="balanced-evidence-row__min"> (min {formatScore(minRequired)})</span>}
                    </span>
                  </div>
                  <div className="balanced-evidence-row__bar" role="meter" aria-valuenow={pillar.score} aria-valuemin={0} aria-valuemax={10} aria-label={`${pillar.label}: ${formatScore(pillar.score)}/10`}>
                    <div className="balanced-evidence-row__fill" style={{ width: `${pct}%` }} />
                    {belowThreshold && (
                      <div className="balanced-evidence-row__threshold-mark" style={{ left: `${Math.round((minRequired / 10) * 100)}%` }} title={`Minimum: ${formatScore(minRequired)}`} />
                    )}
                  </div>
                  {pillar.reasoning && <p className="balanced-evidence-row__note">{pillar.reasoning}</p>}
                </div>
              );
            })}
          </div>
        )}

        {pillars.length > 0 && city.activePillarWeights && (
          <>
            <LensAwareScoreBreakdown
              city={city}
              strategicBalance={city.strategicBalance}
              currentLensKey={city.activeLensKey ?? 'balanced'}
              currentWeights={city.activePillarWeights}
              scenarioKey={scenarioKey}
              profileType={profileTypeByScenario[scenarioKey] ?? 'single_income'}
            />
            <PillarScoreGrid
              pillars={pillars}
              weights={city.activePillarWeights}
              finalScore={city.activeWeightedScore ?? balancedScore}
              title="15-Pillar Contributions"
            />
          </>
        )}
      </section>

      <hr className="report-divider" />

      {/* ── 🧮 Budget & Housing sections ── */}
      <section className="report-section">

        <h4 className="report-subsection__title">💵 Budget Scenarios &amp; What Money Buys You</h4>
        <ul className="report-list">
          <li><strong>One Income, 1 Child (Option A):</strong> {formatEuro(city.budgets.oneParent.min)}–{formatEuro(city.budgets.oneParent.comfortable)}/mo (midpoint {formatEuro(city.budgets.oneParent.midpoint)}). Covers rent, utilities, standard groceries, and daycare after single-income subsidies.</li>
          <li><strong>Both Working, 1 Child (Option B):</strong> {formatEuro(city.budgets.bothWorking.min)}–{formatEuro(city.budgets.bothWorking.comfortable)}/mo (midpoint {formatEuro(city.budgets.bothWorking.midpoint)}). Adds dual-commuter transit, maximised childcare tariffs, convenience outsourcing, and removes stay-at-home deductions.</li>
          <li><strong>Both Working, 2 Children (Option C):</strong> {formatEuro(city.budgets.twoKids.min)}–{formatEuro(city.budgets.twoKids.comfortable)}/mo (midpoint {formatEuro(city.budgets.twoKids.midpoint)}). Scales to a 3-bedroom apartment and two children in full-time childcare at sibling-discount rates.</li>
          <li><strong>One Income, 2 Children (Option D):</strong> {formatEuro(city.budgets.oneIncTwoKids.min)}–{formatEuro(city.budgets.oneIncTwoKids.comfortable)}/mo (midpoint {formatEuro(city.budgets.oneIncTwoKids.midpoint)}). One parent working; stay-at-home parent reduces full-time childcare to part-time activities. Single-commuter transport and a 3-bedroom apartment.</li>
          <li><strong>The Suburban Savings Dividend:</strong> {orPending(overview.suburbanCostDifferential)}</li>
          <li><strong>Local Purchasing Power (PPP Index):</strong> {orPending(overview.purchasingPowerIndex)}</li>
        </ul>

        <h4 className="report-subsection__title">🏡 Rental &amp; Buying Realities</h4>
        <ul className="report-list">
          <li><strong>Recommended Suburbs for Families:</strong> {city.housing.areas.join(', ')}</li>
          <li><strong>Recommended Semi-Central Neighborhoods:</strong> {orPending(overview.semiCentralAreas)}</li>
          <li><strong>What Renting Costs:</strong> {city.housing.rentSafe2Bed}</li>
          <li><strong>The Condition of Houses Indoors:</strong> {overview.indoorQuality}</li>
          <li><strong>What Buying Costs:</strong> {overview.purchaseRange} | <strong>Price per SQM:</strong> {city.housing.buyOutside} (suburbs) / {city.housing.buyCentre} (centre)</li>
          <li><strong>Taxes and Fees on Property Purchases:</strong> {city.housing.buyerTaxes ?? overview.transactionCosts} | <strong>Ongoing Holding Costs:</strong> {city.housing.annualTax ?? overview.holdingCosts}</li>
          <li><strong>Getting a Local Mortgage:</strong> {overview.mortgageRate}</li>
          <li><strong>The True Cost of Monthly Utilities:</strong> {overview.utilities}</li>
        </ul>

        <h4 className="report-subsection__title">🛒 Groceries, Water Quality &amp; Eating Out</h4>
        <ul className="report-list">
          <li><strong>The Standard Grocery Bill:</strong> {overview.standardBasket}</li>
          <li><strong>The Premium for Eating 100% Organic:</strong> {overview.cleanBasket}</li>
          <li><strong>Tap Water Quality and Filters:</strong> {overview.waterQuality}</li>
          <li><strong>Cost of an Ordinary Meal Out:</strong> {overview.dining}</li>
        </ul>
        {city.basket && (
          <>
            <h4 className="report-subsection__title">Price Reference Points</h4>
            <ul className="report-list">
              {city.basket.formula && <li><strong>Baby Formula (per pack):</strong> {city.basket.formula}</li>}
              {city.basket.diapers && <li><strong>Diapers (pack):</strong> {city.basket.diapers}</li>}
              {city.basket.organicFruit && <li><strong>Organic Fruit:</strong> {city.basket.organicFruit}/kg</li>}
              {city.basket.organicVeg && <li><strong>Organic Vegetables:</strong> {city.basket.organicVeg}/kg</li>}
              {city.basket.meat && <li><strong>Meat (quality range):</strong> {city.basket.meat}/kg</li>}
              {city.basket.ecoCleaner && <li><strong>Eco Cleaning Products:</strong> {city.basket.ecoCleaner}</li>}
              {city.basket.availability && <li><strong>Organic / Clean Food Availability:</strong> {city.basket.availability}</li>}
            </ul>
          </>
        )}
      </section>

      <hr className="report-divider" />

      {/* ── 🛂 Registration & Recognition sections ── */}
      <section className="report-section">

        <h4 className="report-subsection__title">📜 Getting Registered &amp; Settled</h4>
        <ul className="report-list">
          <li><strong>Registering as an EU Citizen:</strong> {orPending(overview.euRegistration)}</li>
          <li><strong>Getting Your Tax and ID Numbers:</strong> {orPending(overview.localIdTaxNumber)}</li>
          <li><strong>How Frustrating is the Bureaucracy?</strong> {orPending(overview.adminBureaucracy)}</li>
        </ul>

        <h4 className="report-subsection__title">🎓 Getting Your Professional Degrees Recognized</h4>
        <ul className="report-list">
          <li><strong>Degrees in IT and Engineering:</strong> {orPending(overview.itDiplomaRecognition)}</li>
          <li><strong>Regulations for Psychologists and Psychotherapists:</strong> {orPending(overview.psychologistRegulation)}</li>
        </ul>
      </section>

      <hr className="report-divider" />

      {/* ── 🦺 Safety & Transit sections ── */}
      <section className="report-section">

        <h4 className="report-subsection__title">🔒 Public Safety &amp; Crime Gaps</h4>
        <ul className="report-list">
          <li><strong>Physical Safety on the Streets:</strong> {orPending(overview.violentCrime)}</li>
          <li><strong>Break-ins and Property Crime:</strong> {orPending(overview.propertyCrime)}</li>
          <li><strong>How Clean and Safe are Public Spaces?</strong> {orPending(overview.publicSpaceSafety)}</li>
          <li><strong>Traffic Hazards and Pedestrian Safety:</strong> {orPending(overview.trafficSafety)}</li>
        </ul>

        <h4 className="report-subsection__title">🐾 Moving with Pets &amp; Animal Friendliness</h4>
        <ul className="report-list">
          <li><strong>Pet Entry and Registration Rules:</strong> {orPending(overview.euPetPassport)}</li>
          <li><strong>Finding a Rental Lease with Pets:</strong> {orPending(overview.petRentalAcceptance)}</li>
          <li><strong>Taking Pets on Public Transit:</strong> {orPending(overview.petTransitCompliance)}</li>
          <li><strong>Dog Parks and Vets Nearby:</strong> {orPending([overview.urbanDogInfra, overview.vetCare].filter(Boolean).join(' · ') || null)}</li>
        </ul>

        <h4 className="report-subsection__title">🚗 Commuting &amp; Getting Around</h4>
        <ul className="report-list">
          <li><strong>The Public Transit Fare System:</strong> {city.mobility.pass}{city.mobility.oneWay ? ` · Single journey: ${city.mobility.oneWay}` : ''}{city.mobility.transitSummary ? ` · ${city.mobility.transitSummary}` : ''}</li>
          <li><strong>Hills, Sidewalks, and Strollers:</strong> {orPending(overview.topographyWalkability)}</li>
          <li><strong>Bike Paths and Walkways:</strong> {overview.bikeLanes ?? ''} {city.mobility.bikeLanes}{Number.isFinite(city.mobility.parkScore) ? ` · Park & green space score: ${city.mobility.parkScore}/100` : ''}</li>
          <li><strong>Traffic and Driving Rules:</strong> {overview.traffic} Car need: {city.mobility.carNeed}.</li>
          <li><strong>Can You Live without a Car? (The 15-Minute Rule):</strong> {overview.fifteenMinute}</li>
        </ul>
        <CarFreeMatrix city={city} />
      </section>

      <hr className="report-divider" />

      {/* ── 🌦️ Weather & Environment sections ── */}
      <section className="report-section">

        <h4 className="report-subsection__title">🌡️ Local Weather &amp; Indoor Comfort</h4>
        <ul className="report-list">
          <li><strong>Long-Term Weather Patterns:</strong> {overview.weather}</li>
          <li><strong>Indoor Humidity and Dampness:</strong> {overview.indoorHumidityInsulation ?? overview.indoorQuality}</li>
          <li><strong>Rainfall and Gray Skies:</strong> {orPending(overview.precipitationPatterns)}</li>
        </ul>
        <SunshineRainfallTimeline city={city} />

        <h4 className="report-subsection__title" style={{ marginTop: '20px' }}>� Risk of Natural Disasters</h4>
        <ul className="report-list">
          <li><strong>Air Quality &amp; Pollution Levels:</strong> PM2.5 annual reading: {formatPm(city.mobility.pm25)} — {overview.ecoFactors}</li>
          <li><strong>Vulnerability to Serious Natural Hazards:</strong> {overview.extremeWeather}</li>
        </ul>

        <h4 className="report-subsection__title">🏢 Urban Future-Proofing &amp; Infrastructure</h4>
        <ul className="report-list">
          <li><strong>Charging Stations and Public Greening:</strong> {overview.futureProofing}</li>
          <li><strong>Storm Drains and Power Grid Reliability:</strong> {orPending(overview.utilityNetworkStability)}</li>
        </ul>
      </section>

      <hr className="report-divider" />

      {/* ── 💼 Childcare, Careers & Taxes sections ── */}
      <section className="report-section">

        <h4 className="report-subsection__title">🧸 Raising Children &amp; Finding Schools</h4>
        <ul className="report-list">
          <li><strong>Creche and Kindergarten Costs:</strong> {city.childcare.nurseryNet}</li>
          <li><strong>Applying for Government Childcare Aid:</strong> {overview.stateAid}</li>
          <li><strong>Alternative Schooling Options:</strong> {overview.alternativePedagogy}</li>
          <li><strong>The Public School System:</strong> {overview.publicVsPrivate} School starts at age: {city.childcare.schoolStart}. {city.childcare.schoolQuality}</li>
          <li><strong>Private and Semi-Private Schools:</strong> {orPending(overview.privateSchoolOptions)}</li>
          <li><strong>Universities Nearby:</strong> {overview.higherEducation}</li>
        </ul>

        <h4 className="report-subsection__title">🏥 Healthcare Access</h4>
        <ul className="report-list">
          <li><strong>Pediatrics &amp; Primary Care:</strong> {city.health.registration} {city.health.waits}</li>
          <li><strong>Private Health Insurance:</strong> {city.health.privateCover}</li>
          <li><strong>Hospital Standards:</strong> {overview.hospitalQuality} Key anchors: {city.health.hospitals.join(', ')}.</li>
          {overview.mentalHealthInfrastructure && (
            <li><strong>Mental Health Infrastructure:</strong> {overview.mentalHealthInfrastructure}</li>
          )}
        </ul>

        <h4 className="report-subsection__title">👔 Jobs, Careers &amp; Workplace Culture</h4>
        <ul className="report-list">
          <li><strong>The General Employment Scene:</strong> {overview.jobMarket}</li>
          <li><strong>Opportunities in IT and Engineering:</strong> {orPending([overview.techEcosystem, overview.itPrimaryEmployers, overview.itSalaryBrackets, overview.itLanguageFlexibility].filter(Boolean).join(' · ') || null)}</li>
          <li><strong>Opportunities in Psychology and Counseling:</strong> {orPending([overview.psychologistRegulation, overview.mentalHealthMarket, overview.mentalHealthCompensation, overview.internationalClientDemand].filter(Boolean).join(' · ') || null)}</li>
          <li><strong>Work-Life Balance and Family Boundaries:</strong> {overview.culture}</li>
          <li><strong>Places for Parents and Kids to Gather:</strong> {overview.community}</li>
        </ul>

        <h4 className="report-subsection__title">⚖️ Taxes, Tax Credits &amp; Family Benefits</h4>
        <h5 className="report-h5">How Income Tax is Calculated</h5>
        <ul className="report-list">
          <li><strong>Option A (Single Income):</strong> {orPending(overview.taxSingleIncomeGross ?? overview.personalTax)}</li>
          <li><strong>Option B (Dual Income):</strong> {orPending(overview.taxDualIncomeGross)}</li>
        </ul>
        <h5 className="report-h5">Family Tax Breaks and Allowances</h5>
        <ul className="report-list">
          <li><strong>Option A (Single Income):</strong> {orPending(overview.taxAllowancesSingle)}</li>
          <li><strong>Option B (Dual Income):</strong> {orPending(overview.taxAllowancesDual)}</li>
        </ul>
        <h5 className="report-h5">The True Effective Tax Burden</h5>
        <ul className="report-list">
          <li><strong>Option A (Single-Income Effective Tax Rate):</strong> {orPending(overview.effectiveTaxRateSingle)}</li>
          <li><strong>Option B (Dual-Income Effective Tax Rate):</strong> {orPending(overview.effectiveTaxRateDual)}</li>
        </ul>
        <h5 className="report-h5">Parental Leave &amp; State Benefits</h5>
        <ul className="report-list">
          <li><strong>Parental Leave Dynamics &amp; Paid Days:</strong> {overview.parentalLeave}</li>
          <li><strong>State Child Benefits:</strong> {city.support.childBenefit}</li>
          <li><strong>Doing Family Paperwork Online:</strong> {overview.digitalization}</li>
        </ul>
      </section>

      <hr className="report-divider" />

      {/* ── 🔍 6. Behind the Numbers & Data Sources ── */}
      <section className="report-section">
        <h3 className="report-section__title">🔍 6. Behind the Numbers &amp; Data Sources</h3>
        <ul className="report-list">
          <li><strong>Official Data Sources Used:</strong> {orPending(overview.officialStatisticalSources)}</li>
          <li><strong>How Fresh is This Data?</strong> Last reviewed {city.audit.lastReviewed} — {auditStatusMeta[city.audit.overall].label} evidence base. {city.audit.notes}</li>
          {city.audit.sections && (
            <li>
              <strong>Section Verification Status:</strong>{' '}
              {Object.entries(city.audit.sections).map(([k, v]) => `${k}: ${v}`).join(' · ')}
            </li>
          )}
          <li><strong>Estimates and Word-of-Mouth Flags:</strong> {orPending(overview.crowdsourcedEstimatesDisclaimer)}</li>
        </ul>
        {buildTrendNarrative(city.trends).length > 0 && (
          <>
            <h4 className="report-subsection__title" style={{ marginTop: '16px' }}>📈 Recent Trend Signals (Post-2023)</h4>
            <ul className="report-list">
              {buildTrendNarrative(city.trends).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </>
        )}
        <div className="table-scroll" style={{ marginTop: '16px' }}>
          <table className="trend-table">
            <thead>
              <tr>
                <th className="trend-table__metric-head">Metric</th>
                {city.trends.map((entry) => (
                  <th key={entry.year} className={entry.year === 2026 ? 'trend-table__year trend-table__year--current' : 'trend-table__year'}>{entry.year}</th>
                ))}
                <th className="trend-table__delta-head">2023 → 2026</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="trend-table__metric">Overall score / 10</td>
                {city.trends.map((entry) => (
                  <td key={entry.year} className={entry.year === 2026 ? 'trend-table__cell trend-table__cell--current' : 'trend-table__cell'}>{formatScore(entry.overallScore)}</td>
                ))}
                <td className="trend-table__delta-cell">{renderScoreDelta(buildTrendDelta(city.trends, 'overallScore', false))}</td>
              </tr>
              <tr>
                <td className="trend-table__metric">One-parent budget</td>
                {city.trends.map((entry) => (
                  <td key={entry.year} className={entry.year === 2026 ? 'trend-table__cell trend-table__cell--current' : 'trend-table__cell'}>{formatEuro(entry.oneParentBudget)}</td>
                ))}
                <td className="trend-table__delta-cell">{renderBudgetDelta(buildBudgetTrendDelta(city.trends, 'oneParentBudget'))}</td>
              </tr>
              <tr>
                <td className="trend-table__metric">Both-working budget</td>
                {city.trends.map((entry) => (
                  <td key={entry.year} className={entry.year === 2026 ? 'trend-table__cell trend-table__cell--current' : 'trend-table__cell'}>{formatEuro(entry.bothWorkingBudget)}</td>
                ))}
                <td className="trend-table__delta-cell">{renderBudgetDelta(buildBudgetTrendDelta(city.trends, 'bothWorkingBudget'))}</td>
              </tr>
              <tr>
                <td className="trend-table__metric">PM2.5 (µg/m³)</td>
                {city.trends.map((entry) => (
                  <td key={entry.year} className={entry.year === 2026 ? 'trend-table__cell trend-table__cell--current' : 'trend-table__cell'}>{Number.isFinite(entry.pm25) ? entry.pm25 : '—'}</td>
                ))}
                <td className="trend-table__delta-cell">{renderScoreDelta(buildTrendDelta(city.trends, 'pm25', true))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <hr className="report-divider" />

      {/* ── 🏁 The Final Verdict ── */}
      <section className="report-section report-section--summary">
        <h3 className="report-section__title">🏁 The Final Verdict</h3>
        {(overview.honestTruth?.good?.length > 0 || overview.honestTruth?.bad?.length > 0) && (
          <>
            <h4 className="report-subsection__title">⚖️ Balanced Evaluation</h4>
            {overview.honestTruth?.good?.length > 0 && (
              <>
                <h5 className="report-h5">Key Advantages</h5>
                <ul className="report-list report-list--pros">
                  {overview.honestTruth.good.map((item, i) => (
                    <li key={`${city.key}-pro-${i}`}>{item}</li>
                  ))}
                </ul>
              </>
            )}
            {overview.honestTruth?.bad?.length > 0 && (
              <>
                <h5 className="report-h5">Key Disadvantages</h5>
                <ul className="report-list report-list--cons">
                  {overview.honestTruth.bad.map((item, i) => (
                    <li key={`${city.key}-con-${i}`}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        <ul className="report-list" style={{ marginTop: '16px' }}>
          <li>👍 <strong>You will love it here if:</strong> {overview.moveHereIf}</li>
          <li>👎 <strong>You should stay away if:</strong> {overview.stayAwayIf}</li>
        </ul>
        <p style={{ marginTop: '12px' }}><strong>Final Comparative Ranking:</strong> {formatScore(balancedScore)}/10 — Rank #{rankPosition} of {rankingRows.length} across the 24-city relocation dashboard index.</p>
      </section>

    </section>
  );
};
