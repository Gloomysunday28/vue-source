# 总结

Vue函数下具有很多全局的api, 运用的不错可以完成挺多的意想不到的功能<font-bold>(当然有些东西需要放到对应的模块里去讲比较合适)</font-bold>,本篇文章来再次回顾下之前讲的一些东西
::: tip Vue.config
  通过之前的介绍我们知道config下存了很多属性, 最重要的有两个<font-bold color="blue">optionMergeStrategies</font-bold>、<font-bold color="blue">_lifecycleHooks</font-bold>, 他们的作用我会在之后对应的模块里讲到
:::

::: tip base属性
  Vue.options._base = Vue
  大家以后可以去这里取Vue函数, 不需要再引入一个包
:::

::: tip buildInComponent
  Vue内置了Keep-alive组件，我们在全局函数调用的时候会将该组件存入Vue.options.components下
:::

::: tip initAssertTypes
  之前通过初始化components、filters、directives到Vue.options下为一个对象, 又在Vue下定义了Vue[component、filter、directive] = function() {}
  
  我们可以知道内部具体实现方式:(拿最常用的component来说)
  1. 取内部Vue.options.components缓存
  2. 缓存没取到, <font-bold>利用Vue.extend重新定义组件选项为Vue子类, 并且生成组件name属性</font-bold>(这个是之前模块里的追加疑问, 希望大家别忘记:sparkles:)
  3. 推入到Vue.options.components下，key为第一个参数
  4. 返回Vue子类
:::

::: tip initMixin$1
  定义Vue.mixin函数, 内部其实比较简单，就是mergeOptions(options, mixin)
:::

::: tip initUse
  定义Vue.use函数
  1. 取Vue._installPlugins缓存, 若有则不会二次执行
  2. 没有则重新定义参数列表, 替换第一个参数为Vue, 然后传入plugin函数里
  3. { install: function() {} } 和 function() {} 都可以执行
:::

以上就是本期讲的全局api初始化，东西其实还是有点量的，大家可以多消化下~, 下一期我们来讲Vue的调用(初始化)