var $T = {
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
  
  copyImageData(imageData) {
    return new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width
    );
  },
  
  copyCanvas: function(source, clone) {
    var canvas;
    
    if (!clone) {
      canvas = $T.el('canvas');
      canvas.width = source.width;
      canvas.height = source.height;
    }
    else {
      canvas = source.cloneNode(false);
    }
    
    canvas.getContext('2d').drawImage(source, 0, 0);
    
    return canvas;
  },
  
  clearCtx: function(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
  
  RgbToHex: function(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) +  (g << 8) + b).toString(16).slice(1);
  },
  
  getColorAt: function(ctx, posX, posY) {
    var rgba = ctx.getImageData(posX, posY, 1, 1).data;
    
    return '#'
      + ('0' + rgba[0].toString(16)).slice(-2)
      + ('0' + rgba[1].toString(16)).slice(-2)
      + ('0' + rgba[2].toString(16)).slice(-2);
  },
  
  generateFilename: function() {
    return 'tegaki_' + (new Date()).toISOString().split('.')[0].replace(/[^0-9]/g, '_');
  },
  
  sortAscCb: function(a, b) {
    if (a > b) { return 1; }
    if (a < b) { return -1; }
    return 0;
  },
  
  sortDescCb: function(a, b) {
    if (a > b) { return -1; }
    if (a < b) { return 1; }
    return 0;
  },
  
  msToHms: function(ms) {
    var h, m, s, ary;
    
    s = 0 | (ms / 1000);
    h = 0 | (s / 3600);
    m = 0 | ((s - h * 3600) / 60);
    s = s - h * 3600 - m * 60;
    
    ary = [];
    
    if (h) {
      ary.push(h < 10 ? ('0' + h) : h);
    }
    
    if (m) {
      ary.push(m < 10 ? ('0' + m) : m);
    }
    else {
      ary.push('00');
    }
    
    if (s) {
      ary.push(s < 10 ? ('0' + s) : s);
    }
    else {
      ary.push('00');
    }
    
    return ary.join(':');
  },
  
  calcThumbSize(w, h, maxSide) {
    var r;
    
    if (w > maxSide) {
      r = maxSide / w;
      w = maxSide;
      h = h * r;
    }
    
    if (h > maxSide) {
      r = maxSide / h;
      h = maxSide;
      w = w * r;
    }
    
    return [Math.ceil(w), Math.ceil(h)];
  }
};
