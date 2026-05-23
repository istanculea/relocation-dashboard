/* @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { ARTIFACT_PUBLISH_EVENT_NAME } from './exportActions.js';
import {
  __testOnly,
  installArtifactPublishTelemetrySink,
} from './artifactPublishTelemetrySink.js';

afterEach(() => {
  __testOnly.resetInstallState();
});

describe('artifactPublishTelemetrySink', () => {
  it('forwards telemetry events to persistent evidence sink', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    const cleanup = installArtifactPublishTelemetrySink({ sendImpl: fetchMock });

    window.dispatchEvent(new CustomEvent(ARTIFACT_PUBLISH_EVENT_NAME, {
      detail: {
        exportFormat: 'pdf',
        totalAttempts: 2,
        succeeded: 2,
        failed: 0,
        successRate: 1,
      },
    }));

    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/v1/admin/artifacts/evidence');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      keepalive: true,
    });

    const sentPayload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentPayload.tags).toContain('web-telemetry');
    expect(sentPayload.payload.exportFormat).toBe('pdf');

    cleanup();
  });

  it('installs only once and avoids duplicate forwarding', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    const cleanupA = installArtifactPublishTelemetrySink({ sendImpl: fetchMock });
    const cleanupB = installArtifactPublishTelemetrySink({ sendImpl: fetchMock });

    window.dispatchEvent(new CustomEvent(ARTIFACT_PUBLISH_EVENT_NAME, {
      detail: { exportFormat: 'json' },
    }));

    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    cleanupA();
    cleanupB();
  });
});
