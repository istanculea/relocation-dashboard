// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cities, buildFamilyFitRows, buildTemporalOutlookRows } from '../relocationData.js';
import { MobilityProvider } from '../context/MobilityContext.jsx';
import { CityMapPage } from './CityMapPage.jsx';
import { FamilyFitPage } from './FamilyFitPage.jsx';
import { FutureOutlookPage } from './FutureOutlookPage.jsx';

const cityOptions = cities.slice(0, 4);
const temporalRows = buildTemporalOutlookRows().filter((row) => cityOptions.some((city) => city.key === row.key));
const familyFitRows = buildFamilyFitRows().filter((row) => cityOptions.some((city) => city.key === row.key));

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

afterEach(() => {
  cleanup();
});

describe('route flow interactions', () => {
  it('lets the map route change strategic mode and persona and navigate outward', () => {
    const onModeChange = vi.fn();
    const onPersonaChange = vi.fn();
    const onGoToOutlook = vi.fn();

    renderComponent(
      <MobilityProvider>
        <CityMapPage
          cityOptions={cityOptions}
          selectedCity={cityOptions[0]}
          selectedModeKey="familyStability"
          onModeChange={onModeChange}
          selectedPersonaKey="internationalFamily"
          onPersonaChange={onPersonaChange}
          onSelectCity={vi.fn()}
          onBack={vi.fn()}
          onGoToExplorer={vi.fn()}
          onGoToOutlook={onGoToOutlook}
          onGoToFamilyFit={vi.fn()}
          onShare={vi.fn()}
          onResetLink={vi.fn()}
          isLinkCustomized={false}
        />
      </MobilityProvider>,
    );

    clickByText('Career Acceleration');
    clickByText('Startup Founder');
    clickByText('Outlook');

    expect(onModeChange).toHaveBeenCalledWith('careerAcceleration');
    expect(onPersonaChange).toHaveBeenCalledWith('startupFounder');
    expect(onGoToOutlook).toHaveBeenCalledTimes(1);
  });

  it('lets the outlook route switch focus city and navigate to family fit', () => {
    const onSelectCity = vi.fn();
    const onGoToFamilyFit = vi.fn();

    renderComponent(
      <FutureOutlookPage
        rows={temporalRows}
        cityOptions={cityOptions}
        selectedCityKey={temporalRows[0].key}
        onSelectCity={onSelectCity}
        selectedYear={2028}
        onYearChange={vi.fn()}
        onBack={vi.fn()}
        onGoToMap={vi.fn()}
        onGoToFamilyFit={onGoToFamilyFit}
        onShare={vi.fn()}
        onResetLink={vi.fn()}
        isLinkCustomized={false}
        shockType="none"
        shockSeverity={1}
        onShockTypeChange={vi.fn()}
        onShockSeverityChange={vi.fn()}
      />,
    );

    const focusSelect = container.querySelector('select');

    act(() => {
      focusSelect.value = temporalRows[1].key;
      focusSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    clickByText('Family Fit');

    expect(onSelectCity).toHaveBeenCalledWith(temporalRows[1].key);
    expect(onGoToFamilyFit).toHaveBeenCalledTimes(1);
  });

  it('lets the family-fit route switch anchor city and inspect a suggested match', () => {
    const onSelectCity = vi.fn();
    const onGoToOutlook = vi.fn();

    renderComponent(
      <FamilyFitPage
        rows={familyFitRows}
        cityOptions={cityOptions}
        selectedCityKey={familyFitRows[0].key}
        onSelectCity={onSelectCity}
        onBack={vi.fn()}
        onGoToMap={vi.fn()}
        onGoToOutlook={onGoToOutlook}
        onShare={vi.fn()}
        onResetLink={vi.fn()}
        isLinkCustomized={false}
      />,
    );

    const anchorSelect = container.querySelector('select');

    act(() => {
      anchorSelect.value = familyFitRows[1].key;
      anchorSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    clickByText('Outlook');

    expect(onSelectCity).toHaveBeenCalledWith(familyFitRows[1].key);
    expect(onGoToOutlook).toHaveBeenCalledTimes(1);
  });
});