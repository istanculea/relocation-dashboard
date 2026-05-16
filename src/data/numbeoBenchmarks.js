const createHousingNote = ({ rent3BedroomOutside, buyCentre, buyOutside }) => {
  const parts = [`Secondary crowd-sourced benchmark: 3-bedroom outside centre ${rent3BedroomOutside}.`];

  if (buyCentre && buyOutside) {
    parts.push(`Buy-price benchmark: ${buyCentre}/sqm in the centre and ${buyOutside}/sqm outside centre.`);
  } else if (buyCentre) {
    parts.push(`Buy-price benchmark: ${buyCentre}/sqm in the centre.`);
  }

  return parts.join(' ');
};

const createNumbeoBenchmarkSet = ({
  city,
  url,
  observedAt,
  familyOfFour,
  rent3BedroomOutside,
  buyCentre,
  buyOutside,
  preschool,
  monthlyPass,
  childcareNote,
  mobilityNote,
}) => ({
  housingCosts: [
    {
      label: `Numbeo ${city} housing benchmark`,
      url,
      observedAt,
      note: createHousingNote({ rent3BedroomOutside, buyCentre, buyOutside }),
    },
  ],
  basketCosts: [
    {
      label: `Numbeo ${city} family basket benchmark`,
      url,
      observedAt,
      note: `Secondary crowd-sourced benchmark: family of four ${familyOfFour} excluding rent.`,
    },
  ],
  childcareCosts: preschool
    ? [
        {
          label: `Numbeo ${city} childcare benchmark`,
          url,
          observedAt,
          note:
            childcareNote
            ?? `Secondary crowd-sourced benchmark: private full-day preschool ${preschool}. Use only as a market cross-check, not a strict official anchor.`,
        },
      ]
    : [],
  mobilityCosts: monthlyPass
    ? [
        {
          label: `Numbeo ${city} mobility benchmark`,
          url,
          observedAt,
          note:
            mobilityNote
            ?? `Secondary crowd-sourced benchmark: regular monthly public transport pass ${monthlyPass}. Use only as a cross-check until an official operator tariff page is captured.`,
        },
      ]
    : [],
});

export const numbeoBenchmarks = {
  bilbao: createNumbeoBenchmarkSet({
    city: 'Bilbao',
    url: 'https://www.numbeo.com/cost-of-living/in/Bilbao',
    observedAt: 'Last update 4 May 2026',
    familyOfFour: 'EUR2,754.9/month',
    rent3BedroomOutside: 'EUR1,532/month',
    buyCentre: 'EUR5,019.85',
    buyOutside: 'EUR3,222.35',
    preschool: 'EUR475/month',
    monthlyPass: 'EUR45/month',
    childcareNote:
      'Secondary crowd-sourced benchmark: private full-day preschool EUR475/month. Public Haurreskolak fees still need a direct official tariff capture.',
  }),
  bucharest: createNumbeoBenchmarkSet({
    city: 'Bucharest',
    url: 'https://www.numbeo.com/cost-of-living/in/Bucharest',
    observedAt: 'Last update 5 May 2026',
    familyOfFour: 'RON12,320.7/month',
    rent3BedroomOutside: 'RON3,512.33/month',
    buyCentre: 'RON18,047.11',
    buyOutside: 'RON10,207.78',
    preschool: 'RON3,055.10/month',
    monthlyPass: 'RON90/month',
  }),
  berlin: createNumbeoBenchmarkSet({
    city: 'Berlin',
    url: 'https://www.numbeo.com/cost-of-living/in/Berlin',
    observedAt: 'Last update 12 May 2026',
    familyOfFour: 'EUR3,523.2/month',
    rent3BedroomOutside: 'EUR1,764.58/month',
    buyCentre: 'EUR7,013.26',
    buyOutside: 'EUR4,754.55',
    preschool: 'EUR113.88/month',
    monthlyPass: 'EUR63/month',
    childcareNote:
      'Secondary crowd-sourced benchmark: private full-day preschool EUR113.88/month. Public Kita remains policy-led rather than tariff-led.',
  }),
  dublin: createNumbeoBenchmarkSet({
    city: 'Dublin',
    url: 'https://www.numbeo.com/cost-of-living/in/Dublin',
    observedAt: 'Last update 10 May 2026',
    familyOfFour: 'EUR3,732.7/month',
    rent3BedroomOutside: 'EUR2,973.91/month',
    buyCentre: 'EUR7,105.00',
    buyOutside: 'EUR4,898.06',
    preschool: 'EUR1,154.51/month',
    monthlyPass: 'EUR96/month',
    childcareNote:
      'Secondary crowd-sourced benchmark: private full-day preschool EUR1,154.51/month. The strict dashboard still treats Dublin nursery net cost as a subsidy-modeled comparison value.',
  }),
  milan: createNumbeoBenchmarkSet({
    city: 'Milan',
    url: 'https://www.numbeo.com/cost-of-living/in/Milan',
    observedAt: 'Last update 13 May 2026',
    familyOfFour: 'EUR3,739.4/month',
    rent3BedroomOutside: 'EUR1,785.71/month',
    buyCentre: 'EUR9,417.15',
    buyOutside: 'EUR4,668.48',
    preschool: 'EUR777.78/month',
    monthlyPass: 'EUR39/month',
  }),
  bologna: createNumbeoBenchmarkSet({
    city: 'Bologna',
    url: 'https://www.numbeo.com/cost-of-living/in/Bologna',
    observedAt: 'Last update 11 May 2026',
    familyOfFour: 'EUR3,490.9/month',
    rent3BedroomOutside: 'EUR1,329.17/month',
    buyCentre: 'EUR4,804.90',
    buyOutside: 'EUR3,493.72',
    preschool: 'EUR689.25/month',
    monthlyPass: 'EUR39/month',
  }),
  cologne: createNumbeoBenchmarkSet({
    city: 'Cologne',
    url: 'https://www.numbeo.com/cost-of-living/in/Cologne',
    observedAt: 'Last update 12 May 2026',
    familyOfFour: 'EUR3,630.3/month',
    rent3BedroomOutside: 'EUR1,345/month',
    buyCentre: 'EUR6,578.10',
    buyOutside: 'EUR4,183.33',
    preschool: 'EUR930.89/month',
    monthlyPass: 'EUR58/month',
    childcareNote:
      'Secondary crowd-sourced benchmark: private full-day preschool EUR930.89/month. Official Cologne nursery contributions still follow the city income-and-hours table.',
  }),
  valencia: createNumbeoBenchmarkSet({
    city: 'Valencia',
    url: 'https://www.numbeo.com/cost-of-living/in/Valencia',
    observedAt: 'Last update May 2026',
    familyOfFour: 'EUR2,456.9/month',
    rent3BedroomOutside: 'EUR1,274.68/month',
    buyCentre: 'EUR3,158.33',
    buyOutside: 'EUR2,099.28',
    preschool: 'EUR388.10/month',
    monthlyPass: 'EUR40.00/month',
    childcareNote:
      'Secondary benchmark: private full-day nursery EUR388/month Numbeo estimate. Official municipal escuela infantil tariffs are income-scaled (EUR180-350/month); Ajuntament de Valencia fee schedule is the verified anchor.',
  }),
  manchester: createNumbeoBenchmarkSet({
    city: 'Manchester',
    url: 'https://www.numbeo.com/cost-of-living/in/Manchester',
    observedAt: 'Last update 11 May 2026',
    familyOfFour: 'GBP2,910.2/month',
    rent3BedroomOutside: 'GBP1,549.09/month',
    buyCentre: 'GBP3,722.86',
    buyOutside: 'GBP3,457.14',
    preschool: 'GBP1,096/month',
    monthlyPass: 'GBP80/month',
    childcareNote:
      'Secondary crowd-sourced benchmark: private full-day preschool GBP1,096/month. For a 6-month-old, this remains a market-price proxy rather than a subsidy-backed infant tariff.',
  }),
  vienna: createNumbeoBenchmarkSet({
    city: 'Vienna',
    url: 'https://www.numbeo.com/cost-of-living/in/Vienna',
    observedAt: 'Last update 11 May 2026',
    familyOfFour: 'EUR3,729.9/month',
    rent3BedroomOutside: 'EUR1,393.75/month',
    buyCentre: 'EUR12,850.00',
    buyOutside: 'EUR5,621.43',
    preschool: 'EUR317.50/month',
    monthlyPass: 'EUR51/month',
    childcareNote:
      'Secondary crowd-sourced benchmark: private full-day preschool EUR317.50/month. It supplements, but does not replace, Vienna\'s official free-kindergarten anchor.',
  }),
  reggioEmilia: createNumbeoBenchmarkSet({
    city: 'Reggio Emilia',
    url: 'https://www.numbeo.com/cost-of-living/in/Reggio-Nell%27emilia',
    observedAt: 'Last update 12 May 2026',
    familyOfFour: 'EUR2,996.9/month',
    rent3BedroomOutside: 'EUR834.20/month',
    buyCentre: 'EUR2,238.17',
    buyOutside: 'EUR1,821.68',
    preschool: 'EUR446.67/month',
    monthlyPass: 'EUR32.50/month',
    childcareNote:
      'Secondary crowd-sourced benchmark: private full-day preschool EUR446.67/month. Municipal Reggio nido fees remain anchored to the official ISEE-based tariff table.',
  }),
};