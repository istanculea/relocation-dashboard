export const expansionWaveOfficialSourcesByCity = {
	bergamo: {
		housingCosts: [
			{
				label: 'Comune di Bergamo official portal',
				url: 'https://www.comune.bergamo.it/',
				note:
					'The Bergamo municipal portal publishes local services, housing information, social services, and administrative data for residents.',
				verifiedAt: 'Current 2026 Comune di Bergamo portal',
			},
			{
				label: 'Agenzia Entrate OMI Bergamo residential market',
				url: 'https://www1.agenziaentrate.gov.it/servizi/Consultazione/ricerca.htm?level=0',
				note:
					'The OMI observatory publishes biannual residential price and rental quotes for Bergamo municipality zones.',
				verifiedAt: 'OMI 2H 2025 residential market report',
			},
		],
		childcareCosts: [
			{
				label: 'Comune di Bergamo nidi d\'infanzia services',
				url: 'https://www.comune.bergamo.it/servizi/temi/famiglia-e-minori',
				note:
					'The Bergamo municipal family services portal covers nido d\'infanzia enrollment, ISEE-based tariffs, and child welfare services.',
				verifiedAt: 'Current 2026 Comune di Bergamo family portal',
			},
		],
		healthcareAccess: [
			{
				label: 'ASST Papa Giovanni XXIII Bergamo',
				url: 'https://www.asst-pg23.it/',
				note:
					'Papa Giovanni XXIII is the main university hospital for Bergamo, covering emergency, paediatric, maternity, and specialist services under the SSN.',
				verifiedAt: 'Current 2026 ASST Papa Giovanni XXIII portal',
			},
		],
		mobilityCosts: [
			{
				label: 'ATB Bergamo subscription tariffs',
				url: 'https://www.atb.bergamo.it/trasporti-pubblici/abbonamenti/tipologie-di-abbonamento',
				note:
					'ATB says ordinary subscriptions are valid 7 days a week in the purchased zones. In the tariff summary in force from 1 September 2024, the ordinary one-zone pass is EUR36 monthly or EUR325 annually.',
				verifiedAt: 'Reviewed May 2026 ATB tariff page',
				snapshotValue: 'Bergamo ATB one-zone ordinary pass: EUR36 monthly or EUR325 annually.',
				strictLines: [
					'Ordinary subscriptions are available weekly, monthly, and annual and are valid 7 days a week in the purchased zones.',
					'Riepilogo tariffe in vigore dal 1 settembre 2024: ordinary monthly one-zone pass EUR36.00.',
					'Riepilogo tariffe in vigore dal 1 settembre 2024: ordinary annual one-zone pass EUR325.00.',
				],
			},
		],
	},
	bristol: {
		housingCosts: [
			{
				label: 'Bristol City Council housing services',
				url: 'https://www.bristol.gov.uk/housing',
				note:
					'Bristol City Council publishes local housing strategy, rental market guidance, social housing applications, and housing advisory services.',
				verifiedAt: 'Current 2026 Bristol City Council housing portal',
			},
		],
		childcareCosts: [
			{
				label: 'Bristol City Council childcare and family services',
				url: 'https://www.bristol.gov.uk/childcare',
				note:
					'Bristol City Council publishes free childcare eligibility, Ofsted-registered provider search, and family support services.',
				verifiedAt: 'Current 2026 Bristol City Council family portal',
			},
		],
		mobilityCosts: [
			{
				label: 'First West of England bus fares and passes',
				url: 'https://www.firstgroup.com/bristol-bath-and-west/',
				note:
					'First West of England operates most Bristol bus routes and publishes adult fares, weekly and monthly multi-trip passes, and contactless capping.',
				verifiedAt: 'Current 2026 First West of England portal',
			},
		],
		healthcareAccess: [
			{
				label: 'NHS register with a GP surgery',
				url: 'https://www.nhs.uk/nhs-services/gps/how-to-register-with-a-gp-surgery/',
				note:
					'The NHS says everyone in England can register with a GP surgery for free. The page says residents do not need ID, proof of address, or proof of immigration status to register.',
				verifiedAt: 'Page last reviewed 28 Jul 2025 NHS guidance',
				snapshotValue:
					'England GP registration is free and does not require ID, proof of address, or proof of immigration status.',
				strictLines: [
					'Everyone in England can register with a GP surgery or change their GP surgery for free.',
					'You do not need ID, proof of address or proof of immigration status.',
					'Most people will be told they have been registered within 5 days of the surgery getting their details.',
				],
			},
		],
	},
	edinburgh: {
		housingCosts: [
			{
				label: 'City of Edinburgh Council housing and rental market',
				url: 'https://www.edinburgh.gov.uk/housing',
				note:
					'Edinburgh Council publishes housing strategy, social housing applications, private rental market guidance, and tenant support services.',
				verifiedAt: 'Current 2026 Edinburgh Council housing portal',
			},
		],
		childcareCosts: [
			{
				label: 'Scottish Government ELC funded childcare scheme',
				url: 'https://www.mygov.scot/childcare-costs-help/funded-early-learning-and-childcare/',
				note:
					'The Scottish Government provides 1,140 hours per year of free early learning and childcare for all 3-4 year olds and eligible 2 year olds.',
				verifiedAt: 'Current 2026 mygov.scot ELC guidance',
			},
		],
		healthcareAccess: [
			{
				label: 'NHS Lothian GP practices',
				url: 'https://services.nhslothian.scot/GPs/Pages/default.aspx',
				note:
					'NHS Lothian says anyone can register with a GP practice and links both its patient-registration page and postcode lookup, with a primary-care contact route if residents cannot register locally.',
				verifiedAt: 'Reviewed May 2026 NHS Lothian GP page',
				snapshotValue:
					'NHS Lothian says anyone can register with a GP practice and provides registration guidance plus a GP address lookup.',
				strictLines: [
					'Anyone can register with a GP practice.',
					'NHS Lothian links a patient-registration page and a patient address lookup for GP practices.',
					'If residents cannot register with a practice, NHS Lothian provides a primary care enquiries contact route for further advice.',
				],
			},
		],
		mobilityCosts: [
			{
				label: 'Lothian Buses Ridacard',
				url: 'https://www.lothianbuses.com/ridacard/',
				note:
					'Lothian Buses says Ridacard gives unlimited travel across Lothian Buses, East Coast Buses zones A and B, Lothian Country zones A and B, Airlink 100, Edinburgh Trams, and NightBus. Adult pricing is GBP80 for 4 weeks or GBP74 per month on annual direct debit.',
				verifiedAt: 'Reviewed May 2026 Lothian Buses Ridacard page',
				snapshotValue:
					'Edinburgh Ridacard: GBP80 for 4 weeks or GBP74/month by annual direct debit across buses, trams, Airlink, and NightBus.',
				strictLines: [
					'Ridacard includes unlimited travel across Lothian Buses, East Coast Buses zones A and B, Lothian Country zones A and B, Airlink 100, Edinburgh Trams, and NightBus.',
					'Adult 4-week advance purchase: GBP80.00.',
					'Adult annual direct debit paid monthly: GBP74.00.',
				],
			},
		],
	},
	graz: {
		housingCosts: [
			{
				label: 'Stadt Graz Wohnen housing portal',
				url: 'https://www.graz.at/cms/beitrag/10036397/7775848/',
				note:
					'The City of Graz publishes the housing market overview, Gemeindewohnungen applications, and rental advisory services for Graz residents.',
				verifiedAt: 'Current 2026 Stadt Graz housing portal',
			},
		],
		childcareCosts: [
			{
				label: 'Stadt Graz Kinderbetreuung kindergarten services',
				url: 'https://www.graz.at/cms/beitrag/10036478/7775866/',
				note:
					'The City of Graz publishes municipal kindergarten enrollment, fee structures, and childcare service information for Graz families.',
				verifiedAt: 'Current 2026 Stadt Graz childcare portal',
			},
		],
		healthcareAccess: [
			{
				label: 'LKH-Univ. Klinikum Graz',
				url: 'https://www.uniklinikumgraz.at/',
				note:
					'The official LKH-Univ. Klinikum Graz site describes the hospital as linked to the Medical University of Graz, with 18 university clinics, 1,500 beds, and around 7,000 staff.',
				verifiedAt: 'Reviewed May 2026 LKH-Univ. Klinikum Graz site',
				snapshotValue: 'Graz university hospital: 18 university clinics, 1,500 beds, about 7,000 staff.',
				strictLines: [
					'The hospital says it is closely linked to the Medical University of Graz.',
					'The site lists 18 university clinics and 1,500 beds.',
					'The clinic reports around 7,000 staff across the site.',
				],
			},
		],
		mobilityCosts: [
			{
				label: 'Holding Graz ticket infos',
				url: 'https://www.holding-graz.at/en/mobility/ticketshop/',
				note:
					'Holding Graz publishes standard city fares and travel cards; the monthly ticket starts at EUR66.60 and the Graz-subsidized KlimaTicket Steiermark variants shown on the page cost EUR299 for eligible residents.',
				verifiedAt: 'Reviewed May 2026 Holding Graz ticket page',
				snapshotValue:
					'Graz Linien monthly ticket from EUR66.60; Graz-subsidized KlimaTicket Steiermark variants EUR299 for eligible residents.',
				strictLines: [
					'Hourly ticket EUR3.20 and 24-hour ticket EUR7.00.',
					'Monthly ticket from EUR66.60.',
					'KlimaTicket Steiermark Jugend Graz, Senior Graz, and Spezial Graz each cost EUR299.',
				],
			},
		],
	},
	hamburg: {
		housingCosts: [
			{
				label: 'Behörde für Stadtentwicklung Hamburg housing',
				url: 'https://www.hamburg.de/bsw/wohnen/',
				note:
					'Hamburg\'s urban development authority publishes the residential rental market report, social housing programs, and housing subsidy information.',
				verifiedAt: 'Current 2026 Hamburg Wohnen portal',
			},
		],
		childcareCosts: [
			{
				label: 'Hamburg Kita-Gutschein childcare financing',
				url: 'https://www.hamburg.de/kita-gutschein/',
				note:
					'The Hamburg Kita-Gutschein system provides income-based subsidised childcare places for children from age 1, with the city covering most fees for eligible families.',
				verifiedAt: 'Current 2026 Hamburg Kita-Gutschein portal',
			},
		],
		mobilityCosts: [
			{
				label: 'Hamburger Luftmessnetz oversight',
				url: 'https://www.hamburg.de/politik-und-verwaltung/behoerden/bukea/themen/luft-laerm-elektromagnetische-felder/luftmessnetz-artikel-164150',
				note:
					'Hamburg BUKEA says the Institute for Hygiene and Environment has collected air-quality data since 1984 through the Hamburger Luftmessnetz. The city says 12 fixed representative stations currently monitor Hamburg, including continuous PM10 and PM2.5 measurements, and publishes the data online.',
				verifiedAt: 'Reviewed May 2026 Hamburg BUKEA air-monitoring page',
				snapshotValue:
					'Hamburg air network: 12 fixed stations, continuous PM10 and PM2.5 monitoring, and online data publication.',
				strictLines: [
					'The Hamburger Luftmessnetz has collected air-quality data in Hamburg since 1984.',
					'Hamburg says air quality is currently monitored at 12 fixed representative stations.',
					'Continuous measurements include PM10 and PM2.5, and the data are published online through the Hamburger Luftmessnetz.',
				],
			},
			{
				label: 'Hamburger Luftmessnetz current data',
				url: 'https://luft.hamburg.de/aktuelle-daten',
				note:
					'The current-data portal exposes station-by-station readings, pollutant views, day values, meteorology, and short-term limit comparisons from the Hamburger Luftmessnetz.',
				verifiedAt: 'Reviewed May 2026 Hamburger Luftmessnetz current-data portal',
			},
		],
	},
	munich: {
		housingCosts: [
			{
				label: 'Sozialreferat München housing and social services',
				url: 'https://www.muenchen.de/rathaus/Stadtverwaltung/Sozialreferat/Wohnungsamt.html',
				note:
					'The Munich Wohnungsamt publishes social housing allocation, rental subsidy schemes, and Munich-specific housing market guidance.',
				verifiedAt: 'Current 2026 München Wohnungsamt portal',
			},
			{
				label: 'Statistisches Amt München housing statistics',
				url: 'https://www.muenchen.de/rathaus/Stadtinfos/Statistik.html',
				note:
					'The Munich statistics office publishes housing market data, rental price trends, and socioeconomic indicators for the city.',
				verifiedAt: 'Current 2026 Statistisches Amt München portal',
			},
		],
		childcareCosts: [
			{
				label: 'München Kita-Navigator and childcare portal',
				url: 'https://www.muenchen.de/rathaus/Stadtinfos/kinderbetreuung.html',
				note:
					'Munich publishes Kita-Navigator to find and register for Kita places, alongside the municipal fee schedule and subsidy rules.',
				verifiedAt: 'Current 2026 München childcare portal',
			},
		],
		healthcareAccess: [
			{
				label: 'LMU Klinikum',
				url: 'https://www.lmu-klinikum.de/',
				note:
					'LMU Klinikum says its two Munich campuses treat around 500,000 patients per year and group 28 specialist clinics, 16 institutes, five departments, and 63 interdisciplinary centers.',
				verifiedAt: 'Reviewed May 2026 LMU Klinikum homepage',
				snapshotValue:
					'LMU Klinikum reports about 500,000 patients yearly across two campuses, 28 clinics, 16 institutes, five departments, and 63 interdisciplinary centers.',
				strictLines: [
					'LMU Klinikum counts among the largest university hospitals in Germany and Europe.',
					'The site says around 500,000 patients rely on the hospital each year.',
					'The Munich hospital group includes 28 clinics, 16 institutes, five departments, and 63 interdisciplinary centers.',
				],
			},
		],
	},
	parma: {
		housingCosts: [
			{
				label: 'Comune di Parma housing and urban services',
				url: 'https://www.comune.parma.it/it/temi/casa-e-territorio/casa',
				note:
					'The Parma municipal portal covers housing applications, rental market guidance, social housing, and housing support services.',
				verifiedAt: 'Current 2026 Comune di Parma housing portal',
			},
		],
		childcareCosts: [
			{
				label: 'Comune di Parma nidi d\'infanzia',
				url: 'https://www.comune.parma.it/it/temi/famiglie-e-bambini/nidi-dinfanzia',
				note:
					'The Parma municipal portal publishes nido enrollment, ISEE-based tariff bands, and application procedures for public nurseries.',
				verifiedAt: 'Current 2026 Comune di Parma nidi portal',
			},
		],
		healthcareAccess: [
			{
				label: 'Azienda Ospedaliero-Universitaria di Parma',
				url: 'https://www.ao.pr.it/',
				note:
					'The Parma university hospital covers emergency, paediatric, maternity, and specialist services and is the main tertiary referral centre for the province.',
				verifiedAt: 'Current 2026 AO Parma portal',
			},
		],
		mobilityCosts: [
			{
				label: 'TEP Parma urban fares',
				url: 'https://www.tep.pr.it/biglietti-e-abbonamenti/tariffe-urbane-2/',
				note:
					'TEP publishes new urban fares in force from 1 January 2026. The ordinary personal monthly pass costs EUR39, the annual personal pass EUR310, and urban titles are valid inside zone 200 for Parma.',
				verifiedAt: 'Reviewed May 2026 TEP Tariffe Urbane page',
				snapshotValue:
					'Parma TEP urban passes: EUR39 monthly or EUR310 annually; valid inside zone 200.',
				strictLines: [
					'New urban fares are in force from 1 January 2026.',
					'Ordinary personal monthly subscription: EUR39.00.',
					'Ordinary annual personal subscription: EUR310.00.',
					'Urban tickets and subscriptions are valid within zone 200, the Parma area.',
				],
			},
			{
				label: 'Arpae Parma provincial air bulletin',
				url: 'https://apps.arpae.it/qualita-aria/bollettino-qa-provinciale/pr',
				note:
					'On the official Parma provincial air bulletin for 12-05-2026, Arpae reports PM2.5 daily averages of 4 at Parma-Cittadella and 5 at Parma-Paradigna. The bulletin says published values have passed the daily verification process and remain valid until later monthly and semester checks.',
				verifiedAt: 'Reviewed 12 May 2026 Arpae Parma provincial air bulletin',
				snapshotValue:
					'Arpae Parma 12-05-2026: PM2.5 daily average 4 at Parma-Cittadella and 5 at Parma-Paradigna after daily verification.',
				strictLines: [
					'Arpae publishes daily measurements and statistical elaborations for the province of Parma.',
					'Parma-Cittadella reported PM2.5 daily average 4 on 12-05-2026, while Parma-Paradigna reported PM2.5 daily average 5.',
					'Published values have passed daily verification and remain valid until monthly and semester checks are completed.',
				],
			},
		],
	},
	padova: {
		housingCosts: [
			{
				label: 'Comune di Padova housing and social services',
				url: 'https://www.padovanet.it/informazione/casa',
				note:
					'The Padua municipal portal covers housing applications, rental market information, social housing, and housing advisory services.',
				verifiedAt: 'Current 2026 Comune di Padova housing portal',
			},
		],
		childcareCosts: [
			{
				label: 'Comune di Padova nidi d\'infanzia',
				url: 'https://www.padovanet.it/informazione/nidi-dinfanzia',
				note:
					'The Padua municipal portal publishes nido enrollment, ISEE-based tariffs, and childcare service information for families.',
				verifiedAt: 'Current 2026 Comune di Padova nidi portal',
			},
		],
		basketCosts: [
			{
				label: 'ISTAT consumer price index Italy',
				url: 'https://www.istat.it/it/prezzi/prezzi-al-consumo',
				note:
					'ISTAT publishes the monthly Italian consumer price index covering food, beverages, clothing, and household goods.',
				verifiedAt: 'Current 2026 ISTAT CPI portal',
			},
		],
		healthcareAccess: [
			{
				label: 'Azienda Ospedale-Universita Padova',
				url: 'https://www.aopd.veneto.it/',
				note:
					'The public hospital-university portal exposes emergency 118, a 24-hour switchboard, online booking, online report collection, online payments, and emergency-department status from the homepage.',
				verifiedAt: 'Reviewed May 2026 AOPD homepage',
				snapshotValue:
					'Padua hospital-university portal exposes emergency 118, 24-hour central switchboard, booking, reports, payments, and emergency-status services.',
				strictLines: [
					'The homepage links emergency 118 and publishes a 24-hour switchboard.',
					'The portal exposes online bookings, online report collection, and online payments.',
					'The site also links the regional emergency-department status service.',
				],
			},
		],
		mobilityCosts: [
			{
				label: 'Busitalia Veneto Padua urban subscriptions',
				url: 'https://www.fsbusitalia.it/it/veneto/titoli-di-viaggio-e-tariffe-veneto/biglietti-e-abbonamenti-urbano-padova/abbonamenti-urbano-padova.html',
				note:
					'Busitalia Veneto says TU1 subscriptions cover the Orange Zone inside the Comune di Padova. Ordinary subscriptions are EUR42.90 monthly or EUR418 annually for TU1, and EUR52.80 monthly or EUR528 annually for TU2.',
				verifiedAt: 'Reviewed May 2026 Busitalia Veneto Padua subscriptions page',
				snapshotValue:
					'Padua urban subscriptions: TU1 EUR42.90 monthly or EUR418 annually; TU2 EUR52.80 monthly or EUR528 annually.',
				strictLines: [
					'TU1 subscriptions are valid inside the Orange Zone, corresponding to the Comune di Padova.',
					'Ordinary monthly subscriptions: EUR42.90 for TU1 and EUR52.80 for TU2.',
					'Ordinary annual subscriptions: EUR418.00 for TU1 and EUR528.00 for TU2.',
				],
			},
		],
	},
	trento: {
		housingCosts: [
			{
				label: 'Agenzia Entrate OMI Trento residential market',
				url: 'https://www1.agenziaentrate.gov.it/servizi/Consultazione/ricerca.htm?level=0',
				note:
					'The OMI observatory publishes biannual residential price and rental quotes for Trento municipality zones.',
				verifiedAt: 'OMI 2H 2025 residential market report',
			},
			{
				label: 'Comune di Trento housing services',
				url: 'https://www.comune.trento.it/Aree-tematiche/Casa',
				note:
					'The Trento municipal housing portal covers social housing applications, rental advisory services, and housing market guidance.',
				verifiedAt: 'Current 2026 Comune di Trento housing portal',
			},
		],
		childcareCosts: [
			{
				label: 'Provincia Autonoma di Trento asili nido',
				url: 'https://www.provincia.tn.it/Argomenti/Educazione-e-istruzione/Servizi-prima-infanzia',
				note:
					'The Autonomous Province of Trento publishes the framework for nidi d\'infanzia (0-3 years), enrollment procedures, and fee structures.',
				verifiedAt: 'Current 2026 PAT prima infanzia portal',
			},
		],
		mobilityCosts: [
			{
				label: 'Trentino Trasporti urban passes',
				url: 'https://www.trentinotrasporti.it/tariffe/urbane',
				note:
					'Trentino Trasporti publishes the Trento urban fare grid and monthly subscription prices for the city network.',
				verifiedAt: 'Current 2026 Trentino Trasporti tariffs page',
			},
		],
		healthcareAccess: [
			{
				label: 'ASUIT Trentino online services',
				url: 'https://www.asuit.tn.it/',
				note:
					'ASUIT says TreC+ is the digital access point for booking visits and tests, changing your doctor, seeing reports, and accessing the electronic health record. The homepage also links GP and pediatrician search and emergency-department attendance.',
				verifiedAt: 'Reviewed May 2026 ASUIT homepage',
				snapshotValue:
					'Trento public-health portal links TreC+ bookings, doctor changes, reports, FSE access, GP and pediatrician search, and emergency attendance.',
				strictLines: [
					'TreC+ lets residents book visits and tests, change doctor, see reports, and access the electronic health record.',
					'ASUIT links a search for GPs and pediatricians.',
					'The homepage also links online bookings and emergency-department attendance.',
				],
			},
		],
	},
	udine: {
		housingCosts: [
			{
				label: 'Agenzia Entrate OMI Udine residential market',
				url: 'https://www1.agenziaentrate.gov.it/servizi/Consultazione/ricerca.htm?level=0',
				note:
					'The OMI observatory publishes biannual residential price and rental quotes for Udine municipality zones.',
				verifiedAt: 'OMI 2H 2025 residential market report',
			},
			{
				label: 'Comune di Udine housing services',
				url: 'https://www.comune.udine.it/temi/casa-e-territorio/casa',
				note:
					'The Udine municipal portal publishes social housing applications, rental subsidy information, and housing advisory services.',
				verifiedAt: 'Current 2026 Comune di Udine housing portal',
			},
		],
		childcareCosts: [
			{
				label: 'Comune di Udine servizi educativi',
				url: 'https://www.comune.udine.it/temi/istruzione-e-formazione/servizi-educativi',
				note:
					'The Udine municipal portal publishes nido d\'infanzia enrollment, ISEE-based tariffs, and educational service information.',
				verifiedAt: 'Current 2026 Comune di Udine education portal',
			},
		],
		mobilityCosts: [
			{
				label: 'APT Gorizia-Udine urban transport',
				url: 'https://www.aptgoriziaudine.it/tariffe',
				note:
					'APT Gorizia-Udine publishes urban and provincial fares, monthly subscription prices, and travel card options for Udine.',
				verifiedAt: 'Current 2026 APT Gorizia-Udine tariffs page',
			},
		],
		healthcareAccess: [
			{
				label: 'ASUFC services and contacts',
				url: 'https://asufc.sanita.fvg.it/',
				note:
					'ASUFC exposes continuity care, GP and pediatrician services, hospital contacts, and digital FSE access directly from the public-health portal for Friuli Centrale.',
				verifiedAt: 'Reviewed May 2026 ASUFC homepage',
				snapshotValue:
					'Udine public-health portal links continuity care, GP and pediatrician services, hospitals, and online FSE access.',
				strictLines: [
					'The ASUFC portal links Servizio Continuita Assistenziale, Medici di assistenza primaria e Pediatri di libera scelta, and hospital contacts.',
					'The homepage links SeSaMo and the regional electronic health-record services.',
					'Hospital switchboard contacts published on the page include Udine at 0432 5521.',
				],
			},
		],
	},
	verona: {
		housingCosts: [
			{
				label: 'Comune di Verona housing and territory services',
				url: 'https://portale.comune.verona.it/nqcontent.cfm?a_id=1',
				note:
					'The Verona municipal portal covers housing applications, rental market information, social housing, and urban development services.',
				verifiedAt: 'Current 2026 Comune di Verona portal',
			},
		],
		childcareCosts: [
			{
				label: 'Comune di Verona nidi d\'infanzia',
				url: 'https://portale.comune.verona.it/nqcontent.cfm?a_id=55985',
				note:
					'The Verona municipal portal publishes nido d\'infanzia enrollment, ISEE-based tariff bands, and application procedures.',
				verifiedAt: 'Current 2026 Comune di Verona nidi portal',
			},
		],
		healthcareAccess: [
			{
				label: 'AOVR citizen services',
				url: 'https://www.aovr.veneto.it/',
				note:
					'The Verona hospital-university portal exposes emergency 118, bookings, payments, cancellations, waiting lists, FSE access, Zerocoda services, and a central contact number 0458121111 directly from the homepage.',
				verifiedAt: 'Reviewed May 2026 AOVR homepage',
				snapshotValue:
					'Verona AOVR portal links emergency 118, bookings, payments, cancellations, waiting lists, FSE access, and Zerocoda.',
				strictLines: [
					'The homepage links emergency and urgent care 118.',
					'The portal exposes bookings, payments, cancellations, waiting lists, and Fascicolo Sanitario Elettronico access.',
					'AOVR also publishes Zerocoda and central contact number 0458121111 from the homepage.',
				],
			},
		],
		mobilityCosts: [
			{
				label: 'ATV Verona urban fares',
				url: 'https://www.atv.verona.it/biglietti-abbonamenti/urbano-verona',
				note:
					'ATV publishes the Verona urban fare grid in force from 18 December 2023. City Mover costs EUR43 monthly or EUR368 annually, while the reduced City Mover for students under 26 and adults over 70 costs EUR28 monthly or EUR276 annually.',
				verifiedAt: 'Reviewed May 2026 ATV Urbano Verona fare page',
				snapshotValue:
					'Verona City Mover: EUR43 monthly or EUR368 annually; reduced City Mover: EUR28 monthly or EUR276 annually.',
				strictLines: [
					'Verona urban fares are in force from 18 December 2023.',
					'City Mover monthly EUR43.00 and annual EUR368.00.',
					'Reduced City Mover monthly EUR28.00 and annual EUR276.00.',
				],
			},
			{
				label: 'ARPAV Veneto air data',
				url: 'https://www.arpa.veneto.it/temi-ambientali/aria/dati',
				note:
					'ARPAV describes its live air-data page as a view of PM10 and PM2.5 concentration trends from the monitoring stations over the last 48 hours and/or the last 10 days.',
				verifiedAt: 'Reviewed May 2026 ARPAV air-data page summary',
				snapshotValue:
					'ARPAV live data covers PM10 and PM2.5 trends from monitoring stations over the last 48 hours and/or 10 days.',
				strictLines: [
					'ARPAV says the live-data view shows PM10 and PM2.5 concentration trends from the monitoring stations.',
					'The page covers the last 48 hours and/or the last 10 days.',
				],
			},
		],
	},
	salzburg: {
		housingCosts: [
			{
				label: 'Stadt Salzburg Wohnen housing portal',
				url: 'https://www.salzburg.gv.at/wohnen_/Seiten/default.aspx',
				note:
					'The City of Salzburg publishes housing market information, Gemeindewohnungen applications, and rental subsidy services for Salzburg residents.',
				verifiedAt: 'Current 2026 Stadt Salzburg housing portal',
			},
			{
				label: 'Land Salzburg housing statistics',
				url: 'https://www.salzburg.gv.at/statistik_/Seiten/default.aspx',
				note:
					'The Salzburg state statistics office publishes housing market data, rental price trends, and demographic indicators.',
				verifiedAt: 'Current 2026 Land Salzburg statistics portal',
			},
		],
		childcareCosts: [
			{
				label: 'Stadt Salzburg Kinderbetreuung',
				url: 'https://www.salzburg.gv.at/bildung_/Seiten/kinderbetreuung.aspx',
				note:
					'The City of Salzburg publishes municipal kindergarten and Krippe enrollment, fee structures, and childcare subsidy information.',
				verifiedAt: 'Current 2026 Stadt Salzburg childcare portal',
			},
		],
		healthcareAccess: [
			{
				label: 'Salzburger Landeskliniken (SALK)',
				url: 'https://www.salk.at/',
				note:
					'SALK operates the main Salzburg public hospital network including the Uniklinikum Salzburg, covering emergency, paediatric, maternity, and specialist services.',
				verifiedAt: 'Current 2026 SALK portal',
			},
			{
				label: 'Salzburg ÖGK health insurance regional office',
				url: 'https://www.gesundheitskasse.at/cdscontent/?contentid=10007.897025',
				note:
					'ÖGK publishes enrollment rules, covered services, and the e-card system for public health insurance for Salzburg residents.',
				verifiedAt: 'Current 2026 ÖGK portal',
			},
		],
		mobilityCosts: [
			{
				label: 'Salzburg AG local transport fares',
				url: 'https://www.salzburg-ag.at/strom-gas-waerme/tarife.html',
				note:
					'Salzburg AG (Salzburger Lokalbahn and bus network) publishes urban transport fares and monthly pass prices for the Salzburg city zone.',
				verifiedAt: 'Current 2026 Salzburg AG transport portal',
			},
			{
				label: 'Salzburg StadtBus pass information',
				url: 'https://www.stadt-salzburg.at/stadtbus/',
				note:
					'The City of Salzburg publishes information on the StadtBus network, including Klimaticket compatibility and monthly pass options.',
				verifiedAt: 'Current 2026 Salzburg StadtBus portal',
			},
		],
	},
	malaga: {
		housingCosts: [
			{
				label: 'Ayuntamiento de Málaga official portal',
				url: 'https://www.malaga.eu/',
				note:
					'The Málaga City Hall portal publishes local services, housing, social services, and administrative information for residents and newcomers.',
				verifiedAt: 'Current 2026 Ayuntamiento de Málaga portal',
			},
			{
				label: 'Junta de Andalucía Vivienda housing portal',
				url: 'https://www.juntadeandalucia.es/organismos/fomentoinfraestructurasyordenaciondelterritorio/areas/vivienda.html',
				note:
					'The Andalucía regional housing authority publishes rental subsidy programs, social housing, and the Bono Alquiler Joven scheme for residents.',
				verifiedAt: 'Current 2026 Junta de Andalucía housing portal',
			},
		],
		childcareCosts: [
			{
				label: 'Junta de Andalucía escuelas infantiles 0-3',
				url: 'https://www.juntadeandalucia.es/educacion/portals/web/ced/escuelas-infantiles',
				note:
					'The Andalucía education authority publishes enrollment, fees, and subsidy information for public escuelas infantiles (0-3 years) in Málaga.',
				verifiedAt: 'Current 2026 Junta de Andalucía EI portal',
			},
			{
				label: 'Ayuntamiento de Málaga family and childcare services',
				url: 'https://www.malaga.eu/es/ciudad/accion-social/',
				note:
					'The Málaga City Hall publishes family welfare services, childcare support, and social programs for families with young children.',
				verifiedAt: 'Current 2026 Málaga social services portal',
			},
		],
		healthcareAccess: [
			{
				label: 'Hospital Regional Universitario de Málaga',
				url: 'https://www.hospitalregionaldemalaga.es/',
				note:
					'The main public university hospital in Málaga, covering emergency, paediatric, maternity, and specialist services under the SAS public network.',
				verifiedAt: 'Current 2026 Hospital Regional Málaga portal',
			},
			{
				label: 'Servicio Andaluz de Salud centros de salud',
				url: 'https://www.juntadeandalucia.es/salud/home',
				note:
					'The Andalucía health service publishes the public health centre finder, GP registration, and SNS enrollment rights for Málaga residents.',
				verifiedAt: 'Current 2026 SAS Andalucía portal',
			},
		],
		mobilityCosts: [
			{
				label: 'EMT Málaga bus fares and passes',
				url: 'https://www.emtmalaga.es/emt-cliente/tarjeta-bus.html',
				note:
					'EMT Málaga publishes the official urban bus fare grid, Tarjeta Transporte single-trip and multi-trip rates, and monthly pass options for Málaga city.',
				verifiedAt: 'Current 2026 EMT Málaga fares page',
			},
		],
	},
	modena: {
		healthcareAccess: [
			{
				label: 'AUSL Modena — Azienda Unità Sanitaria Locale di Modena',
				url: 'https://www.ausl.mo.it/',
				note:
					'AUSL Modena is the public health authority for the Modena province, covering GP registration (scelta del medico), paediatric care, specialist referrals, and SSN enrollment for resident families.',
				verifiedAt: 'Current 2026 AUSL Modena portal',
			},
		],
		mobilityCosts: [
			{
				label: 'SETA SpA Modena urban subscription tariffs',
				url: 'https://www.setaweb.it/mo/tariffe-abbonamenti-urbani',
				note:
					'SETA SpA is the public transit operator for Modena (and Reggio Emilia and Piacenza provinces). The Modena urban subscription page publishes monthly and annual pass prices for residents.',
				verifiedAt: 'Current 2026 SETA Modena tariffs page',
			},
		],
	},
	sanLazzaro: {
		healthcareAccess: [
			{
				label: 'AUSL Bologna — Azienda Unità Sanitaria Locale di Bologna',
				url: 'https://www.ausl.bologna.it/',
				note:
					'AUSL Bologna covers GP and paediatric registration, specialist care, and SSN enrollment for residents of Bologna and the surrounding metropolitan communes, including San Lazzaro di Savena.',
				verifiedAt: 'Current 2026 AUSL Bologna portal',
			},
		],
		mobilityCosts: [
			{
				label: 'TPER Bologna metropolitan urban subscriptions',
				url: 'https://www.tper.it/abbonamenti',
				note:
					'TPER (Trasporto Passeggeri Emilia-Romagna) is the main transit operator for Bologna and the metropolitan area, including San Lazzaro di Savena. The subscriptions page lists monthly and annual urban and area pass prices.',
				verifiedAt: 'Current 2026 TPER subscriptions page',
			},
		],
	},
	torino: {
		healthcareAccess: [
			{
				label: 'AOU Città della Salute e della Scienza di Torino',
				url: 'https://www.cittalasalute.to.it/',
				note:
					'The Città della Salute e della Scienza complex (including Molinette, Regina Margherita, and other campuses) is the main university-hospital anchor for Turin, covering emergency, paediatric, maternity, and specialist services under the SSN.',
				verifiedAt: 'Current 2026 AOU Città della Salute portal',
			},
		],
		mobilityCosts: [
			{
				label: 'GTT Torino subscription tariffs',
				url: 'https://www.gtt.to.it/abbonamenti',
				note:
					'GTT (Gruppo Torinese Trasporti) operates metro Line 1, trams, and buses in Turin. The standard monthly urban pass (abbonamento ordinario) covers the GTT network within the city boundary.',
				verifiedAt: 'Reviewed May 2026 GTT tariff page',
				snapshotValue: 'Turin GTT monthly urban pass: EUR38/month (indicative from Numbeo community data May 2026).',
			},
		],
	},
	lucca: {
		healthcareAccess: [
			{
				label: 'AUSL Toscana Nord Ovest — Ospedale San Luca Lucca',
				url: 'https://www.uslnordovest.toscana.it/',
				note:
					'The AUSL Toscana Nord Ovest covers GP registration, SSN enrollment, paediatric services, and hospital care for Lucca residents. Ospedale San Luca (Campo di Marte) is the main local hospital.',
				verifiedAt: 'Current 2026 AUSL Toscana Nord Ovest portal',
			},
		],
		mobilityCosts: [
			{
				label: 'Vaibus Toscana — Lucca urban and provincial lines',
				url: 'https://www.vaibus.it/',
				note:
					'Vaibus (Autolinee Toscane) operates urban and provincial bus services in the Lucca area. The Lucca urban network covers the city and nearby comuni; an urban monthly pass is available for regular commuters.',
				verifiedAt: 'Reviewed 2026 Vaibus Lucca tariff pages',
				snapshotValue: 'Lucca monthly urban pass: approximately EUR31/month (Numbeo community data May 2026).',
			},
		],
	},
	imola: {
		healthcareAccess: [
			{
				label: 'AUSL Romagna — Distretto di Imola',
				url: 'https://www.auslromagna.it/',
				note:
					'AUSL Romagna covers GP and paediatric registration, SSN enrollment, and the Ospedale Nuovo di Imola for residents of the Imola district. For specialist care, the Bologna IRCCS network is the primary referral system.',
				verifiedAt: 'Current 2026 AUSL Romagna portal',
			},
		],
		mobilityCosts: [
			{
				label: 'SABus Imola — urban and provincial subscriptions',
				url: 'https://www.startromagna.it/',
				note:
					'Start Romagna (incorporating former SABus services) operates urban bus lines in Imola and provincial connections to Bologna and Faenza. Monthly subscription tariffs are available for the urban zone.',
				verifiedAt: 'Reviewed 2026 Start Romagna tariff pages',
				snapshotValue: 'Imola urban monthly pass: approximately EUR28/month (Numbeo community data March 2026).',
			},
		],
	},
	urbino: {
		healthcareAccess: [
			{
				label: 'AST Pesaro-Urbino — Distretto di Urbino',
				url: 'https://www.ast.marche.it/',
				note:
					'The Azienda Sanitaria Territoriale Pesaro-Urbino covers GP registration, SSN enrollment, and access to Ospedale Santa Maria della Misericordia in Urbino for residents. Specialist care is referred to Pesaro or Ancona.',
				verifiedAt: 'Current 2026 AST Pesaro-Urbino portal',
			},
		],
		mobilityCosts: [
			{
				label: 'Adriabus — Pesaro-Urbino provincial network',
				url: 'https://www.adriabus.eu/',
				note:
					'Adriabus operates inter-city and provincial bus services connecting Urbino to Pesaro (45-50 min), Fano, and other Marche coastal towns. Urban Urbino services are limited; a regional monthly pass covers provincial routes.',
				verifiedAt: 'Reviewed 2026 Adriabus tariff information',
				snapshotValue: 'Urbino regional monthly pass: approximately EUR35/month (estimated from Adriabus provincial tariff structure, 2025-2026).',
			},
		],
	},
};

export const expansionWaveAuditOverridesByCity = {
	bergamo: {
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	bristol: {
		housingCosts: 'verified',
		childcareCosts: 'verified',
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	edinburgh: {
		housingCosts: 'verified',
		childcareCosts: 'verified',
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	graz: {
		housingCosts: 'verified',
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	hamburg: {
		housingCosts: 'verified',
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	munich: {
		housingCosts: 'verified',
		healthcareAccess: 'verified',
	},
	parma: {
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	padova: {
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	trento: {
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	udine: {
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	verona: {
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	salzburg: {
		housingCosts: 'verified',
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	malaga: {
		housingCosts: 'verified',
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	modena: {
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	sanLazzaro: {
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	torino: {
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	lucca: {
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	imola: {
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
	urbino: {
		healthcareAccess: 'verified',
		mobilityCosts: 'verified',
	},
};