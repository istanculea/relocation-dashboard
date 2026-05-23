/* @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';
import {
  ARTIFACT_PUBLISH_EVENT_NAME,
  buildExportArtifactRequests,
  emitArtifactPublishTelemetry,
  publishExportArtifacts,
  publishExportArtifactsWithTelemetry,
  summarizeArtifactPublishResults,
} from './exportActions.js';

const sampleExportPayload = {
  exportedAt: '2026-05-23T12:00:00.000Z',
  activeLens: 'balanced',
  scenario: 'oneParent',
  selectedYear: 2028,
  selectedCityKey: 'vienna-at',
  scenarioLab: {
    presetKey: 'baseline-2028',
    savedRunsCount: 2,
    activeRun: {
      id: 'run-123',
      name: 'Vienna baseline',
      createdAt: '2026-05-22T10:00:00.000Z',
      selectedCityKey: 'vienna-at',
      selectedYear: 2028,
      shockType: 'none',
      shockSeverity: 1,
    },
  },
  evidenceCenter: {
    city: 'Vienna',
    confidence: 0.81,
  },
};

describe('exportActions artifact publishing', () => {
  it('builds scenario and evidence artifact requests from export payload', () => {
    const requests = buildExportArtifactRequests({
      exportPayload: sampleExportPayload,
      exportFormat: 'json',
    });

    expect(requests).toHaveLength(2);
    expect(requests[0].endpoint).toBe('/v1/admin/artifacts/scenario');
    expect(requests[0].body.run_id).toBe('run-123');
    expect(requests[1].endpoint).toBe('/v1/admin/artifacts/evidence');
    expect(requests[1].body.observation_id).toBe('vienna-at');
  });

  it('publishes both artifact requests using provided fetch implementation', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));

    const result = await publishExportArtifacts({
      exportPayload: sampleExportPayload,
      exportFormat: 'csv',
      fetchImpl: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe('/v1/admin/artifacts/scenario');
    expect(fetchMock.mock.calls[1][0]).toBe('/v1/admin/artifacts/evidence');
    expect(result).toHaveLength(2);
    expect(result.every((item) => item.status === 'fulfilled')).toBe(true);
    expect(result.every((item) => item.outcome === 'succeeded')).toBe(true);
  });

  it('summarizes publish success/failure rate per export type', () => {
    const summary = summarizeArtifactPublishResults({
      exportFormat: 'pdf',
      publishResults: [
        { outcome: 'succeeded' },
        { outcome: 'failed_http' },
      ],
    });

    expect(summary.exportFormat).toBe('pdf');
    expect(summary.totalAttempts).toBe(2);
    expect(summary.succeeded).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.successRate).toBe(0.5);
  });

  it('emits telemetry non-blocking through provided emitter', async () => {
    const emitMock = vi.fn();

    emitArtifactPublishTelemetry({
      exportFormat: 'xls',
      publishResults: [{ outcome: 'succeeded' }],
      emitImpl: emitMock,
    });

    await Promise.resolve();

    expect(emitMock).toHaveBeenCalledTimes(1);
    expect(emitMock.mock.calls[0][0]).toMatchObject({
      eventName: 'artifact_publish_observation',
      exportFormat: 'xls',
      totalAttempts: 1,
      succeeded: 1,
      failed: 0,
    });
  });

  it('publishes artifacts and emits telemetry in one call', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    const emitMock = vi.fn();

    await publishExportArtifactsWithTelemetry({
      exportPayload: sampleExportPayload,
      exportFormat: 'json',
      fetchImpl: fetchMock,
      telemetryEmitter: emitMock,
    });

    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(emitMock).toHaveBeenCalledTimes(1);
    expect(emitMock.mock.calls[0][0].exportFormat).toBe('json');
  });

  it('dispatches exactly one telemetry browser event per export action', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    const eventListener = vi.fn();
    window.addEventListener(ARTIFACT_PUBLISH_EVENT_NAME, eventListener);

    await publishExportArtifactsWithTelemetry({
      exportPayload: sampleExportPayload,
      exportFormat: 'csv',
      fetchImpl: fetchMock,
    });

    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(eventListener).toHaveBeenCalledTimes(1);

    window.removeEventListener(ARTIFACT_PUBLISH_EVENT_NAME, eventListener);
  });
});
