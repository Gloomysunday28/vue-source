module.exports = {
  title: 'Mr.Cai - Vue Source Instroduce',
  description: 'Vue Source Instroduce',
  themeConfig: {
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
          { text: 'GitHub', link: 'https://github.com/Gloomysunday28' },
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
            title: '初始化',
            collapsable: false, // 可选的, 默认值是 true,
            sidebarDepth: 1,    // 可选的, 默认值是 1
            children: [
              '/init/',
              '/init/mergeOptions'
            ]
          },
        ],
      },
    }
  }
}