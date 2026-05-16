export const westernCityConfigs = [
	{
		key: 'malaga',
		city: 'Malaga',
		country: 'Spain',
		profileKey: 'spain',
		tagline: 'Sun, milder climate, and improving urban life appeal, but wages and childcare value are weaker than the postcard suggests.',
		benchmark: {
			url: 'https://www.numbeo.com/cost-of-living/in/Malaga',
			observedAt: 'Last update 4 May 2026',
			familyOfFour: 'EUR2,625.9/month',
			monthlyPass: 'EUR23.95/month',
			oneWay: 'EUR1.40',
			preschool: 'EUR729.78/month',
			rent3Outside: 'EUR1,401/month',
			buyCentre: 'EUR4,424.54',
			buyOutside: 'EUR2,586.25',
		},
		safety: {
			crimeIndex: 31.19,
			safetyIndex: 68.81,
		},
		pollution: {
			pm25: 8,
			airQualityIndex: 75,
			pollutionIndex: 35.57,
		},
		parkScore: 72,
		climateBase: 8.4,
		airFallbackScore: 8.4,
		carNeed: 'Low',
		bikeScore: 6,
		bikeNarrative: 'Cycling works in flatter corridors, but heat, hills, and road design still make the network less universal than the best northern peers.',
		transitSummary:
			'Metro, buses, and Cercanias cover key corridors, though the city is still easier without a car only in the better-connected districts.',
		personality:
			'Sunny, social, and easier on the nervous system than many northern metros. Malaga offers climate pull and decent everyday ease, but not a high-income engine.',
		fittingIn:
			'Spanish still matters for full integration, even though the city is comfortable with international residents and remote workers. Social life is easier in public space than in more reserved northern cities.',
		good: [
			'Strong climate and outdoor-living upside.',
			'Low transport burn and good family safety compared with many similarly popular coastal cities.',
			'Better air and daily weather resilience than the Po Valley or Bucharest-style tradeoffs.',
			'Growing tech and international employer presence is making the city a more credible remote-work base year-round.',
		],
		bad: [
			'Preschool benchmark is high relative to the local wage base.',
			'The job market is improving, but salary upside is still weaker than in Germany or Edinburgh.',
			'Housing no longer feels cheap once expat and tourism demand are priced in.',
			'Summer heat intensity is rising, and urban heat-island effects reduce outdoor comfort during the longest work months.',
		],
		areas: ['El Limonar', 'Teatinos'],
		hospitals: ['Hospital Regional Universitario de Malaga', 'Hospital Materno Infantil de Malaga'],
		higherEducation:
			'University of Malaga gives the city a credible public higher-ed anchor, though the wider economy is still more services-led than research-led.',
		hospitalQuality:
			'The public hospital and maternal-pediatric network are strong enough for family confidence, especially relative to the citys wage base.',
		natureConnectivity:
			'Beaches, hills, and easy outdoor access are the core appeal, with family weather windows that stay open for much more of the year.',
		traffic:
			'Typical commute 20-35 minutes. Daily life is easiest without a car in the better-connected inner districts.',
		fifteenMinute: 'Yes in many central and inner-family districts.',
		jobMarket:
			'Tech growth, tourism, health, and services are helping, but wages and employer depth are still weaker than the German and top UK comparators.',
		weather: 'Summer high about 31C | winter low about 9C | sunny days about 300/year.',
		extremeWeather:
			'Heatwaves and drought stress matter more than cold or flood exposure, though the city still stays resilient by broader southern-European standards.',
		futureProofing:
			'Climate comfort, walkable central districts, and lower transport burn help Malaga, but wage depth remains the main long-run question.',
		culture:
			'Outdoor social life, later rhythms, and easy public space can be a major quality-of-life upgrade for families coming from colder, more closed urban cultures.',
		community:
			'Family life is visible in parks, promenades, and cafes, though English-first integration still has limits outside the expat belt.',
		moveHereIf:
			'You want sun, lower transport friction, and a gentler day-to-day pace more than you want northern-European salary upside.',
		stayAwayIf:
			'You need the strongest childcare value, a very deep employer base, or low-expat housing pressure.',
		city360Extras: {
			violentCrime:
				'Violent crime is low in family residential districts. Pickpocketing in tourist areas is the main concern, but away from the historic centre this is rarely a daily worry for families.',
			propertyCrime:
				'Property theft is moderate in busy tourist zones. Family suburbs like Churriana and Campanillas see significantly lower rates than the city centre.',
			publicSpaceSafety:
				'Public spaces and parks are generally clean and safe. The seafront and urban park investment is visible. Homeless presence is visible in central areas but not aggressive in residential family zones.',
			trafficSafety:
				'Traffic can be dense near the ring road and port access routes. Pedestrian crossings in family areas are generally well-marked but driver compliance varies.',
			topographyWalkability:
				'Central Málaga is flat and stroller-friendly near the seafront. Hillier residential suburbs above the ring road add physical effort. Newer western suburbs are generally flat and accessible.',
			precipitationPatterns:
				'Very low annual rainfall — about 470mm/year, mostly in autumn and winter. Long dry summers exceeding 6 months. Grey-sky days are rare, with sunshine exceeding 3,000 hours/year.',
			semiCentralAreas: 'El Palo, Pedregalejos',
			suburbanCostDifferential:
				'A 2-bedroom flat in Churriana or the western suburbs runs EUR150-200/month less than comparable city-centre stock, with significantly lower daily noise and traffic.',
			purchasingPowerIndex:
				'Málaga\'s purchasing power sits below northern European cities, but local costs in non-tourist residential areas remain manageable for families with a remote or European salary.',
		},
	},
	{
		key: 'bristol',
		city: 'Bristol',
		country: 'United Kingdom',
		profileKey: 'uk',
		tagline: 'Strong employer base and green lifestyle pull, but childcare and housing costs eat the UKs salary upside.',
		benchmark: {
			url: 'https://www.numbeo.com/cost-of-living/in/Bristol',
			observedAt: 'Last update 4 May 2026',
			familyOfFour: 'GBP3,082.2/month',
			monthlyPass: 'GBP91/month',
			oneWay: 'GBP2.50',
			preschool: 'GBP1,762/month',
			rent3Outside: 'GBP1,718/month',
			buyCentre: 'GBP5,155.56',
			buyOutside: 'GBP3,928.89',
		},
		safety: {
			crimeIndex: 43.29,
			safetyIndex: 56.71,
		},
		pollution: {
			pm25: 13,
			airQualityIndex: 54.49,
			pollutionIndex: 47.44,
		},
		parkScore: 74,
		climateBase: 6.7,
		airFallbackScore: 6.7,
		carNeed: 'Low to medium',
		bikeScore: 6,
		bikeNarrative: 'Cycling culture is visible, but hills and patchy protection still stop the network from feeling universally family-easy.',
		transitSummary:
			'Buses and local rail keep some corridors workable, but day-to-day family life is still less frictionless than in Edinburgh or the best continental peers.',
		personality:
			'Creative, educated, and green-leaning. Bristol has strong quality-of-life signals, but the household cost stack is harsher than the vibe suggests.',
		fittingIn:
			'Language is not the issue here; the real integration filters are housing access, school catchment, and whether the job package can actually support the city.',
		good: [
			'Strong employer base across tech, aerospace, health, and education.',
			'Good green-city feel for a UK regional metro.',
			'Language friction is minimal compared with the continental roster.',
			'Creative, green, and university-anchored civic culture gives the city disproportionate quality relative to its size.',
		],
		bad: [
			'Childcare benchmark is among the harshest in the expansion wave.',
			'Transport is workable but not truly low-friction for all districts.',
			'Housing pressure and childcare can erase much of the salary upside.',
			'NHS primary care access lags behind many continental peers, adding private health top-ups as a practical household cost.',
		],
		areas: ['Redland', 'Westbury-on-Trym'],
		hospitals: ['Bristol Royal Hospital for Children', 'Southmead Hospital'],
		higherEducation:
			'University of Bristol and UWE Bristol give the city very strong resident higher-ed depth for a regional UK metro.',
		hospitalQuality:
			'The childrens hospital and wider teaching-hospital base are strong; the friction is NHS speed rather than clinical seriousness.',
		natureConnectivity:
			'Parks, nearby countryside, and southwest weekend access are good, even if daily terrain is less stroller-perfect than flatter cities.',
		traffic:
			'Typical commute 30-45 minutes. Car-light life works in the best districts, but citywide reliability still feels mixed.',
		fifteenMinute: 'Partial rather than citywide yes.',
		jobMarket:
			'Tech, aerospace, education, and health create a strong employer base and real salary upside for the right household profile.',
		weather: 'Summer high about 22C | winter low about 3C | sunny days about 145/year.',
		extremeWeather:
			'Rain, storm events, and damp rather than extreme heat define the resilience profile.',
		futureProofing:
			'Employer depth and green-city culture are positives, but cost pressure and infrastructure strain stop Bristol from feeling fully future-proof.',
		culture:
			'The city is creative and family-visible, though the practical experience still depends heavily on whether the budget can match the image.',
		community:
			'Parks, schools, and civic institutions are strong, but competition for the best catchments and rentals is relentless.',
		moveHereIf:
			'You have a strong UK income path and want an educated, green, English-speaking city outside London.',
		stayAwayIf:
			'You need childcare value or truly seamless public transport to do the heavy lifting for family life.',
		city360Extras: {
			violentCrime:
				'Violent crime in Bristol is generally concentrated in specific city-centre zones at night. Family suburbs like Clifton, Redland, and Stoke Bishop have very low day-to-day violent risk.',
			propertyCrime:
				'Vehicle and property crime in inner-city zones is above the UK average, but family suburban areas run closer to national norms. Secure parking reduces vehicle risk substantially.',
			publicSpaceSafety:
				'Well-maintained parks and pedestrian areas in the family west and northwest. Some city-centre zones and parts of south Bristol feel less polished, especially at night.',
			trafficSafety:
				'Bristol\'s road network can be congested on radial routes. The city\'s expanded cycle network has improved safety. Pedestrian infrastructure is generally adequate in family neighborhoods.',
			topographyWalkability:
				'Bristol\'s iconic hills are a real stroller-limiting terrain in Clifton and Redland. The waterfront, Stoke Bishop, and Easton areas are noticeably flatter. Factor gradient carefully when choosing a neighborhood.',
			precipitationPatterns:
				'Wet and mild Atlantic climate — about 800mm/year rainfall spread across all seasons, with extended grey spells in autumn and winter. Summers are warm but rarely hot by Southern European standards.',
			semiCentralAreas: 'Redland, Cotham',
			suburbanCostDifferential:
					'Stoke Bishop and Henleaze run EUR175-350/month less in rent than comparable Clifton or Redland flats, with large family houses that would cost a significant premium nearer the centre.',
			purchasingPowerIndex:
				'Bristol sits above the UK national median for purchasing power but well below London. The GBP gives strong transactional power versus the EU roster cities after currency adjustment for families earning in pounds.',
		},
	},
	{
		key: 'edinburgh',
		city: 'Edinburgh',
		country: 'United Kingdom',
		profileKey: 'uk',
		tagline: 'High-quality urban fabric and good safety, but childcare and rent pressure stay stubborn.',
		benchmark: {
			url: 'https://www.numbeo.com/cost-of-living/in/Edinburgh',
			observedAt: 'Last update 4 May 2026',
			familyOfFour: 'GBP3,141.1/month',
			monthlyPass: 'GBP73/month',
			oneWay: 'GBP2.20',
			preschool: 'GBP1,301.27/month',
			rent3Outside: 'GBP1,540.62/month',
			buyCentre: 'GBP4,981.68',
			buyOutside: 'GBP3,571.50',
		},
		safety: {
			crimeIndex: 30.54,
			safetyIndex: 69.46,
		},
		pollution: {
			pm25: 9,
			airQualityIndex: null,
			pollutionIndex: null,
		},
		parkScore: 78,
		climateBase: 6.8,
		airFallbackScore: 7.1,
		carNeed: 'Low',
		bikeScore: 6,
		bikeNarrative: 'Cycling is better in selected corridors than across the full city; hills and winter weather still shape the real family experience.',
		transitSummary: 'Buses and the tram make central and inner-district life workable without a car, especially if the family pays for location.',
		personality:
			'Historic, polished, and institution-rich. Edinburgh feels unusually high-quality for a city its size, but it is not a cheap route into that quality.',
		fittingIn:
			'Language removes the first barrier, but the real filters are housing competition and school catchment. The city is welcoming enough, though not especially cheap or casual about logistics.',
		good: [
			'Strong day-to-day safety for a UK city.',
			'Excellent public realm, architecture, and cultural depth.',
			'Good employer base across finance, public sector, education, and tech.',
			'NHS hospital network keeps clinical confidence higher than most UK peers despite known access speed friction.',
		],
		bad: [
			'Childcare is still very expensive even before inflation psychology is added.',
			'Housing is tight enough that the city can feel more exclusive than it first appears.',
			'Weather and winter light are real quality-of-life costs for some households.',
			'Tourism and festival-season crowding make the center periodically far more stressful than the rest-of-year rhythm would suggest.',
		],
		areas: ['Stockbridge', 'Morningside'],
		hospitals: ['Royal Hospital for Children and Young People', 'Royal Infirmary of Edinburgh'],
		higherEducation:
			'University of Edinburgh and Heriot-Watt make the city one of the strongest resident higher-ed platforms in the UK outside London.',
		hospitalQuality:
			'Hospital quality is strong, and the pediatric network is credible; the real friction is still NHS timing and access speed.',
		natureConnectivity:
			'Large parks, nearby hills, and quick Scottish weekend escapes give the city unusually good green relief for a capital.',
		traffic:
			'Typical commute 25-40 minutes. A car is optional in the core but not always desirable once parking and congestion are counted.',
		fifteenMinute: 'Yes in selected inner districts.',
		jobMarket:
			'Finance, public institutions, education, and tech give Edinburgh stable job-market depth and acceptable salary upside for the UK outside London.',
		weather: 'Summer high about 19C | winter low about 1C | sunny days about 140/year.',
		extremeWeather:
			'Wind, rain, and low-light winters matter more than heat or drought, and they meaningfully shape family routine.',
		futureProofing:
			'The city scores well on institutions and public realm, but childcare economics and housing scarcity cap the upside.',
		culture:
			'Edinburgh is culturally rich and family-visible, though festival-season crowding and tourism change the rhythm of the center.',
		community:
			'Parks, libraries, schools, and neighborhood identity are strong, but the housing market still sets the real terms of access.',
		moveHereIf:
			'You want a safe, high-quality English-speaking city with strong institutions and can manage UK childcare costs.',
		stayAwayIf:
			'You need the cheapest budget path or dislike grey, windy winters.',
		city360Extras: {
			violentCrime:
				'Edinburgh has one of the better safety profiles of any UK major city. Central Edinburgh and tourist zones see nuisance, but family suburbs (Marchmont, Morningside, Corstorphine) have very low day-to-day violent risk.',
			propertyCrime:
				'Vehicle and property crime in family areas is at or below the Scottish average. Well-secured residences in family suburbs face minimal daily-life property risk.',
			publicSpaceSafety:
				'Edinburgh\'s public spaces are generally clean and well-maintained. The city centre and tourist core are busy but well-managed. Princes Street Gardens and the Meadows are family-accessible green spaces with strong safety confidence.',
			trafficSafety:
				'Edinburgh\'s road network manages well relative to its urban scale. Tram expansion has reduced some bus traffic pressure. Pedestrian infrastructure is generally solid in family neighborhoods.',
			topographyWalkability:
				'Edinburgh has notable hills (Castle Rock, Calton Hill, Arthur\'s Seat). Flat alternatives exist in Leith, Bruntsfield, and Corstorphine. Stroller logistics depend heavily on neighborhood choice.',
			precipitationPatterns:
				'Cool, variable Atlantic climate — about 700mm/year, distributed across all seasons but particularly concentrated in autumn and winter. Wind and grey skies are persistent features; sunny periods are genuinely appreciated.',
			semiCentralAreas: 'Bruntsfield, Tollcross',
			suburbanCostDifferential:
				'Corstorphine and Gilmerton run EUR234-410/month less than comparable Marchmont or Morningside rentals. South Queensferry and Dalkeith offer further family value further out.',
			purchasingPowerIndex:
				'Edinburgh sits above the UK national median and significantly above most EU roster cities in transactional purchasing power for families arriving with or earning in pounds.',
		},
	},
];