(function () {
  var favBtn = document.querySelector('.toggle-fav-btn');
  if (!favBtn) return;

  function getBasePath() {
    var meta = document.querySelector('meta[name="base-path"]');
    return (meta && meta.content) || '/outdoorsy';
  }
  function getCsrf() {
    var m = document.querySelector('meta[name="csrf-token"]');
    return (m && m.content) || '';
  }

  favBtn.addEventListener('click', function (e) {
    e.preventDefault();
    var id = favBtn.getAttribute('data-id');
    if (!id) return;

    favBtn.disabled = true;
    fetch(
      getBasePath() + '/campgrounds/' + encodeURIComponent(id) + '/favorite',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrf(),
        },
        credentials: 'same-origin',
      }
    )
      .then(function (res) {
        if (res.status === 401) {
          window.location = getBasePath() + '/login';
          return null;
        }
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        var span = favBtn.querySelector('span');
        if (data.status === 'added') {
          favBtn.classList.replace('btn-outline-danger', 'btn-danger');
          favBtn.setAttribute('aria-pressed', 'true');
          favBtn.title = 'Remove from favorites';
          if (span) span.textContent = 'Remove from favorites';
        } else if (data.status === 'removed') {
          favBtn.classList.replace('btn-danger', 'btn-outline-danger');
          favBtn.setAttribute('aria-pressed', 'false');
          favBtn.title = 'Add to favorites';
          if (span) span.textContent = 'Add to favorites';
        }
      })
      .catch(function () {
        console.error('Favorite toggle failed');
      })
      .finally(function () {
        favBtn.disabled = false;
      });
  });
})();
