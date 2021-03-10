<wx/>

# nextTick -- 不一样的烟火
我们日常见过很多使用nextTick的地方, 最主要的用途就是用来获取Dom节点, 本节旨在nextTick内部是如何去实现获取最新Dom

在剖析nextTick之前, 我们首先了解下宏任务与微任务(EventLoop)

1.取宏任务队列里的第一个任务然后执行

2. 宏任务执行完后就会去取该宏任务下微任务队列的第一个任务, 在微任务里添加的微任务都会被添加到该宏任务下的微任务队列, 直到所有微任务队列清空才会进行下一步

3. 微任务队列清空后, 浏览器发起UI Rendering重新渲染一次, 了解了宏任务与微任务的定义与调用时机后

<font-bold>我们再来看下为什么Vue要将更新放入到微任务里:</font-bold>
我们先看下以下这个例子:
```js
  for (var i = 0; i <= 100; i++) {
    div.innerHTML = i
  }
```
以上渲染此数可以猜猜看有几次？ 只有一次。 

::: tip 浏览器渲染机制
  1.JavaScript：JavaScript 实现动画效果，DOM 元素操作等。（Cpu） 

  2.Style（计算样式）：确定每个 DOM 元素应该应用什么 CSS 规则。（Cpu）
  
  3.Layout（布局）：计算每个 DOM 元素在最终屏幕上显示的大小和位置。由于 web 页面的元素布局是相对的，所以其中任意一个元素的位置发生变化，都会联动的引起其他元素发生变化，这个过程叫 reflow。（每个DOM对应一个渲染层）（Cpu）

  4.Paint（绘制）：在多个层上绘制 DOM 元素的的文字、颜色、图像、边框和阴影等， 这个过程叫做repaint。（Cpu）

  5.Composite（渲染层合并）：当每个DOM处于同一层的时候，RenderLayers将按照合理的顺序合并图层然后显示到屏幕上。（进入GPU）（render Tree 解析渲染）
:::
渲染是在JS执行完后才会触发, 所以以上代码执行了100次但是最终浏览器只会渲染一次, 所以将所有的渲染操作放入到渲染前一步去处理是最好的

### nextTick
```js
  function nextTick (cb, ctx) {
    var _resolve;
    callbacks.push(function () {
      if (cb) {
        try {
          cb.call(ctx);
        } catch (e) {
          handleError(e, ctx, 'nextTick');
        }
      } else if (_resolve) {
        _resolve(ctx);
      }
    });
    if (!pending) {
      pending = true;
      timerFunc();
    }
    // $flow-disable-line
    if (!cb && typeof Promise !== 'undefined') {
      return new Promise(function (resolve) {
        _resolve = resolve;
      })
    }
  }
```
### timeFunc
```js
  if (typeof Promise !== 'undefined' && isNative(Promise)) {
    var p = Promise.resolve();
    timerFunc = function () {
      p.then(flushCallbacks);
      // In problematic UIWebViews, Promise.then doesn't completely break, but
      // it can get stuck in a weird state where callbacks are pushed into the
      // microtask queue but the queue isn't being flushed, until the browser
      // needs to do some other work, e.g. handle a timer. Therefore we can
      // "force" the microtask queue to be flushed by adding an empty timer.
      if (isIOS) { setTimeout(noop); }
    };
    isUsingMicroTask = true;
  } else if (!isIE && typeof MutationObserver !== 'undefined' && (
    isNative(MutationObserver) ||
    // PhantomJS and iOS 7.x
    MutationObserver.toString() === '[object MutationObserverConstructor]'
  )) {
    // Use MutationObserver where native Promise is not available,
    // e.g. PhantomJS, iOS7, Android 4.4
    // (#6466 MutationObserver is unreliable in IE11)
    var counter = 1;
    var observer = new MutationObserver(flushCallbacks);
    var textNode = document.createTextNode(String(counter));
    observer.observe(textNode, {
      characterData: true
    });
    timerFunc = function () {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
    };
    isUsingMicroTask = true;
  } else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
    // Fallback to setImmediate.
    // Technically it leverages the (macro) task queue,
    // but it is still a better choice than setTimeout.
    timerFunc = function () {
      setImmediate(flushCallbacks);
    };
  } else {
    // Fallback to setTimeout.
    timerFunc = function () {
      setTimeout(flushCallbacks, 0);
    };
  }
```
nextTick就是去执行timeFunc, 我们看下timeFunc的定义

1. Promise: 这里在IOS系统下有个问题, 正常来说和本文一开始说的一样, 微任务里添加微任务会往微任务队列里去添加, 但是ios系统在添加微任务的时候不会去刷新微任务队列, 导致最新的微任务无法执行, setTimeout刷新微任务队列
2. MutationObserver
3. setImmediate: 属于宏任务, 在计算大量数据的时候使用, 但是兼容性很差, 只有高版本的IE与Edge支持
4. setTimeout

### 获取最新DOM
仔细阅读过上面微任务与渲染的调用时机之后, 我们肯定会有一个疑问, 渲染明明是在微任务之后调用, <font-bold>那么Vue是如何在nextTick里取到最新的Dom呢?</font-bold>

我们首先得知道浏览器是根据renderTree去渲染的, 而renderTree是由DomTree与CssTree结合起来, 我们通过js获取的Dom节点是来自DomTree, 而DomTree是<font-bold>实时更新的</font-bold>, 它与渲染机制不同, 上面的100次循环例子每次都会在DomTree上更新, 结合Vue在nextTick里进行数据派发更新, 我们就可以得出nextTick里为什么可以获取到最新Dom的原因了

### 总结
本节在介绍nextTick的时候顺便讲解了相关的EventLoop与浏览器渲染机制, 这些都是可以更好的帮助我们理解为什么Vue要使用nextTick这个函数, 下一节computed