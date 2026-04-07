graph TB
    subgraph "首页模块"
        Home["/ 首页<br/>需求输入 + AI分析"]
        Login["登录注册抽屉"]
        Clarify["Step 1: 需求澄清"]
        Flow["Step 2: 业务流程"]
        Component["Step 3: 页面组件"]
        Create["创建项目"]
    end

    subgraph "项目管理模块"
        Projects["/projects<br/>项目列表页"]
        Draft["草稿项目"]
        Active["进行中"]
        Done["已完成"]
    end

    subgraph "原型编辑模块"
        Prototype["/project/:id<br/>项目原型页"]
        Menu["左侧菜单树"]
        Preview["原型预览区"]
        Detail["组件详情抽屉"]
        AI["AI助手悬浮"]
    end

    subgraph "模板模块"
        Templates["/templates<br/>模板市场"]
        UseTemplate["使用模板"]
    end

    subgraph "工具模块"
        Changelog["/changelog<br/>更新日志"]
    end

    Home --> Login
    Home --> Clarify --> Flow --> Component --> Create
    Create --> Projects
    Projects --> Draft
    Projects --> Active
    Projects --> Done
    Active --> Prototype
    Done --> Prototype
    Prototype --> Menu
    Prototype --> Preview
    Prototype --> Detail
    Prototype --> AI
    Templates --> UseTemplate --> Projects
    Home --> Templates
    Home --> Changelog
