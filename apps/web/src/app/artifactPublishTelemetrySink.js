import { ARTIFACT_PUBLISH_EVENT_NAME } from './exportActions.js';

const isBrowser = typeof window !== 'undefined';

const buildTelemetryEnvelope = (payload) => {
  const exportFormat = payload?.exportFormat ?? 'unknown';

  return {
    observation_id: `artifact-publish:${exportFormat}`,
    name: `Artifact publish telemetry ${exportFormat}`,
    payload: {
      ...payload,
      sinkCapturedAt: new Date().toISOString(),
    },
    tags: ['web-telemetry', 'artifact-publish', exportFormat],
  };
};

const persistTelemetryEvent = (payload, sendImpl = globalThis.fetch) => {
  if (!payload) {
    return;
  }

  const endpoint = '/v1/admin/artifacts/evidence';
  const body = JSON.stringify(buildTelemetryEnvelope(payload));

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon(endpoint, blob);
    return;
  }

  if (typeof sendImpl !== 'function') {
    return;
  }

  Promise.resolve()
    .then(() => sendImpl(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body,
      keepalive: true,
    }))
    .catch(() => {
      // Telemetry persistence must never block UX.
    });
};

let installed = false;

export const installArtifactPublishTelemetrySink = ({
  sendImpl = globalThis.fetch,
} = {}) => {
  if (!isBrowser || installed) {
    return () => {};
  }

  const onTelemetry = (event) => {
    persistTelemetryEvent(event?.detail, sendImpl);
  };

  window.addEventListener(ARTIFACT_PUBLISH_EVENT_NAME, onTelemetry);
  installed = true;

  return () => {
    window.removeEventListener(ARTIFACT_PUBLISH_EVENT_NAME, onTelemetry);
    installed = false;
  };
};

export const __testOnly = {
  buildTelemetryEnvelope,
  persistTelemetryEvent,
  resetInstallState: () => {
    installed = false;
  },
};
