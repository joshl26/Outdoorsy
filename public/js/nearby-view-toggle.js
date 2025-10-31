/* eslint-disable */
/* global initNearbyMap */

/**
 * public/js/nearby-view-toggle.js
 *
 * Toggle between grid and map views on the Nearby page.
 * - Hides skeletons and reveals real content after a simulated load.
 * - Adds keyboard accessibility for Enter/Space on the toggle buttons.
 * - Calls global initNearbyMap() (if available) when switching to map view.
 *
 * Ensure the script that defines `initNearbyMap` is loaded before this file
 * (or keep it global and available on window).
 */

(function () {
  'use strict';

  const gridViewBtn = document.getElementById('gridViewBtn');
  const mapViewBtn = document.getElementById('mapViewBtn');
  const gridContainer = document.getElementById('gridContainer');
  const mapContainer = document.getElementById('mapContainer');

  // Utility: safely add a keyboard handler for activation (Enter / Space)
  function addKeyboardActivate(el, handler) {
    if (!el) return;
    el.addEventListener('keydown', function (ev) {
      // 13 = Enter, 32 = Space
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault();
        handler.call(this, ev);
      }
    });
  }

  // Simulate content load and hide skeletons
  function showRealContent() {
    if (gridContainer) {
      const skeletonGrid = gridContainer.querySelector('.skeleton-grid');
      const realGrid = gridContainer.querySelector('.real-grid-content');

      if (skeletonGrid) skeletonGrid.style.display = 'none';
      if (realGrid) {
        realGrid.style.display = 'block';
        realGrid.classList.add('fade-in-content');
      }
    }

    if (mapContainer) {
      const skeletonMap = mapContainer.querySelector('.skeleton-map');
      const realMap = mapContainer.querySelector('.real-map-content');

      if (skeletonMap) skeletonMap.style.display = 'none';
      if (realMap) {
        realMap.style.display = 'block';
        realMap.classList.add('fade-in-content');
      }
    }
  }

  // Reveal real content after a short delay (simulate load).
  // In production, call showRealContent() after actual data/map load completes.
  setTimeout(showRealContent, 800);

  // Toggle helpers
  function activateGridView() {
    if (gridContainer) gridContainer.style.display = 'block';
    if (mapContainer) mapContainer.style.display = 'none';

    if (gridViewBtn) {
      gridViewBtn.classList.add('active');
      gridViewBtn.setAttribute('aria-pressed', 'true');
    }
    if (mapViewBtn) {
      mapViewBtn.classList.remove('active');
      mapViewBtn.setAttribute('aria-pressed', 'false');
    }
  }

  function activateMapView() {
    if (gridContainer) gridContainer.style.display = 'none';
    if (mapContainer) mapContainer.style.display = 'block';

    if (mapViewBtn) {
      mapViewBtn.classList.add('active');
      mapViewBtn.setAttribute('aria-pressed', 'true');
    }
    if (gridViewBtn) {
      gridViewBtn.classList.remove('active');
      gridViewBtn.setAttribute('aria-pressed', 'false');
    }

    // Initialize map if a global initNearbyMap function exists
    if (typeof initNearbyMap === 'function') {
      try {
        initNearbyMap();
      } catch (err) {
        // Fail silently — map initialization shouldn't break toggling
        // Consider logging during development
        // console.error('initNearbyMap error', err);
      }
    }
  }

  // Wire up click + keyboard handlers
  if (gridViewBtn && mapViewBtn && gridContainer && mapContainer) {
    gridViewBtn.addEventListener('click', activateGridView);
    mapViewBtn.addEventListener('click', activateMapView);

    addKeyboardActivate(gridViewBtn, activateGridView);
    addKeyboardActivate(mapViewBtn, activateMapView);
  } else {
    // If some elements are missing, still try to gracefully attach handlers
    if (gridViewBtn) {
      gridViewBtn.addEventListener('click', activateGridView);
      addKeyboardActivate(gridViewBtn, activateGridView);
    }
    if (mapViewBtn) {
      mapViewBtn.addEventListener('click', activateMapView);
      addKeyboardActivate(mapViewBtn, activateMapView);
    }
  }
})();
