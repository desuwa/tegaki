class TegakiBrush extends TegakiTool {
  constructor() {
    super();
    
    this.activeImgData = null;
  }
  
  generateShape(size) {}
  
  brushFn(x, y, offsetX, offsetY) {
    var i, aData, gData, bData, aWidth, canvasWidth, canvasHeight,
      kernel, xx, yy, ix, iy,
      pa, ka, a, sa,
      kr, kg, kb,
      r, g, b,
      pr, pg, pb,
      ax, cx, ba,
      brushSize, brushAlpha, preserveAlpha;
    
    x = 0 | x;
    y = 0 | y;
    
    offsetX = 0 | offsetX;
    offsetY = 0 | offsetY;
    
    preserveAlpha = this.preserveAlphaEnabled;
    
    kernel = this.kernel;
    
    brushAlpha = this.brushAlpha;
    brushSize = this.brushSize;
    
    aData = this.activeImgData.data;
    gData = Tegaki.ghostBuffer;
    bData = Tegaki.blendBuffer;
    
    aWidth = this.activeImgData.width;
    
    canvasWidth = Tegaki.baseWidth;
    canvasHeight = Tegaki.baseHeight;
    
    kr = this.rgb[0];
    kg = this.rgb[1];
    kb = this.rgb[2];
    
    for (yy = 0; yy < brushSize; ++yy) {
      iy = y + yy + offsetY;
      
      if (iy < 0 || iy >= canvasHeight) {
        continue;
      }
      
      for (xx = 0; xx < brushSize; ++xx) {
        ix = x + xx + offsetX;
        
        if (ix < 0 || ix >= canvasWidth) {
          continue;
        }
        
        i = (yy * brushSize + xx) * 4;
        
        ka = kernel[i + 3] / 255;
        
        if (ka <= 0.0) {
          continue;
        }
        
        ax = ((y + yy) * aWidth + (x + xx)) * 4;
        cx = (iy * canvasWidth + ix) * 4;
        
        sa = bData[cx + 3] / 255;
        sa = sa + ka * brushAlpha - sa * ka;
        
        ba = Math.ceil(sa * 255);
        
        if (ba > bData[cx + 3]) {
          if (bData[cx] === 0) {
            gData[cx] = aData[ax];
            gData[cx + 1] = aData[ax + 1];
            gData[cx + 2] = aData[ax + 2];
            gData[cx + 3] = aData[ax + 3];
          }
          
          bData[cx] = 1;
          bData[cx + 3] = ba;
          
          pr = gData[cx];
          pg = gData[cx + 1];
          pb = gData[cx + 2];
          pa = gData[cx + 3] / 255;
          
          a = pa + sa - pa * sa;
          
          r = ((kr * sa) + (pr * pa) * (1 - sa)) / a;
          g = ((kg * sa) + (pg * pa) * (1 - sa)) / a;
          b = ((kb * sa) + (pb * pa) * (1 - sa)) / a;
          
          aData[ax] = (kr > pr) ? Math.ceil(r) : Math.floor(r);
          aData[ax + 1] = (kg > pg) ? Math.ceil(g) : Math.floor(g);
          aData[ax + 2] = (kb > pb) ? Math.ceil(b) : Math.floor(b);
          
          if (!preserveAlpha) {
            aData[ax + 3] = Math.ceil(a * 255);
          }
        }
      }
    }
  }
  
  generateShapeCache(force) {
    var i, shape;
    
    if (!this.shapeCache) {
      this.shapeCache = new Array(Tegaki.maxSize);
    }
    
    if (this.shapeCache[0] && !force) {
      return;
    }
    
    for (i = 0; i < Tegaki.maxSize; ++i) {
      shape = this.generateShape(i + 1);
      this.shapeCache[i] = shape;
      this.setShape(shape);
    }
  }
  
  updateDynamics(t) {
    var pressure, shape, val;
    
    pressure = TegakiPressure.lerp(t);
    
    if (this.sizeDynamicsEnabled) {
      val = Math.ceil(pressure * this.size);
      
      if (val === 0) {
        return false;
      }
      
      shape = this.shapeCache[val - 1];
      
      this.setShape(shape);
    }
    
    if (this.alphaDynamicsEnabled) {
      val = this.alpha * pressure;
      
      if (val <= 0) {
        return false;
      }
      
      this.brushAlpha = val;
    }
    
    return true;
  }
  
  start(posX, posY) {
    var sampleX, sampleY;
    
    this.stepAcc = 0;
    this.posX = posX; 
    this.posY = posY;
    
    if (this.sizeDynamicsEnabled || this.alphaDynamicsEnabled) {
      if (!this.updateDynamics(1.0)) {
        return;
      }
    }
    
    sampleX = posX - this.center;
    sampleY = posY - this.center;
    
    this.readImageData(sampleX, sampleY, this.brushSize, this.brushSize);
    
    this.brushFn(0, 0, sampleX, sampleY);
    
    this.writeImageData(sampleX, sampleY);
  }
  
  commit() {
    this.activeImgData = null;
    Tegaki.clearBuffers();
  }
  
  draw(posX, posY) {
    var mx, my, fromX, fromY, sampleX, sampleY, dx, dy, err, derr, stepAcc,
      distBase, shape, center, brushSize, t, tainted;
    
    stepAcc = this.stepAcc;
    
    fromX = this.posX;
    fromY = this.posY;
    
    if (fromX < posX) { dx = posX - fromX; sampleX = fromX; mx = 1; }
    else { dx = fromX - posX; sampleX = posX; mx = -1; }
    
    if (fromY < posY) { dy = posY - fromY; sampleY = fromY; my = 1; }
    else { dy = fromY - posY; sampleY = posY; my = -1; }
    
    if (this.sizeDynamicsEnabled || this.alphaDynamicsEnabled) {
      distBase = Math.sqrt((posX - fromX) * (posX - fromX) + (posY - fromY) * (posY - fromY));
    }
    
    if (this.sizeDynamicsEnabled) {
      shape = this.shapeCache[this.size - 1];
      center = shape.center;
      brushSize = shape.brushSize;
    }
    else {
      center = this.center;
      brushSize = this.brushSize;
    }
    
    sampleX -= center;
    sampleY -= center;
    
    this.readImageData(sampleX, sampleY, dx + brushSize, dy + brushSize);
    
    err = (dx > dy ? dx : (dy !== 0 ? -dy : 0)) / 2;
    
    if (dx !== 0) {
      dx = -dx;
    }
    
    tainted = false;
    
    while (true) {
      ++stepAcc;
      
      if (stepAcc > this.stepSize) {
        if (this.sizeDynamicsEnabled || this.alphaDynamicsEnabled) {
          if (distBase > 0) {
            t = 1.0 - (Math.sqrt((posX - fromX) * (posX - fromX) + (posY - fromY) * (posY - fromY)) / distBase);
          }
          else {
            t = 0.0;
          }
          
          if (this.updateDynamics(t)) {
            this.brushFn(fromX - this.center - sampleX, fromY - this.center - sampleY, sampleX, sampleY);
            tainted = true;
          }
        }
        else {
          this.brushFn(fromX - this.center - sampleX, fromY - this.center - sampleY, sampleX, sampleY);
          tainted = true;
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
    
    if (tainted) {
      this.writeImageData(sampleX, sampleY);
    }
  }
  
  writeImageData(x, y) {
    Tegaki.activeCtx.putImageData(this.activeImgData, x, y);
  }
  
  readImageData(x, y, w, h) {
    this.activeImgData = Tegaki.activeCtx.getImageData(x, y, w, h);
  }
  
  setShape(shape) {
    this.center = shape.center;
    this.stepSize = shape.stepSize;
    this.brushSize = shape.brushSize;
    this.kernel = shape.kernel;
  }
  
  setSize(size) {
    this.size = size;
    
    if (this.sizeDynamicsEnabled) {
      this.generateShapeCache();
    }
    else {
      this.setShape(this.generateShape(size));
    }
  }
  
  setSizeDynamics(flag) {
    if (!this.useSizeDynamics) {
      return;
    }
    
    if (this.sizeDynamicsEnabled === flag) {
      return;
    }
    
    if (flag) {
      this.generateShapeCache();
    }
    else {
      this.setShape(this.generateShape(this.size));
    }
    
    this.sizeDynamicsEnabled = flag;
  }
  
  setAlphaDynamics(flag) {
    if (!this.useAlphaDynamics) {
      return;
    }
    
    if (!flag) {
      this.setAlpha(this.alpha);
    }
    
    this.alphaDynamicsEnabled = flag;
  }
  
  setTip(tipId) {
    this.tipId = tipId;
    
    if (this.sizeDynamicsEnabled) {
      this.generateShapeCache(true);
    }
    else {
      this.setShape(this.generateShape(this.size));
    }
  }
}
