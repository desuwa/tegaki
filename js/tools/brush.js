class TegakiBrush extends TegakiTool {
  constructor() {
    super();
  }
  
  generateShape(size) {}
  
  brushFn(x, y, offsetX, offsetY) {
    var aData, gData, bData, aWidth, canvasWidth, canvasHeight,
      kernel, xx, yy, ix, iy,
      pa, ka, a, sa,
      kr, kg, kb,
      r, g, b,
      pr, pg, pb,
      px, ba,
      brushSize, brushAlpha, brushFlow, preserveAlpha;
    
    preserveAlpha = this.preserveAlphaEnabled;
    
    kernel = this.kernel;
    
    brushAlpha = this.brushAlpha;
    brushFlow = this.brushFlow;
    brushSize = this.brushSize;
    
    aData = Tegaki.activeLayer.imageData.data;
    gData = Tegaki.ghostBuffer.data;
    bData = Tegaki.blendBuffer.data;
    
    canvasWidth = Tegaki.baseWidth;
    canvasHeight = Tegaki.baseHeight;
    
    aWidth = canvasWidth;
    
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
        
        ka = kernel[(yy * brushSize + xx) * 4 + 3] / 255;
        
        if (ka <= 0.0) {
          continue;
        }
        
        px = (iy * canvasWidth + ix) * 4;
        
        sa = bData[px + 3] / 255;
        sa = sa + ka * brushFlow * (brushAlpha - sa);
        
        ba = Math.ceil(sa * 255);
        
        if (ba > bData[px + 3]) {
          if (bData[px] === 0) {
            gData[px] = aData[px];
            gData[px + 1] = aData[px + 1];
            gData[px + 2] = aData[px + 2];
            gData[px + 3] = aData[px + 3];
          }
          
          bData[px] = 1;
          bData[px + 3] = ba;
          
          pr = gData[px];
          pg = gData[px + 1];
          pb = gData[px + 2];
          pa = gData[px + 3] / 255;
          
          a = pa + sa - pa * sa;
          
          r = ((kr * sa) + (pr * pa) * (1 - sa)) / a;
          g = ((kg * sa) + (pg * pa) * (1 - sa)) / a;
          b = ((kb * sa) + (pb * pa) * (1 - sa)) / a;
          
          aData[px] = (kr > pr) ? Math.ceil(r) : Math.floor(r);
          aData[px + 1] = (kg > pg) ? Math.ceil(g) : Math.floor(g);
          aData[px + 2] = (kb > pb) ? Math.ceil(b) : Math.floor(b);
          
          if (!preserveAlpha) {
            aData[px + 3] = Math.ceil(a * 255);
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
    
    if (this.flowDynamicsEnabled) {
      val = this.flow * pressure;
      
      if (val <= 0) {
        return false;
      }
      
      this.brushFlow = this.easeFlow(val);
    }
    
    return true;
  }
  
  start(posX, posY) {
    var sampleX, sampleY;
    
    this.stepAcc = 0;
    this.posX = posX; 
    this.posY = posY;
    
    if (this.enabledDynamics()) {
      if (!this.updateDynamics(1.0)) {
        return;
      }
    }
    
    sampleX = posX - this.center;
    sampleY = posY - this.center;
    
    this.readImageData(sampleX, sampleY, this.brushSize, this.brushSize);
    
    this.brushFn(0, 0, sampleX, sampleY);
    
    this.writeImageData(sampleX, sampleY, this.brushSize, this.brushSize);
  }
  
  commit() {
    Tegaki.clearBuffers();
  }
  
  draw(posX, posY) {
    var mx, my, fromX, fromY, sampleX, sampleY, dx, dy, err, derr, stepAcc,
      lastX, lastY, distBase, shape, center, brushSize, t, tainted, w, h;
    
    stepAcc = this.stepAcc;
    
    fromX = this.posX;
    fromY = this.posY;
    
    if (fromX < posX) { dx = posX - fromX; sampleX = fromX; mx = 1; }
    else { dx = fromX - posX; sampleX = posX; mx = -1; }
    
    if (fromY < posY) { dy = posY - fromY; sampleY = fromY; my = 1; }
    else { dy = fromY - posY; sampleY = posY; my = -1; }
    
    if (this.enabledDynamics()) {
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
    
    w = dx + brushSize;
    h = dy + brushSize;
    
    this.readImageData(sampleX, sampleY, w, h);
    
    err = (dx > dy ? dx : (dy !== 0 ? -dy : 0)) / 2;
    
    if (dx !== 0) {
      dx = -dx;
    }
    
    tainted = false;
    
    lastX = fromX;
    lastY = fromY;
    
    while (true) {
      stepAcc += Math.max(Math.abs(lastX - fromX), Math.abs(lastY - fromY));
      
      lastX = fromX;
      lastY = fromY;
      
      if (stepAcc >= this.stepSize) {
        if (this.enabledDynamics()) {
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
      this.writeImageData(sampleX, sampleY, w, h);
    }
  }
  
  writeImageData(x, y, w, h) {
    Tegaki.activeLayer.ctx.putImageData(Tegaki.activeLayer.imageData, 0, 0, x, y, w, h);
  }
  
  readImageData(x, y, w, h) {}
  
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
