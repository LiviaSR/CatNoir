function trimZeros(n) {
  return String(n).replace(/^0+\.0*/, '');
}

function mergeRows(systemName) {
  // Verify if a row with property double-system="systemName" already exists
  let systemRow = document.querySelectorAll(`[double-system="${systemName}"]`);
  
  if ( systemRow.length > 0 ) { // row found
    // Loop through existing td elements in row and append values with a <br> tag 
    for ( let i = 0; i < systemRow[0].childElementCount / 2; i++ ) {
      if ( systemRow[0].childNodes[i].innerHTML === systemRow[0].childNodes[i + systemRow[0].childElementCount / 2].innerHTML) { continue; }
      systemRow[0].childNodes[i].innerHTML += '<br>' + systemRow[0].childNodes[i + systemRow[0].childElementCount / 2].innerHTML;
    }

    // Remove unecessary <tds> when repeated
    for ( let i = systemRow[0].childElementCount / 2; i < systemRow[0].childElementCount; ) {
      systemRow[0].removeChild(systemRow[0].childNodes[i]);
    }
  }
}

function enumarateReferences(pulsarData) {
  // Enumaretes all references following the order they appear (rows, than columns)//
  let index = 1;

  for ( let data of pulsarData ) {
    if ( data.hasReferences ) {
      for ( let reference of data.references ) {
        reference['ref-number'] = index++;
      }
    }
    let keys = Object.keys(data)
    keys.sort()
    for ( let key of keys ) {
      if ( key === "hasReferences" ) {continue}
      if ( typeof data[key] === 'object' && data[key] !== null )
      if ( data[key].hasOwnProperty("hasReferences") ) {
        if ( data[key].hasReferences ) {
          for ( let reference of data[key].references ) {
            reference['ref-number'] = index++;
          }
        }
      }
    }
  }
}

function addReferences(references, td) {
  const div = document.createElement('div');
  for ( let reference of references ) {
    let sup = document.createElement('sup');
    let a = document.createElement('a');

    sup.className = 'reference';
    sup.id = 'Ref_' + reference['ref-number'];

    a.innerHTML = '[' + reference['ref-number'] + ']';
    a.setAttribute('target', 'papers');
    a.setAttribute('href', reference.link);

    sup.appendChild(a);
    div.appendChild(sup);
    td.appendChild(div);
  }
}

function addUncertainty(uncertainty, td) {
  if ( uncertainty.symmetrical ) { td.innerHTML += '(' + trimZeros(uncertainty.up) + ')'; } 
  else { td.innerHTML += '(+' + trimZeros(uncertainty.up) + '/-' + trimZeros(uncertainty.down) + ')'; }
}

function addComment(comment, tdName, span) {
  span.setAttribute('data-toggle', 'tooltip');
  span.setAttribute('data-placement', 'right');
  span.setAttribute('title', comment);

  tdName.appendChild(span);
}

function buildPulsarsTable() {
  const tableAnchor = document.getElementById('DNS-catalogue-tbody');

  for ( let data of pulsarData ) {
    let tr = document.createElement('tr');

    // Double system
    if ( data.DoubleSystem ) {
      let systemRow = document.querySelectorAll(`[double-system="${data.systemName}"]`);
      if ( systemRow.length > 0 ) { // row found
        tr = systemRow[0];
      } else {
        tr.setAttribute('double-system', data.systemName);
      }
    }

    // Name
    let tdName = document.createElement('td');
    let divName = document.createElement('div');
    let span = document.createElement('span');

    span.innerHTML = data.name;
    divName.appendChild(span);
    tdName.appendChild(divName);
    
    // Add comments
    if ( data.comments ) { addComment(data.comments, tdName, span); }
    // References
    if ( data.hasReferences ) { 
      addReferences(data.references, tdName); 
    }
    tdName.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

    // P (period)
    let tdP = document.createElement('td');
    tdP.innerHTML = data.p.value;
    // P References
    if ( data.p.hasReferences ) {
      addReferences(data.p.references, tdP); 
    }

    // P dot
    let tdPDot = document.createElement('td');
    tdPDot.innerHTML = data.pdot.value;
    // P dot Uncertainty
    if ( data.pdot.hasUncertainty ) { addUncertainty(data.pdot.uncertainty, tdPDot) }
    // P dot References
    if ( data.pdot.hasReferences ) { 
      addReferences(data.pdot.references, tdPDot); }
    tdPDot.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

    // Pb (orbital period)
    let tdPb = document.createElement('td');
    tdPb.innerHTML = data.pb.value;
    // Pb References
    if ( data.pb.hasReferences ) { 
      addReferences(data.pb.references, tdPb); }
    tdPb.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

    // e
    let tdE = document.createElement('td');
    tdE.innerHTML = data.e.value;
    // e References
    if ( data.e.hasReferences ) { 
      addReferences(data.e.references, tdE); }
    tdE.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

    // f
    let tdF = document.createElement('td');
    tdF.innerHTML = data.f.value;
    // f References
    if ( data.f.hasReferences ) { 
      addReferences(data.f.references, tdF); }
    tdF.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

    // Mt
    let tdMt = document.createElement('td');
    if ( data.mt.value ) {
      tdMt.innerHTML = data.mt.value;
      // Mt Uncertainty
      if ( data.mt.hasUncertainty ) { addUncertainty(data.mt.uncertainty, tdMt) }
      // Mt References
      if ( data.mt.hasReferences ) { 
        addReferences(data.mt.references, tdMt); }
      tdMt.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping
    } else {
      tdMt.innerHTML = '-';
    }

    // Mp
    let tdMp = document.createElement('td');
    // Is limit
    if ( data.mp.isLimit ) { tdMp.innerHTML = '< ' + data.mp.value; }
    else if ( data.mp.isAssumed ) { tdMp.innerHTML = '[' + data.mp.value + ']'; }
    else { tdMp.innerHTML = data.mp.value; }
    // Mp Uncertainty
    if ( data.mp.hasUncertainty ) { addUncertainty(data.mp.uncertainty, tdMp) }
    // Mp References
    if ( data.mp.hasReferences ) { 
      addReferences(data.mp.references, tdMp); }
    tdMp.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

    // Mc
    let tdMc = document.createElement('td');
    // Is limit
    if ( data.mc.isLimit ) { tdMc.innerHTML = '> ' + data.mc.value; }
    else if ( data.mc.isAssumed ) { tdMc.innerHTML = '[' + data.mc.value + ']'; }
    else { tdMc.innerHTML = data.mc.value; }
    // Mc Uncertainty
    if ( data.mc.hasUncertainty ) { addUncertainty(data.mc.uncertainty, tdMc) }
    // Mc References
    if ( data.mc.hasReferences ) { 
      addReferences(data.mc.references, tdMc); }
    tdMc.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

    // Chirp Mass
    let tdChirp = document.createElement('td');
    if (data.chirp.value) {
      tdChirp.innerHTML = data.chirp.value;
      // Chirp Mass References
     if ( data.chirp.hasReferences ) { 
      addReferences(data.chirp.references, tdChirp); }
    } else {
      tdChirp.innerHTML = '-';
    }

    // Delta
    let tdDelta = document.createElement('td');
    if ( data.delta.value ) {
      // Is limit
      if ( data.delta.isLimit ) { tdDelta.innerHTML = '< ' + data.delta.value; }
      else { tdDelta.innerHTML = data.delta.value; }
      // Delta Uncertainty
      if ( data.delta.hasUncertainty ) { addUncertainty(data.delta.uncertainty, tdDelta) }
      // Delta References
      if ( data.delta.hasReferences ) { 
        addReferences(data.delta.references, tdDelta); }
      tdDelta.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping
    } else {
      tdDelta.innerHTML = '-';
    }

    // Chi
    let tdChi = document.createElement('td');
    if (data.chi.value) {
      tdChi.innerHTML = data.chi.value;
     if ( data.chi.hasReferences ) { 
      addReferences(data.chi.references, tdChi); }
    tdChi.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping
    } else {
      tdChi.innerHTML = '-';
    }
    // Chi References

    // Effective chi
    let tdChieff = document.createElement('td');
    tdChieff.innerHTML = data.chieff.value ? data.chieff.value : '-';
    // Effective chi Uncertainty
    if ( data.chieff.hasUncertainty ) { addUncertainty(data.chieff.uncertainty, tdChieff) } 
    // Effective chi References
    if ( data.chieff.hasReferences ) { 
      addReferences(data.chieff.references, tdChieff); }
    tdChieff.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

    // Characteristic age
    let tdAge = document.createElement('td');
    tdAge.innerHTML = data.age.value;
     // Characteristic age References
    if ( data.age.hasReferences ) { 
      addReferences(data.age.references, tdAge); }
    tdAge.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

    // Tau
    let tdTau = document.createElement('td');
    tdTau.innerHTML = data.tau.value;
    // Tau References
    if ( data.tau.hasReferences ) { 
      addReferences(data.tau.references, tdTau); }
    tdTau.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping
    
    // Append columns to row
    tr.appendChild(tdName);
    tr.appendChild(tdP);
    tr.appendChild(tdPDot);
    tr.appendChild(tdPb);
    tr.appendChild(tdE);
    tr.appendChild(tdF);
    tr.appendChild(tdMt);
    tr.appendChild(tdMp);
    tr.appendChild(tdMc);
    tr.appendChild(tdChirp);
    tr.appendChild(tdDelta);
    tr.appendChild(tdChi);
    tr.appendChild(tdChieff);
    tr.appendChild(tdAge);
    tr.appendChild(tdTau);

    // Append only values to row when "DoubleSystem" property is true
    if ( data.DoubleSystem ) { mergeRows(data.systemName); }

    // Append row to table
    tableAnchor.appendChild(tr);
  }
}

function buildSecondTable() {
  const tableAnchor = document.getElementById('DNS-kinematics-tbody');

  let skipNextCompanion = false;

  for ( let data of pulsarData ) {
      if ( ! data.mul.value ) { continue; } // Plot only systems with proprer motion measurement
      if ( skipNextCompanion ) { skipNextCompanion = false; continue; }  // Remove companion of Double Neutron Star Systems
      else if ( data.DoubleSystem ) { skipNextCompanion = true; } 

      let tr = document.createElement('tr');

      // Name
      let tdName = document.createElement('td');
      let divName = document.createElement('div');
      let span = document.createElement('span');
      
      span.innerHTML = data.name;
      divName.appendChild(span);
      tdName.appendChild(divName);
      tdName.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping


      // Distance
      let tdD = document.createElement('td');
      tdD.innerHTML = data.dist.value;
      // D Uncertainty
      if ( data.dist.hasUncertainty ) { addUncertainty(data.dist.uncertainty, tdD) }
      // D References
      if ( data.dist.hasReferences ) { addReferences(data.dist.references, tdD); }
      tdD.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

      // Galactic longitude
      let tdL = document.createElement('td');
      tdL.innerHTML = data.l.value;
      // Galactic longitude References
      if ( data.l.hasReferences ) { addReferences(data.l.references, tdL); }
      tdL.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping
      
      // Galactic latitude
      let tdB = document.createElement('td');
      tdB.innerHTML = data.b.value;
      // Galactic latitude References
      if ( data.b.hasReferences ) { addReferences(data.b.references, tdB); }
      tdB.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

      // Galactic altitude
      let tdZ = document.createElement('td');
      if ( data.z.value){
      tdZ.innerHTML = data.z.value;
      // Galactic altitude References
      if ( data.z.hasReferences ) { addReferences(data.z.references, tdZ); }
      tdZ.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping
      } else {
        tdZ.innerHTML = '-'
      }

      // Proper motion in l
      let tdMuL = document.createElement('td');
      tdMuL.innerHTML = data.mul.value;
      // Proper motion in l uncertainties
      if (data.mul.hasUncertainty) { addUncertainty(data.mul.uncertainty, tdMuL)}
      // Proper motion in l References
      if ( data.mul.hasReferences ) { addReferences(data.mul.references, tdMuL); }
      tdMuL.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

      // Proper motion in l
      let tdMuB = document.createElement('td');
      tdMuB.innerHTML = data.mub.value;
      // Proper motion in l uncertainties
      if (data.mub.hasUncertainty) { addUncertainty(data.mub.uncertainty, tdMuB)}
      // Proper motion in l References
      if ( data.mub.hasReferences ) { addReferences(data.mub.references, tdMuB); }
      tdMuB.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

      // Transversal velocity interval
      let tdV_t = document.createElement('td');
      tdV_t.innerHTML =  data.v_t.value[0] + '-' + data.v_t.value[1];
      // Transversal velocity uncertainties
      if (data.v_t.hasUncertainty) { addUncertainty(data.v_t.uncertainty, tdV_t)}
      // Transversal velocity References
      if ( data.v_t.hasReferences ) { addReferences(data.v_t.references, tdV_t); }
      tdV_t.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

      // Transversal velocity interval
      let tdV_1sig = document.createElement('td');
      tdV_1sig.innerHTML =  data.v_1sig.value[0] + '-' + data.v_1sig.value[1];
      // Transversal velocity uncertainties
      if (data.v_1sig.hasUncertainty) { addUncertainty(data.v_1sig.uncertainty, tdV_1sig)}
      // Transversal velocity References
      if ( data.v_1sig.hasReferences ) { addReferences(data.v_1sig.references, tdV_1sig); }
      tdV_t.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

      // 90% upper limit of systemic velocity
      let tdV_90perct = document.createElement('td');
      tdV_90perct.innerHTML =  data.v_90perct.value;
      // 90% upper limit of systemic uncertainties
      if (data.v_90perct.hasUncertainty) { addUncertainty(data.v_90perct.uncertainty, tdV_90perct)}
      // 90% upper limit of systemic References
      if ( data.v_90perct.hasReferences ) { addReferences(data.v_90perct.references, tdV_90perct); }
      tdV_t.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

      // Median kick velocity
      let tdKick_med = document.createElement('td');
      if (data.kick_median.value) {
        tdKick_med.innerHTML =  data.kick_median.value;
      }
      else tdKick_med.innerHTML = '-'
      // 90% upper limit of systemic uncertainties
      if (data.kick_median.hasUncertainty) { addUncertainty(data.kick_median.uncertainty, tdKick_med)}
      // 90% upper limit of systemic References
      if ( data.kick_median.hasReferences ) { addReferences(data.kick_median.references, tdKick_med); }
      tdV_t.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping

      // Median kick velocity
      let tdKick_interv = document.createElement('td');
      if (data.kick_interv.value) {
        tdKick_interv.innerHTML =  data.kick_interv.value[0] + '-' + data.kick_interv.value[1];
      }
      else tdKick_interv.innerHTML =  '-';
      // 90% upper limit of systemic uncertainties
      if (data.kick_interv.hasUncertainty) { addUncertainty(data.kick_interv.uncertainty, tdKick_interv)}
      // 90% upper limit of systemic References
      if ( data.kick_interv.hasReferences ) { addReferences(data.kick_interv.references, tdKick_interv); }
      tdV_t.setAttribute('style', 'white-space: nowrap') // Prevent references from wrapping
              
      tr.appendChild(tdName);
      tr.appendChild(tdD);
      tr.appendChild(tdL);
      tr.appendChild(tdB);
      tr.appendChild(tdZ);
      tr.appendChild(tdMuL);
      tr.appendChild(tdMuB);
      tr.appendChild(tdV_t);
      tr.appendChild(tdV_1sig);
      tr.appendChild(tdV_90perct);
      tr.appendChild(tdKick_med);
      tr.appendChild(tdKick_interv);

      tableAnchor.appendChild(tr);
        
    } 
}

function referencesList() {
  const div = document.getElementById('references-list');

  for ( let data of pulsarData ) {
    if ( data.hasReferences ) { 
      for ( let reference of data.references ) {
        if ( reference.hasOwnProperty('descrip') ) { 
          let p = document.createElement('p');
          let a = document.createElement('a');

          a.innerHTML = reference['ref-number'] + '. ' +  reference.descrip ;
          a.setAttribute('target', 'papers');
          a.setAttribute('href', reference.link);

          p.appendChild(a);
          div.appendChild(p);
        }
      }
    } 
  }
}

