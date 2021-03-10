<wx/>

# 响应式数据核心原理
我们回到一开始的_init方法
```js {4-8}
   Vue.prototype._init = function (options) {
    ...
    // expose real self
    callHook(vm, 'beforeCreate');
    ...
    initState(vm);
    ...
    callHook(vm, 'created');
    ...
  };
```
initState就是用来初始化依赖数据的, 而callHook是用来执行生命周期的, 我们可以看到beforeCreate是无法获取data值的

下面我们分析下initState函数
```js
  function initState (vm) {
    vm._watchers = []; // 注意这里, 所有的watcher都会被添加到该数组里
    var opts = vm.$options;
    if (opts.props) { initProps(vm, opts.props); }
    if (opts.methods) { initMethods(vm, opts.methods); }
    if (opts.data) {
      initData(vm);
    } else {
      observe(vm._data = {}, true /* asRootData */);
    }
    if (opts.computed) { initComputed(vm, opts.computed); }
    if (opts.watch && opts.watch !== nativeWatch) {
      initWatch(vm, opts.watch);
    }
  }
```
从上文我们可以知道props与methods是在data之前创建，也就是说<font-bold>data里可以直接获取到props与methods函数</font-bold>

本节我们主要讲解initData函数(内容会比较多), 之后会详细讲解props、computed以及watch

首先我们来看下initData函数的定义
```js
  function initData (vm) {
    var data = vm.$options.data;
    data = vm._data = typeof data === 'function'
      ? getData(data, vm)
      : data || {};
    if (!isPlainObject(data)) {
      data = {};
      warn(
        'data functions should return an object:\n' +
        'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
        vm
      );
    }
    // proxy data on instance
    var keys = Object.keys(data);
    var props = vm.$options.props;
    var methods = vm.$options.methods;
    var i = keys.length;
    while (i--) {
      var key = keys[i];
      {
        if (methods && hasOwn(methods, key)) {
          warn(
            ("Method \"" + key + "\" has already been defined as a data property."),
            vm
          );
        }
      }
      if (props && hasOwn(props, key)) {
        warn(
          "The data property \"" + key + "\" is already declared as a prop. " +
          "Use prop default value instead.",
          vm
        );
      } else if (!isReserved(key)) {
        proxy(vm, "_data", key);
      }
    }
    // observe data
    observe(data, true /* asRootData */);
  }
```
我们可以看到initData会去检验props与methods里是否具有同名的属性, 从上可以看出优先级props > data > methods。都通过后, 会去检测key是否是关键字, 若不是则用vm代理vm._data

<font-bold>observe: 响应式原理的核心代码</font-bold> 下面我们来详细讲解下observe函数

### observe
```js
  function observe (value, asRootData) {
    if (!isObject(value) || value instanceof VNode) {
      return
    }
    var ob;
    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
      ob = value.__ob__;
    } else if (
      shouldObserve &&
      !isServerRendering() &&
      (Array.isArray(value) || isPlainObject(value)) &&
      Object.isExtensible(value) &&
      !value._isVue
    ) {
      ob = new Observer(value);
    }
    if (asRootData && ob) {
      ob.vmCount++;
    }
    return ob
  }
```
我们可以直接看else if的逻辑, 看完后回过头来再看这一段代码就会清楚(顺便提一下, Vue2.6发布的Vue.observe就是调用observe函数)

::: tip 成为响应式具备条件
1. shoudObserve是用来控制props的深度响应, 之后会讲到, 这里为true
2. isServerRendering顾名思义是服务端渲染, 满足非服务端渲染条件
3. data必须是数组或者是纯对象并且是<font-bold>可扩展</font-bold>的, 所以这里我们就可以利用Object.freeze或者Object.seal去使对象不用成为响应式, 这里是Vue提供的一个优化点
4. data不能是组件, _isVue在组件初始化的时候(_init方法里)
:::

### Observer
```js
  var Observer = function Observer (value) {
    this.value = value;
    this.dep = new Dep();
    this.vmCount = 0;
    def(value, '__ob__', this);
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods);
      } else {
        copyAugment(value, arrayMethods, arrayKeys);
      }
      this.observeArray(value);
    } else {
      this.walk(value);
    }
  }
```
这里我们注意到了几个变量: Dep以及__ob__
__ob__就是observe里的某个判断条件表示该对象已经是响应式
Dep: 依赖收集类, 之后会讲到
此时对象变成以下这样子:
```js
  obj = {
    ...obj,
    __ob__: {
      value: obj,
      dep: new Dep(),
      vmCount: 0
    }
  }
```

我们首先来看下对象的处理: walk函数
```js
  Observer.prototype.walk = function walk (obj) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i]);
    }
  };
```
我们直接看defineReactive函数
```js
  function defineReactive (
    obj,
    key,
    val,
    customSetter,
    shallow
  ) {
    var dep = new Dep();
    var property = Object.getOwnPropertyDescriptor(obj, key);
    if (property && property.configurable === false) {
      return
    }
    // cater for pre-defined getter/setters
    var getter = property && property.get;
    var setter = property && property.set;
    if ((!getter || setter) && arguments.length === 2) {
      val = obj[key];
    }
    // console.log(obj.__ob__)
    var childOb = !shallow && observe(val);
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get: function reactiveGetter () {
        var value = getter ? getter.call(obj) : val;
        if (Dep.target) {
          dep.depend();
          if (childOb) {
            childOb.dep.depend();
            if (Array.isArray(value)) {
              dependArray(value);
            }
          }
        }
        return value
      },
      set: function reactiveSetter (newVal) {
        var value = getter ? getter.call(obj) : val;
        /* eslint-disable no-self-compare */
        if (newVal === value || (newVal !== newVal && value !== value)) {
          return
        }
        /* eslint-enable no-self-compare */
        if (customSetter) {
          customSetter();
        }
        // #7981: for accessor properties without setter
        if (getter && !setter) { return }
        if (setter) {
          setter.call(obj, newVal);
        } else {
          val = newVal;
        }
        childOb = !shallow && observe(newVal);
        dep.notify();
      }
    });
  }
```
这里有个childOb = !shallow && observe(val), 这里是用来将对象深度响应, 这就是为什么data里的对象属性更改也会触发渲染

::: tip 响应式核心代码
  get() { // 收集依赖的地方
    ...
  }

  set() { // 派发更新的地方
    ...
  }
:::
我们首先分析get函数,首先我们来看下Dep的定义
```js
  var Dep = function Dep () {
    this.id = uid++;
    this.subs = [];
  };

  Dep.prototype.removeSub = function removeSub (sub) {
    remove(this.subs, sub);
  };

  Dep.prototype.depend = function depend () {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  };

  // The current target watcher being evaluated.
  // This is globally unique because only one watcher
  // can be evaluated at a time.
  Dep.target = null;
  var targetStack = [];

  function pushTarget (target) {
    targetStack.push(target);
    Dep.target = target;
  }

  function popTarget () {
    targetStack.pop();
    Dep.target = targetStack[targetStack.length - 1];
  }
```
开始分析依赖收集步骤
1. 预先保留了原来的属性getter函数, 若没有getter函数则取第三个参数, 或者有setter函数时取obj[val]
2. Dep.target指向的是当前的Watcher, 由于JS是单线程的原因, 同一时间不会同时有两个Watcher在执行
::: tip  Watcher是什么?
  Watcher就是依赖函数, Vue里Watcher分为3种
  1. render Watcher: 渲染Watcher, 用于执行渲染函数
  2. computed Watcher: 计算属性Watcher, 用于执行computed函数
  3. user Watcher: 自定义Watcher, 常见的就是watch
:::
3. Dep.target存在时, 就会调用dep.depend将当前的Watcher收集到Dep实例下的subs数组里, 此时若属性为对象, 那么该对象也会收集该Watcher, 这就是为什么data里的对象也能触发渲染

我们先来看下Watcher的定义
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

我们拿渲染函数做例子
```js
  function mountComponent (
    vm,
    el,
    hydrating
  ) {
    vm.$el = el;
    callHook(vm, 'beforeMount');

    var updateComponent;
    /* istanbul ignore if */
    if (config.performance && mark) {
     ...
    } else {
      updateComponent = function () {
        vm._update(vm._render(), hydrating);
      };
    }

    // we set this to vm._watcher inside the watcher's constructor
    // since the watcher's initial patch may call $forceUpdate (e.g. inside child
    // component's mounted hook), which relies on vm._watcher being already defined
    new Watcher(vm, updateComponent, noop, {
      before: function before () {
        if (vm._isMounted && !vm._isDestroyed) {
          callHook(vm, 'beforeUpdate');
        }
      }
    }, true /* isRenderWatcher */);
    ...   
    return vm
  }
```
在组件渲染时会实例化Watcher, 之后由于是render Watcher, lazy是false, 直接调用的Watcher.get函数
```js
  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  Watcher.prototype.get = function get () {
    pushTarget(this);
    var value;
    var vm = this.vm;
    try {
      value = this.getter.call(vm, vm);
    } catch (e) {
      if (this.user) {
        handleError(e, vm, ("getter for watcher \"" + (this.expression) + "\""));
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value);
      }
      popTarget();
      this.cleanupDeps();
    }
    return value
  };
```
pushTarget就是将当前Dep.target指向到当前执行的Watcher实例, getter函数此时就是vm._update(vm._render(), false)函数, 触发组件渲染函数, 由于组件渲染会去获取模板里使用到的变量, 从而触发了对象属性的get函数, 由此触发dep.depend函数
```js
  Dep.prototype.depend = function depend () {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  };
```
此时Dep.target指向的是Watcher实例
addDep就是Watcher下的方法
```js
  /**
   * Add a dependency to this directive.
   */
  Watcher.prototype.addDep = function addDep (dep) {
    var id = dep.id;
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id);
      this.newDeps.push(dep);
      if (!this.depIds.has(id)) {
        dep.addSub(this);
      }
    }
  };
```
我们可以看到this.newDepIds与this.newDeps以及this.depIds三个属性, 这三个属性是用来记录Watcher被哪些dep收集了以便之后清理数据优化操作(具体等到下面的cleanupDeps函数来讲), 
经过去重后会调用dep.addSub函数
```js
  Dep.prototype.addSub = function addSub (sub) {
    this.subs.push(sub);
  };
```
此时dep会将Watcher添加到subs集合里, 到这里就完成了依赖收集, 我们再回到Watcher.get函数里, 最后一步会去执行cleanupDeps函数, 我们来看下具体实现：
```js
  /**
   * Clean up for dependency collection.
   */
  Watcher.prototype.cleanupDeps = function cleanupDeps () {
    var i = this.deps.length;
    while (i--) {
      var dep = this.deps[i];
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this);
      }
    }
    var tmp = this.depIds;
    this.depIds = this.newDepIds;
    this.newDepIds = tmp;
    this.newDepIds.clear();
    tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
  };
```
从上面我们可以看出this.deps是之前的this.newDeps集合, 调用cleanupDeps函数是为了<font-bold>让当前Watcher收集的dep集合里不存在的之前的dep清除此时正在渲染的Watcher</font-bold>, 听起来可能有点绕, 读者可以好好理解这句话, 那么此时就会有个疑问点, 为什么Vue要这么做?

::: tip 举个例子说明为什么Vue要去除dep里的Watcher
  我们知道组件的初始化与更新都是通过调用vm._update(vm._render())函数, 那么就是说组件在它的活动周期内可能会一直触发Watcher的依赖, 我们举一下v-if的例子, 首先具有A B组件, 两个组件是通过v-if去控制, 初始化我们加载了A组件, 那么data.dep就会收集到A组件的依赖函数(例如渲染函数), 此时将v-if条件变为false变为了B组件, B组件无意间更改收集了A组件的数据, 从而触发了A组件的渲染, 这显然是一个浪费资源的举措, A组件已经被卸载掉了, 重新渲染就是在浪费时间, 所以Watcher每次在重新执行依赖函数后就会去重新清理一遍关联dep的Watcher集合
:::

至此, 依赖收集讲解完成, 下面我们来说下派发更新, 我们还是以渲染函数为例
```js
  set() {
    ...
    dep.notify()
  }
```
派发更新的核心函数就是notify, 我们来看下notify函数的定义
```js
  Dep.prototype.notify = function notify () {
    // stabilize the subscriber list first
    var subs = this.subs.slice();
    if (!config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort(function (a, b) { return a.id - b.id; });
    }
    for (var i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  }
```
依赖收集时我们知道subs里收集的都是Watcher, 这里会触发Watcher.update函数
```js
  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  Watcher.prototype.update = function update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true;
    } else if (this.sync) {
      this.run();
    } else {
      queueWatcher(this);
    }
  };
```
这里就是触发重新渲染Watcher依赖的地方, run方法就是重新执行依赖函数, 通常我们会执行queueWatcher函数, 所以我们从该函数入手去讲解

### 派发更新queueWatcher
```js
  function queueWatcher (watcher) {
    var id = watcher.id;
    if (has[id] == null) {
      has[id] = true;
      if (!flushing) {
        queue.push(watcher);
      } else {
        // if already flushing, splice the watcher based on its id
        // if already past its id, it will be run next immediately.
        var i = queue.length - 1;
        while (i > index && queue[i].id > watcher.id) {
          i--;
        }
        queue.splice(i + 1, 0, watcher);
      }
      // queue the flush
      if (!waiting) {
        waiting = true;

        if (!config.async) {
          flushSchedulerQueue();
          return
        }
        nextTick(flushSchedulerQueue);
      }
    }
  }
```
::: tip 属性分析
  queue: 存储触发更新的Watcher集合
  flushing: 表示正在处理Watcher集合的更新, 若还未开始, 则一直往集合添加, 若已开始, 那么将通过watcher.id进行排序, watcher创建越早, id越小, Vue需要将watcher按照创建时间去处理,
  index: 当前执行的Watcher, 新添加的Watcher不能在当前Watcher之前, 否则会被忽略
  waiting: 每次更新, 只触发一次微任务
:::

### flushSchedulerWueue
```js
  /**
   * Flush both queues and run the watchers.
   */
  function flushSchedulerQueue () {
    currentFlushTimestamp = getNow();
    flushing = true;
    var watcher, id;

    // Sort queue before flush.
    // This ensures that:
    // 1. Components are updated from parent to child. (because parent is always
    //    created before the child)
    // 2. A component's user watchers are run before its render watcher (because
    //    user watchers are created before the render watcher)
    // 3. If a component is destroyed during a parent component's watcher run,
    //    its watchers can be skipped.
    queue.sort(function (a, b) { return a.id - b.id; });

    // do not cache length because more watchers might be pushed
    // as we run existing watchers
    for (index = 0; index < queue.length; index++) {
      watcher = queue[index];
      if (watcher.before) {
        watcher.before();
      }
      id = watcher.id;
      has[id] = null;
      watcher.run();
      // in dev build, check and stop circular updates.
      if (has[id] != null) {
        circular[id] = (circular[id] || 0) + 1;
        if (circular[id] > MAX_UPDATE_COUNT) {
          warn(
            'You may have an infinite update loop ' + (
              watcher.user
                ? ("in watcher with expression \"" + (watcher.expression) + "\"")
                : "in a component render function."
            ),
            watcher.vm
          );
          break
        }
      }
    }

    // keep copies of post queues before resetting state
    var activatedQueue = activatedChildren.slice();
    var updatedQueue = queue.slice();

    resetSchedulerState();
    // call component updated and activated hooks
    callActivatedHooks(activatedQueue);
    callUpdatedHooks(updatedQueue);

    // devtool hook
    /* istanbul ignore if */
    if (devtools && config.devtools) {
      devtools.emit('flush');
    }
  }
```
该函数会在微任务里进行, 这里有个细节点, for循环里vue一直在获取queue.length, 因为在更新Watcher的时候可能会有新的Watcher添加进来, 这里在每次更新Watcher之后都会重新获取queue的length, 以便所有的Watcher都可以被执行到

### watcher.run
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
  };
```
watcher.run会重新执行get方法, 也就是依赖函数, 并且在这里会去对比新旧值，若是新旧值不同, 则会触发callback函数典型代表就是watch

至此, 对象依赖收集以及派发更新讲解完成, 下面我们再回到Observer函数去讲解数组是怎么处理的

### Observer
```js
  if (Array.isArray(value)) {
    if (hasProto) {
      protoAugment(value, arrayMethods);
    } else {
      copyAugment(value, arrayMethods, arrayKeys);
    }
    this.observeArray(value);
  }
  ...
```
我们知道数组操作在push、pop、unshift等等会更改原数组的api里会去触发渲染函数, 但是直接定义某个index下是不会触发渲染的, Vue是通过劫持Array.prototype下的api去做到这种效果, 我们来看下arrayMehods的定义
```js
  var arrayProto = Array.prototype;
  var arrayMethods = Object.create(arrayProto);

  var methodsToPatch = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
  ];

  /**
   * Intercept mutating methods and emit events
   */
  methodsToPatch.forEach(function (method) {
    // cache original method
    var original = arrayProto[method];
    def(arrayMethods, method, function mutator () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      var result = original.apply(this, args);
      var ob = this.__ob__;
      var inserted;
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break
        case 'splice':
          inserted = args.slice(2);
          break
      }
      if (inserted) { ob.observeArray(inserted); }
      // notify change
      ob.dep.notify();
      return result
    });
  });
```
我们可以看到Vue在这里劫持了所有会更改原数组的原型API, 在响应式数组调用这些api的时候会去触发ob.dep.notify()函数去重新触发依赖函数, 回到Observer函数我们可以看到Vue并没有去监听数组的索引, 这也是为什么array[index]

### 发人深省
::: tip 既然Vue的设计可以让data准确的知道是哪个元素发生变化, 为什么要使用VDom?
  我们知道Watcher本身是一个实例, 它在浏览器进程里占据了一定的内存, 那么当Watcher细粒度变到Dom级别, Watcher的数量就随之变多, 性能消耗就会变大, 但是Watcher细粒度变得过高, 又会导致无法准确获取哪里发生了更新, 所以Vue将Watcher的细粒度定位在了组件, 此时结合VDom与Diff算法即可完成更新
:::

### 总结
本节篇幅比较长, 主要是剖析了Vue是怎么去将data选项变成响应式数据(响应式数据必须是可扩展), 响应式数据是怎么添加依赖, 又是怎么去派发更新, 数组与对象处理方式又不同, Vue通过劫持Array的prototype去处理渲染函数, 由于本篇幅比较长, 希望大家能够好好回顾下, 下一节nextTick函数