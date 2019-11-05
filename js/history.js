var TegakiHistory = {
  maxSize: 50,
  
  undoStack: [],
  redoStack: [],
  
  pendingAction: null,
  
  clear: function() {
    this.undoStack = [];
    this.redoStack = [];
    this.pendingAction = null;
    
    this.onChange(0);
  },
  
  push: function(action) {
    if (!action) {
      return;
    }
    
    this.undoStack.push(action);
    
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    
    if (this.redoStack.length > 0) {
      this.redoStack = [];
    }
    
    this.onChange(0);
  },
  
  undo: function() {
    var action;
    
    if (!this.undoStack.length) {
      return;
    }
    
    action = this.undoStack.pop();
    
    action.undo();
    
    this.redoStack.push(action);
    
    this.onChange(-1);
  },
  
  redo: function() {
    var action;
    
    if (!this.redoStack.length) {
      return;
    }
    
    action = this.redoStack.pop();
    
    action.redo();
    
    this.undoStack.push(action);
    
    this.onChange(1);
  },
  
  onChange: function(type) {
    Tegaki.onHistoryChange(this.undoStack.length, this.redoStack.length, type);
  },
  
  sortPosLayerCallback: function(a, b) {
    if (a[0] > b[0]) { return 1; }
    if (a[0] < b[0]) { return -1; }
    return 0;
  }
};

var TegakiHistoryActions = {
  Draw: function(layerId) {
    this.imageDataBefore = null;
    this.imageDataAfter = null;
    this.layerId = layerId;
  },
  
  DeleteLayers: function(layerPosMap, params) {
    var item;
    
    this.layerPosMap = [];
    
    for (item of layerPosMap.sort(TegakiHistory.sortPosLayerCallback)) {
      item[1] = TegakiLayers.cloneLayer(item[1]);
      this.layerPosMap.push(item);
    }
    
    this.tgtLayerId = null;
    
    this.aLayerIdBefore = null;
    this.aLayerIdAfter = null;
    
    this.imageDataBefore = null;
    this.imageDataAfter = null;
    
    this.mergeDown = false;
    
    if (params) {
      for (let k in params) {
        this[k] = params[k];
      }
    }
  },
  
  AddLayer: function(params, aLayerIdBefore, aLayerIdAfter) {
    this.layer = params;
    this.layerId = params.id;
    this.aLayerIdBefore = aLayerIdBefore;
    this.aLayerIdAfter = aLayerIdAfter;
  },
  
  MoveLayers: function(layers, belowPos, activeLayerId) {
    this.layers = layers;
    this.belowPos = belowPos;
    this.aLayerId = activeLayerId;
  }
};

// ---

TegakiHistoryActions.Draw.prototype.addCanvasState = function(imageData, type) {
  if (type) {
    this.imageDataAfter = $T.copyImageData(imageData);
  }
  else {
    this.imageDataBefore = $T.copyImageData(imageData);
  }
};

TegakiHistoryActions.Draw.prototype.exec = function(type) {
  var layer = TegakiLayers.getLayerById(this.layerId);
  
  if (type) {
    layer.ctx.putImageData(this.imageDataAfter, 0, 0);
    Tegaki.syncLayerImageData(layer, this.imageDataAfter);
  }
  else {
    layer.ctx.putImageData(this.imageDataBefore, 0, 0);
    Tegaki.syncLayerImageData(layer, this.imageDataBefore);
  }
  
  TegakiLayers.setActiveLayer(this.layerId);
};

TegakiHistoryActions.Draw.prototype.undo = function() {
  this.exec(0);
};

TegakiHistoryActions.Draw.prototype.redo = function() {
  this.exec(1);
};

TegakiHistoryActions.DeleteLayers.prototype.undo = function() {
  var i, lim, refLayer, layer, pos, refId;
  
  for (i = 0, lim = this.layerPosMap.length; i < lim; ++i) {
    [pos, layer] = this.layerPosMap[i];
    
    layer = TegakiLayers.cloneLayer(layer);
    
    refLayer = Tegaki.layers[pos];
    
    if (refLayer) {
      if (refId = TegakiLayers.getLayerBelowId(refLayer.id)) {
        refId = refId.id;
      }
      
      TegakiUI.updateLayersGridAdd(layer, refId);
      Tegaki.layersCnt.insertBefore(layer.canvas, refLayer.canvas);
      Tegaki.layers.splice(pos, 0, layer);
    }
    else {
      
      if (!Tegaki.layers[0]) {
        refLayer = Tegaki.layersCnt.children[0];
      }
      else {
        refLayer = Tegaki.layers[Tegaki.layers.length - 1].canvas;
      }
      
      TegakiUI.updateLayersGridAdd(layer, TegakiLayers.getTopLayerId());
      Tegaki.layersCnt.insertBefore(layer.canvas, refLayer.nextElementSibling);
      Tegaki.layers.push(layer);
    }
  }
  
  if (this.tgtLayerId) {
    if (this.imageDataBefore) {
      layer = TegakiLayers.getLayerById(this.tgtLayerId);
      layer.ctx.putImageData(this.imageDataBefore, 0, 0);
      Tegaki.syncLayerImageData(layer, this.imageDataBefore);
    }
  }
  
  TegakiLayers.setActiveLayer(this.aLayerIdBefore);
};

TegakiHistoryActions.DeleteLayers.prototype.redo = function() {
  var layer, ids = [];
  
  for (layer of this.layerPosMap) {
    ids.unshift(layer[1].id);
  }
  
  if (this.tgtLayerId) {
    if (!this.mergeDown) {
      ids.unshift(this.tgtLayerId);
    }
    TegakiLayers.mergeLayers(new Set(ids));
  }
  else {
    TegakiLayers.deleteLayers(ids);
  }
  
  TegakiLayers.setActiveLayer(this.aLayerIdAfter);
};

TegakiHistoryActions.MoveLayers.prototype.undo = function() {
  var i, layer, stack, ref, posMap, len;
  
  stack = new Array(Tegaki.layers.length);
  
  posMap = {};
  
  for (layer of this.layers) {
    posMap[layer[1].id] = layer[0];
  }
  
  for (i = 0, len = Tegaki.layers.length; i < len; ++i) {
    layer = Tegaki.layers[i];
    
    if (posMap[layer.id] !== undefined) {
      Tegaki.layers.splice(i, 1);
      Tegaki.layers.splice(posMap[layer.id], 0, layer);
    }
  }
  
  TegakiUI.updayeLayersGridOrder();
  
  ref = Tegaki.layersCnt.children[0];
  
  for (i = Tegaki.layers.length - 1; i >= 0; i--) {
    layer = Tegaki.layers[i];
    Tegaki.layersCnt.insertBefore(layer.canvas, ref.nextElementSibling);
  }
  
  TegakiLayers.setActiveLayer(this.aLayerId);
};

TegakiHistoryActions.MoveLayers.prototype.redo = function() {
  var layer, layers = new Set();
  
  for (layer of this.layers.slice().reverse()) {
    layers.add(layer[1].id);
  }
  
  TegakiLayers.setActiveLayer(this.aLayerId);
  TegakiLayers.moveLayers(layers, this.belowPos);
};

TegakiHistoryActions.AddLayer.prototype.undo = function() {
  TegakiLayers.deleteLayers([this.layer.id]);
  TegakiLayers.setActiveLayer(this.aLayerIdBefore);
  Tegaki.layerCounter--;
};

TegakiHistoryActions.AddLayer.prototype.redo = function() {
  TegakiLayers.setActiveLayer(this.aLayerIdBefore);
  TegakiLayers.addLayer(this.layer);
  TegakiLayers.setActiveLayer(this.aLayerIdAfter);
};
