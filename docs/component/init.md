# 实例化组件
还记得我们在说Vue初始化的时候吗, <font-bold>initLifeCyle - callHook('created', vm)</font-bold>, 我们现在来解释下这些函数作用
```js {9-16}
   Vue.prototype._init = function (options) {
    ...
    /* istanbul ignore else */
    {
      initProxy(vm);
    }
    // expose real self
    vm._self = vm;
    initLifecycle(vm);
    initEvents(vm);
    initRender(vm);
    callHook(vm, 'beforeCreate');
    initInjections(vm); // resolve injections before data/props
    initState(vm);
    initProvide(vm); // resolve provide after data/props
    callHook(vm, 'created');
    ...
  };
```

## initLifecycle
```js {5-11}
  function initLifecycle (vm) {
    var options = vm.$options;

    // locate first non-abstract parent
    var parent = options.parent;
    if (parent && !options.abstract) {
      while (parent.$options.abstract && parent.$parent) {
        parent = parent.$parent;
      }
      parent.$children.push(vm);
    }
    vm.$parent = parent;
    vm.$root = parent ? parent.$root : vm;

    vm.$children = [];
    vm.$refs = {};

    vm._watcher = null;
    vm._inactive = null;
    vm._directInactive = false;
    vm._isMounted = false;
    vm._isDestroyed = false;
    vm._isBeingDestroyed = false;
  }
```
我们在上一节得知options.parent就是activeInstance, 也就是当前渲染的组件, 这里有个属性叫abstract, 我们称他为抽象组件, 抽象组件是不会被渲染到文档里的, 我们看到这个高亮代码里, 剔除了options.abstract
<font-bold>该函数的作用是建立对应的组件实例关系</font-bold>

### initEvent
该函数在之后说注册事件时详细讲解

## initRender
```js
  function initRender (vm) {
    vm._vnode = null; // the root of the child tree
    vm._staticTrees = null; // v-once cached trees
    var options = vm.$options;
    var parentVnode = vm.$vnode = options._parentVnode; // the placeholder node in parent tree
    var renderContext = parentVnode && parentVnode.context;
    vm.$slots = resolveSlots(options._renderChildren, renderContext);
    vm.$scopedSlots = emptyObject;
    // bind the createElement fn to this instance
    // so that we get proper render context inside it.
    // args order: tag, data, children, normalizationType, alwaysNormalize
    // internal version is used by render functions compiled from templates
    vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
    // normalization is always applied for the public version, used in
    // user-written render functions.
    vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };

    // $attrs & $listeners are exposed for easier HOC creation.
    // they need to be reactive so that HOCs using them are always updated
    var parentData = parentVnode && parentVnode.data;

    /* istanbul ignore else */
    {
      defineReactive$$1(vm, '$attrs', parentData && parentData.attrs || emptyObject, function () {
        !isUpdatingChildComponent && warn("$attrs is readonly.", vm);
      }, true);
      defineReactive$$1(vm, '$listeners', options._parentListeners || emptyObject, function () {
        !isUpdatingChildComponent && warn("$listeners is readonly.", vm);
      }, true);
    }
  }
```
我们在这里可以看到vm.$slots、vm.$createElement的定义, vm.$slots等待下面slot章节详细介绍, vm.$createElement与createElement的区别在于运行作用域, 我们回忆下createElement函数中的一小部分
```js
  function _createElement(context, ...) {
    ...
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      vnode = createComponent(Ctor, data, context, children, tag);
    } else {
    ...
  }

  function resolveAsset (
    options,
    type,
    id,
    warnMissing
  ) {
    /* istanbul ignore if */
    if (typeof id !== 'string') {
      return
    }
    var assets = options[type];
    // check local registration variations first
    if (hasOwn(assets, id)) { return assets[id] }
    var camelizedId = camelize(id);
    if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }
    var PascalCaseId = capitalize(camelizedId);
    if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }
    // fallback to prototype chain
    var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
    if (warnMissing && !res) {
      warn(
        'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
        options
      );
    }
    return res
  }
```
我们可以清楚发现, 在组件下运行$createElement函数时, Vue会去校验当前所处的组件的options.components是否包含了该组件名, 若没有则不会进行渲染该组件, 而只是当做一个占位符创建一个vnode。
回过头来看下initRender的最后还对$attrs与$listeners进行定义, 分别指向了attrs与listeners(自定义事件), 自定义事件与原生事件的区别处理也会放在之后的注册事件中详细说明

### callHook
在下一节生命周期里讲解

### initState
在数据响应章节会详细讲解

### 总结
我们得知组件实例化时会做以下的几件事:
1. 确定父级组件实例与子级实例的关系, abstract是抽象组件, 不会被渲染到文档里
2. vm.$createElement在创建子组件时, 会<font-bold>先去检验vm.$options是否具有该名称的组件</font-bold>, 从而决定渲不渲染组件