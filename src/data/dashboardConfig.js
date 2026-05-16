export const scoreWeights = {
  housing: 0.30,
  environment: 0.10,
  childcare: 0.25,
  safety: 0.13,
  healthcare: 0.22,
};

// MCDA pillar weights — 15-pillar system (sum = 1.00)
export const strategicBalanceWeights = {
  euRegistration:       0.05,
  diplomaRecognition:   0.05,
  realEstateHousing:    0.04,
  rentalMarket:         0.10,
  homeOwnership:        0.04,
  locationInfra:        0.05,
  cleanBasket:          0.05,
  childcareEducation:   0.12,
  healthMedical:        0.08,
  envPollution:         0.07,
  criminalityStreetSafe: 0.08,
  mobilityLogistics:    0.07,
  economyJobsTaxes:     0.10,
  climateResilience:    0.05,
  socialCapital:        0.05,
};

export const strategicBalancePillars = [
  ['euRegistration',        'EU Registration & Residency Pathway'],
  ['diplomaRecognition',    'Diploma Recognition & Professional Accreditation'],
  ['realEstateHousing',     'Real Estate & Healthy Housing'],
  ['rentalMarket',          'Rental Market'],
  ['homeOwnership',         'Home Ownership'],
  ['locationInfra',         'Location & Infrastructure'],
  ['cleanBasket',           "The 'Clean' Shopping Basket"],
  ['childcareEducation',    'Childcare & Educational Path'],
  ['healthMedical',         'Health, Medical Access'],
  ['envPollution',          'Environment & Pollution'],
  ['criminalityStreetSafe', 'Criminality and Street Safeness'],
  ['mobilityLogistics',     'Infrastructure, Mobility & Logistics'],
  ['economyJobsTaxes',      'Economy, Jobs, Taxes & Parity'],
  ['climateResilience',     'Climate & Resilience'],
  ['socialCapital',         'Social Capital & Work-Life Balance'],
];

export const priorityPresets = {
  balanced: {
    label: 'Balanced Decision',
    detail:
      'Family-first 15-pillar MCDA mix. Childcare & educational path carries the highest weight, followed by rental market and economy/jobs/taxes. All pillars contribute to the final score.',
    weights: scoreWeights,
    scoreType: 'strategicBalance',
  },
  budgetFirst: {
    label: 'Housing & Budget First',
    detail: 'Prioritize rental affordability, housing market quality, and purchasing-power parity. Best for households where the monthly burn rate is the first filter.',
    scoreType: 'strategicPillar',
    pillarWeights: {
      rentalMarket:       0.40,
      homeOwnership:      0.20,
      cleanBasket:        0.15,
      childcareEducation: 0.15,
      economyJobsTaxes:   0.10,
    },
  },
  airFirst: {
    label: 'Clean Air & Environment',
    detail: 'Prioritize air quality, pollution levels, green space, and climate resilience. Best for households where outdoor lifestyle and low-pollution living is non-negotiable.',
    scoreType: 'strategicPillar',
    pillarWeights: {
      envPollution:         0.40,
      climateResilience:    0.25,
      criminalityStreetSafe: 0.20,
      mobilityLogistics:    0.15,
    },
  },
  healthFirst: {
    label: 'Health & Medical First',
    detail: 'Prioritize healthcare access, pediatric services, and personal safety. Best for households where medical infrastructure and low crime are the primary filter.',
    scoreType: 'strategicPillar',
    pillarWeights: {
      healthMedical:         0.35,
      criminalityStreetSafe: 0.25,
      childcareEducation:    0.20,
      envPollution:          0.20,
    },
  },
  transitMobility: {
    label: 'Public Transport & Mobility',
    detail: 'Prioritize transit quality, bike infrastructure, 15-minute walkability, and freedom from car dependency.',
    scoreType: 'strategicPillar',
    pillarWeights: {
      mobilityLogistics:  0.40,
      locationInfra:      0.25,
      rentalMarket:       0.15,
      envPollution:       0.10,
      childcareEducation: 0.10,
    },
  },
  educationFirst: {
    label: 'Education First',
    detail: 'Favor nursery access, school quality, and the full educational path from infant care through primary.',
    scoreType: 'strategicPillar',
    pillarWeights: {
      childcareEducation:    0.50,
      healthMedical:         0.20,
      criminalityStreetSafe: 0.15,
      socialCapital:         0.15,
    },
  },
  jobStabilityFirst: {
    label: 'Job Stability & Income',
    detail: 'Prioritize career opportunity for IT/Cloud Engineering and Integrative Psychotherapy, salary parity, tax efficiency, and economic resilience.',
    scoreType: 'strategicPillar',
    pillarWeights: {
      economyJobsTaxes:   0.40,
      diplomaRecognition: 0.20,
      euRegistration:     0.15,
      childcareEducation: 0.15,
      rentalMarket:       0.10,
    },
  },
};

export const verificationWindow = {
  label: '2022-2026 Official Source Window',
  detail:
    'The strict dashboard view only surfaces, compares, and comprises facts backed by official pages updated from 2022 through 2026. Modeled budgets and blended comparison layers are withheld.',
};

export const auditStatusMeta = {
  verified: {
    label: 'Verified',
    tone: 'verified',
  },
  mixed: {
    label: 'Mixed',
    tone: 'mixed',
  },
  modeled: {
    label: 'Modeled',
    tone: 'modeled',
  },
};

export const auditSectionLabels = {
  housingCosts: 'Housing',
  childcareCosts: 'Childcare',
  basketCosts: 'Clean basket',
  healthcareAccess: 'Healthcare',
  mobilityCosts: 'Mobility',
  familyBenefits: 'Family benefits',
  budgetModel: 'Budget model',
};

export const budgetComponentLabels = [
  ['housing', 'Housing'],
  ['childcare', 'Childcare'],
  ['groceries', 'Groceries'],
  ['transport', 'Transport'],
  ['healthcare', 'Healthcare'],
  ['utilitiesAndBuffer', 'Utilities + buffer'],
];

export const scorePillars = [
  ['housing', 'Housing'],
  ['environment', 'Environment'],
  ['childcare', 'Childcare'],
  ['safety', 'Safety'],
  ['healthcare', 'Healthcare'],
];

export const scenarioMeta = {
  oneParent: {
    label: 'One Income, 1 Child',
    budgetLabel: 'No full-time nursery cost. Public transport included.',
  },
  bothWorking: {
    label: 'Both Working, 1 Child',
    budgetLabel: 'Full-time childcare and two-adult public transport included.',
  },
  twoKids: {
    label: 'Both Working, 2 Children',
    budgetLabel: 'Two children in full-time childcare, 3-bedroom housing, two-adult transport included.',
  },
  oneIncTwoKids: {
    label: 'One Income, 2 Children',
    budgetLabel: 'One parent working, stay-at-home parent with two children, 3-bedroom housing.',
  },
};