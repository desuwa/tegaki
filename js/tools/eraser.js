class TegakiEraser extends TegakiBrush {
  constructor() {
    super();
    
    this.name = 'eraser';
    
    this.keybind = 'e';
    
    this.step = 0.1;
    
    this.size = 8;
    this.alpha = 1.0;
    
    this.useSizeDynamics = true;
    this.useAlphaDynamics = true;
    this.usePreserveAlpha = false;
    
    this.tip = 'pencil';
    this.tipList = [ 'pencil', 'pen', 'airbrush' ];
  }
  
  brushFn(x, y, offsetX, offsetY) {
    var aData, bData, kernel, aWidth, canvasWidth, ka, ba, px, bx, xx, yy,
      brushSize, brushAlpha;
    
    x = 0 | x;
    y = 0 | y;
    
    brushAlpha = this.brushAlpha;
    brushSize = this.brushSize;
    
    kernel = this.kernel;
    
    aData = this.activeImgData.data;
    aWidth = this.activeImgData.width;
    
    bData = Tegaki.blendBuffer;
    canvasWidth = Tegaki.baseWidth;
    
    for (yy = 0; yy < brushSize; ++yy) {
      for (xx = 0; xx < brushSize; ++xx) {
        ka = kernel[(yy * brushSize + xx) * 4 + 3] / 255;
        
        px = ((y + yy) * aWidth + (x + xx)) * 4 + 3;
        
        if (ka > 0 && aData[px] > 0) {
          bx = ((y + yy + offsetY) * canvasWidth + (x + xx + offsetX)) * 2;
          
          ba = bData[bx + 1] / 255;
          ba = Math.ceil((ba + ka * brushAlpha - ba * ka) * 255);
          
          if (bData[bx] === 0) {
            bData[bx] = aData[px];
          }
          
          if (ba > bData[bx + 1]) {
            bData[bx + 1] = ba;
            aData[px] = bData[bx] - ba;
          }
        }
      }
    }
  }
  
  generateShape(size) {
    if (this.tip === 'pencil') {
      return this.generateShapePencil(size);
    }
    else if (this.tip === 'pen') {
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
