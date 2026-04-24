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
  var groups = {};

  data.forEach(function(d) {
    var xField = d[plotlyState.x];
    var yField = d[plotlyState.y];
    if (!xField || !yField) return;

    var xVal = xField.value;
    var yVal = yField.value;
    if (xVal == null || yVal == null) return;
    if (typeof xVal !== 'number' || typeof yVal !== 'number') return;

    var type = d.Type || '';
    if (!groups[type]) {
      groups[type] = { x: [], y: [], names: [] };
    }
    groups[type].x.push(xVal);
    groups[type].y.push(yVal);
    groups[type].names.push(d.name);
  });

  var traces = [];
  Object.keys(groups).forEach(function(type) {
    var g = groups[type];
    traces.push({
      x: g.x,
      y: g.y,
      text: g.names,
      mode: 'markers',
      type: 'scatter',
      name: typeLabels[type] || type || 'Other',
      marker: {
        color: getTypeColors()[type] || '#c084fc',
        size: 9,
        opacity: 0.92,
        line: { width: 1, color: 'rgba(0,0,0,0.35)' },
      },
      hovertemplate:
        '<b>%{text}</b><br>' +
        '%{fullData.name}<br>' +
        buildHoverLabel(plotlyState.x) + ': %{x}<br>' +
        buildHoverLabel(plotlyState.y) + ': %{y}' +
        '<extra></extra>',
    });
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
