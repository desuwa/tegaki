var Tegaki;

Tegaki = {
  VERSION: '0.6.0',
  
  startTimeStamp: 0,
  
  bg: null,
  canvas: null,
  ctx: null,
  layers: [],
  
  layersCnt: null,
  canvasCnt: null,
  
  cursorCanvas: null,
  
  ghostBuffer: null,
  blendBuffer: null,
  ghostBuffer32: null,
  blendBuffer32: null,
  
  cursorCtx: null,
  activeCtx: null,
  flatCtx: null,
  flatCtxCached: null,
  
  activeLayerId: null,
  layerCounter: 0,
  selectedLayers: new Set(),
  
  activePointerId: 0,
  activePointerIsPen: false,
  
  ptrEvtPenCount: 0,
  ptrEvtMouseCount: 0,
  
  isPainting: false,
  isErasing: false,
  isColorPicking: false,
  
  offsetX: 0,
  offsetY: 0,
  
  zoomLevel: 1,
  zoomMax: 5,
  zoomMin: 1,
  
  TWOPI: 2 * Math.PI,
  
  toolList: [
    TegakiPencil,
    TegakiPen,
    TegakiAirbrush,
    TegakiBucket,
    TegakiTone,
    TegakiPipette,
    TegakiBlur,
    TegakiEraser
  ],
  
  tools: {},
  
  defaultColorPalette: [
    '#ffffff', '#000000', '#888888', '#b47575', '#c096c0',
    '#fa9696', '#8080ff', '#ffb6ff', '#e7e58d', '#25c7c9',
    '#99cb7b', '#e7962d', '#f9ddcf', '#fcece2'
  ],
  
  tool: null,
  toolColor: '#000000',
  
  bgColor: '#ffffff',
  maxSize: 64,
  maxLayers: 25,
  baseWidth: null,
  baseHeight: null,
  
  onDoneCb: null,
  onCancelCb: null,
  
  MASK_NORMAL: 0,
  MASK_OVER: 1,
  
  open: function(opts) {
    var bg, cnt, cnt2, el, ctrl, canvas, self = Tegaki;
    
    if (self.bg) {
      self.resume();
      return;
    }
    
    self.startTimeStamp = Date.now();
    
    self.ptrEvtPenCount = 0;
    self.ptrEvtMouseCount = 0;
    
    if (opts.bgColor) {
      self.bgColor = opts.bgColor;
    }
    
    self.onDoneCb = opts.onDone;
    self.onCancelCb = opts.onCancel;
    
    self.initTools();
    
    //
    // Grid container
    //
    bg = $T.el('div');
    bg.id = 'tegaki';
    
    self.bg = bg;
    
    //
    // Menu area
    //
    el = $T.el('div');
    el.id = 'tegaki-menu-cnt';
    
    el.appendChild(TegakiUI.buildMenuBar());
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
    cnt = $T.el('div');
    cnt.id = 'tegaki-canvas-cnt';
    
    cnt2 =  $T.el('div');
    cnt2.id = 'tegaki-layers-wrap';
    
    canvas = $T.el('canvas');
    canvas.id = 'tegaki-canvas';
    canvas.width = self.baseWidth = opts.width;
    canvas.height = self.baseHeight = opts.height;
    
    el = $T.el('div');
    el.id = 'tegaki-layers';
    el.appendChild(canvas);
    self.layersCnt = el;
    
    cnt2.appendChild(el);
    
    cnt.appendChild(cnt2);
    
    bg.appendChild(cnt);
    
    self.canvasCnt = cnt;
    
    //
    // Controls area
    //
    ctrl = $T.el('div');
    ctrl.id = 'tegaki-ctrl-cnt';
    
    // Zoom control
    ctrl.appendChild(TegakiUI.buildZoomCtrlGroup(self.zoomLevel));
    
    // Colorpicker
    ctrl.appendChild(
      TegakiUI.buildColorCtrlGroup(self.toolColor, self.defaultColorPalette)
    );

    // Size control
    ctrl.appendChild(TegakiUI.buildSizeCtrlGroup());
    
    // Alpha control
    ctrl.appendChild(TegakiUI.buildAlphaCtrlGroup());
    
    // Layers control
    ctrl.appendChild(TegakiUI.buildLayersCtrlGroup());
    
    // ---
    
    bg.appendChild(ctrl);
    
    //
    // Status area
    //
    bg.appendChild(TegakiUI.buildStatusCnt());

    // ---
    
    document.body.appendChild(bg);
    document.body.classList.add('tegaki-backdrop');
    
    self.centerLayersCnt();
    
    self.canvas = canvas;
    
    self.ctx = canvas.getContext('2d');
    self.ctx.fillStyle = self.bgColor;
    self.ctx.fillRect(0, 0, opts.width, opts.height);
    
    self.initGhostLayers();
    
    TegakiLayers.addLayer();
    
    TegakiLayers.setActiveLayer(0);
    
    self.initKeybinds();
    
    self.onHistoryChange(0, 0);
    
    self.setTool('pencil');
    
    TegakiUI.updateZoomLevel();
    
    self.updatePosOffset();
    
    self.updateFlatCtx();
    
    self.bindGlobalEvents();
  },
  
  initTools: function() {
    var klass, tool;
    
    for (klass of Tegaki.toolList) {
      tool = new klass();
      Tegaki.tools[tool.name] = tool;
    }
  },
  
  bindGlobalEvents: function() {
    var self = Tegaki;
    
    $T.on(self.canvasCnt, 'pointermove', self.onPointerMove);
    $T.on(self.canvasCnt, 'pointerdown', self.onPointerDown);
    $T.on(self.bg, 'contextmenu', self.onDummy);
    
    $T.on(document, 'pointerup', self.onPointerUp);
    $T.on(document, 'pointercancel', self.onPointerUp);
    $T.on(window, 'resize', self.updatePosOffset);
    $T.on(window, 'scroll', self.updatePosOffset);
    
    $T.on(document, 'keydown', TegakiKeybinds.resolve);
    
    $T.on(window, 'beforeunload', Tegaki.onTabClose);
  },
  
  unBindGlobalEvents: function() {
    var self = Tegaki;
    
    $T.off(self.canvasCnt, 'pointermove', self.onPointerMove);
    $T.off(self.canvasCnt, 'pointerdown', self.onPointerDown);
    $T.off(self.bg, 'contextmenu', self.onDummy);
    
    $T.off(document, 'pointerup', self.onPointerUp);
    $T.off(document, 'pointercancel', self.onPointerUp);
    $T.off(window, 'resize', self.updatePosOffset);
    $T.off(window, 'scroll', self.updatePosOffset);
    
    $T.off(document, 'keydown', TegakiKeybinds.resolve);
    
    $T.off(window, 'beforeunload', Tegaki.onTabClose);
  },
  
  initGhostLayers: function() {
    var el;
    
    Tegaki.createBuffers();
    
    el = $T.el('canvas');
    el.id = 'tegaki-cursor-layer';
    el.width = Tegaki.baseWidth;
    el.height = Tegaki.baseHeight;
    Tegaki.layersCnt.appendChild(el);
    Tegaki.cursorCanvas = el;
    Tegaki.cursorCtx = el.getContext('2d');
    
    el = $T.el('canvas');
    el.width = Tegaki.baseWidth;
    el.height = Tegaki.baseHeight;
    Tegaki.flatCtx = el.getContext('2d');
    
    el = $T.el('canvas');
    el.width = Tegaki.baseWidth;
    el.height = Tegaki.baseHeight;
    Tegaki.flatCtxCached = el.getContext('2d');
  },
  
  createBuffers() {
    Tegaki.ghostBuffer = new Uint8ClampedArray(Tegaki.baseWidth * Tegaki.baseHeight * 4);
    Tegaki.blendBuffer = new Uint8ClampedArray(Tegaki.baseWidth * Tegaki.baseHeight * 4);
    Tegaki.ghostBuffer32 = new Uint32Array(Tegaki.ghostBuffer.buffer);
    Tegaki.blendBuffer32 = new Uint32Array(Tegaki.blendBuffer.buffer);
  },
  
  clearBuffers() {
    Tegaki.ghostBuffer32.fill(0);
    Tegaki.blendBuffer32.fill(0);
  },
  
  destroyBuffers() {
    Tegaki.ghostBuffer = null;
    Tegaki.blendBuffer = null;
    Tegaki.ghostBuffer32 = null;
    Tegaki.blendBuffer32 = null;
  },
  
  disableSmoothing: function(ctx) {
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
  },
  
  centerLayersCnt: function() {
    var style = Tegaki.layersCnt.style;
    
    style.width = Tegaki.baseWidth + 'px';
    style.height = Tegaki.baseHeight + 'px';
  },
  
  onTabClose: function(e) {
    e.preventDefault();
    e.returnValue = '';
  },
  
  initKeybinds: function() {
    var cls;
    
    TegakiKeybinds.map = {
      'ctrl-z': [ TegakiHistory, 'undo' ],
      'ctrl-y': [ TegakiHistory, 'redo' ],
      'ctrl-s': null,
    };
    
    for (var tool in Tegaki.tools) {
      cls = Tegaki.tools[tool];
      
      if (cls.keybind) {
        TegakiKeybinds.map[cls.keybind] = [ cls, 'set' ];
      }
    }
  },
  
  getCursorPos: function(e, axis) {
    if (axis === 0) {
      return 0 | ((
        e.clientX
          + window.pageXOffset
          + Tegaki.canvasCnt.scrollLeft
          - Tegaki.offsetX
        ) / Tegaki.zoomLevel);
    }
    else {
      return 0 | ((
        e.clientY
          + window.pageYOffset
          + Tegaki.canvasCnt.scrollTop
          - Tegaki.offsetY
        ) / Tegaki.zoomLevel);
    }
  },
  
  resume: function() {
    Tegaki.bg.classList.remove('tegaki-hidden');
    document.body.classList.add('tegaki-backdrop');
    Tegaki.centerLayersCnt();
    Tegaki.updatePosOffset();
    Tegaki.bindGlobalEvents();
  },
  
  hide: function() {
    Tegaki.bg.classList.add('tegaki-hidden');
    document.body.classList.remove('tegaki-backdrop');
    Tegaki.unBindGlobalEvents();
  },
  
  destroy: function() {
    Tegaki.unBindGlobalEvents();
    
    TegakiHistory.clear();
    
    Tegaki.bg.parentNode.removeChild(Tegaki.bg);
    
    document.body.classList.remove('tegaki-backdrop');
    
    Tegaki.startTimeStamp = 0;
    Tegaki.ptrEvtPenCount = 0;
    Tegaki.ptrEvtMouseCount = 0;
    
    Tegaki.bg = null;
    Tegaki.canvasCnt = null;
    Tegaki.layersCnt = null;
    Tegaki.canvas = null;
    Tegaki.ctx = null;
    Tegaki.layers = [];
    Tegaki.layerCounter = 0;
    Tegaki.zoomLevel = 1;
    Tegaki.activeCtx = null;
    Tegaki.cursorCtx = null;
    Tegaki.cursorCanvas = null;
    Tegaki.flatCtx = null;
    Tegaki.flatCtxCached = null;
    
    Tegaki.destroyBuffers();
  },
  
  flatten: function(ctx) {
    var i, layer, canvas;
    
    if (!ctx) {
      canvas = $T.el('canvas');
      ctx = canvas.getContext('2d');
    }
    else {
      canvas = ctx.canvas;
    }
    
    canvas.width = Tegaki.canvas.width;
    canvas.height = Tegaki.canvas.height;
    
    ctx.drawImage(Tegaki.canvas, 0, 0);
    
    for (i = 0; layer = Tegaki.layers[i]; ++i) {
      if (layer.canvas.classList.contains('tegaki-hidden')) {
        continue;
      }
      ctx.drawImage(layer.canvas, 0, 0);
    }
    
    return canvas;
  },
  
  onMainColorClick: function(e) {
    var el;
    e.preventDefault();
    el = $T.id('tegaki-colorpicker');
    el.click();
  },
  
  onPaletteColorClick: function(e) {
    if (e.button === 2) {
      this.style.backgroundColor = Tegaki.toolColor;
      this.setAttribute('data-color', Tegaki.toolColor);
    }
    else if (e.button === 0) {
      Tegaki.setToolColor(this.getAttribute('data-color'));
    }
  },
  
  onColorPicked: function(e) {
    $T.id('tegaki-color').style.backgroundColor = this.value;
    Tegaki.setToolColor(this.value);
    this.blur();
  },
  
  renderCursor: function(x0, y0) {
    var canvas, e, x, y, imageData, data, side,
      srcImageData, srcData, c, color, r, rr;
    
    Tegaki.updateFlatCtx(Tegaki.isPainting);
    
    side = 0 | Tegaki.tool.size;
    r = 0 | (side / 2);
    rr = 0 | ((side + 1) % 2);
    
    Tegaki.clearCtx(Tegaki.cursorCtx);
    
    srcImageData = Tegaki.flatCtx.getImageData(x0 - r, y0 - r, side, side);
    srcData = new Uint32Array(srcImageData.data.buffer);
    
    imageData = Tegaki.cursorCtx.getImageData(x0 - r, y0 - r, side, side);
    data = new Uint32Array(imageData.data.buffer);
    
    color = 0x00FFFF7F;
    
    x = r;
    y = 0;
    e = 1 - r;
    c = r;
    
    while (x >= y) {
      data[(c + x - rr + (c + y - rr) * side)] =
        srcData[(c + x - rr + (c + y - rr) * side)] ^ color;
      data[(c + y - rr + (c + x - rr) * side)] =
        srcData[(c + y - rr + (c + x - rr) * side)] ^ color;
      
      data[(c - y + (c + x - rr) * side)] =
        srcData[(c - y + (c + x - rr) * side)] ^ color;
      data[(c - x + (c + y - rr) * side)] =
        srcData[(c - x + (c + y - rr) * side)] ^ color;
      
      data[(c - x + (c - y) * side)] =
        srcData[(c - x + (c - y) * side)] ^ color;
      data[(c - y + (c - x) * side)] =
        srcData[(c - y + (c - x) * side)] ^ color;
      
      data[(c + y - rr + (c - x) * side)] =
        srcData[(c + y - rr + (c - x) * side)] ^ color;
      data[(c + x - rr + (c - y) * side)] =
        srcData[(c + x - rr + (c - y) * side)] ^ color;
        
      ++y;
      
      if (e <= 0) {
        e += 2 * y + 1;
      }
      else {
        --x;
        e += 2 * (y - x) + 1;
      }
    }
    
    Tegaki.cursorCtx.putImageData(imageData, x0 - r, y0 - r);
    
    return canvas;
  },
  
  setToolSize: function(size) {
    Tegaki.tool.setSize(size);
    Tegaki.updateCursorStatus();
  },
  
  setToolAlpha: function(alpha) {
    Tegaki.tool.setAlpha(alpha);
  },
  
  setToolColor: function(color) {
    Tegaki.toolColor = color;
    $T.id('tegaki-color').style.backgroundColor = color;
    $T.id('tegaki-colorpicker').value = color;
    Tegaki.tool.setColor(color);
  },
  
  setTool: function(tool) {
    Tegaki.tools[tool].set();
  },
  
  setZoom: function(level) {
    var el, nodes, i;
    
    if (level > Tegaki.zoomMax || level < Tegaki.zoomMin) {
      return;
    }
    
    Tegaki.zoomLevel = level;
    
    TegakiUI.updateZoomLevel();
    
    nodes = Tegaki.layersCnt.children;
    
    for (i = 0; el = nodes[i]; ++i) {
      Tegaki.updateCanvasZoomSize(el);
    }
    
    Tegaki.layersCnt.style.width = Tegaki.baseWidth * Tegaki.zoomLevel + 'px';
    Tegaki.layersCnt.style.height = Tegaki.baseHeight * Tegaki.zoomLevel + 'px';
    
    Tegaki.updatePosOffset();
    Tegaki.updateFlatCtx();
  },
  
  updateCanvasZoomSize: function(el) {
    el.style.width = Tegaki.baseWidth * Tegaki.zoomLevel + 'px';
    el.style.height = Tegaki.baseHeight * Tegaki.zoomLevel + 'px';
  },
  
  onZoomChange: function() {
    if (this.hasAttribute('data-in')) {
      Tegaki.setZoom(Tegaki.zoomLevel + 1);
    }
    else {
      Tegaki.setZoom(Tegaki.zoomLevel - 1);
    }
  },
  
  onNewClick: function() {
    var width, height, tmp;
    
    width = prompt(TegakiStrings.promptWidth, Tegaki.canvas.width);
    if (!width) { return; }
    
    height = prompt(TegakiStrings.promptHeight, Tegaki.canvas.height);
    if (!height) { return; }
    
    width = +width;
    height = +height;
    
    if (width < 1 || height < 1) {
      alert(TegakiStrings.badDimensions);
      return;
    }
    
    tmp = {};
    Tegaki.copyContextState(Tegaki.activeCtx, tmp);
    Tegaki.resizeCanvas(width, height);
    Tegaki.copyContextState(tmp, Tegaki.activeCtx);
    
    TegakiHistory.clear();
    Tegaki.centerLayersCnt();
    Tegaki.updatePosOffset();
  },
  
  onOpenClick: function() {
    var el, tainted;
    
    tainted = TegakiHistory.undoStack[0] || TegakiHistory.redoStack[0];
    
    if (!tainted || confirm(TegakiStrings.confirmChangeCanvas)) {
      el = $T.id('tegaki-filepicker');
      el.click();
    }
  },
  
  onExportClick: function() {
    Tegaki.flatten().toBlob(function(b) {
      var el = $T.el('a');
      el.className = 'tegaki-hidden';
      el.download = $T.generateFilename() + '.png';
      el.href = URL.createObjectURL(b);
      Tegaki.bg.appendChild(el);
      el.click();
      Tegaki.bg.removeChild(el);
    }, 'image/png');
  },
  
  onUndoClick: function() {
    TegakiHistory.undo();
  },
  
  onRedoClick: function() {
    TegakiHistory.redo();
  },
  
  onHistoryChange: function(undoSize, redoSize) {
    TegakiUI.updateUndoRedo(undoSize, redoSize);
  },
  
  onDoneClick: function() {
    Tegaki.hide();
    Tegaki.onDoneCb();
  },
  
  onCancelClick: function() {
    if (!confirm(TegakiStrings.confirmCancel)) {
      return;
    }
    
    Tegaki.destroy();
    Tegaki.onCancelCb();
  },
  
  onToolSizeChange: function() {
    var val = +this.value;
    
    if (val < 1) {
      val = 1;
    }
    else if (val > Tegaki.maxSize) {
      val = Tegaki.maxSize;
    }
    
    Tegaki.setToolSize(val);
    TegakiUI.updateToolSize();
  },
  
  onToolAlphaChange: function(e) {
    var val = +this.value;
    
    val = val / 100;
    
    if (val < 0.0) {
      val = 0.0;
    }
    else if (val > 1.0) {
      val = 1.0;
    }
    
    Tegaki.setToolAlpha(val);
    TegakiUI.updateToolAlpha();
  },
  
  onToolPressureSizeClick: function(e) {
    if (!Tegaki.tool.useSizeDynamics) {
      return;
    }
    
    Tegaki.tool.setSizeDynamics(!Tegaki.tool.sizeDynamicsEnabled);
    
    TegakiUI.updateToolDynamics();
  },
  
  onToolPressureAlphaClick: function(e) {
    if (!Tegaki.tool.useAlphaDynamics) {
      return;
    }
    
    Tegaki.tool.setAlphaDynamics(!Tegaki.tool.alphaDynamicsEnabled);
    
    TegakiUI.updateToolDynamics();
  },
  
  onToolPreserveAlphaClick: function(e) {
    if (!Tegaki.tool.usePreserveAlpha) {
      return;
    }
    
    Tegaki.tool.setPreserveAlpha(!Tegaki.tool.preserveAlphaEnabled);
    
    TegakiUI.updateToolPreserveAlpha();
  },
  
  onToolTipClick: function(e) {
    var tip = e.target.getAttribute('data-id');
    
    if (tip !== Tegaki.tool.tip) {
      Tegaki.tool.setTip(tip);
      TegakiUI.updateToolShape();
    }
  },
  
  onLayerSelectorClick: function(e) {
    var id = +this.getAttribute('data-id');
    
    if (e.ctrlKey) {
      TegakiLayers.selectedLayersToggle(id);
    }
    else {
      TegakiLayers.setActiveLayer(id);
    }
  },
  
  onLayerAddClick: function() {
    var action;
    
    if (Tegaki.layers.length >= Tegaki.maxLayers) {
      alert(TegakiStrings.tooManyLayers);
      return;
    }
    
    TegakiHistory.push(action = TegakiLayers.addLayer());
    
    TegakiLayers.setActiveLayer(action.aLayerIdAfter);
  },
  
  onLayerDeleteClick: function() {
    var action;
    
    if (Tegaki.selectedLayers.size === Tegaki.layers.length) {
      return;
    }
    
    if (!Tegaki.selectedLayers.size || Tegaki.layers.length < 2) {
      return;
    }
    
    TegakiHistory.push(action = TegakiLayers.deleteLayers(Tegaki.selectedLayers));
    TegakiLayers.selectedLayersClear();
    TegakiLayers.setActiveLayer(action.aLayerIdAfter);
  },
  
  onLayerToggleVisibilityClick: function() {
    var layer = TegakiLayers.getLayerById(+this.getAttribute('data-id'));
    TegakiLayers.setLayerVisibility(layer, !layer.visible);
  },
  
  onMergeLayersClick: function() {
    var action;
    
    if (Tegaki.selectedLayers.size) {
      if (action = TegakiLayers.mergeLayers(Tegaki.selectedLayers)) {
        TegakiHistory.push(action);
        TegakiLayers.setActiveLayer(action.aLayerIdAfter);
      }
    }
  },
  
  onMoveLayerClick: function(e) {
    var belowPos, up;
    
    if (!Tegaki.selectedLayers.size) {
      return;
    }
    
    up = e.target.hasAttribute('data-up');
    
    belowPos = TegakiLayers.getSelectedEdgeLayerPos(up);
    
    if (belowPos < 0) {
      return;
    }
    
    if (up) {
      belowPos += 2;
    }
    else if (belowPos >= 1) {
      belowPos--;
    }
    
    TegakiHistory.push(TegakiLayers.moveLayers(Tegaki.selectedLayers, belowPos));
  },
  
  onToolClick: function() {
    Tegaki.setTool(this.getAttribute('data-tool'));
  },
  
  onToolChanged: function(tool) {
    var el;
    
    Tegaki.tool = tool;
    
    if (el = $T.cls('tegaki-tool-active')[0]) {
      el.classList.remove('tegaki-tool-active');
    }
    
    $T.id('tegaki-tool-btn-' + tool.name).classList.add('tegaki-tool-active');
    
    TegakiUI.onToolChanged();
    Tegaki.updateCursorStatus();
  },
  
  onOpenFileSelected: function() {
    var img;
    
    if (this.files && this.files[0]) {
      img = new Image();
      img.onload = Tegaki.onOpenImageLoaded;
      img.onerror = Tegaki.onOpenImageError;
      
      img.src = URL.createObjectURL(this.files[0]);
    }
  },
  
  onOpenImageLoaded: function() {
    var tmp = {};
    
    Tegaki.copyContextState(Tegaki.activeCtx, tmp);
    Tegaki.resizeCanvas(this.naturalWidth, this.naturalHeight);
    Tegaki.activeCtx.drawImage(this, 0, 0);
    Tegaki.copyContextState(tmp, Tegaki.activeCtx);
    
    TegakiHistory.clear();
    Tegaki.centerLayersCnt();
    Tegaki.updatePosOffset();
  },
  
  onOpenImageError: function() {
    alert(TegakiStrings.errorLoadImage);
  },
  
  resizeCanvas: function(width, height) {
    var i, layer;
    
    Tegaki.baseWidth = width;
    Tegaki.baseHeight = height;
    
    Tegaki.createBuffers();
    
    Tegaki.canvas.width = width;
    Tegaki.canvas.height = height;
    
    Tegaki.cursorCanvas.width = width;
    Tegaki.cursorCanvas.height = height;
    
    Tegaki.flatCtx.canvas.width = width;
    Tegaki.flatCtx.canvas.height = height;
    
    Tegaki.flatCtxCached.canvas.width = width;
    Tegaki.flatCtxCached.canvas.height = height;
    
    Tegaki.ctx.fillStyle = Tegaki.bgColor;
    Tegaki.ctx.fillRect(0, 0, width, height);
    
    for (i = 0; layer = Tegaki.layers[i]; ++i) {
      Tegaki.layersCnt.removeChild(layer.canvas);
    }
    
    TegakiUI.updateLayersGridClear();
    
    Tegaki.activeCtx = null;
    Tegaki.layers = [];
    Tegaki.layerCounter = 0;
    
    Tegaki.setZoom(1);
    
    TegakiLayers.addLayer();
    TegakiLayers.setActiveLayer(0);
    
    Tegaki.updateFlatCtx();
  },
  
  clearCtx: function(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  },
  
  updateFlatCtx: function(fromCache) {
    if (!fromCache) {
      Tegaki.flatten(Tegaki.flatCtxCached);
    }
    
    Tegaki.flatCtx.drawImage(Tegaki.flatCtxCached.canvas, 0, 0);
  },
  
  copyContextState: function(src, dest) {
    var i, p, props = [
      'lineCap', 'lineJoin', 'strokeStyle', 'fillStyle', 'globalAlpha',
      'lineWidth', 'globalCompositeOperation'
    ];
    
    for (i = 0; p = props[i]; ++i) {
      dest[p] = src[p];
    }
  },
  
  updateCursorStatus: function() {
    if (Tegaki.tool.noCursor || Tegaki.tool.size < 2) {
      Tegaki.cursor = false;
      Tegaki.clearCtx(Tegaki.cursorCtx);
      return;
    }
    
    Tegaki.cursor = true;
  },
  
  updatePosOffset: function() {
    var aabb = Tegaki.canvas.getBoundingClientRect();
    
    Tegaki.offsetX = aabb.left + window.pageXOffset
      + Tegaki.canvasCnt.scrollLeft + Tegaki.layersCnt.scrollLeft;
    Tegaki.offsetY = aabb.top + window.pageYOffset
      + Tegaki.canvasCnt.scrollTop + Tegaki.layersCnt.scrollTop;
  },
  
  isScrollbarClick: function(e) {
    var sbwh, scbv;
    
    sbwh = Tegaki.canvasCnt.offsetWidth - Tegaki.canvasCnt.clientWidth;
    scbv = Tegaki.canvasCnt.offsetHeight - Tegaki.canvasCnt.clientHeight;

    if (sbwh > 0
      && e.clientX >= Tegaki.canvasCnt.offsetLeft + Tegaki.canvasCnt.clientWidth
      && e.clientX <= Tegaki.canvasCnt.offsetLeft + Tegaki.canvasCnt.clientWidth
        + sbwh) {
      return true;
    }
    
    if (scbv > 0
      && e.clientY >= Tegaki.canvasCnt.offsetTop + Tegaki.canvasCnt.clientHeight
      && e.clientY <= Tegaki.canvasCnt.offsetTop + Tegaki.canvasCnt.clientHeight
        + sbwh) {
      return true;
    }
    
    return false;
  },
  
  onPointerMove: function(e) {
    var events;
    
    
    if (e.mozInputSource !== undefined) {
      // Firefox thing where mouse events fire for no reason when the pointer is a pen
      if (Tegaki.activePointerIsPen && e.pointerType === 'mouse') {
        return;
      }
    }
    else {
      // Webkit thing where a pointermove event is fired at pointerdown location after a pointerup
      if (Tegaki.activePointerId !== e.pointerId) {
        Tegaki.activePointerId = e.pointerId;
        return;
      }
    }
    
    if (Tegaki.activePointerIsPen && Tegaki.isPainting && e.getCoalescedEvents) {
      events = e.getCoalescedEvents();
      
      for (e of events) {
        TegakiPressure.push(e.pressure);
        Tegaki.tool.draw(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
      }
    }
    else {
      if (Tegaki.isPainting) {
        TegakiPressure.push(e.pressure);
        Tegaki.tool.draw(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
      }
      else if (Tegaki.isColorPicking) {
        Tegaki.tools.pipette.draw(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
      }
    }
    
    if (Tegaki.cursor) {
      Tegaki.renderCursor(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
    }
  },
  
  onPointerDown: function(e) {
    if (Tegaki.isScrollbarClick(e)) {
      return;
    }
    
    Tegaki.activePointerId = e.pointerId;
    
    if (Tegaki.activePointerIsPen = e.pointerType === 'pen') {
      Tegaki.ptrEvtPenCount++;
    }
    else {
      Tegaki.ptrEvtMouseCount++;
    }
    
    if (Tegaki.activeCtx === null) {
      if (e.target.parentNode === Tegaki.layersCnt) {
        alert(TegakiStrings.noActiveLayer);
      }
      
      return;
    }
    if (!TegakiLayers.getActiveLayer().visible) {
      if (e.target.parentNode === Tegaki.layersCnt) {
        alert(TegakiStrings.hiddenActiveLayer);
      }
      
      return;
    }
    
    if (e.button === 2 || e.altKey) {
      e.preventDefault();
      
      Tegaki.isColorPicking = true;
      
      Tegaki.tools.pipette.draw(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
    }
    else if (e.button === 0) {
      e.preventDefault();
      
      TegakiPressure.set(e.pressure);
      
      Tegaki.isPainting = true;
      
      Tegaki.clearCtx(Tegaki.cursorCtx);
      
      TegakiHistory.pendingAction = new TegakiHistoryActions.Draw(
        Tegaki.activeLayerId
      );
      
      TegakiHistory.pendingAction.addCanvasState(Tegaki.activeCtx.canvas, 0);
      
      Tegaki.tool.start(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
    }
    
    if (Tegaki.cursor) {
      Tegaki.renderCursor(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
    }
  },
  
  onPointerUp: function(e) {
    Tegaki.activePointerId = e.pointerId;
    
    Tegaki.activePointerIsPen = false;
    
    if (Tegaki.isPainting) {
      Tegaki.tool.commit();
      TegakiHistory.pendingAction.addCanvasState(Tegaki.activeCtx.canvas, 1);
      TegakiHistory.push(TegakiHistory.pendingAction);
      Tegaki.isPainting = false;
    }
    else if (Tegaki.isColorPicking) {
      e.preventDefault();
      Tegaki.isColorPicking = false;
    }
    
    if (Tegaki.cursor) {
      Tegaki.renderCursor(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
    }
  },
  
  onDummy: function(e) {
    e.preventDefault();
    e.stopPropagation();
  }
};
