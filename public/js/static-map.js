document.addEventListener('DOMContentLoaded', () => {
  const mapEl = document.getElementById('staticMap');
  if (!mapEl) return;

  const token = mapEl.dataset.token;
  const lat = parseFloat(mapEl.dataset.lat);
  const lng = parseFloat(mapEl.dataset.lng);
  const zoom = parseInt(mapEl.dataset.zoom) || 10;
  const style = mapEl.dataset.style || 'mapbox/streets-v11';

  if (!token || isNaN(lat) || isNaN(lng)) {
    console.warn('Mapbox token or coordinates missing');
    return;
  }

  mapboxgl.accessToken = token;
  const map = new mapboxgl.Map({
    container: 'staticMap',
    style: `mapbox://styles/${style}`,
    center: [lng, lat],
    zoom,
  });

  new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);

  mapEl.style.display = 'block';

  // Dispatch event to notify map loaded
  const event = new Event('static-map:loaded');
  document.dispatchEvent(event);
});
