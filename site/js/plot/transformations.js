const multiXBy = (x, y, multiplier) => {
  let xCopy = _.cloneDeep(x);
  let yCopy = _.cloneDeep(y);

  xCopy = xCopy.map((v) => {
    return({
      'type': v.type,
      'value': v.value * multiplier,
      'name': v.name,
      'isLimit': v.isLimit,
      'isAssumed': v.isAssumed,
      'Confirmed': v.Confirmed
    });
  })

  return [xCopy, yCopy];
}

const multiYBy = (x, y, multiplier) => {
  let xCopy = _.cloneDeep(x);
  let yCopy = _.cloneDeep(y);

  yCopy = yCopy.map((v) => {
    return({
      'type': v.type,
      'value': v.value * multiplier,
      'name': v.name,
      'isLimit': v.isLimit,
      'isAssumed': v.isAssumed,
      'Confirmed': v.Confirmed
    });
  })

  return [xCopy, yCopy];
}

const removeOutliersXGT = (x, y, threshold) => {
  let xCopy = _.cloneDeep(x);
  let yCopy = _.cloneDeep(y);

  for ( let i = 0; i < xCopy.length; i++ ) {
    if ( xCopy[i].value > threshold ) {
      delete xCopy[i];
      delete yCopy[i];
    }
  }

  xCopy = xCopy.filter(e => e !== undefined);
  yCopy = yCopy.filter(e => e !== undefined);

  return [xCopy, yCopy];
}

const removeOutliersYGT = (x, y, threshold) => {
  let xCopy = _.cloneDeep(x);
  let yCopy = _.cloneDeep(y);

  for ( let i = 0; i < yCopy.length; i++ ) {
    if ( yCopy[i].value > threshold ) {
      delete yCopy[i];
      delete xCopy[i];
    }
  }

  xCopy = xCopy.filter(e => e !== undefined);
  yCopy = yCopy.filter(e => e !== undefined);

  return [xCopy, yCopy];
}

const filterByRecycled = (x, y) => {
  let xCopy = _.cloneDeep(x);
  let yCopy = _.cloneDeep(y);

  xCopy = xCopy.filter(v => v.type === 'rec' );
  yCopy = yCopy.filter(v => v.type === 'rec' );

  return [xCopy, yCopy];
}

const absoluteValue = (x, y) => {
  let xCopy = _.cloneDeep(x);
  let yCopy = _.cloneDeep(y);

  xCopy = xCopy.map((v) => {
    return({
      'type': v.type,
      'value': Math.abs(v.value),
      'name': v.name,
      'isLimit': v.isLimit,
      'isAssumed': v.isAssumed,
      'Confirmed': v.Confirmed,
    })
  });

  yCopy = yCopy.map((v) => {
    return({
      'type': v.type,
      'value': Math.abs(v.value),
      'name': v.name,
      'isLimit': v.isLimit,
      'isAssumed': v.isAssumed,
      'Confirmed': v.Confirmed
    })
  });

  return [xCopy, yCopy];
}

const removeXValueEq = (x, y, value) => {
  let xCopy = _.cloneDeep(x);
  let yCopy = _.cloneDeep(y);

  for ( let i = 0; i < xCopy.length; i++ ) {
    if ( xCopy[i].value === value ) {
      delete yCopy[i];
      delete xCopy[i];
    }
  }

  xCopy = xCopy.filter(e => e !== undefined);
  yCopy = yCopy.filter(e => e !== undefined);

  return [xCopy, yCopy];
}

const removeYValueEq = (x, y, value) => {
  let xCopy = _.cloneDeep(x);
  let yCopy = _.cloneDeep(y);

  for ( let i = 0; i < yCopy.length; i++ ) {
    if ( yCopy[i].value === value ) {
      delete xCopy[i];
      delete yCopy[i];
    }
  }

  xCopy = xCopy.filter(e => e !== undefined);
  yCopy = yCopy.filter(e => e !== undefined);

  return [xCopy, yCopy];
}

const filterByLimit = (x, y) => {
  let xCopy = _.cloneDeep(x);
  let yCopy = _.cloneDeep(y);

  for ( let i = 0; i < xCopy.length; i++ ) {
    if ( xCopy[i].isLimit || yCopy[i].isLimit ) {
      delete xCopy[i];
      delete yCopy[i];
    }
  }

  xCopy = xCopy.filter(e => e !== undefined);
  yCopy = yCopy.filter(e => e !== undefined);

  return [xCopy, yCopy];
}

const filterByAssumed = (x, y) => {
  let xCopy = _.cloneDeep(x);
  let yCopy = _.cloneDeep(y);

  for ( let i = 0; i < xCopy.length; i++ ) {
    if ( xCopy[i].isAssumed || yCopy[i].isAssumed ) {
      delete xCopy[i];
      delete yCopy[i];
    }
  }

  xCopy = xCopy.filter(e => e !== undefined);
  yCopy = yCopy.filter(e => e !== undefined);

  return [xCopy, yCopy];
}

const excludeWithNames = (x, y, names) => {
  let xCopy = _.cloneDeep(x);
  let yCopy = _.cloneDeep(y);

  xCopy = xCopy.filter(e => ! names.includes(e.name) );
  yCopy = yCopy.filter(e => ! names.includes(e.name) );

  return [xCopy, yCopy];
}
