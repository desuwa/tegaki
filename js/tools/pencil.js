class TegakiPencil extends TegakiBrush {
  constructor() {
    super();
    
    this.name = 'pencil';
    
    this.keybind = 'b';
    
    this.step = 0.10;
    
    this.size = 1;
    this.alpha = 1.0;
    
    this.useGhostLayer = true;
    this.useActiveLayer = false;
    
    this.useSizeDynamics = true;
    this.useAlphaDynamics = false;
  }
  
  brushFn(x, y, offsetX, offsetY) {
    var i, data, kernel, width, xx, yy, px, brushSize, a;
    
    x = 0 | x;
    y = 0 | y;
    
    brushSize = this.brushSize;
    
    kernel = this.kernel;
    
    data = this.ghostImgData.data;
    width = this.ghostImgData.width;
    
    a = 0 | (this.alpha * 255);
    
    for (yy = 0; yy < brushSize; ++yy) {
      for (xx = 0; xx < brushSize; ++xx) {
        i = (yy * brushSize + xx) * 4;
        px = ((y + yy) * width + (x + xx)) * 4;
        
        data[px] = this.rgb[0]; ++px;
        data[px] = this.rgb[1]; ++px;
        data[px] = this.rgb[2]; ++px;
        
        if (kernel[i + 3] > 0) {
          data[px] = a;
        }
      }
    }
  }
  
  generateShape(size) {
    var brush, ctx, e, x, y, imageData, data, c, color, r, rr;
    
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
      Tegaki.tools.bucket.fill(imageData, imageData, r, r, this.rgb, this.alpha);
    }
    
    return {
      center: r,
      stepSize: Math.floor(size * this.step),
      brushSize: size,
      kernel: imageData.data,
    };
  }
}
