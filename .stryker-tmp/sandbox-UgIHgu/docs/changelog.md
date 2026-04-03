graph LR
    subgraph "更新日志 /changelog 布局"
        Nav["顶部导航栏"]
        Header["页面标题"]
        List["版本列表"]
    end
    subgraph "版本条目 Entry"
        VHeader["版本号 + 日期"]
        VType["类型标签<br/>新增 | 优化 | 修复"]
        Changes["变更列表"]
    end
    Nav --> Header --> List --> VHeader
    VHeader --> VType --> Changes
