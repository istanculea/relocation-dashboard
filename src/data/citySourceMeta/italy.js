import { numbeoBenchmarks } from '../numbeoBenchmarks.js';
import { officialChildcareTariffs } from '../officialChildcareTariffs.js';
import { secondaryBenchmarks } from '../secondaryBenchmarks.js';

const milanMunicipalChildcareTariffs = officialChildcareTariffs.milan;
const milanNidoResidentBands = milanMunicipalChildcareTariffs.nido.residentBands;
const milanSpringResidentBands = milanMunicipalChildcareTariffs.sezionePrimavera.residentBands;

export const italyCitySourceMeta = {
  milan: {
    housingCosts: [
      {
        label: 'Comune di Milano housing and real estate portal',
        url: 'https://www.comune.milano.it/aree-tematiche/casa-e-residenza',
        note:
          'The Milan municipality portal covers public housing applications, rental market guidance, social housing, and the ISEE-based housing-subsidy system.',
        verifiedAt: 'Current 2026 Comune di Milano housing portal',
      },
      {
        label: 'Agenzia Entrate OMI Milan real estate market',
        url: 'https://www1.agenziaentrate.gov.it/servizi/Consultazione/ricerca.htm?level=0',
        note:
          'The official OMI observatory publishes biannual price and rental quotes for all Milan municipality zones, used as the basis for tax assessments.',
        verifiedAt: 'OMI 2H 2025 residential market report',
      },
      ...numbeoBenchmarks.milan.housingCosts,
      ...(secondaryBenchmarks.milan?.housingCosts ?? []),
    ],
    childcareCosts: [
      {
        label: milanMunicipalChildcareTariffs.label,
        url: milanMunicipalChildcareTariffs.url,
        note:
          `The official Comune di Milano contributive-quote PDF dated 1 July 2025 sets the registration fee at ${milanMunicipalChildcareTariffs.registrationFee}. For resident nidi, the monthly fee bands are ${milanNidoResidentBands[0].monthly} up to EUR6,500, ${milanNidoResidentBands[1].monthly} for ${milanNidoResidentBands[1].iseeBand}, ${milanNidoResidentBands[2].monthly} for ${milanNidoResidentBands[2].iseeBand}, and ${milanNidoResidentBands[3].monthly} for ${milanNidoResidentBands[3].iseeBand}; the non-resident nido rate is ${milanMunicipalChildcareTariffs.nido.nonResidentMonthly}/month. For sezioni primavera, the resident bands are ${milanSpringResidentBands[0].monthly}, ${milanSpringResidentBands[1].monthly}, ${milanSpringResidentBands[2].monthly}, and ${milanSpringResidentBands[3].monthly}, with a non-resident rate of ${milanMunicipalChildcareTariffs.sezionePrimavera.nonResidentMonthly}/month.`,
        verifiedAt: milanMunicipalChildcareTariffs.verifiedAt,
        snapshotValue:
          `Milan municipal nido 2025/2026: ${milanNidoResidentBands[0].monthly} to ISEE EUR6,500, then ${milanNidoResidentBands[1].monthly}, ${milanNidoResidentBands[2].monthly}, and ${milanNidoResidentBands[3].monthly}; non-resident rate ${milanMunicipalChildcareTariffs.nido.nonResidentMonthly}/month.`,
        strictLines: [
          `Registration fee: ${milanMunicipalChildcareTariffs.registrationFee}. Resident nido monthly bands are ${milanNidoResidentBands[0].monthly}, ${milanNidoResidentBands[1].monthly}, ${milanNidoResidentBands[2].monthly}, and ${milanNidoResidentBands[3].monthly} by ISEE band.`,
          `Non-resident nido rate: ${milanMunicipalChildcareTariffs.nido.nonResidentMonthly}/month. Sezione primavera resident bands are ${milanSpringResidentBands[0].monthly}, ${milanSpringResidentBands[1].monthly}, ${milanSpringResidentBands[2].monthly}, and ${milanSpringResidentBands[3].monthly}.`,
          `Reductions in the same PDF include 50% for low attendance or December, 30% for the second sibling, EUR56.20/month for each sibling after the second, and 10% for a single advance payment.`,
        ],
      },
      {
        label: 'Comune di Milano nidi and sezioni primavera service',
        url: 'https://www.comune.milano.it/servizi/scuola/nidi-d-infanzia-e-sezioni-primavera',
        note:
          'Comune di Milano\'s service page, updated 12 May 2026, says the 2026/2027 admissions cycle for nidi and sezioni primavera closed on 25 February 2026 and points families to the official attachments, Geoschool, and the municipal 0-3 services pages for the current nursery system.',
        verifiedAt: 'Updated 12 May 2026 Comune di Milano service page',
      },
      {
        label: 'Comune di Milano 0-3 services overview',
        url: 'https://www.comune.milano.it/argomenti/scuola/0-3-anni',
        note:
          'The official 0-3 page says Milan nidi serve children from 3 months to 3 years, with sections for 3-12 months and 12-36 months, and links the 2025/2026 contributive-quote PDF plus the quota-revision and payment pages in the same municipal service cluster.',
        verifiedAt: 'Updated 12 May 2026 Comune di Milano 0-3 page',
      },
      {
        label: 'Comune di Milano nursery quota workflow',
        url: 'https://www.comune.milano.it/servizi/scuola/nidi-d-infanzia-e-sezioni-primavera-revisione-della-quota-contributiva',
        note:
          'The quota-revision page, updated 12 May 2026, lets families request a quota review from the start of the educational year until 30 April in defined hardship or error cases, and the assigned quota remains payable until the municipality confirms any change.',
        verifiedAt: 'Updated 12 May 2026 Comune di Milano quota page',
      },
      {
        label: 'Comune di Milano nursery payment attestations',
        url: 'https://www.comune.milano.it/servizi/scuola/nidi-d-infanzia-e-sezioni-primavera-ricevuta-telematica-e-attestazione-di-pagamento',
        note:
          'The payment page, updated 12 May 2026, explains telematic receipts and payment attestations for nidi and sezioni primavera and explicitly lists Bonus nido INPS among the accepted reasons for requesting a payment certificate.',
        verifiedAt: 'Updated 12 May 2026 Comune di Milano payment page',
      },
      ...numbeoBenchmarks.milan.childcareCosts,
      ...(secondaryBenchmarks.milan?.childcareCosts ?? []),
    ],
    basketCosts: [
      {
        label: 'ISTAT consumer price index Italy',
        url: 'https://www.istat.it/it/prezzi/prezzi-al-consumo',
        note:
          'ISTAT publishes the monthly Italian consumer price index covering food, beverages, clothing, household goods, and personal care items.',
        verifiedAt: 'Current 2026 ISTAT CPI portal',
      },
      ...numbeoBenchmarks.milan.basketCosts,
      ...(secondaryBenchmarks.milan?.basketCosts ?? []),
    ],
    mobilityCosts: [
      {
        label: 'ATM Milan subscriptions',
        url: 'https://www.atm.it/en/ViaggiaConNoi/Abbonamenti/Pages/default.aspx',
        note:
          'ATM lists the ordinary urban subscription for travel within the Municipality of Milan and the city sections of Trenord and S lines at EUR39 monthly or EUR330 annually.',
        verifiedAt: 'Current 2026 ATM subscriptions page',
        snapshotValue: 'Urban monthly pass: EUR39; annual pass: EUR330.',
        strictLines: [
          'Urban subscriptions cover the Municipality of Milan and the city sections of Trenord and S lines.',
          'Ordinary urban monthly pass: EUR39.',
          'Ordinary urban annual pass: EUR330.',
        ],
      },
      ...(secondaryBenchmarks.milan?.mobilityCosts ?? []),
    ],
    healthcareAccess: [
      {
        label: 'ATS Città Metropolitana di Milano',
        url: 'https://www.ats-milano.it/',
        note:
          'ATS Milano is the metropolitan public health agency overseeing GP registration, vaccination, preventive health, and SSN access for Milan residents.',
        verifiedAt: 'Current 2026 ATS Milano portal',
      },
      {
        label: 'ASST Fatebenefratelli Sacco hospital network',
        url: 'https://www.asst-fbf-sacco.it/',
        note:
          'ASST Fatebenefratelli Sacco operates major public hospitals in Milan, including paediatric, maternity, and emergency services under the SSN.',
        verifiedAt: 'Current 2026 ASST portal',
      },
      {
        label: 'Ministero della Salute SSN patient rights',
        url: 'https://www.salute.gov.it/portale/lea/homeLea.jsp',
        note:
          'The Italian Ministry of Health publishes the LEA (Livelli Essenziali di Assistenza) framework guaranteeing the minimum SSN healthcare entitlements for all residents.',
        verifiedAt: 'Current 2026 Ministero della Salute portal',
      },
    ],
    familyBenefits: [
      {
        label: 'INPS family support overview',
        url: 'https://www.inps.it/it/it/sostegni-sussidi-indennita/per-nucleo-familiare.html',
        note:
          'INPS confirms that Assegno Unico and Bonus asilo nido are national programs rather than city-level Milan benefits.',
        verifiedAt: 'Current INPS portal 2025',
      },
      {
        label: 'INPS Assegno Unico e Universale per i figli',
        url: 'https://www.inps.it/it/it/sostegni-sussidi-indennita/per-nucleo-familiare/assegno-unico-e-universale-per-i-figli-a-carico.html',
        note:
          'INPS publishes the Assegno Unico rates: EUR57-281 per child per month depending on ISEE, with supplements for disabled children and large families.',
        verifiedAt: 'Current 2026 INPS Assegno Unico page',
      },
    ],
    communityVoices: [
      {
        label: 'Expatica Italy — Milan living guide',
        url: 'https://www.expatica.com/it/',
        note:
          'Expatica Italy covers housing, SSN registration, childcare, schools, and everyday family life in Milan from resident perspectives.',
        communitySource: true,
      },
      {
        label: 'InterNations Milan expat community',
        url: 'https://www.internations.org/milan-expats',
        note:
          'InterNations Milan connects residents and newcomers sharing relocation experiences, housing insights, and family-life tips.',
        communitySource: true,
      },
      {
        label: 'r/italy community forum',
        url: 'https://www.reddit.com/r/italy/',
        note:
          'Italian Reddit community where locals and international residents discuss housing, healthcare, family life, and everyday topics.',
        communitySource: true,
      },
      {
        label: 'Expats in Italy community',
        url: 'https://www.expatsinitaly.com/',
        note:
          'Community resource for English-speaking expats in Italy covering residency, healthcare, childcare, and practical family-life topics.',
        communitySource: true,
      },
      {
        label: 'r/milano community forum',
        url: 'https://www.reddit.com/r/milano/',
        note:
          'City-specific Reddit forum for Milan residents discussing neighbourhood life, housing, schools, transit, and family integration.',
        communitySource: true,
      },
    ],
  },
  bologna: {
    housingCosts: [
      {
        label: 'Agenzia Entrate OMI Bologna residential market',
        url: 'https://www1.agenziaentrate.gov.it/servizi/Consultazione/ricerca.htm?level=0',
        note:
          'The official OMI observatory publishes biannual price and rental quotes for Bologna municipality zones, used as the official real estate market reference.',
        verifiedAt: 'OMI 2H 2025 residential market report',
      },
      {
        label: 'Comune di Bologna housing and social services',
        url: 'https://www.comune.bologna.it/argomenti/casa',
        note:
          'The Bologna municipal housing portal covers rental subsidies, social housing applications, and tenant support services.',
        verifiedAt: 'Current 2026 Comune di Bologna housing portal',
      },
      ...numbeoBenchmarks.bologna.housingCosts,
      ...(secondaryBenchmarks.bologna?.housingCosts ?? []),
    ],
    childcareCosts: [
      {
        label: 'Bologna municipal nido tariffs',
        url: 'https://www.comune.bologna.it/informazioni/tariffe-nidi-comunali-nidi-gestione-diretta-indiretta',
        note:
          'Comune di Bologna says direct and indirect municipal nidi share the same ISEE-based monthly tariffs, include the meal, and from the 2025/2026 school year apply a EUR20 reduction for full-time attendance to 17.30 versus 18.00 plus a further 10% reduction for standard exit by 16.30.',
        verifiedAt: 'Current 2026 Comune di Bologna page',
        snapshotValue:
          'Bologna municipal nido tariffs are ISEE-based, meal-inclusive, and discounted for shorter full-time schedules from 2025/2026.',
        strictLines: [
          'Comune di Bologna says direct and indirect municipal nidi share the same ISEE-based monthly tariffs and include the meal.',
          'From 2025/2026, full-time attendance to 17.30 is EUR20 below the 18.00 tariff.',
          'Full-time standard attendance with exit by 16.30 gets a further 10% reduction relative to the 17.30 tariff.',
        ],
      },
      {
        label: 'Bologna conventioned nidi agevolations',
        url: 'https://www.comune.bologna.it/informazioni/nidi-dinfanzia-privati-in-convenzione',
        note:
          'Comune di Bologna publishes the monthly agevolazione bands for conventioned nidi in 2026/2027: EUR833.30 up to ISEE 12,000, EUR798.30 for 12,000.01-20,000, EUR763.30 for 20,000.01-26,000, EUR688.30 for 26,000.01-30,000, EUR553.30 for 30,000.01-35,000, EUR428.30 for 35,000.01-45,000, EUR323.30 for 45,000.01-50,000, and EUR137 for new entrants above EUR50,000 or without ISEE.',
        verifiedAt: 'Current 2026 Comune di Bologna page',
      },
      ...numbeoBenchmarks.bologna.childcareCosts,
      ...(secondaryBenchmarks.bologna?.childcareCosts ?? []),
    ],
    basketCosts: [
      {
        label: 'ISTAT consumer price index Italy',
        url: 'https://www.istat.it/it/prezzi/prezzi-al-consumo',
        note:
          'ISTAT publishes the monthly Italian consumer price index covering food, beverages, clothing, household goods, and personal care items.',
        verifiedAt: 'Current 2026 ISTAT CPI portal',
      },
      ...numbeoBenchmarks.bologna.basketCosts,
      ...(secondaryBenchmarks.bologna?.basketCosts ?? []),
    ],
    healthcareAccess: [
      {
        label: 'AUSL Bologna doctor and pediatrician choice',
        url: 'https://www.ausl.bologna.it/guida-ai-servizi/prestazioni/50961',
        note:
          'AUSL Bologna says SSN enrollment gives access to a family doctor or trusted pediatrician; for children aged 0 to 6 the pediatrician is mandatory, and the choice is made within the territorial list of residence.',
        verifiedAt: 'Current 2026 AUSL Bologna service guide',
      },
      {
        label: 'AUSL Bologna service guide locations',
        url: 'https://www.ausl.bologna.it/guida-ai-servizi/luoghi-1',
        note:
          'AUSL Bologna maintains a searchable service guide for locations, services, and CUP desks across the Bologna districts, with the regional green number 800 033033 published for citizen support.',
        verifiedAt: 'Current 2026 AUSL Bologna guide',
      },
    ],
    mobilityCosts: [
      {
        label: 'TPER urban fares page',
        url: 'https://www.tper.it/tariffe',
        note:
          'The public TPER fares page exposes Bologna urban subscriptions directly: monthly impersonal EUR39, annual impersonal EUR340, and annual personal EUR310, all valid in the urban area of Bologna with Trenitalia Tper stations inside the urban area.',
        verifiedAt: 'Current 2026 TPER fares page',
        snapshotValue:
          'Bologna urban subscriptions: monthly impersonal EUR39; annual impersonal EUR340; annual personal EUR310.',
        strictLines: [
          'TPER publishes Bologna urban subscriptions on the public fares page.',
          'Monthly impersonal subscription: EUR39.',
          'Annual subscriptions: EUR340 impersonal or EUR310 personal.',
        ],
      },
      ...(secondaryBenchmarks.bologna?.mobilityCosts ?? []),
    ],
    familyBenefits: [
      {
        label: 'INPS family support overview',
        url: 'https://www.inps.it/it/it/sostegni-sussidi-indennita/per-nucleo-familiare.html',
        note:
          'INPS confirms that Assegno Unico and Bonus asilo nido are national programs rather than city-level Bologna benefits.',
        verifiedAt: 'Current INPS portal 2025',
      },
      {
        label: 'INPS Assegno Unico e Universale per i figli',
        url: 'https://www.inps.it/it/it/sostegni-sussidi-indennita/per-nucleo-familiare/assegno-unico-e-universale-per-i-figli-a-carico.html',
        note:
          'INPS publishes the Assegno Unico rates: EUR57-281 per child per month depending on ISEE, with supplements for disabled children and large families.',
        verifiedAt: 'Current 2026 INPS Assegno Unico page',
      },
    ],
    communityVoices: [
      {
        label: 'Expatica Italy — Bologna living guide',
        url: 'https://www.expatica.com/it/',
        note:
          'Expatica Italy covers housing, SSN registration, childcare, schools, and everyday family life in Italy from resident perspectives.',
        communitySource: true,
      },
      {
        label: 'InterNations Bologna expat community',
        url: 'https://www.internations.org/bologna-expats',
        note:
          'InterNations Bologna connects residents and newcomers sharing relocation experiences and family-life insights.',
        communitySource: true,
      },
      {
        label: 'r/italy community forum',
        url: 'https://www.reddit.com/r/italy/',
        note:
          'Italian Reddit community where locals and international residents discuss housing, healthcare, family life, and everyday topics.',
        communitySource: true,
      },
      {
        label: 'Expats in Italy community',
        url: 'https://www.expatsinitaly.com/',
        note:
          'Community resource for English-speaking expats in Italy covering residency, healthcare, childcare, and practical family-life topics.',
        communitySource: true,
      },
      {
        label: 'r/bologna community forum',
        url: 'https://www.reddit.com/r/Bologna/',
        note:
          'Local Reddit forum for Bologna discussing neighbourhood life, housing, schools, transport, and everyday family topics.',
        communitySource: true,
      },
    ],
  },
  lugo: {
    housingCosts: [
      {
        label: 'Agenzia Entrate OMI Lugo 2H 2025 lookup',
        url: 'https://www1.agenziaentrate.gov.it/servizi/Consultazione/ricerca.htm?level=0',
        note:
          'In the official OMI lookup for Ravenna > Lugo > residential > 2H 2025, Abitazioni civili are quoted at EUR1,350-1,650/sqm and EUR5-6/sqm/month in B2/Centro Storico, EUR1,400-1,750/sqm and EUR5.1-6.4/sqm/month in B1 around the historic core, and EUR860-1,150/sqm with EUR3-4.1/sqm/month in E1/Frazione di Voltana.',
        verifiedAt: 'Queried 12 May 2026 against OMI 2H 2025',
        snapshotValue:
          'Lugo OMI 2H 2025 places Abitazioni civili at EUR1,350-1,650/sqm in the historic center and EUR860-1,150/sqm in Voltana, with residential rents around EUR3-6.4/sqm/month depending on zone.',
        strictLines: [
          'Agenzia Entrate OMI 2H 2025 quotes Lugo B2/Centro Storico at EUR1,350-1,650 per sqm for Abitazioni civili, with locazione at EUR5-6 per sqm per month.',
          'Lugo B1 around the historic core is quoted at EUR1,400-1,750 per sqm and EUR5.1-6.4 per sqm per month.',
          'Lugo E1/Frazione di Voltana is quoted at EUR860-1,150 per sqm and EUR3-4.1 per sqm per month.',
        ],
      },
    ],
    childcareCosts: [
      {
        label: 'Bassa Romagna nursery fee rules',
        url: 'https://www.labassaromagna.it/Amministrazione/Documenti-e-dati/Modulistica/Rette-servizi-educativi-e-scolastici',
        note:
          'The Unione della Bassa Romagna says Lugo nursery fees are approved each school year, remain ISEE-based, and include automatic reductions for economic situation and pluriutenza, with the 2026/2027 rules approved by Giunta resolution n. 191 of 11 December 2025.',
        verifiedAt: 'Updated 5 Mar 2026 Bassa Romagna fee rules page',
        snapshotValue:
          'Lugo nursery fees are officially set each school year by the Unione della Bassa Romagna and remain ISEE-based with family reductions.',
        strictLines: [
          'The Unione della Bassa Romagna publishes Lugo nursery fee rules for each school year.',
          'The tariff system remains ISEE-based and applies automatic economic and sibling/pluriutenza reductions.',
          'The 2026/2027 fee rules were approved by Union Giunta resolution n. 191 on 11 December 2025.',
        ],
      },
      {
        label: 'Bassa Romagna nido support measure',
        url: 'https://www.labassaromagna.it/Amministrazione/Documenti-e-dati/Documenti-tecnici-di-supporto/Misura-sostegno-famiglie-servizi-nido',
        note:
          'For the 2025/2026 school year, the Unione says Emilia-Romagna resident families with ISEE up to EUR26,000 receive a 55% reduction on the monthly nursery fee from December 2025, including Union-run and conventioned private nidi.',
        verifiedAt: 'Updated 4 Mar 2026 Bassa Romagna nido support page',
      },
    ],
    basketCosts: [
      {
        label: 'Lugo basket benchmark gap',
        url: 'https://www.comune.lugo.ra.it/',
        gapNote: true,
        note:
          'Rechecked on 12 May 2026 across Comune di Lugo and the benchmark set: no current Lugo city basket dataset was retrievable, so the 2026 basket still relies on nearby-city calibration.',
      },
      {
        label: 'ISTAT consumer price index Italy',
        url: 'https://www.istat.it/it/prezzi/prezzi-al-consumo',
        note:
          'ISTAT publishes the monthly Italian consumer price index covering food, beverages, clothing, household goods, and personal care items.',
        verifiedAt: 'Current 2026 ISTAT CPI portal',
      },
    ],
    healthcareAccess: [
      {
        label: 'AUSL Romagna',
        url: 'https://www.auslromagna.it/',
        note:
          'AUSL Romagna identifies the regional public-health network and exposes services, structures and places of care, and choosing family doctors and pediatricians across Romagna.',
        verifiedAt: 'Current 2026 AUSL site',
      },
      {
        label: 'Ospedale Civile Lugo — AUSL Romagna hub',
        url: 'https://www.auslromagna.it/ravenna/ospedale-lugo',
        note:
          'The Lugo civic hospital is the local acute care facility serving Bassa Romagna, covering emergency, maternity, paediatric outpatients, and day hospital services.',
        verifiedAt: 'Current 2026 AUSL Romagna Lugo hospital page',
      },
      {
        label: 'Ministero della Salute SSN patient rights',
        url: 'https://www.salute.gov.it/portale/lea/homeLea.jsp',
        note:
          'The Italian Ministry of Health publishes the LEA framework guaranteeing the minimum SSN healthcare entitlements for all residents.',
        verifiedAt: 'Current 2026 Ministero della Salute portal',
      },
    ],
    mobilityCosts: [
      {
        label: 'Start Romagna Trova Zona',
        url: 'https://www.startromagna.it/trova-zona-3/',
        note:
          'The live Ravenna-basin selector in Trova Zona lists Lugo as zone 740 in the official Start Romagna locality lookup.',
        verifiedAt: 'Current 2026 Start Romagna zone finder',
        snapshotValue: 'Lugo is listed in zone 740 of the Ravenna basin.',
        strictLines: [
          'Trova Zona lists Lugo in zone 740 of the Ravenna basin.',
          'Start Romagna publishes the monthly personal subscription at EUR32 for 1 zone.',
          'The official zone-based mobility anchor for Lugo is therefore the 1-zone monthly tariff.',
        ],
      },
      {
        label: 'Start Romagna subscriptions',
        url: 'https://www.startromagna.it/abbonamenti/abbonamenti-2/',
        note:
          'Start Romagna publishes the Ravenna-basin monthly subscriptions table, with EUR32 for 1 zone and EUR43 for 2 zones.',
        verifiedAt: 'Current 2026 Start Romagna subscriptions page',
      },
    ],
    familyBenefits: [
      {
        label: 'INPS family support overview',
        url: 'https://www.inps.it/it/it/sostegni-sussidi-indennita/per-nucleo-familiare.html',
        note: 'National frame for Assegno Unico, which varies by ISEE and household composition rather than by city.',
        verifiedAt: 'Current INPS portal 2025',
      },
      {
        label: 'INPS Assegno Unico e Universale per i figli',
        url: 'https://www.inps.it/it/it/sostegni-sussidi-indennita/per-nucleo-familiare/assegno-unico-e-universale-per-i-figli-a-carico.html',
        note:
          'INPS publishes the Assegno Unico rates: EUR57-281 per child per month depending on ISEE, with supplements for disabled children and large families.',
        verifiedAt: 'Current 2026 INPS Assegno Unico page',
      },
    ],
    communityVoices: [
      {
        label: 'Expatica Italy — Emilia-Romagna living',
        url: 'https://www.expatica.com/it/',
        note:
          'Expatica Italy covers housing, SSN registration, childcare, schools, and everyday family life from resident perspectives across Italy.',
        communitySource: true,
      },
      {
        label: 'InterNations Ravenna-Lugo expat community',
        url: 'https://www.internations.org/ravenna-expats',
        note:
          'InterNations Ravenna is the nearest expat community hub for Lugo and Bassa Romagna residents, sharing relocation and family-life tips.',
        communitySource: true,
      },
      {
        label: 'r/italy community forum',
        url: 'https://www.reddit.com/r/italy/',
        note:
          'Italian Reddit community where locals and international residents discuss housing, healthcare, family life, and everyday topics.',
        communitySource: true,
      },
      {
        label: 'Expats in Italy community',
        url: 'https://www.expatsinitaly.com/',
        note:
          'Community resource for English-speaking expats in Italy covering residency, healthcare, childcare, and practical family-life topics.',
        communitySource: true,
      },
      {
        label: 'Bassa Romagna Comune di Lugo community portal',
        url: 'https://www.comune.lugo.ra.it/',
        note:
          'The official Lugo municipal portal publishes local events, services, and community-life information for Lugo residents and newcomers.',
        communitySource: true,
      },
    ],
  },
  reggioEmilia: {
    housingCosts: [
      {
        label: 'Agenzia Entrate OMI Reggio Emilia residential market',
        url: 'https://www1.agenziaentrate.gov.it/servizi/Consultazione/ricerca.htm?level=0',
        note:
          'The OMI observatory publishes biannual residential price and rental quotes for Reggio Emilia municipality zones.',
        verifiedAt: 'OMI 2H 2025 residential market report',
      },
      {
        label: 'Comune di Reggio Emilia housing and social services',
        url: 'https://www.comune.reggioemilia.it/argomenti/casa',
        note:
          'The Reggio Emilia municipal housing portal covers affordable housing applications, rental subsidies, and tenant support services.',
        verifiedAt: 'Current 2026 Comune RE housing portal',
      },
      ...numbeoBenchmarks.reggioEmilia.housingCosts,
    ],
    childcareCosts: [
      {
        label: 'Comune di Reggio Emilia nursery services',
        url: 'https://www.comune.reggioemilia.it/argomenti/istituzione-scuole-e-nidi-dinfanzia/nidi-dinfanzia',
        note:
          'The municipal nursery-services page states that the integrated public system serves children aged 3 to 36 months and links admissions, schedules, and fee/payment rules.',
        verifiedAt: 'Updated 13 Apr 2026',
      },
      {
        label: 'Comune di Reggio Emilia nursery fees',
        url: 'https://www.comune.reggioemilia.it/argomenti/istituzione-scuole-e-nidi-dinfanzia/rette',
        note: 'Municipal nursery fees are ISEE-based and include sibling and illness-based reductions.',
        verifiedAt: 'Updated 29 Dec 2025',
      },
      ...numbeoBenchmarks.reggioEmilia.childcareCosts,
    ],
    basketCosts: [
      {
        label: 'ISTAT consumer price index Italy',
        url: 'https://www.istat.it/it/prezzi/prezzi-al-consumo',
        note:
          'ISTAT publishes the monthly Italian consumer price index covering food, beverages, clothing, household goods, and personal care items.',
        verifiedAt: 'Current 2026 ISTAT CPI portal',
      },
      ...numbeoBenchmarks.reggioEmilia.basketCosts,
    ],
    healthcareAccess: [
      {
        label: 'AUSL Reggio Emilia',
        url: 'https://www.ausl.re.it/',
        note:
          'AUSL Reggio Emilia identifies the local public-health network and links citizen services, family doctors and pediatricians, and the hospital network, including Santa Maria Nuova.',
        verifiedAt: 'Current 2026 AUSL site',
      },
      {
        label: 'IRCCS Arcispedale Santa Maria Nuova',
        url: 'https://www.asmn.re.it/',
        note:
          'Santa Maria Nuova is the main public hospital in Reggio Emilia, with emergency, paediatric, maternity, and specialist wards accessible through the SSN.',
        verifiedAt: 'Current 2026 ASMN portal',
      },
      {
        label: 'Ministero della Salute SSN patient rights',
        url: 'https://www.salute.gov.it/portale/lea/homeLea.jsp',
        note:
          'The Italian Ministry of Health publishes the LEA framework guaranteeing the minimum SSN healthcare entitlements for all residents.',
        verifiedAt: 'Current 2026 Ministero della Salute portal',
      },
    ],
    mobilityCosts: [
      {
        label: 'SETA Reggio Emilia subscriptions',
        url: 'https://www.setaweb.it/re/abbonamenti',
        note:
          'SETA lists the Urbano Reggio Emilia subscription at EUR32 monthly, with annual urban passes at EUR240 for ages 14-26 and EUR260 from age 27.',
        verifiedAt: 'Current 2026 SETA subscriptions page',
        snapshotValue:
          'Urban monthly pass: EUR32; annual urban pass: EUR240 age 14-26 / EUR260 age 27+.',
        strictLines: [
          'SETA lists the Urbano Reggio Emilia subscription in the ordinary passes table.',
          'Urban monthly pass: EUR32.',
          'Urban annual pass: EUR240 for ages 14-26 and EUR260 from age 27.',
        ],
      },
    ],
    familyBenefits: [
      {
        label: 'INPS family support overview',
        url: 'https://www.inps.it/it/it/sostegni-sussidi-indennita/per-nucleo-familiare.html',
        note: 'National frame for Assegno Unico, which varies by ISEE and household composition rather than by city.',
        verifiedAt: 'Current INPS portal 2025',
      },
      {
        label: 'INPS Assegno Unico e Universale per i figli',
        url: 'https://www.inps.it/it/it/sostegni-sussidi-indennita/per-nucleo-familiare/assegno-unico-e-universale-per-i-figli-a-carico.html',
        note:
          'INPS publishes the Assegno Unico rates: EUR57-281 per child per month depending on ISEE, with supplements for disabled children and large families.',
        verifiedAt: 'Current 2026 INPS Assegno Unico page',
      },
    ],
    communityVoices: [
      {
        label: 'Expatica Italy — Emilia-Romagna living',
        url: 'https://www.expatica.com/it/',
        note:
          'Expatica Italy covers housing, SSN registration, childcare, schools, and everyday family life from resident perspectives across Italy.',
        communitySource: true,
      },
      {
        label: 'InterNations Reggio Emilia expat community',
        url: 'https://www.internations.org/reggio-emilia-expats',
        note:
          'InterNations Reggio Emilia connects residents and newcomers sharing relocation experiences and family-life insights.',
        communitySource: true,
      },
      {
        label: 'r/italy community forum',
        url: 'https://www.reddit.com/r/italy/',
        note:
          'Italian Reddit community where locals and international residents discuss housing, healthcare, family life, and everyday topics.',
        communitySource: true,
      },
      {
        label: 'Expats in Italy community',
        url: 'https://www.expatsinitaly.com/',
        note:
          'Community resource for English-speaking expats in Italy covering residency, healthcare, childcare, and practical family-life topics.',
        communitySource: true,
      },
      {
        label: 'Comune di Reggio Emilia community portal',
        url: 'https://www.comune.reggioemilia.it/',
        note:
          'The Reggio Emilia official portal hosts local service guides, family welfare news, and integration resources for new residents.',
        communitySource: true,
      },
    ],
  },
};