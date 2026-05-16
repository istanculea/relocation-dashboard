import { buildExpansionWaveCity } from './cityExpansionWave/assembler.js';
import { austriaCityConfigs } from './cityExpansionWave/cities/austria.js';
import { germanyCityConfigs } from './cityExpansionWave/cities/germany.js';
import { italyEastCityConfigs } from './cityExpansionWave/cities/italyEast.js';
import { italyWestCityConfigs } from './cityExpansionWave/cities/italyWest.js';
import { westernCityConfigs } from './cityExpansionWave/cities/west.js';

const cityConfigs = [
	...austriaCityConfigs,
	...germanyCityConfigs,
	...westernCityConfigs,
	...italyWestCityConfigs,
	...italyEastCityConfigs,
];

const expansionWaveEntries = cityConfigs.map(buildExpansionWaveCity);

export const expansionWaveCities = expansionWaveEntries.map((entry) => entry.city);

export const expansionWaveBudgetModels = Object.fromEntries(
	expansionWaveEntries.map((entry) => [entry.city.key, entry.budgetModel]),
);

export const expansionWaveAuditMeta = Object.fromEntries(
	expansionWaveEntries.map((entry) => [entry.city.key, entry.auditMeta]),
);

export const expansionWaveComparisonMeta = Object.fromEntries(
	expansionWaveEntries.map((entry) => [entry.city.key, entry.comparisonMeta]),
);

export const expansionWaveCity360Meta = Object.fromEntries(
	expansionWaveEntries.map((entry) => [entry.city.key, entry.city360]),
);

export const expansionWaveSourceMeta = Object.fromEntries(
	expansionWaveEntries.map((entry) => [entry.city.key, entry.sourceMeta]),
);

export const expansionWaveTrendData = Object.fromEntries(
	expansionWaveEntries.map((entry) => [entry.city.key, entry.trendData]),
);