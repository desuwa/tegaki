class TegakiPen extends TegakiBrush {
  constructor() {
    super();
    
    this.name = 'pen';
    
    this.keybind = 'p';
    
    this.step = 0.01;
    
    this.size = 8;
    this.alpha = 1.0;
    
    this.useSizeDynamics = true;
    this.useAlphaDynamics = true;
    this.usePreserveAlpha = true;
  }
  
  generateShape(size) {
    var r, brush, ctx, brushSize, offset;
    
    if (size % 2) {
      brushSize = size + 1;
      offset = 1;
    }
    else {
      brushSize = size;
      offset = 0;
    }
    
    r = size / 2;
    
    brush = $T.el('canvas');
    brush.width = brushSize;
    brush.height = brushSize;
    
    ctx = brush.getContext('2d');
    
    ctx.beginPath();
    ctx.arc(r + offset, r + offset, r, 0, Tegaki.TWOPI, false);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.closePath();
    
    return {
      center: Math.ceil(r),
      stepSize: Math.floor(size * this.step),
      brushSize: brushSize,
      kernel: ctx.getImageData(0, 0, brushSize, brushSize).data,
    };
  }
}
