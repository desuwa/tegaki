var TegakiUI;

TegakiUI = {
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
    
    el = $T.el('select');
    el.id = 'tegaki-layer-sel';
    el.multiple = true;
    el.size = 3;
    $T.on(el, 'change', Tegaki.onLayerChange);
    ctrl.appendChild(el);
    
    row = $T.el('div');
    row.id = 'tegaki-layers-ctrl';
    
    el = $T.el('span');
    el.title = TegakiStrings.addLayer;
    el.className = 'tegaki-ui-btn tegaki-icon tegaki-plus';
    $T.on(el, 'click', Tegaki.onLayerAdd);
    row.appendChild(el);
    
    el = $T.el('span');
    el.title = TegakiStrings.delLayers;
    el.className = 'tegaki-ui-btn tegaki-icon tegaki-minus';
    $T.on(el, 'click', Tegaki.onLayerDelete);
    row.appendChild(el);
    
    el = $T.el('span');
    el.id = 'tegaki-layer-visibility';
    el.title = TegakiStrings.showHideLayer;
    el.className = 'tegaki-ui-btn tegaki-icon tegaki-eye';
    $T.on(el, 'click', Tegaki.onLayerVisibilityChange);
    row.appendChild(el);
    
    el = $T.el('span');
    el.id = 'tegaki-layer-merge';
    el.title = TegakiStrings.mergeLayers;
    el.className = 'tegaki-ui-btn tegaki-icon tegaki-level-down';
    $T.on(el, 'click', Tegaki.onMergeLayers);
    row.appendChild(el);
    
    el = $T.el('span');
    el.id = 'tegaki-layer-up';
    el.title = TegakiStrings.moveLayerUp;
    el.setAttribute('data-up', '1');
    el.className = 'tegaki-ui-btn tegaki-icon tegaki-up-open';
    $T.on(el, 'click', Tegaki.onMoveLayer);
    row.appendChild(el);
    
    el = $T.el('span');
    el.id = 'tegaki-layer-down';
    el.title = TegakiStrings.moveLayerDown;
    el.className = 'tegaki-ui-btn tegaki-icon tegaki-down-open';
    $T.on(el, 'click', Tegaki.onMoveLayer);
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
    
    return ctrl;
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
    
    if (!Tegaki.tool.setSizePressureCtrl) {
      ctrl.classList.add('tegaki-hidden');
    }
    else {
      ctrl.classList.remove('tegaki-hidden');
      
      cb = $T.id('tegaki-size-p-cb');
      
      if (Tegaki.tool.sizePressureCtrl) {
        cb.classList.add('tegaki-ui-cb-a');
      }
      else {
        cb.classList.remove('tegaki-ui-cb-a');
      }
    }
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
  }
};
