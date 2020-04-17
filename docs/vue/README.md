# Vue函数
首先我们来看下Vue函数的定义
```javascript
  function Vue (options) {
    if (!(this instanceof Vue)
    ) {
      warn('Vue is a constructor and should be called with the `new` keyword');
    }
    this._init(options);
  }
```
从Vue函数定义我们可以发现Vue函数非常简单，内部只是调用了_init方法并且警告非实例化调用