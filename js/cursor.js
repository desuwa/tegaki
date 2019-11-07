var TegakiCursor = {
  size: 0,
  radius: 0,
  
  points: null,
  
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
    var i, size, srcImg, srcData, destImg, destData, activeLayer;
    
    if (!this.cached) {
      this.buildCache();
    }
    
    size = this.size;
    x = x - this.radius;
    y = y - this.radius;
    
    $T.clearCtx(this.cursorCtx);
    $T.clearCtx(this.tmpCtx);
    
    this.tmpCtx.drawImage(this.flatCtxBelow.canvas, x, y, size, size, 0, 0, size, size);
    
    activeLayer = Tegaki.activeLayer;
    
    if (activeLayer.visible) {
      if (activeLayer.alpha < 1.0) {
        this.tmpCtx.globalAlpha = activeLayer.alpha;
        this.tmpCtx.drawImage(Tegaki.activeLayer.canvas, x, y, size, size, 0, 0, size, size);
        this.tmpCtx.globalAlpha = 1.0;
      }
      else {
        this.tmpCtx.drawImage(Tegaki.activeLayer.canvas, x, y, size, size, 0, 0, size, size);
      }
    }
    
    this.tmpCtx.drawImage(this.flatCtxAbove.canvas, x, y, size, size, 0, 0, size, size);
    
    srcImg = this.tmpCtx.getImageData(0, 0, size, size);
    srcData = new Uint32Array(srcImg.data.buffer);
    
    destImg = this.cursorCtx.createImageData(size, size);
    destData = new Uint32Array(destImg.data.buffer);
    
    for (i of this.points) {
      destData[i] = srcData[i] ^ 0x00FFFF7F;
    }
    
    this.cursorCtx.putImageData(destImg, x, y);
  },
  
  buildCache: function() {
    var i, layer, ctx, len, layerId;
    
    ctx = this.flatCtxBelow;
    ctx.globalAlpha = 1.0;
    $T.clearCtx(ctx);
    
    ctx.drawImage(Tegaki.canvas, 0, 0);
    
    layerId = Tegaki.activeLayer.id;
    
    for (i = 0, len = Tegaki.layers.length; i < len; ++i) {
      layer = Tegaki.layers[i];
      
      if (!layer.visible) {
        continue;
      }
      
      if (layer.id === layerId) {
        ctx = this.flatCtxAbove;
        ctx.globalAlpha = 1.0;
        $T.clearCtx(ctx);
        continue;
      }
      
      ctx.globalAlpha = layer.alpha;
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
    this.points = null;
    this.tmpCtx = null;
    this.cursorCtx = null;
    this.flatCtxAbove = null;
    this.flatCtxBelow = null;
  },
  
  generate: function(size) {
    var e, x, y, c, r, rr, points;
    
    r = 0 | ((size) / 2);
    
    rr = 0 | ((size + 1) % 2);
    
    points = [];
    
    x = r;
    y = 0;
    e = 1 - r;
    c = r;
    
    while (x >= y) {
      points.push(c + x - rr + (c + y - rr) * size);
      points.push(c + y - rr + (c + x - rr) * size);
      
      points.push(c - y + (c + x - rr) * size);
      points.push(c - x + (c + y - rr) * size);
      
      points.push(c - y + (c - x) * size);
      points.push(c - x + (c - y) * size);
      
      points.push(c + y - rr + (c - x) * size);
      points.push(c + x - rr + (c - y) * size);
      
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
    this.points = points;
  }
};
