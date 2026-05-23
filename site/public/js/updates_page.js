/**
 * Render catalogue changelog on html/updates.html from catalog_updates.json.
 */
function renderCatalogUpdates() {
  var container = document.getElementById('catalog-updates-list');
  if (!container) return;

  fetch('/js/catalog_updates.json')
    .then(function (res) {
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      return res.json();
    })
    .then(function (entries) {
      container.replaceChildren();
      if (!Array.isArray(entries) || entries.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'catalog-updates-empty';
        empty.textContent = 'No catalogue updates recorded yet.';
        container.appendChild(empty);
        return;
      }
      var list = document.createElement('ul');
      list.className = 'catalog-updates-list list-unstyled mb-0';
      entries.forEach(function (item) {
        if (!item || !item.date || !item.message) return;
        var li = document.createElement('li');
        li.className = 'catalog-updates-item';
        li.textContent = item.date + ' - ' + item.message;
        list.appendChild(li);
      });
      container.appendChild(list);
    })
    .catch(function (err) {
      console.error('Failed to load catalogue updates:', err);
      container.replaceChildren();
      var errP = document.createElement('p');
      errP.className = 'catalog-updates-empty';
      errP.textContent = 'Could not load the updates list.';
      container.appendChild(errP);
    });
}

document.addEventListener('DOMContentLoaded', renderCatalogUpdates);
