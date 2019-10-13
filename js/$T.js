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
