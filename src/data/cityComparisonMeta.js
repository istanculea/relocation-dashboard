import cityExpansionWaveSummary from './cityExpansionWaveSummary.json';

export const cityComparisonMeta = {
  bilbao: {
    reviewNote:
      'Re-checked with the Eustat rental-reference table, the Euskadi Haurreskolak and family-aid pages, current Osakidetza access pages, and CTB\'s 2026 Barik fares.',
    pros: [
      'Best combined balance of rent pressure, stroller-friendly mobility, and everyday family ease.',
      'Strong public and concertado school options without forcing private-school spend.',
      'Compact layout and protected cycling help daily life stay simple without a second car.',
    ],
    cons: [
      'Clean-basket pricing still sits outside the strict layer because no official Bilbao item-price table was retrievable.',
      'Safety feels better than the index headline in family districts, but it is not a Vienna-style calm city.',
      'Salary upside is weaker than in the stronger German metros.',
    ],
  },
  bucharest: {
    reviewNote: 'Re-checked against the current 2026 benchmark layer and the existing official-source audit.',
    pros: [
      'Lowest housing burn in the set, which keeps disposable income and downside risk strong.',
      'Private pediatric access is usually fast once you are willing to pay for it.',
      'Strong option if family budget control matters more than air quality or public-realm polish.',
    ],
    cons: [
      'Air, pavement quality, and fragmented bike infrastructure make daily infant logistics rougher.',
      'Public-school quality is less predictable district to district.',
      'Official transport pricing remains harder to pin down cleanly than in the sourced Western-city set.',
    ],
  },
  milan: {
    reviewNote:
      'Re-checked against the Comune di Milano 2025/2026 contributive-quote PDF, the live municipal 0-3 and nursery workflow pages, current ATM urban subscriptions, and the national INPS family-support anchor.',
    pros: [
      'Very strong hospital network and specialist depth for a large Italian city.',
      'Excellent transit coverage if the household secures the right neighborhood.',
      'Urban polish, services, and job-market breadth stay better than in smaller Emilia-Romagna towns.',
    ],
    cons: [
      'Poor air quality remains one of the clearest structural negatives for a family with an infant.',
      'Rent and childcare costs are high relative to what you actually gain over Bologna or Reggio Emilia.',
      'Petty theft and transit nuisance are persistent quality-of-life drag factors.',
    ],
  },
  bologna: {
    reviewNote:
      'Re-checked with the Comune di Bologna nido tariff pages, AUSL Bologna service-guide pages, the public TPER fares page, and the same Italian official family-support frame used elsewhere in the dashboard.',
    pros: [
      'Best large-city Italy compromise if you want stronger services than Reggio Emilia without full Milan pricing.',
      'Sant\'Orsola and the broader public-health network keep healthcare confidence high.',
      'Walkability, transit, and food/education quality all land in a sensible middle ground.',
    ],
    cons: [
      'Po Valley air quality is still the main structural drawback.',
      'Rent pressure has climbed fast since 2023, especially in central family-friendly areas.',
      'Student and tourism pressure make the inner core noisier and more competitive than a smaller-town alternative.',
    ],
  },
  lugo: {
    reviewNote:
      'Re-checked against the Agenzia Entrate OMI 2H 2025 housing lookup, the Unione della Bassa Romagna nursery-fee rules, the current nido support measure, AUSL Romagna service anchors, and the recovered Start Romagna mobility evidence.',
    pros: [
      'Lowest Italian housing pressure in the final roster, with calmer day-to-day family rhythm than Bologna or Milan.',
      'Small-town scale makes errands, preschool logistics, and parking much easier.',
      'Family services sit inside the wider Bassa Romagna public-service network rather than a single-city silo.',
    ],
    cons: [
      'Job-market depth and expat-network depth are much thinner than in Bologna, Vienna, or Cologne.',
      'Regional mobility works, but Lugo is less frictionless without a car than Bilbao or Vienna.',
      'Basket and budget layers still sit in modeled territory even after the OMI housing recovery.',
    ],
  },
  reggioEmilia: {
    reviewNote: 'Re-checked against current municipal nursery, AUSL, and benchmark data.',
    pros: [
      'Strongest pedagogical identity in the set for early years, with real local public-system depth.',
      'Northern Italy quality-of-life at materially lower rent than Milan.',
      'Family pace is calmer and more predictable than in the larger metros.',
    ],
    cons: [
      'Air quality remains a recurring Po Valley penalty.',
      'Regional transit is serviceable, but not as seamless as Vienna, Bilbao, or Cologne.',
      'Career upside is narrower, especially for specialized international roles.',
    ],
  },
  cologne: {
    reviewNote: 'Re-checked against current childcare, transport, and Kindergeld anchors plus benchmark cross-checks.',
    pros: [
      'Good all-round German family platform with verified childcare and benefit anchors already in place.',
      'Daily life works well without a car across the tram, U-Bahn, and regional-rail network.',
      'Better overall value than Stuttgart if salary upside is not the main objective.',
    ],
    cons: [
      'Rent pressure is still high for a family-sized flat in the best districts.',
      'Late-night station nuisance is a recurring quality-of-life negative.',
      'Doctor availability can still be the real bottleneck even when the wider healthcare system is strong.',
    ],
  },
  valencia: {
    reviewNote: 'Re-checked against current Spanish housing market data, Metrovalencia fares, and INE CPI benchmarks.',
    pros: [
      'Outstanding climate and one of the best cycling networks in Spain make daily life genuinely enjoyable.',
      'Affordable rents relative to Barcelona or Madrid without sacrificing urban quality or hospital access.',
      'Hospital La Fe is a serious medical anchor and private supplemental cover is cheap.',
    ],
    cons: [
      'Salaries lag German cities significantly — the gap is real for STEM and IT households.',
      'Flash flooding (DANA events) in autumn is a genuine risk that requires thoughtful neighbourhood selection.',
      'Spanish homologación for psychologists is a long and Spanish-language process with no shortcuts.',
    ],
  },
  vienna: {
    reviewNote: 'Re-checked against the current city childcare page, Wiener Linien annual pass, and federal family-benefit table.',
    pros: [
      'Best overall safety, transit ease, and family calm in the final set.',
      'Very strong public realm for a household with an infant, especially without a car.',
      'Public-school and healthcare confidence are unusually high for a major European capital.',
    ],
    cons: [
      'Infant-care tariff detail is still less transparent than the free-kindergarten headline suggests.',
      'Purchase prices are steep if buying is part of the relocation plan.',
      'Administrative and social integration friction can feel higher if the household stays outside German for too long.',
    ],
  },
  ...cityExpansionWaveSummary.comparisonMeta,
};