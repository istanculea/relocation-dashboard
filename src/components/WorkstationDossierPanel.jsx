import { useCallback, useEffect, useRef, useState } from 'react';
import { DossierProfile } from './WorkstationDossierProfile.jsx';

const fmt = (value) => (typeof value === 'number' ? value.toFixed(2) : '—');

const clampPanelWidth = (baseWidth, delta) => {
  const proposedWidth = baseWidth + delta;
  return Math.max(320, Math.min(window.innerWidth * 0.92, proposedWidth));
};

const DossierCompareColumn = function dossierCompareColumn({ city, isPinned, onPin, tone }) {
  return (
    <div className={tone === 'secondary' ? 'ws-dossier__compare-col' : 'ws-dossier__compare-col'} style={tone === 'secondary' ? { borderLeft: '1px solid var(--ws-border-strong)', paddingLeft: 10 } : undefined}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <strong style={{ color: tone === 'secondary' ? 'var(--ws-blue)' : 'var(--ws-accent)', fontSize: 18 }}>{city.city}</strong>
        <button type="button" className={`ws-dossier__pin-btn${isPinned ? ' ws-dossier__pin-btn--pinned' : ''}`} onClick={() => onPin(city.key)}>
          {isPinned ? '📌' : '+ Pin'}
        </button>
      </div>
      <DossierProfile city={city} />
    </div>
  );
};

const DossierHeader = function dossierHeader({ city, getCityRank, isCompare, isCompared, onClose, onCompare }) {
  return (
    <div className="ws-dossier__header">
      <button className="ws-dossier__close" onClick={onClose} aria-label="Close dossier" type="button">✕</button>
      {city && !isCompare && (
        <>
          <div className="ws-dossier__city-info">
            <div className="ws-dossier__city-name">{city.city}</div>
            <div className="ws-dossier__city-meta">
              <span>{city.country}</span>
              <span>·</span>
              <span>Rank #{getCityRank ? (getCityRank(city.key) ?? '—') : '—'}</span>
            </div>
          </div>
          <div className="ws-dossier__score-badge">{fmt(city.activeWeightedScore)}</div>
          <button
            type="button"
            className={`ws-dossier__pin-btn${isCompared ? ' ws-dossier__pin-btn--pinned' : ''}`}
            onClick={() => onCompare(city.key)}
          >
            {isCompared ? '📌 Pinned' : '+ Pin to Compare'}
          </button>
        </>
      )}
      {isCompare && (
        <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: 'var(--ws-ink)' }}>
          Side-by-Side Comparison
        </div>
      )}
    </div>
  );
};

const DossierBody = function dossierBody({ city, cityB, isCompare, isPinnedA, isPinnedB, onPin }) {
  if (!isCompare || !city || !cityB) {
    return city ? <DossierProfile city={city} /> : null;
  }

  return (
    <div className="ws-dossier__compare-grid">
      <DossierCompareColumn city={city} isPinned={isPinnedA} onPin={onPin} tone="primary" />
      <DossierCompareColumn city={cityB} isPinned={isPinnedB} onPin={onPin} tone="secondary" />
    </div>
  );
};

export function PaneD({ city, cityB, isOpen, isCompare, onClose, onPin, onCompare, compareKeys, pinnedKeys, getCityRank }) {
  const [panelWidth, setPanelWidth] = useState(null);
  const dragRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleResizeMouseDown = useCallback((event) => {
    event.preventDefault();
    const panelElement = event.currentTarget.parentElement;
    const startWidth = panelElement.getBoundingClientRect().width;
    dragRef.current = { startWidth, startX: event.clientX };

    const handleMouseMove = (moveEvent) => {
      const delta = dragRef.current.startX - moveEvent.clientX;
      setPanelWidth(clampPanelWidth(dragRef.current.startWidth, delta));
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  const isPinnedA = city ? pinnedKeys.has(city.key) : false;
  const isPinnedB = cityB ? pinnedKeys.has(cityB.key) : false;
  const isComparedA = city && compareKeys ? compareKeys.has(city.key) : false;
  const dialogClassName = [
    'ws-dossier',
    isOpen ? 'ws-dossier--open' : '',
    isCompare ? 'ws-dossier--compare' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="ws-dossier-backdrop" aria-hidden={!isOpen}>
      <div
        className={dialogClassName}
        role="dialog"
        aria-label={city ? `${city.city} city dossier` : 'City dossier'}
        aria-modal="true"
        style={panelWidth ? { width: panelWidth } : undefined}
      >
        <div className="ws-dossier__resize-handle" onMouseDown={handleResizeMouseDown} />
        <DossierHeader
          city={city}
          getCityRank={getCityRank}
          isCompare={isCompare}
          isCompared={isComparedA}
          onClose={onClose}
          onCompare={onCompare}
        />
        <div className="ws-dossier__body">
          <DossierBody city={city} cityB={cityB} isCompare={isCompare} isPinnedA={isPinnedA} isPinnedB={isPinnedB} onPin={onPin} />
        </div>
      </div>
    </div>
  );
}
