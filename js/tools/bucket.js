class TegakiBucket extends TegakiTool {
  constructor() {
    super();
    
    this.id = 4;
    
    this.name = 'bucket';
    
    this.keybind = 'g';
    
    this.step = 100.0;
    
    this.useSize = false;
    this.useFlow = false;
    
    this.noCursor = true;
  }
  
  fill(imageData, x, y, color, alpha) {
    var r, g, b, px, tr, tg, tb, ta, q, pxMap, yy, xx, yn, ys,
      yyy, yyn, yys, xd, data, w, h;
    
    w = imageData.width;
    h = imageData.height;
    
    r = color[0];
    g = color[1];
    b = color[2];
    
    px = (y * w + x) * 4;
    
    data = imageData.data;
    
    tr = data[px];
    tg = data[px + 1];
    tb = data[px + 2];
    ta = data[px + 3];
    
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
        
        if (!this.testPixel(data, px, pxMap, tr, tg, tb, ta)) {
          break;
        }
        
        this.blendPixel(data, px, r, g, b, alpha);
        
        pxMap[px] = 1;
        
        if (yn >= 0) {
          px = (yyn + xd) * 4;
          
          if (this.testPixel(data, px, pxMap, tr, tg, tb, ta)) {
            q.push(xd);
            q.push(yn);
          }
        }
        
        if (ys < h) {
          px = (yys + xd) * 4;
          
          if (this.testPixel(data, px, pxMap, tr, tg, tb, ta)) {
            q.push(xd);
            q.push(ys);
          }
        }
        
        xd--;
      }
      
      xd = xx + 1;
      
      while (xd < w) {
        px = (yyy + xd) * 4;
        
        if (!this.testPixel(data, px, pxMap, tr, tg, tb, ta)) {
          break;
        }
        
        this.blendPixel(data, px, r, g, b, alpha);
        
        pxMap[px] = 1;
        
        if (yn >= 0) {
          px = (yyn + xd) * 4;
          
          if (this.testPixel(data, px, pxMap, tr, tg, tb, ta)) {
            q.push(xd);
            q.push(yn);
          }
        }
        
        if (ys < h) {
          px = (yys + xd) * 4;
          
          if (this.testPixel(data, px, pxMap, tr, tg, tb, ta)) {
            q.push(xd);
            q.push(ys);
          }
        }
        
        ++xd;
      }
    }
  }
  
  brushFn(x, y) {
    if (x < 0 || y < 0 || x >= Tegaki.baseWidth || y >= Tegaki.baseHeight) {
      return;
    }
    
    this.fill(Tegaki.activeLayer.imageData, x, y, this.rgb, this.alpha);
    
    // TODO: write back only the tainted rect
    Tegaki.activeLayer.ctx.putImageData(Tegaki.activeLayer.imageData, 0, 0);
  }
  
  blendPixel(data, px, r, g, b, a) {
    var sr, sg, sb, sa, dr, dg, db, da;
    
    sr = data[px];
    sg = data[px + 1];
    sb = data[px + 2];
    sa = data[px + 3] / 255;
    
    da = sa + a - sa * a;
    
    dr = ((r * a) + (sr * sa) * (1 - a)) / da;
    dg = ((g * a) + (sg * sa) * (1 - a)) / da;
    db = ((b * a) + (sb * sa) * (1 - a)) / da;
    
    data[px] = (r > sr) ? Math.ceil(dr) : Math.floor(dr);
    data[px + 1] = (g > sg) ? Math.ceil(dg) : Math.floor(dg);
    data[px + 2] = (b > sb) ? Math.ceil(db) : Math.floor(db);
    data[px + 3] = Math.ceil(da * 255);
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
