var Tegaki;

Tegaki = {
  VERSION: '0.3.0',
  
  bg: null,
  canvas: null,
  ctx: null,
  layers: [],
  
  layersCnt: null,
  canvasCnt: null,
  
  cursorCanvas: null,
  ghostCanvas: null,
  
  cursorCtx: null,
  ghostCtx: null,
  flatCtx: null,
  activeCtx: null,
  
  activeLayer: null,
  layerIndex: null,
  
  activePointerId: 0,
  activePointerIsPen: false,
  
  isPainting: false,
  isErasing: false,
  isColorPicking: false,
  
  offsetX: 0,
  offsetY: 0,
  
  zoomLevel: 1,
  zoomMax: 5,
  zoomMin: 1,
  
  TWOPI: 2 * Math.PI,
  
  tools: {
    pencil: TegakiPencil,
    pen: TegakiPen,
    airbrush: TegakiAirbrush,
    bucket: TegakiBucket,
    tone: TegakiTone,
    pipette: TegakiPipette,
    dodge: TegakiDodge,
    burn: TegakiBurn,
    blur: TegakiBlur,
    eraser: TegakiEraser
  },
  
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
  
  open: function(opts) {
    var bg, cnt, cnt2, el, tool, lbl, ctrl, canvas, grp, self = Tegaki;
    
    if (self.bg) {
      self.resume();
      return;
    }
    
    if (opts.bgColor) {
      self.bgColor = opts.bgColor;
    }
    
    self.onDoneCb = opts.onDone;
    self.onCancelCb = opts.onCancel;
    
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
    
    bg.appendChild(el);
    
    bg.appendChild(TegakiUI.buildDummyFilePicker());
    
    //
    // Tools area
    //
    cnt = $T.el('div');
    cnt.id = 'tegaki-tools-cnt';
    
    grp = $T.el('div');
    grp.id = 'tegaki-tools-grid';
    
    for (tool in Tegaki.tools) {
      el = $T.el('span');
      el.setAttribute('data-tool', tool);
      
      lbl = TegakiStrings[tool];
      
      if (Tegaki.tools[tool].keybind) {
        lbl += ' (' + Tegaki.tools[tool].keybind.toUpperCase() + ')';
      }
      
      el.setAttribute('title', lbl);
      el.id = 'tegaki-tool-btn-' + tool;
      el.className = 'tegaki-tool-btn tegaki-icon tegaki-' + tool;
      
      $T.on(el, 'click', Tegaki.onToolClick);
      
      grp.appendChild(el);
    }
    
    cnt.appendChild(grp);
    
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
    
    // Pressure control
    ctrl.appendChild(TegakiUI.buildDynamicsCtrlGroup());
    
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
    
    self.addLayer();
    
    self.setActiveLayer();
    
    self.initKeybinds();
    
    self.onHistoryChange(0, 0);
    
    self.initTools();
    
    self.setTool('pencil');
    
    TegakiUI.updateZoomLevel();
    TegakiUI.updateSize();
    TegakiUI.updateAlpha();
    
    self.updateCursorStatus();
    self.updatePosOffset();
    
    self.updateFlatCtx();
    
    self.bindGlobalEvents();
  },
  
  initTools: function() {
    var tool;
    
    for (tool in Tegaki.tools) {
      (tool = Tegaki.tools[tool]) && tool.init && tool.init();
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
    
    el = $T.el('canvas');
    el.id = 'tegaki-ghost-layer';
    el.width = Tegaki.baseWidth;
    el.height = Tegaki.baseHeight;
    Tegaki.ghostCanvas = el;
    Tegaki.ghostCtx = el.getContext('2d');
    
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
    
    Tegaki.bg = null;
    Tegaki.canvasCnt = null;
    Tegaki.layersCnt = null;
    Tegaki.canvas = null;
    Tegaki.ctx = null;
    Tegaki.layers = [];
    Tegaki.layerIndex = 0;
    Tegaki.zoomLevel = 1;
    Tegaki.activeCtx = null;
    Tegaki.ghostCtx = null;
    Tegaki.ghostCanvas = null;
    Tegaki.cursorCtx = null;
    Tegaki.cursorCanvas = null;
    Tegaki.flatCtx = null;
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
  
  rebuildLayerCtrl: function() {
    var i, layer, sel, opt;
    
    sel = $T.id('tegaki-layer-sel');
    
    sel.textContent = '';
    
    for (i = Tegaki.layers.length - 1; layer = Tegaki.layers[i]; i--) {
      opt = $T.el('option');
      opt.value = layer.id;
      opt.textContent = layer.name;
      sel.appendChild(opt);
    }
  },
  
  getColorAt: function(ctx, posX, posY) {
    var rgba = ctx.getImageData(posX, posY, 1, 1).data;
    
    return '#'
      + ('0' + rgba[0].toString(16)).slice(-2)
      + ('0' + rgba[1].toString(16)).slice(-2)
      + ('0' + rgba[2].toString(16)).slice(-2);
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
    Tegaki.tool.setSize && Tegaki.tool.setSize(size);
    Tegaki.updateCursorStatus();
  },
  
  setToolAlpha: function(alpha) {
    Tegaki.tool.setAlpha && Tegaki.tool.setAlpha(alpha);
  },
  
  setToolColor: function(color) {
    Tegaki.toolColor = color;
    $T.id('tegaki-color').style.backgroundColor = color;
    $T.id('tegaki-colorpicker').value = color;
    Tegaki.tool.setColor && Tegaki.tool.setColor(color);
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
  
  onSaveAsClick: function() {
    Tegaki.flatten().toBlob(function(b) {
      var el = $T.el('a');
      el.className = 'tegaki-hidden';
      el.download = 'tegaki.png';
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
  
  onSizeChange: function() {
    var val = +this.value;
    
    if (val < 1) {
      val = 1;
    }
    else if (val > Tegaki.maxSize) {
      val = Tegaki.maxSize;
    }
    
    Tegaki.setToolSize(val);
    TegakiUI.updateSize();
  },
  
  onAlphaChange: function() {
    var val = +this.value;
    
    if (val < 0.0) {
      val = 0.0;
    }
    else if (val > 1.0) {
      val = 1.0;
    }
    
    Tegaki.setToolAlpha(val);
    TegakiUI.updateAlpha();
  },
  
  onSizePressureCtrlClick: function(e) {
    if (!Tegaki.tool.setSizePressureCtrl) {
      return;
    }
    
    Tegaki.tool.setSizePressureCtrl(!Tegaki.tool.sizePressureCtrl);
    
    TegakiUI.updateDynamics();
  },
  
  onLayerChange: function() {
    var selectedOptions = $T.selectedOptions(this);
    
    if (selectedOptions.length > 1) {
      Tegaki.activeLayer = null;
    }
    else {
      Tegaki.setActiveLayer(+this.value);
    }
  },
  
  onLayerAddClick: function() {
    if (Tegaki.layers.length >= Tegaki.maxLayers) {
      alert(TegakiStrings.tooManyLayers);
      return;
    }
    
    TegakiHistory.push(Tegaki.addLayer());
    Tegaki.setActiveLayer();
  },
  
  onLayerDeleteClick: function() {
    var i, ary, sel, opt, selectedOptions, action;
    
    sel = $T.id('tegaki-layer-sel');
    
    selectedOptions = $T.selectedOptions(sel);
    
    if (Tegaki.layers.length === selectedOptions.length) {
      return;
    }
    
    if (!confirm(TegakiStrings.confirmDelLayers)) {
      return;
    }
    
    if (selectedOptions.length > 1) {
      ary = [];
      
      for (i = 0; opt = selectedOptions[i]; ++i) {
        ary.push(+opt.value);
      }
    }
    else {
      ary = [+sel.value];
    }
    
    action = Tegaki.deleteLayers(ary);
    
    TegakiHistory.push(action);
  },
  
  onLayerVisibilityChange: function() {
    var i, ary, sel, opt, flag, selectedOptions;
    
    sel = $T.id('tegaki-layer-sel');
    
    selectedOptions = $T.selectedOptions(sel);
    
    if (selectedOptions.length > 1) {
      ary = [];
      
      for (i = 0; opt = selectedOptions[i]; ++i) {
        ary.push(+opt.value);
      }
    }
    else {
      ary = [+sel.value];
    }
    
    flag = !Tegaki.getLayerById(ary[0]).visible;
    
    Tegaki.setLayerVisibility(ary, flag);
  },
  
  onMergeLayersClick: function() {
    var i, ary, sel, opt, selectedOptions, action;
    
    sel = $T.id('tegaki-layer-sel');
    
    selectedOptions = $T.selectedOptions(sel);
    
    if (selectedOptions.length > 1) {
      ary = [];
      
      for (i = 0; opt = selectedOptions[i]; ++i) {
        ary.push(+opt.value);
      }
    }
    else {
      ary = [+sel.value];
    }
    
    if (ary.length < 2) {
      alert(TegakiStrings.errorMergeOneLayer);
      return;
    }
    
    if (!confirm(TegakiStrings.confirmMergeLayers)) {
      return;
    }
    
    action = Tegaki.mergeLayers(ary);
    
    TegakiHistory.push(action);
  },
  
  onMoveLayerClick: function(e) {
    var id, action, sel;
    
    sel = $T.id('tegaki-layer-sel');
    
    id = +sel.options[sel.selectedIndex].value;
    
    if (action = Tegaki.moveLayer(id, e.target.hasAttribute('data-up'))) {
      TegakiHistory.push(action);
    }
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
    
    TegakiUI.updateSize();
    TegakiUI.updateAlpha();
    TegakiUI.updateDynamics();
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
    
    Tegaki.canvas.width = width;
    Tegaki.canvas.height = height;
    Tegaki.ghostCanvas.width = width;
    Tegaki.ghostCanvas.height = height;
    Tegaki.cursorCanvas.width = width;
    Tegaki.cursorCanvas.height = height;
    
    Tegaki.ctx.fillStyle = Tegaki.bgColor;
    Tegaki.ctx.fillRect(0, 0, width, height);
    
    for (i = 0; layer = Tegaki.layers[i]; ++i) {
      Tegaki.layersCnt.removeChild(layer.canvas);
    }
    
    Tegaki.activeCtx = null;
    Tegaki.layers = [];
    Tegaki.layerIndex = 0;
    $T.id('tegaki-layer-sel').textContent = '';
    
    Tegaki.setZoom(1);
    
    Tegaki.addLayer();
    Tegaki.setActiveLayer();
    Tegaki.updateFlatCtx();
  },
  
  getLayerIndex: function(id) {
    var i, layer, layers = Tegaki.layers;
    
    for (i = 0; layer = layers[i]; ++i) {
      if (layer.id === id) {
        return i;
      }
    }
    
    return -1;
  },
  
  getLayerById: function(id) {
    return Tegaki.layers[Tegaki.getLayerIndex(id)];
  },
  
  addLayer: function() {
    var id, cnt, opt, canvas, layer, nodes, last;
    
    if (Tegaki.layers.length >= Tegaki.maxLayers) {
      return false;
    }
    
    canvas = $T.el('canvas');
    canvas.className = 'tegaki-layer';
    canvas.width = Tegaki.canvas.width;
    canvas.height = Tegaki.canvas.height;
    
    id = ++Tegaki.layerIndex;
    
    layer = {
      id: id,
      name: 'Layer ' + id,
      canvas: canvas,
      ctx: canvas.getContext('2d'),
      visible: true,
      empty: true,
      opacity: 1.0
    };
    
    Tegaki.layers.push(layer);
    
    cnt = $T.id('tegaki-layer-sel');
    opt = $T.el('option');
    opt.value = layer.id;
    opt.textContent = layer.name;
    cnt.insertBefore(opt, cnt.firstElementChild);
    
    nodes = $T.cls('tegaki-layer', Tegaki.layersCnt);
    
    if (nodes.length) {
      last = nodes[nodes.length - 1];
    }
    else {
      last = Tegaki.canvas;
    }
    
    Tegaki.updateCanvasZoomSize(canvas);
    
    Tegaki.layersCnt.insertBefore(canvas, last.nextElementSibling);
    
    return new TegakiHistoryActions.AddLayer(id);
  },
  
  deleteLayers: function(ids) {
    var i, id, len, sel, idx, indices, layers;
    
    sel = $T.id('tegaki-layer-sel');
    
    indices = [];
    layers = [];
    
    for (i = 0, len = ids.length; i < len; ++i) {
      id = ids[i];
      idx = Tegaki.getLayerIndex(id);
      sel.removeChild(sel.options[Tegaki.layers.length - 1 - idx]);
      Tegaki.layersCnt.removeChild(Tegaki.layers[idx].canvas);
      
      indices.push(idx);
      layers.push(Tegaki.layers[idx]);
      
      Tegaki.layers.splice(idx, 1);
    }
    
    Tegaki.setActiveLayer();
    
    return new TegakiHistoryActions.DestroyLayers(indices, layers);
  },
  
  mergeLayers: function(ids) {
    var i, id, sel, idx, canvasBefore, destId, dest, action;
    
    sel = $T.id('tegaki-layer-sel');
    
    destId = ids.pop();
    idx = Tegaki.getLayerIndex(destId);
    dest = Tegaki.layers[idx].ctx;
    
    canvasBefore = $T.copyCanvas(Tegaki.layers[idx].canvas);
    
    for (i = ids.length - 1; i >= 0; i--) {
      id = ids[i];
      idx = Tegaki.getLayerIndex(id);
      dest.drawImage(Tegaki.layers[idx].canvas, 0, 0);
    }
    
    action = Tegaki.deleteLayers(ids);
    action.layerId = destId;
    action.canvasBefore = canvasBefore;
    action.canvasAfter = $T.copyCanvas(dest.canvas);
    
    Tegaki.setActiveLayer(destId);
    
    return action;
  },
  
  moveLayer: function(id, up) {
    var idx, sel, opt, canvas, tmp, tmpId;
    
    sel = $T.id('tegaki-layer-sel');
    idx = Tegaki.getLayerIndex(id);
    
    canvas = Tegaki.layers[idx].canvas;
    opt = sel.options[Tegaki.layers.length - 1 - idx];
    
    if (up) {
      if (!Tegaki.ghostCanvas.nextElementSibling) { return false; }
      canvas.parentNode.insertBefore(canvas,
        Tegaki.ghostCanvas.nextElementSibling.nextElementSibling
      );
      opt.parentNode.insertBefore(opt, opt.previousElementSibling);
      tmpId = idx + 1;
    }
    else {
      if (canvas.previousElementSibling.id === 'tegaki-canvas') { return false; }
      canvas.parentNode.insertBefore(canvas, canvas.previousElementSibling);
      opt.parentNode.insertBefore(opt, opt.nextElementSibling.nextElementSibling);
      tmpId = idx - 1;
    }
    
    Tegaki.updateGhostLayerPos();
    
    tmp = Tegaki.layers[tmpId];
    Tegaki.layers[tmpId] = Tegaki.layers[idx];
    Tegaki.layers[idx] = tmp;
    
    Tegaki.activeLayer = tmpId;
    
    return new TegakiHistoryActions.MoveLayer(id, up);
  },
  
  setLayerVisibility: function(ids, flag) {
    var i, len, sel, idx, layer, optIdx;
    
    sel = $T.id('tegaki-layer-sel');
    optIdx = Tegaki.layers.length - 1;
    
    for (i = 0, len = ids.length; i < len; ++i) {
      idx = Tegaki.getLayerIndex(ids[i]);
      layer = Tegaki.layers[idx];
      layer.visible = flag;
      
      if (flag) {
        sel.options[optIdx - idx].classList.remove('tegaki-strike');
        layer.canvas.classList.remove('tegaki-hidden');
      }
      else {
        sel.options[optIdx - idx].classList.add('tegaki-strike');
        layer.canvas.classList.add('tegaki-hidden');
      }
    }
  },
  
  setActiveLayer: function(id) {
    var ctx, idx;
    
    idx = id ? Tegaki.getLayerIndex(id) : Tegaki.layers.length - 1;
    
    if (idx < 0) {
      return;
    }
    
    ctx = Tegaki.layers[idx].ctx;
    
    if (Tegaki.activeCtx) {
      Tegaki.copyContextState(Tegaki.activeCtx, ctx);
    }
    
    Tegaki.activeCtx = ctx;
    Tegaki.activeLayer = idx;
    $T.id('tegaki-layer-sel').selectedIndex = Tegaki.layers.length - idx - 1;
    
    Tegaki.updateGhostLayerPos();
  },
  
  updateGhostLayerPos: function() {
    Tegaki.layersCnt.insertBefore(
      Tegaki.ghostCanvas,
      Tegaki.activeCtx.canvas.nextElementSibling
    );
  },
  
  clearCtx: function(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  },
  
  updateFlatCtx: function() {
    Tegaki.flatten(Tegaki.flatCtx);
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
    
    if (Tegaki.activePointerId !== e.pointerId) {
      Tegaki.activePointerId = e.pointerId;
      return;
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
        TegakiPipette.draw(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
      }
      else if (Tegaki.cursor) {
        Tegaki.renderCursor(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
      }
    }
  },
  
  onPointerDown: function(e) {
    if (Tegaki.isScrollbarClick(e)) {
      return;
    }
    
    Tegaki.activePointerId = e.pointerId;
    
    Tegaki.activePointerIsPen = e.pointerType === 'pen';
    
    Tegaki.canvasCnt.setPointerCapture(e.pointerId);
    
    if (e.target.parentNode === Tegaki.layersCnt) {
      if (Tegaki.activeLayer === null) {
        alert(TegakiStrings.noActiveLayer);
        return;
      }
      if (!Tegaki.layers[Tegaki.activeLayer].visible) {
        alert(TegakiStrings.hiddenActiveLayer);
        return;
      }
    }
    else if (e.target !== Tegaki.canvasCnt && e.target.parentNode !== Tegaki.canvasCnt) {
      return;
    }
    
    if (e.button === 2 || e.altKey) {
      e.preventDefault();
      
      Tegaki.isColorPicking = true;
      
      TegakiPipette.draw(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1));
    }
    else if (e.button === 0) {
      e.preventDefault();
      
      TegakiPressure.set(e.pressure);
      
      Tegaki.isPainting = true;
      
      Tegaki.clearCtx(Tegaki.cursorCtx);
      
      TegakiHistory.pendingAction = new TegakiHistoryActions.Draw(
        Tegaki.layers[Tegaki.activeLayer].id
      );
      
      TegakiHistory.pendingAction.addCanvasState(Tegaki.activeCtx.canvas, 0);
      
      Tegaki.tool.draw(Tegaki.getCursorPos(e, 0), Tegaki.getCursorPos(e, 1), true);
    }
  },
  
  onPointerUp: function(e) {
    Tegaki.activePointerId = e.pointerId;
    
    Tegaki.activePointerIsPen = false;
    
    Tegaki.canvasCnt.releasePointerCapture(e.pointerId);
    
    if (Tegaki.isPainting) {
      Tegaki.tool.commit && Tegaki.tool.commit();
      TegakiHistory.pendingAction.addCanvasState(Tegaki.activeCtx.canvas, 1);
      TegakiHistory.push(TegakiHistory.pendingAction);
      Tegaki.isPainting = false;
      Tegaki.updateFlatCtx();
    }
    else if (Tegaki.isColorPicking) {
      e.preventDefault();
      Tegaki.isColorPicking = false;
    }
  },
  
  onDummy: function(e) {
    e.preventDefault();
    e.stopPropagation();
  }
};
