export const CellList = function cellList({ items }) {
  return (
    <ul className="cell-list">
      {items.filter(Boolean).map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};

export const PhaseSection = function phaseSection({ phase, title, description, children, className = '' }) {
  const sectionClassName = className ? `phase-section ${className}` : 'phase-section';

  return (
    <div className={sectionClassName}>
      <div className="phase-title">
        <p>{phase}</p>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      {children}
    </div>
  );
};

export const CityButton = function cityButton({ row, rank, onSelectCity }) {
  return (
    <button type="button" className="table-row-button" onClick={() => onSelectCity(row.key)}>
      <strong>{rank ? `${rank}. ${row.city}` : row.city}</strong>
      <span>{row.country}</span>
    </button>
  );
};