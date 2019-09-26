var TegakiBlur;

TegakiBlur = {
  name: 'blur',
  
  init: function() {
    this.size = 24;
    this.alpha = 0.25;
    this.alphaDamp = 0.05;
    this.step = 0.25;
    this.stepAcc = 0;
    
    this.generateBrush = TegakiBrush.generateBrush;  
    this.setSize = TegakiBrush.setSize;  
    this.setAlpha = TegakiBrush.setAlpha;  
    this.setColor = TegakiBrush.setColor;  
    this.set = TegakiBrush.set;
  },
    
  brushFn: function(x, y, src, imgData) {
    var i, j, size, srcData, destData, limX, limY, kernel,
      sx, sy, r, g, b, a, aa, acc, kx, ky, px, w, h;
    
    x = 0 | x;
    y = 0 | y;
    
    size = this.brushSize;
    srcData = src.data;
    destData = imgData.data;
    kernel = this.kernel;
    
    w = imgData.width;
    h = imgData.height;
    limX = w - 1;
    limY = h - 1;
    
    for (sx = 0; sx < size; ++sx) {
      for (sy = 0; sy < size; ++sy) {
        r = g = b = a = acc = 0;
        i = (sy * size + sx) * 4;
        px = ((sy + y) * w + (sx + x)) * 4;
        
        if (kernel[i + 3] === 0 || sx === 0 || sy === 0 || (sx + x) === limX || (sy + y) === limY) {
          destData[px] = srcData[px]; ++px;
          destData[px] = srcData[px]; ++px;
          destData[px] = srcData[px]; ++px;
          destData[px] = srcData[px];
          continue;
        }
        
        for (kx = -1; kx < 2; ++kx) {
          for (ky = -1; ky < 2; ++ky) {
            j = ((sy + y - ky) * w + (sx + x - kx)) * 4;
            aa = srcData[j + 3];
            acc += aa;
            r += srcData[j] * aa; ++j;
            g += srcData[j] * aa; ++j;
            b += srcData[j] * aa; ++j;
            a += srcData[j];
          }
        }
        
        destData[px] = r / acc; ++px;
        destData[px] = g / acc; ++px;
        destData[px] = b / acc; ++px;
        destData[px] = a / 9;
      }
    }
  },
  
  draw: function(posX, posY, pt) {
    var mx, my, fromX, fromY, sx, sy, dx, dy, err, derr, stepAcc,
      srcImgData, destImgData, center, tainted;
    
    center = this.center;
    
    if (pt === true) {
      this.stepAcc = 0;
      this.posX = posX; 
      this.posY = posY;
      
      srcImgData = Tegaki.activeCtx.getImageData(
        posX - this.center,
        posY - this.center,
        this.brushSize, this.brushSize
      );
      
      destImgData = new ImageData(new Uint8ClampedArray(srcImgData.data), srcImgData.width);
      
      this.brushFn(0, 0, srcImgData, destImgData);
      
      Tegaki.activeCtx.putImageData(destImgData, posX - center, posY - center);
      
      return;
    }
    
    stepAcc = this.stepAcc;
    
    fromX = this.posX;
    fromY = this.posY;
    
    if (fromX < posX) { dx = posX - fromX; sx = fromX - center; mx = 1; }
    else { dx = fromX - posX; sx = posX - center; mx = -1; }
    
    if (fromY < posY) { dy = posY - fromY; sy = fromY - center; my = 1; }
    else { dy = fromY - posY; sy = posY - center; my = -1; }
    
    
    srcImgData = Tegaki.activeCtx.getImageData(sx, sy, dx + this.brushSize, dy + this.brushSize);
    destImgData = new ImageData(new Uint8ClampedArray(srcImgData.data), srcImgData.width);
    
    err = (dx > dy ? dx : -dy) / 2;
    
    dx = -dx;
    
    tainted = false;
    
    while (true) {
      ++stepAcc;
      
      if (stepAcc > this.stepSize) {
        this.brushFn(fromX - center - sx, fromY - center - sy, srcImgData, destImgData);
        tainted = true;
        stepAcc = 0;
      }
      
      if (fromX === posX && fromY === posY) {
        break;
      }
      
      derr = err;
      
      if (derr > dx) { err -= dy; fromX += mx; }
      if (derr < dy) { err -= dx; fromY += my; }
    }
    
    this.stepAcc = stepAcc;
    this.posX = posX; 
    this.posY = posY;
    
    if (tainted) {
      Tegaki.activeCtx.putImageData(destImgData, sx, sy);
    }
  },
  
  generateBrush: null,
  
  setSize: null,
  
  setAlpha: null,
  
  setColor: null,
  
  set: null,
};
