class TegakiPencil extends TegakiBrush {
  constructor() {
    super();
    
    this.name = 'pencil';
    
    this.keybind = 'b';
    
    this.step = 0.01;
    
    this.size = 1;
    this.alpha = 1.0;
    
    this.useSizeDynamics = true;
    this.useAlphaDynamics = true;
    this.usePreserveAlpha = true;
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
      Tegaki.tools.bucket.fill(imageData, imageData, r, r, this.rgb, 1.0);
    }
    
    return {
      center: r,
      stepSize: Math.floor(size * this.step),
      brushSize: size,
      kernel: imageData.data,
    };
  }
}
