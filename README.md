[Demo](https://desuwa.github.io/tegaki.html)

```javascript
Tegaki.open({
  onDone: function() { window.open(Tegaki.flatten().toDataURL('image/png')); },
  onCancel: function() { console.log('Closing...')},
  width: 380,
  height: 380
});
```
