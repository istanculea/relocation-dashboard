const eurFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const ecbUsdRate = 1.1738;
const ecbObservedAt = 'ECB EUR/USD reference rate 12 May 2026';

const formatUsdAsEuro = (value) => eurFormatter.format(value / ecbUsdRate);

const createSecondaryBenchmarkSet = ({ city, expatistan, livingcost }) => ({
  housingCosts: [
    {
      label: `Expatistan ${city} housing cross-check`,
      url: expatistan.url,
      observedAt: expatistan.observedAt,
      note:
        `Secondary cross-check: Expatistan ${city} lists furnished 85 sqm rent at ${expatistan.normalRent} in a normal area and ${expatistan.expensiveRent} in an expensive area, with utilities at ${expatistan.utilities}. ${expatistan.reliability}`,
    },
    {
      label: `Livingcost ${city} housing cross-check`,
      url: livingcost.url,
      observedAt: livingcost.observedAt,
      note:
        `Secondary cross-check: Livingcost ${city} converts to about ${formatUsdAsEuro(livingcost.cheapThreeBedUsd)} for a cheaper 3-bedroom, ${formatUsdAsEuro(livingcost.cityCenterThreeBedUsd)} for a central 3-bedroom, ${formatUsdAsEuro(livingcost.familyUtilitiesUsd)} for family utilities, and ${formatUsdAsEuro(livingcost.buyCentreSqmUsd)}/sqm for central purchase pricing using the ${ecbObservedAt}.`,
    },
  ],
  basketCosts: [
    {
      label: `Expatistan ${city} family basket cross-check`,
      url: expatistan.url,
      observedAt: expatistan.observedAt,
      note:
        `Secondary cross-check: Expatistan estimates family-of-four monthly costs at ${expatistan.familyOfFour}. ${expatistan.reliability}`,
    },
    {
      label: `Livingcost ${city} family basket cross-check`,
      url: livingcost.url,
      observedAt: livingcost.observedAt,
      note:
        `Secondary cross-check: Livingcost ${city} converts its family total with rent to about ${formatUsdAsEuro(livingcost.familyTotalWithRentUsd)}, with food near ${formatUsdAsEuro(livingcost.familyFoodUsd)} and transport near ${formatUsdAsEuro(livingcost.familyTransportUsd)} using the ${ecbObservedAt}.`,
    },
  ],
  childcareCosts: [
    {
      label: `Livingcost ${city} daycare cross-check`,
      url: livingcost.url,
      observedAt: livingcost.observedAt,
      note:
        `Secondary cross-check: Livingcost converts daycare or preschool to about ${formatUsdAsEuro(livingcost.daycareUsd)} per month using the ${ecbObservedAt}.`,
    },
  ],
  mobilityCosts: [
    {
      label: `Expatistan ${city} mobility cross-check`,
      url: expatistan.url,
      observedAt: expatistan.observedAt,
      note:
        `Secondary cross-check: Expatistan lists the monthly public-transport ticket at ${expatistan.monthlyPass}. ${expatistan.reliability}`,
    },
    {
      label: `Livingcost ${city} mobility cross-check`,
      url: livingcost.url,
      observedAt: livingcost.observedAt,
      note:
        `Secondary cross-check: Livingcost converts the monthly ticket to about ${formatUsdAsEuro(livingcost.monthlyPassUsd)} and the local single ticket to about ${formatUsdAsEuro(livingcost.localTicketUsd)} using the ${ecbObservedAt}.`,
    },
  ],
});

export const secondaryBenchmarks = {
  bilbao: createSecondaryBenchmarkSet({
    city: 'Bilbao',
    expatistan: {
      url: 'https://www.expatistan.com/cost-of-living/bilbao',
      observedAt: 'Current as of May 2026; latest price update 12 May 2026',
      familyOfFour: 'EUR3,743/month',
      normalRent: 'EUR1,102/month',
      expensiveRent: 'EUR1,518/month',
      utilities: 'EUR220/month',
      monthlyPass: 'EUR26/month',
      reliability: 'The page marks Bilbao prices very reliable.',
    },
    livingcost: {
      url: 'https://livingcost.org/cost/spain/bilbao',
      observedAt: 'Updated 11 Mar 2026',
      familyTotalWithRentUsd: 3970,
      familyFoodUsd: 1329,
      familyTransportUsd: 243,
      cheapThreeBedUsd: 1398,
      cityCenterThreeBedUsd: 1821,
      familyUtilitiesUsd: 169,
      buyCentreSqmUsd: 5519,
      daycareUsd: 567,
      monthlyPassUsd: 44.6,
      localTicketUsd: 2.03,
    },
  }),
  bologna: createSecondaryBenchmarkSet({
    city: 'Bologna',
    expatistan: {
      url: 'https://www.expatistan.com/cost-of-living/bologna',
      observedAt: 'Current as of May 2026; latest price update 12 May 2026',
      familyOfFour: 'EUR3,423/month',
      normalRent: 'EUR911/month',
      expensiveRent: 'EUR1,344/month',
      utilities: 'EUR153/month',
      monthlyPass: 'EUR37/month',
      reliability: 'The page marks Bologna prices very reliable.',
    },
    livingcost: {
      url: 'https://livingcost.org/cost/italy/er/bologna',
      observedAt: 'Updated 11 Mar 2026',
      familyTotalWithRentUsd: 4402,
      familyFoodUsd: 1520,
      familyTransportUsd: 295,
      cheapThreeBedUsd: 1308,
      cityCenterThreeBedUsd: 1568,
      familyUtilitiesUsd: 210,
      buyCentreSqmUsd: 5398,
      daycareUsd: 807,
      monthlyPassUsd: 43.2,
      localTicketUsd: 2.73,
    },
  }),
  milan: createSecondaryBenchmarkSet({
    city: 'Milan',
    expatistan: {
      url: 'https://www.expatistan.com/cost-of-living/milan',
      observedAt: 'Current as of May 2026; latest price update 12 May 2026',
      familyOfFour: 'EUR4,705/month',
      normalRent: 'EUR1,537/month',
      expensiveRent: 'EUR2,271/month',
      utilities: 'EUR168/month',
      monthlyPass: 'EUR34/month',
      reliability: 'The page marks Milan prices very reliable.',
    },
    livingcost: {
      url: 'https://livingcost.org/cost/italy/lo/milan',
      observedAt: 'Updated 11 Mar 2026',
      familyTotalWithRentUsd: 5666,
      familyFoodUsd: 1732,
      familyTransportUsd: 544,
      cheapThreeBedUsd: 1958,
      cityCenterThreeBedUsd: 2800,
      familyUtilitiesUsd: 228,
      buyCentreSqmUsd: 10810,
      daycareUsd: 867,
      monthlyPassUsd: 44.7,
      localTicketUsd: 2.59,
    },
  }),
};