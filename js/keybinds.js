var TegakiKeybinds;

TegakiKeybinds = {
  map: null,
  
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
      keys = mods.join('-') + '-' + keys;
    }
    
    fn = TegakiKeybinds.map[keys];
    
    if (fn && !e.altKey && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      fn[0][fn[1]]();
    }
  },
};
