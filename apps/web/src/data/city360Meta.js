import { iberiaAndRomaniaCity360Meta } from './city360Meta/iberiaAndRomania.js';
import { italyCity360Meta } from './city360Meta/italy.js';
import { northAndCentralEuropeCity360Meta } from './city360Meta/northAndCentralEurope.js';
import { expansionWaveCity360Meta } from './cityExpansionWave.js';

export const city360Meta = {
  ...iberiaAndRomaniaCity360Meta,
  ...italyCity360Meta,
  ...northAndCentralEuropeCity360Meta,
  ...expansionWaveCity360Meta,
};