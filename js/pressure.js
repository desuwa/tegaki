var TegakiPressure;

TegakiPressure = {
  pressureNow: 0.0,
  pressureThen: 0.0,
  
  get: function() {
    return this.pressureNow;
  },
  
  lerp: function(t) {
    return this.pressureThen * (1.0 - t) + this.pressureNow * t;
  },
  
  push: function(p) {
    this.pressureThen = this.pressureNow;
    this.pressureNow = p;
  },
  
  set: function(p) {
    this.pressureThen = this.pressureNow = p;
  }
};
