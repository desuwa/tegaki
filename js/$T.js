var $T;

$T = {
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
  
  HsvToRgb: function(h, s, v) {
    var r, g, b, i, f, p, q, t;
    
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    
    switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
    }
    
    return [ Math.round(r * 255),  Math.round(g * 255), Math.round(b * 255) ];
  },
  
  RgbToHsv: function(r, g, b) {
    var max, min, d, h, s, v;
    
    max = Math.max(r, g, b);
    min = Math.min(r, g, b);
    d = max - min;
    s = (max === 0 ? 0 : d / max);
    v = max / 255;
    
    switch (max) {
      case min: h = 0; break;
      case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
      case g: h = (b - r) + d * 2; h /= 6 * d; break;
      case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }
    
    return [ h, s, v ];
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
  }
};
