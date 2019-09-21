### tegaki.js

Painter app in JavaScript.  

[Demo](https://desuwa.github.io/tegaki.html)

Notes on tablet support:
- Pen pressure doesn't work on Linux  
- Firefox users on Windows need to set `dom.w3c_pointer_events.dispatch_by_pointer_messages` to `true` in `about:config` to fix scrolling issues and enable pressure support  

#### Usage

```javascript
Tegaki.open({
  // when the user clicks on Finish
  onDone: function() {
    var w = window.open('');
    
    // Tegaki.flatten() returns a <canvas>
    Tegaki.flatten().toBlob(
      function(b) { w.location = URL.createObjectURL(b); },
      'image/png'
    );
  },
  // when the user clicks on Cancel
  onCancel: function() { console.log('Closing...')},
  
  // initial canvas size
  width: 380,
  height: 380
});
```

#### Building

Pre-built releases are [here](https://github.com/desuwa/tegaki/releases).  

To build from source yourself:  
`rake concat` will concatenate JS source files to produce *tegaki.js*  
`rake minify:js` will compress *tegaki.js*
