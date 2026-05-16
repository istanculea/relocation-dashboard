import { expansionWaveTrendData } from './cityExpansionWave.js';

const createTrendSeries = ({
  overallScore,
  oneParentBudget,
  bothWorkingBudget,
  pm25,
}) => [
  {
    year: 2023,
    overallScore: overallScore[0],
    oneParentBudget: oneParentBudget[0],
    bothWorkingBudget: bothWorkingBudget[0],
    pm25: pm25[0],
  },
  {
    year: 2024,
    overallScore: overallScore[1],
    oneParentBudget: oneParentBudget[1],
    bothWorkingBudget: bothWorkingBudget[1],
    pm25: pm25[1],
  },
  {
    year: 2025,
    overallScore: overallScore[2],
    oneParentBudget: oneParentBudget[2],
    bothWorkingBudget: bothWorkingBudget[2],
    pm25: pm25[2],
  },
  {
    year: 2026,
    overallScore: overallScore[3],
    oneParentBudget: oneParentBudget[3],
    bothWorkingBudget: bothWorkingBudget[3],
    pm25: pm25[3],
  },
];

export const trendMethodologyNote =
  '2026 points align with the current checked dashboard snapshot. 2023-2025 rows are normalized benchmark backcasts so the comparison can be extended consistently before a full city-by-city historical-source audit.';

export const cityTrendData = {
  bilbao: createTrendSeries({
    overallScore: [7.54, 7.49, 7.45, 7.41],
    oneParentBudget: [2480, 2585, 2680, 2767],
    bothWorkingBudget: [2580, 2700, 2805, 2902],
    pm25: [12, 12, 11, 11],
  }),
  bucharest: createTrendSeries({
    overallScore: [7.42, 7.33, 7.24, 7.15],
    oneParentBudget: [1930, 2030, 2135, 2210],
    bothWorkingBudget: [2520, 2680, 2835, 2970],
    pm25: [18, 18, 17, 16],
  }),
  milan: createTrendSeries({
    overallScore: [5.12, 5.05, 4.95, 4.85],
    oneParentBudget: [3440, 3600, 3770, 3937],
    bothWorkingBudget: [4090, 4290, 4485, 4672],
    pm25: [29, 28, 28, 27],
  }),
  bologna: createTrendSeries({
    overallScore: [6.61, 6.55, 6.49, 6.36],
    oneParentBudget: [2690, 2785, 2870, 2960],
    bothWorkingBudget: [3300, 3405, 3515, 3630],
    pm25: [23, 22, 22, 21],
  }),
  lugo: createTrendSeries({
    overallScore: [7.28, 7.24, 7.2, 7.16],
    oneParentBudget: [1980, 2055, 2125, 2200],
    bothWorkingBudget: [2380, 2460, 2545, 2625],
    pm25: [21, 20, 20, 19],
  }),
  reggioEmilia: createTrendSeries({
    overallScore: [7.02, 6.96, 6.9, 6.85],
    oneParentBudget: [2485, 2580, 2685, 2783],
    bothWorkingBudget: [2940, 3060, 3180, 3305],
    pm25: [22, 21, 21, 20],
  }),
  cologne: createTrendSeries({
    overallScore: [6.58, 6.54, 6.5, 6.59],
    oneParentBudget: [3250, 3370, 3490, 3600],
    bothWorkingBudget: [3550, 3690, 3825, 3960],
    pm25: [14, 14, 13, 13],
  }),
  valencia: createTrendSeries({
    overallScore: [6.85, 6.92, 7.01, 7.09],
    oneParentBudget: [2380, 2450, 2520, 2600],
    bothWorkingBudget: [2680, 2760, 2840, 2900],
    pm25: [14, 13, 12, 12],
  }),
  vienna: createTrendSeries({
    overallScore: [7.58, 7.55, 7.53, 7.41],
    oneParentBudget: [3010, 3095, 3185, 3275],
    bothWorkingBudget: [3320, 3415, 3510, 3615],
    pm25: [11, 11, 10, 10],
  }),
  ...expansionWaveTrendData,
};