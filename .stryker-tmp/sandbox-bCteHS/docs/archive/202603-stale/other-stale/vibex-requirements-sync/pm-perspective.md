# PM 视角：Vibex 需求对齐分析

**日期**: 2026-03-20  
**Agent**: PM  
**会议**: Vibex 项目需求对齐

---

## 一、总需求流程回顾

```
首页输入需求 
  → 对话澄清 
  → 生成核心上下文业务流程 
  → 询问通用支撑域 
  → 用户勾选流程节点 
  → 生成页面/组件节点 
  → 用户再次勾选 
  → 创建项目 
  → Dashboard 
  → 原型预览 + AI助手
```

---

## 二、已完成 PRD 对齐分析

### ✅ 已完成的功能（对齐）

| 功能 | 对应需求阶段 | PRD | 状态 |
|------|-------------|-----|------|
| 首页步骤流程 (Step 1/2/3) | 首页输入需求 + 对话澄清 | vibex-step2-issues | ✅ PRD完成 |
| 设计页面步骤指示器 | 步骤指示器 + 导航 | vibex-step2-issues Epic 1 | ✅ PRD完成 |
| 思考过程面板 | 流式思考输出 | vibex-step2-issues Epic 2 | ✅ PRD完成 |
| API 持久化 | 页面加载恢复 | vibex-step2-issues Epic 3 | ✅ PRD完成 |
| 步骤回退与快照 | 回退导航 | vibex-step2-issues Epic 4 | ✅ PRD完成 |
| UI组件点击修复 | 回归修复 | vibex-step2-regression Epic 1 | ✅ PRD完成 |
| 流程图显示修复 | 回归修复 | vibex-step2-regression Epic 2 | ✅ PRD完成 |

### ⚠️ 部分完成或偏离

| 功能 | 对应需求阶段 | 现状 | 偏差说明 |
|------|-------------|------|----------|
| 首页→Design 数据同步 | 生成核心上下文后跳转到 Design | **未完成** | confirmationStore → designStore 无同步机制，回归问题 |
| Mermaid 流程图显示 | 生成核心上下文业务流程 | **回归Bug** | 第一步流程图不显示，需修复 |
| Dashboard | 创建项目后展示 | **缺失** | 无专门 PRD |
| 原型预览 + AI助手 | 最后阶段 | **缺失** | 无专门 PRD |
| 对话澄清交互 | 首页输入需求 | vibex-interactive-confirmation | ✅ PRD完成 |

### ❌ 完全缺失

| 功能 | 对应需求阶段 |
|------|-------------|
| 询问通用支撑域 | "询问通用支撑域" 步骤无专门功能 |
| 用户勾选流程节点（第二阶段） | 勾选确认 + 再次勾选确认 |
| 生成页面/组件节点 | 节点生成 UI |
| 创建项目 | 项目创建流程 |
| Dashboard | 项目仪表板 |
| 原型预览 | 原型展示 |
| AI助手 | AI 辅助功能 |

---

## 三、confirm/design/requirement 页面对齐

### 3.1 Confirmation 相关 ✅

| 功能 | 状态 | 对齐 |
|------|------|------|
| 首页步骤流 | ✅ 完成 | Step 1 (Requirement) / Step 2 (Context) / Step 3 (Review) |
| 对话澄清 | ✅ PRD完成 | vibex-interactive-confirmation |
| 确认持久化 | ✅ PRD完成 | vibex-confirmation-persist |
| 入口统一 | ✅ PRD完成 | vibex-confirm-entry-unify |

### 3.2 Design 相关 ⚠️

| 功能 | 状态 | 对齐 |
|------|------|------|
| 设计页面步骤指示器 | ✅ PRD完成 | vibex-step2-issues Epic 1 |
| 思考面板 | ✅ PRD完成 | vibex-step2-issues Epic 2 |
| API 持久化 | ✅ PRD完成 | vibex-step2-issues Epic 3 |
| 步骤回退 | ✅ PRD完成 | vibex-step2-issues Epic 4 |
| 数据同步 | ❌ 回归Bug | 需修复 |
| 原型预览 | ❌ 缺失 | 未规划 |

### 3.3 Requirement 相关 ✅

| 功能 | 状态 | 对齐 |
|------|------|------|
| Step 1 输入 | ✅ 完成 | vibex-step2-issues |
| 对话澄清 | ✅ PRD完成 | vibex-interactive-confirmation |
| 思考面板 | ✅ PRD完成 | vibex-step2-issues Epic 2 |

---

## 四、关键偏差与风险

### 4.1 数据流断裂

**问题**: 首页 → Design 页面数据不同步

**根因**: confirmationStore 与 designStore 分离，无同步机制

**影响**: 
- 用户在首页完成流程后跳转到 Design 页面是空的
- 无法继续后续设计流程

**建议**: 
1. 优先修复 F2.3 (首页→Design 数据同步)
2. 设计架构方案时考虑统一数据层

### 4.2 下游功能缺失

**缺失阶段**:
```
创建项目 → Dashboard → 原型预览 + AI助手
```

**影响**: 
- 用户无法创建项目和查看项目
- 无法预览生成的原型
- AI助手功能未规划

**建议**: 
1. 补充 "创建项目" PRD
2. 补充 "Dashboard" PRD
3. 补充 "原型预览 + AI助手" PRD

### 4.3 通用支撑域询问缺失

**问题**: "询问通用支撑域" 阶段无专门功能

**现状**: 
- Step 2 只生成了核心上下文
- 没有专门询问 "支撑域" 的交互

**建议**: 在 Step 2 增加支撑域询问节点

---

## 五、建议优先级

| 优先级 | 任务 | 原因 |
|--------|------|------|
| P0 | 修复首页→Design 数据同步 | 阻断性问题 |
| P0 | 修复流程图不显示 | 核心功能回归 |
| P0 | 修复 UI 组件点击 | 核心功能回归 |
| P1 | 补充 "创建项目" PRD | 流程闭环 |
| P1 | 补充 "Dashboard" PRD | 用户可见成果 |
| P2 | 补充 "原型预览 + AI助手" PRD | 完整流程 |
| P2 | 补充支撑域询问功能 | 需求完整性 |

---

## 六、结论

**已完成**: 核心步骤流程 + 设计页面框架（PRD）

**需修复**: 3 个回归 Bug（P0）

**需补充**: 4 个下游功能 PRD（P1-P2）

**整体进度**: ~60%（核心流程完成，下游缺失）

---

*PM 视角分析 - 待与 Analyst 对齐*
