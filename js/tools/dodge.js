var TegakiDodge;

TegakiDodge = {
  name: 'dodge',
  
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
  
  brushFn: function(x, y) {
    var i, a, aa, ctx, dest, data, len, kernel;
    
    x = 0 | x;
    y = 0 | y;
    
    ctx = Tegaki.activeCtx;
    dest = ctx.getImageData(x, y, this.brushSize, this.brushSize);
    data = dest.data;
    kernel = this.kernel;
    len = kernel.length;
    
    i = 0;
    while (i < len) {
      aa = kernel[i + 3] * 0.3;
      a = 1 + kernel[i + 3] / 255;
      data[i] = data[i] * a + aa; ++i;
      data[i] = data[i] * a + aa; ++i;
      data[i] = data[i] * a + aa; ++i;
      ++i;
    }
    
    ctx.putImageData(dest, x, y);
  },
  
  draw: null,
  
  generateBrush: null,
  
  setSize: null,
  
  setAlpha: null,
  
  setColor: null,
  
  set: null,
};
