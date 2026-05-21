import { gbpToEur } from './shared.js';

const germanyOfficialSources = {
	housingCosts: [
		{
			label: 'Statistisches Bundesamt housing price statistics',
			url: 'https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Wohnen/_inhalt.html',
			note: 'Destatis publishes the German residential property price index and rental market statistics by city size and type.',
			verifiedAt: 'Current 2026 Destatis portal',
		},
	],
	childcareCosts: [
		{
			label: 'BMFSFJ Kindertagesbetreuung federal framework',
			url: 'https://www.bmfsfj.de/bmfsfj/themen/kinder-und-jugend/kindertagesbetreuung',
			note: 'The Federal Ministry for Families publishes the framework for Kita quality and subsidy access including the Kita-Qualitätsgesetz and KiTa-Navigator links.',
			verifiedAt: 'Current 2026 BMFSFJ portal',
		},
	],
	healthcareAccess: [
		{
			label: 'GKV-Spitzenverband member rights and enrollment',
			url: 'https://www.gkv-spitzenverband.de/krankenversicherung/krankenversicherung.jsp',
			note: 'The statutory health insurance federation explains enrollment rights, free Krankenkasse choice, and covered services for new residents and employees.',
			verifiedAt: 'Current 2026 GKV portal',
		},
	],
	mobilityCosts: [
		{
			label: 'Deutschlandticket',
			url: 'https://deutschlandticket.de/',
			note: 'Current nationwide EUR63 monthly pass used as the official transport anchor for German cities in this expansion wave.',
			verifiedAt: 'Current 2026 operator page',
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
			note: 'The federal family portal explains Elterngeld, ElterngeldPlus, and Partnerschaftsbonus eligibility and rates for new parents.',
			verifiedAt: 'Current 2026 federal family portal',
		},
	],
	communityVoices: [
		{
			label: 'Expatica Germany — living and working guide',
			url: 'https://www.expatica.com/de/',
			note: 'Expatica Germany aggregates expat and local perspectives on housing search, childcare, healthcare registration, and everyday family life in Germany.',
			communitySource: true,
		},
		{
			label: 'InterNations Germany expat community',
			url: 'https://www.internations.org/germany-expats',
			note: 'InterNations hosts city-level groups and forums for Germany where residents and newcomers share relocation and daily-life experiences.',
			communitySource: true,
		},
		{
			label: 'r/germany community forum',
			url: 'https://www.reddit.com/r/germany/',
			note: 'Active Reddit community where locals and international residents discuss bureaucracy, housing, family life, and integration in Germany.',
			communitySource: true,
		},
		{
			label: 'Just Landed Germany relocation guide',
			url: 'https://www.justlanded.com/english/Germany',
			note: 'Community-sourced relocation guide with local tips on housing, healthcare, childcare, and administrative first steps.',
			communitySource: true,
		},
	],
};

const austriaOfficialSources = {
	housingCosts: [
		{
			label: 'Statistik Austria housing and dwelling statistics',
			url: 'https://www.statistik.at/statistiken/bevoelkerung-und-soziales/wohnen',
			note: 'Statistik Austria publishes the housing price index, rental market trends, and household dwelling data for Austrian cities and regions.',
			verifiedAt: 'Current 2026 Statistik Austria portal',
		},
	],
	childcareCosts: [
		{
			label: 'BMSGPK Kinderbetreuung und Bildung guide',
			url: 'https://www.bmsgpk.gv.at/themen/kinderrechte-und-jugendhilfe/kinderbetreuung-und-bildung.html',
			note: 'The Austrian Social Ministry publishes the federal framework for childcare and early education, including KinderBildung eligibility and cost-sharing rules.',
			verifiedAt: 'Current 2026 BMSGPK portal',
		},
	],
	healthcareAccess: [
		{
			label: 'Österreichische Gesundheitskasse citizen enrollment',
			url: 'https://www.gesundheitskasse.at/cdscontent/?contentid=10007.897025',
			note: 'ÖGK publishes enrollment rules, covered services, and the e-card system for public health insurance across Austria.',
			verifiedAt: 'Current 2026 ÖGK portal',
		},
	],
	mobilityCosts: [
		{
			label: 'Klimaticket Osterreich',
			url: 'https://www.klimaticket.at/en/',
			note: 'Austria-wide Klimaticket Osterreich is EUR1,400/year; city monthly tariffs still vary by operator, so local daily-cost comparisons stay benchmark-led in this build.',
			verifiedAt: 'Current 2026 operator page',
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
			note: 'The Austrian Chancellery publishes the full family support portal including Kinderbetreuungsgeld models and Familienbeihilfe rates for all age bands.',
			verifiedAt: 'Current 2026 BKA family portal',
		},
	],
	communityVoices: [
		{
			label: 'Expatica Austria — living and working guide',
			url: 'https://www.expatica.com/at/',
			note: 'Expatica Austria covers housing search, health insurance registration, childcare, and family integration tips from residents.',
			communitySource: true,
		},
		{
			label: 'InterNations Austria expat community',
			url: 'https://www.internations.org/austria-expats',
			note: 'InterNations hosts city-level groups and forums for Austria where residents share relocation and family-life experiences.',
			communitySource: true,
		},
		{
			label: 'r/Austria community forum',
			url: 'https://www.reddit.com/r/Austria/',
			note: 'Active Reddit community where locals and international residents discuss daily life, bureaucracy, housing, and family topics in Austria.',
			communitySource: true,
		},
		{
			label: 'Just Landed Austria relocation guide',
			url: 'https://www.justlanded.com/english/Austria',
			note: 'Community-sourced relocation guide with local tips on Anmeldung, healthcare, childcare costs, and neighbourhood choices.',
			communitySource: true,
		},
	],
};

const italyOfficialSources = {
	housingCosts: [
		{
			label: 'Agenzia delle Entrate OMI housing market observatory',
			url: 'https://www.agenziaentrate.gov.it/portale/web/guest/osservatorio-mercato-immobiliare',
			note: 'The official OMI observatory publishes semi-annual residential price and rental bands for Italian municipalities, searchable by city and zone.',
			verifiedAt: 'Current 2026 Agenzia delle Entrate portal',
		},
	],
	childcareCosts: [
		{
			label: 'INPS Bonus asilo nido application',
			url: 'https://www.inps.it/it/it/sostegni-sussidi-indennita/per-genitori-e-figli/bonus-asilo-nido.html',
			note: 'INPS publishes the Bonus asilo nido rates: EUR272.73/month for ISEE up to EUR25,000; EUR149.77 for EUR25,001-40,000; EUR85.64 above EUR40,000.',
			verifiedAt: 'Current 2026 INPS portal',
		},
	],
	healthcareAccess: [
		{
			label: 'Ministero della Salute SSN citizen guide',
			url: 'https://www.salute.gov.it/portale/lea/homeLea.jsp',
			note: 'The Ministry of Health publishes the national essential healthcare levels (LEA) and SSN enrollment rights for all Italian residents.',
			verifiedAt: 'Current 2026 Ministero della Salute portal',
		},
	],
	familyBenefits: [
		{
			label: 'INPS family support overview',
			url: 'https://www.inps.it/it/it/sostegni-sussidi-indennita/per-nucleo-familiare.html',
			note: 'INPS confirms that Assegno Unico and Bonus asilo nido are national programs rather than city-level allowances.',
			verifiedAt: 'Current INPS portal 2025',
		},
		{
			label: 'INPS Assegno Unico Universale',
			url: 'https://www.inps.it/it/it/sostegni-sussidi-indennita/per-genitori-e-figli/assegno-unico-e-universale-per-i-figli-a-carico.html',
			note: 'INPS explains the Assegno Unico Universale benefit for dependent children, ISEE-based rates, and application process.',
			verifiedAt: 'Current 2026 INPS portal',
		},
	],
	communityVoices: [
		{
			label: 'Expatica Italy — living and working guide',
			url: 'https://www.expatica.com/it/',
			note: 'Expatica Italy covers housing, childcare, SSN registration, daily shopping, and family integration from the perspective of residents.',
			communitySource: true,
		},
		{
			label: 'InterNations Italy expat community',
			url: 'https://www.internations.org/italy-expats',
			note: 'InterNations hosts city-level groups and forums for Italy where residents share bureaucracy tips, neighbourhood impressions, and family-life experiences.',
			communitySource: true,
		},
		{
			label: 'r/italy community forum',
			url: 'https://www.reddit.com/r/italy/',
			note: 'Active Reddit community where locals and international residents discuss daily life, housing, healthcare, and family topics in Italy.',
			communitySource: true,
		},
		{
			label: 'Expats in Italy community forum',
			url: 'https://www.expatsinialy.net/',
			note: 'English-language forum for expats in Italy discussing residency, codice fiscale, childcare access, schools, and neighbourhood life.',
			communitySource: true,
		},
	],
};

const ukOfficialSources = {
	housingCosts: [
		{
			label: 'ONS UK house price index',
			url: 'https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/housepriceindex/latest',
			note: 'ONS publishes the UK house price index with regional and local authority breakdowns updated monthly.',
			verifiedAt: 'Current 2026 ONS portal',
		},
	],
	childcareCosts: [
		{
			label: 'GOV.UK free childcare if working',
			url: 'https://www.gov.uk/free-childcare-if-working',
			note: 'GOV.UK states the scheme covers children aged 9 months to 4 years and applications can be made once a child is 23 weeks old.',
			verifiedAt: 'Current 2026 GOV.UK guidance',
		},
	],
	healthcareAccess: [
		{
			label: 'NHS Find a GP service',
			url: 'https://www.nhs.uk/service-search/find-a-gp',
			note: 'NHS England provides the official GP finder for locating and registering with a local practice in England.',
			verifiedAt: 'Current 2026 NHS portal',
		},
	],
	basketCosts: [
		{
			label: 'ONS Consumer Price Inflation',
			url: 'https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/latest',
			note: 'ONS publishes monthly consumer price inflation covering food, childcare, transport, and household goods baskets.',
			verifiedAt: 'Current 2026 ONS portal',
		},
	],
	familyBenefits: [
		{
			label: 'GOV.UK Child Benefit',
			url: 'https://www.gov.uk/child-benefit/what-youll-get',
			note: 'Current GOV.UK guidance for Child Benefit, including the weekly rate for the eldest or only child and high-income clawback rules.',
			verifiedAt: 'Current 2026 GOV.UK guidance',
		},
		{
			label: 'GOV.UK Tax-Free Childcare scheme',
			url: 'https://www.gov.uk/tax-free-childcare',
			note: 'GOV.UK explains that eligible working parents can receive up to GBP2,000 per year per child through the Tax-Free Childcare account top-up scheme.',
			verifiedAt: 'Current 2026 GOV.UK guidance',
		},
	],
	communityVoices: [
		{
			label: 'Expatica UK — living and working guide',
			url: 'https://www.expatica.com/uk/',
			note: 'Expatica UK covers housing, NHS registration, childcare, Brexit implications, and daily family life from resident perspectives.',
			communitySource: true,
		},
		{
			label: 'InterNations United Kingdom expat community',
			url: 'https://www.internations.org/united-kingdom-expats',
			note: 'InterNations hosts UK city-level groups where residents share relocation experiences, neighbourhood impressions, and family-life insights.',
			communitySource: true,
		},
		{
			label: 'r/unitedkingdom community forum',
			url: 'https://www.reddit.com/r/unitedkingdom/',
			note: 'Active Reddit community for the UK covering housing, cost of living, family topics, and local perspectives.',
			communitySource: true,
		},
		{
			label: 'Just Landed UK relocation guide',
			url: 'https://www.justlanded.com/english/United-Kingdom',
			note: 'Community-sourced relocation guide for the UK covering visa routes, NHS, childcare, and neighbourhood comparisons.',
			communitySource: true,
		},
	],
};

const spainOfficialSources = {
	housingCosts: [
		{
			label: 'INE residential housing price index',
			url: 'https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736176127&menu=resultados&idp=1254735976607',
			note: 'INE publishes the Spanish Índice de Precios de Vivienda (IPV) and rental statistics for provinces and major cities.',
			verifiedAt: 'Current 2026 INE portal',
		},
	],
	childcareCosts: [
		{
			label: 'Ministerio de Educación escuelas infantiles guide',
			url: 'https://www.educacionyfp.gob.es/servicios-al-ciudadano/catalogo/familias/escolarizacion-primaria-y-secundaria/escuelas-infantiles.html',
			note: 'The Ministry of Education publishes the framework for state-funded escuelas infantiles (0-3 years) and enrollment process.',
			verifiedAt: 'Current 2026 MEFP portal',
		},
	],
	healthcareAccess: [
		{
			label: 'Ministerio de Sanidad SNS health centre finder',
			url: 'https://www.sanidad.gob.es/ciudadanos/prestacionesSanitarias/centrosSanitarios/home.htm',
			note: 'The Ministry of Health publishes SNS enrollment rights and the health centre finder for all Spanish autonomous communities.',
			verifiedAt: 'Current 2026 MSAN portal',
		},
	],
	familyBenefits: [
		{
			label: 'IMSERSO family and social protection services',
			url: 'https://imserso.es/',
			note: 'IMSERSO administers national social protection programs and publishes information on family support and social services.',
			verifiedAt: 'Current 2026 IMSERSO portal',
		},
		{
			label: 'Seguridad Social prestaciones familiares',
			url: 'https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/PrestacionesPensionesTrabajadores/10957',
			note: 'The Social Security publishes family benefit entitlements, including child birth payments and dependent child allowances.',
			verifiedAt: 'Current 2026 Seguridad Social portal',
		},
	],
	communityVoices: [
		{
			label: 'Expatica Spain — living and working guide',
			url: 'https://www.expatica.com/es/',
			note: 'Expatica Spain covers housing search, SNS registration, childcare options, and family integration from resident perspectives.',
			communitySource: true,
		},
		{
			label: 'InterNations Spain expat community',
			url: 'https://www.internations.org/spain-expats',
			note: 'InterNations hosts city-level groups and forums for Spain where residents share relocation experiences and family-life insights.',
			communitySource: true,
		},
		{
			label: 'r/spain community forum',
			url: 'https://www.reddit.com/r/spain/',
			note: 'Active Reddit community where locals and international residents discuss housing, healthcare, family life, and integration in Spain.',
			communitySource: true,
		},
		{
			label: 'Spain Expats community portal',
			url: 'https://www.spainexpats.com/',
			note: 'Community forum and relocation resource covering housing, NIE, healthcare, schools, and neighbourhood life across Spanish cities.',
			communitySource: true,
		},
	],
};

export const countryProfiles = {
	austria: {
		currencyCode: 'EUR',
		fxToEur: 1,
		buyerTaxes: 'Austria uses 3.5% transfer tax plus 1.1% land registry and legal/notary costs.',
		annualTax: 'Property tax is low; building charges and reserve funds matter more than the tax bill itself.',
		schoolStart: 'Formal school starts at 6.',
		schoolQuality:
			'Public schools are strong enough that private is usually optional unless you need bilingual continuity.',
		healthRegistration:
			'Public coverage onboarding is usually straightforward once residence and work status are in place.',
		healthWaits:
			'Primary and pediatric access are generally good by EU standards, with specialist waits still variable by provider.',
		privateCover: 'About EUR90-160/month for faster specialist access and private rooms.',
		childBenefit:
			'Familienbeihilfe starts at EUR138.40/month for ages 0-3, plus EUR70.90/month Kinderabsetzbetrag.',
		stateAid:
			'Familienbeihilfe and Kinderbetreuungsgeld are the main family levers; city-specific discounts matter less than the federal support frame.',
		alternativePedagogy:
			'Good Montessori, bilingual, and outdoor-learning options for a mid-size Austrian city.',
		publicVsPrivate:
			'Public schools are strong enough that private is usually about language or pedagogy, not rescue spending.',
		waterQuality: 'Tap water is excellent and safe; filters are usually optional rather than necessary.',
		personalTax: 'Roughly 28%-36% effective for middle-income families.',
		parentalLeave:
			'Austria offers strong family support with multiple Kinderbetreuungsgeld models and long leave duration.',
		digitalization: 'High.',
		healthcareScore: 8.4,
		childcareSystemScore: 7.8,
		healthcareCost: 130,
		groceriesFactor: 0.135,
		bufferFactor: 0.16,
		oneParentChildcareFactor: 0.22,
		oneParentChildcareBase: 90,
		bothWorkingChildcareFactor: 0.72,
		bothWorkingChildcareBase: 70,
		oneParentTransportMultiplier: 1.05,
		bothWorkingTransportMultiplier: 1.9,
		basketTier: 'high',
		auditSections: {
			housingCosts: 'mixed',
			childcareCosts: 'verified',
			basketCosts: 'mixed',
			healthcareAccess: 'modeled',
			mobilityCosts: 'mixed',
			familyBenefits: 'verified',
			budgetModel: 'mixed',
		},
		officialSources: austriaOfficialSources,
		nurseryTail:
			'Public and Land-level pricing still varies by provider and family circumstances, so this remains a market cross-check rather than a strict city tariff.',
	},
	germany: {
		currencyCode: 'EUR',
		fxToEur: 1,
		buyerTaxes: 'Transfer tax varies by Land, plus roughly 1.5%-2% in notary and land-registry costs.',
		annualTax: 'Grundsteuer and building charges typically matter more than the headline tax label alone.',
		schoolStart: 'Formal school starts at 6.',
		schoolQuality:
			'Public schools are solid, but catchment and language support still matter more than a citywide average.',
		healthRegistration:
			'You usually register smoothly once residence and insurance are in place, but the best-known pediatric practices can have closed lists.',
		healthWaits:
			'Routine care is stronger than in the UK or Ireland, with the real friction often being doctor availability rather than hospital quality.',
		privateCover: 'About EUR80-150/month for supplemental cover.',
		childBenefit: 'Kindergeld is EUR259/month per child.',
		stateAid:
			'Kindergeld and Elterngeld are the core family levers, while nursery pricing still depends heavily on municipality and provider.',
		alternativePedagogy:
			'Good bilingual, Montessori, and parent-led alternatives for a large German city.',
		publicVsPrivate:
			'Public schools are workable, but catchment and bilingual preferences still drive some private spending.',
		waterQuality: 'Tap water is safe and generally good; filtration is usually taste-led rather than necessary.',
		personalTax: 'Roughly 32%-40% effective for middle-income families.',
		parentalLeave:
			'Germany remains strong on parental leave: Elterngeld usually covers 12 plus 2 shared months at partial income replacement.',
		digitalization: 'Medium-low to medium.',
		healthcareScore: 8.2,
		childcareSystemScore: 7.4,
		healthcareCost: 140,
		groceriesFactor: 0.135,
		bufferFactor: 0.15,
		oneParentChildcareFactor: 0.2,
		oneParentChildcareBase: 100,
		bothWorkingChildcareFactor: 0.68,
		bothWorkingChildcareBase: 90,
		oneParentTransportMultiplier: 1,
		bothWorkingTransportMultiplier: 1.9,
		basketTier: 'high',
		auditSections: {
			housingCosts: 'mixed',
			childcareCosts: 'verified',
			basketCosts: 'mixed',
			healthcareAccess: 'modeled',
			mobilityCosts: 'verified',
			familyBenefits: 'verified',
			budgetModel: 'mixed',
		},
		officialSources: germanyOfficialSources,
		nurseryTail:
			'Public and municipal pricing still varies by provider and hours booked, so this remains a market cross-check rather than a city tariff.',
	},
	italy: {
		currencyCode: 'EUR',
		fxToEur: 1,
		buyerTaxes: 'First-home resale purchases usually use 2% of cadastral value plus fixed mortgage and cadastral taxes.',
		annualTax: 'Primary-home IMU is usually exempt, with TARI and condo charges still payable.',
		schoolStart: 'Formal school starts at 6.',
		schoolQuality:
			'Public schools are solid and private is mostly about language continuity, not escaping a weak baseline.',
		healthRegistration:
			'The SSN remains the main public-health path once residence paperwork is in place.',
		healthWaits:
			'Routine public waits are still an Italian-system reality, but hospital quality is often better than the city size suggests.',
		privateCover: 'About EUR90-160/month, or many families top up with pay-per-visit private care.',
		childBenefit:
			'Assegno Unico is national and ISEE-based; these cities do not add a flat local baby allowance in the current strict layer.',
		stateAid:
			'Assegno Unico and Bonus Nido are the main financial levers rather than a flat municipal sticker price.',
		alternativePedagogy:
			'Montessori and bilingual options exist, but the mainstream public path remains the core system.',
		publicVsPrivate:
			'Public is the default and private usually buys language continuity or schedule preference rather than rescue spending.',
		waterQuality: 'Tap water is generally safe but often hard; filters are common for taste and limescale rather than necessity.',
		personalTax: 'Roughly 32%-38% effective for middle-income families.',
		parentalLeave:
			'Italy offers strong maternity protection and then thinner income replacement on later parental leave than Austria or Germany.',
		digitalization: 'Medium.',
		healthcareScore: 7.9,
		childcareSystemScore: 7.1,
		healthcareCost: 120,
		groceriesFactor: 0.13,
		bufferFactor: 0.14,
		oneParentChildcareFactor: 0.24,
		oneParentChildcareBase: 110,
		bothWorkingChildcareFactor: 0.72,
		bothWorkingChildcareBase: 60,
		oneParentTransportMultiplier: 1,
		bothWorkingTransportMultiplier: 1.85,
		basketTier: 'medium',
		auditSections: {
			housingCosts: 'verified',
			childcareCosts: 'verified',
			basketCosts: 'mixed',
			healthcareAccess: 'modeled',
			mobilityCosts: 'modeled',
			familyBenefits: 'verified',
			budgetModel: 'mixed',
		},
		officialSources: italyOfficialSources,
		nurseryTail:
			'Municipal and convenzionato fees still vary by ISEE and provider, so this stays a market cross-check in the expansion wave.',
	},
	uk: {
		currencyCode: 'GBP',
		fxToEur: gbpToEur,
		buyerTaxes: 'Stamp duty varies by price and buyer status, with legal, survey, and service-charge costs sitting on top.',
		annualTax: 'Council tax and any building service charges matter more than an annual property-tax frame in the continental sense.',
		schoolStart: 'Formal school starts at 5.',
		schoolQuality:
			'Public schools can be strong, but catchment choice matters more than a citywide average and private mainly buys predictability.',
		healthRegistration:
			'NHS registration is straightforward once you are resident, but GP list capacity and appointment speed vary sharply by neighborhood.',
		healthWaits:
			'Hospital quality is credible, but the real premium in UK cities is speed rather than basic clinical capability.',
		privateCover: 'About EUR129-222/month equivalent for faster specialist access and employer-style top-up cover.',
		childBenefit: 'Child Benefit is EUR31.65/week for the eldest or only child, subject to high-income clawback rules.',
		stateAid:
			'Working-family childcare support and tax-free childcare matter more than any flat municipal nursery tariff.',
		alternativePedagogy:
			'Good independent, Montessori, and forest-school options exist, but the main sorting mechanism is still catchment choice.',
		publicVsPrivate:
			'Public schools can be strong in the right catchments; private usually buys continuity and certainty, not a completely different citywide baseline.',
		waterQuality: 'Tap water is safe, though taste and hardness vary enough that filters are preference-led in many homes.',
		personalTax: 'Roughly 26%-34% effective for middle-income families before pension choices.',
		parentalLeave:
			'UK leave and childcare support are workable but materially less generous than Austria, Germany, or Romania for long infant-care periods.',
		digitalization: 'Medium-high.',
		healthcareScore: 7.2,
		childcareSystemScore: 6.1,
		healthcareCost: 170,
		groceriesFactor: 0.135,
		bufferFactor: 0.19,
		oneParentChildcareFactor: 0.14,
		oneParentChildcareBase: 140,
		bothWorkingChildcareFactor: 0.78,
		bothWorkingChildcareBase: 90,
		oneParentTransportMultiplier: 1.15,
		bothWorkingTransportMultiplier: 1.95,
		basketTier: 'premium',
		auditSections: {
			housingCosts: 'mixed',
			childcareCosts: 'mixed',
			basketCosts: 'mixed',
			healthcareAccess: 'modeled',
			mobilityCosts: 'mixed',
			familyBenefits: 'verified',
			budgetModel: 'mixed',
		},
		officialSources: ukOfficialSources,
		nurseryTail:
			'The headline market rate still sits above the national support scheme, so this remains a blended benchmark rather than a net city tariff.',
	},
	spain: {
		currencyCode: 'EUR',
		fxToEur: 1,
		buyerTaxes: 'Transfer-tax and legal costs vary by transaction type and buyer status, with notary and registry charges on top.',
		annualTax: 'IBI and community fees matter more than the annual tax line alone.',
		schoolStart: 'Formal school starts at 6.',
		schoolQuality:
			'Public and concertado routes are workable in the right districts, while private usually buys schedule or language flexibility.',
		healthRegistration:
			'Public coverage onboarding is generally straightforward once residencia and paperwork are in place.',
		healthWaits:
			'Routine public waits vary, but the baseline clinical quality is strong enough that many families only top up specific specialist needs.',
		privateCover: 'About EUR90-150/month for faster specialist access and extra flexibility.',
		childBenefit:
			'No dedicated Malaga flat family-cash anchor is attached in this build; the city remains service-led rather than grant-led in the current strict layer.',
		stateAid:
			'Value comes more from public healthcare, schooling, and lower daily transport burn than from a flat city baby allowance.',
		alternativePedagogy:
			'Montessori, bilingual, and concertado options exist, but the mainstream public path remains the core baseline.',
		publicVsPrivate:
			'Public and concertado schools are workable; private usually buys language continuity or logistics rather than basic quality rescue.',
		waterQuality: 'Tap water is safe, though some households still filter for taste depending on neighborhood and hardness.',
		personalTax: 'Roughly 25%-33% effective for middle-income families, depending on deductions.',
		parentalLeave: 'Spain-wide parental leave remains a clear family anchor: 16 weeks per parent at eligible pay.',
		digitalization: 'Medium-high.',
		healthcareScore: 7.9,
		childcareSystemScore: 6.8,
		healthcareCost: 110,
		groceriesFactor: 0.125,
		bufferFactor: 0.14,
		oneParentChildcareFactor: 0.2,
		oneParentChildcareBase: 100,
		bothWorkingChildcareFactor: 0.7,
		bothWorkingChildcareBase: 70,
		oneParentTransportMultiplier: 1,
		bothWorkingTransportMultiplier: 1.8,
		basketTier: 'medium',
		auditSections: {
			housingCosts: 'mixed',
			childcareCosts: 'verified',
			basketCosts: 'mixed',
			healthcareAccess: 'modeled',
			mobilityCosts: 'modeled',
			familyBenefits: 'verified',
			budgetModel: 'mixed',
		},
		officialSources: spainOfficialSources,
		nurseryTail:
			'Escuela infantil pricing still varies by provider and route, so this remains a market cross-check rather than a city tariff.',
	},
};

export const basketTiers = {
	medium: {
		formula: [15, 20],
		diapers: [9, 14],
		fruit: [2.1, 3.5],
		veg: [2.4, 4.1],
		meat: [10, 24],
		ecoCleaner: [3, 5],
		clothing: [8, 15],
		availability: 'Medium-high',
	},
	high: {
		formula: [16, 22],
		diapers: [10, 15],
		fruit: [2.4, 3.9],
		veg: [2.7, 4.5],
		meat: [12, 27],
		ecoCleaner: [3.2, 5.4],
		clothing: [9, 16],
		availability: 'High',
	},
	premium: {
		formula: [17, 24],
		diapers: [11, 17],
		fruit: [2.6, 4.2],
		veg: [2.9, 4.9],
		meat: [13, 29],
		ecoCleaner: [3.5, 5.8],
		clothing: [10, 18],
		availability: 'High',
	},
};