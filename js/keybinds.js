var TegakiKeybinds = {
  keyMap: {},
  
  captionMap: {},
  
  clear: function() {
    this.keyMap = {};
    this.captionMap = {};
  },
  
  bind: function(keys, klass, fn, id, caption) {
    this.keyMap[keys] = [klass, fn];
    
    if (id) {
      this.captionMap[id] = caption;
    }
  },
  
  getCaption(id) {
    return this.captionMap[id];
  },
  
  resolve: function(e) {
    var fn, mods, keys, el;
    
    el = e.target;
    
    if (el.nodeName == 'INPUT' && (el.type === 'text' || el.type === 'number')) {
      return;
    }
    
    mods = [];
    
    if (e.ctrlKey) {
      mods.push('ctrl');
    }
    
    if (e.shiftKey) {
      mods.push('shift');
    }
    
    keys = e.key.toLowerCase();
    
    if (mods[0]) {
      keys = mods.join('+') + '+' + keys;
    }
    
    fn = TegakiKeybinds.keyMap[keys];
    
    if (fn && !e.altKey && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      fn[0][fn[1]]();
    }
  },
};
