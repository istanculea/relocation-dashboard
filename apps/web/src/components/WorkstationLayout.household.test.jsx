// @vitest-environment jsdom

import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardProvider } from '../context/DashboardContext.jsx';
import { DEFAULT_HOUSEHOLD_PROFILE, deriveScenarioKeyFromHousehold } from '../data/dashboardConfig.js';

vi.mock('./SimulationEngine.jsx', () => ({
  SimulationEngine: () => null,
}));

vi.mock('./WorkstationScatterplot.jsx', () => ({
  Scatterplot: () => null,
}));

vi.mock('./WorkstationDossierPanel.jsx', () => ({
  PaneD: () => null,
}));

vi.mock('./CityMapPage.jsx', () => ({
  CityMapPage: () => <div>Map stub</div>,
}));

vi.mock('./ScenarioLabSection.jsx', () => ({
  ScenarioLabSection: () => <section id="sec-scenario-lab">Scenario lab stub</section>,
}));

import { WorkstationLayout } from './WorkstationLayout.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root = null;
let container = null;

const changeValue = (selector, value, type = 'change') => {
  const element = container.querySelector(selector);

  if (!element) {
    throw new Error(`Missing element for selector: ${selector}`);
  }

  act(() => {
    if (element.type === 'checkbox') {
      if (Boolean(element.checked) !== Boolean(value)) {
        element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    } else {
      const valueSetter = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value')?.set;
      if (valueSetter) {
        valueSetter.call(element, value);
      } else {
        element.value = value;
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (type !== 'change' && type !== 'input') {
      element.dispatchEvent(new Event(type, { bubbles: true }));
    }
  });
};

const clickByText = (text) => {
  const button = [...container.querySelectorAll('button')]
    .find((element) => element.textContent?.trim().includes(text));

  if (!button) {
    throw new Error(`Missing button with text: ${text}`);
  }

  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

const renderLayoutHarness = () => {
  const Harness = function Harness() {
    const [householdProfile, setHouseholdProfile] = useState(DEFAULT_HOUSEHOLD_PROFILE);
    const scenarioKey = deriveScenarioKeyFromHousehold(householdProfile);

    return (
      <DashboardProvider>
        <WorkstationLayout
          lensKey="balanced"
          onLensChange={vi.fn()}
          scenarioKey={scenarioKey}
          householdProfile={householdProfile}
          onHouseholdProfileChange={setHouseholdProfile}
          rows={[]}
          filteredRows={[]}
          searchValue=""
          onSearchChange={vi.fn()}
          selectedCityKey={null}
          onSelectCity={vi.fn()}
          activeFilters={[]}
          onClearFilters={vi.fn()}
          onExportPdf={vi.fn()}
          onExportXls={vi.fn()}
          onExportCsv={vi.fn()}
          onExportJson={vi.fn()}
          onGoToExplorer={vi.fn()}
          onGoToMap={vi.fn()}
          cityOptions={[]}
          selectedExplorerCity={null}
          mapComparisonCity=""
          onMapComparisonCityChange={vi.fn()}
          mapNeighborCount={3}
          onMapNeighborCountChange={vi.fn()}
          mapMode="familyStability"
          onMapModeChange={vi.fn()}
          mapPersona="internationalFamily"
          onMapPersonaChange={vi.fn()}
          futureOutlookRows={[]}
          selectedYear={2026}
          onSelectedYearChange={vi.fn()}
          shockType="none"
          onShockTypeChange={vi.fn()}
          shockSeverity={1}
          onShockSeverityChange={vi.fn()}
          onShare={vi.fn()}
          onResetLink={vi.fn()}
          isLinkCustomized={false}
        />
      </DashboardProvider>
    );
  };

  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root.render(<Harness />);
  });
};

afterEach(() => {
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
});

describe('Workstation household builder impact paths', () => {
  it('shows baseline household impact chip by default', () => {
    renderLayoutHarness();

    const impactRow = container.querySelector('[aria-label="Household impact summary"]');
    expect(impactRow?.textContent).toContain('Baseline profile');
  });

  it('maps each household control interaction to a score-impact chip', () => {
    renderLayoutHarness();

    changeValue('input[aria-label="Household kids count"]', '3');
    expect(container.textContent).toContain('Kids: 3');
    expect(container.textContent).toContain('childcare and school-quality impact');

    changeValue('input[aria-label="Household includes pets"]', true);
    expect(container.textContent).toContain('Pets enabled');
    expect(container.textContent).toContain('environmental quality and social-capital influence');

    changeValue('input[aria-label="Remote work ratio"]', '70', 'input');
    expect(container.textContent).toContain('Remote: 70%');
    expect(container.textContent).toContain('jobs, social rhythm, and neighborhood fit');

    changeValue('select[aria-label="Household language readiness"]', 'fluent');
    expect(container.textContent).toContain('Language: fluent');
    expect(container.textContent).toContain('relocation-friction sensitivity');

    changeValue('select[aria-label="Household budget stance"]', 'strict');
    expect(container.textContent).toContain('Budget: strict');
    expect(container.textContent).toContain('affordability stress or flexibility');

    changeValue('select[aria-label="Household commute tolerance"]', 'low');
    expect(container.textContent).toContain('Commute: low');
    expect(container.textContent).toContain('mobility and infrastructure');

    changeValue('select[aria-label="Household risk appetite"]', 'high');
    expect(container.textContent).toContain('Risk: high');
    expect(container.textContent).toContain('safety resilience and growth upside');
  });

  it('resets builder controls back to baseline profile', () => {
    renderLayoutHarness();

    changeValue('input[aria-label="Household kids count"]', '2');
    expect(container.textContent).toContain('Kids: 2');

    clickByText('Reset household');

    expect(container.textContent).toContain('Baseline profile');
    expect(container.textContent).not.toContain('Kids: 2');
  });
});