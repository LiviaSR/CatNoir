function plot() {
  // Get custom config
  const pair = `${pcs['x']}-${pcs['y']}`;

  // Get custom functions if any
  const config = pair in plotConfig ? plotConfig[pair] : plotConfig['default'];

  // Get plot data from pulsar_data
  [x, y] = getPlotData();

  // Custom data filter functions
  if ( config.hasOwnProperty('transformations') ) {
    if ( Array.isArray(config.transformations) ) {
      for ( let transformation of config.transformations ) {
        if ( Array.isArray(transformation) ) {
          [x, y] = transformation[0](x, y, transformation[1]); // If array then apply args
        } else {
          [x, y] = transformation(x, y);
        }
      }
    } else {
      [x, y] = config.transformations(x, y);
    }
  }


  // Build list of lists [[x, y] ..]
  const plotData = [];
  for ( let i = 0; i < x.length; i++ ) {
    plotData.push([x[i], y[i]]);
  }

  // Build plot SVG
  const plotContainer = document.getElementById('plot');

  const margin = { top: 15, right: 30, bottom: 60, left: 60 },
  width = plotContainer.offsetWidth - margin.left - margin.right,
  height = plotContainer.offsetHeight - margin.top - margin.bottom;

  // Append the svg object to the body of the page
  const svg = d3.select("#plot")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

  // Get axis labels
  if ( config.hasOwnProperty('units') ) {
    XAxisLabel = config['units'][pcs['x']]['symbol'] + ' ' + config['units'][pcs['x']]['unit'];
    YAxisLabel = config['units'][pcs['y']]['symbol'] + ' ' + config['units'][pcs['y']]['unit'];
  } else {
    XAxisLabel = plotConfig['default']['units'][pcs['x']]['symbol'] + '  ' + plotConfig['default']['units'][pcs['x']]['unit'];
    YAxisLabel = plotConfig['default']['units'][pcs['y']]['symbol'] + ' ' + plotConfig['default']['units'][pcs['y']]['unit'];  
  }

  // Add axis
  if ( config.hasOwnProperty('axis') ) {
    [x_axis, y_axis] = config.axis(x, y, width, height, margin, svg, XAxisLabel, YAxisLabel);
  } else {
    [x_axis, y_axis] = plotConfig['default'].axis(x, y, width, height, margin, svg, XAxisLabel, YAxisLabel);
  }

  // Add tooltips to data points
  const Tooltip = d3.select('#plot')
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("padding", "5px")

  const mouseover = function(event, d) {
    if ( d[0].type === 'rec' ) { borderColor = `-5px 0 0 0px ${colors['rec']}`; }
    else if ( d[0].type === 'nrec' ) { borderColor = `-5px 0 0 0px ${colors['nrec']}`; }
    else if ( d[0].type === 'GC' ) { borderColor = `-5px 0 0 0px ${colors['GC']}`; }
  
    Tooltip
      .style("opacity", 1)
      .style('box-shadow', borderColor)
    d3.select(this)
      .style("stroke", "white")
      .style("opacity", 1)
  }
 
  const mousemove = function(event, d) {
    Tooltip
      .html(`PSR ${d[0].name}<br>
      Confirmed: ${d[0].Confirmed}<br>
      <div style="display: flex !important;"><MathML style="margin-top: -0.7em !important;">${symbols[pcs['x']]}</MathML> : ${d[0].value}</div><br>
      <div style="display: flex !important;"><MathML style="margin-top: -0.7em !important;">${symbols[pcs['y']]}</MathML> : ${d[1].value}`)
      .style("left", (70) + "px")
      .style("top", (70) + "px")
      .style("left", (d3.pointer(event, this)[0]+90) + "px")
      .style("top", (d3.pointer(event, this)[1]) + "px")
      MathJax.typeset()
  }

  const mouseleave = function(event, d) {
    Tooltip
      .style("opacity", 0)
    d3.select(this)
      .style("stroke", "none")
      .style("opacity", 0.8)
  }

  // Adjust x and y axis ticks if necessary for confirmed
  if ( config.hasOwnProperty('ticks-confirmed') && pcs.confirmed ) {
    if ( config['ticks-confirmed'][0].length < 3 ) {
      config['ticks-confirmed'][0][0](svg, x_axis, config['ticks-confirmed'][0][1]);
    } else {
      config['ticks-confirmed'][0][0](svg, x_axis, config['ticks-confirmed'][0][1], config['ticks-confirmed'][0][2]);      
    }
    if ( config['ticks-confirmed'][1].length < 3 ) {
      config['ticks-confirmed'][1][0](svg, y_axis, config['ticks-confirmed'][1][1]);
    } else {
      config['ticks-confirmed'][1][0](svg, y_axis, config['ticks-confirmed'][1][1], config['ticks-confirmed'][1][2]);      
    }
  }
  // Adjust x and y axis ticks if necessary for confirmed
  if ( config.hasOwnProperty('ticks-candidate') && ! pcs.confirmed ) {
    if ( config['ticks-candidate'][0].length < 3 ) {
      config['ticks-candidate'][0][0](svg, x_axis, config['ticks-candidate'][0][1]);
    } else {
      config['ticks-candidate'][0][0](svg, x_axis, config['ticks-candidate'][0][1], config['ticks-candidate'][0][2]);      
    }
    if ( config['ticks-candidate'][1].length < 3 ) {
      config['ticks-candidate'][1][0](svg, y_axis, config['ticks-candidate'][1][1]);
    } else {
      config['ticks-candidate'][1][0](svg, y_axis, config['ticks-candidate'][1][1], config['ticks-candidate'][1][2]);      
    }
  }

  // Add dots
  svg.append('g')
    .selectAll("dot")
    .data(plotData)
    .enter()
    .append("circle")
      .attr("cx", function (d) { return x_axis(d[0].value); } )
      .attr("cy", function (d) { return y_axis(d[1].value); } )
      .attr("r", 5)
      .style('opacity', 0)
      .style("fill", (d) => {
        if ( config.hasOwnProperty('color') ) {
          return config.color(d[0].type);
        }
        return plotConfig['default'].color(d[0].type);
      })
      
  svg.selectAll('circle')
    .transition()
    .duration(transitions['data-display-delay'])
    .style('opacity', 1);

  svg.selectAll('circle')
    .on('mouseover', mouseover)
    .on('mousemove', mousemove)
    .on('mouseleave', mouseleave);
}


// Function to filter data by confirmed / isLimit / isAssumed
function getPlotData() {
  let pulsars = pulsarData
  if ( pcs.confirmed ) {
    pulsars = pulsarData.filter(pulsar => pulsar.Confirmed);
  }
  x = pulsars.map(pulsar => {
    let isLimit = false ;
    let isAssumed = false;
    
    if ( pulsar[pcs['x']].hasOwnProperty('isLimit') ) {
      isLimit = pulsar[pcs['x']].isLimit;
    }
    
    if ( pulsar[pcs['x']].hasOwnProperty('isAssumed') ) {
      isAssumed = pulsar[pcs['x']].isAssumed;
    }
    
    return({
      'value': pulsar[pcs['x']].value,
      'type': pulsar.Type,
      'name': pulsar.name,
      'isLimit': isLimit,
      'isAssumed': isAssumed,
      'Confirmed': pulsar.Confirmed,
    })
  });
  y = pulsars.map(pulsar => { 
    let isLimit = false ;
    let isAssumed = false;
    
    if ( pulsar[pcs['y']].hasOwnProperty('isLimit') ) {
      isLimit = pulsar[pcs['y']].isLimit;
    }
    
    if ( pulsar[pcs['y']].hasOwnProperty('isAssumed') ) {
      isAssumed = pulsar[pcs['y']].isAssumed;
    }
    
    return({
      'value': pulsar[pcs['y']].value,
      'type': pulsar.Type,
      'name': pulsar.name,
      'isLimit': isLimit,
      'isAssumed': isAssumed,
      'Confirmed': pulsar.Confirmed,
    })
  });
  // Filter non numerical values
  return filterNonNumericValues(x, y);
}

function buildPlot() {
  // Delete previous plot
  removeAllChildNodes(document.getElementById('plot'));
  plot();
}
