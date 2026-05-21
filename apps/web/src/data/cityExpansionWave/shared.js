import { scoreWeights } from '../dashboardConfig.js';

export const gbpToEur = 1.17;

export const average = (values) => values.reduce((total, value) => total + value, 0) / values.length;

export const sumValues = (values) => values.reduce((total, value) => total + value, 0);

export const clampScore = (value) => Number(Math.max(1, Math.min(10, value)).toFixed(2));

export const roundAmount = (value) => Math.round(value);

export const toNumber = (value) => Number(String(value ?? '').replace(/[^0-9.-]/g, ''));

export const toEur = (value, fxToEur = 1) => Number((toNumber(value) * fxToEur).toFixed(2));

export const toLocal = (value, fxToEur = 1) => Number((value / fxToEur).toFixed(2));

export const formatNumber = (value, digits = 0) =>
	value.toLocaleString('en-IE', {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	});

export const formatLocal = (value, currencyCode, digits = 0) => `${currencyCode}${formatNumber(value, digits)}`;

export const formatBand = (min, max, currencyCode, digits = 0, suffix = '') =>
	`${currencyCode}${formatNumber(min, digits)}-${formatNumber(max, digits)}${suffix}`;

export const buildPricePerSqm = (value, currencyCode) => `${formatLocal(value, currencyCode)}/sqm`;

export const weightedAverage = (scores) =>
	clampScore(
		scores.housing * scoreWeights.housing
			+ scores.environment * scoreWeights.environment
			+ scores.childcare * scoreWeights.childcare
			+ scores.safety * scoreWeights.safety
			+ scores.healthcare * scoreWeights.healthcare,
	);

export const housingRentScore = (rentEstimateEur) => {
	if (rentEstimateEur <= 900) {
		return 8.7;
	}

	if (rentEstimateEur <= 1100) {
		return 8;
	}

	if (rentEstimateEur <= 1300) {
		return 7.2;
	}

	if (rentEstimateEur <= 1500) {
		return 6.5;
	}

	if (rentEstimateEur <= 1700) {
		return 5.8;
	}

	if (rentEstimateEur <= 1900) {
		return 5.1;
	}

	return 4.4;
};

export const housingBuyScore = (buyOutsideEur) => {
	if (buyOutsideEur <= 1800) {
		return 8.7;
	}

	if (buyOutsideEur <= 2500) {
		return 8;
	}

	if (buyOutsideEur <= 3500) {
		return 7.2;
	}

	if (buyOutsideEur <= 4500) {
		return 6.4;
	}

	if (buyOutsideEur <= 6000) {
		return 5.6;
	}

	return 4.8;
};

export const preschoolScore = (preschoolEur) => {
	if (preschoolEur <= 200) {
		return 8.8;
	}

	if (preschoolEur <= 400) {
		return 8;
	}

	if (preschoolEur <= 600) {
		return 7.2;
	}

	if (preschoolEur <= 800) {
		return 6.5;
	}

	if (preschoolEur <= 1000) {
		return 5.7;
	}

	if (preschoolEur <= 1400) {
		return 5;
	}

	return 4.2;
};

export const pm25Score = (value) => {
	if (value <= 10) {
		return 9.2;
	}

	if (value <= 12) {
		return 8.6;
	}

	if (value <= 15) {
		return 7.8;
	}

	if (value <= 18) {
		return 6.9;
	}

	if (value <= 22) {
		return 6;
	}

	return 5.1;
};

export const airQualityScore = (value) => {
	if (value >= 80) {
		return 8.9;
	}

	if (value >= 70) {
		return 8.1;
	}

	if (value >= 60) {
		return 7.3;
	}

	if (value >= 50) {
		return 6.5;
	}

	if (value >= 40) {
		return 5.7;
	}

	return 5;
};

export const pollutionIndexScore = (value) => {
	if (value <= 25) {
		return 8.8;
	}

	if (value <= 35) {
		return 8;
	}

	if (value <= 45) {
		return 7.2;
	}

	if (value <= 55) {
		return 6.4;
	}

	if (value <= 65) {
		return 5.6;
	}

	return 4.8;
};

export const resolveAirScore = (config) => {
	const scoreCandidates = [];

	if (Number.isFinite(config.pollution.pm25)) {
		scoreCandidates.push(pm25Score(config.pollution.pm25));
	}

	if (Number.isFinite(config.pollution.airQualityIndex)) {
		scoreCandidates.push(airQualityScore(config.pollution.airQualityIndex));
	}

	if (Number.isFinite(config.pollution.pollutionIndex)) {
		scoreCandidates.push(pollutionIndexScore(config.pollution.pollutionIndex));
	}

	if (!scoreCandidates.length) {
		scoreCandidates.push(config.airFallbackScore);
	}

	return clampScore(average(scoreCandidates));
};

export const createBenchmarkSourceSet = ({
	city,
	url,
	observedAt,
	familyOfFour,
	rent3Outside,
	buyCentre,
	buyOutside,
	preschool,
	monthlyPass,
}) => ({
	housingCosts: [
		{
			label: `Numbeo ${city} housing benchmark`,
			url,
			observedAt,
			note: `Secondary crowd-sourced benchmark: 3-bedroom outside centre ${rent3Outside}; buy-price benchmark ${buyCentre}/sqm in the centre and ${buyOutside}/sqm outside centre.`,
		},
	],
	basketCosts: [
		{
			label: `Numbeo ${city} family basket benchmark`,
			url,
			observedAt,
			note: `Secondary crowd-sourced benchmark: family of four ${familyOfFour} excluding rent.`,
		},
	],
	childcareCosts: [
		{
			label: `Numbeo ${city} childcare benchmark`,
			url,
			observedAt,
			note: `Secondary crowd-sourced benchmark: private full-day preschool ${preschool}. Use only as a market cross-check until a city tariff is attached.`,
		},
	],
	mobilityCosts: [
		{
			label: `Numbeo ${city} mobility benchmark`,
			url,
			observedAt,
			note: `Secondary crowd-sourced benchmark: regular monthly public transport pass ${monthlyPass}. Use only as a cross-check until a stable operator tariff is attached.`,
		},
	],
});