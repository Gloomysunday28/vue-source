<wx/>

# 内部组件合并
我们都知道在vue组件里使用组件，需要先引入组件并且注册到components属性下，否则就会报错, 那么大家是否思考过<font-bold>
  为什么keep-alive, transition, transition-group这三个组件我们不需要注册却可以直接引用?
</font-bold>
我们回顾initGlobalAPI函数，其中有一句代码如下:

```js
  extend(Vue.options.components, builtInComponents);
```
该篇文章就看下该操作的作用是什么

## builtInComponents
```js
  var builtInComponents = {
    KeepAlive: KeepAlive
  };
```
keep-alive组件应该都不陌生吧~, 该组件的作用是用来缓存内部组件, initGlobalAPI函数就是将keep-alive注册到Vue.options.component里

### 总结
initGlobalAPI会将keep-alive内部组件注册到Vue.options.components下，那么正如一开始的疑问，<font-bold>为什么我们可以直接访问呢？</font-bold>带着这个问题继续往下读