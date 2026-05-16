import { iberiaAndRomaniaCitySourceMeta } from './citySourceMeta/iberiaAndRomania.js';
import { italyCitySourceMeta } from './citySourceMeta/italy.js';
import { northAndCentralEuropeCitySourceMeta } from './citySourceMeta/northAndCentralEurope.js';
import { expansionWaveSourceMeta } from './cityExpansionWave.js';

export { benchmarkSources } from './benchmarkSources.js';

export const citySourceMeta = {
  ...iberiaAndRomaniaCitySourceMeta,
  ...northAndCentralEuropeCitySourceMeta,
  ...italyCitySourceMeta,
  ...expansionWaveSourceMeta,
};