# vue.component注册函数
ASSERT_TYPES定义在全局运行环境下，我们先看下它的定义
```js
  var ASSET_TYPES = [
    'component',
    'directive',
    'filter'
  ];
```
它由component, directive, filter三个字符串组合


## 结合initGlobalAPI里ASSERT_TYPES的调用
```js
  ASSET_TYPES.forEach(function (type) {
    Vue.options[type + 's'] = Object.create(null);
  });
```
我们可以发现Vue遍历ASSERT_TYPES，在Vue.options下循环创建了components, filters, directives等于一个空对象, 这些其实就等于我们自己写组件时定义的选项
::: details 点击查看代码
```js
  export default {
    components: {},
    directives: {},
    filters:
  }
```
:::

## initAssetRegisters
以上的只是初始化了三个对象, 我们需要结合实际操作去看下
熟悉Vue的小伙伴们应该都清楚Vue提供了全局的注册组件，注册过滤器以及注册指令函数
```js
  Vue.component(name, options)
  Vue.directive(name, options)
  Vue.filter(name, function() {})
```
我们回顾下上一篇初始化initGlobalAPI的最后调用了initAssetRegisters函数
```js
  function initAssetRegisters (Vue) {
    /**
     * Create asset registration methods.
     */
    ASSET_TYPES.forEach(function (type) {
      Vue[type] = function (
        id,
        definition
      ) {
        if (!definition) {
          return this.options[type + 's'][id]
        } else {
          /* istanbul ignore if */
          if (type === 'component') {
            validateComponentName(id);
          }
          if (type === 'component' && isPlainObject(definition)) {
            definition.name = definition.name || id;
            definition = this.options._base.extend(definition);
          }
          if (type === 'directive' && typeof definition === 'function') {
            definition = { bind: definition, update: definition };
          }
          this.options[type + 's'][id] = definition;
          return definition
        }
      };
    });
  }
```
该函数同样遍历ASSERT_TYPES数组，并且在Vue函数下定义了一个方法(<font-bold>这也就是我们平时调用的Vue.component等函数</font-bold>), 我们看下方法具体实现
- 第二个参数不具备的话, 直接取<font-bold>Vue.option[type + 's'][id]</font-bold>
- 若存在, 对于component属性首先进行名字的合法判断(<font-bold>开头必须是字母, 后面跟着数字、.、-符合即可，其余的是非法名称</font-bold>), 当第二个参数为纯对象时，对组件选项name进行处理(优先选择选项中的名称, 其次是第一个参数ID), this.options._base我们在上一篇已经讲到了(<font-bold>Vue.options._base = Vue</font-bold>), Vue.extend我们留到分析组件时再讲, 目前说下它返回的是Vue子类
- 最后返回将第二个参数赋值给对应的Vue.options[type + 's'][id]上

### 总结
本篇讲解了全局component、directive、filter是怎么初始化并且注册全局函数的，希望本篇对大家有所帮助

### 追加疑问
::: tip 疑问一
  在初始化Vue.component函数时, Vue考虑到我们可能没有定义组件选项里name属性并且帮助我们初始化了一个值
  那么<font-bold color="blue">name属性有这么重要吗? 请大家带着这个疑问</font-bold>
:::

<wx/>