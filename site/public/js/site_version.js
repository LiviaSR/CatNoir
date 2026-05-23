/** Load site_version.json and fill elements with [data-site-version]. */
function applySiteVersion() {
  fetch('/js/site_version.json')
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then(function (data) {
      var v = data && data.version ? String(data.version) : '';
      if (!v) return;
      var label = 'v' + v;
      document.querySelectorAll('[data-site-version]').forEach(function (el) {
        el.textContent = label;
      });
      document.querySelectorAll('[data-site-version-plain]').forEach(function (el) {
        el.textContent = v;
      });
    })
    .catch(function () {});
}

document.addEventListener('DOMContentLoaded', applySiteVersion);
