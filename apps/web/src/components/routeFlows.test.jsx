// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildTemporalOutlookRows, cities } from '../relocationData.js';
import { MobilityProvider } from '../context/MobilityContext.jsx';
import { CityMapPage } from './CityMapPage.jsx';
import { ScenarioLabSection } from './ScenarioLabSection.jsx';

const cityOptions = cities.slice(0, 4);
const noop = () => {};

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root = null;
let container = null;

const renderComponent = (node) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root.render(node);
  });

  return container;
};

const cleanup = () => {
  if (root) {
    act(() => {
      root.unmount();
    });
  }

  root = null;

  if (container) {
    container.remove();
  }

  container = null;
};

const clickByText = (text) => {
  const button = [...container.querySelectorAll('button, a')]
    .find((element) => element.textContent?.trim().includes(text));

  if (!button) {
    throw new Error(`Could not find clickable element with text: ${text}`);
  }

  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

const changeField = (selector, value, eventType = 'change') => {
  const field = container.querySelector(selector);

  if (!field) {
    throw new Error(`Could not find field for selector: ${selector}`);
  }

  act(() => {
    const prototype = Object.getPrototypeOf(field);
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (valueSetter) {
      valueSetter.call(field, value);
    } else {
      field.value = value;
    }
    field.dispatchEvent(new Event(eventType, { bubbles: true }));
  });
};

afterEach(() => {
  cleanup();
});

describe('route flow interactions', () => {
  it('lets the map route change strategic mode and persona and navigate to explorer', () => {
    const onModeChange = vi.fn();
    const onPersonaChange = vi.fn();
    const onGoToExplorer = vi.fn();

    renderComponent(
      <MobilityProvider>
        <CityMapPage
          cityOptions={cityOptions}
          selectedCity={cityOptions[0]}
          selectedModeKey="familyStability"
          onModeChange={onModeChange}
          selectedPersonaKey="internationalFamily"
          onPersonaChange={onPersonaChange}
          onSelectCity={noop}
          onBack={noop}
          onGoToExplorer={onGoToExplorer}
          onShare={noop}
          onResetLink={noop}
          isLinkCustomized={false}
        />
      </MobilityProvider>,
    );

    clickByText('Career Acceleration');
    clickByText('Startup Founder');
    clickByText('Explorer');

    expect(onModeChange).toHaveBeenCalledWith('careerAcceleration');
    expect(onPersonaChange).toHaveBeenCalledWith('startupFounder');
    expect(onGoToExplorer).toHaveBeenCalledTimes(1);
  });

  it('renders the embedded map layout for dashboard mode without route header actions', () => {
    renderComponent(
      <MobilityProvider>
        <CityMapPage
          embedded
          cityOptions={cityOptions}
          selectedCity={cityOptions[0]}
          selectedModeKey="familyStability"
          onModeChange={noop}
          selectedPersonaKey="internationalFamily"
          onPersonaChange={noop}
          onSelectCity={noop}
          comparisonCityKey=""
          onComparisonCityChange={noop}
          nearestNeighborCount={3}
          onNearestNeighborCountChange={noop}
          onShare={noop}
          onResetLink={noop}
          isLinkCustomized={false}
        />
      </MobilityProvider>,
    );

    const embeddedShell = container.querySelector('.city-map-embedded');
    const routeHeader = container.querySelector('.city-map-header');

    expect(embeddedShell).toBeTruthy();
    expect(routeHeader).toBeFalsy();
    expect(container.textContent).toContain('Urban Strategic Intelligence For Real Relocation Decisions');
  });

  it('renders Scenario Lab controls and summary cards in dashboard mode', () => {
    const outlookRows = buildTemporalOutlookRows().slice(0, 3);
    const onApplyPreset = vi.fn();
    const onSaveRun = vi.fn();
    const onLoadRun = vi.fn();
    const onDeleteRun = vi.fn();

    renderComponent(
      <ScenarioLabSection
        rows={outlookRows}
        cityOptions={cityOptions}
        selectedCityKey={outlookRows[0].key}
        onSelectCity={noop}
        selectedYear={2028}
        onYearChange={noop}
        shockType="none"
        shockSeverity={1}
        onShockTypeChange={noop}
        onShockSeverityChange={noop}
        presets={[
          { key: 'baseline-2028', label: 'Baseline 2028' },
          { key: 'inflation-stress-2029', label: 'Inflation Stress 2029' },
        ]}
        selectedPresetKey="custom"
        onApplyPreset={onApplyPreset}
        savedRuns={[
          { id: 'run-1', name: 'Vienna 2028 baseline' },
        ]}
        activeRun={{
          id: 'run-1',
          name: 'Vienna 2028 baseline',
          selectedCityKey: outlookRows[0].key,
          createdAt: '2026-05-22T10:00:00.000Z',
        }}
        onSaveRun={onSaveRun}
        onLoadRun={onLoadRun}
        onDeleteRun={onDeleteRun}
      />,
    );

    const section = container.querySelector('#sec-scenario-lab');
    const summaryDeck = container.querySelector('[aria-label="Scenario lab summary"]');

    expect(section).toBeTruthy();
    expect(summaryDeck).toBeTruthy();
    expect(container.textContent).toContain('Scenario Lab');
    expect(container.textContent).toContain('Strategic Event');
    expect(container.textContent).toContain('Shock Severity');
    expect(container.textContent).toContain('Run: Vienna 2028 baseline');
    expect(container.textContent).toContain('City:');

    changeField('select[aria-label="Scenario lab preset"]', 'inflation-stress-2029');
    changeField('input[aria-label="Scenario run label"]', 'My stress run');
    clickByText('Save Run');
    changeField('select[aria-label="Scenario saved runs"]', 'run-1');
    clickByText('Load Run');
    clickByText('Delete Run');

    expect(onApplyPreset).toHaveBeenCalledWith('inflation-stress-2029');
    expect(onSaveRun).toHaveBeenCalledWith('My stress run');
    expect(onLoadRun).toHaveBeenCalledWith('run-1');
    expect(onDeleteRun).toHaveBeenCalledWith('run-1');
  });
});