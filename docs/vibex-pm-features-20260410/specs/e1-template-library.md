# SPEC: E1-P001 - 需求模板库

**Epic**: E1-P001
**版本**: v1.0
**日期**: 2026-04-10
**负责人**: PM Agent

---

## 1. 概述

**目标**: 提供可选择的行业模板，帮助新用户快速理解如何描述需求，降低输入门槛，目标将需求描述完整率提升 50%。

**用户故事**:
> "作为一个新用户，我不知道如何描述我的业务需求。有了行业模板，我可以先参考，再填写，5分钟内完成第一个项目的输入。"

---

## 2. 模板数据结构（JSON Schema）

**文件位置**: `src/data/templates/index.ts`

```typescript
export interface Template {
  id: string;                    // 唯一标识，如 "ecommerce-v1"
  industry: string;              // 行业名称，如 "电商"
  industryEn: string;            // 英文名，如 "E-commerce"
  icon: string;                  // Emoji 或 SVG 组件名
  description: string;           // 行业简述（1-2 句话）
  entities: Entity[];            // 核心实体列表
  boundedContexts: BoundedContext[]; // 限界上下文
  sampleRequirement: string;     // 示例需求文本（填充到输入框）
  tags: string[];                // 标签，如 ["零售", "交易"]
  createdAt: string;
}

export interface Entity {
  name: string;         // 实体名，如 "用户"
  description: string;  // 实体描述
  attributes: string[]; // 关键属性
}

export interface BoundedContext {
  name: string;      // 限界上下文名
  description: string;
  coreEntities: string[]; // 包含的核心实体
}
```

### 初始模板（3个）

#### T1: 电商（E-commerce）
```json
{
  "id": "ecommerce-v1",
  "industry": "电商",
  "industryEn": "E-commerce",
  "icon": "🛒",
  "description": "B2C 在线购物平台，支持商品浏览、购物车、订单管理、支付结算。",
  "entities": [
    { "name": "用户", "description": "平台消费者", "attributes": ["用户ID", "昵称", "手机号", "地址"] },
    { "name": "商品", "description": "在售商品", "attributes": ["商品ID", "名称", "价格", "库存", "分类"] },
    { "name": "订单", "description": "用户下单记录", "attributes": ["订单号", "用户ID", "金额", "状态", "时间"] },
    { "name": "购物车", "description": "用户暂存商品", "attributes": ["用户ID", "商品列表", "总价"] }
  ],
  "boundedContexts": [
    { "name": "商品域", "description": "商品管理和搜索", "coreEntities": ["商品"] },
    { "name": "交易域", "description": "下单和支付", "coreEntities": ["订单", "购物车"] },
    { "name": "用户域", "description": "用户账户和地址", "coreEntities": ["用户"] }
  ],
  "sampleRequirement": "我们是一个B2C电商平台，需要以下功能：\n1. 用户注册登录（手机号+验证码）\n2. 商品展示与搜索（分类筛选、价格排序）\n3. 购物车（增删改、批量操作）\n4. 下单支付（微信/支付宝）\n5. 订单管理（查看、取消、退款）",
  "tags": ["零售", "交易", "移动端"]
}
```

#### T2: 社交（Social）
```json
{
  "id": "social-v1",
  "industry": "社交",
  "industryEn": "Social",
  "icon": "💬",
  "description": "UGC 社交平台，支持用户发布内容、互动关注、内容推荐。",
  "entities": [
    { "name": "用户", "description": "平台用户", "attributes": ["用户ID", "昵称", "头像", "简介"] },
    { "name": "内容", "description": "用户发布的内容", "attributes": ["内容ID", "作者ID", "正文", "媒体", "点赞数"] },
    { "name": "评论", "description": "对内容的回复", "attributes": ["评论ID", "内容ID", "作者ID", "正文", "时间"] },
    { "name": "关注", "description": "用户关注关系", "attributes": ["关注者ID", "被关注者ID", "时间"] }
  ],
  "boundedContexts": [
    { "name": "内容域", "description": "内容发布和管理", "coreEntities": ["内容"] },
    { "name": "互动域", "description": "评论和点赞", "coreEntities": ["评论"] },
    { "name": "关系域", "description": "关注和粉丝", "coreEntities": ["用户", "关注"] }
  ],
  "sampleRequirement": "我们是一个UGC社交平台，需要：\n1. 用户注册登录（手机号或第三方登录）\n2. 发布图文/视频内容\n3. 评论、点赞、转发互动\n4. 关注/粉丝系统\n5. 内容推荐（基于兴趣标签）",
  "tags": ["内容", "社区", "推荐"]
}
```

#### T3: SaaS（Enterprise）
```json
{
  "id": "saas-v1",
  "industry": "SaaS",
  "industryEn": "SaaS",
  "icon": "☁️",
  "description": "B2B 企业级 SaaS 平台，支持多租户、权限管理、模块化功能。",
  "entities": [
    { "name": "租户", "description": "企业组织", "attributes": ["租户ID", "企业名", "套餐", "状态"] },
    { "name": "用户", "description": "企业员工", "attributes": ["用户ID", "租户ID", "姓名", "邮箱", "角色"] },
    { "name": "角色", "description": "权限角色", "attributes": ["角色ID", "名称", "权限列表"] },
    { "name": "模块", "description": "功能模块", "attributes": ["模块ID", "名称", "路由", "是否启用"] }
  ],
  "boundedContexts": [
    { "name": "租户域", "description": "多租户管理", "coreEntities": ["租户"] },
    { "name": "权限域", "description": "RBAC 权限管理", "coreEntities": ["用户", "角色"] },
    { "name": "业务域", "description": "业务功能模块", "coreEntities": ["模块"] }
  ],
  "sampleRequirement": "我们是一家B2B SaaS公司，需要：\n1. 多租户隔离（每个企业独立数据）\n2. RBAC权限管理（管理员/普通用户/审计员）\n3. 模块化功能（仪表盘、报表、审批流）\n4. SSO 单点登录（支持 LDAP/OAuth）\n5. 操作审计日志",
  "tags": ["企业", "多租户", "权限"]
}
```

---

## 3. 页面规格 `/templates`

### 3.1 页面布局

```
┌─────────────────────────────────────────────────────────┐
│  Header: VibeX  Logo           [返回首页]  [开始分析]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  标题：选择你的行业模板                                   │
│  副标题：选择一个与你业务最相似的模板，快速开始            │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│  │  🛒     │  │  💬     │  │  ☁️     │                 │
│  │  电商   │  │  社交   │  │  SaaS   │                 │
│  │  零售   │  │  内容   │  │  企业   │                 │
│  │         │  │         │  │         │                 │
│  │[预览]   │  │[预览]   │  │[预览]   │                 │
│  │[选择]   │  │[选择]   │  │[选择]   │                 │
│  └─────────┘  └─────────┘  └─────────┘                 │
│                                                         │
│  ─────── 或 ───────                                      │
│  [从空白开始]                                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 模板卡片（TemplateCard）

**组件**: `src/components/templates/TemplateCard.tsx`

| 状态 | 样式 |
|------|------|
| Default | 白色背景，1px 边框 `#E5E7EB`，阴影 `sm` |
| Hover | 边框变为 `#6366F1`（indigo-500），阴影 `md` |
| Selected | 背景 `#EEF2FF`（indigo-50），边框 2px `#6366F1`，左侧 indigo 竖条 |
| Loading | 卡片内 Skeleton 骨架 |

**卡片内容**:
- 图标: 48x48px Emoji 或 SVG
- 行业名: 18px, font-weight 600
- 描述: 14px, `#6B7280`, 最多2行，溢出省略
- 标签: 小号 tag pill
- 按钮: [预览] 幽灵按钮 + [选择] 实心按钮

### 3.3 预览模态框

点击 [预览] 打开全屏预览，展示:
- 实体列表（名称 + 关键属性）
- 限界上下文（名称 + 包含实体）
- 示例需求文本（可复制）

---

## 4. 交互规格

### 4.1 模板选择流程

```
用户进入 /templates
    ↓
浏览模板卡片（默认状态）
    ↓
点击 [选择] 或 [预览]
    ↓
【选择路径】
    状态 → Selected
    自动跳转 / → 填充需求输入框
    显示 Toast: "模板已应用，开始描述你的需求吧"
    
【预览路径】
    打开 PreviewModal
    查看实体、限界上下文、示例需求
    点击 [使用此模板] → 同「选择路径」
    点击 [返回] → 关闭模态框
```

### 4.2 模板填充逻辑

**Hook**: `src/hooks/useTemplateFill.ts`

```typescript
function useTemplateFill() {
  // 将模板 sampleRequirement 填充到首页需求输入框
  // 实现方式：将文本写入 localStorage（key: 'pending_requirement'）
  // 首页加载时检测该 key，自动填充并清除
}
```

**数据传递**:
1. 模板 `id` 和 `sampleRequirement` 存入 `localStorage.setItem('pending_template', JSON.stringify({id, requirement}))`
2. 首页 `useEffect` 检测该字段，自动填充到 textarea
3. 填充后清除 `pending_template`

### 4.3 AI 分析触发

选择模板后，在首页点击「开始分析」:
- 发送请求时在 payload 中附加 `templateId` 字段
- 便于后端统计模板使用率

---

## 5. 验收标准

| ID | 测试场景 | 断言 |
|----|----------|------|
| UT-01 | 访问 /templates | 模板数量 ≥ 3 |
| UT-02 | 模板卡片 hover | 边框颜色变为 indigo-500 |
| UT-03 | 点击 [预览] | 预览模态框打开，显示模板详情 |
| UT-04 | 点击模态框 [使用此模板] | 页面跳转 /，输入框已填充 |
| UT-05 | 选择模板后点击开始分析 | 请求 payload 包含 templateId |
| UT-06 | 刷新首页后（无 pending_template） | 输入框为空 |
| UT-07 | Lighthouse Performance | 首屏加载时间增加 ≤ 200ms |

---

## 6. 非功能需求

- **性能**: 模板数据 < 50KB，按需懒加载，不影响首页 FCP
- **可扩展性**: 后续可通过 API 动态加载模板，当前用静态文件过渡
- **无障碍**: 模板卡片支持键盘导航，模态框可 ESC 关闭
- **国际化**: 模板数据支持 i18n key，后续可扩展多语言

---

## 7. 依赖

| 依赖项 | 类型 | 说明 |
|--------|------|------|
| react-router-dom | peerDep | 路由跳转 |
| Tailwind CSS | peerDep | 样式 |
| lucide-react | peerDep | 图标库（可选） |
| 现有 HomePage textarea ref | 接口 | 用于模板填充 |

---

## 8. 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/data/templates/index.ts` | 新增 | 模板数据结构 + 初始3个模板 |
| `src/components/templates/TemplateCard.tsx` | 新增 | 模板卡片组件 |
| `src/components/templates/TemplatePreviewModal.tsx` | 新增 | 预览模态框 |
| `src/pages/templates.tsx` | 新增 | /templates 页面 |
| `src/hooks/useTemplateFill.ts` | 新增 | 模板填充逻辑 |
| `src/components/templates/index.ts` | 新增 | 组件导出 barrel |
| `src/App.tsx` | 修改 | 添加 /templates 路由 |
| `src/components/Navbar.tsx` | 修改 | 添加「模板」入口链接 |
| `src/pages/index.tsx` | 修改 | 读取 pending_template 填充输入框 |
