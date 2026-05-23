import {
  buildCsvDocument,
  buildExportFileName,
  buildXlsDocument,
  downloadExportFile,
} from '../utils/exportHelpers.js';
import { buildShareUrl } from '../utils/urlState.js';
import { buildMobilityShareState } from '../utils/mobilityShareState.js';

const isBrowser = typeof window !== 'undefined';
export const ARTIFACT_PUBLISH_EVENT_NAME = 'relocation-dashboard:artifact-publish';

const normalizeExportFormat = (exportFormat) => {
  if (typeof exportFormat !== 'string' || exportFormat.trim().length === 0) {
    return 'unknown';
  }

  return exportFormat.trim().toLowerCase();
};

export const buildExportArtifactRequests = ({ exportPayload, exportFormat }) => {
  if (!exportPayload || typeof exportPayload !== 'object') {
    return [];
  }

  const normalizedFormat = normalizeExportFormat(exportFormat);
  const exportedAt = typeof exportPayload.exportedAt === 'string'
    ? exportPayload.exportedAt
    : new Date().toISOString();

  const scenarioLab = exportPayload.scenarioLab ?? {};
  const evidenceCenter = exportPayload.evidenceCenter ?? null;
  const selectedCityKey = exportPayload.selectedCityKey ?? null;
  const runId = scenarioLab.activeRun?.id ?? null;

  return [
    {
      endpoint: '/v1/admin/artifacts/scenario',
      body: {
        run_id: runId,
        name: `Scenario export ${normalizedFormat}`,
        payload: {
          exportedAt,
          exportFormat: normalizedFormat,
          activeLens: exportPayload.activeLens,
          scenario: exportPayload.scenario,
          selectedYear: exportPayload.selectedYear,
          selectedCityKey,
          scenarioLab,
        },
        tags: ['web-export', 'scenario-lab', normalizedFormat],
      },
    },
    {
      endpoint: '/v1/admin/artifacts/evidence',
      body: {
        observation_id: selectedCityKey,
        name: `Evidence export ${normalizedFormat}`,
        payload: {
          exportedAt,
          exportFormat: normalizedFormat,
          selectedCityKey,
          evidenceCenter,
        },
        tags: ['web-export', 'evidence-center', normalizedFormat],
      },
    },
  ];
};

export const publishExportArtifacts = async ({ exportPayload, exportFormat, fetchImpl = globalThis.fetch }) => {
  if (typeof fetchImpl !== 'function') {
    return [];
  }

  const requests = buildExportArtifactRequests({ exportPayload, exportFormat });
  if (!requests.length) {
    return [];
  }

  const settled = await Promise.allSettled(
    requests.map(({ endpoint, body }) => fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })),
  );

  return settled.map((result, index) => ({
    endpoint: requests[index].endpoint,
    status: result.status,
    outcome: result.status === 'fulfilled'
      ? (result.value?.ok === false ? 'failed_http' : 'succeeded')
      : 'failed_rejected',
  }));
};

export const summarizeArtifactPublishResults = ({ exportFormat, publishResults = [] }) => {
  const normalizedFormat = normalizeExportFormat(exportFormat);
  const succeeded = publishResults.filter((result) => result.outcome === 'succeeded').length;
  const failed = publishResults.length - succeeded;
  const totalAttempts = publishResults.length;
  const successRate = totalAttempts > 0
    ? Number((succeeded / totalAttempts).toFixed(4))
    : 0;

  return {
    eventName: 'artifact_publish_observation',
    exportFormat: normalizedFormat,
    totalAttempts,
    succeeded,
    failed,
    successRate,
  };
};

const defaultTelemetryEmitter = (eventPayload) => {
  if (!isBrowser) {
    return;
  }

  window.dispatchEvent(new CustomEvent(ARTIFACT_PUBLISH_EVENT_NAME, {
    detail: eventPayload,
  }));
};

export const emitArtifactPublishTelemetry = ({
  exportFormat,
  publishResults,
  emitImpl = defaultTelemetryEmitter,
}) => {
  if (typeof emitImpl !== 'function') {
    return;
  }

  const payload = summarizeArtifactPublishResults({ exportFormat, publishResults });

  Promise.resolve()
    .then(() => emitImpl(payload))
    .catch(() => {
      // Telemetry must not block export UX.
    });
};

export const publishExportArtifactsWithTelemetry = async ({
  exportPayload,
  exportFormat,
  fetchImpl = globalThis.fetch,
  telemetryEmitter,
}) => {
  const publishResults = await publishExportArtifacts({ exportPayload, exportFormat, fetchImpl });

  emitArtifactPublishTelemetry({
    exportFormat,
    publishResults,
    emitImpl: telemetryEmitter,
  });

  return publishResults;
};

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
    let shared = false;

    await navigator.share({
      title: comparisonTitle,
      text: 'Relocation dashboard snapshot',
      url: shareUrl,
    })
      .then(() => {
        shared = true;
      })
      .catch(() => {
        shared = false;
      });

    if (shared) {
      return;
    }
  }

  await navigator.clipboard.writeText(shareUrl)
    .catch(() => {
      window.prompt('Copy share link:', shareUrl);
    });
};
