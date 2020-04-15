class TegakiEvent_void {
  constructor() {
    this.size = 5;
  }
  
  pack(w) {
    w.writeUint8(this.type);
    w.writeUint32(this.timeStamp);
  }
  
  static unpack(r) {
    return new this(r.readUint32());
  }
}

class TegakiEvent_c {
  constructor() {
    this.size = 6;
  }
  
  pack(w) {
    w.writeUint8(this.type);
    w.writeUint32(this.timeStamp);
    w.writeUint8(this.value);
  }
  
  static unpack(r) {
    return new this(r.readUint32(), r.readUint8());
  }
}

// ---

class TegakiEventPrelude extends TegakiEvent_void {
  constructor(timeStamp) {
    super();
    this.timeStamp = timeStamp;
    this.type = TegakiEvents[this.constructor.name][0];
  }
  
  static unpack(r) { return super.unpack(r); } // FF bug 1628719
  
  dispatch() {}
}

class TegakiEventConclusion extends TegakiEvent_void {
  constructor(timeStamp) {
    super();
    this.timeStamp = timeStamp;
    this.type = TegakiEvents[this.constructor.name][0];
  }
  
  static unpack(r) { return super.unpack(r); } // FF bug 1628719
  
  dispatch() {}
}

class TegakiEventHistoryDummy extends TegakiEvent_void {
  constructor(timeStamp) {
    super();
    this.timeStamp = timeStamp;
    this.type = TegakiEvents[this.constructor.name][0];
  }
  
  static unpack(r) { return super.unpack(r); } // FF bug 1628719
  
  dispatch() {
    TegakiHistory.push(new TegakiHistoryActions.Dummy());
  }
}

class TegakiEventDrawStart {
  constructor(timeStamp, x, y, pressure) {
    this.timeStamp = timeStamp;
    this.x = x;
    this.y = y;
    this.pressure = pressure;
    this.type = TegakiEvents[this.constructor.name][0];
    this.size = 11;
  }
  
  pack(w) {
    w.writeUint8(this.type);
    w.writeUint32(this.timeStamp);
    w.writeInt16(this.x);
    w.writeInt16(this.y);
    w.writeUint16(this.pressure);
  }
  
  static unpack(r) {
    var timeStamp, x, y, pressure;
    
    timeStamp = r.readUint32();
    x = r.readInt16();
    y = r.readInt16();
    pressure = r.readUint16();
    
    return new TegakiEventDrawStart(timeStamp, x, y, pressure);
  }
  
  dispatch() {
    TegakiPressure.set(this.pressure);
    
    TegakiHistory.pendingAction = new TegakiHistoryActions.Draw(
      Tegaki.activeLayer.id
    );
    
    TegakiHistory.pendingAction.addCanvasState(Tegaki.activeLayer.imageData, 0);
    
    Tegaki.tool.start(this.x, this.y);
  }
}

class TegakiEventDrawStartNoP {
  constructor(timeStamp, x, y) {
    this.timeStamp = timeStamp;
    this.x = x;
    this.y = y;
    this.type = TegakiEvents[this.constructor.name][0];
    this.size = 9;
  }
  
  pack(w) {
    w.writeUint8(this.type);
    w.writeUint32(this.timeStamp);
    w.writeInt16(this.x);
    w.writeInt16(this.y);
  }
  
  static unpack(r) {
    var timeStamp, x, y;
    
    timeStamp = r.readUint32();
    x = r.readInt16();
    y = r.readInt16();
    
    return new TegakiEventDrawStartNoP(timeStamp, x, y);
  }
  
  dispatch() {
    TegakiPressure.set(0.5);
    
    TegakiHistory.pendingAction = new TegakiHistoryActions.Draw(
      Tegaki.activeLayer.id
    );
    
    TegakiHistory.pendingAction.addCanvasState(Tegaki.activeLayer.imageData, 0);
    
    Tegaki.tool.start(this.x, this.y);
  }
}

class TegakiEventDraw {
  constructor(timeStamp, x, y, pressure) {
    this.timeStamp = timeStamp;
    this.x = x;
    this.y = y;
    this.pressure = pressure;
    this.type = TegakiEvents[this.constructor.name][0];
    this.size = 11;
  }
  
  pack(w) {
    w.writeUint8(this.type);
    w.writeUint32(this.timeStamp);
    w.writeInt16(this.x);
    w.writeInt16(this.y);
    w.writeUint16(this.pressure);
  }
  
  static unpack(r) {
    var timeStamp, x, y, pressure;
    
    timeStamp = r.readUint32();
    x = r.readInt16();
    y = r.readInt16();
    pressure = r.readUint16();
    
    return new TegakiEventDraw(timeStamp, x, y, pressure);
  }
  
  dispatch() {
    TegakiPressure.push(this.pressure);
    Tegaki.tool.draw(this.x, this.y);
  }
}

class TegakiEventDrawNoP {
  constructor(timeStamp, x, y) {
    this.timeStamp = timeStamp;
    this.x = x;
    this.y = y;
    this.type = TegakiEvents[this.constructor.name][0];
    this.size = 9;
  }
  
  pack(w) {
    w.writeUint8(this.type);
    w.writeUint32(this.timeStamp);
    w.writeInt16(this.x);
    w.writeInt16(this.y);
  }
  
  static unpack(r) {
    var timeStamp, x, y;
    
    timeStamp = r.readUint32();
    x = r.readInt16();
    y = r.readInt16();
    
    return new TegakiEventDraw(timeStamp, x, y);
  }
  
  dispatch() {
    TegakiPressure.push(0.5);
    Tegaki.tool.draw(this.x, this.y);
  }
}

class TegakiEventDrawCommit extends TegakiEvent_void {
  constructor(timeStamp) {
    super();
    this.timeStamp = timeStamp;
    this.type = TegakiEvents[this.constructor.name][0];
  }
  
  static unpack(r) { return super.unpack(r); } // FF bug 1628719
  
  dispatch() {
    Tegaki.tool.commit();
    TegakiUI.updateLayerPreview(Tegaki.activeLayer);
    TegakiHistory.pendingAction.addCanvasState(Tegaki.activeLayer.imageData, 1);
    TegakiHistory.push(TegakiHistory.pendingAction);
    Tegaki.isPainting = false;
  }
}

class TegakiEventUndo extends TegakiEvent_void {
  constructor(timeStamp) {
    super();
    this.timeStamp = timeStamp;
    this.type = TegakiEvents[this.constructor.name][0];
  }
  
  static unpack(r) { return super.unpack(r); } // FF bug 1628719
  
  dispatch() {
    TegakiHistory.undo();
  }
}

class TegakiEventRedo extends TegakiEvent_void {
  constructor(timeStamp) {
    super();
    this.timeStamp = timeStamp;
    this.type = TegakiEvents[this.constructor.name][0];
  }
  
  static unpack(r) { return super.unpack(r); } // FF bug 1628719
  
  dispatch() {
    TegakiHistory.redo();
  }
}

class TegakiEventSetColor {
  constructor(timeStamp, rgb) {
    this.timeStamp = timeStamp;
    [this.r, this.g, this.b] = rgb;
    this.type = TegakiEvents[this.constructor.name][0];
    this.size = 8;
    this.coalesce = true;
  }
  
  pack(w) {
    w.writeUint8(this.type);
    w.writeUint32(this.timeStamp);
    w.writeUint8(this.r);
    w.writeUint8(this.g);
    w.writeUint8(this.b);
  }
  
  static unpack(r) {
    var timeStamp, rgb;
    
    timeStamp = r.readUint32();
    
    rgb = [r.readUint8(), r.readUint8(), r.readUint8()];
    
    return new TegakiEventSetColor(timeStamp, rgb);
  }
  
  dispatch() {
    Tegaki.setToolColorRGB(this.r, this.g, this.b);
  }
}

class TegakiEventSetTool extends TegakiEvent_c {
  constructor(timeStamp, value) {
    super();
    this.timeStamp = timeStamp;
    this.value = value;
    this.type = TegakiEvents[this.constructor.name][0];
    this.coalesce = true;
  }
  
  dispatch() {
    Tegaki.setToolById(this.value);
  }
}

class TegakiEventSetToolSize extends TegakiEvent_c {
  constructor(timeStamp, value) {
    super();
    this.timeStamp = timeStamp;
    this.value = value;
    this.type = TegakiEvents[this.constructor.name][0];
    this.coalesce = true;
  }
  
  dispatch() {
    Tegaki.setToolSize(this.value);
  }
}

class TegakiEventSetToolAlpha {
  constructor(timeStamp, value) {
    this.timeStamp = timeStamp;
    this.value = value;
    this.type = TegakiEvents[this.constructor.name][0];
    this.coalesce = true;
    this.size = 9;
  }
  
  pack(w) {
    w.writeUint8(this.type);
    w.writeUint32(this.timeStamp);
    w.writeFloat32(this.value);
  }
  
  static unpack(r) {
    return new this(r.readUint32(), r.readFloat32());
  }
  
  dispatch() {
    Tegaki.setToolAlpha(this.value);
  }
}

class TegakiEventSetToolFlow {
  constructor(timeStamp, value) {
    this.timeStamp = timeStamp;
    this.value = value;
    this.type = TegakiEvents[this.constructor.name][0];
    this.coalesce = true;
    this.size = 9;
  }
  
  pack(w) {
    w.writeUint8(this.type);
    w.writeUint32(this.timeStamp);
    w.writeFloat32(this.value);
  }
  
  static unpack(r) {
    return new this(r.readUint32(), r.readFloat32());
  }
  
  dispatch() {
    Tegaki.setToolFlow(this.value);
  }
}

class TegakiEventPreserveAlpha extends TegakiEvent_c {
  constructor(timeStamp, value) {
    super();
    this.timeStamp = timeStamp;
    this.value = value;
    this.type = TegakiEvents[this.constructor.name][0];
    this.coalesce = true;
  }
  
  dispatch() {
    Tegaki.setToolPreserveAlpha(!!this.value);
  }
}

class TegakiEventSetToolSizeDynamics extends TegakiEvent_c {
  constructor(timeStamp, value) {
    super();
    this.timeStamp = timeStamp;
    this.value = value;
    this.type = TegakiEvents[this.constructor.name][0];
    this.coalesce = true;
  }
  
  dispatch() {
    Tegaki.setToolSizeDynamics(!!this.value);
  }
}

class TegakiEventSetToolAlphaDynamics extends TegakiEvent_c {
  constructor(timeStamp, value) {
    super();
    this.timeStamp = timeStamp;
    this.value = value;
    this.type = TegakiEvents[this.constructor.name][0];
    this.coalesce = true;
  }
  
  dispatch() {
    Tegaki.setToolAlphaDynamics(!!this.value);
  }
}

class TegakiEventSetToolFlowDynamics extends TegakiEvent_c {
  constructor(timeStamp, value) {
    super();
    this.timeStamp = timeStamp;
    this.value = value;
    this.type = TegakiEvents[this.constructor.name][0];
    this.coalesce = true;
  }
  
  dispatch() {
    Tegaki.setToolFlowDynamics(!!this.value);
  }
}

class TegakiEventSetToolTip extends TegakiEvent_c {
  constructor(timeStamp, value) {
    super();
    this.timeStamp = timeStamp;
    this.value = value;
    this.type = TegakiEvents[this.constructor.name][0];
    this.coalesce = true;
  }
  
  dispatch() {
    Tegaki.setToolTip(this.value);
  }
}

class TegakiEventAddLayer extends TegakiEvent_void {
  constructor(timeStamp) {
    super();
    this.timeStamp = timeStamp;
    this.type = TegakiEvents[this.constructor.name][0];
  }
  
  static unpack(r) { return super.unpack(r); } // FF bug 1628719
  
  dispatch() {
    Tegaki.addLayer();
  }
}

class TegakiEventDeleteLayers extends TegakiEvent_void {
  constructor(timeStamp) {
    super();
    this.timeStamp = timeStamp;
    this.type = TegakiEvents[this.constructor.name][0];
  }
  
  static unpack(r) { return super.unpack(r); } // FF bug 1628719
  
  dispatch() {
    Tegaki.deleteSelectedLayers();
  }
}

class TegakiEventMoveLayers extends TegakiEvent_c {
  constructor(timeStamp, value) {
    super();
    this.timeStamp = timeStamp;
    this.value = value;
    this.type = TegakiEvents[this.constructor.name][0];
  }
  
  dispatch() {
    Tegaki.moveSelectedLayers(this.value);
  }
}

class TegakiEventMergeLayers extends TegakiEvent_void {
  constructor(timeStamp) {
    super();
    this.timeStamp = timeStamp;
    this.type = TegakiEvents[this.constructor.name][0];
  }
  
  static unpack(r) { return super.unpack(r); } // FF bug 1628719
  
  dispatch() {
    Tegaki.mergeSelectedLayers();
  }
}

class TegakiEventToggleLayerVisibility extends TegakiEvent_c {
  constructor(timeStamp, value) {
    super();
    this.timeStamp = timeStamp;
    this.value = value;
    this.type = TegakiEvents[this.constructor.name][0];
  }
  
  dispatch() {
    Tegaki.toggleLayerVisibility(this.value);
  }
}

class TegakiEventSetActiveLayer extends TegakiEvent_c {
  constructor(timeStamp, value) {
    super();
    this.timeStamp = timeStamp;
    this.value = value;
    this.type = TegakiEvents[this.constructor.name][0];
  }
  
  dispatch() {
    Tegaki.setActiveLayer(this.value);
  }
}

class TegakiEventToggleLayerSelection extends TegakiEvent_c {
  constructor(timeStamp, value) {
    super();
    this.timeStamp = timeStamp;
    this.value = value;
    this.type = TegakiEvents[this.constructor.name][0];
  }
  
  dispatch() {
    Tegaki.toggleSelectedLayer(this.value);
  }
}

class TegakiEventSetSelectedLayersAlpha {
  constructor(timeStamp, value) {
    this.timeStamp = timeStamp;
    this.value = value;
    this.type = TegakiEvents[this.constructor.name][0];
    this.coalesce = true;
    this.size = 9;
  }
  
  pack(w) {
    w.writeUint8(this.type);
    w.writeUint32(this.timeStamp);
    w.writeFloat32(this.value);
  }
  
  static unpack(r) {
    return new this(r.readUint32(), r.readFloat32());
  }
  
  dispatch() {
    Tegaki.setSelectedLayersAlpha(this.value);
  }
}

const TegakiEvents = Object.freeze({
  TegakiEventPrelude:                 [0,   TegakiEventPrelude],
  
  TegakiEventDrawStart:               [1,   TegakiEventDrawStart],
  TegakiEventDraw:                    [2,   TegakiEventDraw],
  TegakiEventDrawCommit:              [3,   TegakiEventDrawCommit],
  TegakiEventUndo:                    [4,   TegakiEventUndo],
  TegakiEventRedo:                    [5,   TegakiEventRedo],
  TegakiEventSetColor:                [6,   TegakiEventSetColor],
  TegakiEventDrawStartNoP:            [7,   TegakiEventDrawStartNoP],
  TegakiEventDrawNoP:                 [8,   TegakiEventDrawNoP],

  TegakiEventSetTool:                 [10,  TegakiEventSetTool],
  TegakiEventSetToolSize:             [11,  TegakiEventSetToolSize],
  TegakiEventSetToolAlpha:            [12,  TegakiEventSetToolAlpha],
  TegakiEventSetToolSizeDynamics:     [13,  TegakiEventSetToolSizeDynamics],
  TegakiEventSetToolAlphaDynamics:    [14,  TegakiEventSetToolAlphaDynamics],
  TegakiEventSetToolTip:              [15,  TegakiEventSetToolTip],
  TegakiEventPreserveAlpha:           [16,  TegakiEventPreserveAlpha],
  TegakiEventSetToolFlowDynamics:     [17,  TegakiEventSetToolFlowDynamics],
  TegakiEventSetToolFlow:             [18,  TegakiEventSetToolFlow],

  TegakiEventAddLayer:                [20,  TegakiEventAddLayer],
  TegakiEventDeleteLayers:            [21,  TegakiEventDeleteLayers],
  TegakiEventMoveLayers:              [22,  TegakiEventMoveLayers],
  TegakiEventMergeLayers:             [23,  TegakiEventMergeLayers],
  TegakiEventToggleLayerVisibility:   [24,  TegakiEventToggleLayerVisibility],
  TegakiEventSetActiveLayer:          [25,  TegakiEventSetActiveLayer],
  TegakiEventToggleLayerSelection:    [26,  TegakiEventToggleLayerSelection],
  TegakiEventSetSelectedLayersAlpha:  [27,  TegakiEventSetSelectedLayersAlpha],
  
  TegakiEventHistoryDummy:            [254,  TegakiEventHistoryDummy],
  
  TegakiEventConclusion:              [255, TegakiEventConclusion]
});
