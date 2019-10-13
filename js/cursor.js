var TegakiCursor = {
  size: 0,
  radius: 0,
  
  buffer: null,
  
  tmpCtx: null,
  
  cursorCtx: null,
  
  flatCtxAbove: null,
  flatCtxBelow: null,
  
  cached: false,
  
  init: function(w, h) {
    var el;
    
    this.tmpCtx = $T.el('canvas').getContext('2d');
    
    el = $T.el('canvas');
    el.id = 'tegaki-cursor-layer';
    el.width = w;
    el.height = h;
    Tegaki.layersCnt.appendChild(el);
    
    this.cursorCtx = el.getContext('2d');
    
    el = $T.el('canvas');
    el.width = w;
    el.height = h;
    this.flatCtxAbove = el.getContext('2d');
    
    el = $T.el('canvas');
    el.width = w;
    el.height = h;
    this.flatCtxBelow = el.getContext('2d');
  },
  
  updateCanvasSize: function(w, h) {
    this.cursorCtx.canvas.width = w;
    this.cursorCtx.canvas.height = h;
    
    this.flatCtxAbove.canvas.width = w;
    this.flatCtxAbove.canvas.height = h;
    
    this.flatCtxBelow.canvas.width = w;
    this.flatCtxBelow.canvas.height = h;
  },
  
  render: function(x, y) {
    var i, len, layer, buf, size, srcImg, srcData, destImg, destData;
    
    if (!this.cached) {
      this.buildCache();
    }
    
    size = this.size;
    x = x - this.radius;
    y = y - this.radius;
    
    $T.clearCtx(this.cursorCtx);
    $T.clearCtx(this.tmpCtx);
    
    for (i = 0, len = Tegaki.layers.length; i < len; ++i) {
      layer = Tegaki.layers[i];
      
      if (layer.id === Tegaki.activeLayerId) {
        this.tmpCtx.drawImage(this.flatCtxBelow.canvas, x, y, size, size, 0, 0, size, size);
        
        this.tmpCtx.drawImage(Tegaki.activeCtx.canvas, x, y, size, size, 0, 0, size, size);
        
        if (i < Tegaki.layers.length - 1) {
          this.tmpCtx.drawImage(this.flatCtxAbove.canvas, x, y, size, size, 0, 0, size, size);
        }
        
        break;
      }
    }
    
    buf = this.buffer;
    
    srcImg = this.tmpCtx.getImageData(0, 0, size, size);
    srcData = new Uint32Array(srcImg.data.buffer);
    
    destImg = this.cursorCtx.getImageData(x, y, size, size);
    destData = new Uint32Array(destImg.data.buffer);
    
    $T.clearCtx(this.cursorCtx);
    
    for (i = 0, len = buf.length; i < len; ++i) {
      if (buf[i] === 0) {
        continue;
      }
      
      destData[i] = srcData[i] ^ 0x00FFFF7F;
    }
    
    this.cursorCtx.putImageData(destImg, x, y);
  },
  
  buildCache: function() {
    var i, layer, ctx, len;
    
    ctx = this.flatCtxBelow;
    $T.clearCtx(ctx);
    
    ctx.drawImage(Tegaki.canvas, 0, 0);
    
    for (i = 0, len = Tegaki.layers.length; i < len; ++i) {
      layer = Tegaki.layers[i];
      
      if (layer.canvas.classList.contains('tegaki-hidden')) {
        continue;
      }
      
      if (layer.id === Tegaki.activeLayerId) {
        ctx = this.flatCtxAbove;
        $T.clearCtx(ctx);
        continue;
      }
      
      ctx.drawImage(layer.canvas, 0, 0);
    }
    
    this.cached = true;
  },
  
  invalidateCache() {
    this.cached = false;
  },
  
  destroy() {
    this.size = 0;
    this.radius = 0;
    this.buffer = null;
    this.tmpCtx = null;
    this.cursorCtx = null;
    this.flatCtxAbove = null;
    this.flatCtxBelow = null;
  },
  
  generate: function(size) {
    var e, x, y, data, bufSize, c, r, rr;
    
    r = 0 | ((size) / 2);
    
    rr = 0 | ((size + 1) % 2);
    
    bufSize = size * size + (-(size * size) & 3);
    
    data = new Uint8Array(bufSize);
    
    x = r;
    y = 0 | 0;
    e = 1 - r;
    c = r;
    
    while (x >= y) {
      data[c + x - rr + (c + y - rr) * size] = 255;
      data[c + y - rr + (c + x - rr) * size] = 255;
      
      data[c - y + (c + x - rr) * size] = 255;
      data[c - x + (c + y - rr) * size] = 255;
      
      data[c - y + (c - x) * size] = 255;
      data[c - x + (c - y) * size] = 255;
      
      data[c + y - rr + (c - x) * size] = 255;
      data[c + x - rr + (c - y) * size] = 255;
      
      ++y;
      
      if (e <= 0) {
        e += 2 * y + 1;
      }
      else {
        x--;
        e += 2 * (y - x) + 1;
      }
    }
    
    this.tmpCtx.canvas.width = size;
    this.tmpCtx.canvas.height = size;
    
    this.size = size;
    this.radius = r;
    this.buffer = data;
  }
};
