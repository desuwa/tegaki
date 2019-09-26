var TegakiBrush;

TegakiBrush = {
  name: 'brush',
  
  brushFn: function(x, y, imgData) {
    var i, data, kernel, w, xx, yy, px, brushSize;
    
    x = 0 | x;
    y = 0 | y;
    
    brushSize = this.brushSize;
    
    kernel = this.kernel;
    
    data = imgData.data;
    w = imgData.width;
    
    for (yy = 0; yy < brushSize; ++yy) {
      for (xx = 0; xx < brushSize; ++xx) {
        i = (yy * brushSize + xx) * 4;
        px = ((y + yy) * w + (x + xx)) * 4;
        
        data[px] = this.rgb[0]; ++px;
        data[px] = this.rgb[1]; ++px;
        data[px] = this.rgb[2]; ++px;
        data[px] += kernel[i + 3] * (1.0 - data[px] / 255); ++i;
      }
    }
  },
  
  generateBrushCache: function(force) {
    var i, tmp;
    
    if (force || !this.pressureCache[0]) {
      this.pressureCache = [];
      i = 0;
    }
    else {
      i = this.pressureCache.length;
    }
    
    tmp = this.size;
    
    for (; i < tmp; ++i) {
      this.size = i + 1;
      
      this.generateBrush();
      
      this.pressureCache[i] = {
        kernel: this.kernel,
        brushSize: this.brushSize,
        center: this.center,
        stepSize: this.stepSize
      };
    }
    
    this.size = tmp;
  },
  
  updateDynamics: function(t) {
    var pressure, brush;
    
    pressure = TegakiPressure.lerp(t);
    
    brush = this.pressureCache[Math.ceil(pressure * this.size) - 1];
    
    this.center = brush.center;
    
    this.kernel = brush.kernel;
    
    this.stepSize = brush.stepSize;
    
    this.brushSize = brush.brushSize;
  },
  
  commit: function() {
    Tegaki.activeCtx.drawImage(Tegaki.ghostCanvas, 0, 0);
    Tegaki.clearCtx(Tegaki.ghostCtx);
  },
  
  draw: function(posX, posY, pt) {
    var mx, my, fromX, fromY, offsetX, offsetY, dx, dy, err, derr, stepAcc,
      distBase, distLeft, imgData, ctx, brush, center, brushSize;
    
    ctx = this.useGhostLayer ? Tegaki.ghostCtx : Tegaki.activeCtx;
    
    if (pt === true) {
      this.stepAcc = 0;
      this.posX = posX; 
      this.posY = posY;
      
      if (this.sizePressureCtrl) {
        this.updateDynamics(1.0);
      }
      
      imgData = ctx.getImageData(
        posX - this.center,
        posY - this.center,
        this.brushSize, this.brushSize
      );
      
      this.brushFn(0, 0, imgData, posX - this.center, posY - this.center);
      
      ctx.putImageData(imgData, posX - this.center, posY - this.center);
      
      return;
    }
    
    stepAcc = this.stepAcc;
    
    fromX = this.posX;
    fromY = this.posY;
    
    if (fromX < posX) { dx = posX - fromX; offsetX = fromX; mx = 1; }
    else { dx = fromX - posX; offsetX = posX; mx = -1; }
    
    if (fromY < posY) { dy = posY - fromY; offsetY = fromY; my = 1; }
    else { dy = fromY - posY; offsetY = posY; my = -1; }
    
    
    if (this.sizePressureCtrl) {
      brush = this.pressureCache[this.size - 1];
      center = brush.center;
      brushSize = brush.brushSize;
      distBase = Math.sqrt((posX - fromX) * (posX - fromX) + (posY - fromY) * (posY - fromY));
    }
    else {
      center = this.center;
      brushSize = this.brushSize;
    }
    
    offsetX -= center;
    offsetY -= center;
    
    imgData = ctx.getImageData(offsetX, offsetY, dx + brushSize, dy + brushSize);
    
    err = (dx > dy ? dx : -dy) / 2;
    dx = -dx;
    
    while (true) {
      ++stepAcc;
      
      if (stepAcc > this.stepSize) {
        if (this.sizePressureCtrl) {
          distLeft = Math.sqrt((posX - fromX) * (posX - fromX) + (posY - fromY) * (posY - fromY));
          this.updateDynamics(1.0 - (distLeft / distBase));
          this.brushFn(fromX - this.center - offsetX, fromY - this.center - offsetY, imgData, offsetX, offsetY);
        }
        else {
          this.brushFn(fromX - this.center - offsetX, fromY - this.center - offsetY, imgData, offsetX, offsetY);
        }
        
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
    
    ctx.putImageData(imgData, offsetX, offsetY);
  },
  
  generateBrush: function() {
    var i, size, r, brush, ctx, dest, data, len, sqd, sqlen, hs, col, row,
      ecol, erow, a;
    
    size = this.size * 2;
    r = size / 2;
    
    brush = $T.el('canvas');
    brush.width = brush.height = size;
    ctx = brush.getContext('2d');
    dest = ctx.getImageData(0, 0, size, size);
    data = dest.data;
    len = size * size * 4;
    sqlen = Math.sqrt(r * r);
    hs = Math.round(r);
    col = row = -hs;
    
    i = 0;
    while (i < len) {
      if (col >= hs) {
        col = -hs;
        ++row;
        continue;
      }
      
      ecol = col;
      erow = row;
      
      if (ecol < 0) { ecol = -ecol; }
      if (erow < 0) { erow = -erow; }
      
      sqd = Math.sqrt(ecol * ecol + erow * erow);
      
      if (sqd > sqlen) {
        a = 0;
      }
      else {
        a = sqd / sqlen;
        a = (Math.exp(1 - 1 / a) / a);
        a = 255 - ((0 | (a * 100 + 0.5)) / 100) * 255;
      }
      
      if (this.alphaDamp) {
        a *= this.alpha * this.alphaDamp;
      }
      else {
        a *= this.alpha;
      }
      
      data[i + 3] = a;
      
      i += 4;
      
      ++col;
    }
    
    ctx.putImageData(dest, 0, 0);
    
    this.center = r;
    this.stepSize = 0 | Math.min(Math.floor(size * this.step), 8);
    this.brushSize = size;
    this.brush = brush;
    this.kernel = data;
  },
  
  setSize: function(size, noBrush) {
    this.size = size;
    
    if (!noBrush) {
      if (this.sizePressureCtrl === true) {
        this.generateBrushCache();
      }
      else {
        this.generateBrush();
      }
    }
  },
  
  setAlpha: function(alpha, noBrush) {
    this.alpha = alpha;
    if (!noBrush) { this.generateBrush(); }
  },
  
  setColor: function(color, noBrush) {
    this.rgb = $T.hexToRgb(color);
    if (!noBrush) this.generateBrush();
  },
  
  setSizePressureCtrl: function(flag) {
    if (this.sizePressureCtrl === undefined) {
      return;
    }
    
    if (this.sizePressureCtrl !== flag) {
      this.pressureCache = [];
    }
    else {
      return;
    }
    
    if (flag) {
      this.generateBrushCache();
    }
    else {
      this.generateBrush();
    }
    
    this.sizePressureCtrl = flag;
  },
  
  set: function() {
    this.setAlpha(this.alpha, true);
    this.setSize(this.size, true);
    this.setColor(Tegaki.toolColor, true);
    
    if (this.sizePressureCtrl === true) {
      this.generateBrushCache();
    }
    else {
      this.generateBrush();
    }
    
    Tegaki.onToolChanged(this);
  }
};
