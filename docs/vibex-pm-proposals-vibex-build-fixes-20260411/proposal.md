# VibeX 构建修复提案

**提案编号**: vibex-build-fixes-20260411
**创建日期**: 2026-04-11
**提案角色**: PM（产品经理）
**项目**: VibeX

---

## 执行决策
- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定

---

## 背景

VibeX 项目前后端构建出现阻断性问题，影响团队日常开发和 CI/CD 流程。

---

## 问题1: 前端 Storybook 构建失败

### 问题描述
- **文件**: `vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx`
- **问题**: 该 Story 文件引用了不存在的组件 `CanvasHeader`
- **引用路径**: `import { CanvasHeader } from '../CanvasHeader'`
- **根因**: `CanvasPage` 等同级目录下无 `CanvasHeader.tsx` 文件，`CanvasHeader` 未在任何 index.ts 中导出

### 当前状态确认
```bash
# CanvasHeader.tsx 不存在于组件目录
$ ls /vibex-fronted/src/components/canvas/
# ... 无 CanvasHeader.tsx

# index.ts 导出清单中也无 CanvasHeader
$ cat /vibex-fronted/src/components/canvas/index.ts
# ... 无 CanvasHeader 导出
```

### 业务影响
| 影响维度 | 严重程度 | 说明 |
|----------|----------|------|
| 开发阻塞 | 🔴 高 | 所有涉及 Canvas 组件 Story 预览的开发者被阻塞 |
| Storybook 发布 | 🔴 高 | `npm run storybook` / CI Storybook 构建失败，无法生成组件文档 |
| 代码质量信号 | 🟡 中 | 沉默的错误积累会降低团队对构建系统的信任 |
| 潜在风险 | 🟡 中 | 若该 Story 曾存在而后被误删，需回溯删除操作是否同步清理干净 |

---

## 问题2: 后端构建 Unicode 引号问题

### 问题描述
- **文件**:
  - `vibex-backend/src/app/api/agents/route.ts`
  - `vibex-backend/src/app/api/pages/route.ts`
  - `vibex-backend/src/app/api/prototype-snapshots/route.ts`
- **问题**: 文件中使用了 Unicode 弯引号（`'` `'` `""`）而非标准 ASCII 直引号
- **影响**: TypeScript / ESLint / Node.js 构建工具链可能拒绝编译，或在不同系统 locale 下表现不一致

### 当前状态
经检查，上述文件当前为 ASCII 文本，暂未发现 Unicode 弯引字字符残留。可能是已被部分修复，或该问题在其他场景（如 CI Linux 环境 vs 本地 macOS）下触发。

### 业务影响
| 影响维度 | 严重程度 | 说明 |
|----------|----------|------|
| CI/CD 阻塞 | 🔴 高 | Linux CI 环境对 Unicode 敏感，可能导致 CI 构建失败 |
| 跨平台兼容 | 🟡 中 | macOS 本地构建可能通过但 Linux CI 失败，造成不一致 |
| 代码审查盲区 | 🟡 中 | 编辑器配置差异可能导致 Unicode 引号悄然引入，难以发现 |

---

## 业务影响评估

| 维度 | 评估 |
|------|------|
| **团队生产力** | 阻塞所有需要 Storybook 预览的 UI 开发工作；CI 失败会中断 Code Review 流程 |
| **发布风险** | 若 CI 因 Unicode 问题失败，生产部署管道被阻断 |
| **技术债务** | 孤立的无引用 Story 文件应清理，避免未来再次困扰新成员 |
| **用户体验** | 间接影响：开发体验差 → 迭代速度下降 → 产品交付延迟 |

---

## 优先级判断

| 问题 | 优先级 | 理由 |
|------|--------|------|
| 问题1（前端 Storybook） | **P1 — 紧急** | 已有明确错误信息，阻塞开发者日常 |
| 问题2（后端 Unicode） | **P1 — 紧急** | 跨平台 CI 隐患，可能随时爆发 |

**综合优先级: P1 紧急处理**

---

## 发布计划建议

### 方案 A：立即修复（推荐）

**执行者**: Dev 角色
**预计工期**: 30 分钟内

**问题1 修复步骤**:
1. 确认 `CanvasHeader` 组件是否应该存在：
   - **若存在但被误删**：从 git history 恢复 `CanvasHeader.tsx`
   - **若不存在但曾有计划**：补全组件实现
   - **若确定不需要**：直接删除 `CanvasHeader.stories.tsx`
2. 修复后运行 `npm run storybook` 验证
3. 确保 CI Storybook 构建通过

**问题2 修复步骤**:
1. 在三个 route.ts 文件中执行全文 Unicode 引号替换：
   - `'` (U+2018/U+2019) → `'` (ASCII)
   - `'` (U+201C/U+201D) → `"` (ASCII)
2. 建议通过 ESLint 规则 `quotes` 和 `no-irregular-whitespace` 强制检查
3. 配置 pre-commit hook 防止再次引入

**发布**: 无需发布，独立修复，CI green 即完成。

---

### 方案 B：彻底排查 + 预防

在方案 A 基础上，增加：

1. **ESLint 配置加固**:
   ```json
   {
     "rules": {
       "quotes": ["error", "single", { "avoidEscape": true }],
       "no-irregular-whitespace": "error"
     }
   }
   ```
2. **Prettier 配置**:
   ```json
   {
     "singleQuote": true,
     "arrowParens": "always"
   }
   ```
3. **CI 增加 lint 检查步骤**，失败则阻断构建
4. **全库扫描 Unicode 引号**:
   ```bash
   grep -r $'\u2018\|\u2019\|\u201c\|\u201d' vibex-backend/src/
   grep -r $'\u2018\|\u2019\|\u201c\|\u201d' vibex-fronted/src/
   ```

---

## 团队协作改进建议

### 短期（本周）

1. **建立 CI 强制检查**: 在 PR pipeline 中加入 `npm run lint` 和 `npm run type-check`
2. **Storybook 纳入 CI**: 每次 PR 执行 `npm run build-storybook`，失败阻断合并
3. **代码审查清单增加**: 检查是否引入了新的无引用文件

### 中期（本月）

1. **组件命名规范**: Story 文件与对应组件同名，新增组件必须同时创建 Story
2. **Pre-commit hook**: 配置 Husky + lint-staged，自动格式化+检查
3. **gitignore 保护**: 禁止将 `node_modules` 和 `.next` 意外提交

### 长期（季度）

1. **Monorepo 工具链统一**: 统一前后端 lint/format 配置，避免风格不一致
2. **构建健康仪表盘**: 监控 CI 构建成功率、Storybook 发布状态
3. **团队编码规范文档**: 将 ESLint/Prettier 配置规则显式化，新成员 onboarding 必读

---

## 风险矩阵

| 风险 | 可能性 | 影响 | 缓解方案 |
|------|--------|------|----------|
| `CanvasHeader` 有历史计划但无实现文档 | 低 | 中 | 搜索 git history 和 Slack 记录确认意图 |
| Unicode 引号在其他未检查文件中存在 | 中 | 高 | 扩大扫描范围至全库 |
| 修复后引入新问题 | 低 | 中 | CI 通过后再合并，Reviewer 仔细检查 |
| Dev 修复期间其他 PR 被阻塞 | 低 | 低 | 快速修复（<30min），影响可控 |

---

## 验收标准

- [ ] `npm run storybook` 在本地构建成功（无 CanvasHeader 引用错误）
- [ ] 后端三个 route.ts 文件中无 Unicode 弯引号
- [ ] CI 构建绿色（前端 build + storybook build，后端 build）
- [ ] ESLint `no-irregular-whitespace` 规则已启用
- [ ] PR 已合并至 main/master 分支

---

## 建议决策

| 方案 | 决策 | 说明 |
|------|------|------|
| 方案 A（立即修复） | ✅ 推荐 | 快速止血，30 分钟内解除阻塞 |
| 方案 B（彻底排查 + 预防） | ✅ 推荐 | 在方案 A 基础上加固防护，长期收益高 |
| 推后处理 | ❌ 不推荐 | 持续阻塞团队，P1 问题不应拖延 |

**PM 建议**: 采用方案 A + 方案 B 中的工具链加固部分（ESLint/pre-commit），预计总工期 1-2 小时，长期收益显著。

---

*提案人: PM (Analyst Subagent)*
*日期: 2026-04-11*
