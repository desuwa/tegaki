class TegakiBrush extends TegakiTool {
  constructor() {
    super();
    
    this.useActiveLayer = true;
    this.useGhostLayer = false;
  }
  
  generateShape(size) {}
  
  brushFn(x, y, offsetX, offsetY) {
    var i, data, kernel, width, xx, yy, px, brushSize,
      pr, pg, pb,
      kr, kg, kb,
      r, g, b,
      pa, ka, a;
    
    x = 0 | x;
    y = 0 | y;
    
    brushSize = this.brushSize;
    
    kernel = this.kernel;
    
    data = this.activeImgData.data;
    width = this.activeImgData.width;
    
    for (yy = 0; yy < brushSize; ++yy) {
      for (xx = 0; xx < brushSize; ++xx) {
        i = (yy * brushSize + xx) * 4;
        px = ((y + yy) * width + (x + xx)) * 4;
        
        ka = (kernel[i + 3] / 255) * this.brushAlpha;
        pa = data[px + 3] / 255;
        a = (ka + pa - (ka * pa));
        
        kr = this.rgb[0];
        kg = this.rgb[1];
        kb = this.rgb[2];
        
        pr = data[px] * pa;
        pg = data[px + 1] * pa;
        pb = data[px + 2] * pa;
        
        r = ((kr * ka) + pr - pr * ka) / a;
        g = ((kg * ka) + pg - pg * ka) / a;
        b = ((kb * ka) + pb - pb * ka) / a;
        
        r = (kr > pr) ? Math.ceil(r) : Math.floor(r);
        g = (kg > pg) ? Math.ceil(g) : Math.floor(g);
        b = (kb > pb) ? Math.ceil(b) : Math.floor(b);
        
        data[px] = r;
        data[px + 1] = g;
        data[px + 2] = b;
        data[px + 3] = Math.ceil(a * 255);
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
    if (this.useGhostLayer) {
      Tegaki.activeCtx.drawImage(Tegaki.ghostCanvas, 0, 0);
      Tegaki.clearCtx(Tegaki.ghostCtx);
      
      this.ghostImgData = null;
    }
    
    if (this.useActiveLayer) {
      this.activeImgData = null;
    }
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
    
    if (this.sizeDynamicsEnabled) {
      shape = this.shapeCache[this.size - 1];
      center = shape.center;
      brushSize = shape.brushSize;
      distBase = Math.sqrt((posX - fromX) * (posX - fromX) + (posY - fromY) * (posY - fromY));
    }
    else {
      center = this.center;
      brushSize = this.brushSize;
    }
    
    sampleX -= center;
    sampleY -= center;
    
    this.readImageData(sampleX, sampleY, dx + brushSize, dy + brushSize);
    
    err = (dx > dy ? dx : -dy) / 2;
    dx = -dx;
    
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
    if (this.useGhostLayer) {
      Tegaki.ghostCtx.putImageData(this.ghostImgData, x, y);
    }
    
    if (this.useActiveLayer) {
      Tegaki.activeCtx.putImageData(this.activeImgData, x, y);
    }
  }
  
  readImageData(x, y, w, h) {
    if (this.useGhostLayer) {
      this.ghostImgData = Tegaki.ghostCtx.getImageData(
        x, y, w, h
      );
    }
    
    if (this.useActiveLayer) {
      this.activeImgData = Tegaki.activeCtx.getImageData(
        x, y, w, h
      );
    }
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
}
