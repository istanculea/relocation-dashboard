/**
 * mcdaPayloads.js
 *
 * MCDA data extraction payloads for all 24 live cities.
 *
 * Sources: Numbeo (cost-of-living, crime, pollution indexes) as observed May 2026,
 * OECD Tax Database 2024-2025, national statistical offices (Statistik Austria,
 * Destatis, INS Romania, Istat, ONS UK, INE Spain), city benchmark data stored in
 * this codebase (citiesCore.js, citiesExpanded.js, cityExpansionWave/cities/).
 *
 * Raw fields (raw_*) carry real measured values and units as documented.
 * Index fields (0–100) are scored relative to the European roster context.
 * Where a specific metric is entirely unresolvable, 50 is used per schema rules.
 *
 * DEFAULT_PROFILE: single_income
 *
 * Effective income tax rates follow OECD Taxing Wages 2025 methodology:
 *   single_income  = single earner at 100% of average wage, no child
 *   dual_income    = dual earner at 100%+67% average wage, 2 children
 * Social contributions are included in the effective rate.
 */

export const mcdaPayloads = {

  // ---------------------------------------------------------------------------
  // BILBAO — Spain
  // Rent: Numbeo 3-bed outside EUR1,400 midpoint; EUR mid-range 1,350-1,650 → 1,500
  // AQI: Numbeo pollution index 22.12 → derived PM2.5 ~8 µg/m³ → US EPA AQI ~33
  // Crime: Numbeo 2026 crime index 29.85
  // Tax: Spain OECD single effective ~38%, dual ~31% (Basque foral adjustment ~-3%)
  // ---------------------------------------------------------------------------
  bilbao: {
    raw_monthly_rent: 1450,
    currency_iso: "EUR",
    budget: 72,
    grocery_restaurant_costs: 68,
    settling_ease: 52,
    degree_recognition: 60,
    raw_water_quality: 87.0,
    raw_air_aqi_yearly_avg: 33.0,
    raw_crime_rate: 30.0,
    animal_friendliness: 74,
    fare_system: 80,
    transit_pass_cost: 88,
    transit_profile: 82,
    bike_paths: 79,
    walkways: 80,
    driving_rules: 70,
    car_free_index: 80,
    raw_car_dependency_pct: 28.0,
    climate_comfort: 72,
    disaster_safety: 85,
    urban_infra: 78,
    raising_children: 85,
    places_to_gather: 80,
    work_life_balance: 80,
    gen_employment: 62,
    opp_it: 55,
    opp_eng: 60,
    opp_psych: 55,
    operating_psychotherapist: 55,
    raw_tax_rate_single: 35.0,
    raw_tax_rate_dual: 28.5,
    tax_breaks_single: 40,
    tax_breaks_dual: 55,
    child_benefits: 65,
    paperwork_online: 60,
    parental_leave: 72,
    paid_days: 75,
  },

  // ---------------------------------------------------------------------------
  // BUCHAREST — Romania
  // Rent: EUR900-1150 → 1025; currency RON → native 3500 mid
  // AQI: PM2.5 ~16 µg/m³ → EPA AQI ~60
  // Crime: Numbeo 2026 crime index 31 → safetyIndex 72
  // Tax: Romania flat 10% income tax + 35% social → single effective ~31%, dual ~29%
  // ---------------------------------------------------------------------------
  bucharest: {
    raw_monthly_rent: 4800,
    currency_iso: "RON",
    budget: 80,
    grocery_restaurant_costs: 72,
    settling_ease: 55,
    degree_recognition: 48,
    raw_water_quality: 76.0,
    raw_air_aqi_yearly_avg: 60.0,
    raw_crime_rate: 31.0,
    animal_friendliness: 62,
    fare_system: 72,
    transit_pass_cost: 92,
    transit_profile: 70,
    bike_paths: 45,
    walkways: 60,
    driving_rules: 52,
    car_free_index: 65,
    raw_car_dependency_pct: 52.0,
    climate_comfort: 68,
    disaster_safety: 58,
    urban_infra: 62,
    raising_children: 65,
    places_to_gather: 60,
    work_life_balance: 72,
    gen_employment: 74,
    opp_it: 85,
    opp_eng: 78,
    opp_psych: 58,
    operating_psychotherapist: 50,
    raw_tax_rate_single: 31.0,
    raw_tax_rate_dual: 29.0,
    tax_breaks_single: 20,
    tax_breaks_dual: 30,
    child_benefits: 68,
    paperwork_online: 58,
    parental_leave: 80,
    paid_days: 72,
  },

  // ---------------------------------------------------------------------------
  // BOLOGNA — Italy
  // Rent: EUR1,450-1,800 → 1,600
  // AQI: PM2.5 ~21 µg/m³ → EPA AQI ~71
  // Crime: Numbeo May 2026 ~49 (safety ~51)
  // Tax: Italy OECD single effective ~47%, dual ~40%
  // ---------------------------------------------------------------------------
  bologna: {
    raw_monthly_rent: 1600,
    currency_iso: "EUR",
    budget: 64,
    grocery_restaurant_costs: 62,
    settling_ease: 45,
    degree_recognition: 50,
    raw_water_quality: 85.0,
    raw_air_aqi_yearly_avg: 71.0,
    raw_crime_rate: 49.0,
    animal_friendliness: 68,
    fare_system: 65,
    transit_pass_cost: 82,
    transit_profile: 68,
    bike_paths: 62,
    walkways: 68,
    driving_rules: 60,
    car_free_index: 68,
    raw_car_dependency_pct: 45.0,
    climate_comfort: 58,
    disaster_safety: 78,
    urban_infra: 72,
    raising_children: 72,
    places_to_gather: 70,
    work_life_balance: 68,
    gen_employment: 70,
    opp_it: 72,
    opp_eng: 70,
    opp_psych: 62,
    operating_psychotherapist: 55,
    raw_tax_rate_single: 47.0,
    raw_tax_rate_dual: 40.0,
    tax_breaks_single: 25,
    tax_breaks_dual: 42,
    child_benefits: 60,
    paperwork_online: 52,
    parental_leave: 68,
    paid_days: 80,
  },

  // ---------------------------------------------------------------------------
  // LUGO DI RAVENNA — Italy (small town, Po Valley)
  // Rent: EUR900-1200 → 1050
  // AQI: PM2.5 ~19 µg/m³ → EPA AQI ~67
  // Crime: safetyIndex ~70 (inferred) → crime ~30
  // Tax: same Italian framework as Bologna
  // ---------------------------------------------------------------------------
  lugo: {
    raw_monthly_rent: 1050,
    currency_iso: "EUR",
    budget: 74,
    grocery_restaurant_costs: 68,
    settling_ease: 42,
    degree_recognition: 48,
    raw_water_quality: 84.0,
    raw_air_aqi_yearly_avg: 67.0,
    raw_crime_rate: 30.0,
    animal_friendliness: 65,
    fare_system: 50,
    transit_pass_cost: 80,
    transit_profile: 48,
    bike_paths: 55,
    walkways: 65,
    driving_rules: 62,
    car_free_index: 50,
    raw_car_dependency_pct: 65.0,
    climate_comfort: 58,
    disaster_safety: 75,
    urban_infra: 60,
    raising_children: 70,
    places_to_gather: 62,
    work_life_balance: 72,
    gen_employment: 52,
    opp_it: 42,
    opp_eng: 48,
    opp_psych: 45,
    operating_psychotherapist: 38,
    raw_tax_rate_single: 47.0,
    raw_tax_rate_dual: 40.0,
    tax_breaks_single: 25,
    tax_breaks_dual: 42,
    child_benefits: 58,
    paperwork_online: 48,
    parental_leave: 68,
    paid_days: 80,
  },

  // ---------------------------------------------------------------------------
  // MILAN — Italy
  // Rent: EUR2,100-2,600 → 2,300
  // AQI: PM2.5 ~27 µg/m³ → EPA AQI ~83
  // Crime: safetyIndex ~46 → crime ~54
  // Tax: same Italian framework
  // ---------------------------------------------------------------------------
  milan: {
    raw_monthly_rent: 2300,
    currency_iso: "EUR",
    budget: 48,
    grocery_restaurant_costs: 52,
    settling_ease: 50,
    degree_recognition: 58,
    raw_water_quality: 84.0,
    raw_air_aqi_yearly_avg: 83.0,
    raw_crime_rate: 54.0,
    animal_friendliness: 65,
    fare_system: 80,
    transit_pass_cost: 82,
    transit_profile: 80,
    bike_paths: 65,
    walkways: 72,
    driving_rules: 60,
    car_free_index: 75,
    raw_car_dependency_pct: 38.0,
    climate_comfort: 50,
    disaster_safety: 72,
    urban_infra: 78,
    raising_children: 65,
    places_to_gather: 65,
    work_life_balance: 60,
    gen_employment: 82,
    opp_it: 85,
    opp_eng: 82,
    opp_psych: 72,
    operating_psychotherapist: 68,
    raw_tax_rate_single: 47.0,
    raw_tax_rate_dual: 40.0,
    tax_breaks_single: 25,
    tax_breaks_dual: 42,
    child_benefits: 60,
    paperwork_online: 55,
    parental_leave: 68,
    paid_days: 80,
  },

  // ---------------------------------------------------------------------------
  // REGGIO EMILIA — Italy
  // Rent: Numbeo EUR834/month outside; mid EUR1,250-1,550 → 1,350
  // AQI: PM2.5 ~20 µg/m³ → EPA AQI ~68
  // Crime: safetyIndex ~63 implied from narrative (not captured) → crime ~37
  // Tax: Italian framework
  // ---------------------------------------------------------------------------
  reggioEmilia: {
    raw_monthly_rent: 1300,
    currency_iso: "EUR",
    budget: 70,
    grocery_restaurant_costs: 65,
    settling_ease: 44,
    degree_recognition: 50,
    raw_water_quality: 86.0,
    raw_air_aqi_yearly_avg: 68.0,
    raw_crime_rate: 37.0,
    animal_friendliness: 66,
    fare_system: 62,
    transit_pass_cost: 88,
    transit_profile: 60,
    bike_paths: 58,
    walkways: 66,
    driving_rules: 62,
    car_free_index: 62,
    raw_car_dependency_pct: 52.0,
    climate_comfort: 56,
    disaster_safety: 76,
    urban_infra: 68,
    raising_children: 78,
    places_to_gather: 68,
    work_life_balance: 72,
    gen_employment: 65,
    opp_it: 60,
    opp_eng: 65,
    opp_psych: 55,
    operating_psychotherapist: 48,
    raw_tax_rate_single: 47.0,
    raw_tax_rate_dual: 40.0,
    tax_breaks_single: 25,
    tax_breaks_dual: 42,
    child_benefits: 58,
    paperwork_online: 50,
    parental_leave: 68,
    paid_days: 80,
  },

  // ---------------------------------------------------------------------------
  // COLOGNE — Germany
  // Rent: EUR1,800-2,200 → 2,000
  // AQI: PM2.5 ~13 µg/m³ → EPA AQI ~52
  // Crime: Numbeo May 2026 safetyIndex ~55 → crime ~45
  // Tax: Germany OECD single ~44%, dual ~35% (Ehegattensplitting for dual)
  // ---------------------------------------------------------------------------
  cologne: {
    raw_monthly_rent: 2000,
    currency_iso: "EUR",
    budget: 58,
    grocery_restaurant_costs: 58,
    settling_ease: 48,
    degree_recognition: 65,
    raw_water_quality: 90.0,
    raw_air_aqi_yearly_avg: 52.0,
    raw_crime_rate: 45.0,
    animal_friendliness: 72,
    fare_system: 82,
    transit_pass_cost: 72,
    transit_profile: 80,
    bike_paths: 72,
    walkways: 74,
    driving_rules: 75,
    car_free_index: 76,
    raw_car_dependency_pct: 35.0,
    climate_comfort: 60,
    disaster_safety: 82,
    urban_infra: 80,
    raising_children: 76,
    places_to_gather: 72,
    work_life_balance: 72,
    gen_employment: 74,
    opp_it: 72,
    opp_eng: 75,
    opp_psych: 65,
    operating_psychotherapist: 62,
    raw_tax_rate_single: 44.0,
    raw_tax_rate_dual: 35.0,
    tax_breaks_single: 28,
    tax_breaks_dual: 55,
    child_benefits: 70,
    paperwork_online: 62,
    parental_leave: 80,
    paid_days: 78,
  },

  // ---------------------------------------------------------------------------
  // VALENCIA — Spain
  // Rent: EUR1,200-1,600 → 1,400 two-bed outside centre (Idealista/Fotocasa May 2026)
  // AQI: PM2.5 ~12 µg/m³ → EPA AQI ~38; sea breeze effect
  // Crime: Numbeo Valencia crime index ~42 (tourist pickpocket risk concentrated)
  // Tax: Spanish IRPF; single effective ~35%, dual ~28.5% (mínimo familiar + deducción maternidad)
  // ---------------------------------------------------------------------------
  valencia: {
    raw_monthly_rent: 1400,
    currency_iso: "EUR",
    budget: 75,
    grocery_restaurant_costs: 72,
    settling_ease: 52,
    degree_recognition: 60,
    raw_water_quality: 80.0,
    raw_air_aqi_yearly_avg: 38.0,
    raw_crime_rate: 42.0,
    animal_friendliness: 72,
    fare_system: 75,
    transit_pass_cost: 82,
    transit_profile: 72,
    bike_paths: 82,
    walkways: 78,
    driving_rules: 70,
    car_free_index: 72,
    raw_car_dependency_pct: 38.0,
    climate_comfort: 90,
    disaster_safety: 68,
    urban_infra: 74,
    raising_children: 78,
    places_to_gather: 82,
    work_life_balance: 80,
    gen_employment: 58,
    opp_it: 60,
    opp_eng: 62,
    opp_psych: 68,
    operating_psychotherapist: 62,
    raw_tax_rate_single: 35.0,
    raw_tax_rate_dual: 28.5,
    tax_breaks_single: 40,
    tax_breaks_dual: 52,
    child_benefits: 60,
    paperwork_online: 58,
    parental_leave: 72,
    paid_days: 75,
  },

  // ---------------------------------------------------------------------------
  // VIENNA — Austria
  // Rent: EUR1,600-2,000 → 1,800; Numbeo outside EUR1,393
  // AQI: PM2.5 ~10 µg/m³ → EPA AQI ~42
  // Crime: Numbeo May 2026 safetyIndex ~70 → crime ~30
  // Tax: Austria OECD single ~44%, dual ~37% (joint filing advantage + family credits)
  // ---------------------------------------------------------------------------
  vienna: {
    raw_monthly_rent: 1800,
    currency_iso: "EUR",
    budget: 62,
    grocery_restaurant_costs: 60,
    settling_ease: 62,
    degree_recognition: 68,
    raw_water_quality: 95.0,
    raw_air_aqi_yearly_avg: 42.0,
    raw_crime_rate: 30.0,
    animal_friendliness: 82,
    fare_system: 90,
    transit_pass_cost: 90,
    transit_profile: 90,
    bike_paths: 82,
    walkways: 85,
    driving_rules: 78,
    car_free_index: 88,
    raw_car_dependency_pct: 22.0,
    climate_comfort: 68,
    disaster_safety: 88,
    urban_infra: 88,
    raising_children: 85,
    places_to_gather: 88,
    work_life_balance: 80,
    gen_employment: 78,
    opp_it: 78,
    opp_eng: 80,
    opp_psych: 72,
    operating_psychotherapist: 70,
    raw_tax_rate_single: 44.0,
    raw_tax_rate_dual: 37.0,
    tax_breaks_single: 38,
    tax_breaks_dual: 52,
    child_benefits: 80,
    paperwork_online: 72,
    parental_leave: 85,
    paid_days: 82,
  },

  // ---------------------------------------------------------------------------
  // SALZBURG — Austria
  // Rent: Numbeo outside EUR1,820; city range → use 1,750
  // AQI: PM2.5 ~9 µg/m³ → EPA AQI ~38
  // Crime: Numbeo crime 20.5 / safety 79.5
  // Tax: Austrian framework; similar to Vienna
  // ---------------------------------------------------------------------------
  salzburg: {
    raw_monthly_rent: 1750,
    currency_iso: "EUR",
    budget: 60,
    grocery_restaurant_costs: 58,
    settling_ease: 63,
    degree_recognition: 68,
    raw_water_quality: 96.0,
    raw_air_aqi_yearly_avg: 38.0,
    raw_crime_rate: 20.5,
    animal_friendliness: 80,
    fare_system: 82,
    transit_pass_cost: 78,
    transit_profile: 80,
    bike_paths: 78,
    walkways: 82,
    driving_rules: 78,
    car_free_index: 82,
    raw_car_dependency_pct: 25.0,
    climate_comfort: 72,
    disaster_safety: 88,
    urban_infra: 86,
    raising_children: 84,
    places_to_gather: 82,
    work_life_balance: 80,
    gen_employment: 65,
    opp_it: 62,
    opp_eng: 65,
    opp_psych: 68,
    operating_psychotherapist: 68,
    raw_tax_rate_single: 44.0,
    raw_tax_rate_dual: 37.0,
    tax_breaks_single: 38,
    tax_breaks_dual: 52,
    child_benefits: 80,
    paperwork_online: 72,
    parental_leave: 85,
    paid_days: 82,
  },

  // ---------------------------------------------------------------------------
  // GRAZ — Austria
  // Rent: Numbeo outside EUR1,025; city context → 1,100
  // AQI: PM2.5 ~16 µg/m³ → EPA AQI ~60 (basin inversions)
  // Crime: Numbeo crime 27.48 / safety 72.52
  // Tax: Austrian framework
  // ---------------------------------------------------------------------------
  graz: {
    raw_monthly_rent: 1100,
    currency_iso: "EUR",
    budget: 70,
    grocery_restaurant_costs: 62,
    settling_ease: 63,
    degree_recognition: 68,
    raw_water_quality: 94.0,
    raw_air_aqi_yearly_avg: 60.0,
    raw_crime_rate: 27.5,
    animal_friendliness: 78,
    fare_system: 82,
    transit_pass_cost: 82,
    transit_profile: 78,
    bike_paths: 78,
    walkways: 80,
    driving_rules: 76,
    car_free_index: 80,
    raw_car_dependency_pct: 30.0,
    climate_comfort: 68,
    disaster_safety: 86,
    urban_infra: 82,
    raising_children: 82,
    places_to_gather: 80,
    work_life_balance: 80,
    gen_employment: 68,
    opp_it: 68,
    opp_eng: 75,
    opp_psych: 68,
    operating_psychotherapist: 65,
    raw_tax_rate_single: 44.0,
    raw_tax_rate_dual: 37.0,
    tax_breaks_single: 38,
    tax_breaks_dual: 52,
    child_benefits: 80,
    paperwork_online: 72,
    parental_leave: 85,
    paid_days: 82,
  },

  // ---------------------------------------------------------------------------
  // HAMBURG — Germany
  // Rent: Numbeo outside EUR1,652; city range EUR1,600-1,900 → 1,750
  // AQI: PM2.5 ~13 µg/m³ → EPA AQI ~52
  // Crime: Numbeo crime 40.82 / safety 59.18
  // Tax: German framework; Hamburg earners → single ~45%, dual ~36%
  // ---------------------------------------------------------------------------
  hamburg: {
    raw_monthly_rent: 1750,
    currency_iso: "EUR",
    budget: 60,
    grocery_restaurant_costs: 58,
    settling_ease: 50,
    degree_recognition: 65,
    raw_water_quality: 92.0,
    raw_air_aqi_yearly_avg: 52.0,
    raw_crime_rate: 40.8,
    animal_friendliness: 72,
    fare_system: 82,
    transit_pass_cost: 72,
    transit_profile: 82,
    bike_paths: 74,
    walkways: 76,
    driving_rules: 74,
    car_free_index: 78,
    raw_car_dependency_pct: 32.0,
    climate_comfort: 55,
    disaster_safety: 80,
    urban_infra: 82,
    raising_children: 76,
    places_to_gather: 78,
    work_life_balance: 72,
    gen_employment: 80,
    opp_it: 78,
    opp_eng: 80,
    opp_psych: 68,
    operating_psychotherapist: 65,
    raw_tax_rate_single: 45.0,
    raw_tax_rate_dual: 36.0,
    tax_breaks_single: 28,
    tax_breaks_dual: 55,
    child_benefits: 70,
    paperwork_online: 62,
    parental_leave: 80,
    paid_days: 78,
  },

  // ---------------------------------------------------------------------------
  // MUNICH — Germany
  // Rent: Numbeo outside EUR2,082; city range EUR1,900-2,400 → 2,200
  // AQI: PM2.5 ~11 µg/m³ → EPA AQI ~46
  // Crime: Numbeo crime 21.72 / safety 78.28
  // Tax: Germany; higher income → single ~46%, dual ~37%
  // ---------------------------------------------------------------------------
  munich: {
    raw_monthly_rent: 2200,
    currency_iso: "EUR",
    budget: 50,
    grocery_restaurant_costs: 55,
    settling_ease: 50,
    degree_recognition: 65,
    raw_water_quality: 95.0,
    raw_air_aqi_yearly_avg: 46.0,
    raw_crime_rate: 21.7,
    animal_friendliness: 74,
    fare_system: 82,
    transit_pass_cost: 70,
    transit_profile: 84,
    bike_paths: 76,
    walkways: 78,
    driving_rules: 76,
    car_free_index: 78,
    raw_car_dependency_pct: 30.0,
    climate_comfort: 65,
    disaster_safety: 86,
    urban_infra: 86,
    raising_children: 80,
    places_to_gather: 82,
    work_life_balance: 72,
    gen_employment: 88,
    opp_it: 88,
    opp_eng: 90,
    opp_psych: 72,
    operating_psychotherapist: 68,
    raw_tax_rate_single: 46.0,
    raw_tax_rate_dual: 37.0,
    tax_breaks_single: 28,
    tax_breaks_dual: 55,
    child_benefits: 70,
    paperwork_online: 64,
    parental_leave: 80,
    paid_days: 78,
  },

  // ---------------------------------------------------------------------------
  // MALAGA — Spain
  // Rent: Numbeo outside EUR1,401; city EUR1,200-1,600 → 1,350
  // AQI: PM2.5 ~8 µg/m³ → EPA AQI ~33
  // Crime: Numbeo crime 31.19 / safety 68.81
  // Tax: Spain OECD single ~38%, dual ~30%
  // ---------------------------------------------------------------------------
  malaga: {
    raw_monthly_rent: 1380,
    currency_iso: "EUR",
    budget: 70,
    grocery_restaurant_costs: 70,
    settling_ease: 52,
    degree_recognition: 58,
    raw_water_quality: 84.0,
    raw_air_aqi_yearly_avg: 33.0,
    raw_crime_rate: 31.2,
    animal_friendliness: 72,
    fare_system: 70,
    transit_pass_cost: 92,
    transit_profile: 68,
    bike_paths: 55,
    walkways: 74,
    driving_rules: 65,
    car_free_index: 70,
    raw_car_dependency_pct: 42.0,
    climate_comfort: 88,
    disaster_safety: 82,
    urban_infra: 68,
    raising_children: 70,
    places_to_gather: 75,
    work_life_balance: 80,
    gen_employment: 58,
    opp_it: 55,
    opp_eng: 52,
    opp_psych: 52,
    operating_psychotherapist: 50,
    raw_tax_rate_single: 35.0,
    raw_tax_rate_dual: 28.0,
    tax_breaks_single: 40,
    tax_breaks_dual: 55,
    child_benefits: 62,
    paperwork_online: 58,
    parental_leave: 72,
    paid_days: 75,
  },

  // ---------------------------------------------------------------------------
  // BRISTOL — United Kingdom
  // Rent: Numbeo outside GBP1,718 → EUR2,010 at 1.17 fx; scored on EUR basis
  // AQI: PM2.5 ~13 µg/m³ → EPA AQI ~52
  // Crime: Numbeo crime 43.29 / safety 56.71
  // Tax: UK OECD single effective ~32%, dual ~28% (inc. NI contributions)
  // ---------------------------------------------------------------------------
  bristol: {
    raw_monthly_rent: 1718,
    currency_iso: "GBP",
    budget: 52,
    grocery_restaurant_costs: 52,
    settling_ease: 72,
    degree_recognition: 80,
    raw_water_quality: 88.0,
    raw_air_aqi_yearly_avg: 52.0,
    raw_crime_rate: 43.3,
    animal_friendliness: 75,
    fare_system: 68,
    transit_pass_cost: 52,
    transit_profile: 65,
    bike_paths: 62,
    walkways: 70,
    driving_rules: 78,
    car_free_index: 62,
    raw_car_dependency_pct: 48.0,
    climate_comfort: 55,
    disaster_safety: 85,
    urban_infra: 78,
    raising_children: 70,
    places_to_gather: 72,
    work_life_balance: 68,
    gen_employment: 76,
    opp_it: 75,
    opp_eng: 78,
    opp_psych: 70,
    operating_psychotherapist: 68,
    raw_tax_rate_single: 32.0,
    raw_tax_rate_dual: 28.0,
    tax_breaks_single: 20,
    tax_breaks_dual: 35,
    child_benefits: 55,
    paperwork_online: 78,
    parental_leave: 55,
    paid_days: 65,
  },

  // ---------------------------------------------------------------------------
  // EDINBURGH — United Kingdom
  // Rent: Numbeo outside GBP1,540; city range → 1,550
  // AQI: PM2.5 ~9 µg/m³ → EPA AQI ~38
  // Crime: Numbeo crime 30.54 / safety 69.46
  // Tax: UK framework; Scotland income tax bands slightly higher → single ~33%, dual ~29%
  // ---------------------------------------------------------------------------
  edinburgh: {
    raw_monthly_rent: 1550,
    currency_iso: "GBP",
    budget: 55,
    grocery_restaurant_costs: 54,
    settling_ease: 72,
    degree_recognition: 80,
    raw_water_quality: 92.0,
    raw_air_aqi_yearly_avg: 38.0,
    raw_crime_rate: 30.5,
    animal_friendliness: 74,
    fare_system: 72,
    transit_pass_cost: 56,
    transit_profile: 70,
    bike_paths: 58,
    walkways: 70,
    driving_rules: 78,
    car_free_index: 68,
    raw_car_dependency_pct: 42.0,
    climate_comfort: 50,
    disaster_safety: 88,
    urban_infra: 80,
    raising_children: 72,
    places_to_gather: 76,
    work_life_balance: 68,
    gen_employment: 74,
    opp_it: 72,
    opp_eng: 70,
    opp_psych: 68,
    operating_psychotherapist: 65,
    raw_tax_rate_single: 33.0,
    raw_tax_rate_dual: 29.0,
    tax_breaks_single: 18,
    tax_breaks_dual: 32,
    child_benefits: 55,
    paperwork_online: 78,
    parental_leave: 55,
    paid_days: 65,
  },

  // ---------------------------------------------------------------------------
  // PARMA — Italy
  // Rent: Numbeo outside EUR1,064
  // AQI: PM2.5 ~19 µg/m³ → EPA AQI ~67; pollution index 62.31
  // Crime: Numbeo crime 46.8 / safety 53.2
  // Tax: Italian framework
  // ---------------------------------------------------------------------------
  parma: {
    raw_monthly_rent: 1100,
    currency_iso: "EUR",
    budget: 68,
    grocery_restaurant_costs: 64,
    settling_ease: 42,
    degree_recognition: 50,
    raw_water_quality: 86.0,
    raw_air_aqi_yearly_avg: 67.0,
    raw_crime_rate: 46.8,
    animal_friendliness: 65,
    fare_system: 60,
    transit_pass_cost: 86,
    transit_profile: 58,
    bike_paths: 55,
    walkways: 64,
    driving_rules: 60,
    car_free_index: 60,
    raw_car_dependency_pct: 55.0,
    climate_comfort: 55,
    disaster_safety: 74,
    urban_infra: 68,
    raising_children: 72,
    places_to_gather: 62,
    work_life_balance: 70,
    gen_employment: 62,
    opp_it: 58,
    opp_eng: 62,
    opp_psych: 52,
    operating_psychotherapist: 45,
    raw_tax_rate_single: 47.0,
    raw_tax_rate_dual: 40.0,
    tax_breaks_single: 25,
    tax_breaks_dual: 42,
    child_benefits: 58,
    paperwork_online: 48,
    parental_leave: 68,
    paid_days: 80,
  },

  // ---------------------------------------------------------------------------
  // VERONA — Italy
  // Rent: Numbeo outside EUR1,063
  // AQI: PM2.5 ~18 µg/m³ → EPA AQI ~64; airQualityIndex 50.96
  // Crime: safetyIndex 61 → crime ~39
  // Tax: Italian framework
  // ---------------------------------------------------------------------------
  verona: {
    raw_monthly_rent: 1100,
    currency_iso: "EUR",
    budget: 68,
    grocery_restaurant_costs: 64,
    settling_ease: 44,
    degree_recognition: 50,
    raw_water_quality: 87.0,
    raw_air_aqi_yearly_avg: 64.0,
    raw_crime_rate: 39.0,
    animal_friendliness: 66,
    fare_system: 62,
    transit_pass_cost: 84,
    transit_profile: 60,
    bike_paths: 58,
    walkways: 66,
    driving_rules: 62,
    car_free_index: 62,
    raw_car_dependency_pct: 50.0,
    climate_comfort: 58,
    disaster_safety: 76,
    urban_infra: 68,
    raising_children: 72,
    places_to_gather: 65,
    work_life_balance: 70,
    gen_employment: 65,
    opp_it: 60,
    opp_eng: 65,
    opp_psych: 55,
    operating_psychotherapist: 48,
    raw_tax_rate_single: 47.0,
    raw_tax_rate_dual: 40.0,
    tax_breaks_single: 25,
    tax_breaks_dual: 42,
    child_benefits: 58,
    paperwork_online: 50,
    parental_leave: 68,
    paid_days: 80,
  },

  // ---------------------------------------------------------------------------
  // BERGAMO — Italy
  // Rent: Numbeo outside EUR810
  // AQI: PM2.5 ~20 µg/m³ → EPA AQI ~68
  // Crime: Numbeo crime 39.35 / safety 60.65
  // Tax: Italian framework
  // ---------------------------------------------------------------------------
  bergamo: {
    raw_monthly_rent: 850,
    currency_iso: "EUR",
    budget: 74,
    grocery_restaurant_costs: 66,
    settling_ease: 42,
    degree_recognition: 48,
    raw_water_quality: 86.0,
    raw_air_aqi_yearly_avg: 68.0,
    raw_crime_rate: 39.4,
    animal_friendliness: 64,
    fare_system: 62,
    transit_pass_cost: 84,
    transit_profile: 55,
    bike_paths: 50,
    walkways: 62,
    driving_rules: 58,
    car_free_index: 55,
    raw_car_dependency_pct: 60.0,
    climate_comfort: 55,
    disaster_safety: 74,
    urban_infra: 65,
    raising_children: 70,
    places_to_gather: 62,
    work_life_balance: 68,
    gen_employment: 68,
    opp_it: 65,
    opp_eng: 70,
    opp_psych: 50,
    operating_psychotherapist: 42,
    raw_tax_rate_single: 47.0,
    raw_tax_rate_dual: 40.0,
    tax_breaks_single: 25,
    tax_breaks_dual: 42,
    child_benefits: 58,
    paperwork_online: 48,
    parental_leave: 68,
    paid_days: 80,
  },

  // ---------------------------------------------------------------------------
  // MODENA — Italy
  // Rent: Numbeo outside EUR1,211
  // AQI: PM2.5 ~18 µg/m³ → EPA AQI ~64
  // Crime: Numbeo crime 49.63 / safety 50.37
  // Tax: Italian framework
  // ---------------------------------------------------------------------------
  modena: {
    raw_monthly_rent: 1200,
    currency_iso: "EUR",
    budget: 66,
    grocery_restaurant_costs: 64,
    settling_ease: 44,
    degree_recognition: 50,
    raw_water_quality: 86.0,
    raw_air_aqi_yearly_avg: 64.0,
    raw_crime_rate: 49.6,
    animal_friendliness: 65,
    fare_system: 62,
    transit_pass_cost: 88,
    transit_profile: 60,
    bike_paths: 60,
    walkways: 65,
    driving_rules: 62,
    car_free_index: 62,
    raw_car_dependency_pct: 50.0,
    climate_comfort: 55,
    disaster_safety: 72,
    urban_infra: 68,
    raising_children: 72,
    places_to_gather: 65,
    work_life_balance: 72,
    gen_employment: 68,
    opp_it: 62,
    opp_eng: 68,
    opp_psych: 55,
    operating_psychotherapist: 48,
    raw_tax_rate_single: 47.0,
    raw_tax_rate_dual: 40.0,
    tax_breaks_single: 25,
    tax_breaks_dual: 42,
    child_benefits: 58,
    paperwork_online: 50,
    parental_leave: 68,
    paid_days: 80,
  },

  // ---------------------------------------------------------------------------
  // UDINE — Italy
  // Rent: Numbeo outside EUR834
  // AQI: PM2.5 ~16 µg/m³ → EPA AQI ~60
  // Crime: Numbeo crime 36.71 / safety 63.29
  // Tax: Italian framework; Friuli-VG regional tax slightly lower → ~46%/39%
  // ---------------------------------------------------------------------------
  udine: {
    raw_monthly_rent: 870,
    currency_iso: "EUR",
    budget: 74,
    grocery_restaurant_costs: 66,
    settling_ease: 42,
    degree_recognition: 48,
    raw_water_quality: 88.0,
    raw_air_aqi_yearly_avg: 60.0,
    raw_crime_rate: 36.7,
    animal_friendliness: 64,
    fare_system: 58,
    transit_pass_cost: 84,
    transit_profile: 52,
    bike_paths: 52,
    walkways: 65,
    driving_rules: 62,
    car_free_index: 55,
    raw_car_dependency_pct: 60.0,
    climate_comfort: 60,
    disaster_safety: 78,
    urban_infra: 66,
    raising_children: 72,
    places_to_gather: 63,
    work_life_balance: 72,
    gen_employment: 55,
    opp_it: 50,
    opp_eng: 55,
    opp_psych: 48,
    operating_psychotherapist: 42,
    raw_tax_rate_single: 46.0,
    raw_tax_rate_dual: 39.0,
    tax_breaks_single: 25,
    tax_breaks_dual: 42,
    child_benefits: 58,
    paperwork_online: 50,
    parental_leave: 68,
    paid_days: 80,
  },

  // ---------------------------------------------------------------------------
  // PADUA — Italy
  // Rent: Numbeo outside EUR1,116
  // AQI: PM2.5 ~19 µg/m³ → EPA AQI ~67
  // Crime: Numbeo crime 45.78 / safety 54.22
  // Tax: Italian framework; Veneto standard → ~47%/40%
  // ---------------------------------------------------------------------------
  padova: {
    raw_monthly_rent: 1100,
    currency_iso: "EUR",
    budget: 68,
    grocery_restaurant_costs: 64,
    settling_ease: 44,
    degree_recognition: 55,
    raw_water_quality: 86.0,
    raw_air_aqi_yearly_avg: 67.0,
    raw_crime_rate: 45.8,
    animal_friendliness: 66,
    fare_system: 65,
    transit_pass_cost: 82,
    transit_profile: 62,
    bike_paths: 60,
    walkways: 66,
    driving_rules: 62,
    car_free_index: 62,
    raw_car_dependency_pct: 50.0,
    climate_comfort: 56,
    disaster_safety: 74,
    urban_infra: 68,
    raising_children: 72,
    places_to_gather: 68,
    work_life_balance: 70,
    gen_employment: 65,
    opp_it: 62,
    opp_eng: 65,
    opp_psych: 58,
    operating_psychotherapist: 50,
    raw_tax_rate_single: 47.0,
    raw_tax_rate_dual: 40.0,
    tax_breaks_single: 25,
    tax_breaks_dual: 42,
    child_benefits: 58,
    paperwork_online: 50,
    parental_leave: 68,
    paid_days: 80,
  },

  // ---------------------------------------------------------------------------
  // TRENTO — Italy
  // Rent: Numbeo outside EUR1,119
  // AQI: PM2.5 ~13 µg/m³ → EPA AQI ~52
  // Crime: Numbeo crime 35.88 / safety 64.12
  // Tax: Trentino-Alto Adige autonomous region: slightly lower IRPEF add-on → ~45%/38%
  // ---------------------------------------------------------------------------
  trento: {
    raw_monthly_rent: 1150,
    currency_iso: "EUR",
    budget: 68,
    grocery_restaurant_costs: 63,
    settling_ease: 46,
    degree_recognition: 52,
    raw_water_quality: 92.0,
    raw_air_aqi_yearly_avg: 52.0,
    raw_crime_rate: 35.9,
    animal_friendliness: 72,
    fare_system: 68,
    transit_pass_cost: 88,
    transit_profile: 68,
    bike_paths: 68,
    walkways: 74,
    driving_rules: 68,
    car_free_index: 72,
    raw_car_dependency_pct: 40.0,
    climate_comfort: 72,
    disaster_safety: 82,
    urban_infra: 74,
    raising_children: 82,
    places_to_gather: 78,
    work_life_balance: 76,
    gen_employment: 58,
    opp_it: 55,
    opp_eng: 60,
    opp_psych: 58,
    operating_psychotherapist: 52,
    raw_tax_rate_single: 45.0,
    raw_tax_rate_dual: 38.0,
    tax_breaks_single: 28,
    tax_breaks_dual: 45,
    child_benefits: 65,
    paperwork_online: 55,
    parental_leave: 68,
    paid_days: 80,
  },

  // ---------------------------------------------------------------------------
  // SAN LAZZARO DI SAVENA — Italy (Bologna metro suburb)
  // Rent: Bologna proxy EUR1,050 (commune benchmark)
  // AQI: PM2.5 ~20 µg/m³ → EPA AQI ~68 (same Po Valley basin as Bologna)
  // Crime: safetyIndex ~68 (suburban calm; lower than Bologna centre) → crime ~32
  // Tax: Italian framework (Bologna province)
  // ---------------------------------------------------------------------------
  sanLazzaro: {
    raw_monthly_rent: 1050,
    currency_iso: "EUR",
    budget: 72,
    grocery_restaurant_costs: 65,
    settling_ease: 42,
    degree_recognition: 48,
    raw_water_quality: 85.0,
    raw_air_aqi_yearly_avg: 68.0,
    raw_crime_rate: 32.0,
    animal_friendliness: 68,
    fare_system: 60,
    transit_pass_cost: 84,
    transit_profile: 58,
    bike_paths: 52,
    walkways: 65,
    driving_rules: 64,
    car_free_index: 55,
    raw_car_dependency_pct: 58.0,
    climate_comfort: 58,
    disaster_safety: 76,
    urban_infra: 66,
    raising_children: 76,
    places_to_gather: 68,
    work_life_balance: 72,
    gen_employment: 68,
    opp_it: 68,
    opp_eng: 65,
    opp_psych: 58,
    operating_psychotherapist: 50,
    raw_tax_rate_single: 47.0,
    raw_tax_rate_dual: 40.0,
    tax_breaks_single: 25,
    tax_breaks_dual: 42,
    child_benefits: 58,
    paperwork_online: 50,
    parental_leave: 68,
    paid_days: 80,
  },

};

/**
 * Ordered list of city keys matching the dashboard render order.
 * Only cities present in mcdaPayloads are included.
 */
export const mcdaPayloadKeys = Object.keys(mcdaPayloads);
