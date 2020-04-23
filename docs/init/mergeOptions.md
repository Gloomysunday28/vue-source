# 合并资源
Vue实例化时会将所有已有的资源进行合并并且赋值给vm.$options
```js
  vm.$options = mergeOptions(
    resolveConstructorOptions(vm.constructor),
    options || {},
    vm
  );
```

## resolveConstructorOptions
```js
  function resolveConstructorOptions (Ctor) {
    var options = Ctor.options;
    if (Ctor.super) {
      var superOptions = resolveConstructorOptions(Ctor.super);
      var cachedSuperOptions = Ctor.superOptions;
      if (superOptions !== cachedSuperOptions) {
        // super option changed,
        // need to resolve new options.
        Ctor.superOptions = superOptions;
        // check if there are any late-modified/attached options (#4976)
        var modifiedOptions = resolveModifiedOptions(Ctor);
        // update base extend options
        if (modifiedOptions) {
          extend(Ctor.extendOptions, modifiedOptions);
        }
        options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
        if (options.name) {
          options.components[options.name] = Ctor;
        }
      }
    }
    return options
  }
```
vm.constructor就是Vue函数, 这里有个super属性, 我们之前也没有看到super属性的定义, 其实这是Vue.extends函数赋值上去的super属性是组件实例具有的，而Vue是没有的, 具体的放到组件专栏去讲，现在我们只需要知道resolveConstructorOptions返回的是Vue.options, 此时options内部是这样的

```js
  Vue.options = {
    _base: Vue,
    components: {
      keepAlive
    },
    direcitives: {},
    filters: {},
    ...Vue.mixin
  }
```

## mergeOptions
```js
  function mergeOptions (
    parent,
    child,
    vm
  ) {
    {
      checkComponents(child);
    }

    if (typeof child === 'function') {
      child = child.options;
    }

    normalizeProps(child, vm);
    normalizeInject(child, vm);
    normalizeDirectives(child);

    // Apply extends and mixins on the child options,
    // but only if it is a raw options object that isn't
    // the result of another mergeOptions call.
    // Only merged options has the _base property.
    if (!child._base) {
      if (child.extends) {
        parent = mergeOptions(parent, child.extends, vm);
      }
      if (child.mixins) {
        for (var i = 0, l = child.mixins.length; i < l; i++) {
          parent = mergeOptions(parent, child.mixins[i], vm);
        }
      }
    }

    var options = {};
    var key;
    for (key in parent) {
      mergeField(key);
    }
    for (key in child) {
      if (!hasOwn(parent, key)) {
        mergeField(key);
      }
    }
    
    function mergeField (key) {
      var strat = strats[key] || defaultStrat;
      
      options[key] = strat(parent[key], child[key], vm, key);
    }
    return options
  }
```
normliazeProps在props专栏里重点讲，我们这里先看下面，我们知道_base属性在initGolbalAPI里才会赋值(<font-bold>之后合并后组件.options也会具有_base属性</font-bold>), 但是在初始时除了Vue其余调用的都没有，例如Vue.mixin就调用了该函数, 此时就会走if里面的代码
extends与mixins的区别就是数组与非数组的区别
```js
  Vue.mixin({
    extends: {
      data() {
        return { ... }
      }
    },
    mixins: [{
      data() {
        return { ... }
      }
    }, {
      data() {
        return { ... }
      }
    }],
    data() {
      return { ... }
    }
  })
```
以上三种写法都是可以被合并的

## mergeField
```js
  function mergeField (key) {
    var strat = strats[key] || defaultStrat;
      
    options[key] = strat(parent[key], child[key], vm, key);
  }
```
strats是什么？我们首先来回顾下上一篇我们说到的全局api调用里的Vue.config, 这里的optionMergeStrategies就是strats, <font-bold>strats作用是定义各个资源的处理函数</font-bold>，所有的资源(data, propsData, el...)都是通过strats处理后进行合并的，我们来看下(<font-bold>以下内容会比较多, 若思维记不住可以先暂停下，回顾下之前讲的，再重新从这里看起</font-bold>)
```js
 var strats = config.optionMergeStrategies;
```

### strats.el && strats.propsData
```js
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        "option \"" + key + "\" can only be used during instance " +
        'creation with the `new` keyword.'
      );
    }
    return defaultStrat(parent, child)
  };

  var defaultStrat = function (parentVal, childVal) {
    return childVal === undefined
      ? parentVal
      : childVal
  };
```
我们可以看到strats.el与strats.propsData(这个属性就是组件的props值, 具有后面会讲到)的处理函数是如上所述，若初始化传入的options不存在el或者propsData, 那么取第一个参数传入的options的值(在这里说下，组件的初始化是不会调用mergeOptions, <font-bold>那么你能想到除了Vue初始化,还有哪个调用了这个函数吗？</font-bold>)

### strats.data
```js
  strats.data = function (
    parentVal,
    childVal,
    vm
  ) {
    if (!vm) {
      if (childVal && typeof childVal !== 'function') {
        warn(
          'The "data" option should be a function ' +
          'that returns a per-instance value in component ' +
          'definitions.',
          vm
        );

        return parentVal
      }
      return mergeDataOrFn(parentVal, childVal)
    }

    return mergeDataOrFn(parentVal, childVal, vm)
  };

  function mergeDataOrFn (
    parentVal,
    childVal,
    vm
  ) {
    if (!vm) {
      // in a Vue.extend merge, both should be functions
      if (!childVal) {
        return parentVal
      }
      if (!parentVal) {
        return childVal
      }
      // when parentVal & childVal are both present,
      // we need to return a function that returns the
      // merged result of both functions... no need to
      // check if parentVal is a function here because
      // it has to be a function to pass previous merges.
      return function mergedDataFn () {
        return mergeData(
          typeof childVal === 'function' ? childVal.call(this, this) : childVal,
          typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
        )
      }
    } else {
      return function mergedInstanceDataFn () {
        // instance merge
        var instanceData = typeof childVal === 'function'
          ? childVal.call(vm, vm)
          : childVal;
        var defaultData = typeof parentVal === 'function'
          ? parentVal.call(vm, vm)
          : parentVal;
        if (instanceData) {
          return mergeData(instanceData, defaultData)
        } else {
          return defaultData
        }
      }
    }
  }

  function mergeData (to, from) {
    if (!from) { return to }
    var key, toVal, fromVal;

    var keys = hasSymbol
      ? Reflect.ownKeys(from)
      : Object.keys(from);

    for (var i = 0; i < keys.length; i++) {
      key = keys[i];
      // in case the object is already observed...
      if (key === '__ob__') { continue }
      toVal = to[key];
      fromVal = from[key];
      if (!hasOwn(to, key)) {
        set(to, key, fromVal);
      } else if (
        toVal !== fromVal &&
        isPlainObject(toVal) &&
        isPlainObject(fromVal)
      ) {
        mergeData(toVal, fromVal);
      }
    }
    return to
  }
```
stracts.data的处理比propsData复杂一点，这里面牵扯到了核心响应式原理, 这里不展开细说，我们只需要知道是将两个data选项合并到一起即可，最终第二个参数的data为准

### strats.watch
```js
  strats.watch = function (
    parentVal,
    childVal,
    vm,
    key
  ) {
    // work around Firefox's Object.prototype.watch...
    if (parentVal === nativeWatch) { parentVal = undefined; }
    if (childVal === nativeWatch) { childVal = undefined; }
    /* istanbul ignore if */
    if (!childVal) { return Object.create(parentVal || null) }
    {
      assertObjectType(key, childVal, vm);
    }
    if (!parentVal) { return childVal }
    var ret = {};
    extend(ret, parentVal);
    for (var key$1 in childVal) {
      var parent = ret[key$1];
      var child = childVal[key$1];
      if (parent && !Array.isArray(parent)) {
        parent = [parent];
      }
      ret[key$1] = parent
        ? parent.concat(child)
        : Array.isArray(child) ? child : [child];
    }
    return ret
  };
```
watch函数用来监听值的变化, 从这里我们其实可以看到watch是<font-bold>可以用数组形式书写的</font-bold>, 最终将相同值的watch函数合并成一个数组

### strats.props && strats.methods && strats.inject && stracts.computed
```js
  strats.props =
  strats.methods =
  strats.inject =
  strats.computed = function (
    parentVal,
    childVal,
    vm,
    key
  ) {
    if (childVal && "development" !== 'production') {
      assertObjectType(key, childVal, vm);
    }
    if (!parentVal) { return childVal }
    var ret = Object.create(null);
    extend(ret, parentVal);
    if (childVal) { extend(ret, childVal); }
    return ret
  };

  function assertObjectType (name, value, vm) {
    if (!isPlainObject(value)) {
      warn(
        "Invalid value for option \"" + name + "\": expected an Object, " +
        "but got " + (toRawType(value)) + ".",
        vm
      );
    }
  }
```
这四个属性具有检测是否是纯对象的操作, 最后会合并成一个对象(此时的props是我们组件里书写的props, propsData则是父组件传入的值, 这里很容易搞混)

### strats[hook]
还记得我们之前initGlobalAPI函数里的Vue.config的第二个重要属性吗？<font-bold>_lifecycleHooks</font-bold>
```js
  LIFECYCLE_HOOKS.forEach(function (hook) {
    strats[hook] = mergeHook;
  });

  function mergeHook (
    parentVal,
    childVal
  ) {
    var res = childVal
      ? parentVal
        ? parentVal.concat(childVal)
        : Array.isArray(childVal)
          ? childVal
          : [childVal]
      : parentVal;
    return res
      ? dedupeHooks(res)
      : res
  }

  function dedupeHooks (hooks) {
    var res = [];
    for (var i = 0; i < hooks.length; i++) {
      if (res.indexOf(hooks[i]) === -1) {
        res.push(hooks[i]);
      }
    }
    return res
  }
```
我们可以看到生命周期created、mounted、beforeMounted...通过mergeHook处理完后会变成数组形式,这里也有个小技巧, 生命周期可以使用数组形式来写~~


strats函数已经说完了我们回到之前mergeOptions里
```js
 var options = {};
  var key;
  for (key in parent) {
    mergeField(key);
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key);
    }
  }
  
  function mergeField (key) {
    var strat = strats[key] || defaultStrat;
    
    options[key] = strat(parent[key], child[key], vm, key);
  }
```
options[key]都是根据刚才strats定义的函数处理后生成的, 最终形成以下的形式
```js
  vm.$options = {
    el: '',
    propsData: {},
    props: {},
    data: {},
    computed: {},
    inject: {},
    watch: {
      [key]: [f, f],
    },
    created: [f, f],
    mounted: [f, f],
    _base: Vue,
    components: {
      KeepAlive
    },
    directives: {},
    filters: {},
  }
```
以上就是mergeOptions在Vue实例化时最终返回的options, vm.$options其实是Vue.options扩展

## 扩展
我们都知道vue-router也提供了几个生命周期 - beforeRouteLeave、beforeRouteEnter
它们的处理方式其实在注册时是这样写的:
```js
  const strats = Vue.config.optionMergeStrategies
  strats.beforeRouteLeave = strats.beforeRouteEnter = strats.created
```
这里vue-router就将这些生命周期也定位成数组形式

## 总结
mergeOptions的调用会出现在五种情况下:
1. Vue实例调用
2. Vue.mixin函数调用
3. Vue.extends会调用
4. Vue组件渲染成vnode时会调用
5. 手动全局调用(之前我们说到的Vue.util下具有mergeOptions函数)

mergeOptions的作用就是<font-bold>处理options的值, 并将第一个参数的options合并到第二个参数上</font-bold>
mergeOptions的巧妙用法:
```js
  {
    extends: {},
    mixins: [{}, {}],
    直接写
  }
```
以上都是可以被合并的