class TegakiTool {
  constructor() {
    this.name = null;
    
    this.keybind = null;
    
    this.useSizeDynamics = false;
    this.useAlphaDynamics = false;
    this.usePreserveAlpha = false;
    
    this.step = 0.0;
    
    this.size = 1;
    this.alpha = 1.0;
    
    this.noCursor = false;
    
    this.color = '#000000';
    this.rgb = [0, 0, 0];
    
    this.brushSize = 0;
    this.brushAlpha = 0;
    this.stepSize = 0.0;
    this.center = 0.0;
    
    this.sizeDynamicsEnabled = false;
    this.alphaDynamicsEnabled = false;
    this.preserveAlphaEnabled = false;
    
    this.tip = null;
    this.tipList = null;
    
    this.shapeCache = null;
    
    this.kernel = null;
  }
  
  brushFn(x, y, offsetX, offsetY) {}
  
  start(posX, posY) {}
  
  commit() {}
  
  draw(posX, posY) {}
  
  setSize(size) {
    this.size = size;
  }
  
  setAlpha(alpha) {
    this.alpha = alpha;
    this.brushAlpha = alpha;
  }
  
  setColor(hex) {
    this.rgb = $T.hexToRgb(hex);
  }
  
  setSizeDynamics(flag) {
    this.sizeDynamicsEnabled = flag;
  }
  
  setAlphaDynamics(flag) {
    this.alphaDynamicsEnabled = flag;
  }
  
  setPreserveAlpha(flag) {
    this.preserveAlphaEnabled = flag;
  }
  
  set() {
    this.setAlpha(this.alpha);
    this.setSize(this.size);
    this.setColor(Tegaki.toolColor);
    
    Tegaki.onToolChanged(this);
  }
}
