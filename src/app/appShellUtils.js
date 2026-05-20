import { lazy } from 'react';

export const comparisonTitle = 'Strategic Relocation: The Balance Matrix';
export const isBrowser = typeof window !== 'undefined';

export const storageKeys = {
  lens: 'relocation-dashboard:lens',
  scenario: 'relocation-dashboard:scenario',
  city: 'relocation-dashboard:selected-city',
  year: 'relocation-dashboard:selected-year',
};

export const LazyExplorerPage = lazy(async () => {
  const module = await import('../components/explorerPage.jsx');
  return { default: module.ExplorerPage };
});

export const LazyCityMapPage = lazy(async () => {
  const module = await import('../components/CityMapPage.jsx');
  return { default: module.CityMapPage };
});

let dashboardDataPromise;

export const loadDashboardData = () => {
  if (!dashboardDataPromise) {
    dashboardDataPromise = import('../relocationData.js');
  }

  return dashboardDataPromise;
};

export const pickAllowed = (value, options, fallback) => (
  options.some((option) => option.value === value) ? value : fallback
);
