// public/js/nearby-static-map.js
(function () {
  function ready(fn) {
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function getJson(id) {
    try {
      const el = document.getElementById(id);
      if (!el) return null;
      return JSON.parse(el.textContent || 'null');
    } catch (e) {
      console.warn('[nearby-map] Failed to parse JSON payload:', e);
      return null;
    }
  }

  function computeCenter(points, queryCenter) {
    const valid = (points || []).filter(
      (p) => isFinite(p.lng) && isFinite(p.lat)
    );
    if (valid.length === 0) {
      if (queryCenter && isFinite(queryCenter.lng) && isFinite(queryCenter.lat))
        return queryCenter;
      return null;
    }
    const avgLng = valid.reduce((s, p) => s + p.lng, 0) / valid.length;
    const avgLat = valid.reduce((s, p) => s + p.lat, 0) / valid.length;
    return { lng: avgLng, lat: avgLat };
  }

  function clampZoom(z) {
    const n = Number(z);
    if (!isFinite(n)) return 10;
    return Math.max(1, Math.min(16, Math.round(n)));
  }

  function buildStaticUrl({ token, style, zoom, size, center, points }) {
    if (!token) return null;
    const st = style || 'mapbox/outdoors-v12';
    const sz = size || '1200x675@2x';
    const z = clampZoom(zoom);

    const pins = (points || [])
      .filter((p) => isFinite(p.lng) && isFinite(p.lat))
      .slice(0, 100) // Static API limit safeguard
      .map((p) => `pin-s+1e88e5(${p.lng},${p.lat})`);

    const overlay = pins.length ? `/${pins.join(',')}` : '';
    const lng = center?.lng ?? 0;
    const lat = center?.lat ?? 0;

    const base = `https://api.mapbox.com/styles/v1/${st}/static`;
    const view = `/${lng},${lat},${z},0`;
    const query = `?access_token=${encodeURIComponent(token)}`;

    const url = `${base}${overlay}${view}/${sz}${query}`;
    return url;
  }

  function renderMap() {
    const el = document.getElementById('nearbyStaticMap');
    if (!el) return;

    const token = el.getAttribute('data-token');
    if (!token) {
      console.warn('[nearby-map] Missing MAPBOX token.');
      return;
    }

    const data = getJson('nearbyPoints') || {};
    const points = Array.isArray(data.points) ? data.points : [];
    const queryCenter =
      data.queryCenter &&
      isFinite(data.queryCenter.lng) &&
      isFinite(data.queryCenter.lat)
        ? data.queryCenter
        : null;

    const center = computeCenter(points, queryCenter);
    const zoom = el.getAttribute('data-zoom') || 10;
    const size = el.getAttribute('data-size') || '1200x675@2x';
    const style = el.getAttribute('data-style') || 'mapbox/outdoors-v12';

    const url = buildStaticUrl({ token, style, zoom, size, center, points });
    if (!url) return;

    const img = new Image();
    img.decoding = 'async';
    img.loading = 'eager';
    img.onload = function () {
      el.style.backgroundImage = `url("${url}")`;
      el.setAttribute(
        'aria-label',
        `Map preview with ${points.length} result${points.length === 1 ? '' : 's'}`
      );
      el.classList.remove('is-loading');
    };
    img.onerror = function (e) {
      console.error('[nearby-map] Failed to load static map.', e);
      el.classList.add('is-error');
      el.title = 'Failed to load map preview';
    };

    // Expose URL for quick debugging
    window.__lastNearbyMapUrl = url;
    console.log('[nearby-map] URL:', url);

    el.classList.add('is-loading');
    img.src = url;
  }

  function bindViewToggle() {
    const grid = document.getElementById('gridContainer');
    const mapCard = document.getElementById('mapContainer');
    const viewGrid = document.getElementById('viewGrid');
    const viewMap = document.getElementById('viewMap');

    if (!grid || !mapCard || !viewGrid || !viewMap) return;

    function update() {
      const showMap = viewMap.checked;
      mapCard.style.display = showMap ? '' : 'none';
      grid.style.display = showMap ? 'none' : '';
      if (showMap && !mapCard.dataset.inited) {
        renderMap();
        mapCard.dataset.inited = '1';
      }
    }

    viewGrid.addEventListener('change', update);
    viewMap.addEventListener('change', update);

    // Initialize default state (grid checked by default)
    update();
  }

  ready(function () {
    bindViewToggle();
  });
})();
