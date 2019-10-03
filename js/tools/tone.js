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
    
    this.matrix = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1 ,9],
      [15, 7, 13, 5]
    ];
  }
  
  brushFn(x, y, offsetX, offsetY) {
    var data, kernel, brushSize, map,
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
    
    map = this.generateMap(mapWidth, mapHeight);
    
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
  
  generateMap(w, h) {
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
  }
}

TegakiTone.prototype.generateShape = TegakiPencil.prototype.generateShape;
