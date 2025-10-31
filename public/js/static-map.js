/* public/js/static-map.js */
/* eslint-disable */
(function () {
  'use strict';

  // Mapbox CDN URLs (adjust version if needed)
  const MAPBOX_JS = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
  const MAPBOX_CSS =
    'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';

  // How long to wait (ms) for mapboxgl to appear after script load
  const MAPBOX_WAIT_MS = 3000;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // If already present, resolve immediately
      if (document.querySelector(`script[src="${src}"]`)) {
        return resolve();
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = false; // try to preserve execution order
      s.defer = false;
      s.crossOrigin = 'anonymous';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load script: ' + src));
      document.head.appendChild(s);
    });
  }

  function loadCSS(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.crossOrigin = 'anonymous';
    document.head.appendChild(l);
  }

  function dispatchLoaded() {
    const event = new Event('static-map:loaded');
    document.dispatchEvent(event);
  }

  // Wait for window.mapboxgl to exist for up to MAPBOX_WAIT_MS
  function waitForMapboxgl(timeout = MAPBOX_WAIT_MS) {
    return new Promise((resolve) => {
      if (window.mapboxgl && typeof window.mapboxgl.Map === 'function') {
        return resolve(true);
      }
      const start = Date.now();
      const iv = setInterval(() => {
        if (window.mapboxgl && typeof window.mapboxgl.Map === 'function') {
          clearInterval(iv);
          return resolve(true);
        }
        if (Date.now() - start > timeout) {
          clearInterval(iv);
          return resolve(false);
        }
      }, 50);
    });
  }

  async function ensureMapbox() {
    // If mapboxgl is already present, nothing to do
    if (window.mapboxgl && typeof window.mapboxgl.Map === 'function')
      return true;

    try {
      loadCSS(MAPBOX_CSS);
      await loadScript(MAPBOX_JS);
      const ok = await waitForMapboxgl();
      if (!ok) {
        console.warn('mapboxgl did not become available after loading script');
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Could not load Mapbox GL JS:', err);
      return false;
    }
  }

  async function init() {
    const mapEl = document.getElementById('staticMap');
    if (!mapEl) return;

    const token = mapEl.dataset.token;
    const lat = parseFloat(mapEl.dataset.lat);
    const lng = parseFloat(mapEl.dataset.lng);
    const zoom = parseInt(mapEl.dataset.zoom, 10) || 10;
    const style = mapEl.dataset.style || 'mapbox/streets-v11';
    const mapboxgl = window.mapboxgl;

    if (!token || Number.isNaN(lat) || Number.isNaN(lng)) {
      console.warn('Mapbox token or coordinates missing');
      // Still dispatch so other code can reveal fallbacks
      dispatchLoaded();
      return;
    }

    const loaded = await ensureMapbox();
    if (
      !loaded ||
      !window.mapboxgl ||
      typeof window.mapboxgl.Map !== 'function'
    ) {
      console.warn(
        'Mapbox GL JS is not available; map will not be initialized.'
      );
      dispatchLoaded();
      return;
    }

    try {
      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: 'staticMap',
        style: `mapbox://styles/${style}`,
        center: [lng, lat],
        zoom,
      });

      // Add marker
      new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);

      // Show map on load
      map.on('load', function () {
        try {
          mapEl.style.display = 'block';
        } catch (_) {
          ('}');
        }
        dispatchLoaded();
      });

      // Fallback: if load doesn't fire, reveal map after timeout
      setTimeout(() => {
        try {
          if (mapEl && mapEl.style.display !== 'block')
            mapEl.style.display = 'block';
        } catch (_) {
          ('}');
        }
        dispatchLoaded();
      }, 3000);
    } catch (err) {
      console.error('Map initialization failed', err);
      dispatchLoaded();
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
