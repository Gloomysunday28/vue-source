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
          ['/', '介绍'],
          ['/vue/', 'Vue']
        ],
      },
    }
  }
}