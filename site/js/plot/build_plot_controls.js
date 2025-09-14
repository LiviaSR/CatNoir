function buildPlotControls(axis) {
  // Horizontal axis controls
  let controlAnchor = document.getElementById(`${axis}-plot-control-anchor`);

  // Tags in this array shall be ignored when building plot controls
  const ignoreField = ['name', 'Type', 'DoubleSystem', 'systemName', 'hasReferences', 'references', 'comments', 'Confirmed', 'v_t', 'v_1sig', 'v_90perct', 'kick_interv'];
  const rowLength = 3;

  let properties = []
  for ( let property of Object.keys(BlackHoleData[0]) ) {
    if ( ! ignoreField.includes(property) ) {
      properties.push(property);
    }
  }
  for ( let row = 0; row < Math.ceil(properties.length / rowLength); row++) {

    let rowDiv = document.createElement('div')
    rowDiv.className = 'row flex-nowrap';

    for ( let i = row * rowLength; i < (row + 1) * rowLength; i++ ) {
      if ( i >= properties.length ) { // Append empty columns to align elements
        let colDiv = document.createElement('div');
        colDiv.className = 'col';
        rowDiv.appendChild(colDiv);
        continue;
      }

      let colDiv = document.createElement('div');
      colDiv.className = 'col text-left';
      let formDiv = document.createElement('div')
      formDiv.className = 'form-check';

      let input = document.createElement('input');
      input.className = 'form-check-input';
      input.type = 'radio';
      input.name = `plot-control-${axis}`;
      input.id = `plot-control-${axis}-${properties[i]}`;
      input.value = properties[i];
      if ( axis == 'x' ) {
        input.setAttribute('onclick', 'setHorizontalAxis()');
      } else {
        input.setAttribute('onclick', 'setVerticalAxis()');
      }
      // Checked by default
      if ( pcs[axis] == properties[i] ) {
        input.checked = true;
      }
      
      let label = document.createElement('label');
      label.className = 'form-check-label';
      label.setAttribute('for', `plot-control-${axis}-${properties[i]}`);
      label.innerHTML = `<MathML>${symbols[properties[i]]}</MathML>`;

      formDiv.appendChild(input);
      formDiv.appendChild(label);
      colDiv.appendChild(formDiv);
      rowDiv.appendChild(colDiv);
    }
    controlAnchor.appendChild(rowDiv);
  }
}

function setConfirmed() {
  const isConfirmed = $('input[name="plot-control-sources"]:checked').val();
  pcs.confirmed = isConfirmed == 'confirmed' ? true : false;
  buildPlot();
}

function setHorizontalAxis() {
  const horizontalAxisProperty = $('input[name="plot-control-x"]:checked').val();
  pcs.x = horizontalAxisProperty;
  buildPlot();
}

function setVerticalAxis() {
  const verticalAxisProperty = $('input[name="plot-control-y"]:checked').val();
  pcs.y = verticalAxisProperty;
  buildPlot();
}