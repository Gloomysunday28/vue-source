# 函数式组件
深入函数式组件源码之前，我们需要知道函数式组件是什么? 函数式组件不具备执行上下文，它只是一个函数调用, 并不具备实例, 所以会显得更加轻量级，下面我们来看下具体实现
```js
  function createComponent(){
    ...
    if (isTrue(Ctor.options.functional)) {
      return createFunctionalComponent(Ctor, propsData, data, context, children)
    }
    ...
  }
```

我们继续看createFunctionalComponent函数
```js
  function createFunctionalComponent (
    Ctor,
    propsData,
    data,
    contextVm,
    children
  ) {
    var options = Ctor.options;
    var props = {};
    var propOptions = options.props;
    if (isDef(propOptions)) {
      for (var key in propOptions) {
        props[key] = validateProp(key, propOptions, propsData || emptyObject);
      }
    } else {
      if (isDef(data.attrs)) { mergeProps(props, data.attrs); }
      if (isDef(data.props)) { mergeProps(props, data.props); }
    }

    var renderContext = new FunctionalRenderContext(
      data,
      props,
      children,
      contextVm,
      Ctor
    );

    var vnode = options.render.call(null, renderContext._c, renderContext);

    if (vnode instanceof VNode) {
      return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options, renderContext)
    } else if (Array.isArray(vnode)) {
      var vnodes = normalizeChildren(vnode) || [];
      var res = new Array(vnodes.length);
      for (var i = 0; i < vnodes.length; i++) {
        res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options, renderContext);
      }
      return res
    }
  }
```
我们可以得知函数式组与普通组件在<font-bold>渲染时机</font-bold>不同的地方是:
- 函数式组件
  在createComponent的时候也就是父组件render时就会渲染(这里的时机需要记住, 之后组件Diff的时候会有所提到)
- 普通组件
  在父组件patch时才会触发渲染

同时我们知道createComponent的最后会进行组件钩子函数合并，而函数式组件提前已经返回出来，也就是说函数式组件不存在钩子函数，所以就无法走到init钩子函数，这样我们就可以得知一个结论，<font-bold>函数式组件不具备实例</font-bold>

### 总结
这一节讲解了函数式组件的渲染时机以及不具备实例，组件章节到这里基本结束了，后面涉及到组件的在深入响应式数据以及模板解析里
