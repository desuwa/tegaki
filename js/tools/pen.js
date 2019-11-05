class TegakiPen extends TegakiBrush {
  constructor() {
    super();
    
    this.id = 2;
    
    this.name = 'pen';
    
    this.keybind = 'p';
    
    this.step = 0.05;
    
    this.size = 8;
    this.alpha = 1.0;
    this.flow = 1.0;
    
    this.useSizeDynamics = true;
    this.useAlphaDynamics = true;
    this.useFlowDynamics = true;
    
    this.usePreserveAlpha = true;
  }
  
  easeFlow(flow) {
    return 1 - Math.sqrt(1 - Math.pow(flow, 3));
  }

  generateShape(size) {
    var e, x, y, imageData, data, c, color, r, rr,
      f, ff, bSize, bData, i, ii, xx, yy, center, brushSize;
    
    center = Math.floor(size / 2) + 1;
    
    brushSize = size + 2;
    
    f = 4;
    
    ff = f * f;
    
    bSize = brushSize * f;
    
    r = Math.floor(bSize / 2);
    
    rr = Math.floor((bSize + 1) % 2);
    
    imageData = new ImageData(bSize, bSize);
    bData = new Uint32Array(imageData.data.buffer);
    
    color = 0x55000000;
    
    x = r;
    y = 0;
    e = 1 - r;
    c = r;
    
    while (x >= y) {
      bData[c + x - rr + (c + y - rr) * bSize] = color;
      bData[c + y - rr + (c + x - rr) * bSize] = color;
      
      bData[c - y + (c + x - rr) * bSize] = color;
      bData[c - x + (c + y - rr) * bSize] = color;
      
      bData[c - y + (c - x) * bSize] = color;
      bData[c - x + (c - y) * bSize] = color;
      
      bData[c + y - rr + (c - x) * bSize] = color;
      bData[c + x - rr + (c - y) * bSize] = color;
      
      ++y;
      
      if (e <= 0) {
        e += 2 * y + 1;
      }
      else {
        x--;
        e += 2 * (y - x) + 1;
      }
    }
    
    color = 0xFF000000;
    
    x = r - 3;
    y = 0;
    e = 1 - r;
    c = r;
    
    while (x >= y) {
      bData[c + x - rr + (c + y - rr) * bSize] = color;
      bData[c + y - rr + (c + x - rr) * bSize] = color;
      
      bData[c - y + (c + x - rr) * bSize] = color;
      bData[c - x + (c + y - rr) * bSize] = color;
      
      bData[c - y + (c - x) * bSize] = color;
      bData[c - x + (c - y) * bSize] = color;
      
      bData[c + y - rr + (c - x) * bSize] = color;
      bData[c + x - rr + (c - y) * bSize] = color;
      
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
      Tegaki.tools.bucket.fill(imageData, r, r, this.rgb, 1.0);
    }
    
    bData = imageData.data;
    data = new ImageData(brushSize, brushSize).data;
    
    for (x = 0; x < brushSize; ++x) {
      for (y = 0; y < brushSize; ++y) {
        i = (y * brushSize + x) * 4 + 3;
        
        color = 0;
        
        for (xx = 0; xx < f; ++xx) {
          for (yy = 0; yy < f; ++yy) {
            ii = ((yy + y * f) * bSize + (xx + x * f)) * 4 + 3;
            color += bData[ii];
          }
        }
        
        data[i] = color / ff;
      }
    }
    
    return {
      center: center,
      stepSize: Math.ceil(size * this.step),
      brushSize: brushSize,
      kernel: data,
    };
  }
}
