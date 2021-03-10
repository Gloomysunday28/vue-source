<wx/>

# 生命周期
我们先来回顾下Vue的生命周期有哪些? 我就不详细写了

我们先来看下调用组件的函数 <font-bold>callHook</font-bold>
## callHook
```js
  function callHook (vm, hook) {
    // #7573 disable dep collection when invoking lifecycle hooks
    pushTarget();
    var handlers = vm.$options[hook];
    var info = hook + " hook";
    if (handlers) {
      for (var i = 0, j = handlers.length; i < j; i++) {
        invokeWithErrorHandling(handlers[i], vm, null, vm, info);
      }
    }
    if (vm._hasHookEvent) {
      vm.$emit('hook:' + hook);
    }
    popTarget();
  }
```
pusTarget与popTarget在之后的数据响应会详细说明, 我们先看下中间的执行代码, 我们在初始化章节知道生命周期都是以数组形式存在的, 所以vue会循环对应的生命周期函数并进行捕获错误处理, 由于hooks完全是由用户自定义, 所以Vue需要进行错误拦截, 在最后有个vm._hasHookEvent属性, 不了解的小伙伴可能不太清楚该属性的用法<font-bold>在注册事件时会详细说明该属性的作用</font-bold>
### beforeCreate
我们在组件实例化时应该注意到这个生命周期名称了, 它会在initState之前调用, initState是用来创建props、data、methods、watch、computed数据, 那么此时beforeCreate是无法访问到这些数据的

### created
在initState之后Vue就会调用该函数, 此时是可以访问到data等数据

### mounted
我们回到之前patch章节里，在挂载完组件后会调用initComponent
```js
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
```
不管该组件的根节点是否是可挂载的节点, insertedVnodeQueue都会将该组件vnode推入到数组里, 然后我们在看下patch的最后
```js
  invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
```
该函数是用来执行insertedVnodeQueue下所有的init钩子函数, 然后我们在看下组件的init钩子函数
```js
  insert: function insert (vnode) {
    var context = vnode.context;
    var componentInstance = vnode.componentInstance;

    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true;
      callHook(componentInstance, 'mounted');
    }
    if (vnode.data.keepAlive) {
      if (context._isMounted) {
        // vue-router#1212
        // During updates, a kept-alive component's child components may
        // change, so directly walking the tree here may call activated hooks
        // on incorrect children. Instead we push them into a queue which will
        // be processed after the whole patch process ended.
        queueActivatedComponent(componentInstance);
      } else {
        activateChildComponent(componentInstance, true /* direct */);
      }
    }
  }
```
我们可以看到当isMOunted不为真时, 则会调用mounted生命周期, 此时组件已经渲染完成, 在mounted里是可以访问到Dom的

### activated
与mounted一样, 同样在insert钩子函数里取调用, 唯一的区别在于:
- 若是根组件已经mounted了, 那么就进入到nextTick里去调用activated函数, 防止根组件对子组件的Dom进行操作后从而导致无法正确操作
- 若没有挂载, 那么直接调用activated函数

### update, beforeUpdate
在数据响应篇详细说明

### destory
在组件更新时详细说明
