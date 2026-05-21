import { useEffect, useMemo, useState } from 'react';
import { persistStoredValue, readStoredValue } from '../utils/storagePersistence.js';

const ROUTE_OPTIONS = [
  { key: 'eu', label: 'EU Citizen Route' },
  { key: 'nonEu', label: 'Non-EU Route (Scaffold)' },
];

const getStorageKey = (cityKey, routeKey) => `relocation-dashboard:residency-plan:${cityKey}:${routeKey}`;

const parseBureaucracyScore = (text) => {
  if (typeof text !== 'string') {
    return null;
  }

  const match = text.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  return match ? Number(match[1]) : null;
};

const parseLeadTimeHint = (text) => {
  if (typeof text !== 'string') {
    return null;
  }

  const match = text.match(/(\d+\s*-\s*\d+\s*(?:working\s*)?(?:days|weeks|months))/i);
  return match ? match[1] : null;
};

const buildSteps = (city, routeKey) => {
  const overview = city?.city360 ?? {};

  const euSteps = [
    {
      id: 'residence-registration',
      title: 'Residence Registration',
      detail: overview.euRegistration ?? 'Collect residence registration requirements from official municipal pages.',
    },
    {
      id: 'tax-id',
      title: 'Local ID / Tax Setup',
      detail: overview.localIdTaxNumber ?? 'Confirm tax ID path and required documents for employment and banking.',
    },
    {
      id: 'health-enrollment',
      title: 'Health Enrollment',
      detail: city?.health?.registration ?? 'Confirm public insurance enrollment and family doctor/pediatrician registration path.',
    },
    {
      id: 'profession-readiness',
      title: 'Professional Readiness',
      detail: overview.itDiplomaRecognition ?? overview.psychologistRegulation ?? 'Confirm diploma recognition and any board registration requirements.',
    },
  ];

  const nonEuSteps = [
    {
      id: 'entry-route',
      title: 'Entry Route Validation',
      detail: 'Identify eligible visa/permit track for your profile (work, self-employment, family reunification, or entrepreneur).',
    },
    {
      id: 'sponsorship-docs',
      title: 'Sponsorship & Documentation',
      detail: 'Prepare employer/sponsor documents, proof of funds, accommodation proof, insurance, and translated records.',
    },
    {
      id: 'post-arrival-registration',
      title: 'Post-Arrival Registration',
      detail: overview.euRegistration ?? 'Complete local registration and resident permit issuance steps after arrival.',
    },
    {
      id: 'tax-health-onboarding',
      title: 'Tax + Health Onboarding',
      detail: overview.localIdTaxNumber ?? city?.health?.registration ?? 'Finalize tax number and healthcare enrollment after residency status is active.',
    },
  ];

  return routeKey === 'nonEu' ? nonEuSteps : euSteps;
};

const deserializePlan = (raw, steps) => {
  if (!raw) {
    return Object.fromEntries(steps.map((step) => [step.id, false]));
  }

  try {
    const parsed = JSON.parse(raw);
    return Object.fromEntries(steps.map((step) => [step.id, Boolean(parsed?.[step.id])]));
  } catch {
    return Object.fromEntries(steps.map((step) => [step.id, false]));
  }
};

export const VisaResidencyPlannerPanel = function visaResidencyPlannerPanel({ city }) {
  const cityKey = city?.key;
  const [routeKey, setRouteKey] = useState('eu');
  const steps = useMemo(() => buildSteps(city, routeKey), [city, routeKey]);
  const [stepState, setStepState] = useState(() => deserializePlan('', steps));

  const bureaucracyScore = parseBureaucracyScore(city?.city360?.adminBureaucracy);
  const leadTimeHint = parseLeadTimeHint(city?.city360?.euRegistration);

  useEffect(() => {
    if (!cityKey) {
      return;
    }

    const raw = readStoredValue(getStorageKey(cityKey, routeKey), '', () => true);
    setStepState(deserializePlan(raw, steps));
  }, [cityKey, routeKey, steps]);

  useEffect(() => {
    if (!cityKey) {
      return;
    }

    persistStoredValue(getStorageKey(cityKey, routeKey), JSON.stringify(stepState));
  }, [cityKey, routeKey, stepState]);

  const completedCount = steps.filter((step) => stepState[step.id]).length;

  if (!city) {
    return null;
  }

  return (
    <section className="panel stack-gap-lg" aria-label={`Visa and residency planner for ${city.city}`}>
      <div className="section-title">
        <p>Visa & Residency Planner</p>
        <h3>{city.city} Onboarding Path</h3>
        <span>Phase 2 scaffold: track legal setup milestones and registration readiness per city.</span>
      </div>

      <div className="residency-planner__meta">
        <div className="residency-planner__meta-item">
          <span>Lead-time hint</span>
          <strong>{leadTimeHint ?? 'Check official timelines'}</strong>
        </div>
        <div className="residency-planner__meta-item">
          <span>Bureaucracy signal</span>
          <strong>{Number.isFinite(bureaucracyScore) ? `${bureaucracyScore}/10` : 'Not parsed yet'}</strong>
        </div>
        <div className="residency-planner__meta-item">
          <span>Progress</span>
          <strong>{completedCount} / {steps.length}</strong>
        </div>
      </div>

      <div className="fin-mode-toggle" role="group" aria-label="Residency route selection">
        {ROUTE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`fin-mode-btn${routeKey === option.key ? ' fin-mode-btn--active' : ''}`}
            onClick={() => setRouteKey(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {routeKey === 'nonEu' && (
        <p className="fin-disclaimer">
          Non-EU flow is an implementation scaffold. Validate current national immigration rules before any move decision.
        </p>
      )}

      <ul className="residency-planner__steps">
        {steps.map((step, index) => (
          <li key={step.id} className="residency-planner__step">
            <label>
              <input
                type="checkbox"
                checked={Boolean(stepState[step.id])}
                onChange={() => setStepState((previous) => ({
                  ...previous,
                  [step.id]: !previous[step.id],
                }))}
              />
              <span className="residency-planner__step-order">{index + 1}.</span>
              <span className="residency-planner__step-title">{step.title}</span>
            </label>
            <p>{step.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};
