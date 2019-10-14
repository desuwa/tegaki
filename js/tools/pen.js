class TegakiPen extends TegakiBrush {
  constructor() {
    super();
    
    this.id = 2;
    
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
    var r, brush, ctx, brushSize, offset, data, center;
    
    if (size % 2) {
      brushSize = size + 1;
      offset = 1;
    }
    else {
      brushSize = size;
      offset = 0;
    }
    
    brush = $T.el('canvas');
    brush.width = brushSize;
    brush.height = brushSize;
    
    ctx = brush.getContext('2d');
    
    if (size > 1) {
      r = size / 2;
      
      ctx.beginPath();
      ctx.arc(r + offset, r + offset, r, 0, Tegaki.TWOPI, false);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.closePath();
      
      center = Math.ceil(r);
      data = ctx.getImageData(0, 0, brushSize, brushSize).data;
    }
    else {
      center = 0;
      data = ctx.createImageData(1, 1);
      data[3] = 255;
    }
    
    return {
      center: center,
      stepSize: Math.floor(size * this.step),
      brushSize: brushSize,
      kernel: data,
    };
  }
}
