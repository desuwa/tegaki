var TegakiUI;

TegakiUI = {
  draggedNode: null,
  
  buildDummyFilePicker: function() {
    var el = $T.el('input');
    
    el.type = 'file';
    el.id = 'tegaki-filepicker';
    el.className = 'tegaki-hidden';
    el.accept = 'image/png, image/jpeg';
    $T.on(el, 'change', Tegaki.onOpenFileSelected);
    
    return el;
  },
  
  buildMenuBar: function() {
    var frag, btn;
    
    frag = $T.frag();
    
    btn = $T.el('span');
    btn.className = 'tegaki-tb-btn';
    btn.textContent = TegakiStrings.newCanvas;
    $T.on(btn, 'click', Tegaki.onNewClick);
    frag.appendChild(btn);
    
    btn = $T.el('span');
    btn.className = 'tegaki-tb-btn';
    btn.textContent = TegakiStrings.open;
    $T.on(btn, 'click', Tegaki.onOpenClick);
    frag.appendChild(btn);
    
    btn = $T.el('span');
    btn.className = 'tegaki-tb-btn';
    btn.textContent = TegakiStrings.export;
    $T.on(btn, 'click', Tegaki.onExportClick);
    frag.appendChild(btn);
    
    btn = $T.el('span');
    btn.id = 'tegaki-undo-btn';
    btn.className = 'tegaki-tb-btn';
    btn.textContent = TegakiStrings.undo;
    btn.title = 'Ctrl+Z';
    $T.on(btn, 'click', Tegaki.onUndoClick);
    frag.appendChild(btn);
    
    btn = $T.el('span');
    btn.id = 'tegaki-redo-btn';
    btn.className = 'tegaki-tb-btn';
    btn.textContent = TegakiStrings.redo;
    btn.title = 'Ctrl+Y';
    $T.on(btn, 'click', Tegaki.onRedoClick);
    frag.appendChild(btn);
    
    btn = $T.el('span');
    btn.className = 'tegaki-tb-btn';
    btn.textContent = TegakiStrings.close;
    $T.on(btn, 'click', Tegaki.onCancelClick);
    frag.appendChild(btn);
    
    btn = $T.el('span');
    btn.id = 'tegaki-finish-btn';
    btn.className = 'tegaki-tb-btn';
    btn.textContent = TegakiStrings.finish;
    $T.on(btn, 'click', Tegaki.onDoneClick);
    frag.appendChild(btn);
    
    return frag;
  },
  
  buildToolsMenu: function() {
    var grp, el, lbl, name;
    
    grp = $T.el('div');
    grp.id = 'tegaki-tools-grid';
    
    for (name in Tegaki.tools) {
      el = $T.el('span');
      el.setAttribute('data-tool', name);
      
      lbl = TegakiStrings[name];
      
      if (Tegaki.tools[name].keybind) {
        lbl += ' (' + Tegaki.tools[name].keybind.toUpperCase() + ')';
      }
      
      el.setAttribute('title', lbl);
      el.id = 'tegaki-tool-btn-' + name;
      el.className = 'tegaki-tool-btn tegaki-icon tegaki-' + name;
      
      $T.on(el, 'click', Tegaki.onToolClick);
      
      grp.appendChild(el);
    }
    
    return grp;
  },
  
  buildCtrlGroup: function(id, title) {
    var cnt, el;
    
    cnt = $T.el('div');
    cnt.className = 'tegaki-ctrlgrp';
    
    if (id) {
      cnt.id = 'tegaki-ctrlgrp-' + id;
    }
    
    if (title !== undefined) {
      el = $T.el('div');
      el.className = 'tegaki-ctrlgrp-title';
      el.textContent = title;
      cnt.appendChild(el);
    }
    
    return cnt;
  },
  
  buildLayersCtrlGroup: function() {
    var el, ctrl, row;
    
    ctrl = this.buildCtrlGroup('layers', TegakiStrings.layers);
    
    el = $T.el('div');
    el.id = 'tegaki-layers-grid';
    ctrl.appendChild(el);
    
    row = $T.el('div');
    row.id = 'tegaki-layers-ctrl';
    
    el = $T.el('span');
    el.title = TegakiStrings.addLayer;
    el.className = 'tegaki-ui-btn tegaki-icon tegaki-plus';
    $T.on(el, 'click', Tegaki.onLayerAddClick);
    row.appendChild(el);
    
    el = $T.el('span');
    el.title = TegakiStrings.delLayers;
    el.className = 'tegaki-ui-btn tegaki-icon tegaki-minus';
    $T.on(el, 'click', Tegaki.onLayerDeleteClick);
    row.appendChild(el);
    
    el = $T.el('span');
    el.id = 'tegaki-layer-merge';
    el.title = TegakiStrings.mergeLayers;
    el.className = 'tegaki-ui-btn tegaki-icon tegaki-level-down';
    $T.on(el, 'click', Tegaki.onMergeLayersClick);
    row.appendChild(el);
    
    el = $T.el('span');
    el.id = 'tegaki-layer-up';
    el.title = TegakiStrings.moveLayerUp;
    el.setAttribute('data-up', '1');
    el.className = 'tegaki-ui-btn tegaki-icon tegaki-up-open';
    $T.on(el, 'click', Tegaki.onMoveLayerClick);
    row.appendChild(el);
    
    el = $T.el('span');
    el.id = 'tegaki-layer-down';
    el.title = TegakiStrings.moveLayerDown;
    el.className = 'tegaki-ui-btn tegaki-icon tegaki-down-open';
    $T.on(el, 'click', Tegaki.onMoveLayerClick);
    row.appendChild(el);
    
    ctrl.appendChild(row);
    
    return ctrl;
  },
  
  buildSizeCtrlGroup: function() {
    var el, ctrl, row;
    
    ctrl = this.buildCtrlGroup('size', TegakiStrings.size);
    
    row = $T.el('div');
    row.className = 'tegaki-ctrlrow';
    
    el = $T.el('input');
    el.id = 'tegaki-size';
    el.className = 'tegaki-ctrl-range';
    el.min = 1;
    el.max = Tegaki.maxSize;
    el.type = 'range';
    $T.on(el, 'change', Tegaki.onSizeChange);
    row.appendChild(el);
    
    el = $T.el('input');
    el.id = 'tegaki-size-lbl';
    el.className = 'tegaki-stealth-input';
    $T.on(el, 'change', Tegaki.onSizeChange);
    row.appendChild(el);
    
    ctrl.appendChild(row);
    
    return ctrl;
  },
  
  buildAlphaCtrlGroup: function() {
    var el, ctrl, row;
    
    ctrl = this.buildCtrlGroup('alpha', TegakiStrings.alpha);
    
    row = $T.el('div');
    row.className = 'tegaki-ctrlrow';
    
    el = $T.el('input');
    el.id = 'tegaki-alpha';
    el.className = 'tegaki-ctrl-range';
    el.min = 0;
    el.max = 1;
    el.step = 0.01;
    el.type = 'range';
    $T.on(el, 'change', Tegaki.onAlphaChange);
    row.appendChild(el);
    
    el = $T.el('input');
    el.id = 'tegaki-alpha-lbl';
    el.className = 'tegaki-stealth-input';
    $T.on(el, 'change', Tegaki.onAlphaChange);
    row.appendChild(el);
    
    ctrl.appendChild(row);
    
    return ctrl;
  },
  
  buildDynamicsCtrlGroup: function() {
    var el, ctrl, row;
    
    ctrl = this.buildCtrlGroup('dynamics', TegakiStrings.dynamics);
    
    row = $T.el('div');
    row.className = 'tegaki-ctrlrow';
    
    el = $T.el('span');
    el.id = 'tegaki-size-p-cb';
    el.className = 'tegaki-ui-cb';
    $T.on(el, 'mousedown', Tegaki.onSizePressureCtrlClick);
    row.appendChild(el);
    
    el = $T.el('span');
    el.textContent = TegakiStrings.pressureSizeCtrl;
    row.appendChild(el);
    
    ctrl.appendChild(row);
    
    row = $T.el('div');
    row.className = 'tegaki-ctrlrow';
    
    el = $T.el('span');
    el.id = 'tegaki-alpha-p-cb';
    el.className = 'tegaki-ui-cb';
    $T.on(el, 'mousedown', Tegaki.onAlphaPressureCtrlClick);
    row.appendChild(el);
    
    el = $T.el('span');
    el.textContent = TegakiStrings.pressureAlphaCtrl;
    row.appendChild(el);
    
    ctrl.appendChild(row);
    
    return ctrl;
  },
  
  buildZoomCtrlGroup: function() {
    var el, btn, ctrl;
    
    ctrl = this.buildCtrlGroup('zoom', TegakiStrings.zoom);
    
    btn = $T.el('div');
    btn.className = 'tegaki-ui-btn tegaki-icon tegaki-plus';
    btn.id = 'tegaki-zoomin-btn';
    btn.setAttribute('data-in', 1);
    $T.on(btn, 'click', Tegaki.onZoomChange);
    ctrl.appendChild(btn);
    
    btn = $T.el('div');
    btn.className = 'tegaki-ui-btn tegaki-icon tegaki-minus';
    btn.id = 'tegaki-zoomout-btn';
    btn.setAttribute('data-out', 1);
    $T.on(btn, 'click', Tegaki.onZoomChange);
    ctrl.appendChild(btn);
    
    el = $T.el('div');
    el.id = 'tegaki-zoom-lbl';
    ctrl.appendChild(el);
    
    return ctrl;
  },
  
  buildColorCtrlGroup: function(mainColor, colorPalette) {
    var el, btn, ctrl, color, edge;
    
    edge = / Edge\//i.test(window.navigator.userAgent);
    
    ctrl = this.buildCtrlGroup('color', TegakiStrings.color);
    
    el = $T.el('div');
    el.id = 'tegaki-color';
    edge && el.classList.add('tegaki-hidden');
    el.style.backgroundColor = mainColor;
    $T.on(el, 'mousedown', Tegaki.onMainColorClick);
    
    ctrl.appendChild(el);
    
    el = $T.el('input');
    el.id = 'tegaki-colorpicker';
    !edge && el.classList.add('tegaki-hidden');
    el.value = color;
    el.type = 'color';
    $T.on(el, 'change', Tegaki.onColorPicked);
    
    ctrl.appendChild(el);
    
    el = $T.el('div');
    el.id = 'tegaki-color-grid';
    
    for (color of colorPalette) {
      btn = $T.el('div');
      btn.className = 'tegaki-color-btn';
      btn.setAttribute('data-color', color);
      btn.style.backgroundColor = color;
      $T.on(btn, 'mousedown', Tegaki.onPaletteColorClick);
      el.appendChild(btn);
    }
    
    ctrl.appendChild(el);
    
    return ctrl;
  },
  
  buildStatusCnt: function() {
    var cnt, el;
    
    cnt = $T.el('div');
    cnt.id = 'tegaki-status-cnt';
    
    el = $T.el('span');
    el.id = 'tegaki-version';
    el.textContent = 'tegaki.js v' + Tegaki.VERSION;
    
    cnt.appendChild(el);
    
    return cnt;
  },
  
  buildLayerGridCell: function(layer) {
    var cnt, el;
    
    cnt = $T.el('div');
    cnt.id = 'tegaki-layers-cell-' + layer.id;
    cnt.className = 'tegaki-layers-cell';
    cnt.setAttribute('data-id', layer.id);
    
    el = $T.el('span');
    el.className = 'tegaki-layers-cell-v tegaki-ui-cb';
    el.setAttribute('data-id', layer.id);
    $T.on(el, 'click', Tegaki.onLayerToggleVisibilityClick);
    
    if (layer.visible) {
      el.className += ' tegaki-ui-cb-a';
    }
    
    cnt.appendChild(el);
    
    el = $T.el('span');
    el.className = 'tegaki-layers-cell-n';
    el.setAttribute('draggable', 'true');
    el.setAttribute('data-id', layer.id);
    el.textContent = 'Layer ' + layer.id;
    $T.on(el, 'click', Tegaki.onLayerSelectorClick);
    
    $T.on(el, 'dragstart', TegakiUI.onLayerDragStart);
    $T.on(el, 'dragover', TegakiUI.onLayerDragOver);
    $T.on(el, 'drop', TegakiUI.onLayerDragDrop);
    $T.on(el, 'dragend', TegakiUI.onLayerDragEnd);
    $T.on(el, 'dragleave', TegakiUI.onLayerDragLeave);
    $T.on(el, 'dragexit', TegakiUI.onLayerDragLeave);
    
    cnt.appendChild(el);
    
    return cnt;
  },
  
  onLayerDragStart: function(e) {
    var el;
    
    TegakiUI.draggedNode = null;
    
    if (!$T.id('tegaki-layers-grid').children[1]) {
      e.preventDefault();
      return;
    }
    
    el = $T.el('div');
    el.className = 'tegaki-invis';
    e.dataTransfer.setDragImage(el, 0, 0);
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
    e.dataTransfer.effectAllowed = 'move';
    
    TegakiUI.draggedNode = e.target;
    
    TegakiUI.updateLayersGridDragExt(true);
  },
  
  onLayerDragOver: function(e) {
    e.preventDefault();
    
    e.dataTransfer.dropEffect = 'move';
    
    TegakiUI.updateLayersGridDragEffect(
      e.target.parentNode,
      +TegakiUI.draggedNode.getAttribute('data-id')
    );
  },
  
  onLayerDragLeave: function(e) {
    TegakiUI.updateLayersGridDragEffect();
  },
  
  onLayerDragEnd: function(e) {
    TegakiUI.draggedNode = null;
    TegakiUI.updateLayersGridDragExt(false);
    TegakiUI.updateLayersGridDragEffect();
  },
  
  onLayerDragDrop: function(e) {
    var tgtId, srcId, belowPos, layers;
    
    e.preventDefault();
    
    TegakiUI.draggedNode = null;
    
    TegakiUI.updateLayersGridDragEffect(e.target.parentNode);
    TegakiUI.updateLayersGridDragExt(false);
    
    tgtId = +e.target.getAttribute('data-id');
    srcId = +e.dataTransfer.getData('text/plain');
    
    if (!TegakiUI.layersGridCanDrop(tgtId, srcId)) {
      return;
    }
    
    if (!tgtId) {
      belowPos = Tegaki.layers.length;
    }
    else {
      belowPos = TegakiLayers.getLayerPosById(tgtId);
    }
    
    if (!TegakiLayers.selectedLayersHas(srcId)) {
      layers = new Set([srcId]);
    }
    else {
      layers = Tegaki.selectedLayers;
    }
    
    TegakiHistory.push(TegakiLayers.moveLayers(layers, belowPos));
  },
  
  updateLayersGridDragExt: function(flag) {
    var cnt, el;
    
    cnt = $T.id('tegaki-layers-grid');
    
    if (!cnt.children[1]) {
      return;
    }
    
    if (flag) {
      el = $T.el('div');
      el.id = 'tegaki-layers-cell-dx';
      $T.on(el, 'dragover', TegakiUI.onLayerDragOver);
      $T.on(el, 'drop', TegakiUI.onLayerDragDrop);
      cnt.parentNode.insertBefore(el, cnt);
    }
    else {
      if (el = $T.id('tegaki-layers-cell-dx')) {
        el.parentNode.removeChild(el);
      }
    }
  },
  
  updateLayersGridDragEffect: function(tgt, srcId) {
    var el, nodes, tgtId;
    
    nodes = $T.cls('tegaki-layers-cell-d', $T.id('tegaki-ctrlgrp-layers'));
    
    for (el of nodes) {
      el.classList.remove('tegaki-layers-cell-d');
    }
    
    if (!tgt || !srcId) {
      return;
    }
    
    tgtId = +tgt.getAttribute('data-id');
    
    if (!TegakiUI.layersGridCanDrop(tgtId, srcId)) {
      return;
    }
    
    if (!tgtId) {
      tgt = $T.id('tegaki-layers-grid');
    }
    
    tgt.classList.add('tegaki-layers-cell-d');
  },
  
  layersGridCanDrop: function(tgtId, srcId) {
    var srcEl;
    
    if (tgtId === srcId) {
      return false;
    }
    
    srcEl = $T.id('tegaki-layers-cell-' + srcId);
    
    if (!srcEl.previousElementSibling) {
      if (!tgtId) {
        return false;
      }
    }
    else if (+srcEl.previousElementSibling.getAttribute('data-id') === tgtId) {
      return false;
    }
    
    return true;
  },
  
  // ---
  
  updateLayersGridClear: function() {
    $T.id('tegaki-layers-grid').innerHTML = '';
  },
  
  updateLayersGrid: function() {
    var layer, el, frag, cnt;
    
    frag = $T.frag();
    
    for (layer of Tegaki.layers) {
      el = TegakiUI.buildLayerGridCell(layer);
      frag.insertBefore(el, frag.firstElementChild);
    }
    
    TegakiUI.updateLayersGridClear();
    
    cnt.appendChild(frag);
  },
  
  updateLayersGridActive: function(layerId) {
    var el;
    
    el = $T.cls('tegaki-layers-cell-a', $T.id('tegaki-layers-grid'))[0];
    
    if (el) {
      el.classList.remove('tegaki-layers-cell-a');
    }
    
    el = $T.id('tegaki-layers-cell-' + layerId);
    
    if (el) {
      el.classList.add('tegaki-layers-cell-a');
    }
  },
  
  updateLayersGridAdd: function(layer, aboveId) {
    var el, cnt, ref;
    
    el = TegakiUI.buildLayerGridCell(layer);
    
    cnt = $T.id('tegaki-layers-grid');
    
    if (aboveId) {
      ref = $T.id('tegaki-layers-cell-' + aboveId);
    }
    else {
      ref = null;
    }
    
    cnt.insertBefore(el, ref);
  },
  
  updateLayersGridRemove: function(id) {
    var el;
    
    if (el = $T.id('tegaki-layers-cell-' + id)) {
      el.parentNode.removeChild(el);
    }
  },
  
  updayeLayersGridOrder: function() {
    var layer, cnt, el;
    
    cnt = $T.id('tegaki-layers-grid');
    
    for (layer of Tegaki.layers) {
      el = $T.id('tegaki-layers-cell-' + layer.id);
      cnt.insertBefore(el, cnt.firstElementChild);
    }
  },
  
  updateLayersGridVisibility: function(id, flag) {
    var el, cb;
    
    el = $T.id('tegaki-layers-cell-' + id);
    
    if (!el) {
      return;
    }
    
    cb = $T.cls('tegaki-layers-cell-v', el)[0];
    
    if (!cb) {
      return;
    }
    
    if (flag) {
      cb.classList.add('tegaki-ui-cb-a');
    }
    else {
      cb.classList.remove('tegaki-ui-cb-a');
    }
  },
  
  updateLayersGridSelectedClear: function() {
    var layer, el;
    
    for (layer of Tegaki.layers) {
      if (el = $T.id('tegaki-layers-cell-' + layer.id)) {
        el.classList.remove('tegaki-layers-cell-s');
      }
    }
  },
  
  updateLayersGridSelectedSet: function(id, flag) {
    var el;
    
    if (el = $T.id('tegaki-layers-cell-' + id)) {
      if (flag) {
        el.classList.add('tegaki-layers-cell-s');
      }
      else {
        el.classList.remove('tegaki-layers-cell-s');
      }
    }
  },
  
  updateSize: function() {
    $T.id('tegaki-size-lbl').value = Tegaki.tool.size;
    $T.id('tegaki-size').value = Tegaki.tool.size;
  },
  
  updateAlpha: function() {
    $T.id('tegaki-alpha-lbl').value = Tegaki.tool.alpha;
    $T.id('tegaki-alpha').value = Tegaki.tool.alpha;
  },
  
  updateDynamics: function() {
    var ctrl, cb;
    
    ctrl = $T.id('tegaki-ctrlgrp-dynamics');
    
    if (!Tegaki.tool.useSizeDynamics && !Tegaki.tool.useAlphaDynamics) {
      ctrl.classList.add('tegaki-hidden');
    }
    else {
      cb = $T.id('tegaki-size-p-cb');
      
      if (Tegaki.tool.useSizeDynamics) {
        if (Tegaki.tool.sizeDynamicsEnabled) {
          cb.classList.add('tegaki-ui-cb-a');
        }
        else {
          cb.classList.remove('tegaki-ui-cb-a');
        }
        
        cb.parentNode.classList.remove('tegaki-hidden');
      }
      else {
        cb.parentNode.classList.add('tegaki-hidden');
      }
      
      cb = $T.id('tegaki-alpha-p-cb');
      
      if (Tegaki.tool.useAlphaDynamics) {
        if (Tegaki.tool.alphaDynamicsEnabled) {
          cb.classList.add('tegaki-ui-cb-a');
        }
        else {
          cb.classList.remove('tegaki-ui-cb-a');
        }
        
        cb.parentNode.classList.remove('tegaki-hidden');
      }
      else {
        cb.parentNode.classList.add('tegaki-hidden');
      }
      
      ctrl.classList.remove('tegaki-hidden');
    }
  },
  
  updateUndoRedo: function(undoSize, redoSize) {
    var u, r;
    
    u = $T.id('tegaki-undo-btn').classList;
    r = $T.id('tegaki-redo-btn').classList;
    
    if (undoSize) {
      if (u.contains('tegaki-disabled')) {
        u.remove('tegaki-disabled');
      }
    }
    else {
      if (!u.contains('tegaki-disabled')) {
        u.add('tegaki-disabled');
      }
    }
    
    if (redoSize) {
      if (r.contains('tegaki-disabled')) {
        r.remove('tegaki-disabled');
      }
    }
    else {
      if (!r.contains('tegaki-disabled')) {
        r.add('tegaki-disabled');
      }
    }
  },
  
  updateZoomLevel: function() {
    $T.id('tegaki-zoom-lbl').textContent = (Tegaki.zoomLevel * 100) + '%';
    
    if (Tegaki.zoomLevel === Tegaki.zoomMax) {
      $T.id('tegaki-zoomin-btn').classList.add('tegaki-disabled');
    }
    else {
      $T.id('tegaki-zoomin-btn').classList.remove('tegaki-disabled');
    }
    
    if (Tegaki.zoomLevel === Tegaki.zoomMin) {
      $T.id('tegaki-zoomout-btn').classList.add('tegaki-disabled');
    }
    else {
      $T.id('tegaki-zoomout-btn').classList.remove('tegaki-disabled');
    }
  }
};
