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
  initCatalog(function() {
    enumarateReferences(BlackHoleData);
    buildBlackHoleTable();
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
