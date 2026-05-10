const defaultColor = (type) => {
  switch(type) {
    case 'LMXB':
      return colors['LMXB'];
    case 'HMXB':
      return colors['HMXB'];
    case 'other':
      return colors['other']
  }  
}