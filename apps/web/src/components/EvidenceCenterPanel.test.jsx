// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { EvidenceCenterPanel } from './EvidenceCenterPanel.jsx';

let root = null;
let container = null;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const renderComponent = (node) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root.render(node);
  });

  return container;
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

describe('EvidenceCenterPanel', () => {
  it('renders confidence, freshness, risk chip, and source references', () => {
    renderComponent(
      <EvidenceCenterPanel
        city={{
          key: 'vienna-at',
          city: 'Vienna',
          country: 'Austria',
          audit: { lastReviewed: '2026-05-10' },
          verificationProfile: {
            confidence: 0.81,
            evidenceClass: 'sourceBacked',
            sourceCount: 7,
            sourceDiversityScore: 0.75,
            freshnessDays: 25,
            freshnessDecay: 0.96,
            verifiedAt: '2026-05-10',
          },
        }}
        snapshot={{
          verificationProfile: {
            confidence: 0.81,
            evidenceClass: 'sourceBacked',
            sourceCount: 7,
            sourceDiversityScore: 0.75,
            freshnessDays: 25,
            freshnessDecay: 0.96,
            verifiedAt: '2026-05-10',
          },
          verifiedDetails: [
            {
              sources: [
                { label: 'Austria Gov Data', verifiedAt: '2026-05-01' },
                { label: 'Eurostat', verifiedAt: '2026-04-18' },
              ],
            },
          ],
        }}
      />,
    );

    expect(container.textContent).toContain('Evidence Center');
    expect(container.textContent).toContain('81%');
    expect(container.textContent).toContain('Low risk');
    expect(container.textContent).toContain('Austria Gov Data');
    expect(container.textContent).toContain('Eurostat');
  });
});
