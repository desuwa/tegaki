var TegakiPen;

TegakiPen = {
  name: 'pen',
  
  keybind: 'p',
  
  sizePressureCtrl: false,
  pressureCache: [],
  
  init: function() {
    this.size = 8;
    this.alpha = 0.5;
    this.step = 0.1;
    this.stepAcc = 0;
    
    this.draw = TegakiBrush.draw;
    this.commit = TegakiBrush.commit;
    this.brushFn = TegakiBrush.brushFn;
    this.setSize = TegakiBrush.setSize;
    this.setAlpha = TegakiBrush.setAlpha;
    this.setColor = TegakiBrush.setColor;
    this.set = TegakiBrush.set;
    this.setSizePressureCtrl = TegakiBrush.setSizePressureCtrl;
    this.updateDynamics = TegakiBrush.updateDynamics;
    this.generateBrushCache  = TegakiBrush.generateBrushCache;
},
  
  generateBrush: function() {
    var size, r, brush, ctx;
    
    size = this.size;
    r = size / 2;
    
    brush = $T.el('canvas');
    brush.width = brush.height = size;
    ctx = brush.getContext('2d');
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Tegaki.TWOPI, false);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.closePath();
    
    this.center = r;
    this.brushSize = size;
    this.brush = brush;
    this.kernel = ctx.getImageData(0, 0, this.brushSize, this.brushSize).data;
  },
  
  draw: null,
  
  commit: null,
  
  brushFn: null,
  
  setSize: null,
  
  setAlpha: null,
  
  setColor: null,
  
  set: null,
};
