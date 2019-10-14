class TegakiBlur extends TegakiBrush {
  constructor() {
    super();
    
    this.id = 7;
    
    this.name = 'blur';
    
    this.size = 32;
    this.alpha = 0.5;
    this.step = 0.25;
    
    this.useAlphaDynamics = true;
    this.usePreserveAlpha = false;
    
    this.activeImgData = null;
    this.tmpImgData = null;
  }
  
  writeImageData(x, y) {
    Tegaki.activeCtx.putImageData(this.tmpImgData, x, y);
  }
  
  readImageData(x, y, w, h) {
    this.activeImgData = Tegaki.activeCtx.getImageData(x, y, w, h);
    
    this.tmpImgData = new ImageData(
      new Uint8ClampedArray(this.activeImgData.data), 
      this.activeImgData.width
    );
  }
  
  commit() {
    this.activeImgData = null;
    this.tmpImgData = null;
  }
  
  brushFn(x, y, offsetX, offsetY) {
    var i, j, size, srcData, destData, limX, limY,
      kernel, alpha, alpha0, canvasLimX, canvasLimY,
      sx, sy, r, g, b, a, kx, ky, px, w, h, pa, acc, aa;
    
    x = 0 | x;
    y = 0 | y;
    
    alpha0 = this.brushAlpha;
    alpha = alpha0 * alpha0 * alpha0;
    
    if (alpha <= 0.0) {
      return;
    }
    
    size = this.brushSize;
    srcData = this.activeImgData.data;
    destData = this.tmpImgData.data;
    kernel = this.kernel;
    
    w = this.tmpImgData.width;
    h = this.tmpImgData.height;
    
    limX = w - 1;
    limY = h - 1;
    
    canvasLimX = Tegaki.baseWidth - 1;
    canvasLimY = Tegaki.baseHeight - 1;
    
    for (sx = 0; sx < size; ++sx) {
      for (sy = 0; sy < size; ++sy) {
        i = (sy * size + sx) * 4;
        px = ((sy + y) * w + (sx + x)) * 4;
        
        if (kernel[i + 3] === 0) {
          continue;
        }
        
        if (sx === 0 || sy === 0 || (sx + x) === limX || (sy + y) === limY) {
          continue;
        }
        
        r = g = b = a = acc = 0;
        
        for (kx = -1; kx < 2; ++kx) {
          for (ky = -1; ky < 2; ++ky) {
            j = ((sy + y - ky) * w + (sx + x - kx)) * 4;
            pa = (srcData[j + 3] / 255);
            
            if (kx === 0 && ky === 0) {
              aa = pa * alpha0;
              acc += alpha0;
            }
            else {
              aa = pa * alpha;
              acc += alpha;
            }
            
            r = r + srcData[j] * aa; ++j;
            g = g + srcData[j] * aa; ++j;
            b = b + srcData[j] * aa;
            a = a + aa;
          }
        }
        
        a = a / acc;
        
        if (a <= 0.0) {
          continue;
        }
        
        destData[px] = Math.round((r / acc) / a);
        destData[px + 1] = Math.round((g / acc) / a);
        destData[px + 2] = Math.round((b / acc) / a);
        destData[px + 3] = Math.round(a * 255);
      }
    }
  }
}

TegakiBlur.prototype.generateShape = TegakiPencil.prototype.generateShape;
