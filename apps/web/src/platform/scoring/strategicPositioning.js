const humanize = (value) => value
  .replace(/([A-Z])/g, ' $1')
  .replace(/[_-]+/g, ' ')
  .trim()
  .toLowerCase();

const bestForByPillar = {
  childcareEducation: 'families prioritizing educational continuity',
  healthMedical: 'households prioritizing healthcare reliability',
  mobilityLogistics: 'cross-border commuters and mobile professionals',
  economyJobsTaxes: 'dual-income professionals optimizing stability',
  socialCapital: 'families seeking social integration and balance',
  climateResilience: 'long-horizon planners focused on climate resilience',
};

const lessIdealByPillar = {
  rentalMarket: 'aggressive short-term savings goals',
  envPollution: 'pollution-sensitive households',
  mobilityLogistics: 'car-free routines requiring minimal transfer friction',
  economyJobsTaxes: 'high-volatility career transitions without buffers',
  socialCapital: 'fast social landing expectations',
};

const take = (array, count) => array.slice(0, count);

export const buildStrategicPositioning = (cityRow, { topStrengths = 3, topTradeoffs = 2 } = {}) => {
  const pillars = cityRow?.strategicBalance?.pillars ?? [];
  if (pillars.length === 0) {
    return {
      cityId: cityRow?.key ?? cityRow?.city ?? 'unknown',
      strengths: [],
      tradeoffs: [],
      bestFor: [],
      lessIdealFor: [],
    };
  }

  const sorted = [...pillars].sort((left, right) => (right.score ?? 0) - (left.score ?? 0));
  const strongest = take(sorted, topStrengths);
  const weakest = take([...sorted].reverse(), topTradeoffs);

  const strengths = strongest.map((pillar) =>
    `${pillar.label ?? humanize(pillar.key)} (${(pillar.score ?? 0).toFixed(1)}/10)`);
  const tradeoffs = weakest.map((pillar) =>
    `${pillar.label ?? humanize(pillar.key)} (${(pillar.score ?? 0).toFixed(1)}/10)`);

  const bestFor = [...new Set(strongest
    .map((pillar) => bestForByPillar[pillar.key])
    .filter(Boolean))];

  const lessIdealFor = [...new Set(weakest
    .map((pillar) => lessIdealByPillar[pillar.key])
    .filter(Boolean))];

  return {
    cityId: cityRow.key,
    strengths,
    tradeoffs,
    bestFor,
    lessIdealFor,
  };
};
