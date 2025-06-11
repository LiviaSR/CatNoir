/*
       Lin-Lin scale
*/


const defaultAxis = (x, y, width, height, margin, svg, XAxisLabel, YAxisLabel) => {
  const x_axis = d3.scaleLinear()
    //.domain([0, 0])
    .range([40, width]);

  const y_axis = d3.scaleLinear()
    //.domain([0, 0])
    .range([height, 0]);

  // Add X axis
  svg.append('g')
    .attr("transform", "translate(0," + height  + ")")
    .attr('class', 'axis-white x-axis-transition x-axis')
    .call(d3.axisBottom(x_axis)
    .ticks( (width - 40) / 60))
    .attr('opacity', '0');
  // Add Y axis
  svg.append('g')
    .attr("transform", "translate(40, 0)")
    .attr('class', 'axis-white y-axis-transition y-axis')
    .call(d3.axisLeft(y_axis)
    .ticks( innerHeight/ 60))
    .attr('opacity', '0');
  

  // Add X axis label
  var latex_raw = `\\dpi{120}  \{ \\large{ \\color{White} \\mathbf{\\boldsymbol{${XAxisLabel}}} }`;
  if (localStorage.getItem('theme') === 'theme-light') {
    latex_raw = `\\dpi{120}  \{ \\large{\\mathbf{\\boldsymbol{${XAxisLabel}}} }`;
  }
  var latex_render_url = "http://latex.codecogs.com/png.image?";
  var latex_query = encodeURI(latex_raw);
  var latex = svg.append("foreignObject")
      .attr("width", 200)
      .attr("height", 100)
      .attr("x", width / 2)
      .attr("y", height + margin.top + 25)
      .attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
      .append("xhtml:body")
      .attr("x1", width / 2)
      .attr("x2", width / 2 + 100)
      .attr("y1", height + margin.top + 37)
      .attr("text-anchor", "middle")
      .append("img")
      .attr("src", latex_render_url  + latex_query);


  // Y axis label
  var latex_raw = `\\dpi{120}  \{ \\large{ \\color{White} \\mathbf{\\boldsymbol{${YAxisLabel}}} }`;
  if (localStorage.getItem('theme') === 'theme-light') {
    latex_raw = `\\dpi{120}  \{ \\large{\\mathbf{\\boldsymbol{${YAxisLabel}}} }`;
  }
  var latex_render_url = "http://latex.codecogs.com/png.image?";
  var latex_query = encodeURI(latex_raw);
  var latex = svg.append("foreignObject")
    .attr("transform", "rotate(-90)")
      .attr("width", 150)
      .attr("height", 25)
      .attr("y", -margin.left + 15)
      .attr("x", -(height / 2) )
      .attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
      .append("xhtml:body")
      .attr("text-anchor", "middle")
      .attr("y", -margin.left + 25)
      .attr("x", -margin.top -(height / 2))
      .append("img")
      .attr("src", latex_render_url + latex_query);

  // X axis animation
  x_axis.domain([
    d3.min(x.map(o => o.value)),
    d3.max(x.map(o => o.value)),
  ]);

  svg.select(".x-axis-transition")
    .transition()
    .duration(transitions['x-axis-display-delay'])
    .attr('opacity', '1')
    .call(d3.axisBottom(x_axis)
    .ticks((width - 40) /60));

  // Y axis animation
  y_axis.domain([
    d3.min(y.map(o => o.value)),
    d3.max(y.map(o => o.value)),
  ])

  svg.select(".y-axis-transition")
  .transition()
  .duration(transitions['y-axis-display-delay'])
  .attr('opacity', '1')
  .call(d3.axisLeft(y_axis)
  .ticks(innerHeight/60));

  return [x_axis, y_axis];

}

/*
       Log-Log scale
*/

const logarithmicXYAxis = (x, y, width, height, margin, svg, XAxisLabel, YAxisLabel) => {
  const x_axis = d3.scaleLog()
  //.domain([0,  0])
  .range([40, width])
  .base(10);

  const y_axis = d3.scaleLog()
 // .domain([0, 0])
  .range([height, 0])
  .base(10);


  // Change tick format based on data range
  let xf = x.map(e => e.value);
  let yf = y.map(e => e.value);

  let x_max = Math.max(...xf);
  let x_min = Math.min(...xf);
  let y_max = Math.max(...yf);
  let y_min = Math.min(...yf);

  // Add X axis
  if ( 1e-4 < x_min && x_max > 5e2) {
    svg.append('g')
      .attr("transform", "translate(0," + height + ")")
      .attr('class', 'axis-white x-axis-transition x-axis')
      .call(d3.axisBottom(x_axis)
      .ticks((width - 40) / 120, formatPower))
      .attr('opacity', '0');
  } else {
    svg.append('g')
      .attr("transform", "translate(0," + height + ")")
      .attr('class', 'axis-white x-axis-transition x-axis')
      .call(d3.axisBottom(x_axis)
      .ticks((width - 40) / 120, ".2f"))
      .attr('opacity', '0');
  }
  // Add Y axis
  if ( 1e-4 < y_min && y_max > 5e2) {
    svg.append('g')
      .attr("transform", "translate(40, 0)")
      .attr('class', 'axis-white y-axis-transition y-axis')
      .call(d3.axisLeft(y_axis)
      .ticks( innerHeight / 120, formatPower))
      .attr('opacity', '0');
  } else {
    svg.append('g')
      .attr("transform", "translate(40, 0)")
      .attr('class', 'axis-white y-axis-transition y-axis')
      .call(d3.axisLeft(y_axis)
      .ticks( innerHeight / 120, ".2f"))
      .attr('opacity', '0');
  }

  // Add X axis label
  var latex_raw = `\\dpi{120}  \{ \\large{ \\color{White} \\mathbf{\\boldsymbol{${XAxisLabel}}} }`;
  if (localStorage.getItem('theme') === 'theme-light') {
    latex_raw = `\\dpi{120}  \{ \\large{\\mathbf{\\boldsymbol{${XAxisLabel}}} }`;
  }
  var latex_render_url = "http://latex.codecogs.com/png.image?";
  var latex_query = encodeURI(latex_raw);
  var latex = svg.append("foreignObject")
      .attr("width", 200)
      .attr("height", 100)
      .attr("x", width / 2)
      .attr("y", height + margin.top + 25)
      .attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
      .append("xhtml:body")
      .attr("x1", width / 2)
      .attr("x2", width / 2 + 100)
      .attr("y1", height + margin.top + 37)
      .attr("text-anchor", "middle")
      .append("img")
      .attr("src", latex_render_url + latex_query);


  // Y axis label
  var latex_raw = `\\dpi{120}  \{ \\large{ \\color{White} \\mathbf{\\boldsymbol{${YAxisLabel}}} }`;
  if (localStorage.getItem('theme') === 'theme-light') {
    latex_raw = `\\dpi{120}  \{ \\large{\\mathbf{\\boldsymbol{${YAxisLabel}}} }`;
  }
  var latex_render_url = "http://latex.codecogs.com/png.image?";
  var latex_query = encodeURI(latex_raw);
  var latex = svg.append("foreignObject")
    .attr("transform", "rotate(-90)")
      .attr("width", 150)
      .attr("height", 25)
      .attr("y", -margin.left + 15)
      .attr("x", -(height / 2))
      .attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
      .append("xhtml:body")
      .attr("text-anchor", "middle")
      .attr("y", -margin.left + 25)
      .attr("x", -margin.top -(height / 2))
      .append("img")
      .attr("src", latex_render_url + latex_query);

  // X axis animation
  x_axis.domain([
    d3.min(x.map(o => o.value)),
    d3.max(x.map(o => o.value)),
  ]).base(10);

  if ( 1e-4 < x_min && x_max > 5e2) {
    svg.select(".x-axis-transition")
      .transition()
      .duration(transitions['x-axis-display-delay'])
      .attr('opacity', '1')
      .call(d3.axisBottom(x_axis)  
      .ticks( (width - 40) / 120, formatPower));
  } else {
    svg.select(".x-axis-transition")
      .transition()
      .duration(transitions['x-axis-display-delay'])
      .attr('opacity', '1')
      .call(d3.axisBottom(x_axis)  
      .ticks( (width - 40) / 120, ".2f")); 
  }

  // Y axis animation
  y_axis.domain([
    d3.min(y.map(o => o.value)),
    d3.max(y.map(o => o.value)),
  ]).base(10);

  svg.select(".y-axis-transition")
  .transition()
  .duration(transitions['y-axis-display-delay'])
  .attr('opacity', '1')
  .call(d3.axisLeft(y_axis)
  .ticks( innerHeight / 120, formatPower));

  return [x_axis, y_axis];
}

/*
       Log-Lin scale
*/

const logarithmicXAxis = (x, y, width, height, margin, svg, XAxisLabel, YAxisLabel) => {
  const x_axis = d3.scaleLog()
  //.domain([0, 0])
  .range([40, width])
  .base(10);

  const y_axis = d3.scaleLinear()
  //.domain([0, 0])
  .range([height, 0]);

  // Add X axis
  svg.append('g')
    .attr("transform", "translate(0," + height + ")")
    .attr('class', 'axis-white x-axis-transition x-axis')
    .call(d3.axisBottom(x_axis)
    .ticks( (width - 40) / 120, formatPower))
    .attr('opacity', '0');
  // Add Y axis
  svg.append('g')
    .attr("transform", "translate(40, 0)")
    .attr('class', 'axis-white y-axis-transition y-axis')
    .call(d3.axisLeft(y_axis)
    .ticks(innerHeight / 120))
    .attr('opacity', '0');

  // Add X axis label
  var latex_raw = `\\dpi{120}  \{ \\large{ \\color{White} \\mathbf{\\boldsymbol{${XAxisLabel}}} }`;
  if (localStorage.getItem('theme') === 'theme-light') {
    latex_raw = `\\dpi{120}  \{ \\large{\\mathbf{\\boldsymbol{${XAxisLabel}}} }`;
  }
  var latex_render_url = "http://latex.codecogs.com/png.image?";
  var latex_query = encodeURI(latex_raw);
  var latex = svg.append("foreignObject")
      .attr("width", 200)
      .attr("height", 100)
      .attr("x", width / 2)
      .attr("y", height + margin.top + 25)
      .attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
      .append("xhtml:body")
      .attr("x1", width / 2)
      .attr("x2", width / 2 + 100)
      .attr("y1", height + margin.top + 37)
      .attr("text-anchor", "middle")
      .append("img")
      .attr("src", latex_render_url + latex_query);


  // Y axis label
  var latex_raw = `\\dpi{120}  \{ \\large{ \\color{White} \\mathbf{\\boldsymbol{${YAxisLabel}}} }`;
  if (localStorage.getItem('theme') === 'theme-light') {
    latex_raw = `\\dpi{120}  \{ \\large{\\mathbf{\\boldsymbol{${YAxisLabel}}} }`;
  }
  var latex_render_url = "http://latex.codecogs.com/png.image?";
  var latex_query = encodeURI(latex_raw);
  var latex = svg.append("foreignObject")
    .attr("transform", "rotate(-90)")
      .attr("width", 150)
      .attr("height", 25)
      .attr("y", -margin.left + 15)
      .attr("x", -(height / 2))
      .attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
      .append("xhtml:body")
      .attr("text-anchor", "middle")
      .attr("y", -margin.left + 25)
      .attr("x", -margin.top -(height / 2))
      .append("img")
      .attr("src", latex_render_url + latex_query);

  // X axis animation
  x_axis.domain([
    d3.min(x.map(o => o.value)),
    d3.max(x.map(o => o.value)),
  ]);

  svg.select(".x-axis-transition")
    .transition()
    .duration(transitions['x-axis-display-delay'])
    .attr('opacity', '1')
    .call(d3.axisBottom(x_axis)
    .ticks( (width - 40) / 120, formatPower));

  // Y axis animation
  y_axis.domain([
    d3.min(y.map(o => o.value)),
    d3.max(y.map(o => o.value)),
  ]);

  svg.select(".y-axis-transition")
  .transition()
  .duration(transitions['y-axis-display-delay'])
  .attr('opacity', '1')
  .call(d3.axisLeft(y_axis)
  .ticks(innerHeight / 120));

  return [x_axis, y_axis];
}

/*
       Lin-Log scale
*/

const logarithmicYAxis = (x, y, width, height, margin, svg, XAxisLabel, YAxisLabel) => {
  const x_axis = d3.scaleLinear()
  //.domain([0, 0])
  .range([40, width]);

  const y_axis = d3.scaleLog()
  .domain([0, 0])
  .range([height, 0])
  .base(10);

  // Add X axis
  svg.append('g')
    .attr("transform", "translate(0," + height + ")")
    .attr('class', 'axis-white x-axis-transition x-axis')
    .call(d3.axisBottom(x_axis)
    .ticks( (width - 40 ) / 120))
    .attr('opacity', '0');
  // Add Y axis
  svg.append('g')
    .attr("transform", "translate(40, 0)")
    .attr('class', 'axis-white y-axis-transition y-axis')
    .call(d3.axisLeft(y_axis)
    .ticks( innerHeight / 120)
    .tickFormat(formatPower))
    .attr('opacity', '0');

  // Add X axis label
  var latex_raw = `\\dpi{120}  \{ \\large{ \\color{White} \\mathbf{\\boldsymbol{${XAxisLabel}}} }`;
  if (localStorage.getItem('theme') === 'theme-light') {
    latex_raw = `\\dpi{120}  \{ \\large{\\mathbf{\\boldsymbol{${XAxisLabel}}} }`;
  }
  var latex_render_url = "http://latex.codecogs.com/png.image?";
  var latex_query = encodeURI(latex_raw);
  var latex = svg.append("foreignObject")
      .attr("width", 200)
      .attr("height", 100)
      .attr("x", width / 2)
      .attr("y", height + margin.top + 25)
      .attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
      .append("xhtml:body")
      .attr("x1", width / 2)
      .attr("x2", width / 2 + 100)
      .attr("y1", height + margin.top + 37)
      .attr("text-anchor", "middle")
      .append("img")
      .attr("src", latex_render_url + latex_query);


  // Y axis label
  var latex_raw = `\\dpi{120}  \{ \\large{ \\color{White} \\mathbf{\\boldsymbol{${YAxisLabel}}} }`;
  if (localStorage.getItem('theme') === 'theme-light') {
    latex_raw = `\\dpi{120}  \{ \\large{\\mathbf{\\boldsymbol{${YAxisLabel}}} }`;
  }
  var latex_render_url = "http://latex.codecogs.com/png.image?";
  var latex_query = encodeURI(latex_raw);
  var latex = svg.append("foreignObject")
    .attr("transform", "rotate(-90)")
      .attr("width", 150)
      .attr("height", 25)
      .attr("y", -margin.left + 15)
      .attr("x", -(height / 2))
      .attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
      .append("xhtml:body")
      .attr("text-anchor", "middle")
      .attr("y", -margin.left + 25)
      .attr("x", -margin.top -(height / 2))
      .append("img")
      .attr("src", latex_render_url + latex_query);

  // X axis animation
  x_axis.domain([
    d3.min(x.map(o => o.value)),
    d3.max(x.map(o => o.value)),
  ]);

  svg.select(".x-axis-transition")
    .transition()
    .duration(transitions['x-axis-display-delay'])
    .attr('opacity', '1')
    .call(d3.axisBottom(x_axis)
    .ticks( (width - 40) /60));

  // Y axis animation
  y_axis.domain([
    d3.min(y.map(o => o.value)),
    d3.max(y.map(o => o.value)),
  ]);

  svg.select(".y-axis-transition")
  .transition()
  .duration(transitions['y-axis-display-delay'])
  .attr('opacity', '1')
  .call(d3.axisLeft(y_axis)
  .ticks( innerHeight / 120)
  .tickFormat(formatPower));
  return [x_axis, y_axis];
}