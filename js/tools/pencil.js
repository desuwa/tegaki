var TegakiPencil;

TegakiPencil = {
  name: 'pencil',
  
  keybind: 'b',
  
  useGhostLayer: true,
  sizePressureCtrl: false,
  pressureCache: [],
  
  init: function() {
    this.size = 1;
    this.alpha = 1.0;
    this.step = 0.10;
    this.stepAcc = 0;
    
    this.draw = TegakiBrush.draw;
    this.commit = TegakiBrush.commit;
    this.setSize = TegakiBrush.setSize;
    this.setAlpha = TegakiBrush.setAlpha;
    this.setColor = TegakiBrush.setColor;
    this.set = TegakiBrush.set;
    this.setSizePressureCtrl = TegakiBrush.setSizePressureCtrl;
    this.updateDynamics = TegakiBrush.updateDynamics;
    this.generateBrushCache  = TegakiBrush.generateBrushCache;
  },
  
  brushFn: function(x, y, imgData) {
    var i, data, a, kernel, w, xx, yy, px, brushSize;
    
    x = 0 | x;
    y = 0 | y;
    
    brushSize = this.brushSize;
    
    kernel = this.kernel;
    
    data = imgData.data;
    w = imgData.width;
    
    a = 0 | (this.alpha * 255);
    
    for (yy = 0; yy < brushSize; ++yy) {
      for (xx = 0; xx < brushSize; ++xx) {
        i = (yy * brushSize + xx) * 4;
        px = ((y + yy) * w + (x + xx)) * 4;
        
        data[px] = this.rgb[0]; ++px;
        data[px] = this.rgb[1]; ++px;
        data[px] = this.rgb[2]; ++px;
        
        if (kernel[i + 3] > 0) {
          data[px] = a;
        }
      }
    }
  },
  
  generateBrush: function() {
    var brush, ctx, e, x, y, imageData, data,
      c, color, size, r, rr;
    
    size = 0 | this.size;
    
    r = 0 | ((size) / 2);
    
    rr = 0 | ((size + 1) % 2);
    
    brush = $T.el('canvas');
    brush.width = brush.height = size;
    ctx = brush.getContext('2d');
    
    imageData = ctx.getImageData(0, 0, size, size);
    data = new Uint32Array(imageData.data.buffer);
    
    color = 0xFF000000;
    
    x = r;
    y = 0 | 0;
    e = 1 - r;
    c = r;
    
    while (x >= y) {
      data[c + x - rr + (c + y - rr) * size] = color;
      data[c + y - rr + (c + x - rr) * size] = color;
      
      data[c - y + (c + x - rr) * size] = color;
      data[c - x + (c + y - rr) * size] = color;
      
      data[c - y + (c - x) * size] = color;
      data[c - x + (c - y) * size] = color;
      
      data[c + y - rr + (c - x) * size] = color;
      data[c + x - rr + (c - y) * size] = color;
      
      ++y;
      
      if (e <= 0) {
        e += 2 * y + 1;
      }
      else {
        x--;
        e += 2 * (y - x) + 1;
      }
    }
    
    if (r > 0) {
      TegakiBucket.fill(imageData, imageData, r, r, this.rgb, this.alpha);
    }
    
    this.center = r;
    this.stepSize = 0 | Math.min(Math.floor(size * this.step), 8);
    this.brushSize = size;
    this.brush = brush;
    this.kernel = imageData.data;
  },
  
  draw: null,
  
  commit: null,
  
  setSize: null,
  
  setAlpha: null,
  
  setColor: null,
  
  set: null,
  
  setSizePressureCtrl: null,
  
  updateDynamics: null,
};
