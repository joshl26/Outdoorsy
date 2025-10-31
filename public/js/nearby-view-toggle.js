// public/js/nearby-view-toggle.js
(function () {
  'use strict';

  const gridViewBtn = document.getElementById('gridViewBtn');
  const mapViewBtn = document.getElementById('mapViewBtn');
  const gridContainer = document.getElementById('gridContainer');
  const mapContainer = document.getElementById('mapContainer');

  // Simulate content load and hide skeletons
  function showRealContent() {
    // Hide skeletons
    const skeletonGrid = gridContainer.querySelector('.skeleton-grid');
    const skeletonMap = mapContainer.querySelector('.skeleton-map');

    // Show real content
    const realGrid = gridContainer.querySelector('.real-grid-content');
    const realMap = mapContainer.querySelector('.real-map-content');

    if (skeletonGrid) skeletonGrid.style.display = 'none';
    if (skeletonMap) skeletonMap.style.display = 'none';

    if (realGrid) {
      realGrid.style.display = 'block';
      realGrid.classList.add('fade-in-content');
    }
    if (realMap) {
      realMap.style.display = 'block';
      realMap.classList.add('fade-in-content');
    }
  }

  // Show real content after a short delay (simulating load time)
  // In production, call this after your data fetch completes
  setTimeout(showRealContent, 800);

  // View toggle logic
  if (gridViewBtn && mapViewBtn && gridContainer && mapContainer) {
    gridViewBtn.addEventListener('click', function () {
      gridContainer.style.display = 'block';
      mapContainer.style.display = 'none';
      gridViewBtn.classList.add('active');
      mapViewBtn.classList.remove('active');
      gridViewBtn.setAttribute('aria-pressed', 'true');
      mapViewBtn.setAttribute('aria-pressed', 'false');
    });

    mapViewBtn.addEventListener('click', function () {
      gridContainer.style.display = 'none';
      mapContainer.style.display = 'block';
      mapViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
      mapViewBtn.setAttribute('aria-pressed', 'true');
      gridViewBtn.setAttribute('aria-pressed', 'false');

      // Initialize map if not already done
      if (typeof initNearbyMap === 'function') {
        initNearbyMap();
      }
    });
  }
})();
