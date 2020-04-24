# 异步组件
通常还未被使用的组件是不会被加载进来，考虑到性能优化, 从而采用按需加载, 本节将对异步组件进行剖析
首先我们还是从创建组件vnode开始
```js
  function createComponent() {
    ...
    if (isObject(Ctor)) {
      Ctor = baseCtor.extend(Ctor);
    }
    ...
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
    ...
  }
```
我们知道Ctor.cid在Vue.extend的时候就会赋值, 但是需要满足Ctor是对象形式才能进入Vue.extend调用, 当没有cid的时候, 说明组件函数还未定义, 进而判断该组件是个异步组件, 那么就会调用resolveAsyncComponent去处理异步组件

### resolveAsyncComponent
```js
  function resolveAsyncComponent (
    factory,
    baseCtor
  ) {
    if (isTrue(factory.error) && isDef(factory.errorComp)) {
      return factory.errorComp
    }

    if (isDef(factory.resolved)) {
      return factory.resolved
    }

    var owner = currentRenderingInstance;
    if (owner && isDef(factory.owners) && factory.owners.indexOf(owner) === -1) {
      // already pending
      factory.owners.push(owner);
    }

    if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
      return factory.loadingComp
    }

    if (owner && !isDef(factory.owners)) {
      var owners = factory.owners = [owner];
      var sync = true;
      var timerLoading = null;
      var timerTimeout = null

      ;(owner).$on('hook:destroyed', function () { return remove(owners, owner); });

      var forceRender = function (renderCompleted) {
        for (var i = 0, l = owners.length; i < l; i++) {
          (owners[i]).$forceUpdate();
        }

        if (renderCompleted) {
          owners.length = 0;
          if (timerLoading !== null) {
            clearTimeout(timerLoading);
            timerLoading = null;
          }
          if (timerTimeout !== null) {
            clearTimeout(timerTimeout);
            timerTimeout = null;
          }
        }
      };

      var resolve = once(function (res) {
        // cache resolved
        factory.resolved = ensureCtor(res, baseCtor);
        // invoke callbacks only if this is not a synchronous resolve
        // (async resolves are shimmed as synchronous during SSR)
        if (!sync) {
          forceRender(true);
        } else {
          owners.length = 0;
        }
      });

      var reject = once(function (reason) {
        warn(
          "Failed to resolve async component: " + (String(factory)) +
          (reason ? ("\nReason: " + reason) : '')
        );
        if (isDef(factory.errorComp)) {
          factory.error = true;
          forceRender(true);
        }
      });

      var res = factory(resolve, reject);

      if (isObject(res)) {
        if (isPromise(res)) {
          // () => Promise
          if (isUndef(factory.resolved)) {
            res.then(resolve, reject);
          }
        } else if (isPromise(res.component)) {
          res.component.then(resolve, reject);

          if (isDef(res.error)) {
            factory.errorComp = ensureCtor(res.error, baseCtor);
          }

          if (isDef(res.loading)) {
            factory.loadingComp = ensureCtor(res.loading, baseCtor);
            if (res.delay === 0) {
              factory.loading = true;
            } else {
              timerLoading = setTimeout(function () {
                timerLoading = null;
                if (isUndef(factory.resolved) && isUndef(factory.error)) {
                  factory.loading = true;
                  forceRender(false);
                }
              }, res.delay || 200);
            }
          }

          if (isDef(res.timeout)) {
            timerTimeout = setTimeout(function () {
              timerTimeout = null;
              if (isUndef(factory.resolved)) {
                reject(
                  "timeout (" + (res.timeout) + "ms)"
                );
              }
            }, res.timeout);
          }
        }
      }

      sync = false;
      // return in case resolved synchronously
      return factory.loading
        ? factory.loadingComp
        : factory.resolved
    }
  }
```
首先我们得知道异步组件有两种情况
::: tip
  - webpack提供的() => import函数, 返回的是promise
  - Vue提供的AsyncComponent
  ```js
    const AsyncComponent = () => ({
      // 需要加载的组件 (应该是一个 `Promise` 对象)
      component: import('./MyComponent.vue'),
      // 异步组件加载时使用的组件
      loading: LoadingComponent,
      // 加载失败时使用的组件
      error: ErrorComponent,
      // 展示加载时组件的延时时间。默认值是 200 (毫秒)
      delay: 200,
      // 如果提供了超时时间且组件加载也超时了，
      // 则使用加载失败时使用的组件。默认值是：`Infinity`
      timeout: 3000
    })
  ```
:::
那么基于第一种情况，我们来看下源码的实现, 我们先看下webapck提供的

### webpack () => import
<font-bold>首先要明确是这是一个异步操作</font-bold>, 它会定义resolve与reject两个函数, 调用异步组件函数并将resolve与reject放入到res.then方法里, 当还在加载时Vue返回了undefind, 此时继续回到createComponent函数里调用createAsyncPlaceholder函数, <font-bold color="blue">该函数返回出来的值</font-bold>就作为此时组件的vnode

```js
   function createAsyncPlaceholder (
    factory,
    data,
    context,
    children,
    tag
  ) {
    var node = createEmptyVNode();
    node.asyncFactory = factory;
    node.asyncMeta = { data: data, context: context, children: children, tag: tag };
    return node
  }
```
createAsyncPlaceholder函数实际上只是返回一个注释节点, 利用注释节点去代替异步组件
回到异步组件加载成功完成后调用resolve函数里
```js
  var resolve = once(function (res) {
    // cache resolved
    factory.resolved = ensureCtor(res, baseCtor);
    // invoke callbacks only if this is not a synchronous resolve
    // (async resolves are shimmed as synchronous during SSR)
    if (!sync) {
      forceRender(true);
    } else {
      owners.length = 0;
    }
  });
```
将返回的组件进行Vue.extend调用生成子类, 并让当前渲染的组件重新渲染一次, 实际上异步组件就是<font-bold>二次渲染</font-bold>，第一次使用注释节点代替，随后再次渲染整个组件使得异步组件可以重新替换掉原来的注释节点

### 总结
本章节讲了异步组件的实现，核心内容就是二次渲染，本文章还有Vue提供的方式没有讲，可以试着去推敲下，下一节函数式组件