var TegakiEraser;

TegakiEraser = {
  name: 'eraser',
  
  keybind: 'e',
  
  init: function() {
    this.size = 8;
    this.alpha = 1.0;
    this.step = 0.25;
    this.stepAcc = 0;
    
    this.draw = TegakiBrush.draw;  
    this.generateBrush = TegakiPen.generateBrush;  
    this.setSize = TegakiBrush.setSize;  
    this.setAlpha = TegakiBrush.setAlpha;  
    this.setColor = TegakiBrush.setColor;  
    this.set = TegakiBrush.set;
  },
  
  brushFn: function(x, y, imgData) {
    var data, a, kernel, w, xx, yy, brushSize;
    
    x = 0 | x;
    y = 0 | y;
    
    brushSize = this.brushSize;
    
    kernel = this.kernel;
    
    data = imgData.data;
    w = imgData.width;
    
    a = 0 | (this.alpha * 255);
    
    for (yy = 0; yy < brushSize; ++yy) {
      for (xx = 0; xx < brushSize; ++xx) {
        if (kernel[(yy * brushSize + xx) * 4 + 3] > 0) {
          data[((y + yy) * w + (x + xx)) * 4 + 3] = 0;
        }
      }
    }
  },
  
  draw: null,
  
  generateBrush: null,
  
  setSize: null,
  
  setAlpha: null,
  
  setColor: null,
  
  set: null,
};
