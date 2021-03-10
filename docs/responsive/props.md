<wx/>

# Props
我们知道Props是组件传值的一个手段, 并且props具有多种写法, 本节将会抓住以下几个点进行解析
- props的格式化
- props的初始化
- props的响应式原理
- props是怎么去更新子组件

### props的格式化
这里我们需要回溯到组件初始化_init函数里
```js
  function mergeOptions (
    parent,
    child,
    vm
  ) {
    ...
    normalizeProps(child, vm);
    ...
  }

  /**
   * Ensure all props option syntax are normalized into the
   * Object-based format.
   */
  function normalizeProps (options, vm) {
    var props = options.props;
    if (!props) { return }
    var res = {};
    var i, val, name;
    if (Array.isArray(props)) {
      i = props.length;
      while (i--) {
        val = props[i];
        if (typeof val === 'string') {
          name = camelize(val);
          res[name] = { type: null };
        } else {
          warn('props must be strings when using array syntax.');
        }
      }
    } else if (isPlainObject(props)) {
      for (var key in props) {
        val = props[key];
        name = camelize(key);
        res[name] = isPlainObject(val)
          ? val
          : { type: val };
      }
    } else {
      warn(
        "Invalid value for option \"props\": expected an Array or an Object, " +
        "but got " + (toRawType(props)) + ".",
        vm
      );
    }
    options.props = res;
  }
```
首先若props是数组, Vue将其转换为{ [name]: { type: null } }, 其次若是纯对象的话, 将其转换为{ [name]: val || { type: val } }
所以由以上我们可以得知, 无论我们以何种形式书写, 最后都会被转换为Object形式

### props的初始化
```js
  function initProps (vm, propsOptions) {
    var propsData = vm.$options.propsData || {};
    var props = vm._props = {};
    // cache prop keys so that future props updates can iterate using Array
    // instead of dynamic object key enumeration.
    var keys = vm.$options._propKeys = [];
    var isRoot = !vm.$parent;
    // root instance props should be converted
    if (!isRoot) {
      toggleObserving(false);
    }
    var loop = function ( key ) {
      keys.push(key);
      var value = validateProp(key, propsOptions, propsData, vm);
      /* istanbul ignore else */
      {
        var hyphenatedKey = hyphenate(key);
        if (isReservedAttribute(hyphenatedKey) ||
            config.isReservedAttr(hyphenatedKey)) {
          warn(
            ("\"" + hyphenatedKey + "\" is a reserved attribute and cannot be used as component prop."),
            vm
          );
        }

        defineReactive$$1(props, key, value, function () {
          if (!isRoot && !isUpdatingChildComponent) {
            warn(
              "Avoid mutating a prop directly since the value will be " +
              "overwritten whenever the parent component re-renders. " +
              "Instead, use a data or computed property based on the prop's " +
              "value. Prop being mutated: \"" + key + "\"",
              vm
            );
          }
        });
      }
      // static props are already proxied on the component's prototype
      // during Vue.extend(). We only need to proxy props defined at
      // instantiation here.
      if (!(key in vm)) {
        proxy(vm, "_props", key);
      }
    };

    for (var key in propsOptions) loop( key );
    toggleObserving(true);
  }
```
这里我们需要区分下propsData与props之间的区别:
- propsData是父组件传入的值
- props是组件定义的props配置

toggleObserving函数我会放到之后介绍props响应式处理时介绍, 现在我们看下初始化主要函数loop

### validateProp
```js
  function validateProp (
    key,
    propOptions,
    propsData,
    vm
  ) {
    var prop = propOptions[key];
    var absent = !hasOwn(propsData, key);
    var value = propsData[key];
    // boolean casting
    var booleanIndex = getTypeIndex(Boolean, prop.type);
    if (booleanIndex > -1) {
      if (absent && !hasOwn(prop, 'default')) {
        value = false;
      } else if (value === '' || value === hyphenate(key)) {
        // only cast empty string / same name to boolean if
        // boolean has higher priority
        var stringIndex = getTypeIndex(String, prop.type);
        if (stringIndex < 0 || booleanIndex < stringIndex) {
          value = true;
        }
      }
    }
    // check default value
    if (value === undefined) {
      value = getPropDefaultValue(vm, prop, key);
      // since the default value is a fresh copy,
      // make sure to observe it.
      var prevShouldObserve = shouldObserve;
      toggleObserving(true);
      observe(value);
      toggleObserving(prevShouldObserve);
    }
    {
      assertProp(prop, key, value, vm, absent);
    }
    return value
  }

  function getPropDefaultValue (vm, prop, key) {
    // no default, return undefined
    if (!hasOwn(prop, 'default')) {
      return undefined
    }
    var def = prop.default;
    // warn against non-factory defaults for Object & Array
    if (isObject(def)) {
      warn(
        'Invalid default value for prop "' + key + '": ' +
        'Props with type Object/Array must use a factory function ' +
        'to return the default value.',
        vm
      );
    }
    // the raw prop value was also undefined from previous render,
    // return previous default value to avoid unnecessary watcher trigger
    if (vm && vm.$options.propsData &&
      vm.$options.propsData[key] === undefined &&
      vm._props[key] !== undefined
    ) {
      return vm._props[key]
    }
    // call factory function for non-Function types
    // a value is Function if its prototype is function even across different execution context
    return typeof def === 'function' && getType(prop.type) !== 'Function'
      ? def.call(vm)
      : def
  }
```
valiadateProps调用getPropsDefaultValue函数去获取初始化值, 若default是函数, 那么就以函数形式调用, this指向实例, Vue同时也会对default进行响应式处理
我们现在讲解下Props的响应式过程

### props的响应式过程
具体流程我就不细说了在之前响应式数据核心原理章节已经详细讲解过, 然后这里我来说下data与props在响应式过程中的区别

我们在讲解props的时候已经出现过好几次toggleObserving函数, 显然该函数对于props响应式原理有着特殊的对待, 我们现在来看下该函数的定义
```js
  function toggleObserving (value) {
    shouldObserve = value;
  }
```
我们来回忆一下shouldObserve在哪出现, observe回顾下
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
还记得我们之前讲解响应式原理时提到的四个条件会导致数据无法响应式吗?
<font-bold>shouldObserve就是第一个条件</font-bold>, props无法进行深度监听, 这是它与data之间的区别之一

区别二:
```js
  defineReactive$$1(props, key, value, function () {
    if (!isRoot && !isUpdatingChildComponent) {
      warn(
        "Avoid mutating a prop directly since the value will be " +
        "overwritten whenever the parent component re-renders. " +
        "Instead, use a data or computed property based on the prop's " +
        "value. Prop being mutated: \"" + key + "\"",
        vm
      );
    }
  });
```
props在setter函数执行的时候会提示警告, 避免开发者直接修改propsData, 我们知道Vue框架数据流props从父级传递给子级, 如果直接更改props会造成数据混淆, 出现错误无法追溯原因(但是尽管会提示, 最终propsData最终还是会被更改掉)

### props是如何