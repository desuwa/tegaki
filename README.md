### tegaki.js

Painter app in JavaScript.  

[Demo](https://desuwa.github.io/tegaki.html)

Notes on tablet support:
- Pen pressure works on Linux with google chrome. But doesn't work with firefox
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

It's possible to generate animated replays of drawings alongside the image itself.  
To do so, pass the `saveReplay: true` parameter to Tegaki.open.  
To get the replay data, call `Tegaki.replayRecorder.toBlob()` in your `onDone` callback.  

To watch a replay, start tegaki.js in replay mode:  
```javascript
Tegaki.open({
  replayMode: true,
  replayURL: 'https://path/to/replay.tgkr' // Store replay files preferably with the .tgkr extension
});
```

#### Building

Pre-built releases are [here](https://github.com/desuwa/tegaki/releases).  

To build from source yourself:  
`rake concat` will concatenate JS source files to produce *tegaki.js*  
`rake minify:js` will compress *tegaki.js* to produce *tegaki.min.js*


The `TEGAKI_LANG` environment variable controls which translation file will be used during concatenation:  
`rake concat TEGAKI_LANG=xx` would use strings from `js/strings/xx.js`

To build without replay support:  
`rake concat TEGAKI_NO_REPLAY=1`
