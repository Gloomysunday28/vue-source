# 初始化Vue.use
相信大家在注册vue-router与vuex的时候都使用到了Vue.use函数, 该函数会去执行一个函数或者是对象里的install属性, 那么内部究竟是怎么样的？这篇文章将带领大家探索
```js
  function initUse (Vue) {
    Vue.use = function (plugin) {
      var installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
      if (installedPlugins.indexOf(plugin) > -1) {
        return this
      }

      // additional parameters
      var args = toArray(arguments, 1);
      args.unshift(this);
      if (typeof plugin.install === 'function') {
        plugin.install.apply(plugin, args);
      } else if (typeof plugin === 'function') {
        plugin.apply(null, args);
      }
      installedPlugins.push(plugin);
      return this
    };
  }
```

## 步骤
- Vue函数下具有一个_installedPlugins集合，用于存储已经注册过的插件
- toArray作用: 将数组的start之后的所有值取出, 这里我们可以看到args等于第二个参数开始以后的集合
```js
  function toArray (list, start) {
    start = start || 0;
    var i = list.length - start;
    var ret = new Array(i);
    while (i--) {
      ret[i] = list[i + start];
    }
    return ret
  }
```
- args往第一个添加了this也就是Vue，这也解释了为什么我们的使用install时，第一个参数是Vue
::: tip 隐藏知识点
  install函数除了第一个是Vue，<font-bold>后面的都是Vue.use传入的参数</font-bold>
:::
- 判断参数是函数则直接调用，若是对象并且install的值是函数,也会调用
- 推入Vue._installPlugins
- <font-bold>返回Vue函数</font-bold>