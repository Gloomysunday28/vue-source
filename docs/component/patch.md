# 组件挂载
组件挂载的过程相信大家一定很好奇，那么本篇将对组件挂载的实现进行剖析
我们知道Vue挂载是在_init的最后调用的$mount方法, 我们从$mount函数入手
```js
  Vue.prototype.$mount = function (
    el,
    hydrating
  ) {
    el = el && inBrowser ? query(el) : undefined;
    return mountComponent(this, el, hydrating)
  };
```
$mount实际上是去调用mountComponent函数, 我们来看下mountComponent函数

## mountComponent
```js
 function mountComponent (
    vm,
    el,
    hydrating
  ) {
    vm.$el = el;
    ...
    callHook(vm, 'beforeMount');

    var updateComponent;
    /* istanbul ignore if */
    if (config.performance && mark) {
      updateComponent = function () {
        var name = vm._name;
        var id = vm._uid;
        var startTag = "vue-perf-start:" + id;
        var endTag = "vue-perf-end:" + id;

        mark(startTag);
        var vnode = vm._render();
        mark(endTag);
        measure(("vue " + name + " render"), startTag, endTag);

        mark(startTag);
        vm._update(vnode, hydrating);
        mark(endTag);
        measure(("vue " + name + " patch"), startTag, endTag);
      };
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
    hydrating = false;

    // manually mounted instance, call mounted on self
    // mounted is called for render-created child components in its inserted hook
    if (vm.$vnode == null) {
      vm._isMounted = true;
      callHook(vm, 'mounted');
    }
    return vm
  }
```
我们看下mountComponent, 大家肯定注意到了<font-bold>vm._update(vm._render(), ...)</font-bold>函数(hydrating是服务端渲染时用的), 该函数在mountComponent里频繁出现, 该函数就是挂载组件的函数，这里有个Watcher实例，我们先放一边等之后介绍数据响应章节会详细介绍，这里我们只需要知道vm._update(vm._render(), ...)函数调用即可

### _render
```js{23}
  Vue.prototype._render = function () {
    var vm = this;
    var ref = vm.$options;
    var render = ref.render;
    var _parentVnode = ref._parentVnode;
    if (_parentVnode) {
      vm.$scopedSlots = normalizeScopedSlots(
        _parentVnode.data.scopedSlots,
        vm.$slots,
        vm.$scopedSlots
      );
    }
    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode;
    // render self
    var vnode;
    try {
      // There's no need to maintain a stack becaues all render fns are called
      // separately from one another. Nested component's render fns are called
      // when parent component is patched.
      currentRenderingInstance = vm;
      vnode = render.call(vm._renderProxy, vm.$createElement);
    } catch (e) {
      handleError(e, vm, "render");
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      if (vm.$options.renderError) {
        try {
          vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e);
        } catch (e) {
          handleError(e, vm, "renderError");
          vnode = vm._vnode;
        }
      } else {
        vnode = vm._vnode;
      }
    } finally {
      currentRenderingInstance = null;
    }
    // if the returned array contains only a single node, allow it
    if (Array.isArray(vnode) && vnode.length === 1) {
      vnode = vnode[0];
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if (Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        );
      }
      vnode = createEmptyVNode();
    }
    // set parent
    vnode.parent = _parentVnode;
    return vnode
  };
```
以上高亮的代码就是_render函数的核心，它调用了render函数，正如我们在组件Vnode章节时讲的createElement函数会生成Vnode, 所以此时render出来的是根节点的vnode

## _update
```js
  Vue.prototype._update = function (vnode, hydrating) {
    var vm = this;
    var prevEl = vm.$el;
    var prevVnode = vm._vnode;
    var restoreActiveInstance = setActiveInstance(vm);
    vm._vnode = vnode;
    
    
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // console.log('1-prevVnode', prevVnode);
    //  console.log('2-prevEl', prevEl);
      // initial render
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode);
    }
    restoreActiveInstance();
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null;
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm;
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el;
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  };
```
我们拿着render函数渲染出来的根节点vnode传入_update函数里, 现在我们只考虑初始化状态, 此时vm._vnode是为空, 所以我们调用的是if语句里的__patch__,
<font-bold>组件此时是不具备$el属性(只有Vue实例具有)</font-bold>

### __patch__
```js
  var patch = createPatchFunction({ nodeOps: nodeOps, modules: modules });
  ...
  Vue.prototype.__patch__ = inBrowser ? patch : noop;

  function createPatchFunction() {
    ...
    return function patch (oldVnode, vnode, hydrating, removeOnly) {
      if (isUndef(vnode)) {
        if (isDef(oldVnode)) { invokeDestroyHook(oldVnode); }
        return
      }
      ...
      var isInitialPatch = false;
      var insertedVnodeQueue = [];
      if (isUndef(oldVnode)) {
        // empty mount (likely as component), create new root element
        // console.log('3-oldVnode', oldVnode);
        
        isInitialPatch = true;
        createElm(vnode, insertedVnodeQueue);
      } else {
       ... 
      }
      return vnode.elm
    }
  }
```
__patch__就是createPatchFunction返回出来的patch函数(<font-bold>createPatchFunction后面会单独拎出来讲到</font-bold>)
我们继续来看__patch__函数调用, 初始化会调用到createElm函数

### createElm
```js
  fnction createElm (
    vnode,
    insertedVnodeQueue,
    parentElm,
    refElm,
    nested,
    ownerArray,
    index
  ) {
    if (isDef(vnode.elm) && isDef(ownerArray)) {
      // This vnode was used in a previous render!
      // now it's used as a new node, overwriting its elm would cause
      // potential patch errors down the road when it's used as an insertion
      // reference node. Instead, we clone the node on-demand before creating
      // associated DOM element for it.
      vnode = ownerArray[index] = cloneVNode(vnode);
    }
    vnode.isRootInsert = !nested; // for transition enter check
    if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }
    
    var data = vnode.data;
    var children = vnode.children;
    var tag = vnode.tag;
    if (isDef(tag)) {
      ...
      vnode.elm = vnode.ns
        ? nodeOps.createElementNS(vnode.ns, tag)
        : nodeOps.createElement(tag, vnode);
      setScope(vnode);
      /* istanbul ignore if */
      {
        createChildren(vnode, children, insertedVnodeQueue);
        if (isDef(data)) {
          invokeCreateHooks(vnode, insertedVnodeQueue);
        }
        insert(parentElm, vnode.elm, refElm);
      }
      if (data && data.pre) {
        creatingElmInVPre--;
      }
    } else if (isTrue(vnode.isComment)) {
      vnode.elm = nodeOps.createComment(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    } else {
      vnode.elm = nodeOps.createTextNode(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    }
  }
```
createElm的作用就是将虚拟Dom真正的变成Dom节点, 我们来分析下createElm具体实现, 抛开createCompoent函数, 我们发现后面的vnode.elm = nodeOps.createElement(tag, vnode), 此时vnode.elm就等于真实DOM节点, 调用createChildren循环children并且调用createElm进行反复创建, insert函数是将当前渲染的Dom节点插入到父级节点里, 还记得我们刚才说的_update里的$el吗, 组件初始化是不具备$el的, 所以根节点在这里是不会插入到任何节点里, createChildren调用createElm传入的parentElm则是父节点, 因为父节点先于子节点创建, 最后会变成以下样子
```
  rootDom -> childrenDom -> grandChildrenDom -> ...
```

### createComponent
现在我们知道普通虚拟DOM节点是怎么创建的, 那么回过头来我们再讲下该章节最重要的一个函数, <font-bold>createComponent函数</font-bold>, 刚才我们在说createElm的时候略过了它, 现在重点讲解下该函数, 该函数定义在createPatchFunction里, 与之前的创建组件Vnode不是同一个函数
```js
  function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    var i = vnode.data;
    if (isDef(i)) {
      var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
      if (isDef(i = i.hook) && isDef(i = i.init)) {
        i(vnode, false /* hydrating */);
      }
      // after calling the init hook, if the vnode is a child component
      // it should've created a child instance and mounted it. the child
      // component also has set the placeholder vnode's elm.
      // in that case we can just return the element and be done.
      if (isDef(vnode.componentInstance)) {
        initComponent(vnode, insertedVnodeQueue);
        
        insert(parentElm, vnode.elm, refElm);
        if (isTrue(isReactivated)) {
          reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
        }
        return true
      }
    }
  }
```
还记得之前我们在创建组件Vnode的时候合并组件钩子函数吗, 在这里我们将调用第一个组件钩子函数init函数
### hook.init
```js
  init: function init (vnode, hydrating) {
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) {
      // kept-alive components, treat as a patch
      var mountedNode = vnode; // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode);
    } else {
      var child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      );
      child.$mount(hydrating ? vnode.elm : undefined, hydrating);
    }
  }
```
我们讲解下非Keep-alive的情况, 首先我们会去调用createComponentInstanceForVnode去初始化组件

```js{8}
  function createComponentInstanceForVnode (
    vnode, // we know it's MountedComponentVNode but flow doesn't
    parent // activeInstance in lifecycle state
  ) {
    var options = {
      _isComponent: true,
      _parentVnode: vnode,
      parent: parent
    };
    // check inline-template render functions
    var inlineTemplate = vnode.data.inlineTemplate;
    if (isDef(inlineTemplate)) {
      options.render = inlineTemplate.render;
      options.staticRenderFns = inlineTemplate.staticRenderFns;
    }
    return new vnode.componentOptions.Ctor(options)
  }
```
以上高亮代码是为了能够记住组件初始化时传入的options是有parent属性, parent = activeInstance, activeInstance是个全局变量, 我们先看下activeInstance
```js
  function setActiveInstance(vm) {
    var prevActiveInstance = activeInstance;
    activeInstance = vm;
    return function () {
      activeInstance = prevActiveInstance;
    }
  }
```
以上代码是在_update中先于__patch__函数触发, 此时activeInstance是当前渲染的组件, 也就是createComponent对应的component的父级, 举例说明
```
  Parent:
    <div>
      <Children>
    </div>
```
此时activeInstance就是Parent，而我们正在执行Children的init钩子函数(<font-bold>为什么是全局activeInstance, 这个问题可以想想看</font-bold>)。搞清楚activeInstance之后我们再来看下初始化组件Vnode, 回顾下之前Vue.prototype._init函数
```js
  if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options);
  }
```
此时options就是刚才我们看到的options， options._isComponent为ture，那么我们就调用initInternalComponent函数

### initInternalComponent
```js
  function initInternalComponent (vm, options) {
    var opts = vm.$options = Object.create(vm.constructor.options);
    // doing this because it's faster than dynamic enumeration.
    var parentVnode = options._parentVnode;
    opts.parent = options.parent;
    opts._parentVnode = parentVnode;

    var vnodeComponentOptions = parentVnode.componentOptions;
    opts.propsData = vnodeComponentOptions.propsData;
    opts._parentListeners = vnodeComponentOptions.listeners;
    opts._renderChildren = vnodeComponentOptions.children;
    opts._componentTag = vnodeComponentOptions.tag;

    if (options.render) {
      opts.render = options.render;
      opts.staticRenderFns = options.staticRenderFns;
    }
  }
```
我们可以看到组件是在这里赋值vm.$options, 还记得propsData吗？我们在生成组件vnode的时候根据data.props与options.props结合生成的propsData, 在这里将赋值给vm.$options, vm.constructor.options就是之前Vue.extend出来的Sub子类的options，Sub.options是由extendOptions与Vue.options结合的

### $mount函数
实例化Vue组件后将调用vm.$mount函数，这与本章一开始是一致的，就是将组件的根节点到最底部节点生成一个DOM Tree

### initComponent
回到createComponent函数, 我们调用完init后, 此时vnode.componentInstance就已经具备, 那么就会调用initComponent函数，我们来具体看下该函数的实现
```js
  function initComponent (vnode, insertedVnodeQueue) {
    if (isDef(vnode.data.pendingInsert)) {
      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert);
      vnode.data.pendingInsert = null;
    }
    vnode.elm = vnode.componentInstance.$el;
    if (isPatchable(vnode)) {
      invokeCreateHooks(vnode, insertedVnodeQueue);
      setScope(vnode);
    } else {
      // empty component root.
      // skip all element-related modules except for ref (#3455)
      registerRef(vnode);
      // make sure to invoke the insert hook
      insertedVnodeQueue.push(vnode);
    }
  }
```
此时的vnode是<font-bold>组件vnode</font-bold>, 别搞混了, vnode.componentInstance.$el则是该组件patch出来的根节点真实Dom节点，还记得刚才_update函数的调用吗?
vm.$el = vm.__patch__(...), __patch__函数返回的是根节点的真实节点, invokeCreatedHooks我会放到createPatchFunction里讲。
执行完initComponent函数后就会执行insert函数, 此时是将组件插入到父级节点里, 这里要分情况去讲:

1. 组件是根节点
```html
  <!-- Parent -->
  <template>
    <Children />
  </template>
```
此时Children将不会插入到任何父节点里, 此时Parent.$el就是指向Children的根节点, 那么Parent将会带着Children插入到对应的Parent的父级节点里

2. 父级是html节点
```html
  <!-- Parent -->
  <template>
    <div>
      <Children />
    </div>
  </template>
```
我们知道createElm的时候会调用普通dom节点createChildren去循环调用createElm, 那么Children就是div的子节点，div就是Children的parentElm, Children会将根节点插入到div下形成一个闭环

### 总结
本章节说的其实挺多的，从$mount挂载函数介绍到patch函数的调用到最后的组件挂载插入到dom节点里, 仔细再回顾下这章节的内容

### 追问
::: tip 疑问一
- 1. activeInstance为什么是全局变量?
::: 