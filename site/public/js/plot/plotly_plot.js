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
    if (!window.MathJax) return;
    var hoverLayer = el.querySelector('.hoverlayer');
    if (!hoverLayer) return;
    if (MathJax.typesetPromise) {
      MathJax.typesetPromise([hoverLayer]).catch(function() {});
    } else if (MathJax.typeset) {
      MathJax.typeset([hoverLayer]);
    }
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
          '<b>%{text}</b><br>' +
          '%{fullData.name}<br>' +
          buildHoverLabel(plotlyState.x) + ': %{customdata[0]}<br>' +
          buildHoverLabel(plotlyState.y) + ': %{customdata[1]}' +
          '<extra></extra>',
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

  var logTickAttrs = {
    dtick: 1,
    tickmode: 'auto',
    exponentformat: 'power',
  };

  var xIsLog = plotlyState.scaleX === 'log';
  var yIsLog = plotlyState.scaleY === 'log';

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
      type: plotlyState.scaleX,
    }, xIsLog ? logTickAttrs : {}),
    yaxis: Object.assign({}, axisBase, {
      title: { text: buildAxisLabel(plotlyState.y) },
      type: plotlyState.scaleY,
    }, yIsLog ? logTickAttrs : {}),
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
  };
}

var plotlyConfig = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['select2d', 'lasso2d'],
};

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
}

function setPlotlyAxis(axis, value) {
  plotlyState[axis] = value;
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
