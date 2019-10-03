class TegakiDodge extends TegakiBrush {
  constructor() {
    super();
    
    this.name = 'dodge';
    
    this.size = 32;
    this.alpha = 0.5;
    this.step = 0.25;
    
    this.useGhostLayer = false;
    this.activeLayer = true;
    
    this.useAlphaDynamics = true;
  }
  
  commit() {
    this.activeImgData = null;
    this.tmpImgData = null;
  }
  
  brushFn(x, y, offsetX, offsetY) {
    var data, ka, kernel, w, xx, yy, r, g, b, h, s, v, px,
      size, alpha, toHsv, toRgb;
    
    x = 0 | x;
    y = 0 | y;
    
    alpha = this.brushAlpha;
    size = this.brushSize;
    
    kernel = this.kernel;
    
    data = this.activeImgData.data;
    w = this.activeImgData.width;
    
    toHsv = $T.RgbToHsv;
    toRgb = $T.HsvToRgb;
    
    for (yy = 0; yy < size; ++yy) {
      for (xx = 0; xx < size; ++xx) {
        px = ((y + yy) * w + (x + xx)) * 4;
        
        ka = (kernel[(yy * size + xx) * 4 + 3] / 255) * alpha * 0.1;
        
        r = data[px];
        g = data[px + 1];
        b = data[px + 2];
        
        [ h, s, v ] = toHsv(r, g, b);
        
        v = v + ka;
        
        [ r, g, b ] = toRgb(h, s, v);
        
        data[px] = r;
        data[px + 1] = g;
        data[px + 2] = b;
      }
    }
  }
}

TegakiDodge.prototype.generateShape = TegakiAirbrush.prototype.generateShape;
