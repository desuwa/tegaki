'use strict';

var TegakiBrush = {
  brushFn: function(x, y) {
    var i, ctx, dest, data, len, kernel;
    
    x = 0 | x;
    y = 0 | y;
    
    ctx = Tegaki.ghostCtx;
    dest = ctx.getImageData(x, y, this.brushSize, this.brushSize);
    data = dest.data;
    kernel = this.kernel;
    len = kernel.length;
    
    i = 0;
    while (i < len) {
      data[i] = this.rgb[0]; ++i;
      data[i] = this.rgb[1]; ++i;
      data[i] = this.rgb[2]; ++i;
      data[i] += kernel[i] * (1.0 - data[i] / 255); ++i;
    }
    
    ctx.putImageData(dest, x, y);
  },
  
  commit: function() {
    Tegaki.activeCtx.drawImage(Tegaki.ghostCanvas, 0, 0);
    Tegaki.clearCtx(Tegaki.ghostCtx);
  },
  
  draw: function(posX, posY, pt) {
    var offset, mx, my, fromX, fromY, dx, dy, err, derr, step, stepAcc;
    
    offset = this.center;
    step = this.stepSize;
    stepAcc = this.stepAcc;
    
    if (pt === true) {
      this.stepAcc = 0;
      this.posX = posX; 
      this.posY = posY;
      this.brushFn(posX - offset, posY - offset);
      return;
    }
    
    fromX = this.posX;
    fromY = this.posY;
    
    if (fromX < posX) { dx = posX - fromX; mx = 1; }
    else { dx = fromX - posX; mx = -1; }
    if (fromY < posY) { dy = posY - fromY; my = 1; }
    else { dy = fromY - posY; my = -1; }
    
    err = (dx > dy ? dx : -dy) / 2;
    
    dx = -dx;
    
    while (true) {
      ++stepAcc;
      if (stepAcc > step) {
        this.brushFn(fromX - offset, fromY - offset);
        stepAcc = 0;
      }
      if (fromX === posX && fromY === posY) {
        break;
      }
      derr = err;
      if (derr > dx) { err -= dy; fromX += mx; }
      if (derr < dy) { err -= dx; fromY += my; }
    }
    
    this.stepAcc = stepAcc;
    this.posX = posX; 
    this.posY = posY;
  },
  
  generateBrush: function() {
    var i, size, r, brush, ctx, dest, data, len, sqd, sqlen, hs, col, row,
      ecol, erow, a;
    
    size = this.size * 2;
    r = size / 2;
    
    brush = T$.el('canvas');
    brush.width = brush.height = size;
    ctx = brush.getContext('2d');
    dest = ctx.getImageData(0, 0, size, size);
    data = dest.data;
    len = size * size * 4;
    sqlen = Math.sqrt(r * r);
    hs = Math.round(r);
    col = row = -hs;
    
    i = 0;
    while (i < len) {
      if (col >= hs) {
        col = -hs;
        ++row;
        continue;
      }
      
      ecol = col;
      erow = row;
      
      if (ecol < 0) { ecol = -ecol; }
      if (erow < 0) { erow = -erow; }
      
      sqd = Math.sqrt(ecol * ecol + erow * erow);
      
      if (sqd > sqlen) {
        a = 0;
      }
      else {
        a = sqd / sqlen;
        a = (Math.exp(1 - 1 / a) / a);
        a = 255 - ((0 | (a * 100 + 0.5)) / 100) * 255;
      }
      
      if (this.alphaDamp) {
        a *= this.alpha * this.alphaDamp;
      }
      else {
        a *= this.alpha;
      }
      
      data[i + 3] = a;
      
      i += 4;
      
      ++col;
    }
    
    ctx.putImageData(dest, 0, 0);
    
    this.center = r;
    this.brushSize = size;
    this.brush = brush;
    this.kernel = data;
  },
  
  setSize: function(size, noBrush) {
    this.size = size;
    if (!noBrush) this.generateBrush();
    this.stepSize = Math.floor(this.size * this.step);
  },
  
  setAlpha: function(alpha, noBrush) {
    this.alpha = alpha;
    if (!noBrush) this.generateBrush();
  },
  
  setColor: function(color, noBrush) {
    this.rgb = Tegaki.hexToRgb(color);
    if (!noBrush) this.generateBrush();
  },
  
  set: function() {
    this.setAlpha(this.alpha, true);
    this.setSize(this.size, true);
    this.setColor(Tegaki.toolColor, true);
    this.generateBrush();
  }
};

var TegakiPen = {
  init: function() {
    this.size = 8;
    this.alpha = 0.5;
    this.step = 0.1;
    this.stepAcc = 0;
  },
  
  draw: TegakiBrush.draw,
  
  commit: TegakiBrush.commit,
  
  brushFn: TegakiBrush.brushFn,
  
  generateBrush: function() {
    var size, r, brush, ctx;
    
    size = this.size;
    r = size / 2;
    
    brush = T$.el('canvas');
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
  
  setSize: TegakiBrush.setSize,
  
  setAlpha: TegakiBrush.setAlpha,
  
  setColor: TegakiBrush.setColor,
  
  set: TegakiBrush.set
};

var TegakiPipette = {
  size: 1,
  alpha: 1,
  noCursor: true,
  
  draw: function(posX, posY) {
    var c, ctx;
    
    if (true) {
      ctx = Tegaki.flatten().getContext('2d');
    }
    else {
      ctx = Tegaki.activeCtx;
    }
    
    c = Tegaki.getColorAt(ctx, posX, posY);
    
    Tegaki.setToolColor(c);
    Tegaki.updateUI('color');
  }
};

var TegakiAirbrush = {
  init: function() {
    this.size = 32;
    this.alpha = 0.5;
    this.alphaDamp = 0.2;
    this.step = 0.25;
    this.stepAcc = 0;
  },
  
  draw: TegakiBrush.draw,
  
  commit: TegakiBrush.commit,
  
  brushFn: TegakiBrush.brushFn,
  
  generateBrush: TegakiBrush.generateBrush,
  
  setSize: TegakiBrush.setSize,
  
  setAlpha: TegakiBrush.setAlpha,
  
  setColor: TegakiBrush.setColor,
  
  set: TegakiBrush.set
};

var TegakiPencil = {
  init: function() {
    this.size = 8;
    this.alpha = 1.0;
    this.step = 0.25;
    this.stepAcc = 0;
  },
  
  draw: TegakiBrush.draw,
  
  commit: TegakiBrush.commit,
  
  brushFn: function(x, y) {
    var i, ctx, dest, data, len, a, kernel;
    
    x = 0 | x;
    y = 0 | y;
    
    ctx = Tegaki.ghostCtx;
    dest = ctx.getImageData(x, y, this.brushSize, this.brushSize);
    data = dest.data;
    kernel = this.kernel;
    len = kernel.length;
    
    a = 0 | (this.alpha * 255);
    
    i = 0;
    while (i < len) {
      data[i] = this.rgb[0]; ++i;
      data[i] = this.rgb[1]; ++i;
      data[i] = this.rgb[2]; ++i;
      if (kernel[i] > 0) {
        data[i] = a;
      }
      ++i;
    }
    
    ctx.putImageData(dest, x, y);
  },
  
  generateBrush: function() {
    var brush, ctx, e, x, y, imageData, data,
      c, color, size, r, rr;
    
    size = 0 | this.size;
    
    r = 0 | ((size) / 2);
    
    rr = 0 | ((size + 1) % 2);
    
    brush = T$.el('canvas');
    brush.width = brush.height = size;
    ctx = brush.getContext('2d');
    
    imageData = ctx.getImageData(0, 0, size, size);
    data = new Uint32Array(imageData.data.buffer);
    
    color = 0xFF000000;
    
    x = r;
    y = 0 | 0;
    e = 1 - r;
    c = r;
    
    while (x >= y) {
      data[c + x - rr + (c + y - rr) * size] = color;
      data[c + y - rr + (c + x - rr) * size] = color;
      
      data[c - y + (c + x - rr) * size] = color;
      data[c - x + (c + y - rr) * size] = color;
      
      data[c - y + (c - x) * size] = color;
      data[c - x + (c - y) * size] = color;
      
      data[c + y - rr + (c - x) * size] = color;
      data[c + x - rr + (c - y) * size] = color;
      
      ++y;
      
      if (e <= 0) {
        e += 2 * y + 1;
      }
      else {
        x--;
        e += 2 * (y - x) + 1;
      }
    }
    
    if (r > 0) {
      TegakiBucket.fill(imageData, imageData, r, r, this.rgb, this.alpha);
    }
    
    this.center = r;
    this.brushSize = size;
    this.brush = brush;
    this.kernel = imageData.data;
  },
  
  setSize: TegakiBrush.setSize,
  
  setAlpha: TegakiBrush.setAlpha,
  
  setColor: TegakiBrush.setColor,
  
  set: TegakiBrush.set
};

var TegakiBucket = {
  noCursor: true,
  
  init: function() {
    this.size = 1;
    this.alpha = 1.0;
    this.step = 100.0;
    this.stepAcc = 0;
  },
  
  commit: TegakiBrush.commit,
  
  draw: TegakiBrush.draw,
  
  fill: function(srcId, destId, x, y, color, alpha) {
    var r, g, b, a, px, tr, tg, tb, ta, q, pxMap, yy, xx, yn, ys,
      yyy, yyn, yys, xd, srcData, destData, w, h;
    
    x = 0 | x;
    y = 0 | y;
    
    w = 0 | srcId.width;
    h = 0 | srcId.height;
    
    r = 0 | color[0];
    g = 0 | color[1];
    b = 0 | color[2];
    a = 0 | (alpha * 255);
    
    px = 0 | ((y * w + x) * 4);
    
    srcData = srcId.data;
    destData = destId.data;
    
    tr = 0 | srcData[px];
    tg = 0 | srcData[px + 1];
    tb = 0 | srcData[px + 2];
    ta = 0 | srcData[px + 3];
    
    pxMap = new Uint8Array(w * h * 4);
    
    q = [];
    
    q[0] = x;
    q[1] = y;
    
    while (q.length) {
      yy = q.pop();
      xx = q.pop();
      
      yn = (yy - 1);
      ys = (yy + 1);
      
      yyy = yy * w;
      yyn = yn * w;
      yys = ys * w;
      
      xd = xx;
      
      while (xd >= 0) {
        px = (yyy + xd) * 4;
        
        if (!this.testPixel(srcData, px, pxMap, tr, tg, tb, ta)) {
          break;
        }
        
        this.setPixel(destData, px, r, g, b, a);
        
        pxMap[px] = 1;
        
        if (yn >= 0) {
          px = (yyn + xd) * 4;
          
          if (this.testPixel(srcData, px, pxMap, tr, tg, tb, ta)) {
            q.push(xd);
            q.push(yn);
          }
        }
        
        if (ys < h) {
          px = (yys + xd) * 4;
          
          if (this.testPixel(srcData, px, pxMap, tr, tg, tb, ta)) {
            q.push(xd);
            q.push(ys);
          }
        }
        
        xd--;
      }
      
      xd = xx + 1;
      
      while (xd < w) {
        px = (yyy + xd) * 4;
        
        if (!this.testPixel(srcData, px, pxMap, tr, tg, tb, ta)) {
          break;
        }
        
        this.setPixel(destData, px, r, g, b, a);
        
        pxMap[px] = 1;
        
        if (yn >= 0) {
          px = (yyn + xd) * 4;
          
          if (this.testPixel(srcData, px, pxMap, tr, tg, tb, ta)) {
            q.push(xd);
            q.push(yn);
          }
        }
        
        if (ys < h) {
          px = (yys + xd) * 4;
          
          if (this.testPixel(srcData, px, pxMap, tr, tg, tb, ta)) {
            q.push(xd);
            q.push(ys);
          }
        }
        
        ++xd;
      }
    }
  },
  
  brushFn: function(x, y) {
    var aCtx, gCtx, w, h, srcId, destId;
    
    x = 0 | x;
    y = 0 | y;
    
    aCtx = Tegaki.activeCtx;
    gCtx = Tegaki.ghostCtx;
    
    w = aCtx.canvas.width;
    h = aCtx.canvas.height;
    
    if (x < 0 || y < 0 || x >= w || y >= h) {
      return;
    }
    
    srcId = aCtx.getImageData(0, 0, w, h);
    destId = gCtx.getImageData(0, 0, w, h);
    
    this.fill(srcId, destId, x, y, this.rgb, this.alpha);
    
    gCtx.putImageData(destId, 0, 0);
  },
  
  setPixel: function(data, px, r, g, b, a) {
    data[px] = r; ++px;
    data[px] = g; ++px;
    data[px] = b; ++px;
    data[px] = a;
  },
  
  testPixel: function(data, px, pxMap, tr, tg, tb, ta) {
    return !pxMap[px] && (data[px] == tr
      && data[++px] == tg
      && data[++px] == tb
      && data[++px] == ta)
    ;
  },
  
  generateBrush: TegakiPen.generateBrush,
  
  setSize: TegakiBrush.setSize,
  
  setAlpha: TegakiBrush.setAlpha,
  
  setColor: TegakiBrush.setColor,
  
  set: TegakiBrush.set
};

var TegakiEraser = {
  init: function() {
    this.size = 8;
    this.alpha = 1.0;
    this.step = 0.25;
    this.stepAcc = 0;
  },
  
  draw: TegakiBrush.draw,
  
  brushFn: function(x, y) {
    var i, ctx, dest, data, len, kernel;
    
    x = 0 | x;
    y = 0 | y;
    
    ctx = Tegaki.activeCtx;
    dest = ctx.getImageData(x, y, this.brushSize, this.brushSize);
    data = dest.data;
    kernel = this.kernel;
    len = kernel.length;
    
    for (i = 3; i < len; i += 4) {
      if (kernel[i] > 0) {
        data[i] = 0;
      }
    }
    
    ctx.putImageData(dest, x, y);
  },
  
  generateBrush: TegakiPen.generateBrush,
  
  setSize: TegakiBrush.setSize,
  
  setAlpha: TegakiBrush.setAlpha,
  
  setColor: TegakiBrush.setColor,
  
  set: TegakiBrush.set
};

var TegakiDodge = {
  init: function() {
    this.size = 24;
    this.alpha = 0.25;
    this.alphaDamp = 0.05;
    this.step = 0.25;
    this.stepAcc = 0;
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
  
  draw: TegakiBrush.draw,
  
  generateBrush: TegakiBrush.generateBrush,
  
  setSize: TegakiBrush.setSize,
  
  setAlpha: TegakiBrush.setAlpha,
  
  setColor: TegakiBrush.setColor,
  
  set: TegakiBrush.set
};

var TegakiBurn = {
  init: TegakiDodge.init,
  
  brushFn: function(x, y) {
    var i, a, ctx, dest, data, len, kernel;
    
    x = 0 | x;
    y = 0 | y;
    
    ctx = Tegaki.activeCtx;
    dest = ctx.getImageData(x, y, this.brushSize, this.brushSize);
    data = dest.data;
    kernel = this.kernel;
    len = kernel.length;
    
    i = 0;
    while (i < len) {
      a = 1 - kernel[i + 3] / 255;
      data[i] = data[i] * a; ++i;
      data[i] = data[i] * a; ++i;
      data[i] = data[i] * a; ++i;
      ++i;
    }
    
    ctx.putImageData(dest, x, y);
  },
  
  draw: TegakiBrush.draw,
  
  generateBrush: TegakiDodge.generateBrush,
  
  setSize: TegakiBrush.setSize,
  
  setAlpha: TegakiBrush.setAlpha,
  
  setColor: TegakiBrush.setColor,
  
  set: TegakiBrush.set
};

var TegakiBlur = {
  init: TegakiDodge.init,
  
  brushFn: function(x, y) {
    var i, j, ctx, src, size, srcData, dest, destData, lim, kernel,
      sx, sy, r, g, b, a, aa, acc, kx, ky;
    
    x = 0 | x;
    y = 0 | y;
    
    size = this.brushSize;
    ctx = Tegaki.activeCtx;
    src = ctx.getImageData(x, y, size, size);
    srcData = src.data;
    dest = ctx.createImageData(size, size);
    destData = dest.data;
    kernel = this.kernel;
    lim = size - 1;
    
    for (sx = 0; sx < size; ++sx) {
      for (sy = 0; sy < size; ++sy) {
        r = g = b = a = acc = 0;
        i = (sy * size + sx) * 4;
        if (kernel[(sy * size + sx) * 4 + 3] === 0
          || sx === 0 || sy === 0 || sx === lim || sy === lim) {
          destData[i] = srcData[i]; ++i;
          destData[i] = srcData[i]; ++i;
          destData[i] = srcData[i]; ++i;
          destData[i] = srcData[i];
          continue;
        }
        for (kx = -1; kx < 2; ++kx) {
          for (ky = -1; ky < 2; ++ky) {
            j = ((sy - ky) * size + (sx - kx)) * 4;
            aa = srcData[j + 3];
            acc += aa;
            r += srcData[j] * aa; ++j;
            g += srcData[j] * aa; ++j;
            b += srcData[j] * aa; ++j;
            a += srcData[j];
          }
        }
        destData[i] = r / acc; ++i;
        destData[i] = g / acc; ++i;
        destData[i] = b / acc; ++i;
        destData[i] = a / 9;
      }
    }
    
    ctx.putImageData(dest, x, y);
  },
  
  draw: TegakiBrush.draw,
  
  generateBrush: TegakiDodge.generateBrush,
  
  setSize: TegakiBrush.setSize,
  
  setAlpha: TegakiBrush.setAlpha,
  
  setColor: TegakiBrush.setColor,
  
  set: TegakiBrush.set
};

var TegakiTone = {
  matrix: [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1 ,9],
    [15, 7, 13, 5]
  ],
  
  data: null,
  
  dataAlpha: null,
  dataWidth: null,
  dataHeight: null,
  
  init: function() {
    this.size = 8;
    this.alpha = 0.5;
    this.step = 0.25;
    this.stepAcc = 0;
  },
  
  draw: TegakiBrush.draw,
  
  commit: TegakiBrush.commit,
  
  brushFn: function(x, y) {
    var ctx, dest, data, kernel, brushSize, map,
      px, mapWidth, mapHeight, xx, yy;
    
    x = 0 | x;
    y = 0 | y;
    
    ctx = Tegaki.ghostCtx;
    dest = ctx.getImageData(x, y, this.brushSize, this.brushSize);
    data = dest.data;
    kernel = this.kernel;
    
    brushSize = this.brushSize;
    
    mapWidth = Tegaki.canvas.width;
    mapHeight = Tegaki.canvas.height;
    
    map = this.generate(mapWidth, mapHeight);
    
    for (yy = 0; yy < brushSize; ++yy) {
      for (xx = 0; xx < brushSize; ++xx) {
        px = (brushSize * yy + xx) * 4;
        
        if (kernel[px + 3] === 0) {
          continue;
        }
        
        if (map[(yy + y) * mapWidth + xx + x] === 0) {
          data[px] = this.rgb[0]; ++px;
          data[px] = this.rgb[1]; ++px;
          data[px] = this.rgb[2]; ++px;
          data[px] = 255;
        }
      }
    }
    
    ctx.putImageData(dest, x, y);
  },
  
  generateBrush: TegakiPencil.generateBrush,
  
  setSize: TegakiBrush.setSize,
  
  setAlpha: TegakiBrush.setAlpha,
  
  setColor: TegakiBrush.setColor,
  
  set: TegakiBrush.set,
  
  generate: function(w, h) {
    var data, x, y, a;
    
    if (this.alpha == this.dataAlpha
      && w === this.dataWidth
      && h === this.dataHeight) {
      return this.data;
    }
    
    data = new Uint8Array(w * h);
    
    if (this.alpha <= 1.0) {
      a = this.alpha * 16 - 1;
      
      for (y = 0; y < h; ++y) {
        for (x = 0; x < w; ++x) {
          if (a < this.matrix[y % 4][x % 4]) {
            data[w * y + x] = 1;
          }
        }
      }
    }
    
    this.dataAlpha = this.alpha;
    this.dataWidth = w;
    this.dataHeight = h;
    
    this.data = data;
    
    return data;
  }
};

var TegakiHistory = {
  maxSize: 10,
  
  undoStack: [],
  redoStack: [],
  
  pendingAction: null,
  
  clear: function() {
    this.undoStack = [];
    this.redoStack = [];
    this.pendingAction = null;
  },
  
  push: function(action) {
    this.undoStack.push(action);
    
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    
    if (this.redoStack.length > 0) {
      this.redoStack = [];
    }
  },
  
  undo: function() {
    var action;
    
    if (!this.undoStack.length) {
      return;
    }
    
    action = this.undoStack.pop();
    action.undo();
    
    this.redoStack.push(action);
  },
  
  redo: function() {
    var action;
    
    if (!this.redoStack.length) {
      return;
    }
    
    action = this.redoStack.pop();
    action.redo();
    
    this.undoStack.push(action);
  }
};

var TegakiHistoryActions = {
  Draw: function(layerId) {
    this.canvasBefore = null;
    this.canvasAfter = null;
    this.layerId = layerId;
  },
  
  DestroyLayers: function(indices, layers) {
    this.indices = indices;
    this.layers = layers;
    this.canvasBefore = null;
    this.canvasAfter = null;
    this.layerId = null;
  },
  
  AddLayer: function(layerId) {
    this.layerId = layerId;
  },
  
  MoveLayer: function(layerId, up) {
    this.layerId = layerId;
    this.up = up;
  }
};

TegakiHistoryActions.Draw.prototype.addCanvasState = function(canvas, type) {
  if (type) {
    this.canvasAfter = T$.copyCanvas(canvas);
  }
  else {
    this.canvasBefore = T$.copyCanvas(canvas);
  }
};

TegakiHistoryActions.Draw.prototype.exec = function(type) {
  var i, layer;
  
  for (i in Tegaki.layers) {
    layer = Tegaki.layers[i];
    
    if (layer.id === this.layerId) {
      layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      layer.ctx.drawImage(type ? this.canvasAfter: this.canvasBefore, 0, 0);
    }
  }
};

TegakiHistoryActions.Draw.prototype.undo = function() {
  this.exec(0);
};

TegakiHistoryActions.Draw.prototype.redo = function() {
  this.exec(1);
};

TegakiHistoryActions.DestroyLayers.prototype.undo = function() {
  var i, ii, len, layers, idx, layer, frag;
  
  layers = new Array(len);
  
  for (i = 0; (idx = this.indices[i]) !== undefined; ++i) {
    layers[idx] = this.layers[i];
  }
  
  i = ii = 0;
  len = Tegaki.layers.length + this.layers.length;
  frag = T$.frag();
  
  while (i < len) {
    if (!layers[i]) {
      layer = layers[i] = Tegaki.layers[ii];
      Tegaki.layersCnt.removeChild(layer.canvas);
      ++ii;
    }
    
    if (this.layerId && layer.id === this.layerId) {
      layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      layer.ctx.drawImage(this.canvasBefore, 0, 0);
    }
    
    frag.appendChild(layers[i].canvas);
    
    ++i;
  }
  
  Tegaki.layersCnt.insertBefore(frag, Tegaki.canvas.nextElementSibling);
  
  Tegaki.layers = layers;
  
  Tegaki.setActiveLayer();
  
  Tegaki.rebuildLayerCtrl();
};

TegakiHistoryActions.DestroyLayers.prototype.redo = function() {
  var i, layer, ids = [];
  
  for (i = 0; layer = this.layers[i]; ++i) {
    ids.push(layer.id);
  }
  
  if (this.layerId) {
    ids.push(this.layerId);
    Tegaki.mergeLayers(ids);
  }
  else {
    Tegaki.deleteLayers(ids);
  }
};

TegakiHistoryActions.MoveLayer.prototype.undo = function() {
  Tegaki.setActiveLayer(this.layerId);
  Tegaki.moveLayer(this.layerId, !this.up);
};

TegakiHistoryActions.MoveLayer.prototype.redo = function() {
  Tegaki.setActiveLayer(this.layerId);
  Tegaki.moveLayer(this.layerId, this.up);
};

TegakiHistoryActions.AddLayer.prototype.undo = function() {
  Tegaki.deleteLayers([this.layerId]);
  Tegaki.layerIndex--;
};

TegakiHistoryActions.AddLayer.prototype.redo = function() {
  Tegaki.addLayer();
  Tegaki.setActiveLayer();
};

var T$ = {
  docEl: document.documentElement,
  
  id: function(id) {
    return document.getElementById(id);
  },
  
  cls: function(klass, root) {
    return (root || document).getElementsByClassName(klass);
  },
  
  on: function(o, e, h) {
    o.addEventListener(e, h, false);
  },
  
  off: function(o, e, h) {
    o.removeEventListener(e, h, false);
  },
  
  el: function(name) {
    return document.createElement(name);
  },
  
  frag: function() {
    return document.createDocumentFragment();
  },
  
  extend: function(destination, source) {
    for (var key in source) {
      destination[key] = source[key];
    }
  },
  
  selectedOptions: function(el) {
    var i, opt, sel;
    
    if (el.selectedOptions) {
      return el.selectedOptions;
    }
    
    sel = [];
    
    for (i = 0; opt = el.options[i]; ++i) {
      if (opt.selected) {
        sel.push(opt);
      }
    }
    
    return sel;
  },
  
  copyCanvas: function(source) {
    var canvas = T$.el('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    canvas.getContext('2d').drawImage(source, 0, 0);
    
    return canvas;
  }
};

var TegakiStrings = {
  // Messages
  badDimensions: 'Invalid dimensions.',
  promptWidth: 'Canvas width in pixels',
  promptHeight: 'Canvas height in pixels',
  confirmDelLayers: 'Delete selected layers?',
  errorMergeOneLayer: 'You need to select at least 2 layers.',
  confirmMergeLayers: 'Merge selected layers?',
  errorLoadImage: 'Could not load the image.',
  noActiveLayer: 'No active layer.',
  hiddenActiveLayer: 'The active layer is not visible.',
  confirmCancel: 'Are you sure? Your work will be lost.',
  confirmChangeCanvas: 'Changing the canvas will clear all layers and history.',
  
  // UI
  color: 'Color',
  size: 'Size',
  alpha: 'Opacity',
  zoom: 'Zoom',
  layers: 'Layers',
  addLayer: 'Add layer',
  delLayers: 'Delete layers',
  mergeLayers: 'Merge layers',
  showHideLayer: 'Toggle visibility',
  moveLayerUp: 'Move up',
  moveLayerDown: 'Move down',
  tool: 'Tool',
  changeCanvas: 'Change canvas',
  blank: 'Blank',
  newCanvas: 'New',
  undo: 'Undo',
  redo: 'Redo',
  close: 'Close',
  finish: 'Finish',
  
  // Tools
  pen: 'Pen',
  pencil: 'Pencil',
  airbrush: 'Airbrush',
  pipette: 'Pipette',
  dodge: 'Dodge',
  burn: 'Burn',
  blur: 'Blur',
  eraser: 'Eraser',
  bucket: 'Bucket',
  tone: 'Tone'
};

var Tegaki = {
  VERSION: '0.0.1',
  
  bg: null,
  cnt: null,
  canvas: null,
  ctx: null,
  layers: [],
  layersCnt: null,
  cursorCanvas: null,
  cursorCtx: null,
  ghostCanvas: null,
  ghostCtx: null,
  flatCtx: null,
  activeCtx: null,
  activeLayer: null,
  layerIndex: null,
  
  isPainting: false,
  isErasing: false,
  isColorPicking: false,
  
  offsetX: 0,
  offsetY: 0,
  
  zoomLevel: 1,
  zoomMax: 4,
  zoomMin: 1,
  
  TWOPI: 2 * Math.PI,
  
  tools: {
    pencil: TegakiPencil,
    pen: TegakiPen,
    airbrush: TegakiAirbrush,
    bucket: TegakiBucket,
    tone: TegakiTone,
    pipette: TegakiPipette,
    dodge: TegakiDodge,
    burn: TegakiBurn,
    blur: TegakiBlur,
    eraser: TegakiEraser
  },
  
  tool: null,
  toolColor: '#000000',
  
  bgColor: '#ffffff',
  maxSize: 32,
  maxLayers: 25,
  baseWidth: null,
  baseHeight: null,
  
  onDoneCb: null,
  onCancelCb: null,
  
  open: function(opts) {
    var bg, cnt, el, el2, tool, lbl, btn, ctrl, canvas, grp, self = Tegaki;
    
    if (self.bg) {
      self.resume();
      return;
    }
    
    if (opts.bgColor) {
      self.bgColor = opts.bgColor;
    }
    
    self.onDoneCb = opts.onDone;
    self.onCancelCb = opts.onCancel;
    
    cnt = T$.el('div');
    cnt.id = 'tegaki-cnt';
    
    canvas = T$.el('canvas');
    canvas.id = 'tegaki-canvas';
    canvas.width = self.baseWidth = opts.width;
    canvas.height = self.baseHeight = opts.height;
    
    el = T$.el('div');
    el.id = 'tegaki-layers';
    el.appendChild(canvas);
    self.layersCnt = el;
    
    cnt.appendChild(el);
    
    ctrl = T$.el('div');
    ctrl.id = 'tegaki-ctrl';
    
    // Colorpicker
    grp = T$.el('div');
    grp.className = 'tegaki-ctrlgrp';
    el = T$.el('input');
    el.id = 'tegaki-color';
    el.value = self.toolColor;
    try {
      el.type = 'color';
    } catch(e) {
      el.type = 'text';
    }
    lbl = T$.el('div');
    lbl.className = 'tegaki-label';
    lbl.textContent = TegakiStrings.color;
    grp.appendChild(lbl);
    T$.on(el, 'change', self.onColorChange);
    grp.appendChild(el);
    ctrl.appendChild(grp);
    
    // Size control
    grp = T$.el('div');
    grp.className = 'tegaki-ctrlgrp';
    el = T$.el('input');
    el.id = 'tegaki-size';
    el.min = 1;
    el.max = self.maxSize;
    el.type = 'range';
    lbl = T$.el('div');
    lbl.className = 'tegaki-label';
    lbl.textContent = TegakiStrings.size;
    grp.appendChild(lbl);
    T$.on(el, 'change', self.onSizeChange);
    grp.appendChild(el);
    ctrl.appendChild(grp);
    
    // Alpha control
    grp = T$.el('div');
    grp.className = 'tegaki-ctrlgrp';
    el = T$.el('input');
    el.id = 'tegaki-alpha';
    el.min = 0;
    el.max = 1;
    el.step = 0.01;
    el.type = 'range';
    lbl = T$.el('div');
    lbl.className = 'tegaki-label';
    lbl.textContent = TegakiStrings.alpha;
    grp.appendChild(lbl);
    T$.on(el, 'change', self.onAlphaChange);
    grp.appendChild(el);
    ctrl.appendChild(grp);
    
    // Layer control
    grp = T$.el('div');
    grp.className = 'tegaki-ctrlgrp';
    grp.id = 'tegaki-layer-grp';
    el = T$.el('select');
    el.id = 'tegaki-layer';
    el.multiple = true;
    el.size = 3;
    lbl = T$.el('div');
    lbl.className = 'tegaki-label';
    lbl.textContent = TegakiStrings.layers;
    grp.appendChild(lbl);
    T$.on(el, 'change', self.onLayerChange);
    grp.appendChild(el);
    el = T$.el('span');
    el.title = TegakiStrings.addLayer;
    el.className = 'tegaki-icon tegaki-plus';
    T$.on(el, 'click', self.onLayerAdd);
    grp.appendChild(el);
    el = T$.el('span');
    el.title = TegakiStrings.delLayers;
    el.className = 'tegaki-icon tegaki-minus';
    T$.on(el, 'click', self.onLayerDelete);
    grp.appendChild(el);
    el = T$.el('span');
    el.id = 'tegaki-layer-visibility';
    el.title = TegakiStrings.showHideLayer;
    el.className = 'tegaki-icon tegaki-eye';
    T$.on(el, 'click', self.onLayerVisibilityChange);
    grp.appendChild(el);
    el = T$.el('span');
    el.id = 'tegaki-layer-merge';
    el.title = TegakiStrings.mergeLayers;
    el.className = 'tegaki-icon tegaki-level-down';
    T$.on(el, 'click', self.onMergeLayers);
    grp.appendChild(el);
    el = T$.el('span');
    el.id = 'tegaki-layer-up';
    el.title = TegakiStrings.moveLayerUp;
    el.setAttribute('data-up', '1');
    el.className = 'tegaki-icon tegaki-up-open';
    T$.on(el, 'click', self.onMoveLayer);
    grp.appendChild(el);
    el = T$.el('span');
    el.id = 'tegaki-layer-down';
    el.title = TegakiStrings.moveLayerDown;
    el.className = 'tegaki-icon tegaki-down-open';
    T$.on(el, 'click', self.onMoveLayer);
    grp.appendChild(el);
    ctrl.appendChild(grp);
    
    // Tool selector
    grp = T$.el('div');
    grp.className = 'tegaki-ctrlgrp';
    el = T$.el('select');
    el.id = 'tegaki-tool';
    for (tool in Tegaki.tools) {
      el2 = T$.el('option');
      el2.value = tool;
      el2.textContent = TegakiStrings[tool];
      el.appendChild(el2);
    }
    lbl = T$.el('div');
    lbl.className = 'tegaki-label';
    lbl.textContent = TegakiStrings.tool;
    grp.appendChild(lbl);
    T$.on(el, 'change', self.onToolChange);
    grp.appendChild(el);
    ctrl.appendChild(grp);
    
    // Zoom control
    grp = T$.el('div');
    grp.className = 'tegaki-ctrlgrp';
    el = T$.el('input');
    el.id = 'tegaki-zoom';
    el.min = self.zoomMin;
    el.max = self.zoomMax;
    el.step = 1;
    el.type = 'range';
    lbl = T$.el('div');
    lbl.className = 'tegaki-label';
    lbl.textContent = TegakiStrings.zoom;
    grp.appendChild(lbl);
    T$.on(el, 'change', self.onZoomChange);
    grp.appendChild(el);
    ctrl.appendChild(grp);
    
    // ---
    cnt.appendChild(ctrl);
    
    el = T$.el('div');
    el.id = 'tegaki-menu-bar';
    
    if (opts.canvasOptions) {
      btn = T$.el('select');
      btn.id = 'tegaki-canvas-select';
      btn.title = TegakiStrings.changeCanvas;
      btn.innerHTML = '<option value="0">' + TegakiStrings.blank + '</option>';
      opts.canvasOptions(btn);
      T$.on(btn, 'change', Tegaki.onCanvasSelected);
      T$.on(btn, 'focus', Tegaki.onCanvasSelectFocused);
      el.appendChild(btn);
    }
    
    btn = T$.el('span');
    btn.className = 'tegaki-tb-btn';
    btn.textContent = TegakiStrings.newCanvas;
    T$.on(btn, 'click', Tegaki.onNewClick);
    el.appendChild(btn);
    
    btn = T$.el('span');
    btn.className = 'tegaki-tb-btn';
    btn.textContent = TegakiStrings.undo;
    T$.on(btn, 'click', Tegaki.onUndoClick);
    el.appendChild(btn);
    
    btn = T$.el('span');
    btn.className = 'tegaki-tb-btn';
    btn.textContent = TegakiStrings.redo;
    T$.on(btn, 'click', Tegaki.onRedoClick);
    el.appendChild(btn);
    
    btn = T$.el('span');
    btn.className = 'tegaki-tb-btn';
    btn.textContent = TegakiStrings.close;
    T$.on(btn, 'click', Tegaki.onCancelClick);
    el.appendChild(btn);
    
    btn = T$.el('span');
    btn.id = 'tegaki-finish-btn';
    btn.className = 'tegaki-tb-btn';
    btn.textContent = TegakiStrings.finish;
    T$.on(btn, 'click', Tegaki.onDoneClick);
    el.appendChild(btn);
    
    cnt.appendChild(el);
    
    bg = T$.el('div');
    bg.id = 'tegaki';
    self.bg = bg;
    bg.appendChild(cnt);
    document.body.appendChild(bg);
    document.body.classList.add('tegaki-backdrop');
    
    self.cnt = cnt;
    self.centerCnt();
    
    self.canvas = canvas;
    
    self.ctx = canvas.getContext('2d');
    self.ctx.fillStyle = self.bgColor;
    self.ctx.fillRect(0, 0, opts.width, opts.height);
    
    self.initGhostLayers();
    
    self.addLayer();
    
    self.setActiveLayer();
    
    self.initTools();
    
    self.setTool('pencil');
    
    self.updateUI();
    
    self.updateCursorStatus();
    self.updatePosOffset();
    
    self.updateFlatCtx();
    
    self.bindGlobalEvents();
  },
  
  initTools: function() {
    var tool;
    
    for (tool in Tegaki.tools) {
      (tool = Tegaki.tools[tool]) && tool.init && tool.init();
    }
  },
  
  hexToRgb: function(hex) {
    var c = hex.match(/^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i);
    
    if (c) {
      return [
        parseInt(c[1], 16),
        parseInt(c[2], 16),
        parseInt(c[3], 16)
      ];
    }
    
    return null;
  },
  
  bindGlobalEvents: function() {
    var self = Tegaki;
    
    T$.on(self.bg, 'mousemove', self.onMouseMove);
    T$.on(self.bg, 'mousedown', self.onMouseDown);
    T$.on(self.layersCnt, 'contextmenu', self.onDummy);
    
    T$.on(document, 'mouseup', self.onMouseUp);
    T$.on(window, 'resize', self.updatePosOffset);
    T$.on(window, 'scroll', self.updatePosOffset);
  },
  
  unBindGlobalEvents: function() {
    var self = Tegaki;
    
    T$.off(self.bg, 'mousemove', self.onMouseMove);
    T$.off(self.bg, 'mousedown', self.onMouseDown);
    T$.off(self.layersCnt, 'contextmenu', self.onDummy);
    
    T$.off(document, 'mouseup', self.onMouseUp);
    T$.off(window, 'resize', self.updatePosOffset);
    T$.off(window, 'scroll', self.updatePosOffset);
  },
  
  initGhostLayers: function() {
    var el;
    
    el = T$.el('canvas');
    el.id = 'tegaki-ghost-layer';
    el.width = Tegaki.baseWidth;
    el.height = Tegaki.baseHeight;
    Tegaki.ghostCanvas = el;
    Tegaki.ghostCtx = el.getContext('2d');
    
    el = T$.el('canvas');
    el.id = 'tegaki-cursor-layer';
    el.width = Tegaki.baseWidth;
    el.height = Tegaki.baseHeight;
    Tegaki.layersCnt.appendChild(el);
    Tegaki.cursorCanvas = el;
    Tegaki.cursorCtx = el.getContext('2d');
    
    el = T$.el('canvas');
    el.width = Tegaki.baseWidth;
    el.height = Tegaki.baseHeight;
    Tegaki.flatCtx = el.getContext('2d');
  },
  
  disableSmoothing: function(ctx) {
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
  },
  
  centerCnt: function() {
    var aabb, cnt;
    
    Tegaki.layersCnt.style.width = Tegaki.baseWidth + 'px';
    Tegaki.layersCnt.style.height = Tegaki.baseHeight + 'px';
    
    cnt = Tegaki.cnt;
    
    aabb = cnt.getBoundingClientRect();
    
    if (aabb.width > T$.docEl.clientWidth || aabb.height > T$.docEl.clientHeight) {
      if (aabb.width > T$.docEl.clientWidth) {
        cnt.classList.add('tegaki-overflow-x');
      }
      if (aabb.height > T$.docEl.clientHeight) {
        cnt.classList.add('tegaki-overflow-y');
      }
    }
    else {
      cnt.classList.remove('tegaki-overflow-x');
      cnt.classList.remove('tegaki-overflow-y');
    }
    
    cnt.style.marginTop = -Math.round(aabb.height / 2) + 'px';
    cnt.style.marginLeft = -Math.round(aabb.width / 2) + 'px';
  },
  
  getCursorPos: function(e, axis) {
    if (axis === 0) {
      return 0 | ((
        e.clientX
          + window.pageXOffset
          + Tegaki.bg.scrollLeft
          + Tegaki.layersCnt.scrollLeft
          - Tegaki.offsetX
        ) / Tegaki.zoomLevel);
    }
    else {
      return 0 | ((
        e.clientY
          + window.pageYOffset
          + Tegaki.bg.scrollTop
          + Tegaki.layersCnt.scrollTop
          - Tegaki.offsetY
        ) / Tegaki.zoomLevel);
    }
  },
  
  resume: function() {
    Tegaki.bg.classList.remove('tegaki-hidden');
    document.body.classList.add('tegaki-backdrop');
    Tegaki.centerCnt();
    Tegaki.updatePosOffset();
    Tegaki.bindGlobalEvents();
  },
  
  hide: function() {
    Tegaki.bg.classList.add('tegaki-hidden');
    document.body.classList.remove('tegaki-backdrop');
    Tegaki.unBindGlobalEvents();
  },
  
  destroy: function() {
    Tegaki.unBindGlobalEvents();
    
    Tegaki.bg.parentNode.removeChild(Tegaki.bg);
    
    TegakiHistory.clear();
    
    document.body.classList.remove('tegaki-backdrop');
    
    Tegaki.bg = null;
    Tegaki.cnt = null;
    Tegaki.canvas = null;
    Tegaki.ctx = null;
    Tegaki.layers = [];
    Tegaki.layerIndex = 0;
    Tegaki.zoomLevel = 1;
    Tegaki.activeCtx = null;
    Tegaki.ghostCtx = null;
    Tegaki.ghostCanvas = null;
    Tegaki.cursorCtx = null;
    Tegaki.cursorCanvas = null;
    Tegaki.flatCtx = null;
  },
  
  flatten: function(ctx) {
    var i, layer, canvas;
    
    if (!ctx) {
      canvas = T$.el('canvas');
      ctx = canvas.getContext('2d');
    }
    else {
      canvas = ctx.canvas;
    }
    
    canvas.width = Tegaki.canvas.width;
    canvas.height = Tegaki.canvas.height;
    
    ctx.drawImage(Tegaki.canvas, 0, 0);
    
    for (i = 0; layer = Tegaki.layers[i]; ++i) {
      if (layer.canvas.classList.contains('tegaki-hidden')) {
        continue;
      }
      ctx.drawImage(layer.canvas, 0, 0);
    }
    
    return canvas;
  },
  
  updateUI: function(type) {
    var i, ary, el, tool = Tegaki.tool;
    
    ary = type ? [type] : ['size', 'alpha', 'color', 'zoom'];
    
    for (i = 0; type = ary[i]; ++i) {
      el = T$.id('tegaki-' + type);
      
      if (type === 'color') {
        el.value = Tegaki.toolColor;
      }
      else if (type === 'zoom') {
        el.value = Tegaki.zoomLevel;
      }
      else {
        el.value = tool[type];
      }
      
      if (el.type === 'range') {
        el.previousElementSibling.setAttribute('data-value', el.value);
      }
    }
  },
  
  rebuildLayerCtrl: function() {
    var i, layer, sel, opt;
    
    sel = T$.id('tegaki-layer');
    
    sel.textContent = '';
    
    for (i = Tegaki.layers.length - 1; layer = Tegaki.layers[i]; i--) {
      opt = T$.el('option');
      opt.value = layer.id;
      opt.textContent = layer.name;
      sel.appendChild(opt);
    }
  },
  
  getColorAt: function(ctx, posX, posY) {
    var rgba = ctx.getImageData(posX, posY, 1, 1).data;
    
    return '#'
      + ('0' + rgba[0].toString(16)).slice(-2)
      + ('0' + rgba[1].toString(16)).slice(-2)
      + ('0' + rgba[2].toString(16)).slice(-2);
  },
  
  renderCursor: function(x0, y0) {
    var canvas, e, x, y, imageData, data, side,
      srcImageData, srcData, c, color, r, rr;
    
    side = 0 | Tegaki.tool.size;
    r = 0 | (side / 2);
    rr = 0 | ((side + 1) % 2);
    
    Tegaki.clearCtx(Tegaki.cursorCtx);
    
    srcImageData = Tegaki.flatCtx.getImageData(x0 - r, y0 - r, side, side);
    srcData = new Uint32Array(srcImageData.data.buffer);
    
    imageData = Tegaki.cursorCtx.getImageData(x0 - r, y0 - r, side, side);
    data = new Uint32Array(imageData.data.buffer);
    
    color = 0x00FFFF7F;
    
    x = r;
    y = 0;
    e = 1 - r;
    c = r;
    
    while (x >= y) {
      data[(c + x - rr + (c + y - rr) * side)] =
        srcData[(c + x - rr + (c + y - rr) * side)] ^ color;
      data[(c + y - rr + (c + x - rr) * side)] =
        srcData[(c + y - rr + (c + x - rr) * side)] ^ color;
      
      data[(c - y + (c + x - rr) * side)] =
        srcData[(c - y + (c + x - rr) * side)] ^ color;
      data[(c - x + (c + y - rr) * side)] =
        srcData[(c - x + (c + y - rr) * side)] ^ color;
      
      data[(c - x + (c - y) * side)] =
        srcData[(c - x + (c - y) * side)] ^ color;
      data[(c - y + (c - x) * side)] =
        srcData[(c - y + (c - x) * side)] ^ color;
      
      data[(c + y - rr + (c - x) * side)] =
        srcData[(c + y - rr + (c - x) * side)] ^ color;
      data[(c + x - rr + (c - y) * side)] =
        srcData[(c + x - rr + (c - y) * side)] ^ color;
        
      ++y;
      
      if (e <= 0) {
        e += 2 * y + 1;
      }
      else {
        --x;
        e += 2 * (y - x) + 1;
      }
    }
    
    Tegaki.cursorCtx.putImageData(imageData, x0 - r, y0 - r);
    
    return canvas;
  },
  
  setToolSize: function(size) {
    Tegaki.tool.setSize && Tegaki.tool.setSize(size);
    Tegaki.updateCursorStatus();
  },
  
  setToolAlpha: function(alpha) {
    Tegaki.tool.setAlpha && Tegaki.tool.setAlpha(alpha);
  },
  
  setToolColor: function(color) {
    Tegaki.toolColor = color;
    Tegaki.tool.setColor && Tegaki.tool.setColor(color);
  },
  
  setTool: function(tool) {
    tool = Tegaki.tools[tool];
    Tegaki.tool = tool;
    tool.set && tool.set();
  },
  
  setZoom: function(level) {
    var el, nodes, i;
    
    if (level > Tegaki.zoomMax || level < Tegaki.zoomMin) {
      return;
    }
    
    Tegaki.zoomLevel = level;
    
    nodes = Tegaki.layersCnt.children;
    
    for (i = 0; el = nodes[i]; ++i) {
      Tegaki.updateCanvasZoomSize(el);
    }
    
    Tegaki.layersCnt.style.overflow = level === 1 ? 'hidden' : 'auto'; // Chrome
    
    Tegaki.updateFlatCtx();
  },
  
  updateCanvasZoomSize: function(el) {
    el.style.width = Tegaki.baseWidth * Tegaki.zoomLevel + 'px';
    el.style.height = Tegaki.baseHeight * Tegaki.zoomLevel + 'px';
  },
  
  onZoomChange: function() {
    this.previousElementSibling.setAttribute('data-value', this.value);
    Tegaki.setZoom(+this.value);
  },
  
  onNewClick: function() {
    var width, height, tmp;
    
    width = prompt(TegakiStrings.promptWidth, Tegaki.canvas.width);
    if (!width) { return; }
    
    height = prompt(TegakiStrings.promptHeight, Tegaki.canvas.height);
    if (!height) { return; }
    
    width = +width;
    height = +height;
    
    if (width < 1 || height < 1) {
      alert(TegakiStrings.badDimensions);
      return;
    }
    
    tmp = {};
    Tegaki.copyContextState(Tegaki.activeCtx, tmp);
    Tegaki.resizeCanvas(width, height);
    Tegaki.copyContextState(tmp, Tegaki.activeCtx);
    
    TegakiHistory.clear();
    Tegaki.centerCnt();
    Tegaki.updatePosOffset();
  },
  
  onUndoClick: function() {
    TegakiHistory.undo();
  },
  
  onRedoClick: function() {
    TegakiHistory.redo();
  },
  
  onDoneClick: function() {
    Tegaki.hide();
    Tegaki.onDoneCb();
  },
  
  onCancelClick: function() {
    if (!confirm(TegakiStrings.confirmCancel)) {
      return;
    }
    
    Tegaki.destroy();
    Tegaki.onCancelCb();
  },
  
  onColorChange: function() {
    Tegaki.setToolColor(this.value);
  },
  
  onSizeChange: function() {
    this.previousElementSibling.setAttribute('data-value', this.value);
    Tegaki.setToolSize(+this.value);
  },
  
  onAlphaChange: function() {
    this.previousElementSibling.setAttribute('data-value', this.value);
    Tegaki.setToolAlpha(+this.value);
  },
  
  onLayerChange: function() {
    var selectedOptions = T$.selectedOptions(this);
    
    if (selectedOptions.length > 1) {
      Tegaki.activeLayer = null;
    }
    else {
      Tegaki.setActiveLayer(+this.value);
    }
  },
  
  onLayerAdd: function() {
    TegakiHistory.push(Tegaki.addLayer());
    Tegaki.setActiveLayer();
  },
  
  onLayerDelete: function() {
    var i, ary, sel, opt, selectedOptions, action;
    
    sel = T$.id('tegaki-layer');
    
    selectedOptions = T$.selectedOptions(sel);
    
    if (Tegaki.layers.length === selectedOptions.length) {
      return;
    }
    
    if (!confirm(TegakiStrings.confirmDelLayers)) {
      return;
    }
    
    if (selectedOptions.length > 1) {
      ary = [];
      
      for (i = 0; opt = selectedOptions[i]; ++i) {
        ary.push(+opt.value);
      }
    }
    else {
      ary = [+sel.value];
    }
    
    action = Tegaki.deleteLayers(ary);
    
    TegakiHistory.push(action);
  },
  
  onLayerVisibilityChange: function() {
    var i, ary, sel, opt, flag, selectedOptions;
    
    sel = T$.id('tegaki-layer');
    
    selectedOptions = T$.selectedOptions(sel);
    
    if (selectedOptions.length > 1) {
      ary = [];
      
      for (i = 0; opt = selectedOptions[i]; ++i) {
        ary.push(+opt.value);
      }
    }
    else {
      ary = [+sel.value];
    }
    
    flag = !Tegaki.getLayerById(ary[0]).visible;
    
    Tegaki.setLayerVisibility(ary, flag);
  },
  
  onMergeLayers: function() {
    var i, ary, sel, opt, selectedOptions, action;
    
    sel = T$.id('tegaki-layer');
    
    selectedOptions = T$.selectedOptions(sel);
    
    if (selectedOptions.length > 1) {
      ary = [];
      
      for (i = 0; opt = selectedOptions[i]; ++i) {
        ary.push(+opt.value);
      }
    }
    else {
      ary = [+sel.value];
    }
    
    if (ary.length < 2) {
      alert(TegakiStrings.errorMergeOneLayer);
      return;
    }
    
    if (!confirm(TegakiStrings.confirmMergeLayers)) {
      return;
    }
    
    action = Tegaki.mergeLayers(ary);
    
    TegakiHistory.push(action);
  },
  
  onMoveLayer: function(e) {
    var id, action, sel;
    
    sel = T$.id('tegaki-layer');
    
    id = +sel.options[sel.selectedIndex].value;
    
    if (action = Tegaki.moveLayer(id, e.target.hasAttribute('data-up'))) {
      TegakiHistory.push(action);
    }
  },
  
  onToolChange: function() {
    Tegaki.setTool(this.value);
    Tegaki.updateUI();
    Tegaki.updateCursorStatus();
  },
  
  onCanvasSelected: function() {
    var img;
    
    if (!confirm(TegakiStrings.confirmChangeCanvas)) {
      this.selectedIndex = +this.getAttribute('data-current');
      return;
    }
    
    if (this.value === '0') {
      Tegaki.ctx.fillStyle = Tegaki.bgColor;
      Tegaki.ctx.fillRect(0, 0, Tegaki.baseWidth, Tegaki.baseHeight);
    }
    else {
      img = T$.el('img');
      img.onload = Tegaki.onImageLoaded;
      img.onerror = Tegaki.onImageError;
      this.disabled = true;
      img.src = this.value;
    }
  },
  
  onImageLoaded: function() {
    var el, tmp = {};
    
    el = T$.id('tegaki-canvas-select');
    el.setAttribute('data-current', el.selectedIndex);
    el.disabled = false;
    
    Tegaki.copyContextState(Tegaki.activeCtx, tmp);
    Tegaki.resizeCanvas(this.naturalWidth, this.naturalHeight);
    Tegaki.activeCtx.drawImage(this, 0, 0);
    Tegaki.copyContextState(tmp, Tegaki.activeCtx);
    
    TegakiHistory.clear();
    Tegaki.centerCnt();
    Tegaki.updatePosOffset();
  },
  
  onImageError: function() {
    var el;
    
    el = T$.id('tegaki-canvas-select');
    el.selectedIndex = +el.getAttribute('data-current');
    el.disabled = false;
    
    alert(TegakiStrings.errorLoadImage);
  },
  
  resizeCanvas: function(width, height) {
    var i, layer;
    
    Tegaki.baseWidth = width;
    Tegaki.baseHeight = height;
    
    Tegaki.canvas.width = width;
    Tegaki.canvas.height = height;
    Tegaki.ghostCanvas.width = width;
    Tegaki.ghostCanvas.height = height;
    Tegaki.cursorCanvas.width = width;
    Tegaki.cursorCanvas.height = height;
    
    Tegaki.ctx.fillStyle = Tegaki.bgColor;
    Tegaki.ctx.fillRect(0, 0, width, height);
    
    for (i = 0; layer = Tegaki.layers[i]; ++i) {
      Tegaki.layersCnt.removeChild(layer.canvas);
    }
    
    Tegaki.activeCtx = null;
    Tegaki.layers = [];
    Tegaki.layerIndex = 0;
    T$.id('tegaki-layer').textContent = '';
    
    Tegaki.setZoom(1);
    Tegaki.updateUI('zoom');
    
    Tegaki.addLayer();
    Tegaki.setActiveLayer();
    Tegaki.updateFlatCtx();
  },
  
  getLayerIndex: function(id) {
    var i, layer, layers = Tegaki.layers;
    
    for (i = 0; layer = layers[i]; ++i) {
      if (layer.id === id) {
        return i;
      }
    }
    
    return -1;
  },
  
  getLayerById: function(id) {
    return Tegaki.layers[Tegaki.getLayerIndex(id)];
  },
  
  addLayer: function() {
    var id, cnt, opt, canvas, layer, nodes, last;
    
    canvas = T$.el('canvas');
    canvas.className = 'tegaki-layer';
    canvas.width = Tegaki.canvas.width;
    canvas.height = Tegaki.canvas.height;
    
    id = ++Tegaki.layerIndex;
    
    layer = {
      id: id,
      name: 'Layer ' + id,
      canvas: canvas,
      ctx: canvas.getContext('2d'),
      visible: true,
      empty: true,
      opacity: 1.0
    };
    
    Tegaki.layers.push(layer);
    
    cnt = T$.id('tegaki-layer');
    opt = T$.el('option');
    opt.value = layer.id;
    opt.textContent = layer.name;
    cnt.insertBefore(opt, cnt.firstElementChild);
    
    nodes = T$.cls('tegaki-layer', Tegaki.layersCnt);
    
    if (nodes.length) {
      last = nodes[nodes.length - 1];
    }
    else {
      last = Tegaki.canvas;
    }
    
    Tegaki.updateCanvasZoomSize(canvas);
    
    Tegaki.layersCnt.insertBefore(canvas, last.nextElementSibling);
    
    return new TegakiHistoryActions.AddLayer(id);
  },
  
  deleteLayers: function(ids) {
    var i, id, len, sel, idx, indices, layers;
    
    sel = T$.id('tegaki-layer');
    
    indices = [];
    layers = [];
    
    for (i = 0, len = ids.length; i < len; ++i) {
      id = ids[i];
      idx = Tegaki.getLayerIndex(id);
      sel.removeChild(sel.options[Tegaki.layers.length - 1 - idx]);
      Tegaki.layersCnt.removeChild(Tegaki.layers[idx].canvas);
      
      indices.push(idx);
      layers.push(Tegaki.layers[idx]);
      
      Tegaki.layers.splice(idx, 1);
    }
    
    Tegaki.setActiveLayer();
    
    return new TegakiHistoryActions.DestroyLayers(indices, layers);
  },
  
  mergeLayers: function(ids) {
    var i, id, sel, idx, canvasBefore, destId, dest, action;
    
    sel = T$.id('tegaki-layer');
    
    destId = ids.pop();
    idx = Tegaki.getLayerIndex(destId);
    dest = Tegaki.layers[idx].ctx;
    
    canvasBefore = T$.copyCanvas(Tegaki.layers[idx].canvas);
    
    for (i = ids.length - 1; i >= 0; i--) {
      id = ids[i];
      idx = Tegaki.getLayerIndex(id);
      dest.drawImage(Tegaki.layers[idx].canvas, 0, 0);
    }
    
    action = Tegaki.deleteLayers(ids);
    action.layerId = destId;
    action.canvasBefore = canvasBefore;
    action.canvasAfter = T$.copyCanvas(dest.canvas);
    
    Tegaki.setActiveLayer(destId);
    
    return action;
  },
  
  moveLayer: function(id, up) {
    var idx, sel, opt, canvas, tmp, tmpId;
    
    sel = T$.id('tegaki-layer');
    idx = Tegaki.getLayerIndex(id);
    
    canvas = Tegaki.layers[idx].canvas;
    opt = sel.options[Tegaki.layers.length - 1 - idx];
    
    if (up) {
      if (!Tegaki.ghostCanvas.nextElementSibling) { return false; }
      canvas.parentNode.insertBefore(canvas,
        Tegaki.ghostCanvas.nextElementSibling.nextElementSibling
      );
      opt.parentNode.insertBefore(opt, opt.previousElementSibling);
      tmpId = idx + 1;
    }
    else {
      if (canvas.previousElementSibling.id === 'tegaki-canvas') { return false; }
      canvas.parentNode.insertBefore(canvas, canvas.previousElementSibling);
      opt.parentNode.insertBefore(opt, opt.nextElementSibling.nextElementSibling);
      tmpId = idx - 1;
    }
    
    Tegaki.updateGhostLayerPos();
    
    tmp = Tegaki.layers[tmpId];
    Tegaki.layers[tmpId] = Tegaki.layers[idx];
    Tegaki.layers[idx] = tmp;
    
    Tegaki.activeLayer = tmpId;
    
    return new TegakiHistoryActions.MoveLayer(id, up);
  },
  
  setLayerVisibility: function(ids, flag) {
    var i, len, sel, idx, layer, optIdx;
    
    sel = T$.id('tegaki-layer');
    optIdx = Tegaki.layers.length - 1;
    
    for (i = 0, len = ids.length; i < len; ++i) {
      idx = Tegaki.getLayerIndex(ids[i]);
      layer = Tegaki.layers[idx];
      layer.visible = flag;
      
      if (flag) {
        sel.options[optIdx - idx].classList.remove('tegaki-strike');
        layer.canvas.classList.remove('tegaki-hidden');
      }
      else {
        sel.options[optIdx - idx].classList.add('tegaki-strike');
        layer.canvas.classList.add('tegaki-hidden');
      }
    }
  },
  
  setActiveLayer: function(id) {
    var ctx, idx;
    
    idx = id ? Tegaki.getLayerIndex(id) : Tegaki.layers.length - 1;
    
    if (idx < 0 || idx > Tegaki.maxLayers) {
      return;
    }
    
    ctx = Tegaki.layers[idx].ctx;
    
    if (Tegaki.activeCtx) {
      Tegaki.copyContextState(Tegaki.activeCtx, ctx);
    }
    
    Tegaki.activeCtx = ctx;
    Tegaki.activeLayer = idx;
    T$.id('tegaki-layer').selectedIndex = Tegaki.layers.length - idx - 1;
    
    Tegaki.updateGhostLayerPos();
  },
  
  updateGhostLayerPos: function() {
    Tegaki.layersCnt.insertBefore(
      Tegaki.ghostCanvas,
      Tegaki.activeCtx.canvas.nextElementSibling
    );
  },
  
  clearCtx: function(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  },
  
  updateFlatCtx: function() {
    Tegaki.flatten(Tegaki.flatCtx);
  },
  
  copyContextState: function(src, dest) {
    var i, p, props = [
      'lineCap', 'lineJoin', 'strokeStyle', 'fillStyle', 'globalAlpha',
      'lineWidth', 'globalCompositeOperation'
    ];
    
    for (i = 0; p = props[i]; ++i) {
      dest[p] = src[p];
    }
  },
  
  updateCursorStatus: function() {
    if (Tegaki.tool.noCursor || Tegaki.tool.size < 2) {
      Tegaki.cursor = false;
      Tegaki.clearCtx(Tegaki.cursorCtx);
      return;
    }
    
    Tegaki.cursor = true;
  },
  
  updatePosOffset: function() {
    var aabb = Tegaki.canvas.getBoundingClientRect();
    
    Tegaki.offsetX = aabb.left + window.pageXOffset
      + Tegaki.cnt.scrollLeft + Tegaki.layersCnt.scrollLeft;
    Tegaki.offsetY = aabb.top + window.pageYOffset
      + Tegaki.cnt.scrollTop + Tegaki.layersCnt.scrollTop;
  },
  
  onMouseMove: function(e) {
    if (Tegaki.isPainting) {
      Tegaki.tool.draw(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
    }
    else if (Tegaki.isColorPicking) {
      TegakiPipette.draw(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
    }
    else if (Tegaki.cursor) {
      Tegaki.renderCursor(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
    }
  },
  
  onMouseDown: function(e) {
    if (e.target.parentNode === Tegaki.layersCnt) {
      if (Tegaki.activeLayer === null) {
        alert(TegakiStrings.noActiveLayer);
        return;
      }
      if (!Tegaki.layers[Tegaki.activeLayer].visible) {
        alert(TegakiStrings.hiddenActiveLayer);
        return;
      }
    }
    else if (e.target !== Tegaki.bg) {
      return;
    }
    
    if (e.which === 3 || e.altKey) {
      e.preventDefault();
      
      Tegaki.isColorPicking = true;
      
      TegakiPipette.draw(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
    }
    else if (e.which === 1) {
      e.preventDefault();
      
      Tegaki.isPainting = true;
      
      Tegaki.clearCtx(Tegaki.cursorCtx);
      
      TegakiHistory.pendingAction = new TegakiHistoryActions.Draw(
        Tegaki.layers[Tegaki.activeLayer].id
      );
      
      TegakiHistory.pendingAction.addCanvasState(Tegaki.activeCtx.canvas, 0);
      
      Tegaki.tool.draw(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1), true);
    }
  },
  
  onMouseUp: function(e) {
    if (Tegaki.isPainting) {
      Tegaki.tool.commit && Tegaki.tool.commit();
      TegakiHistory.pendingAction.addCanvasState(Tegaki.activeCtx.canvas, 1);
      TegakiHistory.push(TegakiHistory.pendingAction);
      Tegaki.isPainting = false;
      Tegaki.updateFlatCtx();
    }
    else if (Tegaki.isColorPicking) {
      e.preventDefault();
      Tegaki.isColorPicking = false;
    }
  },
  
  onDummy: function(e) {
    e.preventDefault();
    e.stopPropagation();
  }
};
