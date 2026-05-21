import { numbeoBenchmarks } from '../numbeoBenchmarks.js';

export const northAndCentralEuropeCitySourceMeta = {
  berlin: {
    housingCosts: [
      {
        label: 'IBB Berlin housing market report',
        url: 'https://www.ibb.de/de/themenschwerpunkte/wohnen-in-berlin/wohnungsmarktbericht.html',
        note:
          'The IBB annual Wohnungsmarktbericht tracks rents, vacancy rates, new construction, and household income ratios for Berlin.',
        verifiedAt: 'IBB 2025 housing market report',
      },
      {
        label: 'Statistisches Amt Berlin-Brandenburg housing statistics',
        url: 'https://www.statistik-berlin-brandenburg.de/MietenWohnen',
        note:
          'The regional statistics office publishes rent indices, dwelling stock data, and housing market indicators for Berlin.',
        verifiedAt: 'Current 2026 Statistik Berlin-Brandenburg portal',
      },
      ...numbeoBenchmarks.berlin.housingCosts,
    ],
    childcareCosts: [
      {
        label: 'Berlin Senate childcare costs and surcharges',
        url: 'https://www.berlin.de/sen/jugend/familie-und-kinder/kindertagesbetreuung/kostenbeteiligung/',
        note:
          'The Berlin Senate says childcare in Kitas and Kindertagespflege is free of charge. Parents pay a EUR23/month meal contribution when lunch is provided, and optional add-on surcharges are generally capped at EUR100/month per child from January 2025 unless a Senate-approved exception applies.',
        verifiedAt: 'Reviewed May 2026 Berlin Senate costs page',
        snapshotValue:
          'Berlin public Kita and Kindertagespflege are free; parents pay EUR23/month for lunch, with optional surcharges generally capped at EUR100/month from 2025.',
        strictLines: [
          'Berlin says childcare in Kitas and Kindertagespflege is free of charge.',
          'When lunch is provided, parents contribute EUR23 per month for meals.',
          'From January 2025, optional add-on surcharges are generally capped at EUR100 per child per month.',
        ],
      },
      {
        label: 'Kita-Navigator Berlin childcare search',
        url: 'https://www.kita-navigator.berlin.de/',
        note:
          'The official Berlin Senate childcare portal allows families to search for Kitas by district, age, and availability.',
        verifiedAt: 'Current 2026 Berlin Senate Kita-Navigator',
      },
      ...numbeoBenchmarks.berlin.childcareCosts,
    ],
    basketCosts: [
      {
        label: 'Statistisches Bundesamt Verbraucherpreisindex',
        url: 'https://www.destatis.de/DE/Themen/Wirtschaft/Preise/Verbraucherpreisindex/_inhalt.html',
        note:
          'Destatis publishes the monthly consumer price index for Germany, covering food, beverages, clothing, household goods, and personal care items.',
        verifiedAt: 'Current 2026 Destatis CPI portal',
      },
      ...numbeoBenchmarks.berlin.basketCosts,
    ],
    mobilityCosts: [
      {
        label: 'BVG Berlin fares and passes',
        url: 'https://www.bvg.de/en/tickets-and-fares/all-fares',
        note:
          'BVG publishes the full Berlin fare grid including monthly subscriptions (Monatskarte), the Deutschlandticket, and the annual BVG-Abo.',
        verifiedAt: 'Current 2026 BVG fares page',
        snapshotValue: 'Berlin monthly subscription options include the EUR63 Deutschlandticket and BVG-specific passes.',
        strictLines: [
          'BVG publishes the Berlin fare grid covering single tickets, short-trip tickets, day tickets, and monthly passes.',
          'The Deutschlandticket at EUR63/month is valid on all BVG lines.',
          'The BVG-Abo monthly direct debit subscription is available for AB and ABC fare zones.',
        ],
      },
      {
        label: 'Deutschlandticket',
        url: 'https://deutschlandticket.de/',
        note: 'Current nationwide EUR63 monthly pass used for Berlin transport budgeting.',
        verifiedAt: 'Current 2026 operator page',
      },
    ],
    healthcareAccess: [
      {
        label: 'Charité – Universitätsmedizin Berlin',
        url: 'https://www.charite.de/',
        note:
          'Charité is one of Europe\'s largest university hospitals, covering all major specialties and serving as the main tertiary referral centre for Berlin.',
        verifiedAt: 'Current 2026 Charité portal',
      },
      {
        label: 'Berlin Landesamt für Gesundheit und Soziales',
        url: 'https://www.berlin.de/lageso/',
        note:
          'LaGeSo is the Berlin state authority for health, social services, and veterinary matters, publishing public health data and citizen services.',
        verifiedAt: 'Current 2026 LaGeSo Berlin portal',
      },
    ],
    familyBenefits: [
      {
        label: 'Familienportal Kindergeld FAQ',
        url: 'https://familienportal.de/familienportal/familienleistungen/kindergeld/faq/was-ist-kindergeld--124914',
        note: 'Federal family portal states the current Kindergeld rate is EUR259 per child per month.',
        verifiedAt: 'Current 2026 federal family portal',
      },
      {
        label: 'Familienportal Elterngeld guide',
        url: 'https://familienportal.de/familienportal/familienleistungen/elterngeld',
        note:
          'The federal family portal explains Elterngeld, ElterngeldPlus, and Partnerschaftsbonus eligibility and rates for new parents.',
        verifiedAt: 'Current 2026 federal family portal',
      },
    ],
    communityVoices: [
      {
        label: 'Expatica Germany — Berlin living guide',
        url: 'https://www.expatica.com/de/',
        note:
          'Expatica Germany covers housing search, Kita enrollment, healthcare registration, and everyday family life from resident perspectives in Berlin.',
        communitySource: true,
      },
      {
        label: 'InterNations Berlin expat community',
        url: 'https://www.internations.org/berlin-expats',
        note:
          'InterNations Berlin connects residents and newcomers sharing relocation experiences, neighbourhood impressions, and family-life tips.',
        communitySource: true,
      },
      {
        label: 'r/berlin community forum',
        url: 'https://www.reddit.com/r/berlin/',
        note:
          'Active Reddit community where Berlin locals and international residents discuss housing, schools, daily life, and integration.',
        communitySource: true,
      },
      {
        label: 'Toytown Germany Berlin community',
        url: 'https://www.toytowngermany.com/',
        note:
          'English-language community forum for expats in Germany, with active Berlin threads on housing, Kita, Anmeldung, and family life.',
        communitySource: true,
      },
      {
        label: 'r/germany community forum',
        url: 'https://www.reddit.com/r/germany/',
        note:
          'Broad Reddit community for Germany covering bureaucracy, housing, childcare, healthcare, and family integration topics.',
        communitySource: true,
      },
    ],
  },
  dublin: {
    housingCosts: [
      {
        label: 'Residential Property Price Register',
        url: 'https://www.propertypriceregister.ie/',
        note:
          'The official government register publishes all residential property sale prices in Ireland, updated continuously from legal filings.',
        verifiedAt: 'Current 2026 PPPR portal',
      },
      {
        label: 'RTB Rental Price Report',
        url: 'https://www.rtb.ie/research-and-data/rental-price-reports',
        note:
          'The Residential Tenancies Board publishes quarterly rental price reports with national and regional average rent data.',
        verifiedAt: 'Current 2026 RTB portal',
      },
      ...numbeoBenchmarks.dublin.housingCosts,
    ],
    childcareCosts: [
      {
        label: 'Gov.ie National Childcare Scheme hub',
        url: 'https://www.gov.ie/en/department-of-children-disability-and-equality/campaigns/national-childcare-scheme/',
        note:
          'The government NCS hub, last updated 12 April 2025, routes families to the live applicant portal, subsidy calculator, types-of-subsidy guidance, and childcare search instead of publishing one static Dublin crèche tariff on the campaign page.',
        verifiedAt: 'Updated 12 Apr 2025 gov.ie NCS hub',
      },
      {
        label: 'Dublin childcare tariff gap note',
        url: 'https://www.ncs.gov.ie/en/',
        gapNote: true,
        note:
          'Rechecked in May 2026: Dublin childcare can now be anchored to the live government NCS scheme hub, but the remaining price surface is still provider-by-provider and portal-driven. The official pages route families to subsidy calculators and childcare search rather than exposing one flat, citywide Dublin infant crèche tariff, so the dashboard still keeps Dublin nursery cost as a subsidy-modeled comparison value.',
      },
      {
        label: 'Gov.ie ECCE free preschool scheme',
        url: 'https://www.gov.ie/en/service/11f2b5-early-childhood-care-and-education-ecce-scheme/',
        note:
          'The ECCE scheme provides free preschool for children aged 2 years 8 months to 5 years 6 months for up to two academic years.',
        verifiedAt: 'Current 2026 GOV.IE ECCE guidance',
      },
      ...numbeoBenchmarks.dublin.childcareCosts,
    ],
    basketCosts: [...numbeoBenchmarks.dublin.basketCosts],
    mobilityCosts: [
      {
        label: 'Dublin Bus fares and passes',
        url: 'https://www.dublinbus.ie/',
        note:
          'Dublin Bus publishes its official adult fares, 90-minute transfer fares, and Leap Card pricing for single journeys.',
        verifiedAt: 'Current 2026 Dublin Bus portal',
      },
      {
        label: 'Luas cross-city fares',
        url: 'https://luas.ie/',
        note:
          'Luas publishes the official tram fares for the Red and Green lines, with Leap Card discounts and monthly passes.',
        verifiedAt: 'Current 2026 Luas portal',
      },
      {
        label: 'Leap Card monthly and annual caps',
        url: 'https://www.leapcard.ie/',
        note:
          'Leap Card is the integrated fare card for Dublin bus, Luas, DART, and Commuter Rail, with monthly and annual travel caps.',
        verifiedAt: 'Current 2026 Leap Card portal',
      },
      ...numbeoBenchmarks.dublin.mobilityCosts,
    ],
    healthcareAccess: [
      {
        label: 'HSE Find a GP service',
        url: 'https://www2.hse.ie/gp/find-a-gp/',
        note:
          'The HSE GP finder lets residents search for public GP practices by location and check registration availability in Dublin.',
        verifiedAt: 'Current 2026 HSE portal',
      },
      {
        label: 'Children\'s Health Ireland',
        url: 'https://www.childrenshealthireland.ie/',
        note:
          'Children\'s Health Ireland operates the main paediatric hospital network in Dublin, covering emergency, outpatient, and specialist children\'s services.',
        verifiedAt: 'Current 2026 CHI portal',
      },
    ],
    familyBenefits: [
      {
        label: 'Gov.ie Child Benefit',
        url: 'https://www.gov.ie/en/service/f14140-child-benefit/',
        note:
          'Government service page last updated 7 October 2025: EUR140/month per child and a EUR280 newborn baby grant for births from 1 December 2024.',
        verifiedAt: 'Updated 7 Oct 2025',
      },
      {
        label: 'Gov.ie Working Family Payment',
        url: 'https://www.gov.ie/en/service/0900a0-working-family-payment/',
        note:
          'The Working Family Payment is a weekly tax-free payment for employees with children, based on family income thresholds.',
        verifiedAt: 'Current 2026 Gov.ie guidance',
      },
    ],
    communityVoices: [
      {
        label: 'Expatica Ireland — Dublin living guide',
        url: 'https://www.expatica.com/ie/',
        note:
          'Expatica Ireland covers housing, GP registration, childcare, schools, and everyday family life in Dublin from resident perspectives.',
        communitySource: true,
      },
      {
        label: 'InterNations Dublin expat community',
        url: 'https://www.internations.org/dublin-expats',
        note:
          'InterNations Dublin connects newcomers and residents sharing relocation tips, neighbourhood impressions, and family-life experiences.',
        communitySource: true,
      },
      {
        label: 'r/ireland community forum',
        url: 'https://www.reddit.com/r/ireland/',
        note:
          'Active Reddit community where Irish locals and international residents discuss housing, healthcare, cost of living, and family topics.',
        communitySource: true,
      },
      {
        label: 'r/Dublin community forum',
        url: 'https://www.reddit.com/r/Dublin/',
        note:
          'City-specific Reddit forum for Dublin residents covering neighbourhood life, housing, commuting, and family integration topics.',
        communitySource: true,
      },
      {
        label: 'Just Landed Ireland relocation guide',
        url: 'https://www.justlanded.com/english/Ireland',
        note:
          'Community-sourced relocation guide covering PPS number, HSE registration, childcare, schools, and neighbourhood choices in Dublin.',
        communitySource: true,
      },
    ],
  },
  cologne: {
    housingCosts: [
      {
        label: 'Stadt Köln Wohnungsmarkt housing overview',
        url: 'https://www.stadt-koeln.de/service/themen/wohnen-und-mieten/',
        note:
          'The Cologne municipal housing portal covers the local rental market, tenant rights, subsidised housing, and housing advisory services.',
        verifiedAt: 'Current 2026 Stadt Köln housing portal',
      },
      {
        label: 'Statistik Stadt Köln',
        url: 'https://www.stadt-koeln.de/politik-und-verwaltung/statistik',
        note:
          'The Cologne statistics office publishes housing data, population statistics, and socioeconomic indicators for the city.',
        verifiedAt: 'Current 2026 Statistik Köln portal',
      },
      ...numbeoBenchmarks.cologne.housingCosts,
    ],
    childcareCosts: [
      {
        label: 'Stadt Köln parent contributions',
        url: 'https://www.stadt-koeln.de/service/produkte/00405/',
        note:
          'Municipal nursery fees vary by household income and booked weekly hours rather than by a flat sticker price.',
        verifiedAt: 'Valid since 1 Aug 2025',
      },
      {
        label: 'Stadt Köln Kinder- und Jugendhilfe family services',
        url: 'https://www.stadt-koeln.de/service/themen/kinder-und-jugendhilfe/',
        note:
          'The Cologne family services portal covers Kita enrollment, youth welfare, family advisory, and childcare subsidy information.',
        verifiedAt: 'Current 2026 Stadt Köln family portal',
      },
      ...numbeoBenchmarks.cologne.childcareCosts,
    ],
    basketCosts: [
      {
        label: 'Statistisches Bundesamt Verbraucherpreisindex',
        url: 'https://www.destatis.de/DE/Themen/Wirtschaft/Preise/Verbraucherpreisindex/_inhalt.html',
        note:
          'Destatis publishes the monthly consumer price index for Germany, covering food, beverages, clothing, household goods, and personal care items.',
        verifiedAt: 'Current 2026 Destatis CPI portal',
      },
      ...numbeoBenchmarks.cologne.basketCosts,
    ],
    mobilityCosts: [
      {
        label: 'Deutschlandticket',
        url: 'https://deutschlandticket.de/',
        note: 'Source-linked transport anchor used for the Cologne household budget.',
        verifiedAt: 'Current 2026 operator page',
      },
      {
        label: 'KVB Köln ticket prices',
        url: 'https://www.kvb.koeln/de/abo-und-tickets/tickets/ticketpreise.html',
        note:
          'KVB publishes the Cologne tram and bus fare grid, monthly subscriptions, and annual pass options for the city network.',
        verifiedAt: 'Current 2026 KVB fares page',
      },
    ],
    healthcareAccess: [
      {
        label: 'Uniklinik Köln university hospital',
        url: 'https://www.uk-koeln.de/',
        note:
          'Uniklinik Köln is the main university hospital serving Cologne, offering all major specialties including paediatrics, emergency medicine, and maternity.',
        verifiedAt: 'Current 2026 Uniklinik Köln portal',
      },
      {
        label: 'Gesundheitsamt Köln public health office',
        url: 'https://www.stadt-koeln.de/service/produkte/00290/',
        note:
          'The Cologne public health office covers infectious disease, environmental health, mother-and-child health, and health advisory services for residents.',
        verifiedAt: 'Current 2026 Gesundheitsamt Köln portal',
      },
    ],
    familyBenefits: [
      {
        label: 'Familienportal Kindergeld FAQ',
        url: 'https://familienportal.de/familienportal/familienleistungen/kindergeld/faq/was-ist-kindergeld--124914',
        note: 'Federal family portal states the current Kindergeld rate is EUR259 per child per month.',
        verifiedAt: 'Current 2026 federal family portal',
      },
      {
        label: 'Familienportal Elterngeld guide',
        url: 'https://familienportal.de/familienportal/familienleistungen/elterngeld',
        note:
          'The federal family portal explains Elterngeld, ElterngeldPlus, and Partnerschaftsbonus eligibility and rates.',
        verifiedAt: 'Current 2026 federal family portal',
      },
    ],
    communityVoices: [
      {
        label: 'Expatica Germany — Cologne living guide',
        url: 'https://www.expatica.com/de/',
        note:
          'Expatica Germany covers housing, Kita enrollment, healthcare registration, and everyday family life from resident perspectives in Germany.',
        communitySource: true,
      },
      {
        label: 'InterNations Cologne expat community',
        url: 'https://www.internations.org/cologne-expats',
        note:
          'InterNations Cologne connects residents and newcomers sharing relocation experiences, neighbourhood insights, and family-life tips.',
        communitySource: true,
      },
      {
        label: 'r/cologne community forum',
        url: 'https://www.reddit.com/r/cologne/',
        note:
          'Local Reddit community where Cologne residents discuss neighbourhood life, housing, transit, schools, and daily family topics.',
        communitySource: true,
      },
      {
        label: 'Toytown Germany community forum',
        url: 'https://www.toytowngermany.com/',
        note:
          'English-language forum for expats in Germany with threads on housing, Anmeldung, Kita, and family life across German cities.',
        communitySource: true,
      },
      {
        label: 'r/germany community forum',
        url: 'https://www.reddit.com/r/germany/',
        note:
          'Broad Reddit community for Germany covering bureaucracy, housing, childcare, healthcare, and family integration topics.',
        communitySource: true,
      },
    ],
  },
  manchester: {
    housingCosts: [
      {
        label: 'ONS UK house price index',
        url: 'https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/housepriceindex/latest',
        note:
          'ONS publishes the UK house price index with regional and local authority breakdowns, updated monthly.',
        verifiedAt: 'Current 2026 ONS portal',
      },
      {
        label: 'Greater Manchester Combined Authority housing data',
        url: 'https://www.greatermanchester-ca.gov.uk/',
        note:
          'The GMCA publishes housing strategy, affordable housing investment, and Greater Manchester residential market data.',
        verifiedAt: 'Current 2026 GMCA portal',
      },
      ...numbeoBenchmarks.manchester.housingCosts,
    ],
    childcareCosts: [
      {
        label: 'GOV.UK free childcare if working',
        url: 'https://www.gov.uk/free-childcare-if-working',
        note:
          'GOV.UK states the scheme covers children aged 9 months to 4 years and applications can be made once a child is 23 weeks old.',
        verifiedAt: 'Current 2026 GOV.UK guidance',
      },
      {
        label: 'GOV.UK Tax-Free Childcare scheme',
        url: 'https://www.gov.uk/tax-free-childcare',
        note:
          'GOV.UK explains that eligible working parents can receive up to GBP2,000 per year per child through the Tax-Free Childcare account top-up scheme.',
        verifiedAt: 'Current 2026 GOV.UK guidance',
      },
      ...numbeoBenchmarks.manchester.childcareCosts,
    ],
    basketCosts: [
      {
        label: 'ONS Consumer Price Inflation',
        url: 'https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/latest',
        note:
          'ONS publishes monthly consumer price inflation covering food, childcare, transport, and household goods baskets.',
        verifiedAt: 'Current 2026 ONS portal',
      },
      ...numbeoBenchmarks.manchester.basketCosts,
    ],
    mobilityCosts: [
      {
        label: 'TfGM AnyBus fares',
        url: 'https://tfgm.com/fares-passes/anybus',
        gapNote: true,
        note:
          'Rechecked in May 2026: the TfGM AnyBus fares page is still guarded by JavaScript bot verification in non-browser fetches, so the bus-pass anchor remains usable for comparison but the strict mobility row still stays mixed until a stable operator tariff capture is attached.',
      },
      {
        label: 'Metrolink tram fares and passes',
        url: 'https://www.metrolink.co.uk/tickets-and-passes/',
        note:
          'Metrolink publishes the Greater Manchester tram fare zones, single fares, and multi-journey pass options.',
        verifiedAt: 'Current 2026 Metrolink portal',
      },
      ...numbeoBenchmarks.manchester.mobilityCosts,
    ],
    healthcareAccess: [
      {
        label: 'NHS Find a GP',
        url: 'https://www.nhs.uk/service-search/find-a-gp',
        note:
          'NHS England provides the official GP finder for locating and registering with a local practice in England.',
        verifiedAt: 'Current 2026 NHS portal',
      },
      {
        label: 'Manchester University NHS Foundation Trust',
        url: 'https://mft.nhs.uk/',
        note:
          'MFT operates the main Manchester hospitals including Manchester Royal Infirmary, Royal Manchester Children\'s Hospital, and St Mary\'s maternity.',
        verifiedAt: 'Current 2026 MFT NHS portal',
      },
    ],
    familyBenefits: [
      {
        label: 'GOV.UK Child Benefit',
        url: 'https://www.gov.uk/child-benefit/what-youll-get',
        note: 'GBP27.05/week for the eldest or only child, subject to high-income clawback rules.',
        verifiedAt: 'Current 2026 GOV.UK guidance',
      },
      {
        label: 'GOV.UK Universal Credit child element',
        url: 'https://www.gov.uk/universal-credit/what-youll-get',
        note:
          'Universal Credit includes a child element for eligible working families; GOV.UK publishes current rates and eligibility criteria.',
        verifiedAt: 'Current 2026 GOV.UK guidance',
      },
    ],
    communityVoices: [
      {
        label: 'Expatica UK — Manchester living guide',
        url: 'https://www.expatica.com/uk/',
        note:
          'Expatica UK covers housing, NHS registration, childcare, Brexit implications, and everyday family life in the UK.',
        communitySource: true,
      },
      {
        label: 'InterNations Manchester expat community',
        url: 'https://www.internations.org/manchester-expats',
        note:
          'InterNations Manchester connects residents and newcomers sharing relocation experiences and family-life insights in the city.',
        communitySource: true,
      },
      {
        label: 'r/manchester community forum',
        url: 'https://www.reddit.com/r/manchester/',
        note:
          'Active Reddit community where Manchester locals discuss neighbourhood life, housing, transport, schools, and everyday topics.',
        communitySource: true,
      },
      {
        label: 'r/unitedkingdom community forum',
        url: 'https://www.reddit.com/r/unitedkingdom/',
        note:
          'Broad Reddit community for the UK covering housing, cost of living, NHS, and family integration topics.',
        communitySource: true,
      },
      {
        label: 'Just Landed UK relocation guide',
        url: 'https://www.justlanded.com/english/United-Kingdom',
        note:
          'Community-sourced relocation guide covering NI number, NHS, childcare, schools, and neighbourhood comparisons in the UK.',
        communitySource: true,
      },
    ],
  },
  vienna: {
    housingCosts: [
      {
        label: 'Stadt Wien Wohnen housing portal',
        url: 'https://www.wien.gv.at/wohnen/',
        note:
          'The Vienna city housing portal covers Gemeindebau (social housing), rental market information, housing subsidies, and tenant rights.',
        verifiedAt: 'Current 2026 Wien.gv.at housing portal',
      },
      {
        label: 'Wohnberatung Wien housing advisory service',
        url: 'https://www.wohnberatung-wien.at/',
        note:
          'Vienna\'s official housing advisory service provides free consultation on rental rights, Gemeindebau applications, and affordable housing options.',
        verifiedAt: 'Current 2026 Wohnberatung Wien portal',
      },
      {
        label: 'Statistik Austria housing statistics',
        url: 'https://www.statistik.at/statistiken/bevoelkerung-und-soziales/wohnen',
        note:
          'Statistik Austria publishes the housing price index, rental market trends, and household dwelling data for Austrian cities.',
        verifiedAt: 'Current 2026 Statistik Austria portal',
      },
      ...numbeoBenchmarks.vienna.housingCosts,
    ],
    childcareCosts: [
      {
        label: 'City of Vienna childcare',
        url: 'https://www.wien.gv.at/english/social/childcare/',
        note:
          'The City of Vienna states that kindergarten is free until compulsory school age. The page does not expose a machine-readable 0-3 municipal tariff, so infant-care costs stay withheld in the strict snapshot.',
        verifiedAt: 'Current 2026 city page',
      },
      {
        label: 'MA10 Wien Kindergarten portal',
        url: 'https://www.wien.gv.at/bildung/kindergarten/',
        note:
          'MA10 Wien publishes the full kindergarten and Krabbelstuben enrollment information, including free kindergarten policy and Bildungsbonus for Viennese children.',
        verifiedAt: 'Current 2026 MA10 Wien portal',
      },
      ...numbeoBenchmarks.vienna.childcareCosts,
    ],
    basketCosts: [
      {
        label: 'Statistik Austria consumer price index',
        url: 'https://www.statistik.at/statistiken/wirtschaft/preise/verbraucherpreisindex',
        note:
          'Statistik Austria publishes the monthly consumer price index (VPI) for Austria covering food, beverages, clothing, household goods, and personal care.',
        verifiedAt: 'Current 2026 Statistik Austria CPI portal',
      },
      ...numbeoBenchmarks.vienna.basketCosts,
    ],
    mobilityCosts: [
      {
        label: 'Wiener Linien Jahreskarte',
        url: 'https://www.wienerlinien.at/jahreskarte',
        note: 'EUR461/year, about EUR38/month equivalent.',
        verifiedAt: 'Current 2026 operator page',
      },
      {
        label: 'Wiener Linien ticket pricing',
        url: 'https://www.wienerlinien.at/tickets',
        note:
          'Wiener Linien publishes the full Vienna transit fare grid, including single tickets, day passes, weekly, monthly, and annual passes.',
        verifiedAt: 'Current 2026 Wiener Linien tickets page',
      },
    ],
    healthcareAccess: [
      {
        label: 'Wiener Gesundheitsverbund (WiGev) hospital network',
        url: 'https://www.wigev.at/',
        note:
          'WiGev operates the Vienna public hospital network, including Krankenhaus Nord, AKH Wien, and all district hospitals covering emergency, paediatric, and specialist care.',
        verifiedAt: 'Current 2026 WiGev portal',
      },
      {
        label: 'Stadt Wien Gesundheitsamt health services',
        url: 'https://www.wien.gv.at/gesundheit/',
        note:
          'The City of Vienna health portal covers public health services, vaccination, mother-child health, and GP finder for Vienna residents.',
        verifiedAt: 'Current 2026 Wien.gv.at health portal',
      },
    ],
    familyBenefits: [
      {
        label: 'Bundeskanzleramt Familienbeihilfe',
        url: 'https://www.bundeskanzleramt.gv.at/agenda/familie/familienbeihilfe/basisinformation-zur-familienbeihilfe/familienbeihilfenbetraege.html',
        note: 'Official Austrian family-allowance table for the 0-3 bracket plus Kinderabsetzbetrag.',
        verifiedAt: '2025-2027 federal rate table',
      },
      {
        label: 'Bundeskanzleramt Kinderbetreuungsgeld guide',
        url: 'https://www.bundeskanzleramt.gv.at/agenda/familie/familienbeihilfe.html',
        note:
          'The Austrian Chancellery publishes the full family support portal including Kinderbetreuungsgeld models and Familienbeihilfe rates for all age bands.',
        verifiedAt: 'Current 2026 BKA family portal',
      },
    ],
    communityVoices: [
      {
        label: 'Expatica Austria — Vienna living guide',
        url: 'https://www.expatica.com/at/',
        note:
          'Expatica Austria covers housing, Meldezettel registration, health insurance, childcare, and family integration from resident perspectives in Vienna.',
        communitySource: true,
      },
      {
        label: 'InterNations Vienna expat community',
        url: 'https://www.internations.org/vienna-expats',
        note:
          'InterNations Vienna connects residents and newcomers sharing relocation experiences, Wohnungsmarkt insights, and family-life tips.',
        communitySource: true,
      },
      {
        label: 'r/Vienna community forum',
        url: 'https://www.reddit.com/r/Vienna/',
        note:
          'Active Reddit community where Vienna locals and international residents discuss neighbourhood life, housing, transit, schools, and family topics.',
        communitySource: true,
      },
      {
        label: 'r/Austria community forum',
        url: 'https://www.reddit.com/r/Austria/',
        note:
          'Broad Reddit community for Austria covering bureaucracy, housing, healthcare, and family integration topics.',
        communitySource: true,
      },
      {
        label: 'Just Landed Austria relocation guide',
        url: 'https://www.justlanded.com/english/Austria',
        note:
          'Community-sourced guide covering Anmeldung, ÖGK health insurance, kindergarten, and neighbourhood choices in Vienna.',
        communitySource: true,
      },
    ],
  },
};
