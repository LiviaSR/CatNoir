var plotlyState = {
  x: 'P_orb',
  y: 'm_bh',
  scaleX: 'log',
  scaleY: 'log',
  types: { LMXB: true, HMXB: true, 'Non-interacting': true, 'Isolated': true },
  confirmedOnly: false,
};

var fieldMeta = {
  P_orb:     { symbol: 'P_{orb}',   unit: '\\text{days}',      hoverLabel: 'P<sub>orb</sub> (days)' },
  K_cp:      { symbol: 'K_{cp}',    unit: '\\text{km s}^{-1}', hoverLabel: 'K<sub>cp</sub> (km s<sup>−1</sup>)' },
  e:         { symbol: 'e',         unit: '',                   hoverLabel: 'e' },
  orb_angle: { symbol: 'i',         unit: '\\text{deg}',        hoverLabel: 'i (deg)' },
  q:         { symbol: 'q',         unit: '',                   hoverLabel: 'q' },
  m_literat: { symbol: 'M_{lit}',   unit: 'M_\\odot',           hoverLabel: 'M<sub>lit</sub> (M<sub>⊙</sub>)' },
  m_bh:      { symbol: 'M_{2025}',  unit: 'M_\\odot',           hoverLabel: 'M<sub>2025</sub> (M<sub>⊙</sub>)' },
};

function getTypeColors() {
  var isDark = localStorage.getItem('theme') !== 'theme-light';
  return isDark ? {
    'LMXB':            '#f0b429',
    'HMXB':            '#5ba4f5',
    'Non-interacting': '#c084fc',
    'Isolated':        '#34d399',
  } : {
    'LMXB':            '#b8690a',
    'HMXB':            '#1a5fc8',
    'Non-interacting': '#7c3aed',
    'Isolated':        '#0f7a4a',
  };
}

var typeLabels = {
  'LMXB':            'LMXB',
  'HMXB':            'HMXB',
  'Non-interacting': 'Non-interacting',
  'Isolated':        'Isolated',
};
