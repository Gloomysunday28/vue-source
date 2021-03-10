<wx/>

# 组件Vnode

<!-- ## Vue定义
我们先回顾下Vue函数的定义
```js
  function Vue (options) {
    if (!(this instanceof Vue)
    ) {
      warn('Vue is a constructor and should be called with the `new` keyword');
    }
    this._init(options);
  }
``` -->

## createElement
首先我们来了解下render函数的写法
```js
  render(createElement) {
    return createElement(tag, data, children)
  }
```
render函数返回的是vnode, 也就是说createElement是返回vnode, 组件Vnode也在此创建的, 我们具体深入到createElement函数看下

```js
  function createElement (
    context,
    tag,
    data,
    children,
    normalizationType,
    alwaysNormalize
  ) {
    if (Array.isArray(data) || isPrimitive(data)) {
      normalizationType = children;
      children = data;
      data = undefined;
    }
    if (isTrue(alwaysNormalize)) {
      normalizationType = ALWAYS_NORMALIZE;
    }
    return _createElement(context, tag, data, children, normalizationType)
  }

  function _createElement (
    context,
    tag,
    data,
    children,
    normalizationType
  ) {
    // object syntax in v-bind
    if (isDef(data) && isDef(data.is)) {
      tag = data.is;
    }
    ...
    var vnode, ns;
    if (typeof tag === 'string') {
      if (config.isReservedTag(tag)) {
       ...
      } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
        // component
        vnode = createComponent(Ctor, data, context, children, tag);
      } else {
        ...
      }
    } else {
      vnode = createComponent(tag, data, context, children);
    }

    if (Array.isArray(vnode)) {
      return vnode
    } else if (isDef(vnode)) {
      if (isDef(ns)) { applyNS(vnode, ns); }
      if (isDef(data)) { registerDeepBindings(data); }
      return vnode
    } else {
      return createEmptyVNode()
    }
  }
```
这里我列举出创建组件Vnode时需要的code, createComponent是用来创建componentVnode,所以我们具体看下该函数的实现

## createComponent
```js
  function createComponent (
    Ctor,
    data,
    context,
    children,
    tag
  ) {
    if (isUndef(Ctor)) {
      return
    }

    var baseCtor = context.$options._base;

    // plain options object: turn it into a constructor
    if (isObject(Ctor)) {
      Ctor = baseCtor.extend(Ctor);
    }

    // if at this stage it's not a constructor or an async component factory,
    // reject.
    if (typeof Ctor !== 'function') {
      {
        warn(("Invalid Component definition: " + (String(Ctor))), context);
      }
      return
    }

    // async component
    var asyncFactory;
    if (isUndef(Ctor.cid)) {
      asyncFactory = Ctor;
      Ctor = resolveAsyncComponent(asyncFactory, baseCtor);
      if (Ctor === undefined) {
        // return a placeholder node for async component, which is rendered
        // as a comment node but preserves all the raw information for the node.
        // the information will be used for async server-rendering and hydration.
        return createAsyncPlaceholder(
          asyncFactory,
          data,
          context,
          children,
          tag
        )
      }
    }

    data = data || {};

    // resolve constructor options in case global mixins are applied after
    // component constructor creation
    resolveConstructorOptions(Ctor);

    // transform component v-model data into props & events
    if (isDef(data.model)) {
      transformModel(Ctor.options, data);
    }

    // extract props
    var propsData = extractPropsFromVNodeData(data, Ctor, tag);

    // functional component
    if (isTrue(Ctor.options.functional)) {
      return createFunctionalComponent(Ctor, propsData, data, context, children)
    }

    // extract listeners, since these needs to be treated as
    // child component listeners instead of DOM listeners
    var listeners = data.on;
    // replace with listeners with .native modifier
    // so it gets processed during parent component patch.
    data.on = data.nativeOn;

    if (isTrue(Ctor.options.abstract)) {
      // abstract components do not keep anything
      // other than props & listeners & slot

      // work around flow
      var slot = data.slot;
      data = {};
      if (slot) {
        data.slot = slot;
      }
    }

    // install component management hooks onto the placeholder node
    installComponentHooks(data);

    // return a placeholder vnode
    var name = Ctor.options.name || tag;
    var vnode = new VNode(
      ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
      data, undefined, undefined, undefined, context,
      { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },
      asyncFactory
    );

    return vnode
  }
```
总结下来createComponent函数做了以下四件事
1. 还记得第一章全局API调用时的_base属性吗，该属性指向的是Vue, 所以第一步<font-bold>调用Vue.extend</font-bold>就是创建Vue的子类
2. 第二步调用resolveConstructorOptions函数来合并options
3. 根据<font-bold>data.props与options.props</font-bold>返回propsData
4. installComponentHooks函数注册组件的钩子函数 <font-bold>componentVnodeHooks</font-bold>, 这里可以自定义钩子函数
5. 创建组件Vnode, 传入Ctor, propsData, listeners, children, tag给到vnode.componentOptions

## Vue.extend
通过刚才我们了解组件函数都是通过Vue.extend出来的, 那么Vue.extend内部究竟是怎么样的？
我们具体看下Vue.extend
```js
  Vue.extend = function (extendOptions) {
    extendOptions = extendOptions || {};
    var Super = this;
    var SuperId = Super.cid;
    var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }
    var name = extendOptions.name || Super.options.name;
    if (name) {
      validateComponentName(name);
    }
    var Sub = function VueComponent (options) {
      this._init(options);
    };
    Sub.prototype = Object.create(Super.prototype);
    Sub.prototype.constructor = Sub;
    Sub.cid = cid++;
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    );
    Sub['super'] = Super;
    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      initProps$1(Sub);
    }
    if (Sub.options.computed) {
      initComputed$1(Sub);
    }
    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend;
    Sub.mixin = Super.mixin;
    Sub.use = Super.use;
    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type];
    });
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub;
    }
    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options;
    Sub.extendOptions = extendOptions;
    Sub.sealedOptions = extend({}, Sub.options);
    // cache constructor
    cachedCtors[SuperId] = Sub;
    return Sub
  };
```
::: tip Vue.extend做了啥
  - 创建_Ctor存储以Vue.cid为key, 值为Sub的对象放入到Vue.extend第一个参数里, 做缓存不可以在Vue下extend多个相同的子类
  - 合并extendOptions与Vue.options
  - <font-bold>存在name时会自动将该组件放入到该组件的components中</font-bold>, 这意味着什么?(想想~~)
  - 重新获取extend、use、mixin、components等等

  属性说明:
    superOptions是Vue.options
    extendOptins是Vue.extend传入的options, 多了_Ctor[Vue.cid]属性
    sealedOptions是将Sub.options重新赋值到另外一个对象里去, 保证互不干扰
:::

### 总结
  Vue组件Vnode创建时, 首先会去调用Vue.extend创建Vue的子类作为组件函数, 其次对data.props进行处理并赋值给propsData, 合并组件钩子函数(可以自定义钩子函数), 最后会创建组件Vnode(只有组件Vnode才会具有componentOptions属性)