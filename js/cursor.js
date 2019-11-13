var TegakiCursor = {
  size: 0,
  radius: 0,
  
  points: null,
  
  cursorCtx: null,
  
  offsetX: 0,
  offsetY: 0,
  
  lastX: 0,
  lastY: 0,
  lastSize: 0,
  
  init: function(w, h) {
    var el;
    
    el = $T.el('canvas');
    el.id = 'tegaki-cursor-layer';
    el.width = Tegaki.canvasCnt.clientWidth;
    el.height = Tegaki.canvasCnt.clientHeight;
    
    Tegaki.canvasCnt.appendChild(el);
    
    this.offsetX = el.offsetLeft;
    this.offsetY = el.offsetTop;
    
    this.cursorCtx = el.getContext('2d');
  },
  
  updateCanvasSize: function() {
    var canvas = this.cursorCtx.canvas;
    
    canvas.width = Tegaki.canvasCnt.clientWidth;
    canvas.height = Tegaki.canvasCnt.clientHeight;
    
    this.offsetX = canvas.offsetLeft;
    this.offsetY = canvas.offsetTop;
  },
  
  render: function(rawX, rawY) {
    var x, y, i, destImg, destData;
    
    x = rawX - this.offsetX - this.radius;
    y = rawY - this.offsetY - this.radius;
    
    this.clear();
    
    this.lastX = x;
    this.lastY = y;
    this.lastSize = this.size;
    
    destImg = this.cursorCtx.createImageData(this.size, this.size);
    destData = new Uint32Array(destImg.data.buffer);
    
    for (i = 0; i < this.points.length; ++i) {
      destData[this.points[i]] = 0xFFFFFF7F;
    }
    
    this.cursorCtx.putImageData(destImg, x, y);
  },
  
  clear: function() {
    this.cursorCtx.clearRect(this.lastX, this.lastY, this.lastSize, this.lastSize);
  },
  
  clearAll: function() {
    var canvas = this.cursorCtx.canvas;
    this.cursorCtx.clearRect(0, 0, canvas.width, canvas.height);
  },
  
  destroy() {
    this.size = 0;
    this.radius = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.lastSize = 0;
    this.points = null;
    this.cursorCtx = null;
  },
  
  generate: function(size) {
    var e, x, y, c, r, rr, points;
    
    size = 0 | (size * Tegaki.zoomFactor);
    
    if (size < 2) {
      return false;
    }
    
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
    
    this.size = size;
    this.radius = r;
    this.points = points;
    
    return true;
  }
};
