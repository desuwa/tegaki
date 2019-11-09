class TegakiEraser extends TegakiBrush {
  constructor() {
    super();
    
    this.id = 8;
    
    this.name = 'eraser';
    
    this.keybind = 'e';
    
    this.step = 0.1;
    
    this.size = 8;
    this.alpha = 1.0;
    
    this.useFlow = false;
    
    this.useSizeDynamics = true;
    this.useAlphaDynamics = true;
    this.usePreserveAlpha = false;
    
    this.tipId = 0;
    this.tipList = [ 'pencil', 'pen', 'airbrush' ];
  }
  
  brushFn(x, y, offsetX, offsetY) {
    var aData, bData, gData, kernel, canvasWidth, canvasHeight,
      ka, ba, px, xx, yy, ix, iy,
      brushSize, brushAlpha;
    
    brushAlpha = this.brushAlpha;
    brushSize = this.brushSize;
    
    kernel = this.kernel;
    
    aData = Tegaki.activeLayer.imageData.data;
    gData = Tegaki.ghostBuffer.data;
    bData = Tegaki.blendBuffer.data;
    
    canvasWidth = Tegaki.baseWidth;
    canvasHeight = Tegaki.baseHeight;
    
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
        
        px = (iy * canvasWidth + ix) * 4 + 3;
        
        if (gData[px] === 0) {
          gData[px] = aData[px];
        }
        
        ba = bData[px] / 255;
        ba = ba + ka * (brushAlpha - ba);
        
        bData[px] = Math.floor(ba * 255);
        aData[px] = Math.floor(gData[px] * (1 - ba));
      }
    }
  }
  
  generateShape(size) {
    if (this.tipId === 0) {
      return this.generateShapePencil(size);
    }
    else if (this.tipId === 1) {
      return this.generateShapePen(size);
    }
    else {
      return this.generateShapeAirbrush(size);
    }
  }
}

TegakiEraser.prototype.generateShapePencil = TegakiPencil.prototype.generateShape;
TegakiEraser.prototype.generateShapePen = TegakiPen.prototype.generateShape;
TegakiEraser.prototype.generateShapeAirbrush = TegakiAirbrush.prototype.generateShape;
