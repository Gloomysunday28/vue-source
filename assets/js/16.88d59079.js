(window.webpackJsonp=window.webpackJsonp||[]).push([[16],{341:function(t,s,n){"use strict";n.r(s);var a=n(33),e=Object(a.a)({},(function(){var t=this,s=t.$createElement,n=t._self._c||s;return n("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[n("h1",{attrs:{id:"内部组件合并"}},[n("a",{staticClass:"header-anchor",attrs:{href:"#内部组件合并"}},[t._v("#")]),t._v(" 内部组件合并")]),t._v(" "),n("p",[t._v("我们都知道在vue组件里使用组件，需要先引入组件并且注册到components属性下，否则就会报错, 那么大家是否思考过"),n("font-bold",[t._v("\n为什么keep-alive, transition, transition-group这三个组件我们不需要注册却可以直接引用?\n")]),t._v("\n我们回顾initGlobalAPI函数，其中有一句代码如下:")],1),t._v(" "),n("div",{staticClass:"language-js extra-class"},[n("pre",{pre:!0,attrs:{class:"language-js"}},[n("code",[t._v("  "),n("span",{pre:!0,attrs:{class:"token function"}},[t._v("extend")]),n("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("Vue"),n("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("options"),n("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("components"),n("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" builtInComponents"),n("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),n("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])])]),n("p",[t._v("该篇文章就看下该操作的作用是什么")]),t._v(" "),n("h2",{attrs:{id:"builtincomponents"}},[n("a",{staticClass:"header-anchor",attrs:{href:"#builtincomponents"}},[t._v("#")]),t._v(" builtInComponents")]),t._v(" "),n("div",{staticClass:"language-js extra-class"},[n("pre",{pre:!0,attrs:{class:"language-js"}},[n("code",[t._v("  "),n("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("var")]),t._v(" builtInComponents "),n("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),n("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    KeepAlive"),n("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" KeepAlive\n  "),n("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),n("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])])]),n("p",[t._v("keep-alive组件应该都不陌生吧~, 该组件的作用是用来缓存内部组件, initGlobalAPI函数就是将keep-alive注册到Vue.options.component里")]),t._v(" "),n("h3",{attrs:{id:"总结"}},[n("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[t._v("#")]),t._v(" 总结")]),t._v(" "),n("p",[t._v("initGlobalAPI会将keep-alive内部组件注册到Vue.options.components下，那么正如一开始的疑问，"),n("font-bold",[t._v("为什么我们可以直接访问呢？")]),t._v("带着这个问题继续往下读")],1)])}),[],!1,null,null,null);s.default=e.exports}}]);