class TegakiTool {
  constructor() {
    this.id = 0;
    
    this.name = null;
    
    this.keybind = null;
    
    this.useFlow = false;
    
    this.useSizeDynamics = false;
    this.useAlphaDynamics = false;
    this.useFlowDynamics = false;
    
    this.usePreserveAlpha = false;
    
    this.step = 0.0;
    
    this.size = 1;
    this.alpha = 1.0;
    this.flow = 1.0;
    
    this.useSize = true;
    this.useAlpha = true;
    this.useFlow = true;
    
    this.noCursor = false;
    
    this.color = '#000000';
    this.rgb = [0, 0, 0];
    
    this.brushSize = 0;
    this.brushAlpha = 0.0;
    this.brushFlow = 0.0;
    this.stepSize = 0.0;
    this.center = 0.0;
    
    this.sizeDynamicsEnabled = false;
    this.alphaDynamicsEnabled = false;
    this.flowDynamicsEnabled = false;
    this.preserveAlphaEnabled = false;
    
    this.tip = -1;
    this.tipList = null;
    
    this.stepAcc = 0;
    
    this.shapeCache = null;
    
    this.kernel = null;
  }
  
  brushFn(x, y, offsetX, offsetY) {}
  
  start(posX, posY) {}
  
  commit() {}
  
  draw(posX, posY) {}
  
  usesDynamics() {
    return this.useSizeDynamics || this.useAlphaDynamics || this.useFlowDynamics;
  }
  
  enabledDynamics() {
    return this.sizeDynamicsEnabled || this.alphaDynamicsEnabled || this.flowDynamicsEnabled;
  }
  
  setSize(size) {
    this.size = size;
  }
  
  setAlpha(alpha) {
    this.alpha = alpha;
    this.brushAlpha = alpha;
  }
  
  setFlow(flow) {
    this.flow = flow;
    this.brushFlow = this.easeFlow(flow);
  }
  
  easeFlow(flow) {
    return flow;
  }
  
  setColor(hex) {
    this.rgb = $T.hexToRgb(hex);
  }
  
  setSizeDynamics(flag) {
    if (!this.useSizeDynamics) {
      return;
    }
    
    if (!flag) {
      this.setSize(this.size);
    }
    
    this.sizeDynamicsEnabled = flag;
  }
  
  setAlphaDynamics(flag) {
    if (!this.useAlphaDynamics) {
      return;
    }
    
    if (!flag) {
      this.setAlpha(this.alpha);
    }
    
    this.alphaDynamicsEnabled = flag;
  }
  
  setFlowDynamics(flag) {
    if (!this.useFlowDynamics) {
      return;
    }
    
    if (!flag) {
      this.setFlow(this.flow);
    }
    
    this.flowDynamicsEnabled = flag;
  }
  
  setPreserveAlpha(flag) {
    this.preserveAlphaEnabled = flag;
  }
  
  set() {
    this.setAlpha(this.alpha);
    this.setFlow(this.flow);
    this.setSize(this.size);
    this.setColor(Tegaki.toolColor);
    
    Tegaki.onToolChanged(this);
  }
}
