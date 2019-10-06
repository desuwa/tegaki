class TegakiTone extends TegakiBrush {
  constructor() {
    super();
    
    this.name = 'tone';
    
    this.keybind = 't';
    
    this.step = 0.10;
    
    this.size = 8;
    this.alpha = 0.5;
    
    this.useActiveLayer = false;
    this.useGhostLayer = true;
    
    this.useSizeDynamics = true;
    this.useAlphaDynamics = true;
    
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
  
  brushFn(x, y, offsetX, offsetY) {
    var data, kernel, brushSize, map, idx,
      px, mapWidth, mapHeight, xx, yy, gx, gy, width;
    
    x = 0 | x;
    y = 0 | y;
    
    gx = 0 | (x + offsetX);
    gy = 0 | (y + offsetY);
    
    data = this.ghostImgData.data;
    width = this.ghostImgData.width;
    
    kernel = this.kernel;
    
    brushSize = this.brushSize;
    
    mapWidth = Tegaki.baseWidth;
    mapHeight = Tegaki.baseHeight;
    
    idx = Math.round(this.brushAlpha * 16) - 1;
    
    if (idx < 0) {
      return;
    }
    
    map = this.mapCache[idx];
    
    for (yy = 0; yy < brushSize; ++yy) {
      for (xx = 0; xx < brushSize; ++xx) {
        if (kernel[((yy * brushSize + xx) * 4) + 3] === 0) {
          continue;
        }
        
        if (map[(yy + gy) * mapWidth + xx + gx] === 0) {
          px = ((yy + y) * width + xx + x) * 4;
          data[px] = this.rgb[0]; ++px;
          data[px] = this.rgb[1]; ++px;
          data[px] = this.rgb[2]; ++px;
          data[px] = 255;
        }
      }
    }
  }
  
  generateMap(w, h, idx) {
    var data, x, y;
    
    data = new Uint8Array(Tegaki.baseWidth * Tegaki.baseHeight);
    
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

TegakiTone.prototype.generateShape = TegakiPencil.prototype.generateShape;
