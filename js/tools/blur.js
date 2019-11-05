class TegakiBlur extends TegakiBrush {
  constructor() {
    super();
    
    this.id = 7;
    
    this.name = 'blur';
    
    this.step = 0.25;
    
    this.useFlow = false;
    
    this.size = 32;
    this.alpha = 0.5;
    
    this.useAlphaDynamics = true;
    this.usePreserveAlpha = false;
  }
  
  writeImageData(x, y, w, h) {
    var xx, yy, ix, iy, px, canvasWidth, aData, bData;
    
    aData = Tegaki.activeLayer.imageData.data;
    bData = Tegaki.blendBuffer.data;
    
    canvasWidth = Tegaki.baseWidth;
    
    for (xx = 0; xx < w; ++xx) {
      ix = x + xx;
      
      for (yy = 0; yy < h; ++yy) {
        iy = y + yy;
        
        px = (iy * canvasWidth + ix) * 4;
        
        aData[px] = bData[px];
        aData[px + 1] = bData[px + 1];
        aData[px + 2] = bData[px + 2];
        aData[px + 3] = bData[px + 3];
      }
    }
    
    super.writeImageData(x, y, w, h);
  }
  
  readImageData(x, y, w, h) {
    var xx, yy, ix, iy, px, canvasWidth, aData, bData;
    
    aData = Tegaki.activeLayer.imageData.data;
    bData = Tegaki.blendBuffer.data;
    
    canvasWidth = Tegaki.baseWidth;
    
    for (xx = 0; xx < w; ++xx) {
      ix = x + xx;
      
      for (yy = 0; yy < h; ++yy) {
        iy = y + yy;
        
        px = (iy * canvasWidth + ix) * 4;
        
        bData[px] = aData[px];
        bData[px + 1] = aData[px + 1];
        bData[px + 2] = aData[px + 2];
        bData[px + 3] = aData[px + 3];
      }
    }
  }
  
  brushFn(x, y, offsetX, offsetY) {
    var i, j, size, aData, bData, limX, limY,
      kernel, alpha, alpha0, ix, iy, canvasWidth, canvasHeight,
      sx, sy, r, g, b, a, kx, ky, px, pa, acc, aa;
    
    alpha0 = this.brushAlpha;
    alpha = alpha0 * alpha0 * alpha0;
    
    if (alpha <= 0.0) {
      return;
    }
    
    size = this.brushSize;
    
    kernel = this.kernel;
    
    aData = Tegaki.activeLayer.imageData.data;
    bData = Tegaki.blendBuffer.data;
    
    canvasWidth = Tegaki.baseWidth;
    canvasHeight = Tegaki.baseHeight;
    
    limX = canvasWidth - 1;
    limY = canvasHeight - 1;
    
    for (sx = 0; sx < size; ++sx) {
      ix = x + sx + offsetX;
      
      if (ix < 0 || ix >= canvasWidth) {
        continue;
      }
      
      for (sy = 0; sy < size; ++sy) {
        iy = y + sy + offsetY;
        
        if (iy < 0 || iy >= canvasHeight) {
          continue;
        }
        
        i = (sy * size + sx) * 4;
        
        px = (iy * canvasWidth + ix) * 4;
        
        if (kernel[i + 3] === 0 || ix <= 0 || iy <= 0 || ix >= limX || iy >= limY) {
          continue;
        }
        
        r = g = b = a = acc = 0;
        
        for (kx = -1; kx < 2; ++kx) {
          for (ky = -1; ky < 2; ++ky) {
            j = ((iy - ky) * canvasWidth + (ix - kx)) * 4;
            
            pa = aData[j + 3];
            
            if (kx === 0 && ky === 0) {
              aa = pa * alpha0;
              acc += alpha0;
            }
            else {
              aa = pa * alpha;
              acc += alpha;
            }
            
            r = r + aData[j] * aa; ++j;
            g = g + aData[j] * aa; ++j;
            b = b + aData[j] * aa;
            a = a + aa;
          }
        }
        
        a = a / acc;
        
        if (a <= 0.0) {
          continue;
        }
        
        bData[px] = Math.round((r / acc) / a);
        bData[px + 1] = Math.round((g / acc) / a);
        bData[px + 2] = Math.round((b / acc) / a);
        bData[px + 3] = Math.round(a);
      }
    }
  }
}

TegakiBlur.prototype.generateShape = TegakiPencil.prototype.generateShape;
