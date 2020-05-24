var TegakiUI = {
  draggedNode: null,
  
  draggedLabelLastX: 0,
  draggedLabelFn: null,
  
  statusTimeout: 0,
  
  layerPreviewCtxCache: new WeakMap(),
  
  getLayerPreviewSize: function() {
    return $T.calcThumbSize(Tegaki.baseWidth, Tegaki.baseHeight, 24);
  },
  
  setupDragLabel: function(e, moveFn) {
    TegakiUI.draggedLabelFn = moveFn;
    TegakiUI.draggedLabelLastX = e.clientX;
    $T.on(document, 'pointermove', TegakiUI.processDragLabel);
    $T.on(document, 'pointerup', TegakiUI.clearDragLabel);
  },
  
  processDragLabel: function(e) {
    TegakiUI.draggedLabelFn.call(Tegaki, e.clientX - TegakiUI.draggedLabelLastX);
    TegakiUI.draggedLabelLastX = e.clientX;
  },
  
  clearDragLabel: function(e) {
    $T.off(document, 'pointermove', TegakiUI.processDragLabel);
    $T.off(document, 'pointerup', TegakiUI.clearDragLabel);
  },
  
  printMsg: function(str, timeout = 5000) {
    TegakiUI.clearMsg();
    
    $T.id('tegaki-status-output').textContent = str;
    
    if (timeout > 0) {
      TegakiUI.statusTimeout = setTimeout(TegakiUI.clearMsg, 5000);
    }
  },
  
  clearMsg: function() {
    if (TegakiUI.statusTimeout) {
      clearTimeout(TegakiUI.statusTimeout);
      TegakiUI.statusTimeout = 0;
    }
    
    $T.id('tegaki-status-output').textContent = '';
  },
  
  buildUI: function() {
    var bg, cnt, el, ctrl, layersCnt, canvasCnt;
    
    //
    // Grid container
    //
    bg = $T.el('div');
    bg.id = 'tegaki';
    
    //
    // Menu area
    //
    el = $T.el('div');
    el.id = 'tegaki-menu-cnt';
    
    if (!Tegaki.replayMode) {
      el.appendChild(TegakiUI.buildMenuBar());
    }
    else {
      el.appendChild(TegakiUI.buildViewerMenuBar());
      el.appendChild(TegakiUI.buildReplayControls());
    }
    
    el.appendChild(TegakiUI.buildToolModeBar());
    
    bg.appendChild(el);
    
    bg.appendChild(TegakiUI.buildDummyFilePicker());
    
    //
    // Tools area
    //
    cnt = $T.el('div');
    cnt.id = 'tegaki-tools-cnt';
    
    cnt.appendChild(TegakiUI.buildToolsMenu());
    
    bg.appendChild(cnt);
    
    //
    // Canvas area
    //
    [canvasCnt, layersCnt] = TegakiUI.buildCanvasCnt();
    
    bg.appendChild(canvasCnt);
    
    //
    // Controls area
    //
    ctrl = $T.el('div');
    ctrl.id = 'tegaki-ctrl-cnt';
    
    // Zoom control
    ctrl.appendChild(TegakiUI.buildZoomCtrlGroup());
    
    // Colorpicker
    ctrl.appendChild(
      TegakiUI.buildColorCtrlGroup(Tegaki.toolColor)
    );
    
    // Size control
    ctrl.appendChild(TegakiUI.buildSizeCtrlGroup());
    
    // Alpha control
    ctrl.appendChild(TegakiUI.buildAlphaCtrlGroup());
    
    // Flow control
    ctrl.appendChild(TegakiUI.buildFlowCtrlGroup());
    
    // Layers control
    ctrl.appendChild(TegakiUI.buildLayersCtrlGroup());
    
    // ---
    
    bg.appendChild(ctrl);
    
    //
    // Status area
    //
    bg.appendChild(TegakiUI.buildStatusCnt());
    
    return [bg, canvasCnt, layersCnt];
  },
  
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
    
    frag = $T.el('div');
    frag.id = 'tegaki-menu-bar';
    
    btn = $T.el('span');
    btn.className = 'tegaki-mb-btn';
    btn.textContent = TegakiStrings.newCanvas;
    $T.on(btn, 'click', Tegaki.onNewClick);
    frag.appendChild(btn);
    
    btn = $T.el('span');
    btn.className = 'tegaki-mb-btn';
    btn.textContent = TegakiStrings.open;
    $T.on(btn, 'click', Tegaki.onOpenClick);
    frag.appendChild(btn);
    
    btn = $T.el('span');
    btn.className = 'tegaki-mb-btn';
    btn.textContent = TegakiStrings.export;
    $T.on(btn, 'click', Tegaki.onExportClick);
    frag.appendChild(btn);
    
    btn = $T.el('span');
    btn.id = 'tegaki-undo-btn';
    btn.className = 'tegaki-mb-btn';
    btn.textContent = TegakiStrings.undo;
    btn.title = TegakiKeybinds.getCaption('undo');
    $T.on(btn, 'click', Tegaki.onUndoClick);
    frag.appendChild(btn);
    
    btn = $T.el('span');
    btn.id = 'tegaki-redo-btn';
    btn.className = 'tegaki-mb-btn';
    btn.textContent = TegakiStrings.redo;
    btn.title = TegakiKeybinds.getCaption('redo');
    $T.on(btn, 'click', Tegaki.onRedoClick);
    frag.appendChild(btn);
    
    btn = $T.el('span');
    btn.className = 'tegaki-mb-btn';
    btn.textContent = TegakiStrings.close;
    $T.on(btn, 'click', Tegaki.onCancelClick);
    frag.appendChild(btn);
    
    btn = $T.el('span');
    btn.id = 'tegaki-finish-btn';
    btn.className = 'tegaki-mb-btn';
    btn.textContent = TegakiStrings.finish;
    $T.on(btn, 'click', Tegaki.onDoneClick);
    frag.appendChild(btn);
    
    return frag;
  },
  
  buildViewerMenuBar: function() {
    var frag, btn;
    
    frag = $T.el('div');
    frag.id = 'tegaki-menu-bar';
    
    btn = $T.el('span');
    btn.id = 'tegaki-finish-btn';
    btn.className = 'tegaki-mb-btn';
    btn.textContent = TegakiStrings.close;
    $T.on(btn, 'click', Tegaki.onCloseViewerClick);
    frag.appendChild(btn);
    
    return frag;
  },
  
  buildToolModeBar: function() {
    var cnt, grp, el, btn;
    
    cnt = $T.el('div');
    cnt.id = 'tegaki-toolmode-bar';
    
    if (!Tegaki.tool) {
      cnt.classList.add('tegaki-hidden');
    }
    
    // Dynamics
    grp = $T.el('span');
    grp.id = 'tegaki-tool-mode-dynamics';
    grp.className = 'tegaki-toolmode-grp';
    
    el = $T.el('span');
    el.className = 'tegaki-toolmode-lbl';
    el.textContent = TegakiStrings.pressure;
    grp.appendChild(el);
    
    el = $T.el('span');
    el.id = 'tegaki-tool-mode-dynamics-ctrl';
    el.className = 'tegaki-toolmode-ctrl';
    
    btn = $T.el('span');
    btn.id = 'tegaki-tool-mode-dynamics-size';
    btn.className = 'tegaki-sw-btn';
    btn.textContent = TegakiStrings.size;
    $T.on(btn, 'mousedown', Tegaki.onToolPressureSizeClick);
    el.appendChild(btn);
    
    btn = $T.el('span');
    btn.id = 'tegaki-tool-mode-dynamics-alpha';
    btn.className = 'tegaki-sw-btn';
    btn.textContent = TegakiStrings.alpha;
    $T.on(btn, 'mousedown', Tegaki.onToolPressureAlphaClick);
    el.appendChild(btn);
    
    btn = $T.el('span');
    btn.id = 'tegaki-tool-mode-dynamics-flow';
    btn.className = 'tegaki-sw-btn';
    btn.textContent = TegakiStrings.flow;
    $T.on(btn, 'mousedown', Tegaki.onToolPressureFlowClick);
    el.appendChild(btn);
    
    grp.appendChild(el);
    
    cnt.appendChild(grp);
    
    // Preserve Alpha
    grp = $T.el('span');
    grp.id = 'tegaki-tool-mode-mask';
    grp.className = 'tegaki-toolmode-grp';
    
    el = $T.el('span');
    el.id = 'tegaki-toolmode-ctrl-tip';
    el.className = 'tegaki-toolmode-ctrl';
    
    btn = $T.el('span');
    btn.id = 'tegaki-tool-mode-mask-alpha';
    btn.className = 'tegaki-sw-btn';
    btn.textContent = TegakiStrings.preserveAlpha;
    $T.on(btn, 'mousedown', Tegaki.onToolPreserveAlphaClick);
    el.appendChild(btn);
    
    grp.appendChild(el);
    
    cnt.appendChild(grp);
    
    // Tip
    grp = $T.el('span');
    grp.id = 'tegaki-tool-mode-tip';
    grp.className = 'tegaki-toolmode-grp';
    
    el = $T.el('span');
    el.className = 'tegaki-toolmode-lbl';
    el.textContent = TegakiStrings.tip;
    grp.appendChild(el);
    
    el = $T.el('span');
    el.id = 'tegaki-tool-mode-tip-ctrl';
    el.className = 'tegaki-toolmode-ctrl';
    grp.appendChild(el);
    
    cnt.appendChild(grp);
    
    return cnt;
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
  
  buildCanvasCnt: function() {
    var canvasCnt, wrap, layersCnt;
    
    canvasCnt = $T.el('div');
    canvasCnt.id = 'tegaki-canvas-cnt';
    
    wrap =  $T.el('div');
    wrap.id = 'tegaki-layers-wrap';
    
    layersCnt = $T.el('div');
    layersCnt.id = 'tegaki-layers';
    
    wrap.appendChild(layersCnt);
    
    canvasCnt.appendChild(wrap);
    
    return [canvasCnt, layersCnt];
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
    var el, ctrl, row, cnt;
    
    ctrl = this.buildCtrlGroup('layers', TegakiStrings.layers);
    
    // Layer options row
    row = $T.el('div');
    row.id = 'tegaki-layers-opts';
    
    // Alpha
    cnt = $T.el('div');
    cnt.id = 'tegaki-layer-alpha-cell';
    
    el = $T.el('span');
    el.className = 'tegaki-label-xs tegaki-lbl-c tegaki-drag-lbl';
    el.textContent = TegakiStrings.alpha;
    $T.on(el, 'pointerdown', Tegaki.onLayerAlphaDragStart);
    cnt.appendChild(el);
    
    el = $T.el('input');
    el.id = 'tegaki-layer-alpha-opt';
    el.className = 'tegaki-stealth-input tegaki-range-lbl-xs';
    el.setAttribute('maxlength', 3);
    $T.on(el, 'input', Tegaki.onLayerAlphaChange);
    cnt.appendChild(el);
    
    row.appendChild(cnt);
    
    ctrl.appendChild(row);
    
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
    el.title = TegakiKeybinds.getCaption('toolSize');
    $T.on(el, 'input', Tegaki.onToolSizeChange);
    row.appendChild(el);
    
    el = $T.el('input');
    el.id = 'tegaki-size-lbl';
    el.setAttribute('maxlength', 3);
    el.className = 'tegaki-stealth-input tegaki-range-lbl';
    $T.on(el, 'input', Tegaki.onToolSizeChange);
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
    el.max = 100;
    el.step = 1;
    el.type = 'range';
    $T.on(el, 'input', Tegaki.onToolAlphaChange);
    row.appendChild(el);
    
    el = $T.el('input');
    el.id = 'tegaki-alpha-lbl';
    el.setAttribute('maxlength', 3);
    el.className = 'tegaki-stealth-input tegaki-range-lbl';
    $T.on(el, 'input', Tegaki.onToolAlphaChange);
    row.appendChild(el);
    
    ctrl.appendChild(row);
    
    return ctrl;
  },
  
  buildFlowCtrlGroup: function() {
    var el, ctrl, row;
    
    ctrl = this.buildCtrlGroup('flow', TegakiStrings.flow);
    
    row = $T.el('div');
    row.className = 'tegaki-ctrlrow';
    
    el = $T.el('input');
    el.id = 'tegaki-flow';
    el.className = 'tegaki-ctrl-range';
    el.min = 0;
    el.max = 100;
    el.step = 1;
    el.type = 'range';
    $T.on(el, 'input', Tegaki.onToolFlowChange);
    row.appendChild(el);
    
    el = $T.el('input');
    el.id = 'tegaki-flow-lbl';
    el.setAttribute('maxlength', 3);
    el.className = 'tegaki-stealth-input tegaki-range-lbl';
    $T.on(el, 'input', Tegaki.onToolFlowChange);
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
  
  buildColorCtrlGroup: function(mainColor) {
    var el, cnt, btn, ctrl, color, edge, i, palette, cls;
    
    edge = / Edge\//i.test(window.navigator.userAgent);
    
    ctrl = this.buildCtrlGroup('color', TegakiStrings.color);
    
    cnt = $T.el('div');
    cnt.id = 'tegaki-color-ctrl';
    
    el = $T.el('div');
    el.id = 'tegaki-color';
    edge && el.classList.add('tegaki-hidden');
    el.style.backgroundColor = mainColor;
    $T.on(el, 'mousedown', Tegaki.onMainColorClick);
    cnt.appendChild(el);
    
    el = $T.el('div');
    el.id = 'tegaki-palette-switcher';
    
    btn = $T.el('span');
    btn.id = 'tegaki-palette-prev-btn';
    btn.title = TegakiStrings.switchPalette;
    btn.setAttribute('data-prev', '1');
    btn.className = 'tegaki-ui-btn tegaki-icon tegaki-left-open tegaki-disabled';
    $T.on(btn, 'click', Tegaki.onSwitchPaletteClick);
    el.appendChild(btn);
    
    btn = $T.el('span');
    btn.id = 'tegaki-palette-next-btn';
    btn.title = TegakiStrings.switchPalette;
    btn.className = 'tegaki-ui-btn tegaki-icon tegaki-right-open';
    $T.on(btn, 'click', Tegaki.onSwitchPaletteClick);
    el.appendChild(btn);
    
    cnt.appendChild(el);
    
    ctrl.appendChild(cnt);
    
    cnt = $T.el('div');
    cnt.id = 'tegaki-color-grids';
    
    for (i = 0; i < TegakiColorPalettes.length; ++i) {
      el = $T.el('div');
      
      el.setAttribute('data-id', i);
      
      cls = 'tegaki-color-grid';
      
      palette = TegakiColorPalettes[i];
      
      if (palette.length <= 18) {
        cls += ' tegaki-color-grid-20';
      }
      else {
        cls += ' tegaki-color-grid-15';
      }
      
      if (i > 0) {
        cls += ' tegaki-hidden';
      }
      
      el.className = cls;
      
      for (color of palette) {
        btn = $T.el('div');
        btn.title = TegakiStrings.paletteSlotReplace;
        btn.className = 'tegaki-color-btn';
        btn.setAttribute('data-color', color);
        btn.style.backgroundColor = color;
        $T.on(btn, 'mousedown', Tegaki.onPaletteColorClick);
        el.appendChild(btn);
      }
      
      cnt.appendChild(el);
    }
    
    ctrl.appendChild(cnt);
    
    el = $T.el('input');
    el.id = 'tegaki-colorpicker';
    !edge && el.classList.add('tegaki-invis');
    el.value = color;
    el.type = 'color';
    $T.on(el, 'change', Tegaki.onColorPicked);
    
    ctrl.appendChild(el);
    
    return ctrl;
  },
  
  buildStatusCnt: function() {
    var cnt, el;
    
    cnt = $T.el('div');
    cnt.id = 'tegaki-status-cnt';
    
    if (Tegaki.saveReplay) {
      el = $T.el('div');
      el.id = 'tegaki-status-replay';
      el.textContent = '⬤';
      el.setAttribute('title', TegakiStrings.recordingEnabled);
      cnt.appendChild(el);
    }
    
    el = $T.el('div');
    el.id = 'tegaki-status-output';
    cnt.appendChild(el);
    
    el = $T.el('div');
    el.id = 'tegaki-status-version';
    el.textContent = 'tegaki.js v' + Tegaki.VERSION;
    cnt.appendChild(el);
    
    return cnt;
  },
  
  buildReplayControls: function() {
    var cnt, btn, el;
    
    cnt = $T.el('div');
    cnt.id = 'tegaki-replay-controls';
    cnt.className = 'tegaki-hidden';
    
    btn = $T.el('span');
    btn.id = 'tegaki-replay-gapless-btn';
    btn.className = 'tegaki-ui-cb-w';
    $T.on(btn, 'click', Tegaki.onReplayGaplessClick);
    
    el = $T.el('span');
    el.id = 'tegaki-replay-gapless-cb';
    el.className = 'tegaki-ui-cb';
    btn.appendChild(el);
    
    el = $T.el('span');
    el.className = 'tegaki-menu-lbl';
    el.textContent = TegakiStrings.gapless;
    btn.appendChild(el);
    
    cnt.appendChild(btn);
    
    btn = $T.el('span');
    btn.id = 'tegaki-replay-play-btn';
    btn.className = 'tegaki-ui-btn tegaki-icon tegaki-play';
    btn.setAttribute('title', TegakiStrings.play);
    $T.on(btn, 'click', Tegaki.onReplayPlayPauseClick);
    cnt.appendChild(btn);
    
    btn = $T.el('span');
    btn.className = 'tegaki-ui-btn tegaki-icon tegaki-to-start';
    btn.setAttribute('title', TegakiStrings.rewind);
    $T.on(btn, 'click', Tegaki.onReplayRewindClick);
    cnt.appendChild(btn);
    
    btn = $T.el('span');
    btn.id = 'tegaki-replay-slower-btn';
    btn.className = 'tegaki-ui-btn tegaki-icon tegaki-fast-bw';
    btn.setAttribute('title', TegakiStrings.slower);
    $T.on(btn, 'click', Tegaki.onReplaySlowDownClick);
    cnt.appendChild(btn);
    
    el = $T.el('span');
    el.id = 'tegaki-replay-speed-lbl';
    el.className = 'tegaki-menu-lbl';
    el.textContent = '1.0';
    cnt.appendChild(el);
    
    btn = $T.el('span');
    btn.id = 'tegaki-replay-faster-btn';
    btn.className = 'tegaki-ui-btn tegaki-icon tegaki-fast-fw';
    btn.setAttribute('title', TegakiStrings.faster);
    $T.on(btn, 'click', Tegaki.onReplaySpeedUpClick);
    cnt.appendChild(btn);
    
    el = $T.el('span');
    el.id = 'tegaki-replay-now-lbl';
    el.className = 'tegaki-menu-lbl';
    el.textContent = '00:00';
    cnt.appendChild(el);
    
    el = $T.el('span');
    el.id = 'tegaki-replay-end-lbl';
    el.className = 'tegaki-menu-lbl';
    el.textContent = '00:00';
    cnt.appendChild(el);
    
    return cnt;
  },
  
  buildLayerGridCell: function(layer) {
    var cnt, el, cell;
    
    cnt = $T.el('div');
    cnt.id = 'tegaki-layers-cell-' + layer.id;
    cnt.className = 'tegaki-layers-cell';
    cnt.setAttribute('data-id', layer.id);
    cnt.draggable = true;
    cnt.setAttribute('data-id', layer.id);
    
    $T.on(cnt, 'pointerdown', TegakiUI.onLayerSelectorPtrDown);
    $T.on(cnt, 'pointerup', Tegaki.onLayerSelectorClick);
    
    $T.on(cnt, 'dragstart', TegakiUI.onLayerDragStart);
    $T.on(cnt, 'dragover', TegakiUI.onLayerDragOver);
    $T.on(cnt, 'drop', TegakiUI.onLayerDragDrop);
    $T.on(cnt, 'dragend', TegakiUI.onLayerDragEnd);
    $T.on(cnt, 'dragleave', TegakiUI.onLayerDragLeave);
    $T.on(cnt, 'dragexit', TegakiUI.onLayerDragLeave);
    
    // visibility toggle
    cell = $T.el('div');
    cell.className = 'tegaki-layers-cell-v';
    
    el = $T.el('span');
    el.id = 'tegaki-layers-cb-v-' + layer.id;
    el.className = 'tegaki-ui-cb';
    el.setAttribute('data-id', layer.id);
    el.title = TegakiStrings.toggleVisibility;
    $T.on(el, 'click', Tegaki.onLayerToggleVisibilityClick);
    
    if (layer.visible) {
      el.className += ' tegaki-ui-cb-a';
    }
    
    cell.appendChild(el);
    cnt.appendChild(cell);
    
    // preview
    cell = $T.el('div');
    cell.className = 'tegaki-layers-cell-p';
    
    el = $T.el('canvas');
    el.id = 'tegaki-layers-p-canvas-' + layer.id;
    el.className = 'tegaki-alpha-bg-xs';
    [el.width, el.height] = TegakiUI.getLayerPreviewSize(); 
    
    cell.appendChild(el);
    cnt.appendChild(cell);
    
    // name
    cell = $T.el('div');
    cell.className = 'tegaki-layers-cell-n';
    
    el = $T.el('div');
    el.id = 'tegaki-layer-name-' + layer.id;
    el.className = 'tegaki-ellipsis';
    el.setAttribute('data-id', layer.id);
    el.textContent = layer.name;
    $T.on(el, 'dblclick', Tegaki.onLayerNameChangeClick);
    
    cell.appendChild(el);
    cnt.appendChild(cell);
    
    return cnt;
  },
  
  // ---
  
  onLayerSelectorPtrDown: function(e) {
    if (e.pointerType === 'mouse') {
      if (this.hasAttribute('data-nodrag')) {
        this.removeAttribute('data-nodrag');
        $T.on(this, 'dragstart', TegakiUI.onLayerDragStart);
      }
    }
    else if (!this.hasAttribute('data-nodrag')) {
      this.setAttribute('data-nodrag', 1);
      $T.off(this, 'dragstart', TegakiUI.onLayerDragStart);
    }
  },
  
  onLayerDragStart: function(e) {
    var el, id;
    
    if (e.ctrlKey) {
      return;
    }
    
    TegakiUI.draggedNode = null;
    
    if (!$T.id('tegaki-layers-grid').children[1]) {
      e.preventDefault();
      return;
    }
    
    id = +e.target.getAttribute('data-id');
    
    el = $T.el('div');
    el.className = 'tegaki-invis';
    e.dataTransfer.setDragImage(el, 0, 0);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    
    TegakiUI.draggedNode = e.target;
    
    TegakiUI.updateLayersGridDragExt(true);
  },
  
  onLayerDragOver: function(e) {
    e.preventDefault();
    
    e.dataTransfer.dropEffect = 'move';
    
    TegakiUI.updateLayersGridDragEffect(
      e.target,
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
    var tgtId, srcId, belowPos;
    
    e.preventDefault();
    
    TegakiUI.draggedNode = null;
    
    [tgtId] = TegakiUI.layersGridFindDropTgt(e.target);
    srcId = +e.dataTransfer.getData('text/plain');
    
    TegakiUI.updateLayersGridDragEffect(e.target.parentNode);
    TegakiUI.updateLayersGridDragExt(false);
    
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
      Tegaki.setActiveLayer(srcId);
    }
    
    Tegaki.moveSelectedLayers(belowPos);
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
      el.draggable = true;
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
    
    [tgtId, tgt] = TegakiUI.layersGridFindDropTgt(tgt);
    
    if (!TegakiUI.layersGridCanDrop(tgtId, srcId)) {
      return;
    }
    
    if (!tgt) {
      tgt = $T.id('tegaki-layers-grid');
    }
    
    tgt.classList.add('tegaki-layers-cell-d');
  },
  
  layersGridFindDropTgt: function(tgt) {
    var tgtId, cnt;
    
    tgtId = +tgt.getAttribute('data-id');
    
    cnt = $T.id('tegaki-ctrlgrp-layers');
    
    while (!tgt.draggable && tgt !== cnt) {
      tgt = tgt.parentNode;
      tgtId = +tgt.getAttribute('data-id');
    }
    
    if (tgt === cnt || !tgt.draggable) {
      return [0, null];
    }
    
    return [tgtId, tgt];
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
  
  setReplayMode: function(flag) {
    Tegaki.bg.classList[flag ? 'add' : 'remove']('tegaki-replay-mode');
  },
  
  // ---
  
  onToolChanged: function() {
    $T.id('tegaki-toolmode-bar').classList.remove('tegaki-hidden');
    TegakiUI.updateToolSize();
    TegakiUI.updateToolAlpha();
    TegakiUI.updateToolFlow();
    TegakiUI.updateToolModes();
  },
  
  // ---
  
  updateLayerAlphaOpt: function() {
    var el = $T.id('tegaki-layer-alpha-opt');
    el.value = Math.round(Tegaki.activeLayer.alpha * 100);
  },
  
  updateLayerName: function(layer) {
    var el;
    
    if (el = $T.id('tegaki-layer-name-' + layer.id)) {
      el.textContent = layer.name;
    }
  },
  
  updateLayerPreview: function(layer) {
    var canvas, ctx;
    
    canvas = $T.id('tegaki-layers-p-canvas-' + layer.id);
    
    if (!canvas) {
      return;
    }
    
    ctx = TegakiUI.getLayerPreviewCtx(layer);
    
    if (!ctx) {
      ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      TegakiUI.setLayerPreviewCtx(layer, ctx);
    }
    
    $T.clearCtx(ctx);
    ctx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
  },
  
  updateLayerPreviewSize: function(regen) {
    var el, layer, size;
    
    size = TegakiUI.getLayerPreviewSize();
    
    for (layer of Tegaki.layers) {
      if (el = $T.id('tegaki-layers-p-canvas-' + layer.id)) {
        [el.width, el.height] = size;
        
        if (regen) {
          TegakiUI.updateLayerPreview(layer);
        }
      }
    }
  },
  
  getLayerPreviewCtx: function(layer) {
    TegakiUI.layerPreviewCtxCache.get(layer);
  },
  
  setLayerPreviewCtx: function(layer, ctx) {
    TegakiUI.layerPreviewCtxCache.set(layer, ctx);
  },
  
  deleteLayerPreviewCtx: function(layer) {
    TegakiUI.layerPreviewCtxCache.delete(layer);
  },
  
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
    
    TegakiUI.updateLayerAlphaOpt();
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
    var el;
    
    el = $T.id('tegaki-layers-cb-v-' + id);
    
    if (!el) {
      return;
    }
    
    if (flag) {
      el.classList.add('tegaki-ui-cb-a');
    }
    else {
      el.classList.remove('tegaki-ui-cb-a');
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
  
  updateToolSize: function() {
    var el = $T.id('tegaki-ctrlgrp-size');
    
    if (Tegaki.tool.useSize) {
      el.classList.remove('tegaki-hidden');
      
      $T.id('tegaki-size-lbl').value = Tegaki.tool.size;
      $T.id('tegaki-size').value = Tegaki.tool.size;
    }
    else {
      el.classList.add('tegaki-hidden');
    }
  },
  
  updateToolAlpha: function() {
    var val, el = $T.id('tegaki-ctrlgrp-alpha');
    
    if (Tegaki.tool.useAlpha) {
      el.classList.remove('tegaki-hidden');
      
      val = Math.round(Tegaki.tool.alpha * 100);
      $T.id('tegaki-alpha-lbl').value = val;
      $T.id('tegaki-alpha').value = val;
    }
    else {
      el.classList.add('tegaki-hidden');
    }
  },
  
  updateToolFlow: function() {
    var val, el = $T.id('tegaki-ctrlgrp-flow');
    
    if (Tegaki.tool.useFlow) {
      el.classList.remove('tegaki-hidden');
      
      val = Math.round(Tegaki.tool.flow * 100);
      $T.id('tegaki-flow-lbl').value = val;
      $T.id('tegaki-flow').value = val;
    }
    else {
      el.classList.add('tegaki-hidden');
    }
  },
  
  updateToolDynamics: function() {
    var ctrl, cb;
    
    ctrl = $T.id('tegaki-tool-mode-dynamics');
    
    if (!Tegaki.tool.usesDynamics()) {
      ctrl.classList.add('tegaki-hidden');
    }
    else {
      cb = $T.id('tegaki-tool-mode-dynamics-size');
      
      if (Tegaki.tool.useSizeDynamics) {
        if (Tegaki.tool.sizeDynamicsEnabled) {
          cb.classList.add('tegaki-sw-btn-a');
        }
        else {
          cb.classList.remove('tegaki-sw-btn-a');
        }
        
        cb.classList.remove('tegaki-hidden');
      }
      else {
        cb.classList.add('tegaki-hidden');
      }
      
      cb = $T.id('tegaki-tool-mode-dynamics-alpha');
      
      if (Tegaki.tool.useAlphaDynamics) {
        if (Tegaki.tool.alphaDynamicsEnabled) {
          cb.classList.add('tegaki-sw-btn-a');
        }
        else {
          cb.classList.remove('tegaki-sw-btn-a');
        }
        
        cb.classList.remove('tegaki-hidden');
      }
      else {
        cb.classList.add('tegaki-hidden');
      }
      
      cb = $T.id('tegaki-tool-mode-dynamics-flow');
      
      if (Tegaki.tool.useFlowDynamics) {
        if (Tegaki.tool.flowDynamicsEnabled) {
          cb.classList.add('tegaki-sw-btn-a');
        }
        else {
          cb.classList.remove('tegaki-sw-btn-a');
        }
        
        cb.classList.remove('tegaki-hidden');
      }
      else {
        cb.classList.add('tegaki-hidden');
      }
      
      ctrl.classList.remove('tegaki-hidden');
    }
  },
  
  updateToolShape: function() {
    var tipId, ctrl, cnt, btn, tipList;
    
    ctrl = $T.id('tegaki-tool-mode-tip');
    
    if (!Tegaki.tool.tipList) {
      ctrl.classList.add('tegaki-hidden');
    }
    else {
      tipList = Tegaki.tool.tipList;
      
      cnt = $T.id('tegaki-tool-mode-tip-ctrl');
      
      cnt.innerHTML = '';
      
      for (tipId = 0; tipId < tipList.length; ++tipId) {
        btn = $T.el('span');
        btn.id = 'tegaki-tool-mode-tip-' + tipId;
        btn.className = 'tegaki-sw-btn';
        btn.setAttribute('data-id', tipId);
        btn.textContent = TegakiStrings[tipList[tipId]];
        
        $T.on(btn, 'mousedown', Tegaki.onToolTipClick);
        
        cnt.appendChild(btn);
        
        if (Tegaki.tool.tipId === tipId) {
          btn.classList.add('tegaki-sw-btn-a');
        }
      }
      
      ctrl.classList.remove('tegaki-hidden');
    }
  },
  
  updateToolPreserveAlpha: function() {
    var cb, ctrl;
    
    ctrl = $T.id('tegaki-tool-mode-mask');
    
    if (!Tegaki.tool.usePreserveAlpha) {
      ctrl.classList.add('tegaki-hidden');
    }
    else {
      cb = $T.id('tegaki-tool-mode-mask-alpha');
      
      if (Tegaki.tool.preserveAlphaEnabled) {
        cb.classList.add('tegaki-sw-btn-a');
      }
      else {
        cb.classList.remove('tegaki-sw-btn-a');
      }
      
      ctrl.classList.remove('tegaki-hidden');
    }
  },
  
  updateToolModes: function() {
    var el, flag;
    
    TegakiUI.updateToolShape();
    TegakiUI.updateToolDynamics();
    TegakiUI.updateToolPreserveAlpha();
    
    flag = false;
    
    for (el of $T.id('tegaki-toolmode-bar').children) {
      if (!flag && !el.classList.contains('tegaki-hidden')) {
        el.classList.add('tegaki-ui-borderless');
        flag = true;
      }
      else {
        el.classList.remove('tegaki-ui-borderless');
      }
    }
  },
  
  updateUndoRedo: function(undoSize, redoSize) {
    var u, r;
    
    if (Tegaki.replayMode) {
      return;
    }
    
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
    $T.id('tegaki-zoom-lbl').textContent = (Tegaki.zoomFactor * 100) + '%';
    
    if (Tegaki.zoomLevel + Tegaki.zoomBaseLevel >= Tegaki.zoomFactorList.length) {
      $T.id('tegaki-zoomin-btn').classList.add('tegaki-disabled');
    }
    else {
      $T.id('tegaki-zoomin-btn').classList.remove('tegaki-disabled');
    }
    
    if (Tegaki.zoomLevel + Tegaki.zoomBaseLevel <= 0) {
      $T.id('tegaki-zoomout-btn').classList.add('tegaki-disabled');
    }
    else {
      $T.id('tegaki-zoomout-btn').classList.remove('tegaki-disabled');
    }
  },
  
  updateColorPalette: function() {
    var el, nodes, id;
    
    id = Tegaki.colorPaletteId;
    
    nodes = $T.cls('tegaki-color-grid', $T.id('tegaki-color-grids'));
    
    for (el of nodes) {
      if (+el.getAttribute('data-id') === id) {
        el.classList.remove('tegaki-hidden');
      }
      else {
        el.classList.add('tegaki-hidden');
      }
    }
    
    el = $T.id('tegaki-palette-prev-btn');
    
    if (id === 0) {
      el.classList.add('tegaki-disabled');
    }
    else {
      el.classList.remove('tegaki-disabled');
    }
    
    el = $T.id('tegaki-palette-next-btn');
    
    if (id === TegakiColorPalettes.length - 1) {
      el.classList.add('tegaki-disabled');
    }
    else {
      el.classList.remove('tegaki-disabled');
    }
  },
  
  updateReplayTime: function(full) {
    var now, end, r = Tegaki.replayViewer;
    
    now = r.getCurrentPos();
    
    end = r.getDuration();
    
    if (now > end) {
      now = end;
    }
    
    $T.id('tegaki-replay-now-lbl').textContent = $T.msToHms(now);
    
    if (full) {
      $T.id('tegaki-replay-end-lbl').textContent = $T.msToHms(end);
    }
  },
  
  updateReplayControls: function() {
    TegakiUI.updateReplayGapless();
    TegakiUI.updateReplayPlayPause();
    TegakiUI.updateReplaySpeed();
  },
  
  updateReplayGapless: function() {
    var el, r = Tegaki.replayViewer;
    
    el = $T.id('tegaki-replay-gapless-cb');
    
    if (r.gapless) {
      el.classList.add('tegaki-ui-cb-a');
    }
    else {
      el.classList.remove('tegaki-ui-cb-a');
    }
  },
  
  updateReplayPlayPause: function() {
    var el, r = Tegaki.replayViewer;
    
    el = $T.id('tegaki-replay-play-btn');
    
    if (r.playing) {
      el.classList.remove('tegaki-play');
      el.classList.add('tegaki-pause');
      el.setAttribute('title', TegakiStrings.pause);
    }
    else {
      el.classList.add('tegaki-play');
      el.classList.remove('tegaki-pause');
      el.setAttribute('title', TegakiStrings.play);
      
      if (r.getCurrentPos() < r.getDuration()) {
        el.classList.remove('tegaki-disabled');
      }
      else {
        el.classList.add('tegaki-disabled');
      }
    }
  },
  
  updateReplaySpeed: function() {
    var el, r = Tegaki.replayViewer;
    
    $T.id('tegaki-replay-speed-lbl').textContent = r.speed.toFixed(1);
    
    el = $T.id('tegaki-replay-slower-btn');
    
    if (r.speedIndex === 0) {
      el.classList.add('tegaki-disabled');
    }
    else {
      el.classList.remove('tegaki-disabled');
    }
    
    el = $T.id('tegaki-replay-faster-btn');
    
    if (r.speedIndex === r.speedList.length - 1) {
      el.classList.add('tegaki-disabled');
    }
    else {
      el.classList.remove('tegaki-disabled');
    }
  },
  
  enableReplayControls: function(flag) {
    if (flag) {
      $T.id('tegaki-replay-controls').classList.remove('tegaki-hidden');
    }
    else {
      $T.id('tegaki-replay-controls').classList.add('tegaki-hidden');
    }
  },
  
  setRecordingStatus: function(flag) {
    var el = $T.id('tegaki-status-replay');
    
    if (flag) {
      el.classList.remove('tegaki-hidden');
    }
    else {
      el.classList.add('tegaki-hidden');
    }
  }
};
