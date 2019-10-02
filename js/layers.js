var TegakiLayers;

TegakiLayers = {
  cloneLayer: function(layer) {
    var newLayer = Object.assign({}, layer);
    
    newLayer.canvas = $T.copyCanvas(layer.canvas, true);
    newLayer.ctx = newLayer.canvas.getContext('2d');
    
    return newLayer;
  },
  
  getCanvasById: function(id) {
    return $T.id('tegaki-canvas-' + id);
  },
  
  getActiveLayer: function() {
    return TegakiLayers.getLayerById(Tegaki.activeLayerId);
  },
  
  getLayerPosById: function(id) {
    var i, layer, layers = Tegaki.layers;
    
    for (i = 0; layer = layers[i]; ++i) {
      if (layer.id === id) {
        return i;
      }
    }
    
    return -1;
  },
  
  getTopFencedLayerId: function() {
    var i, id, layer;
    
    for (i = Tegaki.layers.length - 1; layer = Tegaki.layers[i]; i--) {
      if (TegakiLayers.selectedLayersHas(layer.id)) {
        break;
      }
    }
    
    for (i = i - 1; layer = Tegaki.layers[i]; i--) {
      if (!TegakiLayers.selectedLayersHas(layer.id)) {
        break;
      }
    }
    
    if (layer = Tegaki.layers[i]) {
      id = layer.id;
    }
    else {
      id = 0;
    }
    
    return id;
  },
  
  getSelectedEdgeLayerPos: function(top) {
    var i, layer;
    
    if (top) {
      for (i = Tegaki.layers.length - 1; layer = Tegaki.layers[i]; i--) {
        if (TegakiLayers.selectedLayersHas(layer.id)) {
          break;
        }
      }
    }
    else {
      for (i = 0; layer = Tegaki.layers[i]; ++i) {
        if (TegakiLayers.selectedLayersHas(layer.id)) {
          break;
        }
      }
      
      if (i >= Tegaki.layers.length) {
        i = -1;
      }
    }
    
    return i;
  },
  
  getTopLayer: function() {
    return Tegaki.layers[Tegaki.layers.length - 1];
  },
  
  getTopLayerId: function() {
    var layer = TegakiLayers.getTopLayer();
    
    if (layer) {
      return layer.id;
    }
    else {
      return 0;
    }
  },
  
  getLayerBelowId: function(belowId) {
    var idx;
    
    idx = TegakiLayers.getLayerPosById(belowId);
    
    if (idx < 1) {
      return null;
    }
    
    return Tegaki.layers[idx - 1];
  },
  
  getLayerById: function(id) {
    return Tegaki.layers[TegakiLayers.getLayerPosById(id)];
  },
  
  isSameLayerOrder: function(a, b) {
    var i, al;
    
    if (a.length !== b.length) {
      return false;
    }
    
    for (i = 0; al = a[i]; ++i) {
      if (al.id !== b[i].id) {
        return false;
      }
    }
    
    return true;
  },
  
  addLayer: function(baseLayer = {}) {
    var id, canvas, k, params, layer, afterNode, afterPos,
      aLayerIdBefore;
    
    aLayerIdBefore = Tegaki.activeLayerId || 0;
    afterPos = TegakiLayers.getLayerPosById(Tegaki.activeLayerId);
    afterNode = $T.cls('tegaki-layer', Tegaki.layersCnt)[afterPos];
    
    if (!afterNode) {
      afterNode = Tegaki.layersCnt.firstElementChild;
    }
    
    canvas = $T.el('canvas');
    canvas.className = 'tegaki-layer';
    canvas.width = Tegaki.canvas.width;
    canvas.height = Tegaki.canvas.height;
    
    Tegaki.updateCanvasZoomSize(canvas);
    
    id = ++Tegaki.layerCounter;
    
    canvas.id = 'tegaki-canvas-' + id;
    canvas.setAttribute('data-id', id);
    
    params = {
      name: 'Layer ' + id,
      visible: true,
      opacity: 1.0,
    };
    
    layer = {
      id: id,
      canvas: canvas,
      ctx: canvas.getContext('2d')
    };
    
    for (k in params) {
      if (baseLayer[k] !== undefined) {
        params[k] = baseLayer[k];
      }
      
      layer[k] = params[k];
    }
    
    Tegaki.layers.splice(afterPos + 1, 0, layer);
    
    TegakiUI.updateLayersGridAdd(layer, aLayerIdBefore);
    
    Tegaki.layersCnt.insertBefore(canvas, afterNode.nextElementSibling);
    
    return new TegakiHistoryActions.AddLayer(layer, aLayerIdBefore, id);
  },
  
  deleteLayers: function(ids, extraParams) {
    var id, idx, layer, layers, delIndexes, params;
    
    params = {
      aLayerIdBefore: Tegaki.activeLayerId,
      aLayerIdAfter: TegakiLayers.getTopFencedLayerId()
    };
    
    layers = [];
    
    delIndexes = [];
    
    for (id of ids) {
      idx = TegakiLayers.getLayerPosById(id);
      layer = Tegaki.layers[idx];
      
      layers.push([idx, layer]);
      
      Tegaki.layersCnt.removeChild(layer.canvas);
      
      delIndexes.push(idx);
      
      TegakiUI.updateLayersGridRemove(id);
    }
    
    delIndexes = delIndexes.sort($T.sortDescCb);
    
    for (idx of delIndexes) {
      Tegaki.layers.splice(idx, 1);
    }
    
    if (extraParams) {
      Object.assign(params, extraParams);
    }
    
    return new TegakiHistoryActions.DeleteLayers(layers, params);
  },
  
  mergeLayers: function(idSet) {
    var bgLayer, canvasAfter, canvasBefore,
      targetLayer, action, layer, layers, delIds;
    
    layers = [];
    
    for (layer of Tegaki.layers) {
      if (idSet.has(layer.id)) {
        layers.push(layer);
      }
    }
    
    if (layers.length < 1) {
      return;
    }
    
    if (layers.length === 1) {
      targetLayer = TegakiLayers.getLayerBelowId(layers[0].id);
      
      if (!targetLayer) {
        return;
      }
      
      bgLayer = targetLayer;
    }
    else {
      targetLayer = layers[layers.length - 1];
      bgLayer = layers[0];
    }
    
    bgLayer = TegakiLayers.cloneLayer(bgLayer);
    canvasBefore = $T.copyCanvas(targetLayer.canvas);
    
    delIds = [];
    
    for (layer of layers) {
      if (layer.id !== targetLayer.id) {
        delIds.push(layer.id);
      }
      
      if (layer.id !== bgLayer.id) {
        bgLayer.ctx.drawImage(layer.canvas, 0, 0);
      }
    }
    
    Tegaki.clearCtx(targetLayer.ctx);
    targetLayer.ctx.drawImage(bgLayer.canvas, 0, 0);
    
    canvasAfter = $T.copyCanvas(targetLayer.canvas);
    
    action = TegakiLayers.deleteLayers(delIds, {
      tgtLayerId: targetLayer.id,
      aLayerIdAfter: targetLayer.id,
      canvasBefore: canvasBefore,
      canvasAfter: canvasAfter,
      mergeDown: layers.length === 1
    });
    
    return action;
  },
  
  moveLayers: function(idSet, belowPos) {
    var idx, layer,
      historyLayers, updLayers, movedLayers,
      tgtCanvas, updTgtPos;
    
    if (!idSet.size || !Tegaki.layers.length) {
      return;
    }
    
    if (belowPos >= Tegaki.layers.length) {
      tgtCanvas = TegakiLayers.getTopLayer().canvas.nextElementSibling;
    }
    else {
      layer = Tegaki.layers[belowPos];
      tgtCanvas = layer.canvas;
    }
    
    historyLayers = [];
    updLayers = [];
    movedLayers = [];
    
    updTgtPos = belowPos;
    
    idx = 0;
    
    for (layer of Tegaki.layers) {
      if (idSet.has(layer.id)) {
        if (belowPos > 0 && idx <= belowPos) {
          updTgtPos--;
        }
        
        historyLayers.push([idx, layer]);
        movedLayers.push(layer);
      }
      else {
        updLayers.push(layer);
      }
      
      ++idx;
    }
    
    updLayers.splice(updTgtPos, 0, ...movedLayers);
    
    if (TegakiLayers.isSameLayerOrder(updLayers, Tegaki.layers)) {
      return;
    }
    
    Tegaki.layers = updLayers;
    
    for (layer of historyLayers) {
      Tegaki.layersCnt.insertBefore(layer[1].canvas, tgtCanvas);
    }
    
    Tegaki.updateGhostLayerPos();
    
    TegakiUI.updayeLayersGridOrder();
    
    return new TegakiHistoryActions.MoveLayers(
      historyLayers, belowPos, Tegaki.activeLayerId
    );
  },
  
  setLayerVisibility: function(layer, flag) {
    layer.visible = flag;
    
    if (flag) {
      layer.canvas.classList.remove('tegaki-hidden');
    }
    else {
      layer.canvas.classList.add('tegaki-hidden');
    }
    
    TegakiUI.updateLayersGridVisibility(layer.id, flag);
  },
  
  setActiveLayer: function(id) {
    var ctx, idx;
    
    if (!id) {
      id = TegakiLayers.getTopLayerId();
      
      if (!id) {
        Tegaki.activeLayerId = null;
        Tegaki.activeCtx = null;
        return;
      }
    }
    
    idx = TegakiLayers.getLayerPosById(id);
    
    if (idx < 0) {
      return;
    }
    
    ctx = Tegaki.layers[idx].ctx;
    
    if (Tegaki.activeCtx) {
      Tegaki.copyContextState(Tegaki.activeCtx, ctx);
    }
    
    Tegaki.activeCtx = ctx;
    Tegaki.activeLayerId = id;
    
    Tegaki.updateGhostLayerPos();
    
    TegakiLayers.selectedLayersClear();
    TegakiLayers.selectedLayersAdd(id);
    
    TegakiUI.updateLayersGridActive(id);
  },
  
  selectedLayersHas: function(id) {
    return Tegaki.selectedLayers.has(+id);
  },
  
  selectedLayersClear: function() {
    Tegaki.selectedLayers.clear();
    TegakiUI.updateLayersGridSelectedClear();
  },
  
  selectedLayersAdd: function(id) {
    Tegaki.selectedLayers.add(+id);
    TegakiUI.updateLayersGridSelectedSet(id, true);
  },
  
  selectedLayersRemove: function(id) {
    Tegaki.selectedLayers.delete(+id);
    TegakiUI.updateLayersGridSelectedSet(id, false);
  },
  
  selectedLayersToggle: function(id) {
    if (TegakiLayers.selectedLayersHas(id)) {
      TegakiLayers.selectedLayersRemove(id);
    }
    else {
      TegakiLayers.selectedLayersAdd(id);
    }
  }
};