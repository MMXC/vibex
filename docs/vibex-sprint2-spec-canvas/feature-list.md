# Feature List — vibex-sprint2-spec-canvas

> 基于 `analysis.md` 技术方案拆解，Epic = 问题域，Story = 可交付功能

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|---------|
| F1 | 三章节固定结构 | 固定 3 个章节：需求(requirement)/上下文(context)/流程(flow)，每个章节隔离卡片数据 | J1: 用户需要看到结构化文档分区 | 0.5h |
| F2 | 章节卡片 CRUD | 每个章节内支持添加/编辑/删除卡片，卡片类型与章节绑定（user-story/bounded-context/flow-step） | J2: 用户要在每个章节内编辑卡片 | 3h |
| F3 | 卡片 Schema 渲染 | 根据卡片类型渲染对应字段表单（UserStory 渲染 role/action/benefit；BC 渲染 name/description/responsibility；FlowStep 渲染 stepName/actor/preCondition） | J2: 卡片内容需要结构化编辑 | 2h |
| F4 | 章节内卡片 DAG | 在单章节内通过 React Flow 渲染卡片节点和边，支持拖拽定位、边的增删改 | J5: 用户需要看到章节内卡片关系 | 1.5h |
| F5 | 卡片持久化（D1） | 卡片增删改同步写入 D1 database（dds_cards / dds_chapters 表） | V1-AC4: 卡片数据需持久化 | 2h |
| F6 | 横向滚奏 UI | DDSScrollContainer 实现 scroll-snap 横向滚奏，鼠标拖动切换章节，滚动吸附 | J4: 用户要横向滑动切换章节 | 1h |
| F7 | URL 章节同步 | 当前章节通过 URL query 参数同步（`?chapter=requirement`），刷新保持当前章节 | J4: 刷新后保持上下文 | 0.5h |
| F8 | 工具栏章节指示 | DDSToolbar 显示当前章节名称，点击可快速跳转 | J1: 用户需知道当前在哪 | 0.5h |
| F9 | AI 草稿触发入口 | 工具栏"AI 草稿"按钮，点击打开 AIDraftDrawer | J3: 用户需要 AI 生成卡片 | 0.5h |
| F10 | AI 草稿生成流程 | AIDraftDrawer 输入提示词 → AI 返回卡片 JSON → 用户预览/编辑 → 确认写入当前章节 | J3: AI 生成卡片内容 | 2h |
| F11 | AI 对话历史 | AI 草稿抽屉内保存对话历史，支持上下文续写 | J3: 上下文连续生成 | 1h |
| F12 | AI 生成边预览 | AI 返回的卡片内容包含边信息，用户可选择是否创建边 | J3: AI 辅助生成关系 | 1h |
| F13 | 章节间 DAG 关系 | 支持跨章节创建边（requirement → context → flow），React Flow 正确渲染跨章节边 | J5: 用户要看到跨章节卡片关系 | 3h |
| F14 | 页面骨架屏加载态 | 页面加载时显示骨架屏（而非 loading spinner），3 个章节面板区域分别骨架 | V1-AC: 加载体验 | 1h |
| F15 | 空状态引导 | 每个章节空状态显示引导插图+文案（"添加你的第一个用户故事"/"建立限界上下文"/"描绘领域流程"） | V1-AC: 新用户上手引导 | 1h |
| F16 | 错误态覆盖 | 覆盖 4 类错误态：网络异常/权限不足/数据超长/接口超时，显示对应错误提示和重试入口 | V4-AC: 出错兜底 | 1h |
| F17 | 单元测试覆盖 | 覆盖 DDSCanvasStore / DDSScrollContainer / 卡片渲染核心逻辑 | V5-AC: 测试覆盖 | 1h |

**总工时: 22h（留 20% buffer）**
