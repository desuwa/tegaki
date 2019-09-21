var TegakiAirbrush;

TegakiAirbrush = {
  name: 'airbrush',
  
  keybind: 'a',
  
  init: function() {
    this.size = 32;
    this.alpha = 0.5;
    this.alphaDamp = 0.2;
    this.step = 0.25;
    this.stepAcc = 0;

    this.draw = TegakiBrush.draw;  
    this.commit = TegakiBrush.commit;  
    this.brushFn = TegakiBrush.brushFn;  
    this.generateBrush = TegakiBrush.generateBrush;  
    this.setSize = TegakiBrush.setSize;  
    this.setAlpha = TegakiBrush.setAlpha;  
    this.setColor = TegakiBrush.setColor;  
    this.set = TegakiBrush.set;
},
  
  draw: null,
  
  commit: null,
  
  brushFn: null,
  
  generateBrush: null,
  
  setSize: null,
  
  setAlpha: null,
  
  setColor: null,
  
  set: null,
};
