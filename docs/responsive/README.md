<wx/>

# 深入响应式导读
Vue是响应式框架, 数据驱动视图, 当我们更改了某个依赖数据后, 随之页面就会重新渲染成更改后的界面
```html
  <template>
    <div>{{count}}</div>
  </template>
```
举个例子来分析下响应式的步骤: 我们先看下直接使用js会怎么做?

```html
  <body>
    <div class="container">1</div>
  </body>
```
```js
  var count = 1
  const container = document.getElementByClassName('container')[0]
  container.onclick = function() {
    count += 1
  }
  function render() {
    container.innserHTML = count
  }
```
我们更改数据后会调用render函数用于重新渲染container的子节点, 响应式无非就是省略了render这一步骤

回到Vue, Vue数据依赖原理就是将每个依赖数据与render函数绑定在一起，只要依赖数据发生变化自动就会触发render函数，而实现这个绑定的功能关键的API就是<font-bold>Object.defineProperty</font-bold>, 这也是Vue无法兼容IE9以下的原因, 下一节我们将进入如何初始化响应式数据的操作