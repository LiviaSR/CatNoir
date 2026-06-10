/**
 * Export the loaded BH catalogue (BlackHoleData) as JSON or CSV.
 */
var CATALOG_EXPORT_FIELDS = [
  { key: 'P_orb', value: 'porb_mu', up: 'porb_sigma_plus', down: 'porb_sigma_minus', type: 'type_p' },
  { key: 'K_cp', value: 'kcp_mu', up: 'kcp_sigma_plus', down: 'kcp_sigma_minus', type: 'type_k' },
  { key: 'e', value: 'e_mu', up: 'e_sigma', down: 'e_sigma', type: 'type_e' },
  { key: 'orb_angle', value: 'i_mu', up: 'i_sigma_plus', down: 'i_sigma_minus', type: 'type_i' },
  { key: 'q', value: 'q_mu', up: 'q_sigma_plus', down: 'q_sigma_minus', type: 'type_q' },
  { key: 'm_literat', value: 'mbh_mu', up: 'mbh_sigma_plus', down: 'mbh_sigma_minus', type: 'type_m' },
  { key: 'm_bh', value: 'm_new_mu', up: 'm_new_sigma_plus', down: 'm_new_sigma_minus', type: 'type_mnew' },
];

var catalogDownloadVersion = '';

function fetchCatalogDownloadVersion() {
  return fetch('/js/site_version.json')
    .then(function (res) {
      return res.ok ? res.json() : {};
    })
    .then(function (data) {
      catalogDownloadVersion = data && data.version ? String(data.version) : '';
    })
    .catch(function () {
      catalogDownloadVersion = '';
    });
}

function catalogExportBasename() {
  var base = 'CatNoir_catalog';
  return catalogDownloadVersion ? base + '_v' + catalogDownloadVersion : base;
}

function csvEscape(value) {
  if (value == null) return '';
  var s = String(value);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function fieldToCsvParts(field) {
  if (!field || typeof field !== 'object') {
    return ['', '', '', ''];
  }
  var distType = field.type || '';
  var value = field.value;
  var unc = field.uncertainty || {};
  var up = unc.up;
  var down = unc.down;
  if (distType === 'u' && up != null && down != null) {
    var swap = up;
    up = down;
    down = swap;
  }
  return [
    value == null ? '' : value,
    up == null ? '' : up,
    down == null ? '' : down,
    distType,
  ];
}

function catalogToCsvRows(catalog) {
  var headers = ['name', 'Type', 'Confirmed', 'simbad'];
  CATALOG_EXPORT_FIELDS.forEach(function (f) {
    headers.push(f.value, f.up, f.down, f.type);
  });
  headers.push('ref_1', 'ref_2', 'ref_3', 'ref_1_descrip', 'ref_2_descrip', 'ref_3_descrip');

  var lines = [headers.map(csvEscape).join(',')];

  catalog.forEach(function (entry) {
    var row = [
      entry.name || '',
      entry.Type || '',
      entry.Confirmed === false ? 'false' : 'true',
      entry.simbad || '',
    ];

    CATALOG_EXPORT_FIELDS.forEach(function (f) {
      row = row.concat(fieldToCsvParts(entry[f.key]));
    });

    var refs = entry.references || [];
    for (var i = 0; i < 3; i++) {
      var ref = refs[i];
      row.push(ref && ref.link ? ref.link : '');
    }
    for (var j = 0; j < 3; j++) {
      var refD = refs[j];
      row.push(refD && refD.descrip ? refD.descrip : '');
    }

    lines.push(row.map(csvEscape).join(','));
  });

  return lines.join('\n') + '\n';
}

function catalogToJsonString(catalog) {
  return JSON.stringify(catalog, null, 4) + '\n';
}

function triggerBlobDownload(content, mimeType, filename) {
  var blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 0);
}

function downloadCatalog(format) {
  if (!BlackHoleData || !BlackHoleData.length) {
    console.warn('Catalog not loaded yet.');
    return;
  }

  var base = catalogExportBasename();
  if (format === 'json') {
    triggerBlobDownload(
      catalogToJsonString(BlackHoleData),
      'application/json',
      base + '.json'
    );
  } else if (format === 'csv') {
    triggerBlobDownload(
      catalogToCsvRows(BlackHoleData),
      'text/csv',
      base + '.csv'
    );
  }
}

function initCatalogDownload() {
  var btn = document.getElementById('catalog-download-btn');
  var select = document.getElementById('catalog-download-format');
  if (!btn || !select) return;

  btn.disabled = false;
  fetchCatalogDownloadVersion();

  btn.addEventListener('click', function () {
    downloadCatalog(select.value);
  });
}
