graph LR
    subgraph "项目原型页 /project/:id 布局"
        Header["顶部工具栏<br/>←返回 + 项目名 + 导出 + 分享"]
        Left["左侧菜单树 200px"]
        Center["中间预览区 flex-grow"]
        Right["右侧抽屉 320px"]
        FAB["右下AI悬浮"]
    end
    subgraph "左侧菜单树 MenuTree"
        Search["搜索框"]
        Tree["页面树节点"]
        Add["添加页面 +"]
    end
    subgraph "中间预览区 Preview"
        Canvas["原型画布"]
        Toolbar["画布工具"]
        Footer["导出 | 分享"]
    end
    subgraph "右侧抽屉 Drawer"
        CHeader["组件标题 + 关闭"]
        CTabs["属性 | 样式 | 代码"]
        CForm["表单"]
    end
    subgraph "AI助手 AIAssistant"
        AHeader["标题 + 最小化"]
        AMessages["消息"]
        AInput["输入 + 发送"]
    end
    Header --> Left --> Search --> Tree --> Add
    Header --> Center --> Canvas --> Toolbar --> Footer
    Canvas -.->|"点击"| Right
    Center -.->|"点击"| FAB --> AHeader
