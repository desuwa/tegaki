var TegakiBrush;

TegakiBrush = {
  name: 'brush',
  
  brushFn: function(x, y) {
    var i, ctx, dest, data, len, kernel;
    
    x = 0 | x;
    y = 0 | y;
    
    ctx = Tegaki.ghostCtx;
    dest = ctx.getImageData(x, y, this.brushSize, this.brushSize);
    data = dest.data;
    kernel = this.kernel;
    len = kernel.length;
    
    i = 0;
    while (i < len) {
      data[i] = this.rgb[0]; ++i;
      data[i] = this.rgb[1]; ++i;
      data[i] = this.rgb[2]; ++i;
      data[i] += kernel[i] * (1.0 - data[i] / 255); ++i;
    }
    
    ctx.putImageData(dest, x, y);
  },
  
  generateBrushCache: function() {
    var i, tmp;
    
    tmp = this.size;
    
    for (i = this.pressureCache.length; i < tmp; ++i) {
      this.size = i + 1;
      this.generateBrush();
      this.pressureCache.push(this.kernel);
    }
    
    this.size = tmp;
  },
  
  updateDynamics: function(t) {
    var pressure, size, d;
    
    pressure = TegakiPressure.lerp(t);
    
    if (this.sizePressureCtrl === true) {
      size = 0 | Math.round(pressure * this.size);
      
      if (size === 0) {
        return false;
      }
      
      d = 0 | Math.round((size - this.size) / 2);
      
      this.center = 0 | (size / 2);
      
      this.kernel = this.pressureCache[size - 1];
      
      this.stepSize = 0 | Math.min(Math.floor(size * this.step), 8);
      
      this.brushSize = size;
    }
    
    return true;
  },
  
  commit: function() {
    Tegaki.activeCtx.drawImage(Tegaki.ghostCanvas, 0, 0);
    Tegaki.clearCtx(Tegaki.ghostCtx);
  },
  
  draw: function(posX, posY, pt) {
    var mx, my, fromX, fromY, dx, dy, err, derr, stepAcc,
      distBase, distLeft;
    
    stepAcc = this.stepAcc;
    
    if (pt === true) {
      this.stepAcc = 0;
      this.posX = posX; 
      this.posY = posY;
      
      if (!this.sizePressureCtrl || this.updateDynamics(1.0)) {
        this.brushFn(posX - this.center, posY - this.center);
      }
      return;
    }
    
    fromX = this.posX;
    fromY = this.posY;
    
    if (fromX < posX) { dx = posX - fromX; mx = 1; }
    else { dx = fromX - posX; mx = -1; }
    if (fromY < posY) { dy = posY - fromY; my = 1; }
    else { dy = fromY - posY; my = -1; }
    
    err = (dx > dy ? dx : -dy) / 2;
    
    dx = -dx;
    
    if (this.sizePressureCtrl) {
      distBase = (posX - fromX) * (posX - fromX) + (posY - fromY) * (posY - fromY);
    }
    
    while (true) {
      ++stepAcc;
      
      if (stepAcc > this.stepSize) {
        if (this.sizePressureCtrl) {
          distLeft = (posX - fromX) * (posX - fromX) + (posY - fromY) * (posY - fromY);
          if (this.updateDynamics(1.0 - (distLeft / distBase))) {
            this.brushFn(fromX - this.center, fromY - this.center);
          }
        }
        else {
          this.brushFn(fromX - this.center, fromY - this.center);
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
    
    this.stepSize = Math.min(Math.floor(this.size * this.step), 8);
  },
  
  setAlpha: function(alpha, noBrush) {
    this.alpha = alpha;
    if (!noBrush) this.generateBrush();
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
