var TegakiTone;

TegakiTone = {
  name: 'tone',
  
  keybind: 't',
  
  matrix: null,
  
  data: null,
  
  dataAlpha: null,
  dataWidth: null,
  dataHeight: null,
  
  init: function() {
    this.size = 8;
    this.alpha = 0.5;
    this.step = 0.25;
    this.stepAcc = 0;
    
    this.matrix = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1 ,9],
      [15, 7, 13, 5]
    ];
    
    this.draw = TegakiBrush.draw;
    this.commit = TegakiBrush.commit;
    this.generateBrush = TegakiPencil.generateBrush;
    this.setSize = TegakiBrush.setSize;
    this.setAlpha = TegakiBrush.setAlpha;
    this.setColor = TegakiBrush.setColor;
    this.set = TegakiBrush.set;
  },
  
  brushFn: function(x, y) {
    var ctx, dest, data, kernel, brushSize, map,
      px, mapWidth, mapHeight, xx, yy;
    
    x = 0 | x;
    y = 0 | y;
    
    ctx = Tegaki.ghostCtx;
    dest = ctx.getImageData(x, y, this.brushSize, this.brushSize);
    data = dest.data;
    kernel = this.kernel;
    
    brushSize = this.brushSize;
    
    mapWidth = Tegaki.canvas.width;
    mapHeight = Tegaki.canvas.height;
    
    map = this.generate(mapWidth, mapHeight);
    
    for (yy = 0; yy < brushSize; ++yy) {
      for (xx = 0; xx < brushSize; ++xx) {
        px = (brushSize * yy + xx) * 4;
        
        if (kernel[px + 3] === 0) {
          continue;
        }
        
        if (map[(yy + y) * mapWidth + xx + x] === 0) {
          data[px] = this.rgb[0]; ++px;
          data[px] = this.rgb[1]; ++px;
          data[px] = this.rgb[2]; ++px;
          data[px] = 255;
        }
      }
    }
    
    ctx.putImageData(dest, x, y);
  },
  
  generate: function(w, h) {
    var data, x, y, a;
    
    if (this.alpha == this.dataAlpha
      && w === this.dataWidth
      && h === this.dataHeight) {
      return this.data;
    }
    
    data = new Uint8Array(w * h);
    
    if (this.alpha <= 1.0) {
      a = this.alpha * 16 - 1;
      
      for (y = 0; y < h; ++y) {
        for (x = 0; x < w; ++x) {
          if (a < this.matrix[y % 4][x % 4]) {
            data[w * y + x] = 1;
          }
        }
      }
    }
    
    this.dataAlpha = this.alpha;
    this.dataWidth = w;
    this.dataHeight = h;
    
    this.data = data;
    
    return data;
  },
  
  draw: null,
  
  commit: null,
  
  generateBrush: null,
  
  setSize: null,
  
  setAlpha: null,
  
  setColor: null,
  
  set: null,
};
