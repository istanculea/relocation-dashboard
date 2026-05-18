(() => {
  const lastUpdated = document.getElementById('last-updated');
  if (!lastUpdated) {
    return;
  }

  lastUpdated.textContent = new Date().toLocaleString();
})();
