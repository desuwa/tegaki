class TegakiEraser extends TegakiBrush {
  constructor() {
    super();
    
    this.name = 'eraser';
    
    this.keybind = 'e';
    
    this.step = 0.01;
    
    this.size = 8;
    this.alpha = 1.0;
    
    this.useSizeDynamics = false;
    this.useAlphaDynamics = false;
  }
  
  brushFn(x, y) {
    var data, kernel, width, xx, yy, brushSize;
    
    x = 0 | x;
    y = 0 | y;
    
    brushSize = this.brushSize;
    
    kernel = this.kernel;
    
    data = this.activeImgData.data;
    width = this.activeImgData.width;
    
    for (yy = 0; yy < brushSize; ++yy) {
      for (xx = 0; xx < brushSize; ++xx) {
        if (kernel[(yy * brushSize + xx) * 4 + 3] > 0) {
          data[((y + yy) * width + (x + xx)) * 4 + 3] = 0;
        }
      }
    }
  }
}

TegakiEraser.prototype.generateShape = TegakiPencil.prototype.generateShape;
