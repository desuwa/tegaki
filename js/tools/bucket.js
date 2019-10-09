class TegakiBucket extends TegakiTool {
  constructor() {
    super();
    
    this.name = 'bucket';
    
    this.keybind = 'g';
    
    this.step = 100.0;
    
    this.size = 1;
    
    this.noCursor = true;
  }
  
  fill(srcId, destId, x, y, color, alpha) {
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
  }
  
  brushFn(x, y) {
    var aCtx, gCtx, w, h, srcId, destId, el;
    
    x = 0 | x;
    y = 0 | y;
    
    aCtx = Tegaki.activeCtx;
    
    w = aCtx.canvas.width;
    h = aCtx.canvas.height;
    
    if (x < 0 || y < 0 || x >= w || y >= h) {
      return;
    }
    
    el = $T.el('canvas');
    el.width = w;
    el.height = h;
    
    gCtx = el.getContext('2d');
    
    srcId = aCtx.getImageData(0, 0, w, h);
    destId = gCtx.getImageData(0, 0, w, h);
    
    this.fill(srcId, destId, x, y, this.rgb, this.alpha);
    
    gCtx.putImageData(destId, 0, 0);
    
    Tegaki.activeCtx.drawImage(el, 0, 0);
  }
  
  setPixel(data, px, r, g, b, a) {
    data[px] = r; ++px;
    data[px] = g; ++px;
    data[px] = b; ++px;
    data[px] = a;
  }
  
  testPixel(data, px, pxMap, tr, tg, tb, ta) {
    return !pxMap[px] && (data[px] == tr
      && data[++px] == tg
      && data[++px] == tb
      && data[++px] == ta)
    ;
  }
  
  start(x, y) {
    this.brushFn(x, y);
  }
  
  draw(x, y) {
    this.brushFn(x, y);
  }
  
  setSize(size) {}
}
