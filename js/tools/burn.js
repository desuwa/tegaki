var TegakiBurn;

TegakiBurn = {
  name: 'burn',
  
  init: function() {
    this.size = 24;
    this.alpha = 0.25;
    this.alphaDamp = 0.05;
    this.step = 0.25;
    this.stepAcc = 0;
    
    this.draw = TegakiBrush.draw;
    this.generateBrush = TegakiBrush.generateBrush;  
    this.setSize = TegakiBrush.setSize;  
    this.setAlpha = TegakiBrush.setAlpha;  
    this.setColor = TegakiBrush.setColor;  
    this.set = TegakiBrush.set;
  },
    
  brushFn: function(x, y, imgData) {
    var data, a, kernel, w, xx, yy, px, brushSize;
    
    x = 0 | x;
    y = 0 | y;
    
    brushSize = this.brushSize;
    
    kernel = this.kernel;
    
    data = imgData.data;
    w = imgData.width;
    
    a = 0 | (this.alpha * 255);
    
    for (yy = 0; yy < brushSize; ++yy) {
      for (xx = 0; xx < brushSize; ++xx) {
        px = ((y + yy) * w + (x + xx)) * 4;
        
        a = 1 - kernel[((yy * brushSize + xx) * 4) + 3] / 255;
        data[px] = data[px] * a; ++px;
        data[px] = data[px] * a; ++px;
        data[px] = data[px] * a; ++px;
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
