var TegakiLayers = {
  cloneLayer: function(layer) {
    var newLayer = Object.assign({}, layer);
    
    newLayer.canvas = $T.copyCanvas(layer.canvas, true);
    newLayer.ctx = newLayer.canvas.getContext('2d');
    newLayer.imageData = $T.copyImageData(layer.imageData);
    
    return newLayer;
  },
  
  getCanvasById: function(id) {
    return $T.id('tegaki-canvas-' + id);
  },
  
  getActiveLayer: function() {
    return Tegaki.activeLayer;
  },
  
  getLayerPosById: function(id) {
    var i, layers = Tegaki.layers;
    
    for (i = 0; i < layers.length; ++i) {
      if (layers[i].id === id) {
        return i;
      }
    }
    
    return -1;
  },
  
  getTopFencedLayerId: function() {
    var i, id, layer, layers = Tegaki.layers;
    
    for (i = layers.length - 1; i >= 0; i--) {
      if (TegakiLayers.selectedLayersHas(layers[i].id)) {
        break;
      }
    }
    
    for (i = i - 1; i >= 0; i--) {
      if (!TegakiLayers.selectedLayersHas(layers[i].id)) {
        break;
      }
    }
    
    if (layer = layers[i]) {
      id = layer.id;
    }
    else {
      id = 0;
    }
    
    return id;
  },
  
  getSelectedEdgeLayerPos: function(top) {
    var i, layers = Tegaki.layers;
    
    if (top) {
      for (i = Tegaki.layers.length - 1; i >= 0; i--) {
        if (TegakiLayers.selectedLayersHas(layers[i].id)) {
          break;
        }
      }
    }
    else {
      for (i = 0; i < layers.length; ++i) {
        if (TegakiLayers.selectedLayersHas(layers[i].id)) {
          break;
        }
      }
      
      if (i >= layers.length) {
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
      aLayerIdBefore, ctx;
    
    if (Tegaki.activeLayer) {
      aLayerIdBefore = Tegaki.activeLayer.id;
      afterPos = TegakiLayers.getLayerPosById(Tegaki.activeLayer.id);
      afterNode = $T.cls('tegaki-layer', Tegaki.layersCnt)[afterPos];
    }
    else {
      afterPos = -1;
      afterNode = null;
    }
    
    if (!afterNode) {
      afterNode = Tegaki.layersCnt.firstElementChild;
    }
    
    canvas = $T.el('canvas');
    canvas.className = 'tegaki-layer';
    canvas.width = Tegaki.baseWidth;
    canvas.height = Tegaki.baseHeight;
    
    id = ++Tegaki.layerCounter;
    
    canvas.id = 'tegaki-canvas-' + id;
    canvas.setAttribute('data-id', id);
    
    params = {
      name: TegakiStrings.layer + ' ' + id,
      visible: true,
      alpha: 1.0,
    };
    
    ctx = canvas.getContext('2d');
    
    layer = {
      id: id,
      canvas: canvas,
      ctx: ctx,
      imageData: ctx.getImageData(0, 0, canvas.width, canvas.height)
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
    
    Tegaki.onLayerStackChanged();
    
    return new TegakiHistoryActions.AddLayer(layer, aLayerIdBefore, id);
  },
  
  deleteLayers: function(ids, extraParams) {
    var id, idx, layer, layers, delIndexes, params;
    
    params = {
      aLayerIdBefore: Tegaki.activeLayer ? Tegaki.activeLayer.id : -1,
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
      
      TegakiUI.deleteLayerPreviewCtx(layer);
    }
    
    delIndexes = delIndexes.sort($T.sortDescCb);
    
    for (idx of delIndexes) {
      Tegaki.layers.splice(idx, 1);
    }
    
    if (extraParams) {
      Object.assign(params, extraParams);
    }
    
    Tegaki.onLayerStackChanged();
    
    return new TegakiHistoryActions.DeleteLayers(layers, params);
  },
  
  mergeLayers: function(idSet) {
    var canvas, ctx, imageDataAfter, imageDataBefore,
      targetLayer, action, layer, layers, delIds, mergeDown;
    
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
      
      layers.unshift(targetLayer);
      
      mergeDown = true;
    }
    else {
      targetLayer = layers[layers.length - 1];
      
      mergeDown = false;
    }
    
    canvas = $T.el('canvas');
    canvas.width = Tegaki.baseWidth;
    canvas.height = Tegaki.baseHeight;
    
    ctx = canvas.getContext('2d');
    
    imageDataBefore = $T.copyImageData(targetLayer.imageData);
    
    delIds = [];
    
    for (layer of layers) {
      if (layer.id !== targetLayer.id) {
        delIds.push(layer.id);
      }
      
      ctx.globalAlpha = layer.alpha;
      ctx.drawImage(layer.canvas, 0, 0);
    }
    
    $T.clearCtx(targetLayer.ctx);
    
    targetLayer.ctx.drawImage(canvas, 0, 0);
    
    TegakiLayers.syncLayerImageData(targetLayer);
    
    imageDataAfter = $T.copyImageData(targetLayer.imageData);
    
    action = TegakiLayers.deleteLayers(delIds, {
      tgtLayerId: targetLayer.id,
      tgtLayerAlpha: targetLayer.alpha,
      aLayerIdAfter: targetLayer.id,
      imageDataBefore: imageDataBefore,
      imageDataAfter: imageDataAfter,
      mergeDown: mergeDown
    });
    
    TegakiLayers.setLayerAlpha(targetLayer, 1.0);
    
    TegakiUI.updateLayerAlphaOpt();
    
    TegakiUI.updateLayerPreview(targetLayer);
    
    Tegaki.onLayerStackChanged();
    
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
    
    TegakiUI.updayeLayersGridOrder();
    
    Tegaki.onLayerStackChanged();
    
    return new TegakiHistoryActions.MoveLayers(
      historyLayers, belowPos,
      Tegaki.activeLayer ? Tegaki.activeLayer.id : -1
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
    
    Tegaki.onLayerStackChanged();
    
    TegakiUI.updateLayersGridVisibility(layer.id, flag);
  },
  
  setLayerAlpha: function(layer, alpha) {
    layer.alpha = alpha;
    layer.canvas.style.opacity = alpha;
  },
  
  setActiveLayer: function(id) {
    var idx, layer;
    
    if (!id) {
      id = TegakiLayers.getTopLayerId();
      
      if (!id) {
        Tegaki.activeLayer = null;
        return;
      }
    }
    
    idx = TegakiLayers.getLayerPosById(id);
    
    if (idx < 0) {
      return;
    }
    
    layer = Tegaki.layers[idx];
    
    if (Tegaki.activeLayer) {
      Tegaki.copyContextState(Tegaki.activeLayer.ctx, layer.ctx);
    }
    
    Tegaki.activeLayer = layer;
    
    TegakiLayers.selectedLayersClear();
    TegakiLayers.selectedLayersAdd(id);
    
    TegakiUI.updateLayersGridActive(id);
    TegakiUI.updateLayerAlphaOpt();
    
    Tegaki.onLayerStackChanged();
  },
  
  syncLayerImageData(layer, imageData = null) {
    if (imageData) {
      layer.imageData = $T.copyImageData(imageData);
    }
    else {
      layer.imageData = layer.ctx.getImageData(
        0, 0, Tegaki.baseWidth, Tegaki.baseHeight
      );
    }
  },
  
  selectedLayersHas: function(id) {
    return Tegaki.selectedLayers.has(+id);
  },
  
  selectedLayersClear: function() {
    Tegaki.selectedLayers.clear();
    TegakiUI.updateLayerAlphaOpt();
    TegakiUI.updateLayersGridSelectedClear();
  },
  
  selectedLayersAdd: function(id) {
    Tegaki.selectedLayers.add(+id);
    TegakiUI.updateLayerAlphaOpt();
    TegakiUI.updateLayersGridSelectedSet(id, true);
  },
  
  selectedLayersRemove: function(id) {
    Tegaki.selectedLayers.delete(+id);
    TegakiUI.updateLayerAlphaOpt();
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
