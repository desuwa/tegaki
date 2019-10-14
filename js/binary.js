class TegakiBinReader {
  constructor(buf) {
    this.pos = 0;
    this.view = new DataView(buf);
    this.buf = buf;
  }
  
  readInt8() {
    var data = this.view.getInt8(this.pos);
    this.pos += 1;
    return data;
  }
  
  readUint8() {
    var data = this.view.getUint8(this.pos);
    this.pos += 1;
    return data;
  }
  
  readInt16() {
    var data = this.view.getInt16(this.pos);
    this.pos += 2;
    return data;
  }
  
  readUint16() {
    var data = this.view.getUint16(this.pos);
    this.pos += 2;
    return data;
  }
  
  readUint32() {
    var data = this.view.getUint32(this.pos);
    this.pos += 4;
    return data;
  }
  
  readFloat32() {
    var data = this.view.getFloat32(this.pos);
    this.pos += 4;
    return data;
  }
}

class TegakiBinWriter {
  constructor(buf) {
    this.pos = 0;
    this.view = new DataView(buf);
    this.buf = buf;
  }
  
  writeInt8(val) {
    this.view.setInt8(this.pos, val);
    this.pos += 1;
  }
  
  writeUint8(val) {
    this.view.setUint8(this.pos, val);
    this.pos += 1;
  }
  
  writeInt16(val) {
    this.view.setInt16(this.pos, val);
    this.pos += 2;
  }
  
  writeUint16(val) {
    this.view.setUint16(this.pos, val);
    this.pos += 2;
  }
  
  writeUint32(val) {
    this.view.setUint32(this.pos, val);
    this.pos += 4;
  }
  
  writeFloat32(val) {
    this.view.setFloat32(this.pos, val);
    this.pos += 4;
  }
}
