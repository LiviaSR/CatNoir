/**
 * Natural / alphanumeric sort: compare runs of digits numerically, other text case-insensitively.
 * Numeric runs sort before text runs when chunk types differ (e.g. "2MASS …" vs "Cyg …").
 */
function compareCatalogNames(a, b) {
  function chunks(s) {
    var out = [];
    var i = 0;
    s = String(s);
    while (i < s.length) {
      if (/\d/.test(s[i])) {
        var n = '';
        while (i < s.length && /\d/.test(s[i])) n += s[i++];
        out.push({ num: true, v: parseInt(n, 10) });
      } else {
        var t = '';
        while (i < s.length && !/\d/.test(s[i])) t += s[i++];
        out.push({ num: false, v: t.toLowerCase() });
      }
    }
    return out;
  }
  var ca = chunks(a);
  var cb = chunks(b);
  var len = Math.max(ca.length, cb.length);
  for (var i = 0; i < len; i++) {
    if (i >= ca.length) return -1;
    if (i >= cb.length) return 1;
    var x = ca[i];
    var y = cb[i];
    if (x.num && y.num) {
      if (x.v !== y.v) return x.v < y.v ? -1 : 1;
    } else if (!x.num && !y.num) {
      if (x.v < y.v) return -1;
      if (x.v > y.v) return 1;
    } else {
      if (x.num) return -1;
      return 1;
    }
  }
  return 0;
}

function registerCatalogDataTableSorts() {
  if (typeof jQuery === 'undefined' || !jQuery.fn.dataTableExt) return;
  /**
   * DataTables uses a fast sort path only when every sorted column has a *-pre formatter.
   * That path compares with < and >, which breaks NaN and natural name order. We register
   * only *-asc / *-desc so the plug-in comparator always runs (see DT _fnSort).
   */
  function catalogNumKey(v) {
    if (v == null || v === '') return Number.NaN;
    var x = parseFloat(String(v).replace(/<[^>]+>/g, '').trim());
    return Number.isFinite(x) ? x : Number.NaN;
  }
  jQuery.extend(jQuery.fn.dataTableExt.oSort, {
    'catalog-name-asc': function (a, b) {
      return compareCatalogNames(String(a == null ? '' : a), String(b == null ? '' : b));
    },
    'catalog-name-desc': function (a, b) {
      return compareCatalogNames(String(b == null ? '' : b), String(a == null ? '' : a));
    },
    'catalog-type-asc': function (a, b) {
      var sa = String(a == null ? '' : a)
        .replace(/<[^>]+>/g, '')
        .trim()
        .toLowerCase();
      var sb = String(b == null ? '' : b)
        .replace(/<[^>]+>/g, '')
        .trim()
        .toLowerCase();
      return sa < sb ? -1 : sa > sb ? 1 : 0;
    },
    'catalog-type-desc': function (a, b) {
      var sa = String(a == null ? '' : a)
        .replace(/<[^>]+>/g, '')
        .trim()
        .toLowerCase();
      var sb = String(b == null ? '' : b)
        .replace(/<[^>]+>/g, '')
        .trim()
        .toLowerCase();
      return sa < sb ? 1 : sa > sb ? -1 : 0;
    },
    'catalog-num-asc': function (a, b) {
      var na = catalogNumKey(a);
      var nb = catalogNumKey(b);
      var aNaN = !Number.isFinite(na);
      var bNaN = !Number.isFinite(nb);
      if (aNaN && bNaN) return 0;
      if (aNaN) return 1;
      if (bNaN) return -1;
      return na < nb ? -1 : na > nb ? 1 : 0;
    },
    'catalog-num-desc': function (a, b) {
      var na = catalogNumKey(a);
      var nb = catalogNumKey(b);
      var aNaN = !Number.isFinite(na);
      var bNaN = !Number.isFinite(nb);
      if (aNaN && bNaN) return 0;
      if (aNaN) return 1;
      if (bNaN) return -1;
      return na > nb ? -1 : na < nb ? 1 : 0;
    }
  });
  var oSort = jQuery.fn.dataTableExt.oSort;
  delete oSort['catalog-name-pre'];
  delete oSort['catalog-type-pre'];
  delete oSort['catalog-num-pre'];
}

/**
 * Use each cell's data-order attribute for sorting (orthogonal data). Without this,
 * DataTables sorts on innerHTML, so values/refs break numeric and name order.
 */
function registerDomDataOrderSort() {
  if (typeof jQuery === 'undefined' || !jQuery.fn.dataTable) return;
  var ext = jQuery.fn.dataTable.ext.order;
  if (ext['dom-data-order']) return;
  ext['dom-data-order'] = function (settings, col) {
    var out = [];
    for (var i = 0, len = settings.aoData.length; i < len; i++) {
      var cells = settings.aoData[i].anCells;
      var td = cells && cells[col];
      var v = td ? td.getAttribute('data-order') : '';
      out.push(v === null || v === undefined ? '' : v);
    }
    return out;
  };
}

function initBlackHoleDataTable() {
  if (typeof jQuery === 'undefined' || !jQuery.fn.DataTable) return;
  var $table = jQuery('#BH-catalogue');
  if (!$table.length || !document.getElementById('BH-catalogue-tbody').rows.length) return;
  if (jQuery.fn.dataTable.isDataTable('#BH-catalogue')) return;
  $table.DataTable({
    paging: false,
    order: [[0, 'asc']],
    orderMulti: false,
    orderCellsTop: true,
    columnDefs: [
      { type: 'catalog-name', orderDataType: 'dom-data-order', targets: 0 },
      { type: 'catalog-type', orderDataType: 'dom-data-order', targets: 1 },
      {
        type: 'catalog-num',
        orderDataType: 'dom-data-order',
        targets: [2, 3, 4, 5, 6, 7, 8]
      }
    ]
  });
}

function buildPlotlyAxisControls() {
  var fields = Object.keys(fieldMeta);
  ['x', 'y'].forEach(function(axis) {
    var container = document.getElementById('plotly-' + axis + '-controls');
    fields.forEach(function(key) {
      var meta = fieldMeta[key];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'plot-pill plot-pill--axis';
      if (plotlyState[axis] === key) btn.classList.add('active');
      btn.dataset.field = key;
      btn.dataset.axis = axis;
      btn.innerHTML = '\\(' + meta.symbol + '\\)';
      btn.addEventListener('click', function() {
        container.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        setPlotlyAxis(axis, key);
      });
      container.appendChild(btn);
    });
  });
  if (window.MathJax && MathJax.typeset) MathJax.typeset();
}

function bindPlotlyControls() {
  document.querySelectorAll('#plotly-scale-btns button').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#plotly-scale-btns button').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      plotlyState.scaleX = btn.dataset.sx;
      plotlyState.scaleY = btn.dataset.sy;
      updatePlotlyPlot();
    });
  });

  document.querySelectorAll('#plotly-type-filters input').forEach(function(cb) {
    cb.addEventListener('change', function() {
      togglePlotlyType(cb.value, cb.checked);
    });
  });

  document.querySelectorAll('#plotly-confirmed-btns button').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#plotly-confirmed-btns button').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      setPlotlyConfirmed(btn.dataset.confirmed === 'yes');
    });
  });
}

function initCatalogPage() {
  registerCatalogDataTableSorts();
  registerDomDataOrderSort();
  initCatalog(function() {
    enumarateReferences(BlackHoleData);
    buildBlackHoleTable();
    initBlackHoleDataTable();
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(function(el) {
      new bootstrap.Tooltip(el);
      if (el.dataset.bsHtml === 'true') {
        el.addEventListener('shown.bs.tooltip', function() {
          var tooltipId = el.getAttribute('aria-describedby');
          var tooltipEl = tooltipId ? document.getElementById(tooltipId) : null;
          if (tooltipEl && window.MathJax && MathJax.typeset) {
            MathJax.typeset([tooltipEl]);
          }
        });
      }
    });

    buildPlotlyAxisControls();
    buildPlotlyPlot();
    bindPlotlyControls();
  });
}

initCatalogPage();
