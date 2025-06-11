/*const adjustXtick = (svg, x_axis, tick, format) => {
  if ( tick ) {
    svg.select(".x-axis")
      .call(d3.axisBottom(x_axis).ticks(tick));
  }
  if ( format ) {
    if ( typeof format === 'function' ) {
      svg.select(".x-axis")
        .call(d3.axisBottom(x_axis).tickFormat(format));
    } else {
      svg.select(".x-axis")
      .call(d3.axisBottom(x_axis).tickFormat(d3.format(format)));
    }
  }
}

const adjustYtick = (svg, y_axis, tick, format) => {
  if ( tick ) {
    svg.select(".y-axis")
      .call(d3.axisLeft(y_axis).ticks(tick));
  }
  if ( format ) {
    if ( typeof format === 'function' ) {
      svg.select(".y-axis")
        .call(d3.axisLeft(y_axis).tickFormat(format));
    } else {
      svg.select(".y-axis")
        .call(d3.axisLeft(y_axis).tickFormat(d3.format(format)));
    }
  }
}
*/

const adjustXtick = (svg, x_axis, format) => {
  if ( format ) {
    if ( typeof format === 'function' ) {
      svg.select(".x-axis")
        .call(d3.axisBottom(x_axis).tickFormat(format));
    } else {
      svg.select(".x-axis")
      .call(d3.axisBottom(x_axis).tickFormat(d3.format(format)));
    }
  }
}

const adjustYtick = (svg, y_axis, format) => {
  if ( format ) {
    if ( typeof format === 'function' ) {
      svg.select(".y-axis")
        .call(d3.axisLeft(y_axis).tickFormat(format));
    } else {
      svg.select(".y-axis")
        .call(d3.axisLeft(y_axis).tickFormat(d3.format(format)));
    }
  }
}