const DashboardStatusPanel = function dashboardStatusPanel({ title, detail }) {
  return (
    <div className="app-shell">
      <main className="dashboard">
        <section className="panel stack-gap-lg" aria-live="polite">
          <h2>{title}</h2>
          <p>{detail}</p>
        </section>
      </main>
    </div>
  );
};

export default DashboardStatusPanel;
