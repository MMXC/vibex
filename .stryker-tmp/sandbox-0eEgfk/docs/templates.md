graph LR
    subgraph "模板市场 /templates 布局"
        Nav["顶部导航栏"]
        Tabs["标签切换<br/>全部 | 我的 | 创建+"]
        Content["卡片网格"]
    end
    subgraph "模板卡片 Card"
        Thumbnail["缩略图"]
        Name["名称"]
        Category["分类"]
        Actions["预览 | 使用"]
    end
    subgraph "详情弹窗 Modal"
        MHeader["标题 + 关闭"]
        MPreview["预览区"]
        MActions["使用 | 分享"]
    end
    Nav --> Tabs --> Content --> Card
    Card --> Thumbnail --> Name --> Category --> Actions
    Card -.->|"点击"| MHeader --> MPreview --> MActions
