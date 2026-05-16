import { basketTiers, countryProfiles } from './profiles.js';
import {
	expansionWaveAuditOverridesByCity,
	expansionWaveOfficialSourcesByCity,
} from './officialSources.js';
import {
	average,
	buildPricePerSqm,
	clampScore,
	createBenchmarkSourceSet,
	formatBand,
	formatNumber,
	housingBuyScore,
	housingRentScore,
	preschoolScore,
	resolveAirScore,
	roundAmount,
	sumValues,
	toEur,
	toLocal,
	weightedAverage,
} from './shared.js';

const countryCity360Supplements = {
	austria: {
		euRegistration:
			'Meldezettel registration at the Magistratisches Bezirksamt — signed by the landlord, filed in person or via Digitales Amt. Follow with ÖGK health-insurance registration once employed or self-employed. Bureaucracy: 5/10 — well-organised, often bilingual at key offices.',
		localIdTaxNumber:
			'No separate Steuer-ID application needed. The Finanzamt issues a Steuernummer after employment or self-employment registration. Self-employment requires direct Finanzamt application plus GISA trade registration if applicable.',
		adminBureaucracy:
			'5/10 — Austrian cities are among the best-administered in the roster. The Meldezettel chain is smoother and more digitally supported than in Italy or Spain.',
		itDiplomaRecognition:
			'IT and engineering degrees from EU institutions recognised automatically under Directive 2005/36/EC for unregulated tech professions. Certified German translation required for employment applications (EUR70-150). ENIC-NARIC Austria handles formal academic equivalence if needed.',
		psychologistRegulation:
			'Recognition through the BMSGPK. Psychotherapy is regulated under the Psychotherapiegesetz. Foreign EU qualifications require BMSGPK review, with a possible aptitude test or supervised-practice supplement. Processing: 6-18 months. C1 German practical standard for clinical work.',
		mentalHealthInfrastructure:
			'English-speaking therapists available in larger Austrian cities. Public mental health services cover acute needs; private-pay is the main route for regular sessions. Private sessions: EUR90-130 German-language, EUR110-160 English-language. ÖGK partial coverage possible for registered therapists.',
		euPetPassport:
			'Standard EU Pet Passport accepted. Required: microchip, valid rabies vaccination, 21-day wait. No titration test required for EU-to-EU movement. Register with the local Veterinäramt. Austrian cities are generally pet-tolerant; dogs allowed on public transit with a reduced fare.',
		petRentalAcceptance:
			'Difficulty: 5/10. Austrian tenancy law provides stronger tenant protections than Germany, but landlord no-pet preferences are common. Private market is more negotiable than Gemeindebau.',
		petTransitCompliance:
			'Dogs permitted on Austrian urban transit (U-Bahn, Straßenbahn, buses) with a reduced-fare child ticket. Dogs must be on a leash and muzzled on most networks. Carrier-based pets (cats, small animals) travel free. No size restrictions that would prohibit medium or large dogs, but muzzle rules apply on most operators.',
		urbanDogInfra:
			'Austrian cities maintain extensive Hundezone (off-leash) networks in public parks. Dogs permitted on public transit with a Halbticket. Café and terrace dog-welcome culture is strong by Central European standards.',
		vetCare:
			'Standard vet consultation EUR60-90. 24/7 emergency clinics available in city areas. Annual vaccination package EUR100-150. High veterinary quality across the country.',
		techEcosystem:
			'Austria has a growing tech ecosystem anchored in Vienna, with Salzburg and Graz as secondary hubs. AWS, Google, and strong pharma-tech and industrial automation sectors. Average gross salary for a Senior Cloud or Software Engineer: EUR55,000-75,000. English-only roles common at multinationals.',
		mentalHealthMarket:
			'Growing multilingual therapy demand in Austrian cities. English-speaking practice markets exist at city level. Per-session rates: EUR90-140 German-language, EUR110-160 English-language. Einzelunternehmen structure with ÖGK self-insurance. Long-term Kassenvertrag is valuable but competitive to obtain.',
		taxDualIncomeGross:
			'Austrian Lohnsteuer is individually assessed. On a combined household gross of EUR90,000-120,000, total household tax often runs EUR18,000-26,000 before family credits and Kinderabsetzbetrag.',
		taxAllowancesSingle:
			'Familienbeihilfe (EUR138.40/month per child up to age 3), Kinderabsetzbetrag (EUR70.90/month per child), and Alleinerzieherabsetzbetrag (EUR520/year for one child, increasing with additional children) materially reduce single-parent net liability.',
		taxAllowancesDual:
			'Both parents are individually entitled to Familienbeihilfe and Kinderabsetzbetrag. The Alleinerzieherabsetzbetrag is not available to dual-income households. Dual earners each claim work-related deductions separately.',
		effectiveTaxRateSingle:
			'Roughly 22%-29% all-in (Lohnsteuer plus social contributions around 18%) for a single income of EUR40,000-60,000 after family credits.',
		effectiveTaxRateDual:
			'Roughly 28%-36% combined effective for a dual household on EUR75,000-110,000, depending on income split and childcare deduction claims.',
		utilityNetworkStability:
			'Austrian power grid reliability is among the highest in Europe. Water supply quality is excellent city-wide. Fiber broadband reaches most urban family zones. District heating is widespread in larger cities and reduces heating cost volatility.',
		privateSchoolOptions:
			'Austria has state-approved Privatschulen and international schools. Confessional and Montessori private schools in larger cities charge EUR3,000-8,000/year. International schools: EUR10,000-20,000/year. Free Kindergarten (mandatory age-5-6 year) reduces early-years private spend for many families.',
		officialStatisticalSources:
			'Statistik Austria (statistik.at), city administration statistics portals, Numbeo benchmark, BMSGPK for health data, WKO (Austrian Chamber of Commerce) for employment data.',
		crowdsourcedEstimatesDisclaimer:
			'Family basket, utility, and service cost estimates supplement Statistik Austria and Numbeo benchmarks with local community verification. Individual figures vary by district, building vintage, and lifestyle.',
	},
	germany: {
		euRegistration:
			'Anmeldung at the Bürgeramt — book an appointment online (typically 1-4 weeks ahead), bring passport and Wohnungsgeberbestätigung signed by the landlord. Certificate issued at appointment. Enables bank account opening, health insurance, and tax registration. Bureaucracy: 6/10.',
		localIdTaxNumber:
			'Steuer-ID is mailed automatically to the registered address within 2-3 weeks of Anmeldung. Self-employment requires a separate Finanzamt Steuernummer registration.',
		adminBureaucracy:
			'6/10 — Structured and rule-consistent but appointment-scarce in larger cities. The Anmeldung → Krankenkasse → Finanzamt sequence is logical and predictable once understood.',
		itDiplomaRecognition:
			'IT and engineering degrees from EU institutions recognised automatically for unregulated tech roles. Certified German translation required for employment applications (EUR70-150). ANABIN database check covers most EU university qualifications. No board required for private-sector tech employment.',
		psychologistRegulation:
			'Landesprüfungsamt of the relevant German Land handles recognition. Post-PsychThG 2020 reform: Approbation or Erlaubnis required for psychotherapy practice. Foreign EU psychology degrees require formal application, certified translations, and potential aptitude test or supervised-practice supplement. Processing: 6-18 months. B2 minimum stated; C1 practical standard.',
		mentalHealthInfrastructure:
			'English-speaking therapists available in larger German cities. KV authorization enables public-insurance billing, but finding an approved therapist with capacity is a known bottleneck. Private cash-pay sessions: EUR80-130 German-language, EUR100-160 English-language.',
		euPetPassport:
			'Standard EU Pet Passport accepted. Required: microchip, rabies vaccination, 21-day wait. Register with the local Veterinäramt. Hundehaftpflichtversicherung (dog liability insurance) is legally required in most German Länder (EUR30-90/year).',
		petRentalAcceptance:
			'Difficulty: 6/10. German rental market often includes no-pet clauses. Tenant law is nuanced but landlords have meaningful leverage in practice. Pet permission clauses must be explicitly negotiated. Large dogs face more restriction.',
		petTransitCompliance:
			'Dogs permitted on German public transit (S-Bahn, U-Bahn, buses) with a child fare (typically EUR1.50-2.50 per journey). Dogs must be on a leash and usually muzzled. Cats and small animals in closed carriers travel free. Operated by each regional VVS/HVV/MVV authority — rules are broadly consistent across the roster German cities.',
		urbanDogInfra:
			'German cities maintain off-leash dog areas in public parks. Dogs permitted on public transit with a child-fare ticket. Dog waste culture is taken seriously; owners are expected to carry bags and comply with park rules.',
		vetCare:
			'Standard vet consultation EUR50-80. 24/7 emergency clinics available in city areas. Annual vaccination package EUR90-140. High veterinary quality. Mandatory Hundehaftpflicht adds a small annual cost.',
		techEcosystem:
			'Germany has one of Europe\'s strongest tech markets. Berlin, Munich, Hamburg, Frankfurt, and regional hubs offer deep employer diversity. Average gross salary for a Senior Cloud or Software Engineer: EUR65,000-90,000. English-only roles common at multinationals; German valued for advancement and local integration.',
		mentalHealthMarket:
			'Growing demand for English-speaking therapy in German cities. KV-billing is the gold standard but hard to access for new arrivals. Cash-pay private practice is more accessible. Freiberufler structure for psychotherapists. Per-session rates: EUR90-130 German-language, EUR100-160 English-language.',
		taxDualIncomeGross:
			'German Einkommensteuer is individually assessed. On a combined gross of EUR90,000-120,000 split between two earners, total Lohnsteuer often runs EUR20,000-30,000 before family credits.',
		taxAllowancesSingle:
			'Kindergeld (EUR259/month per child since Jan 2025), Kinderfreibetrag (EUR9,312/child annually if beneficial), Entlastungsbetrag für Alleinerziehende (EUR4,260/year), and childcare expense deductions up to EUR4,000/year reduce single-parent net liability.',
		taxAllowancesDual:
			'Both parents can claim Kindergeld or Kinderfreibetrag in split. Dual-income households apply childcare cost deductions individually. Elterngeld income is tax-free. Individual income assessment keeps marginal rates lower than a joint-filing system would imply.',
		effectiveTaxRateSingle:
			'Roughly 30%-38% all-in (Einkommensteuer plus social contributions around 20%) for a single income of EUR45,000-65,000 after standard family deductions.',
		effectiveTaxRateDual:
			'Roughly 34%-42% combined effective for a dual household on EUR85,000-130,000, depending on Steuerklasse choice, income split, and deduction profile.',
		utilityNetworkStability:
			'German power grid reliability is high. Water quality is excellent in all German roster cities. Fiber (FTTH) coverage varies by city — larger cities lead, while some outer districts still rely on cable or VDSL. District heating availability differs by city.',
		privateSchoolOptions:
			'Germany has Ersatzschulen (state-approved private equivalents) including Waldorf, Montessori, and bilingual options. Fees often run EUR200-800/month. International schools serving expat families charge EUR8,000-22,000/year.',
		officialStatisticalSources:
			'Destatis (destatis.de), Statistisches Landesamt of the relevant Land, Numbeo benchmark, Bundesagentur für Arbeit for employment data, Bundeszentralamt für Steuern for tax data.',
		crowdsourcedEstimatesDisclaimer:
			'Basket, utility, and service cost estimates supplement Destatis and Numbeo benchmarks with local community input. Individual results vary by city district, building vintage, and household spending profile.',
	},
	italy: {
		euRegistration:
			'Iscrizione Anagrafica at the Comune — EU passport, accommodation proof, income proof required. Processing: 7-30 working days. Bureaucracy: 7/10 — thorough and slow; appointment availability and certified-translation requirements add friction.',
		localIdTaxNumber:
			'Codice Fiscale issued free at the Agenzia delle Entrate — typically same-day at the local office. Required before renting, banking, or employment.',
		adminBureaucracy:
			'7/10 — Italian public administration requires patience, certified translations, and multiple office visits. Smaller cities are noticeably more manageable than Milan or Bologna at peak.',
		itDiplomaRecognition:
			'EU degrees recognised automatically for unregulated tech professions under Directive 2005/36/EC. Certified Italian translation required for employment applications (EUR60-150). CIMEA equivalence declaration useful for corporate or academic applications.',
		psychologistRegulation:
			'Ordine degli Psicologi of the relevant region is the registration authority. Foreign EU degrees require Ministero della Salute recognition under the Riconoscimento Automatico pathway (6-18 months). C2 Italian practical standard for clinical work; possible aptitude test or supervised hours for partial-recognition cases.',
		mentalHealthInfrastructure:
			'English-speaking therapists exist in larger Italian cities at a premium. Public USL referral system covers therapy for serious conditions with waits of 2-6 months for non-urgent cases. Private sessions: EUR60-90 Italian-language, EUR80-140 English-language.',
		euPetPassport:
			'Standard EU Pet Passport accepted. Required: microchip, rabies vaccination, 21-day wait. Register with the ASL within 30 days of Italian residency.',
		petRentalAcceptance:
			'Difficulty: 6/10. Italian rental market has moderate-to-low pet tolerance overall. Specific pet clauses must be negotiated and written into contracts. Cat-friendly apartments are easier to find than dog-friendly ones.',
		petTransitCompliance:
			'Dogs under 10 kg in a carrier travel free on most Italian public transit. Dogs over 10 kg are generally not permitted on buses and metro, except for guide or assistance dogs. On regional and intercity trains (Trenitalia, Italo), dogs of all sizes are allowed with a half-price supplementary ticket. Local city bus rules vary and are operator-specific.',
		urbanDogInfra:
			'Aree cani (off-leash dog areas) exist in most Italian cities. Dogs not permitted on most public transit unless in carriers under 10 kg. Restaurant terrace culture is seasonally dog-welcoming.',
		vetCare:
			'Standard vet consultation EUR35-65. 24/7 emergency clinics available in cities. Annual vaccination package EUR70-130. Quality varies; university-linked teaching hospitals provide excellent care.',
		techEcosystem:
			'Italy\'s tech market is Milan-led, with secondary hubs in Rome, Bologna, and Turin. International companies and growing Italian startups create demand. Average net salary for a Senior Cloud or Software Engineer: EUR28,000-55,000 depending on city and employer. Italian language integration is important for most local employers.',
		mentalHealthMarket:
			'Growing private therapy demand in Italian cities. Libero professionista with Partita IVA under Regime Forfettario is the standard structure. Per-session rates: EUR60-90 Italian-language, EUR80-130 English-language. University and international community populations drive English-language demand in larger cities.',
		taxDualIncomeGross:
			'Italian IRPEF is individually assessed. On a combined household gross of EUR65,000-80,000 split between two earners, total IRPEF often runs EUR14,000-20,000 before family credits.',
		taxAllowancesSingle:
			'Assegno Unico (EUR57-175/month per child depending on ISEE), detrazioni per carichi di famiglia, and single-parent deductions reduce the effective tax burden. ISEE-linked Bonus Nido (up to EUR3,000/year) further reduces childcare costs.',
		taxAllowancesDual:
			'Both partners apply individual detrazioni. Assegno Unico applies regardless of work status. ISEE determines the size of means-tested benefits — dual-income positioning matters for the subsidy outcome.',
		effectiveTaxRateSingle:
			'Roughly 32%-38% all-in (IRPEF plus INPS contributions around 9-10%) for a single income of EUR35,000-55,000 after standard deductions.',
		effectiveTaxRateDual:
			'Roughly 34%-40% combined effective for a dual-income household on EUR60,000-90,000 gross, depending on ISEE positioning and subsidy access.',
		utilityNetworkStability:
			'Italian power grid is generally reliable in northern and central Italy, with occasional summer stress events in hot years. Fiber (FTTH) coverage is expanding but still uneven across older residential stock. Water supply is good in the north; scale filtration is commonly used for taste rather than safety.',
		privateSchoolOptions:
			'Italy has Scuole Paritarie (state-approved private schools) including Montessori and bilingual options, with fees typically EUR200-600/month. Full private and international schools: EUR6,000-20,000/year. Private kindergartens are common alternatives to the often-waitlisted public nidi.',
		officialStatisticalSources:
			'ISTAT (istat.it), Comune statistics portals, Numbeo benchmark, Agenzia delle Entrate for tax data, Ministero della Salute for health metrics.',
		crowdsourcedEstimatesDisclaimer:
			'Basket, utility, and service estimates supplement ISTAT and Numbeo benchmarks. Individual figures vary significantly by city, district, building vintage, and lifestyle.',
	},
	spain: {
		euRegistration:
			'Certificado de Registro de Ciudadano de la Unión at the National Police station. Required: EU passport, Padrón Municipal registration, proof of employment, insurance, or sufficient funds. Certificate issued same day at appointment. Bureaucracy: 5/10 in smaller cities, 6/10 in larger metros.',
		localIdTaxNumber:
			'NIE (Número de Identidad de Extranjero) at the National Police or via employer. Required before formal employment, renting, and banking.',
		adminBureaucracy:
			'5/10 — Spain\'s administration varies by city size. Smaller cities are considerably more manageable than Madrid or Barcelona. The NIE and EU registration steps require dedicated time but are not unreasonably complex.',
		itDiplomaRecognition:
			'IT and engineering degrees from EU institutions recognised automatically under Directive 2005/36/EC for unregulated tech professions. Certified Spanish translation required (EUR60-120). No board required for private-sector tech employment.',
		psychologistRegulation:
			'Colegio Oficial de Psicólogos of the relevant region is the registration authority. Romanian EU psychology degrees require homologación through the Spanish Ministry of Universities (6-18 months). C1 Spanish required for clinical practice.',
		mentalHealthInfrastructure:
			'English-speaking therapists available in larger Spanish cities at a premium. Public health system covers basic mental health through GP referral but specialist waits are 2-4 months. Private sessions: EUR55-95 Spanish-language, EUR80-130 English-language.',
		euPetPassport:
			'Standard EU Pet Passport fully accepted in Spain. Required: microchip, rabies vaccination, 21-day post-first-vaccination wait. No titration test required for EU movement.',
		petRentalAcceptance:
			'Difficulty: 4/10. Spain has a moderately pet-tolerant rental market compared to Germany or Italy. Many family apartments accept small to medium dogs, though large dog acceptance varies. A pet deposit of one extra month is common.',
		petTransitCompliance:
			'Rules vary by city operator. In Málaga (EMT), dogs under 10 kg in a carrier are permitted; larger dogs generally excluded from buses. On Renfe intercity and regional trains, dogs under 10 kg in carriers travel free; larger dogs (up to 40 kg) are allowed with a full second-class ticket. Metro rules are typically carrier-only for cats and very small dogs. Guide and assistance dogs are always permitted.',
		urbanDogInfra:
			'Spanish cities maintain dedicated off-leash dog areas (pipicanes) and parks. Dogs permitted on some bus routes when muzzled and leashed. Outdoor dining culture is generally dog-tolerant.',
		vetCare:
			'Standard vet consultation EUR35-65. 24/7 emergency vet availability varies by city size. Annual vaccination package EUR75-130. Quality is solid across most Spanish cities.',
		techEcosystem:
			'Spain\'s tech market is Barcelona and Madrid led, with secondary hubs emerging. For smaller Spanish cities, remote work is the primary tech employment path. Average net salary for a remote senior engineer: EUR28,000-48,000. English-only workplaces mainly at multinationals.',
		mentalHealthMarket:
			'Private therapy in Spanish cities is primarily Spanish-language. English-language therapy available in larger cities. Operating as autónomo is straightforward. Monthly social security: EUR230-290 (reduced rate for first two years). Per-session rates: EUR55-95 Spanish-language, EUR80-130 English-language.',
		taxDualIncomeGross:
			'Spanish IRPF is individually assessed. On a combined household gross of EUR65,000-85,000 split between two earners, total IRPF typically runs EUR13,000-18,000 before family credits.',
		taxAllowancesSingle:
			'Key single-parent allowances: mínimo familiar (EUR2,400-4,500 per child increasing for subsequent children), deducción por maternidad (up to EUR1,200/year), and applicable regional Basque or Andalucía deductions.',
		taxAllowancesDual:
			'Both partners apply individual mínimo personal allowances plus shared mínimo familiar. Childcare deduction on nursery costs up to EUR1,000/year. Regional supplements exist in some autonomías.',
		effectiveTaxRateSingle:
			'Roughly 24%-31% all-in (IRPF plus social contributions around 6%) for a single income of EUR38,000-55,000 after standard family deductions.',
		effectiveTaxRateDual:
			'Roughly 25%-33% combined effective for a dual household on EUR60,000-80,000 gross, with individual income assessment reducing marginal exposure.',
		utilityNetworkStability:
			'Spanish power grid (REE) is reliable. Fiber (FTTH) coverage is among the best in Europe nationally; most city residential areas have access. Water supply is generally good in northern cities; southern cities can face seasonal pressure in dry years.',
		privateSchoolOptions:
			'Spain has concertado schools (state-funded private, often Catholic-affiliated) with fees typically EUR50-200/month. Fully private schools: EUR4,000-12,000/year. International schools in larger cities: EUR10,000-20,000/year. Bilingual options growing across both categories.',
		officialStatisticalSources:
			'INE (ine.es), Eustat for Basque-region data, Numbeo benchmark, Ministerio de Hacienda for national tax data, regional statistics institutes (IECA for Andalucía).',
		crowdsourcedEstimatesDisclaimer:
			'Basket, utility, and service estimates supplement INE and Numbeo benchmarks with local community input. Regional data from Eustat (Basque) and IECA (Andalucía) used where available. Individual results vary by district and lifestyle.',
	},
	uk: {
		euRegistration:
			'Post-Brexit, EU citizens need Settled or Pre-Settled Status via the EU Settlement Scheme (EUSS) if they arrived before 1 Jan 2021. New EU arrivals now require a Skilled Worker Visa or other visa route via UKVI. Bureaucracy: 7/10 — the post-Brexit immigration system adds significant complexity for EU citizens without pre-existing settled status.',
		localIdTaxNumber:
			'National Insurance (NI) number required for employment and tax in the UK. Apply online via GOV.UK after arrival. Processing: 2-6 weeks. Self-employment requires HMRC registration as a sole trader or limited company.',
		adminBureaucracy:
			'6/10 — GOV.UK digital public services are well-designed, but the post-Brexit immigration layer adds significant complexity for EU citizens. NHS registration and NI number applications are straightforward once immigration status is resolved.',
		itDiplomaRecognition:
			'Post-Brexit, EU degrees are no longer automatically recognised in the UK under EU rules. Most UK tech employers accept EU degrees on a practical basis, but the UK ENIC equivalency check (approx. EUR234) may be needed for regulated employers. For most unregulated tech employment, the degree is accepted at employer discretion.',
		psychologistRegulation:
			'The Health and Care Professions Council (HCPC) registers practitioner psychologists; UKCP or BACP registers psychotherapists. Post-Brexit EU qualifications require formal HCPC application with a character and competency assessment. Language: English C1 standard. Processing: 3-12 months.',
		mentalHealthInfrastructure:
			'English is the primary and natural therapy language. NHS IAPT (Improving Access to Psychological Therapies) provides free or low-cost CBT for common mental health conditions, but waiting lists are significant. Private pay sessions: EUR82-152. UK cities have the deepest English-language therapy market in the roster.',
		euPetPassport:
			'Post-Brexit, EU Pet Passports are not valid for entry into Great Britain. An AHC (Animal Health Certificate) issued within 10 days of travel is now required, plus tapeworm treatment for dogs within 24-120 hours of arrival. This applies even for EU-passported pets.',
		petRentalAcceptance:
			'Difficulty: 6/10. UK rental market has significant no-pet clauses by default, though reform legislation aims to limit blanket bans. Specific pet permission is needed. Large dogs face more restrictions.',
		petTransitCompliance:
			'Dogs are permitted on most UK bus and rail services and the London Overground at the operator\'s discretion and generally free of charge. Dogs are not permitted on the London Underground unless in a carrier or bag. Edinburgh Lothian Buses allows well-behaved dogs free. Bristol First Bus allows dogs at driver discretion. Guide and assistance dogs are always permitted on all services.',
		urbanDogInfra:
			'UK cities have good off-lead dog parks, green spaces, and walking infrastructure. Dogs generally not permitted on the London Underground unless in carriers, but surface rail and some bus routes allow dogs. Pub and café dog-welcome culture is strong in England.',
		vetCare:
			'Standard vet consultation EUR47-94. 24/7 emergency vet clinics available in city areas. Annual vaccination package EUR94-164. Quality is high across the UK.',
		techEcosystem:
			'UK has a strong tech market, with London as the primary hub and Bristol and Edinburgh as significant secondary cities. Average gross salary for a Senior Cloud or Software Engineer: EUR70,000-105,000 in London, EUR58,000-88,000 in regional cities. English-only workplace is standard.',
		mentalHealthMarket:
			'UK has the most developed English-language therapy market in the roster. HCPC or BACP registration is standard for private practice. Sole trader setup is simple. IAPT, EAP, and private pay create multiple income streams. Per-session rates: EUR82-152 standard, EUR94-176 premium.',
		taxDualIncomeGross:
			'UK income tax is individually assessed. On a combined household gross of EUR82,000-105,000 split between two earners, total income tax often runs EUR13,000-19,000 before child-related credits.',
		taxAllowancesSingle:
			'Child Benefit (EUR29.95/week for the first child, EUR19.83/week for subsequent children), free childcare hours (15-30h/week for 3-4 year olds depending on work status), and Single Person Council Tax discount (25%) are the main single-parent levers.',
		taxAllowancesDual:
			'Child Benefit applies (subject to high-income clawback above EUR70,200). Tax-Free Childcare account gives a 20% top-up (up to EUR585/quarter per child). Free childcare hours (up to 30h/week for working parents of 3-4 year olds) benefit dual-income households.',
		effectiveTaxRateSingle:
			'Roughly 27%-35% all-in (income tax plus NICs at 8%) for a single income of EUR47,000-70,000 after personal allowance.',
		effectiveTaxRateDual:
			'Roughly 29%-38% combined effective for a dual household on EUR82,000-117,000, depending on income split and NICs class.',
		utilityNetworkStability:
			'UK power grid reliability is generally good with rare outages. Water supply is reliable but notably hard in many regions. Superfast broadband (fiber) coverage varies by location — Bristol and Edinburgh have strong coverage in most family districts.',
		privateSchoolOptions:
			'UK independent schools range from prep schools (EUR12,000-29,000/year) to secondary independents (EUR18,000-41,000/year). Both Bristol and Edinburgh have strong independent school markets. State grammar schools (selective intake) are an option in some areas.',
		officialStatisticalSources:
			'ONS (ons.gov.uk), GOV.UK for tax and benefit data, Numbeo benchmark, NHS for healthcare metrics, Registers of Scotland for property data in Edinburgh.',
		crowdsourcedEstimatesDisclaimer:
			'Cost of living estimates supplement ONS and Numbeo benchmarks with current local community data. Post-Brexit cost environment reflected where identifiable. GBP figures shown at current exchange rates.',
	},
};

const combineSourceSections = (benchmarkSources, officialSources = {}) => ({
	housingCosts: [...(officialSources.housingCosts ?? []), ...benchmarkSources.housingCosts],
	childcareCosts: [...(officialSources.childcareCosts ?? []), ...benchmarkSources.childcareCosts],
	basketCosts: [...(officialSources.basketCosts ?? []), ...benchmarkSources.basketCosts],
	healthcareAccess: [...(officialSources.healthcareAccess ?? [])],
	mobilityCosts: [...(officialSources.mobilityCosts ?? []), ...benchmarkSources.mobilityCosts],
	familyBenefits: [...(officialSources.familyBenefits ?? [])],
	communityVoices: [...(officialSources.communityVoices ?? [])],
});

const mergeOfficialSources = (...sourceGroups) =>
	sourceGroups.reduce((merged, current) => {
		if (!current) {
			return merged;
		}

		for (const [section, entries] of Object.entries(current)) {
			merged[section] = [...(merged[section] ?? []), ...entries];
		}

		return merged;
	}, {});

const buildBudgetComponents = ({ profile, rent2EstimateEur, familyCostEur, preschoolEur, monthlyPassEur }) => {
	const housingBase = roundAmount(rent2EstimateEur * 1.03);
	const groceriesBase = roundAmount(familyCostEur * profile.groceriesFactor);
	const oneParent = {
		housing: housingBase,
		childcare: roundAmount(preschoolEur * profile.oneParentChildcareFactor + profile.oneParentChildcareBase),
		groceries: groceriesBase,
		transport: roundAmount(monthlyPassEur * profile.oneParentTransportMultiplier),
		healthcare: profile.healthcareCost,
		utilitiesAndBuffer: roundAmount(familyCostEur * profile.bufferFactor),
	};
	const bothWorking = {
		housing: housingBase,
		childcare: roundAmount(preschoolEur * profile.bothWorkingChildcareFactor + profile.bothWorkingChildcareBase),
		groceries: roundAmount(groceriesBase * 1.08),
		transport: roundAmount(monthlyPassEur * profile.bothWorkingTransportMultiplier),
		healthcare: profile.healthcareCost + 10,
		utilitiesAndBuffer: roundAmount(familyCostEur * (profile.bufferFactor - 0.01)),
	};

	const twoKids = {
		housing: roundAmount(housingBase * 1.18),
		childcare: roundAmount(bothWorking.childcare * 1.70),
		groceries: roundAmount(bothWorking.groceries * 1.20),
		transport: bothWorking.transport,
		healthcare: roundAmount(bothWorking.healthcare * 1.20),
		utilitiesAndBuffer: roundAmount(bothWorking.utilitiesAndBuffer * 1.15),
	};

	const oneIncTwoKids = {
		housing: roundAmount(housingBase * 1.18),
		childcare: roundAmount(oneParent.childcare * 1.40),
		groceries: roundAmount(oneParent.groceries * 1.20),
		transport: oneParent.transport,
		healthcare: roundAmount(oneParent.healthcare * 1.20),
		utilitiesAndBuffer: roundAmount(oneParent.utilitiesAndBuffer * 1.12),
	};

	return { oneParent, bothWorking, twoKids, oneIncTwoKids };
};

const buildBudgetBand = (components, minFactor, comfortableFactor) => {
	const midpoint = sumValues(Object.values(components));

	return {
		min: roundAmount(midpoint * minFactor),
		midpoint,
		comfortable: roundAmount(midpoint * comfortableFactor),
	};
};

const AIR_SOURCE_PATTERN = /air|aria|luft|pm2(?:\.|,)?5|pm10|ozon|schadstoff|inquin/i;

const findAirMonitoringSource = (sources = []) =>
	sources.find((source) =>
		AIR_SOURCE_PATTERN.test(
			`${source.label ?? ''} ${source.note ?? ''} ${source.snapshotValue ?? ''}`,
		),
	);

const buildEcoFactors = (config, mobilitySources = []) => {
	const airSource = findAirMonitoringSource(mobilitySources);

	if (Number.isFinite(config.pollution.pm25)) {
		const pollutionSuffix = Number.isFinite(config.pollution.pollutionIndex)
			? `, with the wider pollution index at ${config.pollution.pollutionIndex}`
			: '';
		return `Current city air benchmark uses PM2.5 ${config.pollution.pm25}${pollutionSuffix}.`;
	}

	if (Number.isFinite(config.pollution.airQualityIndex)) {
		const officialAirNote = airSource?.snapshotValue
			? ` Official monitoring note: ${airSource.snapshotValue}`
			: airSource?.note
				? ` Official monitoring remains available through ${airSource.label}.`
				: ' A direct PM2.5 city capture was not available in this expansion wave.';
		const pollutionSuffix = Number.isFinite(config.pollution.pollutionIndex)
			? `, with pollution index ${config.pollution.pollutionIndex}`
			: '';

		return `Current city air-quality index is ${config.pollution.airQualityIndex}${pollutionSuffix}.${officialAirNote}`;
	}

	if (airSource?.snapshotValue) {
		return airSource.snapshotValue;
	}

	if (airSource?.note) {
		return airSource.note;
	}

	return 'A direct PM2.5 city capture was not available in this expansion wave, so air scoring stays comparative rather than tied to one stored city reading.';
};

const buildDiningCopy = (config, profile) => {
	const householdBase = toEur(config.benchmark.familyOfFour, profile.fxToEur);
	const diningLow = roundAmount(householdBase * 0.021);
	const diningHigh = roundAmount(householdBase * 0.029);

	return `About EUR${formatNumber(diningLow)}-${formatNumber(diningHigh)} equivalent for a family meal with drinks.`;
};

const buildBasketMeta = (profile) => {
	const tier = basketTiers[profile.basketTier];

	return {
		formula: formatBand(tier.formula[0], tier.formula[1], 'EUR'),
		diapers: formatBand(tier.diapers[0], tier.diapers[1], 'EUR'),
		organicFruit: formatBand(tier.fruit[0], tier.fruit[1], 'EUR', 1, '/kg'),
		organicVeg: formatBand(tier.veg[0], tier.veg[1], 'EUR', 1, '/kg'),
		meat: formatBand(tier.meat[0], tier.meat[1], 'EUR', 0, '/kg'),
		ecoCleaner: formatBand(tier.ecoCleaner[0], tier.ecoCleaner[1], 'EUR', 1),
		organicClothing: formatBand(tier.clothing[0], tier.clothing[1], 'EUR'),
		availability: tier.availability,
	};
};

const createExpansionTrendSeries = ({ weightedScore, oneParentMidpoint, bothWorkingMidpoint, pm25 }) => [
	{
		year: 2023,
		overallScore: clampScore(weightedScore + 0.18),
		oneParentBudget: roundAmount(oneParentMidpoint * 0.92),
		bothWorkingBudget: roundAmount(bothWorkingMidpoint * 0.92),
		pm25: Number.isFinite(pm25) ? pm25 + 1 : null,
	},
	{
		year: 2024,
		overallScore: clampScore(weightedScore + 0.11),
		oneParentBudget: roundAmount(oneParentMidpoint * 0.95),
		bothWorkingBudget: roundAmount(bothWorkingMidpoint * 0.95),
		pm25: Number.isFinite(pm25) ? pm25 + 1 : null,
	},
	{
		year: 2025,
		overallScore: clampScore(weightedScore + 0.05),
		oneParentBudget: roundAmount(oneParentMidpoint * 0.98),
		bothWorkingBudget: roundAmount(bothWorkingMidpoint * 0.98),
		pm25: Number.isFinite(pm25) ? pm25 : null,
	},
	{
		year: 2026,
		overallScore: weightedScore,
		oneParentBudget: oneParentMidpoint,
		bothWorkingBudget: bothWorkingMidpoint,
		pm25: Number.isFinite(pm25) ? pm25 : null,
	},
];

export const buildExpansionWaveCity = (config) => {
	const profile = countryProfiles[config.profileKey];
	const fxToEur = profile.fxToEur;
	const familyCostEur = toEur(config.benchmark.familyOfFour, fxToEur);
	const preschoolEur = toEur(config.benchmark.preschool, fxToEur);
	const monthlyPassEur = toEur(config.benchmark.monthlyPass, fxToEur);
	const rent3OutsideEur = toEur(config.benchmark.rent3Outside, fxToEur);
	const buyOutsideEur = toEur(config.benchmark.buyOutside, fxToEur);
	const buyCentreEur = toEur(config.benchmark.buyCentre, fxToEur);
	const rent2EstimateEur = rent3OutsideEur * 0.82;
	const budgetComponents = buildBudgetComponents({
		profile,
		rent2EstimateEur,
		familyCostEur,
		preschoolEur,
		monthlyPassEur,
	});
	const budgetBands = {
		oneParent: buildBudgetBand(budgetComponents.oneParent, 0.87, 1.18),
		bothWorking: buildBudgetBand(budgetComponents.bothWorking, 0.88, 1.19),
		twoKids: buildBudgetBand(budgetComponents.twoKids, 0.87, 1.20),
		oneIncTwoKids: buildBudgetBand(budgetComponents.oneIncTwoKids, 0.87, 1.20),
	};
	const airScore = resolveAirScore(config);
	const housingScore = clampScore(average([housingRentScore(rent2EstimateEur), housingBuyScore(buyOutsideEur)]));
	const environmentScore = clampScore(average([airScore, config.parkScore / 10, config.climateBase]));
	const childcareScore = clampScore(average([preschoolScore(preschoolEur), profile.childcareSystemScore, config.climateBase]));
	const safetyScore = clampScore((config.safety.safetyIndex ?? 60) / 10);
	const healthcareScore = clampScore(profile.healthcareScore);
	const scores = {
		housing: housingScore,
		environment: environmentScore,
		childcare: childcareScore,
		safety: safetyScore,
		healthcare: healthcareScore,
	};
	const weighted = weightedAverage(scores);
	const rentLowEur = roundAmount(rent2EstimateEur * 0.92);
	const rentHighEur = roundAmount(rent2EstimateEur * 1.08);
	const purchaseMinEur = roundAmount(buyOutsideEur * 75);
	const purchaseMaxEur = roundAmount(buyCentreEur * 90);
	const standardBasketEur = familyCostEur * 0.26;
	const cleanBasketEur = standardBasketEur * 1.22;
	const utilitiesEur = roundAmount(familyCostEur * 0.17);
	const oneWayEur = toEur(config.benchmark.oneWay, fxToEur);
	const benchmarkSources = createBenchmarkSourceSet({
		city: config.city,
		url: config.benchmark.url,
		observedAt: config.benchmark.observedAt,
		familyOfFour: config.benchmark.familyOfFour,
		rent3Outside: config.benchmark.rent3Outside,
		buyCentre: config.benchmark.buyCentre,
		buyOutside: config.benchmark.buyOutside,
		preschool: config.benchmark.preschool,
		monthlyPass: config.benchmark.monthlyPass,
	});
	const sourceMeta = combineSourceSections(
		benchmarkSources,
		mergeOfficialSources(
			expansionWaveOfficialSourcesByCity[config.key],
			profile.officialSources,
			config.officialSources,
		),
	);
	const auditSections = {
		...profile.auditSections,
		...(expansionWaveAuditOverridesByCity[config.key] ?? {}),
		...(config.auditSections ?? {}),
	};
	const overallAudit = Object.values(auditSections).every((status) => status === 'modeled') ? 'modeled' : 'mixed';
	const city360 = {
		personality: config.personality,
		fittingIn: config.fittingIn,
		honestTruth: {
			good: config.good,
			bad: config.bad,
		},
		indoorQuality:
			'Quality depends heavily on building age and renovation quality; the best-insulated family stock still moves faster than the city average.',
		purchaseRange: `${formatBand(purchaseMinEur, purchaseMaxEur, 'EUR')} for 75-100 sqm.`,
		transactionCosts: profile.buyerTaxes,
		holdingCosts: profile.annualTax,
		mortgageRate: 'About 3%-5% annual in the current rate environment.',
		utilities: `${formatBand(roundAmount(utilitiesEur * 0.8), roundAmount(utilitiesEur * 1.15), 'EUR')} including utilities, internet, and phones.`,
		standardBasket: `${formatBand(roundAmount(standardBasketEur * 0.94), roundAmount(standardBasketEur * 1.06), 'EUR')} for a family of 3.`,
		cleanBasket: `${formatBand(roundAmount(cleanBasketEur * 0.95), roundAmount(cleanBasketEur * 1.05), 'EUR')} for an all-bio basket.`,
		waterQuality: profile.waterQuality,
		dining: buildDiningCopy(config, profile),
		stateAid: profile.stateAid,
		alternativePedagogy: profile.alternativePedagogy,
		publicVsPrivate: profile.publicVsPrivate,
		higherEducation: config.higherEducation,
		hospitalQuality: config.hospitalQuality,
		safetyIndex: Number.isFinite(config.safety.crimeIndex)
			? `Crime stays more nuisance-led than violent, with a current safety read of about ${config.safety.safetyIndex}/100.`
			: 'Family safety reads better than the larger Italian metros, but the current strict city crime index was not reattached in this build.',
		ecoFactors: buildEcoFactors(config, sourceMeta.mobilityCosts),
		natureConnectivity: config.natureConnectivity,
		bikeLanes: `${config.bikeScore}/10 for bike and stroller comfort.`,
		traffic: config.traffic,
		fifteenMinute: config.fifteenMinute,
		jobMarket: config.jobMarket,
		personalTax: profile.personalTax,
		parentalLeave: profile.parentalLeave,
		digitalization: profile.digitalization,
		weather: config.weather,
		extremeWeather: config.extremeWeather,
		futureProofing: config.futureProofing,
		culture: config.culture,
		community: config.community,
		moveHereIf: config.moveHereIf,
		stayAwayIf: config.stayAwayIf,
		violentCrime: config.violentCrime,
		propertyCrime: config.propertyCrime,
		publicSpaceSafety: config.publicSpaceSafety,
		trafficSafety: config.trafficSafety,
		topographyWalkability: config.topographyWalkability,
		precipitationPatterns: config.precipitationPatterns,
		semiCentralAreas: config.semiCentralAreas,
		suburbanCostDifferential: config.suburbanCostDifferential,
		purchasingPowerIndex: config.purchasingPowerIndex,
		...(countryCity360Supplements[config.profileKey] ?? {}),
		...(config.city360Extras ?? {}),
	};
	const comparisonMeta = {
		reviewNote: `Initial live dossier built from ${config.benchmark.observedAt.toLowerCase()} benchmark data plus the current ${config.profileKey} policy anchors already attached in the audit layer.`,
		pros: config.good,
		cons: config.bad,
	};
	const auditMeta = {
		overall: overallAudit,
		lastReviewed: '2026-05-12',
		notes:
			'Initial live expansion dossier: current benchmark housing, basket, childcare, safety, and mobility inputs are attached where recovered, while the deeper municipal source packet and any missing local air capture still remain outside the strict layer.',
		sections: auditSections,
	};

	return {
		city: {
			key: config.key,
			city: config.city,
			country: config.country,
			tagline: config.tagline,
			scores: {
				...scores,
				weighted,
			},
			housing: {
				rentSafe2Bed: formatBand(rentLowEur, rentHighEur, 'EUR'),
				buyCentre: buildPricePerSqm(roundAmount(buyCentreEur), 'EUR'),
				buyOutside: buildPricePerSqm(roundAmount(buyOutsideEur), 'EUR'),
				buyerTaxes: profile.buyerTaxes,
				annualTax: profile.annualTax,
				areas: config.areas,
			},
			childcare: {
				nurseryNet: `Current market benchmark points to about EUR${formatNumber(roundAmount(preschoolEur))}/month for private full-day preschool. ${profile.nurseryTail}`,
				schoolStart: profile.schoolStart,
				schoolQuality: profile.schoolQuality,
			},
			basket: buildBasketMeta(profile),
			health: {
				registration: profile.healthRegistration,
				waits: profile.healthWaits,
				privateCover: profile.privateCover,
				hospitals: config.hospitals,
			},
			support: {
				childBenefit: profile.childBenefit,
				safety: Number.isFinite(config.safety.crimeIndex)
					? `Safety index ${config.safety.safetyIndex}; day-to-day violent risk stays lower than the larger rougher metros.`
					: `Modeled family safety read about ${config.safety.safetyIndex}/100 until a clean city crime index is reattached.`,
			},
			mobility: {
				pass:
					config.profileKey === 'germany'
						? 'Deutschlandticket EUR63/month'
						: `EUR${formatNumber(roundAmount(monthlyPassEur))}/month benchmark monthly pass`,
				oneWay: `EUR${Number(oneWayEur).toFixed(2)} benchmark one-way fare`,
				carNeed: config.carNeed,
				bikeLanes: config.bikeNarrative,
				pm25: Number.isFinite(config.pollution.pm25) ? config.pollution.pm25 : null,
				airQualityIndex: Number.isFinite(config.pollution.airQualityIndex) ? config.pollution.airQualityIndex : null,
				pollutionIndex: Number.isFinite(config.pollution.pollutionIndex) ? config.pollution.pollutionIndex : null,
				parkScore: config.parkScore,
				transitSummary: config.transitSummary,
			},
			budgets: budgetBands,
		},
		budgetModel: budgetComponents,
		auditMeta,
		comparisonMeta,
		city360,
		sourceMeta,
		trendData: createExpansionTrendSeries({
			weightedScore: weighted,
			oneParentMidpoint: budgetBands.oneParent.midpoint,
			bothWorkingMidpoint: budgetBands.bothWorking.midpoint,
			pm25: config.pollution.pm25,
		}),
	};
};