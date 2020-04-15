var Tegaki = {
  VERSION: '0.9.2',
  
  startTimeStamp: 0,
  
  bg: null,
  canvas: null,
  ctx: null,
  layers: [],
  
  layersCnt: null,
  canvasCnt: null,
  
  ghostBuffer: null,
  blendBuffer: null,
  ghostBuffer32: null,
  blendBuffer32: null,
  
  activeLayer: null,
  
  layerCounter: 0,
  selectedLayers: new Set(),
  
  activePointerId: 0,
  activePointerIsPen: false,
  
  isPainting: false,
  
  offsetX: 0,
  offsetY: 0,
  
  zoomLevel: 0,
  zoomFactor: 1.0,
  zoomFactorList: [0.5, 1.0, 2.0, 4.0, 8.0, 16.0],
  zoomBaseLevel: 1,
  
  hasCustomCanvas: false,
  
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
  
  tool: null,
  
  colorPaletteId: 0,
  
  toolColor: '#000000',
  defaultTool: 'pencil',
  
  bgColor: '#ffffff',
  maxSize: 64,
  maxLayers: 25,
  baseWidth: 0,
  baseHeight: 0,
  
  replayRecorder: null,
  replayViewer: null,
  
  onDoneCb: null,
  onCancelCb: null,
  
  replayMode: false,
  
  saveReplay: false,
  
  open: function(opts = {}) {
    var self = Tegaki;
    
    if (self.bg) {
      if (self.replayMode !== (opts.replayMode ? true : false)) {
        self.destroy();
      }
      else {
        self.resume();
        return;
      }
    }
    
    self.startTimeStamp = Date.now();
    
    if (opts.bgColor) {
      self.bgColor = opts.bgColor;
    }
    
    self.hasCustomCanvas = false;
    
    self.saveReplay = !!opts.saveReplay;
    self.replayMode = !!opts.replayMode;
    
    self.onDoneCb = opts.onDone;
    self.onCancelCb = opts.onCancel;
    
    self.baseWidth = opts.width || 0;
    self.baseHeight = opts.height || 0;
    
    self.createTools();
    
    self.initKeybinds();
    
    [self.bg, self.canvasCnt, self.layersCnt] = TegakiUI.buildUI();
    
    document.body.appendChild(self.bg);
    document.body.classList.add('tegaki-backdrop');
    
    if (!self.replayMode) {
      self.init();
      
      self.setTool(self.defaultTool);
      
      if (self.saveReplay) {
        self.replayRecorder = new TegakiReplayRecorder();
        self.replayRecorder.start();
      }
    }
    else {
      TegakiUI.setReplayMode(true);
      
      self.replayViewer = new TegakiReplayViewer();
      
      if (opts.replayURL) {
        self.loadReplayFromURL(opts.replayURL);
      }
    }
  },
  
  init: function() {
    var self = Tegaki;
    
    self.createCanvas();
    
    self.centerLayersCnt();
    
    self.createBuffers();
    
    self.updatePosOffset();
    
    self.resetLayers();
    
    self.bindGlobalEvents();
    
    TegakiCursor.init(self.baseWidth, self.baseHeight);
    
    TegakiUI.updateUndoRedo(0, 0);
    TegakiUI.updateZoomLevel();
  },
  
  initFromReplay: function() {
    var self, r;
    
    self = Tegaki;
    r = self.replayViewer;
    
    self.initToolsFromReplay();
    
    self.baseWidth = r.canvasWidth;
    self.baseHeight = r.canvasHeight;
    self.bgColor = $T.RgbToHex(...r.bgColor);
    
    self.toolColor = $T.RgbToHex(...r.toolColor);
  },
  
  initToolsFromReplay: function() {
    var self, r, name, tool, rTool, prop, props;
    
    self = Tegaki;
    r = self.replayViewer;
    
    for (name in self.tools) {
      tool = self.tools[name];
      
      if (tool.id === r.toolId) {
        self.defaultTool = name;
      }
      
      rTool = r.toolMap[tool.id];
      
      props = ['step', 'size', 'alpha', 'flow', 'tipId'];
      
      for (prop of props) {
        if (rTool[prop] !== undefined) {
          tool[prop] = rTool[prop];
        }
      }
      
      props = [
        'sizeDynamicsEnabled', 'alphaDynamicsEnabled', 'flowDynamicsEnabled',
        'usePreserveAlpha'
      ];
      
      for (prop of props) {
        if (rTool[prop] !== undefined) {
          tool[prop] = !!rTool[prop];
        }
      }
    }
  },
  
  resetLayers: function() {
    var i, len;
    
    if (Tegaki.layers.length) {
      for (i = 0, len = Tegaki.layers.length; i < len; ++i) {
        Tegaki.layersCnt.removeChild(Tegaki.layers[i].canvas);
      }
      
      Tegaki.layers = [];
      Tegaki.layerCounter = 0;
      
      TegakiUI.updateLayersGridClear();
    }
    
    TegakiLayers.addLayer();
    TegakiLayers.setActiveLayer(0);
  },
  
  createCanvas: function() {
    var canvas, self = Tegaki;
    
    canvas = $T.el('canvas');
    canvas.id = 'tegaki-canvas';
    canvas.width = self.baseWidth;
    canvas.height = self.baseHeight;
    
    self.canvas = canvas;
    
    self.ctx = canvas.getContext('2d');
    self.ctx.fillStyle = self.bgColor;
    self.ctx.fillRect(0, 0, self.baseWidth, self.baseHeight);
    
    self.layersCnt.appendChild(canvas);
  },
  
  createTools: function() {
    var klass, tool;
    
    for (klass of Tegaki.toolList) {
      tool = new klass();
      Tegaki.tools[tool.name] = tool;
    }
  },
  
  bindGlobalEvents: function() {
    var self = Tegaki;
    
    if (!self.replayMode) {
      $T.on(self.canvasCnt, 'pointermove', self.onPointerMove);
      $T.on(self.canvasCnt, 'pointerdown', self.onPointerDown);
      $T.on(document, 'pointerup', self.onPointerUp);
      $T.on(document, 'pointercancel', self.onPointerUp);
      
      $T.on(document, 'keydown', TegakiKeybinds.resolve);
      
      $T.on(window, 'beforeunload', Tegaki.onTabClose);
    }
    else {
      $T.on(document, 'visibilitychange', Tegaki.onVisibilityChange);
    }
    
    $T.on(self.bg, 'contextmenu', self.onDummy);
    $T.on(window, 'resize', self.updatePosOffset);
    $T.on(window, 'scroll', self.updatePosOffset);
  },
  
  unBindGlobalEvents: function() {
    var self = Tegaki;
    
    if (!self.replayMode) {
      $T.off(self.canvasCnt, 'pointermove', self.onPointerMove);
      $T.off(self.canvasCnt, 'pointerdown', self.onPointerDown);
      $T.off(document, 'pointerup', self.onPointerUp);
      $T.off(document, 'pointercancel', self.onPointerUp);
      
      $T.off(document, 'keydown', TegakiKeybinds.resolve);
      
      $T.off(window, 'beforeunload', Tegaki.onTabClose);
    }
    else {
      $T.off(document, 'visibilitychange', Tegaki.onVisibilityChange);
    }
    
    $T.off(self.bg, 'contextmenu', self.onDummy);
    $T.off(window, 'resize', self.updatePosOffset);
    $T.off(window, 'scroll', self.updatePosOffset);
  },
  
  createBuffers() {
    Tegaki.ghostBuffer = new ImageData(Tegaki.baseWidth, Tegaki.baseHeight);
    Tegaki.blendBuffer = new ImageData(Tegaki.baseWidth, Tegaki.baseHeight);
    Tegaki.ghostBuffer32 = new Uint32Array(Tegaki.ghostBuffer.data.buffer);
    Tegaki.blendBuffer32 = new Uint32Array(Tegaki.blendBuffer.data.buffer);
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
  
  onVisibilityChange: function(e) {
    if (!Tegaki.replayMode) {
      return;
    }
    
    if (document.visibilityState === 'visible') {
      if (Tegaki.replayViewer.autoPaused) {
        Tegaki.replayViewer.play();
      }
    }
    else {
      if (Tegaki.replayViewer.playing) {
        Tegaki.replayViewer.autoPause();
      }
    }
  },
  
  initKeybinds: function() {
    var cls, tool;
    
    if (Tegaki.replayMode) {
      return;
    }
    
    TegakiKeybinds.bind('ctrl+z', TegakiHistory, 'undo', 'undo', 'Ctrl+Z');
    TegakiKeybinds.bind('ctrl+y', TegakiHistory, 'redo', 'redo', 'Ctrl+Y');
    
    TegakiKeybinds.bind('+', Tegaki, 'setToolSizeUp', 'toolSize', 'Numpad +/-');
    TegakiKeybinds.bind('-', Tegaki, 'setToolSizeDown');
    
    for (tool in Tegaki.tools) {
      cls = Tegaki.tools[tool];
      
      if (cls.keybind) {
        TegakiKeybinds.bind(cls.keybind, cls, 'set');
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
        ) / Tegaki.zoomFactor);
    }
    else {
      return 0 | ((
        e.clientY
          + window.pageYOffset
          + Tegaki.canvasCnt.scrollTop
          - Tegaki.offsetY
        ) / Tegaki.zoomFactor);
    }
  },
  
  resume: function() {
    if (Tegaki.saveReplay) {
      Tegaki.replayRecorder.start();
    }
    
    Tegaki.bg.classList.remove('tegaki-hidden');
    document.body.classList.add('tegaki-backdrop');
    Tegaki.setZoom(0);
    Tegaki.centerLayersCnt();
    Tegaki.updatePosOffset();
    Tegaki.bindGlobalEvents();
  },
  
  hide: function() {
    if (Tegaki.saveReplay) {
      Tegaki.replayRecorder.stop();
    }
    
    Tegaki.bg.classList.add('tegaki-hidden');
    document.body.classList.remove('tegaki-backdrop');
    Tegaki.unBindGlobalEvents();
  },
  
  destroy: function() {
    Tegaki.unBindGlobalEvents();
    
    TegakiKeybinds.clear();
    
    TegakiHistory.clear();
    
    Tegaki.bg.parentNode.removeChild(Tegaki.bg);
    
    document.body.classList.remove('tegaki-backdrop');
    
    Tegaki.startTimeStamp = 0;
    
    Tegaki.bg = null;
    Tegaki.canvasCnt = null;
    Tegaki.layersCnt = null;
    Tegaki.canvas = null;
    Tegaki.ctx = null;
    Tegaki.layers = [];
    Tegaki.layerCounter = 0;
    Tegaki.zoomLevel = 0;
    Tegaki.zoomFactor = 1.0;
    Tegaki.activeLayer = null;
    
    Tegaki.tool = null;
    
    TegakiCursor.destroy();
    
    Tegaki.replayRecorder = null;
    Tegaki.replayViewer = null;
    
    Tegaki.destroyBuffers();
  },
  
  flatten: function(ctx) {
    var i, layer, canvas, len;
    
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
    
    for (i = 0, len = Tegaki.layers.length; i < len; ++i) {
      layer = Tegaki.layers[i];
      
      if (!layer.visible) {
        continue;
      }
      
      ctx.globalAlpha = layer.alpha;
      ctx.drawImage(layer.canvas, 0, 0);
    }
    
    return canvas;
  },
  
  onReplayLoaded: function() {
    TegakiUI.clearMsg();
    Tegaki.initFromReplay();
    Tegaki.init();
    Tegaki.setTool(Tegaki.defaultTool);
    TegakiUI.updateReplayControls();
    TegakiUI.updateReplayTime(true);
    TegakiUI.enableReplayControls(true);
    Tegaki.replayViewer.play();
  },
  
  onReplayGaplessClick: function() {
    Tegaki.replayViewer.toggleGapless();
    TegakiUI.updateReplayGapless();
  },
  
  onReplayPlayPauseClick: function() {
    Tegaki.replayViewer.togglePlayPause();
  },
  
  onReplayRewindClick: function() {
    Tegaki.replayViewer.rewind();
  },
  
  onReplaySlowDownClick: function() {
    Tegaki.replayViewer.slowDown();
    TegakiUI.updateReplaySpeed();
  },
  
  onReplaySpeedUpClick: function() {
    Tegaki.replayViewer.speedUp();
    TegakiUI.updateReplaySpeed();
  },
  
  onReplayTimeChanged: function() {
    TegakiUI.updateReplayTime();
  },
  
  onReplayPlayPauseChanged: function() {
    TegakiUI.updateReplayPlayPause();
  },
  
  onReplayReset: function() {
    Tegaki.initFromReplay();
    Tegaki.setTool(Tegaki.defaultTool);
    Tegaki.resizeCanvas(Tegaki.baseWidth, Tegaki.baseHeight);
    TegakiUI.updateReplayControls();
    TegakiUI.updateReplayTime();
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
  },
  
  onSwitchPaletteClick: function(e) {
    var id;
    
    if (e.target.hasAttribute('data-prev')) {
      id = Tegaki.colorPaletteId - 1;
    }
    else {
      id = Tegaki.colorPaletteId + 1;
    }
    
    Tegaki.setColorPalette(id);
  },
  
  setColorPalette: function(id) {
    if (id < 0 || id >= TegakiColorPalettes.length) {
      return;
    }
    
    Tegaki.colorPaletteId = id;
    TegakiUI.updateColorPalette();
  },
  
  setToolSizeUp: function() {
    Tegaki.setToolSize(Tegaki.tool.size + 1);
  },
  
  setToolSizeDown: function() {
    Tegaki.setToolSize(Tegaki.tool.size - 1);
  },
  
  setToolSize: function(size) {
    if (size > 0 && size <= Tegaki.maxSize) {
      Tegaki.tool.setSize(size);
      Tegaki.updateCursorStatus();
      Tegaki.recordEvent(TegakiEventSetToolSize, performance.now(), size);
      TegakiUI.updateToolSize();
    }
  },
  
  setToolAlpha: function(alpha) {
    alpha = Math.fround(alpha);
    
    if (alpha >= 0.0 && alpha <= 1.0) {
      Tegaki.tool.setAlpha(alpha);
      Tegaki.recordEvent(TegakiEventSetToolAlpha, performance.now(), alpha);
      TegakiUI.updateToolAlpha();
    }
  },
  
  setToolFlow: function(flow) {
    flow = Math.fround(flow);
    
    if (flow >= 0.0 && flow <= 1.0) {
      Tegaki.tool.setFlow(flow);
      Tegaki.recordEvent(TegakiEventSetToolFlow, performance.now(), flow);
      TegakiUI.updateToolFlow();
    }
  },
  
  setToolColor: function(color) {
    Tegaki.toolColor = color;
    $T.id('tegaki-color').style.backgroundColor = color;
    $T.id('tegaki-colorpicker').value = color;
    Tegaki.tool.setColor(color);
    Tegaki.recordEvent(TegakiEventSetColor, performance.now(), Tegaki.tool.rgb);
  },
  
  setToolColorRGB: function(r, g, b) {
    Tegaki.setToolColor($T.RgbToHex(r, g, b));
  },
  
  setTool: function(tool) {
    Tegaki.tools[tool].set();
  },
  
  setToolById: function(id) {
    var tool;
    
    for (tool in Tegaki.tools) {
      if (Tegaki.tools[tool].id === id) {
        Tegaki.setTool(tool);
        return;
      }
    }
  },
  
  setZoom: function(level) {
    var idx;
    
    idx = level + Tegaki.zoomBaseLevel;
    
    if (idx >= Tegaki.zoomFactorList.length || idx < 0 || !Tegaki.canvas) {
      return;
    }
    
    Tegaki.zoomLevel = level;
    Tegaki.zoomFactor = Tegaki.zoomFactorList[idx];
    
    TegakiUI.updateZoomLevel();
    
    Tegaki.layersCnt.style.width = Math.ceil(Tegaki.baseWidth * Tegaki.zoomFactor) + 'px';
    Tegaki.layersCnt.style.height = Math.ceil(Tegaki.baseHeight * Tegaki.zoomFactor) + 'px';
    
    if (level < 0) {
      Tegaki.layersCnt.classList.add('tegaki-smooth-layers');
    }
    else {
      Tegaki.layersCnt.classList.remove('tegaki-smooth-layers');
    }
    
    Tegaki.updatePosOffset();
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
    var width, height, tmp, self = Tegaki;
    
    width = prompt(TegakiStrings.promptWidth, self.canvas.width);
    
    if (!width) { return; }
    
    height = prompt(TegakiStrings.promptHeight, self.canvas.height);
    
    if (!height) { return; }
    
    width = +width;
    height = +height;
    
    if (width < 1 || height < 1) {
      TegakiUI.printMsg(TegakiStrings.badDimensions);
      return;
    }
    
    tmp = {};
    self.copyContextState(self.activeLayer.ctx, tmp);
    self.resizeCanvas(width, height);
    self.copyContextState(tmp, self.activeLayer.ctx);
    
    self.setZoom(0);
    TegakiHistory.clear();
    
    TegakiUI.updateLayerPreviewSize();
    
    self.startTimeStamp = Date.now();
    
    if (self.saveReplay) {
      self.createTools();
      self.setTool(self.defaultTool);
      self.replayRecorder = new TegakiReplayRecorder();
      self.replayRecorder.start();
    }
  },
  
  onOpenClick: function() {
    var el, tainted;
    
    tainted = TegakiHistory.undoStack[0] || TegakiHistory.redoStack[0];
    
    if (tainted || Tegaki.saveReplay) {
      if (!confirm(TegakiStrings.confirmChangeCanvas)) {
        return;
      }
    }
    
    el = $T.id('tegaki-filepicker');
    el.click();
  },
  
  loadReplayFromFile: function() {
    Tegaki.replayViewer.debugLoadLocal();
  },
  
  loadReplayFromURL: function(url) {
    TegakiUI.printMsg(TegakiStrings.loadingReplay, 0);
    Tegaki.replayViewer.loadFromURL(url);
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
  
  onHistoryChange: function(undoSize, redoSize, type = 0) {
    TegakiUI.updateUndoRedo(undoSize, redoSize);
    
    if (type === -1) {
      Tegaki.recordEvent(TegakiEventUndo, performance.now());
    }
    else if (type === 1) {
      Tegaki.recordEvent(TegakiEventRedo, performance.now());
    }
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
  
  onCloseViewerClick: function() {
    Tegaki.replayViewer.destroy();
    Tegaki.destroy();
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
  },
  
  onToolFlowChange: function(e) {
    var val = +this.value;
    
    val = val / 100;
    
    if (val < 0.0) {
      val = 0.0;
    }
    else if (val > 1.0) {
      val = 1.0;
    }
    
    Tegaki.setToolFlow(val);
  },
  
  onToolPressureSizeClick: function(e) {
    if (!Tegaki.tool.useSizeDynamics) {
      return;
    }
    
    Tegaki.setToolSizeDynamics(!Tegaki.tool.sizeDynamicsEnabled);
  },
  
  setToolSizeDynamics: function(flag) {
    Tegaki.tool.setSizeDynamics(flag);
    TegakiUI.updateToolDynamics();
    Tegaki.recordEvent(TegakiEventSetToolSizeDynamics, performance.now(), +flag);
  },
  
  onToolPressureAlphaClick: function(e) {
    if (!Tegaki.tool.useAlphaDynamics) {
      return;
    }
    
    Tegaki.setToolAlphaDynamics(!Tegaki.tool.alphaDynamicsEnabled);
  },
  
  setToolAlphaDynamics: function(flag) {
    Tegaki.tool.setAlphaDynamics(flag);
    TegakiUI.updateToolDynamics();
    Tegaki.recordEvent(TegakiEventSetToolAlphaDynamics, performance.now(), +flag);
  },
  
  onToolPressureFlowClick: function(e) {
    if (!Tegaki.tool.useFlowDynamics) {
      return;
    }
    
    Tegaki.setToolFlowDynamics(!Tegaki.tool.flowDynamicsEnabled);
  },
  
  setToolFlowDynamics: function(flag) {
    Tegaki.tool.setFlowDynamics(flag);
    TegakiUI.updateToolDynamics();
    Tegaki.recordEvent(TegakiEventSetToolFlowDynamics, performance.now(), +flag);
  },
  
  onToolPreserveAlphaClick: function(e) {
    if (!Tegaki.tool.usePreserveAlpha) {
      return;
    }
    
    Tegaki.setToolPreserveAlpha(!Tegaki.tool.preserveAlphaEnabled);
  },
  
  setToolPreserveAlpha: function(flag) {
    Tegaki.tool.setPreserveAlpha(flag);
    TegakiUI.updateToolPreserveAlpha();
    Tegaki.recordEvent(TegakiEventPreserveAlpha, performance.now(), +flag);
  },
  
  onToolTipClick: function(e) {
    var tipId = +e.target.getAttribute('data-id');
    
    if (tipId !== Tegaki.tool.tipId) {
      Tegaki.setToolTip(tipId);
    }
  },
  
  setToolTip: function(id) {
    Tegaki.tool.setTip(id);
    TegakiUI.updateToolShape();
    Tegaki.recordEvent(TegakiEventSetToolTip, performance.now(), id);
  },
  
  onLayerSelectorClick: function(e) {
    var id = +this.getAttribute('data-id');
    
    if (!id || e.target.classList.contains('tegaki-ui-cb')) {
      return;
    }
    
    if (e.ctrlKey) {
      Tegaki.toggleSelectedLayer(id);
    }
    else {
      Tegaki.setActiveLayer(id);
    }
  },
  
  toggleSelectedLayer: function(id) {
    TegakiLayers.selectedLayersToggle(id);
    Tegaki.recordEvent(TegakiEventToggleLayerSelection, performance.now(), id);
  },
  
  setActiveLayer: function(id) {
    TegakiLayers.setActiveLayer(id);
    Tegaki.recordEvent(TegakiEventSetActiveLayer, performance.now(), id);
  },
  
  onLayerAlphaDragStart: function(e) {
    TegakiUI.setupDragLabel(e, Tegaki.onLayerAlphaDragMove);
  },
  
  onLayerAlphaDragMove: function(delta) {
    var val;
    
    if (!delta) {
      return;
    }
    
    val = Tegaki.activeLayer.alpha + delta / 100 ;
    
    if (val < 0.0) {
      val = 0.0;
    }
    else if (val > 1.0) {
      val = 1.0;
    }
    
    Tegaki.setSelectedLayersAlpha(val);
  },
  
  onLayerAlphaChange: function() {
    var val = +this.value;
    
    val = val / 100;
    
    if (val < 0.0) {
      val = 0.0;
    }
    else if (val > 1.0) {
      val = 1.0;
    }
    
    Tegaki.setSelectedLayersAlpha(val);
  },
  
  setSelectedLayersAlpha: function(alpha) {
    var layer, id, layerAlphas;
    
    alpha = Math.fround(alpha);
    
    if (alpha >= 0.0 && alpha <= 1.0 && Tegaki.selectedLayers.size > 0) {
      layerAlphas = [];
      
      for (id of Tegaki.selectedLayers) {
        if (layer = TegakiLayers.getLayerById(id)) {
          layerAlphas.push([layer.id, layer.alpha]);
          TegakiLayers.setLayerAlpha(layer, alpha);
        }
      }
      
      TegakiUI.updateLayerAlphaOpt();
      
      TegakiHistory.push(new TegakiHistoryActions.SetLayersAlpha(layerAlphas, alpha));
      
      Tegaki.recordEvent(TegakiEventSetSelectedLayersAlpha, performance.now(), alpha);
    }
  },
  
  onLayerNameChangeClick: function(e) {
    var id, name, layer;
    
    id = +this.getAttribute('data-id');
    
    layer = TegakiLayers.getLayerById(id);
    
    if (!layer) {
      return;
    }
    
    if (name = prompt(undefined, layer.name)) {
      Tegaki.setLayerName(id, name);
    }
  },
  
  setLayerName: function(id, name) {
    var oldName, layer;
    
    name = name.trim().slice(0, 25);
    
    layer = TegakiLayers.getLayerById(id);
    
    if (!layer || !name || name === layer.name) {
      return;
    }
    
    oldName = layer.name;
    
    layer.name = name;
    
    TegakiUI.updateLayerName(layer);
    
    TegakiHistory.push(new TegakiHistoryActions.SetLayerName(id, oldName, name));
    
    Tegaki.recordEvent(TegakiEventHistoryDummy, performance.now());
  },
  
  onLayerAddClick: function() {
    Tegaki.addLayer();
  },
  
  addLayer: function() {
    var action;
    
    if (Tegaki.layers.length >= Tegaki.maxLayers) {
      TegakiUI.printMsg(TegakiStrings.tooManyLayers);
      return;
    }
    
    TegakiHistory.push(action = TegakiLayers.addLayer());
    TegakiLayers.setActiveLayer(action.aLayerIdAfter);
    Tegaki.recordEvent(TegakiEventAddLayer, performance.now());
  },
  
  onLayerDeleteClick: function() {
    Tegaki.deleteSelectedLayers();
  },
  
  deleteSelectedLayers: function() {
    var action, layerSet;
    
    layerSet = Tegaki.selectedLayers;
    
    if (layerSet.size === Tegaki.layers.length) {
      return;
    }
    
    if (!layerSet.size || Tegaki.layers.length < 2) {
      return;
    }
    
    TegakiHistory.push(action = TegakiLayers.deleteLayers(layerSet));
    TegakiLayers.selectedLayersClear();
    TegakiLayers.setActiveLayer(action.aLayerIdAfter);
    Tegaki.recordEvent(TegakiEventDeleteLayers, performance.now());
  },
  
  onLayerToggleVisibilityClick: function() {
    Tegaki.toggleLayerVisibility(+this.getAttribute('data-id'));
  },
  
  toggleLayerVisibility: function(id) {
    var layer = TegakiLayers.getLayerById(id);
    TegakiLayers.setLayerVisibility(layer, !layer.visible);
    Tegaki.recordEvent(TegakiEventToggleLayerVisibility, performance.now(), id);
  },
  
  onMergeLayersClick: function() {
    Tegaki.mergeSelectedLayers();
  },
  
  mergeSelectedLayers: function() {
    var action;
    
    if (Tegaki.selectedLayers.size) {
      if (action = TegakiLayers.mergeLayers(Tegaki.selectedLayers)) {
        TegakiHistory.push(action);
        TegakiLayers.setActiveLayer(action.aLayerIdAfter);
        Tegaki.recordEvent(TegakiEventMergeLayers, performance.now());
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
    
    Tegaki.moveSelectedLayers(belowPos);
  },
  
  moveSelectedLayers: function(belowPos) {
    TegakiHistory.push(TegakiLayers.moveLayers(Tegaki.selectedLayers, belowPos));
    Tegaki.recordEvent(TegakiEventMoveLayers, performance.now(), belowPos);
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
    
    Tegaki.recordEvent(TegakiEventSetTool, performance.now(), Tegaki.tool.id);
    
    TegakiUI.onToolChanged();
    Tegaki.updateCursorStatus();
  },
  
  onLayerStackChanged: function() {
    TegakiCursor.invalidateCache();
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
    var tmp = {}, self = Tegaki;
    
    self.hasCustomCanvas = true;
    
    self.copyContextState(self.activeLayer.ctx, tmp);
    self.resizeCanvas(this.naturalWidth, this.naturalHeight);
    self.activeLayer.ctx.drawImage(this, 0, 0);
    TegakiLayers.syncLayerImageData(self.activeLayer);
    self.copyContextState(tmp, self.activeLayer.ctx);
    
    self.setZoom(0);
    
    TegakiHistory.clear();
    
    TegakiUI.updateLayerPreviewSize(true);
    
    self.startTimeStamp = Date.now();
    
    if (self.saveReplay) {
      self.replayRecorder.stop();
      self.replayRecorder = null;
      self.saveReplay = false;
      TegakiUI.setRecordingStatus(false);
    }
  },
  
  onOpenImageError: function() {
    TegakiUI.printMsg(TegakiStrings.errorLoadImage);
  },
  
  resizeCanvas: function(width, height) {
    Tegaki.baseWidth = width;
    Tegaki.baseHeight = height;
    
    Tegaki.createBuffers();
    
    Tegaki.canvas.width = width;
    Tegaki.canvas.height = height;
    
    TegakiCursor.updateCanvasSize(width, height);
    
    Tegaki.ctx.fillStyle = Tegaki.bgColor;
    Tegaki.ctx.fillRect(0, 0, width, height);
    
    Tegaki.activeLayer = null;
    
    Tegaki.resetLayers();
    
    Tegaki.centerLayersCnt();
    Tegaki.updatePosOffset();
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
    if (!Tegaki.tool.noCursor && Tegaki.tool.size > 1) {
      Tegaki.cursor = true;
      TegakiCursor.generate(Tegaki.tool.size);
    }
    else {
      Tegaki.cursor = false;
      $T.clearCtx(TegakiCursor.cursorCtx);
    }
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
    var events, x, y, tool, ts, p;
    
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
    
    if (Tegaki.isPainting) {
      tool = Tegaki.tool;
      
      if (Tegaki.activePointerIsPen && e.getCoalescedEvents) {
        events = e.getCoalescedEvents();
        
        ts = e.timeStamp;
        
        for (e of events) {
          x = Tegaki.getCursorPos(e, 0);
          y = Tegaki.getCursorPos(e, 1);
          
          if (!tool.enabledDynamics()) {
            Tegaki.recordEvent(TegakiEventDrawNoP, ts, x, y);
          }
          else {
            p = TegakiPressure.toShort(e.pressure);
            TegakiPressure.push(p);
            Tegaki.recordEvent(TegakiEventDraw, ts, x, y, p);
          }
          
          tool.draw(x, y);
        }
      }
      else {
        x = Tegaki.getCursorPos(e, 0);
        y = Tegaki.getCursorPos(e, 1);
        p = TegakiPressure.toShort(e.pressure);
        Tegaki.recordEvent(TegakiEventDraw, e.timeStamp, x, y, p);
        TegakiPressure.push(p);
        tool.draw(x, y);
      }
    }
    else {
      x = Tegaki.getCursorPos(e, 0);
      y = Tegaki.getCursorPos(e, 1);
    }
    
    if (Tegaki.cursor) {
      TegakiCursor.render(x, y);
    }
  },
  
  onPointerDown: function(e) {
    var x, y, tool, p;
    
    if (Tegaki.isScrollbarClick(e)) {
      return;
    }
    
    Tegaki.activePointerId = e.pointerId;
    
    Tegaki.activePointerIsPen = e.pointerType === 'pen';
    
    if (Tegaki.activeLayer === null) {
      if (e.target.parentNode === Tegaki.layersCnt) {
        TegakiUI.printMsg(TegakiStrings.noActiveLayer);
      }
      
      return;
    }
    
    if (!TegakiLayers.getActiveLayer().visible) {
      if (e.target.parentNode === Tegaki.layersCnt) {
        TegakiUI.printMsg(TegakiStrings.hiddenActiveLayer);
      }
      
      return;
    }
    
    x = Tegaki.getCursorPos(e, 0);
    y = Tegaki.getCursorPos(e, 1);
    
    if (e.button === 2 || e.altKey) {
      e.preventDefault();
      
      Tegaki.isPainting = false;
      
      Tegaki.tools.pipette.draw(x, y);
    }
    else if (e.button === 0) {
      e.preventDefault();
      
      tool = Tegaki.tool;

      if (!tool.enabledDynamics()) {
        Tegaki.recordEvent(TegakiEventDrawStartNoP, e.timeStamp, x, y);
      }
      else {
        p = TegakiPressure.toShort(e.pressure);
        TegakiPressure.push(p);
        Tegaki.recordEvent(TegakiEventDrawStart, e.timeStamp, x, y, p);
      }
      
      Tegaki.isPainting = true;
      
      TegakiHistory.pendingAction = new TegakiHistoryActions.Draw(
        Tegaki.activeLayer.id
      );
      
      TegakiHistory.pendingAction.addCanvasState(Tegaki.activeLayer.imageData, 0);
      
      tool.start(x, y);
    }
    
    if (Tegaki.cursor) {
      TegakiCursor.render(x, y);
    }
  },
  
  onPointerUp: function(e) {
    Tegaki.activePointerId = e.pointerId;
    
    Tegaki.activePointerIsPen = false;
    
    if (Tegaki.isPainting) {
      Tegaki.recordEvent(TegakiEventDrawCommit, e.timeStamp);
      Tegaki.tool.commit();
      TegakiUI.updateLayerPreview(Tegaki.activeLayer);
      TegakiHistory.pendingAction.addCanvasState(Tegaki.activeLayer.imageData, 1);
      TegakiHistory.push(TegakiHistory.pendingAction);
      Tegaki.isPainting = false;
    }
  },
  
  onDummy: function(e) {
    e.preventDefault();
    e.stopPropagation();
  },
  
  recordEvent(klass, ...args) {
    if (Tegaki.replayRecorder) {
      Tegaki.replayRecorder.push(new klass(...args));
    }
  }
};
