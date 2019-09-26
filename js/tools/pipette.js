var TegakiPipette;

TegakiPipette = {
  name: 'pipette',
  
  keybind: 'i',
  
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
  },
  
  set: function() {
    Tegaki.onToolChanged(this);
  }
};
