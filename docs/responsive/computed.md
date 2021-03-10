<wx/>

# computed计算属性
computed特性是用来处理data, 并且返回最终的data, 最主要的是它具有lazy, 也就是说是惰性函数

### 抛出疑问
- computed是怎么去准确定位到函数内部依赖的变量, <font-bold>如何得知依赖的变量已经更新从而触发computed更新?</font-bold>

本章节从源码的角度去感受下computed内部是怎么实现的

### initComputed
```js
  function initComputed (vm, computed) {
    // $flow-disable-line
    var watchers = vm._computedWatchers = Object.create(null);
    // computed properties are just getters during SSR
    var isSSR = isServerRendering();

    for (var key in computed) {
      var userDef = computed[key];
      var getter = typeof userDef === 'function' ? userDef : userDef.get;
      if (getter == null) {
        warn(
          ("Getter is missing for computed property \"" + key + "\"."),
          vm
        );
      }

      if (!isSSR) {
        // create internal watcher for the computed property.
        watchers[key] = new Watcher(
          vm,
          getter || noop,
          noop,
          computedWatcherOptions
        );
      }


      // component-defined computed properties are already defined on the
      // component prototype. We only need to define computed properties defined
      // at instantiation here.
      if (!(key in vm)) {
        defineComputed(vm, key, userDef);
      } else {
        if (key in vm.$data) {
          warn(("The computed property \"" + key + "\" is already defined in data."), vm);
        } else if (vm.$options.props && key in vm.$options.props) {
          warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
        }
      }
    }
  }
```
我们可以看到vm实例下定义了一个_computedWatchers专门用来收集该实例下computed的依赖函数, 在不是服务端渲染清空下, computed每个属性都会实例化一个Watcher, 依赖函数就是computed函数, computedWatcher我们可以看到它与renderWatcher的区别在于它具有lazy选项, 我们复习下Watcher的实例化时做了什么?
```js
  var Watcher = function Watcher (
    vm,
    expOrFn,
    cb,
    options,
    isRenderWatcher
  ) {
    this.vm = vm;
    if (isRenderWatcher) {
      vm._watcher = this;
    }
    vm._watchers.push(this);
    // options
    if (options) {
      this.deep = !!options.deep;
      this.user = !!options.user;
      this.lazy = !!options.lazy;
      this.sync = !!options.sync;
      this.before = options.before;
    } else {
      this.deep = this.user = this.lazy = this.sync = false;
    }
    this.cb = cb;
    this.id = ++uid$2; // uid for batching
    this.active = true;
    this.dirty = this.lazy; // for lazy watchers
    this.deps = [];
    this.newDeps = [];
    this.depIds = new _Set();
    this.newDepIds = new _Set();
    this.expression = expOrFn.toString();
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn;
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
```
我们可以看到lazy属性的存在会使初始化时依赖函数不立即执行, 也就是说computed在初始化时并不会去执行对应的get函数, 回过头来我们再看initComputed, 之后会调用defineComputed函数, 该函数就是computed的核心函数

### defineComputed
```js
  function defineComputed (
    target,
    key,
    userDef
  ) {
    var shouldCache = !isServerRendering();
    if (typeof userDef === 'function') {
      sharedPropertyDefinition.get = shouldCache
        ? createComputedGetter(key)
        : createGetterInvoker(userDef);
      sharedPropertyDefinition.set = noop;
    } else {
      sharedPropertyDefinition.get = userDef.get
        ? shouldCache && userDef.cache !== false
          ? createComputedGetter(key)
          : createGetterInvoker(userDef.get)
        : noop;
      sharedPropertyDefinition.set = userDef.set || noop;
    }
    if (sharedPropertyDefinition.set === noop) {
      sharedPropertyDefinition.set = function () {
        warn(
          ("Computed property \"" + key + "\" was assigned to but it has no setter."),
          this
        );
      };
    }
    Object.defineProperty(target, key, sharedPropertyDefinition);
  }

  function createComputedGetter (key) {
    return function computedGetter () {
      var watcher = this._computedWatchers && this._computedWatchers[key];
      if (watcher) {
        if (watcher.dirty) {
          watcher.evaluate();
        }
        if (Dep.target) {
          watcher.depend();
        }
        return watcher.value
      }
    }
  }
```
我们可以看到Vue将对应的computed代理到实例下, 我们具体看一下createComputedGetter函数, 该函数是用来收集依赖函数的

重新回到渲染函数, 我们在渲染template的时候会去获取对应的computed, 从而就会触发createComputedGetter函数, 随后我们剖析下内部究竟做了什么?

::: tip computed如何使内部依赖变量收集到computedWatcher
  _computedWatchers我们之前说到了是用来收集实例下所有的computedWatcher, 找到对应的computedWatcher, 此时我们在之前说到了computedWatcher会传入lazy选项用于惰性处理, lazy会被赋值给dirty变量, 此时computedWatcher会执行watcher.evaluate()
  ```js
    /**
     * Evaluate the value of the watcher.
     * This only gets called for lazy watchers.
     */
    Watcher.prototype.evaluate = function evaluate () {
      this.value = this.get();
      this.dirty = false;
    };
  ```
  evaluate会执行watcher的依赖函数, 此时会触发computed依赖的变量从而触发对应变量的get函数, 变量的dep就会收集到该computedWatcher, 执行完后并将dirty变为false(这一步就是为之后的lazy做处理)
  随后Dep.target存在的情况下会执行watcher.depend函数(<font-bold>注意: Dep.target此时是渲染Watcher</font-bold>)
  ```js
    /**
     * Depend on all deps collected by this watcher.
     */
    Watcher.prototype.depend = function depend () {
      var i = this.deps.length;
      while (i--) {
        this.deps[i].depend();
      }
    }
  ```
  我们知道deps就是拥有该Watcher的所有dep
  ```js
    Dep.prototype.depend = function depend () {
      if (Dep.target) {
        Dep.target.addDep(this);
      }
    };
  ```
  这里可能有点绕, 我们来理一下, computedWatcher收集到的dep(也就是computed依赖的变量的dep集合)调用depend函数, 此时的Dep.target是渲染Watcher, depend里的this是指的是computedWatcher收集到的dep, 渲染Watcher会去添加该变量的dep(因为该变量可能没有出现在template里, 所以需要去收集该变量的dep, Watcher内部本身就有去重处理), 随后返回了computed执行后的值, 这里我们就可以看到computed从创建到收集依赖以及最后的派发更新的整个过程
:::

### 总结
computed在初始化的时候会执行一次get函数, 随后就是由依赖的变量的更新触发computedWatcher的执行, 从而引起computed的更改, 这也是computed的魅力所在, 下一节watch的原理剖析