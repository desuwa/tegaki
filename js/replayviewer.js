class TegakiReplayViewer {
  constructor() {
    this.formatVersion = 1;
    
    this.compressed = true;
    
    this.tegakiVersion = [0, 0, 0];
    
    this.dataSize = 0;
    
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    
    this.bgColor = [0, 0, 0];
    this.toolColor = [0, 0, 0];
    
    this.toolId = 1;
    
    this.toolMap = {};
    
    this.startTimeStamp = 0;
    this.endTimeStamp = 0;
    
    this.loaded = false;
    this.playing = false;
    this.gapless = true;
    
    this.autoPaused = false;
    
    this.destroyed = false;
    
    this.speedIndex = 1;
    this.speedList = [0.5, 1.0, 2.0, 5.0, 10.0, 25.0];
    this.speed = this.speedList[this.speedIndex];
    
    this.maxEventsPerFrame = 50;
    
    this.maxEventCount = 8640000;
    
    this.events = [];
    
    this.preludePos = 0.0;
    this.currentPos = 0.0;
    this.conclusionPos = 0.0;
    this.duration = 0.0;
    
    this.playTimeStart = 0.0;
    this.playTimeCurrent = 0.0;
    
    this.eventIndex = 0;
    
    this.maxCanvasWH = 8192;
    
    this.maxGapTime = 3000;
    
    this.uiAccTime = 0;
    
    this.onFrameThis = this.onFrame.bind(this);
  }
  
  destroy() {
    this.destroyed = true;
    this.pause();
    this.events = null;
  }
  
  speedUp() {
    if (this.speedIndex + 1 < this.speedList.length) {
      this.speed = this.speedList[++this.speedIndex];
    }
  }
  
  slowDown() {
    if (this.speedIndex - 1 >= 0) {
      this.speed = this.speedList[--this.speedIndex];
    }
  }
  
  toggleGapless() {
    this.gapless = !this.gapless;
  }
  
  getCurrentPos() {
    return this.currentPos;
  }
  
  getDuration() {
    return this.duration;
  }
  
  loadFromURL(url) {
    fetch(url)
      .then((resp) => this.onResponseReady(resp))
      .catch((err) => this.onLoadError(err));
  }
  
  onResponseReady(resp) {
    if (resp.ok) {
      resp.arrayBuffer()
        .then((buf) => this.onResponseBodyReady(buf))
        .catch((err) => this.onLoadError(err));
    }
    else {
      this.onLoadError(resp.statusText);
    }
  }
  
  onResponseBodyReady(data) {
    this.loadFromBuffer(data);
    Tegaki.onReplayLoaded();
  }
  
  onLoadError(err) {
    TegakiUI.printMsg(TegakiStrings.errorLoadReplay + err, 0);
  }
  
  autoPause() {
    this.autoPaused = true;
    this.pause();
  }
  
  pause(rewind) {
    window.cancelAnimationFrame(this.onFrameThis);
    
    this.playing = false;
    
    if (rewind) {
      this.currentPos = 0;
      this.eventIndex = 0;
    }
    
    Tegaki.onReplayTimeChanged();
    Tegaki.onReplayPlayPauseChanged();
  }
  
  rewind() {
    this.autoPaused = false;
    this.pause(true);
    Tegaki.onReplayReset();
  }
  
  play() {
    this.playTimeStart = performance.now();
    this.playTimeCurrent = this.playTimeStart;
    
    this.playing = true;
    this.autoPaused = false;
    
    this.uiAccTime = 0;
    
    Tegaki.onReplayPlayPauseChanged();
    
    window.requestAnimationFrame(this.onFrameThis);
  }
  
  togglePlayPause() {
    if (this.playing) {
      this.pause();
    }
    else {
      this.play();
    }
  }
  
  onFrame(ts) {
    var delta = ts - this.playTimeCurrent;
    
    if (!this.playing) {
      return;
    }
    
    this.playTimeCurrent = ts;
    
    this.step(delta);
    
    this.uiAccTime += delta;
    
    if (this.uiAccTime > 1000) {
      Tegaki.onReplayTimeChanged();
      this.uiAccTime = 0;
    }
    
    if (this.currentPos < this.duration) {
      window.requestAnimationFrame(this.onFrameThis);
    }
    else {
      this.pause();
    }
  }
  
  step(delta) {
    var event, currentEventTime, i;
    
    this.currentPos += (delta * this.speed);
    
    currentEventTime = this.currentPos + this.preludePos;
    
    if (this.gapless && this.eventIndex < this.events.length) {
      event = this.events[this.eventIndex];
      
      if (event.timeStamp - currentEventTime > this.maxGapTime) {
        this.currentPos = event.timeStamp - this.preludePos;
        currentEventTime = event.timeStamp;
      }
    }
    
    i = 0;
    
    while (this.eventIndex < this.events.length) {
      event = this.events[this.eventIndex];
      
      if (event.timeStamp <= currentEventTime) {
        if (i >= this.maxEventsPerFrame) {
          this.currentPos = event.timeStamp - this.preludePos;
          break;
        }
        
        event.dispatch();
        
        ++this.eventIndex;
        ++i;
      }
      else {
        break;
      }
    }
  }
  
  getEventIdMap() {
    var map, key, val;
    
    map = {};
    
    for (key in TegakiEvents) {
      val = TegakiEvents[key];
      map[val[0]] = val[1];
    }
    
    return map;
  }
  
  readToolMap(r) {
    var i, len, size, tool, field, fields, pos;
    
    this.toolMap = {};
    
    fields = [
      ['id', 'Uint8'],
      ['size', 'Uint8'],
      ['alpha', 'Float32'],
      ['step', 'Float32'],
      ['sizeDynamicsEnabled', 'Uint8'],
      ['alphaDynamicsEnabled', 'Uint8'],
      ['usePreserveAlpha', 'Uint8'],
      ['tipId', 'Int8'],
      ['flow', 'Float32'],
      ['flowDynamicsEnabled', 'Uint8'],
    ];
    
    len = r.readUint8();
    
    size = r.readUint8();
    
    for (i = 0; i < len; ++i) {
      pos = r.pos + size;
      
      tool = {};
      
      for (field of fields) {
        if (r.pos >= pos) {
          break;
        }
        
        tool[field[0]] = r['read' + field[1]]();
      }
      
      this.toolMap[tool.id] = tool;
      
      r.pos = pos;
    }
  }
  
  readHeader(r) {
    var tgk;
    
    tgk = String.fromCharCode(r.readUint8(), r.readUint8(), r.readUint8());
    
    if (tgk !== 'TGK') {
      throw 'invalid header';
    }
    
    this.compressed = r.readUint8() === 1;
    
    this.dataSize = r.readUint32();
    
    this.tegakiVersion[0] = r.readUint8();
    this.tegakiVersion[1] = r.readUint8();
    this.tegakiVersion[2] = r.readUint8();
    
    this.formatVersion = r.readUint8();
  }
  
  decompressData(r) {
    return UZIP.inflateRaw(
      new Uint8Array(r.buf, r.pos),
      new Uint8Array(this.dataSize)
    );
  }
  
  readMeta(r) {
    var pos, size;
    
    size = r.readUint16();
    
    pos = r.pos + size - 2;
    
    this.startTimeStamp = r.readUint32() * 1000;
    this.endTimeStamp = r.readUint32() * 1000;
    
    this.canvasWidth = r.readUint16();
    this.canvasHeight = r.readUint16();
    
    if (this.canvasWidth > this.maxCanvasWH
      || this.canvasHeight > this.maxCanvasWH) {
      throw 'canvas too large';
    }
    
    this.bgColor[0] = r.readUint8();
    this.bgColor[1] = r.readUint8();
    this.bgColor[2] = r.readUint8();
    
    this.toolColor[0] = r.readUint8();
    this.toolColor[1] = r.readUint8();
    this.toolColor[2] = r.readUint8();
    
    this.toolId = r.readUint8();
    
    r.pos = pos;
  }
  
  readEventStack(r) {
    var i, len, type, klass, event, eventMap;
    
    eventMap = this.getEventIdMap();
    
    len = r.readUint32();
    
    if (len < 1 || len > this.maxEventCount) {
      throw 'invalid event count';
    }
    
    for (i = 0; i < len; ++i) {
      type = r.readUint8();
      
      klass = eventMap[type];
      
      if (!klass) {
        throw 'invalid event id';
      }
      
      event = klass.unpack(r);
      
      this.events.push(event);
    }
    
    if (this.events[0].type !== TegakiEvents.TegakiEventPrelude[0]) {
      throw 'invalid prelude';
    }
    
    if (this.events[len - 1].type !== TegakiEvents.TegakiEventConclusion[0]) {
      throw 'invalid conclusion';
    }
    
    this.preludePos = this.events[0].timeStamp;
    this.conclusionPos = this.events[len - 1].timeStamp;
    
    this.duration = this.conclusionPos - this.preludePos;
    
    if (this.duration <= 0) {
      throw 'invalid duration';
    }
  }
  
  loadFromBuffer(buffer) {
    var r, data;
    
    if (this.destroyed || this.loaded) {
      return false;
    }
    
    r = new TegakiBinReader(buffer);
    
    this.readHeader(r);
    
    data = this.decompressData(r);
    
    r = new TegakiBinReader(data.buffer);
    
    this.readMeta(r);
    
    this.readToolMap(r);
    
    this.readEventStack(r);
    
    this.loaded = true;
    
    return true;
  }
}
