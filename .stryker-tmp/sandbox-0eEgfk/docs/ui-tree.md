graph LR
    subgraph "首页 / 布局"
        Header["顶部Header<br/>单行收起<br/>点击下推登录/注册"]
        Preview["预览区 FullScreen<br/>全屏显示"]
    end

    subgraph "左侧滑出 LeftDrawer"
        LHandle["左侧把手"]
        Steps["步骤指示器<br/>可随时切换步骤<br/>Step 1 2 3 4"]
    end

    subgraph "右侧滑出 RightDrawer"
        RHandle["右侧把手"]
        AI["AI思考过程<br/>ThinkingPanel<br/>SSE流式"]
    end

    subgraph "底部 BottomBar (单行工具栏)"
        Input["对话输入框<br/>单行TextInput"]
        Actions["工具按钮<br/>💾保存 | 🔄重新生成 | 📁创建项目 | ⬆️展开"]
    end

    subgraph "底部展开抽屉 BottomDrawer"
        Expand["完整输入区<br/>澄清交互版"]
        FullInput["需求输入 TextArea"]
        Clarify["澄清对话<br/>AI追问"]
        FlowChart["业务流程图"]
        CompChart["业务组件图"]
    end

    subgraph "登录/注册抽屉 LoginDrawer"
        LoginTab["登录 Tab"]
        RegisterTab["注册 Tab"]
        Form["邮箱+密码表单"]
        OAuth["第三方登录"]
    end

    Preview -.->|"←拖拽推开"| LHandle --> Steps
    Preview -.->|"拖拽推开→"| RHandle --> AI
    Preview -.->|"点击展开"| Expand --> FullInput --> Clarify --> FlowChart --> CompChart
    Header -.->|"点击下推"| LoginTab --> RegisterTab --> Form --> OAuth

    Input -.->|"点击展开"| Actions
