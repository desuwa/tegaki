class TegakiAirbrush extends TegakiBrush {
  constructor() {
    super();
    
    this.id = 3;
    
    this.name = 'airbrush';
    
    this.keybind = 'a';
    
    this.step = 0.1;
    
    this.size = 32;
    this.alpha = 1.0;
    
    this.useSizeDynamics = true;
    this.useAlphaDynamics = true;
    this.usePreserveAlpha = true;
  }
  
  generateShape(size) {
    var i, r, brush, ctx, dest, data, len, sqd, sqlen, hs, col, row,
      ecol, erow, a;
    
    r = size;
    size = size * 2;
    
    brush = $T.el('canvas');
    brush.width = brush.height = size;
    ctx = brush.getContext('2d');
    dest = ctx.getImageData(0, 0, size, size);
    data = dest.data;
    len = size * size * 4;
    sqlen = Math.sqrt(r * r);
    hs = Math.round(r);
    col = row = -hs;
    
    i = 0;
    while (i < len) {
      if (col >= hs) {
        col = -hs;
        ++row;
        continue;
      }
      
      ecol = col;
      erow = row;
      
      if (ecol < 0) { ecol = -ecol; }
      if (erow < 0) { erow = -erow; }
      
      sqd = Math.sqrt(ecol * ecol + erow * erow);
      
      if (sqd > sqlen) {
        a = 0;
      }
      else if (sqd === 0) {
        a = 255;
      }
      else {
        a = (sqd / sqlen) + 0.1;
        
        if (a > 1.0) {
          a = 1.0;
        }
        
        a = (1 - (Math.exp(1 - 1 / a) / a)) * 255;
      }
      
      data[i + 3] = a;
      
      i += 4;
      
      ++col;
    }
    
    return {
      center: r,
      stepSize: Math.floor(size * this.step),
      brushSize: size,
      kernel: data,
    };
  }
}
