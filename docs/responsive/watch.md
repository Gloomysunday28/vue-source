# watch侦听属性
watch属性对于数据的监听处理十分有用, 并且时常被拿来和computed进行比较, 本章节将从watch的源码方面入手

### initWatch
```js
function initWatch (vm, watch) {
  for (var key in watch) {
    var handler = watch[key];
    if (Array.isArray(handler)) {
      for (var i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}
```

### createWatcher
```js
  function createWatcher (
    vm,
    expOrFn,
    handler,
    options
  ) {
    if (isPlainObject(handler)) {
      options = handler;
      handler = handler.handler;
    }
    if (typeof handler === 'string') {
      handler = vm[handler];
    }
    return vm.$watch(expOrFn, handler, options)
  }
```
::: tip watch额外的两种写法
  这里我们可以发现watch的callback函数有两种:
  1. 对象handler属性
  2. 字符串, Vue采用vm[字符串]
:::


### $watch
```js
  Vue.prototype.$watch = function (
    expOrFn,
    cb,
    options
  ) {
    var vm = this;
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {};
    options.user = true;
    var watcher = new Watcher(vm, expOrFn, cb, options);
    if (options.immediate) {
      try {
        cb.call(vm, watcher.value);
      } catch (error) {
        handleError(error, vm, ("callback for immediate watcher \"" + (watcher.expression) + "\""));
      }
    }
    return function unwatchFn () {
      watcher.teardown();
    }
  };
```
我们可以发现handler可以无限写下去, 采用的是最后一次handler对象(具体为什么这么做, 我也不是很清楚~~, 当做代码福利吧), 后面有定义了options.user = true, 这点等下到Watcher.run方法下查看,
接下来就是实例化Watcher, 这里的Watcher与之前的render Watcher、computed Watcher有些不一样, 具体从Watcher实例化看起
```js
  var Watcher = function Watcher (
    vm,
    expOrFn,
    cb,
    options,
    isRenderWatcher
  ) {
    ...
    this.expression = expOrFn.toString();
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      ...
    } else {
      this.getter = parsePath(expOrFn);
      if (!this.getter) {
        this.getter = noop;
        warn(
          "Failed watching path: \"" + expOrFn + "\" " +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        );
      }
    }
    this.value = this.lazy
      ? undefined
      : this.get();
  };

  function parsePath (path) {
    if (bailRE.test(path)) {
      return
    }
    var segments = path.split('.');
    return function (obj) {
      for (var i = 0; i < segments.length; i++) {
        if (!obj) { return }
        obj = obj[segments[i]];
      }
      return obj
    }
  }
```
我们可以看到watch Watcher的依赖并不是一个函数而是一个字符串, 也就是watch.key, Watcher的处理方式是调用parsePath方法去遍历该字符串获取该值, 目的是为了让该变量触发get函数从而收集该Watcher到Dep里, 然后我们可以看到该Watcher具有callback方法, 也就是watch.handler, 我们看下Watcher.run方法, 在介绍响应式核心原理时我们说到派发更新会触发Watcher.run从而执行依赖函数
```js
  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  Watcher.prototype.run = function run () {
    if (this.active) {
      var value = this.get();
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        var oldValue = this.value;
        this.value = value;
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue);
          } catch (e) {
            handleError(e, this.vm, ("callback for watcher \"" + (this.expression) + "\""));
          }
        } else {
          this.cb.call(this.vm, value, oldValue);
        }
      }
    }
  }
```
然后我们可以看到在新值与旧值对比期间后(<font-bold>watch Watcher.getter是获取vm[watch.key]的值</font-bold>), 若值不同, 那么就会触发callback函数并且传入新值与旧值, 回到之前createWatcher里, 我们看到options.user为true, 该属性是用来错误监控处理的, 由于该函数是用户自定义的, <font-bold>若是中途报错会导致Vue无法继续执行</font-bold>, 所以这里做了catch处理

### teardown
我们回到$watch最后一步返回的函数, 里面会触发Watcher.teardown方法, 具体看下是什么作用
```js
  /**
  * Remove self from all dependencies' subscriber list.
  */
  Watcher.prototype.teardown = function teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this);
      }
      var i = this.deps.length;
      while (i--) {
        this.deps[i].removeSub(this);
      }
      this.active = false;
    }
  };
```
我们可以看到teardown作用其实就是将该Watcher注销掉
vm._watchers会在Watcher创建的时候就添加了该Watcher, 所有的Watchers都会存储在vm._watchers里, deps是收集所有添加了该Watcher的dep集合, 这里也会删除掉, 并且最后将active变成false, active在派发更新触发的run函数里会做限制。

### 解惑: 与computed的区别
社区中很多的声音是说computer与watch具有区别, 但是我们从两者源码分析后发现, 两种其实并没有什么实质性区别, 以下列举一些小区别
- watch初始化需要使用immdiate属性去控制是否立即调用, 而computed若是存在template里初始化会去调用该函数
- 两者设计的目的不同: watch是用于处理变量更新后的行为, 而computed的设计初衷就是经过处理后获取最新的值

下面说下共同点:
- watch与computed都可以使用异步操作, watch就不用说了, 说下computed函数, 我们知道computed初始化后会将该computedWatcher添加到依赖变量的dep里, 依赖变量更新后, Vue就会去执行computed函数同步数据, 而变量派发更新也有个限制: 就是前后两者的值必须不一样才会触发, 所以即使computed采用的是异步加载同样是可以更新computed并且不会产生无限递归
- watch与computed都具有惰性因素, 两者都是在依赖变量发生变化后才会去同步函数


### 总结
本章节介绍了watch的创建以及怎么收集依赖怎么去派发更新, 并且从源码的角度我们也可以发现computed与watch的区别其实不是平时我们所了解的那样, 希望大家好好回顾本章节, 下一节组件更新diff