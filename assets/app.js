(() => {
  const lastViewed = document.getElementById('last-viewed');
  if (!lastViewed) {
    return;
  }

  lastViewed.textContent = new Date().toLocaleString();
})();
