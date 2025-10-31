// public/js/nearby-geolocate.js
(function () {
  function onGeoSuccess(pos) {
    const { latitude, longitude } = pos.coords || {};
    const latEl = document.getElementById('lat');
    const lngEl = document.getElementById('lng');
    if (
      latEl &&
      lngEl &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      latEl.value = latitude.toFixed(6);
      lngEl.value = longitude.toFixed(6);
    }
    const form = document.getElementById('nearbyForm');
    if (form) form.submit();
  }
  function onGeoError(err) {
    alert(
      'Unable to get your location. Please allow location access or enter lat/lng manually.'
    );
    console.warn('[nearby] geolocation error:', err);
  }
  function bind(id) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      });
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    bind('useLocationBtn');
    bind('useLocationBtn_sm');
  });
})();
