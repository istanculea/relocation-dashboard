import { numbeoBenchmarks } from '../numbeoBenchmarks.js';
import { secondaryBenchmarks } from '../secondaryBenchmarks.js';

export const iberiaAndRomaniaCitySourceMeta = {
  bilbao: {
    housingCosts: [
      {
        label: 'Eustat Bilbao rental reference',
        url: 'https://es.eustat.eus/alquiler_vivienda.html',
        note:
          'Eustat\'s 2024 municipal row for Bilbao in the official rental-reference table lists EUR12.0 per sqm per month, EUR859 per month, and 74 sqm as the headline collective-housing values, with a wider reference band of EUR700-950 per month and 59-85 sqm in the same row.',
        verifiedAt: 'Current Eustat 2024 rental reference page',
        snapshotValue:
          'Eustat 2024 reference for Bilbao: EUR859/month average rent at EUR12.0/sqm for 74 sqm of collective housing.',
        strictLines: [
          'Eustat\'s 2024 Bilbao rental reference lists EUR12.0 per sqm per month for collective housing.',
          'The Bilbao municipal row lists EUR859 per month and 74 sqm as the headline rent and size values.',
          'The same row shows a wider reference band of EUR700-950 per month and 59-85 sqm.',
        ],
      },
      {
        label: 'Bilbao City Hall official portal',
        url: 'https://www.bilbao.eus/cs/Satellite/portal-bilbao/es/inicio',
        note:
          'The Bilbao municipal portal publishes official housing, social services, and local administration information for residents and newcomers.',
        verifiedAt: 'Current 2026 Bilbao City Hall portal',
      },
      {
        label: 'Bizkaia Foral Diputacion housing services',
        url: 'https://www.bizkaia.eus/eu/etxebizitza',
        note:
          'The Bizkaia Provincial Council publishes the official housing-support framework, rental subsidy schemes, and housing registry for Bizkaia residents.',
        verifiedAt: 'Current 2026 Bizkaia housing portal',
      },
      ...numbeoBenchmarks.bilbao.housingCosts,
      ...(secondaryBenchmarks.bilbao?.housingCosts ?? []),
    ],
    childcareCosts: [
      {
        label: 'Basque Government Haurreskolak article',
        url: 'https://www.euskadi.eus/noticia/2025/abierto-plazo-inscripcion-haurreskolak-educacion-temprana-y-gratuita-como-motor-equidad-y-exito-educativo/web01-s2hhome/es/',
        note:
          'The Basque Government says the Haurreskolak service remains free during the 2025/2026 school year, children can start once they are 16 weeks old, and the public 0-2 network offers 8,844 places across 238 schools in 180 municipalities.',
        verifiedAt: 'Updated 30 Apr 2025 Euskadi article',
        snapshotValue: 'Haurreskolak remains a free 0-2 early-education service in the 2025/2026 school year.',
        strictLines: [
          'The Basque Government says Haurreskolak remains free during the 2025/2026 school year.',
          'Children must be at least 16 weeks old to start.',
          'The network offers 8,844 places across 238 schools in 180 municipalities.',
        ],
      },
      {
        label: 'Euskadi Hezkuntza school enrollment portal',
        url: 'https://www.euskadi.eus/hezkuntza-sistema/web01-a2hezkun/es/',
        note:
          'The Basque education portal published by Eusko Jaurlaritza covers enrollment procedures, school directories, and public and concertado school information for the Basque Country.',
        verifiedAt: 'Current 2026 Euskadi education portal',
      },
      ...numbeoBenchmarks.bilbao.childcareCosts,
      ...(secondaryBenchmarks.bilbao?.childcareCosts ?? []),
    ],
    basketCosts: [
      {
        label: 'Bilbao basket audit note',
        url: 'https://www.eustat.eus/',
        gapNote: true,
        note:
          'Rechecked in May 2026 against Eustat and the broader Bilbao public data surface: no official Bilbao or Basque public page with current item-level infant basket prices was retrievable, so the clean-basket comparison still relies on benchmark sources rather than a strict official table.',
      },
      {
        label: 'Eustat Basque consumer price statistics',
        url: 'https://www.eustat.eus/estadisticas/tema_166/opt_0/temas.html',
        note:
          'Eustat publishes the Basque consumer price index (IPC) monthly, covering food, clothing, household goods, and services categories.',
        verifiedAt: 'Current 2026 Eustat IPC portal',
      },
      ...numbeoBenchmarks.bilbao.basketCosts,
      ...(secondaryBenchmarks.bilbao?.basketCosts ?? []),
    ],
    healthcareAccess: [
      {
        label: 'Osakidetza citizen services',
        url: 'https://www.osakidetza.euskadi.eus/servicios-a-la-ciudadania/webosk00-sercon/es/',
        note:
          'Osakidetza says patients can call their health centre in normal hours or use Emergencias de Osakidetza and Consejo Sanitario 24 hours a day, 365 days a year, while online services cover appointments, the health folder, and mobile access.',
        verifiedAt: 'Updated 27 Feb 2026 Osakidetza services page',
      },
      {
        label: 'Osakidetza centre and hospital finder',
        url: 'https://www.osakidetza.euskadi.eus/buscador-de-centros-sanitarios-y-hospitales/webosk00-cercon/es/',
        note:
          'Osakidetza keeps an advanced public finder by centre type, historic territory, and municipality, and the live catalogue includes Bilbao and Bizkaia health centres and hospitals plus an open-data download.',
        verifiedAt: 'Updated 22 Apr 2025 Osakidetza finder',
      },
      {
        label: 'Hospital Universitario Cruces official site',
        url: 'https://www.osakidetza.euskadi.eus/hospital-universitario-cruces/web01-a3hcruz/es/',
        note:
          'Hospital Universitario Cruces is the main tertiary and university hospital serving Bilbao and Bizkaia, with paediatric, emergency, and specialist departments accessible through Osakidetza.',
        verifiedAt: 'Current 2026 Osakidetza hospital page',
      },
    ],
    mobilityCosts: [
      {
        label: 'CTB Barik fares 2026',
        url: 'https://www.ctb.eus/es/tarifas_2022',
        note:
          'CTB\'s Barik fares valid from 21 February to 31 December 2026 list Bilbobus at EUR0.44, Metro service at EUR0.61, EUR0.71, and EUR0.78 for 1 to 3 zones, Bilbao tram at EUR0.44, and the Artxanda funicular at EUR0.42 with Creditrans in Barik.',
        verifiedAt: 'Valid 21 Feb-31 Dec 2026 CTB fares page',
        snapshotValue:
          'CTB 2026 Barik fares: Bilbobus and Bilbao tram EUR0.44; Metro service EUR0.61-0.78 depending on zones.',
        strictLines: [
          'CTB\'s 2026 Barik fares page lists Bilbobus at EUR0.44.',
          'Metro service is EUR0.61 for 1 zone, EUR0.71 for 2 zones, and EUR0.78 for 3 zones.',
          'Bilbao tram is EUR0.44 and the Artxanda funicular is EUR0.42.',
        ],
      },
      ...numbeoBenchmarks.bilbao.mobilityCosts,
      ...(secondaryBenchmarks.bilbao?.mobilityCosts ?? []),
    ],
    familyBenefits: [
      {
        label: 'Euskadi family aid expansion FAQ',
        url: 'https://www.euskadi.eus/informacion-ampliacion-ayudas-a-las-familias-con-hijas-e-hijos/web01-a2famil/es/',
        note:
          'The Basque Government\'s updated 27 February 2026 FAQ says the EUR200/month aid for children aged 0-3 is extended to 0-4 in 2026, all registered monoparental families with children under 4 can request that extension, and after age 4 each child can move to EUR100/month until the month before turning 7.',
        verifiedAt: 'Updated 27 Feb 2026 Euskadi FAQ',
        snapshotValue:
          'Euskadi family aid in 2026: EUR200/month up to age 4, then EUR100/month to age 7 for registered monoparental families and third-or-later children.',
        strictLines: [
          'The 2026 Euskadi expansion extends the EUR200 per month child aid from ages 0-3 to ages 0-4.',
          'Registered monoparental families with children under 4 in 2026 can request the EUR200 per month aid until the month before age 4.',
          'After age 4, each child can move to EUR100 per month until the month before turning 7.',
        ],
      },
      {
        label: 'Euskadi monthly family aid procedure',
        url: 'https://www.euskadi.eus/ayuda_subvencion/ayudas-mensuales-a-familias-con-hijos-e-hijas/web01-tramite/es/',
        note:
          'The live procedure page says the 0-3 application must be filed within 3 months to receive the full aid and that an accepted 0-3 file carries EUR200/month per child.',
        verifiedAt: 'Current 2026 Euskadi procedure page',
      },
      {
        label: 'Seguridad Social prestaciones familiares Spain',
        url: 'https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/PrestacionesPensionesTrabajadores/10957',
        note:
          'The Social Security publishes national family benefit entitlements applicable in Spain, including child birth payments and dependent-child allowances.',
        verifiedAt: 'Current 2026 Seguridad Social portal',
      },
    ],
    communityVoices: [
      {
        label: 'Expatica Spain — Bilbao living guide',
        url: 'https://www.expatica.com/es/',
        note:
          'Expatica Spain covers housing search, SNS and Osakidetza registration, childcare options, and family integration from resident perspectives across the Basque Country.',
        communitySource: true,
      },
      {
        label: 'InterNations Bilbao expat community',
        url: 'https://www.internations.org/bilbao-expats',
        note:
          'InterNations Bilbao group connects residents and newcomers sharing relocation experiences, neighbourhood insights, and family-life tips in Bilbao.',
        communitySource: true,
      },
      {
        label: 'r/Bilbao community forum',
        url: 'https://www.reddit.com/r/Bilbao/',
        note:
          'Local Reddit community for Bilbao residents covering neighbourhood life, housing, schools, transport, and everyday family topics.',
        communitySource: true,
      },
      {
        label: 'Irekia Basque open government news',
        url: 'https://www.irekia.euskadi.eus/',
        note:
          'The Basque Government\'s open data and news portal covering policy, family services, childcare updates, and quality-of-life initiatives in the Basque Country.',
        communitySource: true,
      },
      {
        label: 'Spain Expats community portal',
        url: 'https://www.spainexpats.com/',
        note:
          'Community forum and relocation resource covering housing, NIE, healthcare, schools, and neighbourhood life across Spain including the Basque Country.',
        communitySource: true,
      },
    ],
  },
  bucharest: {
    housingCosts: [
      {
        label: 'Primaria Municipiului Bucuresti official portal',
        url: 'https://www.pmb.ro/',
        note:
          'The Bucharest City Hall official portal publishes local services, housing registration, social services, and administrative information for residents.',
        verifiedAt: 'Current 2026 PMB portal',
      },
      {
        label: 'INS Romania housing and real estate statistics',
        url: 'https://insse.ro/cms/',
        note:
          'The National Institute of Statistics publishes housing prices, rental indices, and construction data for Bucharest and Romania.',
        verifiedAt: 'Current 2026 INS Romania portal',
      },
    ],
    childcareCosts: [
      {
        label: 'DGASPC Bucuresti child and social protection services',
        url: 'https://www.dgaspcb.ro/',
        note:
          'DGASPC Bucuresti is the official Bucharest authority for child protection, family services, and social support programs for residents.',
        verifiedAt: 'Current 2026 DGASPC Bucuresti portal',
      },
      {
        label: 'Ministerul Educatiei school and cresa enrollment framework',
        url: 'https://www.edu.ro/',
        note:
          'The Romanian Ministry of Education publishes the framework for crese (nurseries), gradinite (kindergartens), and school enrollment procedures.',
        verifiedAt: 'Current 2026 MEN Romania portal',
      },
    ],
    basketCosts: [
      {
        label: 'ANSVSA food safety and consumer authority',
        url: 'https://www.ansvsa.ro/',
        note:
          'ANSVSA is the Romanian national authority for sanitary veterinary and food safety, publishing food product standards and market surveillance results.',
        verifiedAt: 'Current 2026 ANSVSA portal',
      },
      {
        label: 'INS Romania consumer price index',
        url: 'https://insse.ro/cms/ro/tags/indicele-preturilor-de-consum',
        note:
          'INS publishes the monthly consumer price index for Romania covering food, household goods, clothing, and services.',
        verifiedAt: 'Current 2026 INS Romania CPI portal',
      },
    ],
    mobilityCosts: [
      {
        label: 'TPBI fares page',
        url: 'https://tpbi.ro/tarife/',
        note:
          'TPBI publishes the current integrated fares: a 7-day pass at 30 lei, a monthly surface-network pass at 80 lei, and a monthly integrated surface-plus-metro pass at 140 lei.',
        verifiedAt: 'Updated 20 Feb 2025 TPBI fares page',
        snapshotValue:
          'Monthly pass: 80 RON surface network / 140 RON integrated with Metrorex.',
        strictLines: [
          'TPBI publishes a 7-day pass at 30 lei.',
          'Monthly pass: 80 lei for the surface network, including the former regional lines.',
          'Monthly integrated pass: 140 lei for surface transport plus Metrorex.',
        ],
      },
      {
        label: 'Metrorex official fare information',
        url: 'https://metrorex.ro/tarife_c96.html',
        note:
          'Metrorex publishes the official Bucharest metro fare table, including single-journey, multi-trip, and monthly pass prices.',
        verifiedAt: 'Current 2026 Metrorex tariffs page',
      },
    ],
    healthcareAccess: [
      {
        label: 'DSP Bucuresti public health authority',
        url: 'https://www.dspb.ro/',
        note:
          'The Bucharest Public Health Directorate oversees public health services, epidemiology, and health facility oversight for Bucharest residents.',
        verifiedAt: 'Current 2026 DSP Bucuresti portal',
      },
      {
        label: 'Spitalul Clinic de Urgenta Floreasca',
        url: 'https://www.urgentafloreasca.ro/',
        note:
          'The main Bucharest emergency clinical hospital covering trauma, general surgery, and emergency medicine, with 24/7 admissions and paediatric emergency services.',
        verifiedAt: 'Current 2026 Spital Floreasca portal',
      },
      {
        label: 'Ministerul Sanatatii public health portal',
        url: 'https://www.ms.ro/',
        note:
          'The Romanian Ministry of Health publishes the framework for public health insurance (CNAS), health facility oversight, and patient rights for residents.',
        verifiedAt: 'Current 2026 MS Romania portal',
      },
    ],
    familyBenefits: [
      {
        label: 'MMSS child allowance service page',
        url: 'https://servicii.mmuncii.gov.ro/servicii-beneficii/alocatia-de-stat-copii/',
        note:
          'The live MMSS service page says the benefit applies to any child, filings go through the Primarie, AJPIS has a 15-day legal processing window, and payments are made monthly on the published schedule.',
        verifiedAt: 'Current 2026 MMSS service portal',
        snapshotValue:
          'Official child-allowance service for any child; Primarie filing and monthly payment schedule published.',
        strictLines: [
          'Official child-allowance service for any child.',
          'Files are submitted through the Primarie and processed by AJPIS within 15 days.',
          'Published payment timing: 8-9 or 15-25 of each month.',
        ],
      },
      {
        label: 'Romania public services catalog',
        url: 'https://serviciipublice.gov.ro/serviciu/alocatie-de-stat-pentru-copii',
        note:
          'The national public-services catalog confirms ANPIS as the provider and points applicants to the live online service entry.',
        verifiedAt: 'Current 2026 ADR public service catalog',
      },
      {
        label: 'ANOFM employment and social protection agency',
        url: 'https://anofm.ro/',
        note:
          'ANOFM administers employment support programs, parental leave payments, and social protection benefits for Romanian workers and families.',
        verifiedAt: 'Current 2026 ANOFM portal',
      },
    ],
    communityVoices: [
      {
        label: 'Expatica Romania — Bucharest living guide',
        url: 'https://www.expatica.com/ro/',
        note:
          'Expatica Romania covers housing, healthcare registration, schools, childcare, and everyday family life in Bucharest from resident perspectives.',
        communitySource: true,
      },
      {
        label: 'InterNations Bucharest expat community',
        url: 'https://www.internations.org/bucharest-expats',
        note:
          'InterNations Bucharest connects residents and newcomers sharing relocation tips, neighbourhood impressions, and family-life experiences in Bucharest.',
        communitySource: true,
      },
      {
        label: 'r/Romania community forum',
        url: 'https://www.reddit.com/r/Romania/',
        note:
          'Active Reddit community where Romanians and international residents discuss housing, healthcare, family life, and everyday topics.',
        communitySource: true,
      },
      {
        label: 'Just Landed Romania relocation guide',
        url: 'https://www.justlanded.com/english/Romania',
        note:
          'Community-sourced guide covering residency registration, healthcare, childcare, schools, and neighbourhood choices in Bucharest.',
        communitySource: true,
      },
      {
        label: 'r/expats discussion on Romania',
        url: 'https://www.reddit.com/r/expats/',
        note:
          'The r/expats Reddit community includes first-hand accounts of relocating to Romania, covering bureaucracy, healthcare, and family integration.',
        communitySource: true,
      },
    ],
  },
  valencia: {
    housingCosts: [
      {
        label: 'Ajuntament de València housing portal',
        url: 'https://www.valencia.es/val/habitatge',
        note:
          'The Ajuntament de València housing portal covers social housing programmes, tenant rights, and local rental market information for the Valencia municipality.',
        verifiedAt: 'Current 2026 Ajuntament de València',
      },
      {
        label: 'Generalitat Valenciana habitatge portal',
        url: 'https://habitatge.gva.es/',
        note:
          'The Valencian Community housing authority publishes social housing listings, rental subsidy programmes, and regional housing statistics.',
        verifiedAt: 'Current 2026 Generalitat Valenciana',
      },
      ...numbeoBenchmarks.valencia.housingCosts,
    ],
    childcareCosts: [
      {
        label: 'Ajuntament de València escoles infantils',
        url: 'https://www.valencia.es/val/educacio/escoles-infantils',
        note:
          'The Ajuntament de València escoles infantils portal lists municipal 0-3 nursery places, fee schedules, and enrollment procedures.',
        verifiedAt: 'Current 2026 Ajuntament de València',
      },
      ...numbeoBenchmarks.valencia.childcareCosts,
    ],
    basketCosts: [
      {
        label: 'INE Índice de Precios de Consumo',
        url: 'https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736176802&menu=ultiDatos&idp=1254735976607',
        note:
          'INE publishes the Spanish monthly consumer price index covering food, beverages, clothing, household goods, and personal care items.',
        verifiedAt: 'Current 2026 INE CPI portal',
      },
      ...numbeoBenchmarks.valencia.basketCosts,
    ],
    mobilityCosts: [
      {
        label: 'Metrovalencia official fare table',
        url: 'https://www.metrovalencia.es/page.php?idioma=V&id=7',
        note:
          'Metrovalencia publishes the official fare grid for Valencia Metro and Tram (TRAM Metropolità de València), including zone pricing, monthly passes, and multi-trip cards.',
        verifiedAt: 'Current 2026 Metrovalencia',
      },
      {
        label: 'EMT Valencia bus fares',
        url: 'https://www.emtvalencia.es/ciudadano/index.php?option=com_wrapper&view=wrapper&Itemid=55&lang=es',
        note:
          'EMT Valencia publishes the municipal bus fare table, single journey prices, and the integrated TÍTOL bonobús card details.',
        verifiedAt: 'Current 2026 EMT Valencia',
      },
    ],
    healthcareAccess: [
      {
        label: 'Hospital Universitari i Politècnic La Fe',
        url: 'https://www.lafe.san.gva.es/',
        note:
          'Hospital La Fe is the largest and most specialised hospital in the Valencian Community, providing emergency, paediatric, maternity, oncology, and complex specialist care.',
        verifiedAt: 'Current 2026 Hospital La Fe portal',
      },
      {
        label: 'Conselleria de Sanitat — SIP card registration',
        url: 'https://www.san.gva.es/web/dgsp/tarjeta-sip',
        note:
          'The Valencian Community health authority explains SIP (Tarjeta Sanitaria Individual) registration requirements for EU residents.',
        verifiedAt: 'Current 2026 Conselleria de Sanitat',
      },
    ],
    familyBenefits: [
      {
        label: 'IMSERSO — Prestación por hijo a cargo',
        url: 'https://imserso.es/imserso_01/prestaciones/prestaciones_no_contributivas/hijo_a_cargo/index.htm',
        note:
          'IMSERSO explains the Spanish non-contributory child benefit (EUR100/month per child under 18 for income-tested households).',
        verifiedAt: 'Current 2026 IMSERSO portal',
      },
      {
        label: 'AEAT — Deducción por maternidad',
        url: 'https://www.agenciatributaria.es/AEAT.internet/Inicio/Ayuda/Manuales__Folletos_y_Videos/Manuales_de_ayuda_a_la_presentacion/Ejercicio_2025/Folleto_Rentas_del_Trabajo/5__Deducciones_generales_de_la_cuota/5_1__Deduccion_por_maternidad/5_1__Deduccion_por_maternidad.shtml',
        note:
          'AEAT confirms the deducción por maternidad of up to EUR1,200/year for working mothers with children under 3.',
        verifiedAt: 'Current 2026 AEAT portal',
      },
    ],
    communityVoices: [
      {
        label: 'Expatica Spain — Valencia living guide',
        url: 'https://www.expatica.com/es/',
        note:
          'Expatica Spain covers NIE registration, housing, healthcare, schooling, and family life in Spain from resident perspectives.',
        communitySource: true,
      },
      {
        label: 'InterNations Valencia expat community',
        url: 'https://www.internations.org/valencia-expats',
        note:
          'InterNations Valencia connects residents and newcomers sharing relocation experiences, neighbourhood insights, and family-life tips.',
        communitySource: true,
      },
      {
        label: 'r/Valencia community forum',
        url: 'https://www.reddit.com/r/Valencia/',
        note:
          'Local Reddit community for Valencia residents discussing neighbourhood life, housing, transport, and everyday family topics.',
        communitySource: true,
      },
      {
        label: 'r/SpainExpats community forum',
        url: 'https://www.reddit.com/r/SpainExpats/',
        note:
          'Reddit community for expats in Spain with threads on NIE, Padrón, healthcare registration, tax filing, and family relocation experiences.',
        communitySource: true,
      },
    ],
  },
};
