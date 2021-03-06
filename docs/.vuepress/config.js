module.exports = {
  title: 'Vue源码内幕解析',
  description: 'Vue源码内幕解析',
  base: '/vue-source/',
  themeConfig: {
    displayAllHeaders: true, // 默认值：false
    sidebarDepth: 2,
    locales: {
      // 键名是该语言所属的子路径
      // 作为特例，默认语言可以使用 '/' 作为其路径。
      '/': {
        selectText: 'Languages',
        lang: 'en-US', // 将会被设置为 <html> 的 lang 属性
        label: 'English',
        ariaLabel: 'Languages',
        editLinkText: 'Edit this page on GitHub',
        serviceWorker: {
          updatePopup: {
            message: "New content is available.",
            buttonText: "Refresh"
          }
        },
        algolia: {},
        nav: [
          { text: 'Vue2.x源码解析', link: '/' },
          { text: 'GitHub', link: 'https://github.com/Gloomysunday28/vue-source' },
        ],
        sidebar: [
          {
            title: '介绍',   // 必要的
            collapsable: false, // 可选的, 默认值是 true,
            sidebarDepth: 1,    // 可选的, 默认值是 1
            children: [
              '/'
            ]
          },
          {
            title: 'Vue全局API',
            collapsable: false,
            sidebarDepth: 1,    // 可选的, 默认值是 1
            children: [
              '/initGlobalAPI/',
              '/initGlobalAPI/assertTypes',
              '/initGlobalAPI/builtInComponents',
              '/initGlobalAPI/initUse',
              '/initGlobalAPI/initMixin',
              '/initGlobalAPI/toSumUp',
            ]
          },
          {
            title: 'Vue函数',
            collapsable: false, // 可选的, 默认值是 true,
            sidebarDepth: 1,    // 可选的, 默认值是 1
            children: [
              '/vue/',
            ]
          },
          {
            title: 'Vue初始化',
            collapsable: false, // 可选的, 默认值是 true,
            sidebarDepth: 1,    // 可选的, 默认值是 1
            children: [
              '/init/',
              '/init/mergeOptions'
            ]
          },
          {
            title: '深入组件',
            collapsable: false, // 可选的, 默认值是 true,
            sidebarDepth: 1,    // 可选的, 默认值是 1
            children: [
              '/component/',
              '/component/definition',
              '/component/patch',
              '/component/init',
              '/component/lifecycle',
              '/component/async',
              '/component/functional',
            ]
          },
          {
            title: '深入响应式',
            collapsable: false, // 可选的, 默认值是 true,
            sidebarDepth: 1,    // 可选的, 默认值是 1
            children: [
              '/responsive/',
              '/responsive/initData',
              '/responsive/nextTick',
              '/responsive/computed',
              '/responsive/watch',
              '/responsive/diff',
              '/responsive/props',
            ]
          }
        ],
      },
    }
  }
}