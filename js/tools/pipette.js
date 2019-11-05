class TegakiPipette extends TegakiTool {
  constructor() {
    super();
    
    this.id = 6;
    
    this.name = 'pipette';
    
    this.keybind = 'i';
    
    this.step = 100.0;
    
    this.useSize = false;
    this.useAlpha = false;
    this.useFlow = false;
    
    this.noCursor = true;
  }
  
  start(posX, posY) {
    this.draw(posX, posY);
  }
  
  draw(posX, posY) {
    var c, ctx;
    
    if (true) {
      ctx = Tegaki.flatten().getContext('2d');
    }
    else {
      ctx = Tegaki.activeLayer.ctx;
    }
    
    c = $T.getColorAt(ctx, posX, posY);
    
    Tegaki.setToolColor(c);
  }
  
  set() {
    Tegaki.onToolChanged(this);
  }
  
  commit() {}
  
  setSize() {}
  
  setAlpha() {}
}
