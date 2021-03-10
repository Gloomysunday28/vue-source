# Vue函数定义
我们首先看下Vue函数的定义
```js{6}
  function Vue (options) {
    if (!(this instanceof Vue)
    ) {
      warn('Vue is a constructor and should be called with the `new` keyword');
    }
    this._init(options);
  }
```
可以看到Vue函数内部其实比较简单，它无非就做了两件事
1. 对于非实例化调用进行提醒
2. 调用了实例下的_init函数
