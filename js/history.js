var TegakiHistory;

TegakiHistory = {
  maxSize: 50,
  
  undoStack: [],
  redoStack: [],
  
  pendingAction: null,
  
  clear: function() {
    this.undoStack = [];
    this.redoStack = [];
    this.pendingAction = null;
    
    this.onChange();
  },
  
  push: function(action) {
    this.undoStack.push(action);
    
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    
    if (this.redoStack.length > 0) {
      this.redoStack = [];
    }
    
    this.onChange();
  },
  
  undo: function() {
    var action;
    
    if (!this.undoStack.length) {
      return;
    }
    
    action = this.undoStack.pop();
    action.undo();
    
    this.redoStack.push(action);
    
    this.onChange();
  },
  
  redo: function() {
    var action;
    
    if (!this.redoStack.length) {
      return;
    }
    
    action = this.redoStack.pop();
    action.redo();
    
    this.undoStack.push(action);
    
    this.onChange();
  },
  
  onChange: function() {
    Tegaki.onHistoryChange(this.undoStack.length, this.redoStack.length);
  }
};

var TegakiHistoryActions = {
  Draw: function(layerId) {
    this.canvasBefore = null;
    this.canvasAfter = null;
    this.layerId = layerId;
  },
  
  DestroyLayers: function(indices, layers) {
    this.indices = indices;
    this.layers = layers;
    this.canvasBefore = null;
    this.canvasAfter = null;
    this.layerId = null;
  },
  
  AddLayer: function(layerId) {
    this.layerId = layerId;
  },
  
  MoveLayer: function(layerId, up) {
    this.layerId = layerId;
    this.up = up;
  }
};

TegakiHistoryActions.Draw.prototype.addCanvasState = function(canvas, type) {
  if (type) {
    this.canvasAfter = $T.copyCanvas(canvas);
  }
  else {
    this.canvasBefore = $T.copyCanvas(canvas);
  }
};

TegakiHistoryActions.Draw.prototype.exec = function(type) {
  var i, layer;
  
  for (i in Tegaki.layers) {
    layer = Tegaki.layers[i];
    
    if (layer.id === this.layerId) {
      layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      layer.ctx.drawImage(type ? this.canvasAfter: this.canvasBefore, 0, 0);
    }
  }
};

TegakiHistoryActions.Draw.prototype.undo = function() {
  this.exec(0);
};

TegakiHistoryActions.Draw.prototype.redo = function() {
  this.exec(1);
};

TegakiHistoryActions.DestroyLayers.prototype.undo = function() {
  var i, ii, len, layers, idx, layer, frag;
  
  layers = new Array(len);
  
  for (i = 0; (idx = this.indices[i]) !== undefined; ++i) {
    layers[idx] = this.layers[i];
  }
  
  i = ii = 0;
  len = Tegaki.layers.length + this.layers.length;
  frag = $T.frag();
  
  while (i < len) {
    if (!layers[i]) {
      layer = layers[i] = Tegaki.layers[ii];
      Tegaki.layersCnt.removeChild(layer.canvas);
      ++ii;
    }
    
    if (this.layerId && layer.id === this.layerId) {
      layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      layer.ctx.drawImage(this.canvasBefore, 0, 0);
    }
    
    frag.appendChild(layers[i].canvas);
    
    ++i;
  }
  
  Tegaki.layersCnt.insertBefore(frag, Tegaki.canvas.nextElementSibling);
  
  Tegaki.layers = layers;
  
  Tegaki.setActiveLayer();
  
  Tegaki.rebuildLayerCtrl();
};

TegakiHistoryActions.DestroyLayers.prototype.redo = function() {
  var i, layer, ids = [];
  
  for (i = 0; layer = this.layers[i]; ++i) {
    ids.push(layer.id);
  }
  
  if (this.layerId) {
    ids.push(this.layerId);
    Tegaki.mergeLayers(ids);
  }
  else {
    Tegaki.deleteLayers(ids);
  }
};

TegakiHistoryActions.MoveLayer.prototype.undo = function() {
  Tegaki.setActiveLayer(this.layerId);
  Tegaki.moveLayer(this.layerId, !this.up);
};

TegakiHistoryActions.MoveLayer.prototype.redo = function() {
  Tegaki.setActiveLayer(this.layerId);
  Tegaki.moveLayer(this.layerId, this.up);
};

TegakiHistoryActions.AddLayer.prototype.undo = function() {
  Tegaki.deleteLayers([this.layerId]);
  Tegaki.layerIndex--;
};

TegakiHistoryActions.AddLayer.prototype.redo = function() {
  Tegaki.addLayer();
  Tegaki.setActiveLayer();
};
