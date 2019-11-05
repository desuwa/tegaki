class TegakiTone extends TegakiPencil {
  constructor() {
    super();
    
    this.id = 5;
    
    this.name = 'tone';
    
    this.keybind = 't';
    
    this.step = 0.01;
    
    this.useFlow = false;

    this.size = 8;
    this.alpha = 0.5;
    
    this.useSizeDynamics = true;
    this.useAlphaDynamics = true;
    this.usePreserveAlpha = true;
    
    this.matrix = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1 ,9],
      [15, 7, 13, 5]
    ];
    
    this.mapCache = null;
    this.mapWidth = 0;
    this.mapHeight = 0;
  }
  
  start(x, y) {
    if (this.mapWidth !== Tegaki.baseWidth || this.mapHeight !== Tegaki.baseHeight) {
      this.generateMapCache(true);
    }
    
    super.start(x, y);
  }
  
  brushFn(x, y, offsetX, offsetY) {
    var data, kernel, brushSize, map, idx, preserveAlpha,
      px, mx, mapWidth, xx, yy, ix, iy, canvasWidth, canvasHeight;
    
    data = Tegaki.activeLayer.imageData.data;
    
    canvasWidth = Tegaki.baseWidth;
    canvasHeight = Tegaki.baseHeight;
    
    kernel = this.kernel;
    
    brushSize = this.brushSize;
    
    mapWidth = this.mapWidth;
    
    preserveAlpha = this.preserveAlphaEnabled;
    
    idx = Math.round(this.brushAlpha * 16) - 1;
    
    if (idx < 0) {
      return;
    }
    
    map = this.mapCache[idx];
    
    for (yy = 0; yy < brushSize; ++yy) {
      iy = y + yy + offsetY;
      
      if (iy < 0 || iy >= canvasHeight) {
        continue;
      }
      
      for (xx = 0; xx < brushSize; ++xx) {
        ix = x + xx + offsetX;
        
        if (ix < 0 || ix >= canvasWidth) {
          continue;
        }
        
        if (kernel[(yy * brushSize + xx) * 4 + 3] === 0) {
          continue;
        }
        
        mx = iy * canvasWidth + ix;
        px = mx * 4;
        
        if (map[mx] === 0) {
          data[px] = this.rgb[0];
          data[px + 1] = this.rgb[1];
          data[px + 2] = this.rgb[2];
          
          if (!preserveAlpha) {
            data[px + 3] = 255;
          }
        }
      }
    }
  }
  
  generateMap(w, h, idx) {
    var data, x, y;
    
    data = new Uint8Array(w * h);
    
    for (y = 0; y < h; ++y) {
      for (x = 0; x < w; ++x) {
        if (idx < this.matrix[y % 4][x % 4]) {
          data[w * y + x] = 1;
        }
      }
    }
    
    return data;
  }
  
  generateMapCache(force) {
    var i, cacheSize;
    
    cacheSize = this.matrix.length * this.matrix[0].length;
    
    if (!this.mapCache) {
      this.mapCache = new Array(cacheSize);
    }
    
    if (!force && this.mapCache[0]
      && this.mapWidth === Tegaki.baseWidth
      && this.mapHeight === Tegaki.baseHeight) {
      return;
    }
    
    this.mapWidth = Tegaki.baseWidth;
    this.mapHeight = Tegaki.baseHeight;
    
    for (i = 0; i < cacheSize; ++i) {
      this.mapCache[i] = this.generateMap(this.mapWidth, this.mapHeight, i);
    }
  }
  
  setAlpha(alpha) {
    super.setAlpha(alpha);
    this.generateMapCache();
  }
}
