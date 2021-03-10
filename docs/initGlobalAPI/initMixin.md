# Vue.mixin函数
mixin一个组件后，我们可以在该组件里使用到mixin里的数据，那么究竟内部是怎么样的？我们来看下
```js {3}
 function initMixin$1 (Vue) {
    Vue.mixin = function (mixin) {
      this.options = mergeOptions(this.options, mixin);
      return this
    };
  }
```
<font-bold>mergeOptions函数</font-bold>我准备放在Vue初始话讲, 本篇只是提及~

<wx/>