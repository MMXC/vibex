graph LR
    subgraph "项目列表页 /projects 布局"
        Nav["顶部导航栏<br/>Logo + 导航 + 用户头像"]
        Sidebar["侧边栏 200px"]
        Content["主内容区 flex"]
    end
    subgraph "侧边栏 Sidebar"
        Filter["筛选标签<br/>全部 | 草稿 | 进行中 | 已完成"]
        Menu["菜单项<br/>设置 | 模型 | 用户"]
    end
    subgraph "主内容区 Main"
        Grid["项目卡片网格<br/>响应式4列布局"]
        Card["项目卡片"]
    end
    subgraph "项目卡片 Card"
        Thumbnail["缩略图"]
        Title["项目名称"]
        Date["创建日期"]
        Status["状态标签"]
        Actions["更多操作"]
    end
    Nav --> Sidebar --> Filter --> Menu
    Nav --> Content --> Grid --> Card
    Card --> Thumbnail --> Title --> Date --> Status --> Actions
