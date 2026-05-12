function buildAxisLabel(fieldKey) {
  var meta = fieldMeta[fieldKey];
  if (!meta) return fieldKey;
  if (meta.unit) return '$' + meta.symbol + ' \\; (' + meta.unit + ')$';
  return '$' + meta.symbol + '$';
}

function buildHoverLabel(fieldKey) {
  var meta = fieldMeta[fieldKey];
  if (!meta) return fieldKey;
  return meta.hoverLabel || meta.symbol;
}

function formatFieldMath(field) {
  if (!field) return '-';
  var hasValue = typeof field.value === 'number' && Number.isFinite(field.value);
  var unc = field.uncertainty || {};
  var hasUnc = typeof unc.up === 'number' && Number.isFinite(unc.up) &&
               typeof unc.down === 'number' && Number.isFinite(unc.down);

  if (field.type === 'u' && hasUnc) {
    return 'U(' + unc.down + ', ' + unc.up + ')';
  }

  if (!hasValue) return '-';

  if ((field.type === 'a' || field.type === 'an') && hasUnc) {
    return String(field.value) + '<sup>+' + String(unc.up) + '</sup><sub>-' + String(unc.down) + '</sub>';
  }

  if (field.type === 'n' && hasUnc) {
    return String(field.value) + '(' + String(unc.up) + ')';
  }

  return String(field.value);
}

function bindPlotlyHoverMathJax(el) {
  if (!el || el.__mathJaxHoverBound) return;
  el.__mathJaxHoverBound = true;
  el.on('plotly_hover', function() {
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        expandPlotlyHoverBackground(el);
        if (!window.MathJax) return;
        var hoverLayer = el.querySelector('.hoverlayer');
        if (!hoverLayer) return;
        if (MathJax.typesetPromise) {
          MathJax.typesetPromise([hoverLayer]).catch(function() {});
        } else if (MathJax.typeset) {
          MathJax.typeset([hoverLayer]);
        }
      });
    });
  });
}

/** Horizontal inset in hover lines (em spaces — Plotly renders as text padding). */
var HOVER_TEMPLATE_INDENT = '\u2003\u2003\u2003';

/**
 * Plotly does not expose hoverlabel inner padding; scale the SVG background path
 * slightly so the frame sits farther from the text.
 */
function expandPlotlyHoverBackground(el, scale) {
  if (!el || !el.querySelectorAll) return;
  scale = scale == null ? 1.2 : scale;
  el.querySelectorAll('.hoverlayer g.hovertext').forEach(function(g) {
    var path = g.querySelector(':scope > path');
    if (!path) return;
    try {
      var bb = path.getBBox();
      if (!bb.width || !bb.height) return;
      var cx = bb.x + bb.width / 2;
      var cy = bb.y + bb.height / 2;
      path.setAttribute(
        'transform',
        'translate(' + cx + ',' + cy + ') scale(' + scale + ') translate(' + (-cx) + ',' + (-cy) + ')'
      );
    } catch (e) {
      /* ignore */
    }
  });
}

/** Compact axis ticks: keep Plotly’s 0.1, 0.2, … 10, 20, … except these bands. */
var TICK_COMPACT_SCI_MIN = 0.001;
var TICK_COMPACT_SCI_MAX = 1000;

function parseTickLabelText(text) {
  var t = String(text).trim().replace(/\u2212/g, '-').replace(/\s+/g, '');
  if (!t) return Number.NaN;
  return parseFloat(t.replace(/,/g, ''));
}

/**
 * Readable compact scientific: 1e3, 2.5e3, 1e-3 (no + in exponent, trim mantissa).
 */
function toCompactScientificTick(v) {
  if (v === 0) return '0';
  if (!Number.isFinite(v)) return '';
  var sign = v < 0 ? '-' : '';
  var x = Math.abs(v);
  var exp = Math.floor(Math.log10(x));
  var man = x / Math.pow(10, exp);
  var manStr = String(Math.round(man * 1e9) / 1e9);
  manStr = manStr.replace(/(\.\d*?[1-9])0+$/, '$1');
  manStr = manStr.replace(/\.0+$/, '');
  return sign + manStr + 'e' + String(exp);
}

function applyCompactSciTickLabels(el) {
  if (!el || !el.querySelectorAll) return;
  ['x', 'y'].forEach(function(axis) {
    el.querySelectorAll('.' + axis + 'tick text').forEach(function(node) {
      var v = parseTickLabelText(node.textContent);
      if (!Number.isFinite(v)) return;
      var av = Math.abs(v);
      if (av >= TICK_COMPACT_SCI_MAX || (av > 0 && av <= TICK_COMPACT_SCI_MIN)) {
        node.textContent = toCompactScientificTick(v);
      }
    });
  });
}

function bindPlotlyCompactSciTicks(el) {
  if (!el || el._catnoirCompactSciTicksBound) return;
  el._catnoirCompactSciTicksBound = true;
  el.on('plotly_afterplot', function() {
    applyCompactSciTickLabels(el);
  });
}

function scheduleCompactSciTickLabels(el) {
  requestAnimationFrame(function() {
    applyCompactSciTickLabels(el);
  });
}

function getFilteredData() {
  var data = BlackHoleData;

  if (plotlyState.confirmedOnly) {
    data = data.filter(function(d) { return d.Confirmed; });
  }

  return data.filter(function(d) {
    var type = d.Type || '';
    return plotlyState.types[type] === true;
  });
}

function buildPlotlyTraces(data) {
  function getFieldValueForPlot(field) {
    if (!field) return null;
    if (typeof field.value === 'number' && Number.isFinite(field.value)) return field.value;
    if (field.type !== 'u' || !field.uncertainty) return null;
    var lower = field.uncertainty.down;
    var upper = field.uncertainty.up;
    if (typeof lower !== 'number' || typeof upper !== 'number') return null;
    if (!Number.isFinite(lower) || !Number.isFinite(upper)) return null;
    return (lower + upper) / 2;
  }

  function getFieldUncertainty(field) {
    if (!field || !field.uncertainty) return null;
    var center = getFieldValueForPlot(field);
    if (typeof center !== 'number' || !Number.isFinite(center)) return null;
    var up = field.uncertainty.up;
    var down = field.uncertainty.down;
    if (typeof up !== 'number' || typeof down !== 'number') return null;
    if (!Number.isFinite(up) || !Number.isFinite(down)) return null;

    if (field.type === 'u') {
      var lower = down;
      var upper = up;
      var plus = upper - center;
      var minus = center - lower;
      if (!Number.isFinite(plus) || !Number.isFinite(minus)) return null;
      if (plus < 0 || minus < 0) return null;
      return { plus: plus, minus: minus, uniform: true, lower: lower, upper: upper };
    }

    return { plus: up, minus: down, uniform: false };
  }

  var groups = {};
  var uniformXSegments = {};
  var uniformYSegments = {};
  var regularXSegments = {};
  var regularYSegments = {};

  data.forEach(function(d) {
    var xField = d[plotlyState.x];
    var yField = d[plotlyState.y];
    if (!xField || !yField) return;

    var xVal = getFieldValueForPlot(xField);
    var yVal = getFieldValueForPlot(yField);
    if (xVal == null || yVal == null) return;
    if (typeof xVal !== 'number' || typeof yVal !== 'number') return;

    var xUnc = getFieldUncertainty(xField);
    var yUnc = getFieldUncertainty(yField);
    var xIsUniform = xField.type === 'u';
    var yIsUniform = yField.type === 'u';

    var type = d.Type || '';
    // Draw central marker unless both plotted coordinates are uniform.
    // If both are uniform, represent the system only by interval segments.
    if (!(xIsUniform && yIsUniform)) {
      if (!groups[type]) {
        groups[type] = {
          x: [],
          y: [],
          names: [],
        xMath: [],
        yMath: [],
          xPlus: [],
          xMinus: [],
          yPlus: [],
          yMinus: [],
          hasXErr: false,
          hasYErr: false,
        };
      }
      groups[type].x.push(xVal);
      groups[type].y.push(yVal);
      groups[type].names.push(d.name);
      groups[type].xMath.push(formatFieldMath(xField));
      groups[type].yMath.push(formatFieldMath(yField));
      groups[type].xPlus.push(xUnc ? xUnc.plus : 0);
      groups[type].xMinus.push(xUnc ? xUnc.minus : 0);
      groups[type].yPlus.push(yUnc ? yUnc.plus : 0);
      groups[type].yMinus.push(yUnc ? yUnc.minus : 0);
      groups[type].hasXErr = groups[type].hasXErr || !!xUnc;
      groups[type].hasYErr = groups[type].hasYErr || !!yUnc;
    }

    if (xUnc && xUnc.uniform) {
      if (!uniformXSegments[type]) uniformXSegments[type] = { x: [], y: [] };
      uniformXSegments[type].x.push(xUnc.lower, xUnc.upper, null);
      uniformXSegments[type].y.push(yVal, yVal, null);
    } else if (xUnc) {
      if (!regularXSegments[type]) regularXSegments[type] = { x: [], y: [] };
      regularXSegments[type].x.push(xVal - xUnc.minus, xVal + xUnc.plus, null);
      regularXSegments[type].y.push(yVal, yVal, null);
    }
    if (yUnc && yUnc.uniform) {
      if (!uniformYSegments[type]) uniformYSegments[type] = { x: [], y: [] };
      uniformYSegments[type].x.push(xVal, xVal, null);
      uniformYSegments[type].y.push(yUnc.lower, yUnc.upper, null);
    } else if (yUnc) {
      if (!regularYSegments[type]) regularYSegments[type] = { x: [], y: [] };
      regularYSegments[type].x.push(xVal, xVal, null);
      regularYSegments[type].y.push(yVal - yUnc.minus, yVal + yUnc.plus, null);
    }
  });

  var traces = [];
  var allTypes = new Set(
    Object.keys(groups)
      .concat(Object.keys(regularXSegments))
      .concat(Object.keys(regularYSegments))
      .concat(Object.keys(uniformXSegments))
      .concat(Object.keys(uniformYSegments))
  );

  Array.from(allTypes).forEach(function(type) {
    var g = groups[type];
    var color = getTypeColors()[type] || '#c084fc';
    if (g && g.x.length) {
      traces.push({
        x: g.x,
        y: g.y,
        text: g.names,
        customdata: g.xMath.map(function(v, i) { return [v, g.yMath[i]]; }),
        mode: 'markers',
        type: 'scatter',
        name: typeLabels[type] || type || 'Other',
        error_x: {
          type: 'data',
          symmetric: false,
          array: g.xPlus,
          arrayminus: g.xMinus,
          visible: g.hasXErr,
          color: 'rgba(90,90,90,0.85)',
          thickness: 1.2,
          width: 2,
        },
        error_y: {
          type: 'data',
          symmetric: false,
          array: g.yPlus,
          arrayminus: g.yMinus,
          visible: g.hasYErr,
          color: 'rgba(90,90,90,0.85)',
          thickness: 1.2,
          width: 2,
        },
        marker: {
          color: color,
          size: 9,
          opacity: 0.92,
          line: { width: 1, color: 'rgba(0,0,0,0.35)' },
        },
        hovertemplate:
          '<br><br>' +
          HOVER_TEMPLATE_INDENT + '<b>%{text}</b><br>' +
          HOVER_TEMPLATE_INDENT + '%{fullData.name}<br><br>' +
          HOVER_TEMPLATE_INDENT + buildHoverLabel(plotlyState.x) + ': %{customdata[0]}<br>' +
          HOVER_TEMPLATE_INDENT + buildHoverLabel(plotlyState.y) + ': %{customdata[1]}' +
          '<br><br><extra></extra>',
      });
    }

    if (regularXSegments[type] && regularXSegments[type].x.length) {
      traces.push({
        x: regularXSegments[type].x,
        y: regularXSegments[type].y,
        mode: 'lines',
        type: 'scatter',
        showlegend: false,
        hoverinfo: 'skip',
        line: {
          color: 'rgba(90,90,90,0.85)',
          width: 1.2,
          dash: 'solid',
        },
        opacity: 0.9,
      });
    }

    if (regularYSegments[type] && regularYSegments[type].x.length) {
      traces.push({
        x: regularYSegments[type].x,
        y: regularYSegments[type].y,
        mode: 'lines',
        type: 'scatter',
        showlegend: false,
        hoverinfo: 'skip',
        line: {
          color: 'rgba(90,90,90,0.85)',
          width: 1.2,
          dash: 'solid',
        },
        opacity: 0.9,
      });
    }

    if (uniformXSegments[type] && uniformXSegments[type].x.length) {
      traces.push({
        x: uniformXSegments[type].x,
        y: uniformXSegments[type].y,
        mode: 'lines',
        type: 'scatter',
        showlegend: false,
        hoverinfo: 'skip',
        line: {
          color: color,
          width: 1.2,
          dash: 'solid',
        },
        opacity: 0.9,
      });
    }

    if (uniformYSegments[type] && uniformYSegments[type].x.length) {
      traces.push({
        x: uniformYSegments[type].x,
        y: uniformYSegments[type].y,
        mode: 'lines',
        type: 'scatter',
        showlegend: false,
        hoverinfo: 'skip',
        line: {
          color: color,
          width: 1.2,
          dash: 'solid',
        },
        opacity: 0.9,
      });
    }
  });

  return traces;
}

function getPlotlyEmptyAnnotation() {
  var isDark = localStorage.getItem('theme') !== 'theme-light';
  var fontColor = isDark ? '#e8e2d9' : '#1a1814';
  return {
    text: 'No systems match the current filters.',
    xref: 'paper',
    yref: 'paper',
    x: 0.5,
    y: 0.5,
    showarrow: false,
    font: { size: 15, color: fontColor, family: 'Source Sans 3, sans-serif' },
  };
}

var plotlyEmptyTrace = {
  type: 'scatter',
  x: [null],
  y: [null],
  mode: 'markers',
  marker: { opacity: 0, size: 1 },
  showlegend: false,
  hoverinfo: 'skip',
};

function getPlotlyLayout() {
  var isDark = localStorage.getItem('theme') !== 'theme-light';

  var bgColor = isDark ? '#0d1117' : '#f8f6f1';
  var paperColor = isDark ? '#0d1117' : '#f8f6f1';
  var fontColor = isDark ? '#e8e2d9' : '#1a1814';
  var gridColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';

  // Tooltip: strong contrast vs plot background; gold frame on dark, warm frame on light.
  var hoverlabelStyle = isDark
    ? {
        bgcolor: '#fffdf8',
        bordercolor: '#e6a817',
        font: {
          color: '#141210',
          family: 'Source Sans 3, system-ui, sans-serif',
          size: 15,
        },
        align: 'left',
        namelength: -1,
      }
    : {
        bgcolor: '#141210',
        bordercolor: '#c4922d',
        font: {
          color: '#f8f4ec',
          family: 'Source Sans 3, system-ui, sans-serif',
          size: 15,
        },
        align: 'left',
        namelength: -1,
      };

  // Log axes: D2 = 1–2–5–10 grid; exponentformat not 'power' (avoids 10^n row).
  // 'complete' on minor ticks prints every value (0.002, 0.003, …) → unreadable on
  // shallow ranges (e.g. eccentricity). Use 'small digits' on x: only 2 and 5 between decades.
  var logTickAttrsCommon = {
    dtick: 'D2',
    tickmode: 'auto',
    exponentformat: 'none',
    tickformat: '.9~g',
  };
  var logTickAttrsX = Object.assign({}, logTickAttrsCommon, {
    minorloglabels: 'small digits',
  });
  var logTickAttrsY = Object.assign({}, logTickAttrsCommon, {
    minorloglabels: 'complete',
  });

  // Eccentricity is in [0, 1). Log scale packs that interval into dense minor ticks
  // (0.002, 0.003, …) — use a linear x-axis for e regardless of the “log–log” preset.
  var xIsEccentricity = plotlyState.x === 'e';
  var xAxisType = xIsEccentricity ? 'linear' : plotlyState.scaleX;
  var xIsLog = xAxisType === 'log';
  var yIsLog = plotlyState.scaleY === 'log';

  var linearEccentricityXAttrs = {
    tickformat: '.2f',
    dtick: 0.1,
    rangemode: 'tozero',
  };

  var axisBase = {
    showline: true,
    linecolor: fontColor,
    linewidth: 1.5,
    ticks: 'outside',
    ticklen: 5,
    tickwidth: 1,
    tickcolor: fontColor,
    gridcolor: gridColor,
    zerolinecolor: gridColor,
    color: fontColor,
  };

  return {
    xaxis: Object.assign({}, axisBase, {
      title: { text: buildAxisLabel(plotlyState.x) },
      type: xAxisType,
    },
      xIsLog ? logTickAttrsX : {},
      xIsEccentricity ? linearEccentricityXAttrs : {}),
    yaxis: Object.assign({}, axisBase, {
      title: { text: buildAxisLabel(plotlyState.y) },
      type: plotlyState.scaleY,
    }, yIsLog ? logTickAttrsY : {}),
    plot_bgcolor: bgColor,
    paper_bgcolor: paperColor,
    font: { color: fontColor, family: 'inherit' },
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'center',
      x: 0.5,
      font: { color: fontColor },
    },
    margin: { t: 36, r: 12, b: 52, l: 58 },
    autosize: true,
    hovermode: 'closest',
    hoverdistance: 28,
    hoverlabel: hoverlabelStyle,
  };
}

var plotlyConfig = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['select2d', 'lasso2d'],
};

function syncPlotlyScaleButtonUI() {
  var group = document.getElementById('plotly-scale-btns');
  if (!group) return;
  var sx = plotlyState.scaleX;
  var sy = plotlyState.scaleY;
  group.querySelectorAll('button').forEach(function(btn) {
    var match = btn.dataset.sx === sx && btn.dataset.sy === sy;
    btn.classList.toggle('active', match);
  });
}

function buildPlotlyPlot() {
  var el = document.getElementById('plotly-chart');
  if (!el) return;

  var data = getFilteredData();
  var traces = buildPlotlyTraces(data);
  var layout = getPlotlyLayout();

  if (traces.length === 0) {
    layout.annotations = [getPlotlyEmptyAnnotation()];
    traces = [plotlyEmptyTrace];
  } else {
    layout.annotations = [];
  }

  Plotly.newPlot(el, traces, layout, plotlyConfig);
  bindPlotlyHoverMathJax(el);
  bindPlotlyCompactSciTicks(el);
  scheduleCompactSciTickLabels(el);
  syncPlotlyScaleButtonUI();
}

function updatePlotlyPlot() {
  var el = document.getElementById('plotly-chart');
  if (!el) return;

  var data = getFilteredData();
  var traces = buildPlotlyTraces(data);
  var layout = getPlotlyLayout();

  if (traces.length === 0) {
    layout.annotations = [getPlotlyEmptyAnnotation()];
    traces = [plotlyEmptyTrace];
  } else {
    layout.annotations = [];
  }

  Plotly.react(el, traces, layout, plotlyConfig);
  bindPlotlyHoverMathJax(el);
  bindPlotlyCompactSciTicks(el);
  scheduleCompactSciTickLabels(el);
  syncPlotlyScaleButtonUI();
}

function setPlotlyAxis(axis, value) {
  plotlyState[axis] = value;
  if (axis === 'x' && value === 'e' && plotlyState.scaleX === 'log') {
    plotlyState.scaleX = 'linear';
  }
  updatePlotlyPlot();
}

function setPlotlyScale(scaleKey, value) {
  plotlyState[scaleKey] = value;
  updatePlotlyPlot();
}

function togglePlotlyType(type, checked) {
  plotlyState.types[type] = checked;
  updatePlotlyPlot();
}

function setPlotlyConfirmed(confirmedOnly) {
  plotlyState.confirmedOnly = confirmedOnly;
  updatePlotlyPlot();
}
