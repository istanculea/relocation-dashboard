import {
  buildCsvDocument,
  buildExportFileName,
  buildXlsDocument,
  downloadExportFile,
} from '../utils/exportHelpers.js';
import { buildShareUrl } from '../utils/urlState.js';
import { buildMobilityShareState } from '../utils/mobilityShareState.js';

const isBrowser = typeof window !== 'undefined';

export const exportJsonSnapshot = async ({ exportPayload, filteredComparisonRows, exportStamp }) => {
  let payload = exportPayload;

  if (filteredComparisonRows.some((row) => row.trends == null)) {
    const { loadCityTrendDetail } = await import('../data/city360DetailLoader.js');
    const trendEntries = await Promise.all(
      filteredComparisonRows.map(async (row) => [row.key, await loadCityTrendDetail(row.key)]),
    );
    const trendsByKey = new Map(trendEntries);

    payload = {
      ...exportPayload,
      cities: exportPayload.cities.map((city) => ({
        ...city,
        trends: trendsByKey.get(city.key) ?? city.trends ?? [],
      })),
    };
  }

  if (filteredComparisonRows.some((row) => row.verifiedDetails.some((detail) => detail.sources == null))) {
    const { default: verifiedSnapshotSummary } = await import('../data/verifiedSnapshotSummary.json');

    payload = {
      ...payload,
      cities: payload.cities.map((city) => ({
        ...city,
        verifiedDetails: verifiedSnapshotSummary[city.key]?.verifiedDetails ?? city.verifiedDetails,
      })),
    };
  }

  downloadExportFile(
    buildExportFileName(exportStamp, 'json'),
    `${JSON.stringify(payload, null, 2)}\n`,
    'application/json;charset=utf-8',
  );
};

export const exportCsvSnapshot = ({ exportRows, exportStamp }) => {
  downloadExportFile(
    buildExportFileName(exportStamp, 'csv'),
    buildCsvDocument(exportRows),
    'text/csv;charset=utf-8',
  );
};

export const exportXlsSnapshot = ({
  filteredComparisonRows,
  exportStamp,
  lensLabel,
  scenarioLabel,
  selectedYear,
}) => {
  downloadExportFile(
    buildExportFileName(exportStamp, 'xls'),
    buildXlsDocument(filteredComparisonRows, {
      lensLabel,
      scenarioLabel,
      selectedYear,
    }),
    'application/vnd.ms-excel;charset=utf-8',
  );
};

export const printDashboardSnapshot = ({ setIsPrinting }) => {
  if (!isBrowser) {
    return;
  }

  setIsPrinting(true);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        document.querySelectorAll('details').forEach((el) => {
          el.open = true;
        });
        window.print();
      } finally {
        setIsPrinting(false);
      }
    });
  });
};

export const shareDashboardSnapshot = async ({
  page,
  lensKey,
  scenarioKey,
  selectedCityKey,
  selectedYear,
  sortKey,
  verificationFilter,
  budgetFilter,
  mobilityFilter,
  airFilter,
  searchValue,
  shockType = 'none',
  shockSeverity = 1,
  mapMode = 'familyStability',
  mapPersona = 'internationalFamily',
  mapComparisonCity = '',
  mapNeighborCount = 3,
  comparisonTitle,
  timeWindowHours,
  layerVisibility,
}) => {
  if (!isBrowser) {
    return;
  }

  const shareState = {
    page,
    lens: lensKey,
    scenario: scenarioKey,
    city: selectedCityKey,
    year: selectedYear,
    sort: sortKey,
    verification: verificationFilter,
    budget: budgetFilter,
    mobility: mobilityFilter,
    air: airFilter,
    search: searchValue,
    shock: shockType,
    shockSeverity,
    mapMode,
    mapPersona,
    mapComparisonCity,
    mapNeighborCount,
    ...buildMobilityShareState({ timeWindowHours, layerVisibility }),
  };
  const shareUrl = buildShareUrl({ route: page, shareState, locationObject: window.location });

  if (navigator.share) {
    try {
      await navigator.share({
        title: comparisonTitle,
        text: 'Relocation dashboard snapshot',
        url: shareUrl,
      });
      return;
    } catch {
      // Continue to clipboard fallback when share sheet is unavailable or cancelled.
    }
  }

  try {
    await navigator.clipboard.writeText(shareUrl);
  } catch {
    window.prompt('Copy share link:', shareUrl);
  }
};
