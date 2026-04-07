# VibeX 项目原型设计文档

> **版本**: v1.0  
> **日期**: 2026-03-20  
> **状态**: 最终版  
> **负责人**: Coord  
> **用途**: VibeX 项目自己的原型页设计指导

---

## 一、项目整体 Mermaid 流程图

```mermaid
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
        MyTemplate["我的模板"]
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
```

---

## 二、首页 `/` 原型

```mermaid
graph LR
    subgraph "首页布局"
        Nav["顶部导航<br/>Logo + 登录按钮"]
        Input["左侧输入区 40%"]
        Output["右侧预览区 60%"]
        Bottom["底部创建按钮"]
    end

    subgraph "左侧输入区"
        TextBox["需求输入框<br/>多行文本"]
        Button["开始分析按钮"]
        Thinking["思考过程面板<br/>SSE流式显示"]
        Steps["步骤指示器<br/>1 → 2 → 3"]
    end

    subgraph "右侧预览区"
        Diagram["Mermaid流程图<br/>限界上下文/领域模型"]
        Tree["节点树选择器<br/>可勾选"]
    end

    Input --> TextBox --> Button --> Thinking --> Steps
    Output --> Diagram --> Tree
    Steps --> Bottom
```

**布局比例**: 左侧 40% | 右侧 60%

---

## 三、项目列表页 `/projects` 原型

```mermaid
graph LR
    subgraph "项目列表页布局"
        Nav2["顶部导航"]
        Sidebar["侧边栏 200px"]
        Content["主内容区"]
    end

    subgraph "侧边栏"
        All["全部项目"]
        Draft["草稿"]
        Active["进行中"]
        Done["已完成"]
        Settings["设置"]
        Model["模型"]
        User["用户"]
    end

    subgraph "主内容区"
        Cards["项目卡片网格<br/>4列布局"]
        Card1["项目卡片"]
        Card2["新建+"]
    end

    Sidebar --> All --> Draft --> Active --> Done
    Sidebar --> Settings --> Model --> User
    Content --> Cards --> Card1 --> Card2
```

---

## 四、项目原型页 `/project/:id` 原型

```mermaid
graph TB
    subgraph "项目原型页布局"
        Header["顶部工具栏<br/>←返回 项目名 导出 分享 ···"]
        Left["左侧菜单树<br/>200px"]
        Center["中间预览区<br/>flex-grow"]
        Right["右侧抽屉<br/>320px"]
        FAB["右下AI悬浮<br/>🤖"]
    end

    subgraph "左侧菜单树"
        Page1["首页"]
        Page2["登录"]
        Page3["商品列表"]
        Page4["商品详情"]
        Page5["购物车"]
        Page6["订单"]
        Page7["我的"]
    end

    subgraph "中间预览区"
        Preview["原型预览区"]
        Export["导出按钮"]
        Share["分享按钮"]
    end

    subgraph "右侧抽屉(点击组件)"
        CName["组件名称"]
        CType["组件类型"]
        CProp["组件属性"]
        CDesc["组件说明"]
        CCode["组件代码"]
    end

    subgraph "AI助手面板"
        AIModal["AI助手面板"]
        Selected["选中组件信息"]
        Input["输入修改指令"]
        History["修改历史"]
    end

    Header --> Left --> Page1 --> Page2 --> Page3 --> Page4 --> Page5 --> Page6 --> Page7
    Header --> Center --> Preview --> Export & Share
    Preview -.->|"点击组件"| Right --> CName --> CType --> CProp --> CDesc --> CCode
    Center -.->|"点击悬浮"| FAB --> AIModal --> Selected --> Input --> History
```

**布局比例**: 左侧 200px | 中间 flex-grow | 右侧 320px

---

## 五、模板市场 `/templates` 原型

```mermaid
graph LR
    subgraph "模板市场布局"
        Nav3["顶部导航"]
        Tabs["标签切换<br/>全部模板 | 我的模板 | 创建模板"]
        Grid["模板卡片网格"]
    end

    subgraph "模板卡片"
        T1["电商模板"]
        T2["博客模板"]
        T3["SaaS模板"]
        T4["社交模板"]
    end

    subgraph "模板详情弹窗"
        PreviewT["模板预览"]
        Use["使用此模板"]
        ShareT["分享"]
    end

    Nav3 --> Tabs --> Grid --> T1 --> PreviewT
    T1 --> Use
    T1 --> ShareT
```

---

## 六、更新日志 `/changelog` 原型

```mermaid
graph LR
    subgraph "更新日志布局"
        Nav4["顶部导航"]
        Header4["更新日志标题"]
        List["版本列表"]
    end

    subgraph "版本条目"
        V1["v1.0.0 - 2024-01-20"]
        F1["• 新增功能"]
        F2["• 功能优化"]
        F3["• Bug修复"]
    end

    Nav4 --> Header4 --> List --> V1 --> F1 --> F2 --> F3
```

---

## 七、页面结构树

```
VibeX
├── /                     首页
│   ├── 顶部导航 (Logo + 登录)
│   ├── 左侧输入区 (40%)
│   │   ├── 需求输入框
│   │   ├── 开始分析按钮
│   │   ├── 思考过程面板
│   │   └── 步骤指示器 (1→2→3)
│   ├── 右侧预览区 (60%)
│   │   ├── Mermaid流程图
│   │   └── 节点树选择器
│   ├── 底部创建按钮
│   └── 登录注册抽屉
│
├── /projects             项目列表页
│   ├── 顶部导航
│   ├── 侧边栏 (200px)
│   │   ├── 全部项目
│   │   ├── 草稿
│   │   ├── 进行中
│   │   ├── 已完成
│   │   ├── 设置
│   │   ├── 模型
│   │   └── 用户
│   └── 主内容区
│       └── 项目卡片网格
│
├── /project/:id         项目原型页
│   ├── 顶部工具栏
│   ├── 左侧菜单树 (200px)
│   │   └── 页面节点列表
│   ├── 中间预览区 (flex)
│   │   ├── 原型预览
│   │   └── 导出/分享按钮
│   ├── 右侧抽屉 (320px)
│   │   └── 组件详情
│   └── 右下AI助手悬浮
│
├── /templates           模板市场
│   ├── 顶部导航
│   ├── 标签切换
│   └── 模板卡片网格
│
└── /changelog          更新日志
    ├── 顶部导航
    └── 版本列表
```

---

## 八、用户交互流程图

```mermaid
sequenceDiagram
    participant U as 用户
    participant H as 首页/
    participant L as 登录抽屉
    participant P as 项目列表/projects
    participant R as 原型页/project/:id
    participant T as 模板/templates

    U->>H: 访问首页
    H->>L: 未登录，显示登录按钮
    U->>L: 点击登录
    L->>U: 弹出登录抽屉
    U->>L: 输入账号密码
    L->>H: 登录成功
    U->>H: 输入需求
    U->>H: 点击开始分析
    H->>U: SSE流式显示思考过程
    U->>H: 勾选流程节点
    U->>H: 点击创建项目
    H->>P: 跳转项目列表
    U->>P: 选择项目
    P->>R: 打开原型页
    U->>R: 点击左侧菜单
    R->>U: 预览页面原型
    U->>R: 点击组件
    R->>U: 显示组件详情
    U->>R: 点击AI助手
    R->>U: 输入修改指令
    U->>T: 访问模板市场
    T->>U: 选择模板
    T->>P: 创建项目
```

---

## 九、组件清单

| 页面 | 组件 | 类型 | 说明 |
|------|------|------|------|
| 首页 | Logo | 品牌 | VibeX Logo |
| 首页 | LoginButton | 按钮 | 触发登录抽屉 |
| 首页 | RequirementInput | 输入框 | 多行文本输入 |
| 首页 | AnalyzeButton | 按钮 | 触发AI分析 |
| 首页 | ThinkingPanel | 面板 | SSE流式显示 |
| 首页 | StepIndicator | 指示器 | 1→2→3步骤 |
| 首页 | MermaidPreview | 图表 | 流程图渲染 |
| 首页 | NodeTreeSelector | 树形 | 可勾选节点 |
| 首页 | CreateButton | 按钮 | 创建项目 |
| 首页 | LoginDrawer | 抽屉 | 登录注册表单 |
| 项目列表 | Sidebar | 布局 | 侧边栏导航 |
| 项目列表 | ProjectCard | 卡片 | 项目缩略信息 |
| 项目列表 | FilterTabs | 标签 | 全部/草稿/进行中/已完成 |
| 原型页 | MenuTree | 树形 | 页面菜单 |
| 原型页 | PrototypePreview | 预览 | 原型静态展示 |
| 原型页 | ComponentDrawer | 抽屉 | 组件详情 |
| 原型页 | ExportModal | 弹窗 | 导出选择 |
| 原型页 | ShareModal | 弹窗 | 二维码分享 |
| 原型页 | AIAssistant | 悬浮 | AI对话助手 |
| 模板 | TemplateCard | 卡片 | 模板缩略 |
| 模板 | TemplatePreview | 弹窗 | 模板预览 |
| 日志 | VersionEntry | 条目 | 版本更新记录 |

---

## 十、技术实现要点

| 功能 | 技术方案 |
|------|----------|
| 页面路由 | Next.js App Router |
| 状态管理 | Zustand (confirmationStore, projectStore) |
| 流程图渲染 | Mermaid.js |
| AI对话 | SSE流式 + MiniMax API |
| 拖拽布局 | react-resizable-panels |
| 抽屉组件 | 自定义 Drawer 组件 |
| 二维码生成 | qrcode.react |

---

**文档版本**: v1.0 | **最后更新**: 2026-03-20
