# 阶段任务报告：tester-e1-u1
**项目**: vibex-canvas-ux-fix
**领取 agent**: tester
**领取时间**: 2026-04-21T02:05:54.599102+00:00
**版本**: rev 63 → 64

## 项目目标
Vibex DDS Canvas 用户体验问题修复：从用户视角出发，解决以下四个阻塞性问题：

1. 【P0】组件树静默 400：用户未勾选上下文节点时点'继续→组件树'，后端返回 400 但前端无任何 toast/提示，用户完全不知道哪里出错。修复：400 响应体返回具体错误信息，前端弹出 toast 告知用户原因（如'请先勾选上下文节点'）。

2. 【P0】'创建项目并开始生成原型' 按钮始终 disabled：从零新建项目走完三树流程后，原型 Tab 的'创建项目并开始生成原型'按钮始终灰色无法点击。修复：按钮应根据三树完成状态正常解锁，只要流程树和上下文树达到可用状态即可激活。

3. 【Medium】'确认'不等于'完成'：用户在上下文树点击'确认所有节点'后，复选框全打勾但 UI 仍判定'上下文树未完成'，中间面板持续显示'请先完成上下文树后解锁'，组件树/原型两阶段被永久锁死。修复：'确认所有'操作应同时触发完成状态，或移除'完成'/'确认'双重判定。

4. 【Medium】'继续→组件树'按钮点击无反应：流程树 100% 完成后，'继续→组件树'按钮多次点击均无任何响应（无 loading、无错误、无 toast）。修复：按钮点击应触发组件树生成请求（带节点勾选校验）。

核心理念：三步点击到达任意地点，除非绝对必要否则不禁用任何功能。

## 阶段任务
# ★ Agent Skills（必读）
# `test-driven-development` — 测试策略、测试用例设计
# `browser-testing-with-devtools` — 浏览器测试、真实用户流程验收
# `frontend-ui-engineering` — 前端 UI 渲染验证
# `performance-optimization` — 性能指标检查
# `memlocal-memory` — ★ 本地记忆系统：测试前搜历史bug模式、测试后存记忆（真实 MemPalace，零依赖）
#   - 开始前：`memlocal search "类似Epic的bug历史"`
#   - 完成后：`memlocal mine <work_dir> --wing <project>`（room 自动检测）

# ★ Phase2 测试任务（tester）

测试 Epic: E1-U1

## 📁 工作目录
- 项目路径: /root/.openclaw/vibex
- 验收脚本: /root/.openclaw/vibex/docs/vibex-canvas-ux-fix/AGENTS.md

## ★ 测试方法（两种必须结合）

### 方法一：代码层面检查（使用 /ce:review）
- 使用 `/ce:review` 技能的测试维度
- 检查单元测试覆盖率、断言质量、边界条件
- 适合：后端逻辑、工具函数、数据模型

### 方法二：真实用户流程验收（使用 /qa）★ 关键 ★
**针对前端相关代码变动，必须显式调用 gstack 的 `/qa`**
- 启动浏览器，访问 Staging URL
- 执行完整用户操作路径
- 输出可视化测试报告
- 这是区分"脑内测试"和"真实测试"的关键

## ★ 测试流程

### 测试前
先执行变更文件确认（见下方 🔴 章节），确认有文件变更后再开始测试。

### 测试中
每个页面测完后截图保存到 `/root/.openclaw/vibex/reports/qa/`，截图命名格式：
```
E1-U1-<页面名>-<时间戳>.png
```

### 测试后
所有页面测试完毕 + 截图保存完成后，用 `task` 命令标记任务完成：
```bash
task update <project> tester-<epic-id> done --result "<测试结果摘要>"
```

## 测试页面清单

_（从 PRD 【需页面集成】提取，详见 PRD 文档）_

## 🔴 测试前必做：变更文件确认

**禁止跳过此步骤。** 先确认 dev 有代码变更，再针对这些文件做专项测试。

### 第一步：Commit 检查
```bash
cd /root/.openclaw/vibex && git log --oneline -10
```
- 无新 commit（输出为空）→ **立即标记 tester 任务 failed**，说明 dev 未提交代码，立即驳回
- 有 commit → 继续第二步

### 第二步：获取本次 commit 变更文件
```bash
cd /root/.openclaw/vibex && git show --stat HEAD~1..HEAD
```
- 无文件变更（输出为空）→ **立即标记 tester 任务 failed（空 commit）**，立即驳回
- 有文件变更 → 记录文件列表，作为测试范围

## 🔴 Epic 专项验证（禁止通用测试绕过）

### 绝对禁止
- ❌ 运行 `npm test` 或 `pnpm test` 作为唯一测试手段
- ❌ 用"没有破坏既有功能"代替"Epic 功能已实现"

### 正确做法
- ✅ 必须列出 git diff 中的具体变更文件
- ✅ 对每个变更文件找到对应的测试用例或手动测试
- ✅ 如果 git diff 显示有 .tsx/.ts 文件变更，必须用 `/qa` 打开浏览器验证
- ✅ 如果 git diff 显示有 .py 文件变更，必须运行针对性的 pytest

### 验证结果记录
在 `/root/.openclaw/vibex/reports/qa/` 下为每个 epic 创建报告，命名格式：
```
{epic_id}-epic-verification.md
```
包含：
- git diff 文件列表（粘贴命令输出）
- 每个文件对应的测试结果（通过/失败/未覆盖）
- 截图附件路径

## 驳回红线
- dev 无 commit 或 commit 为空（`git show --stat HEAD~1..HEAD` 为空）→ **立即标记 tester 任务 failed**
- 有文件变更但无针对性测试 → 驳回 dev
- 前端代码变动但未使用 `/qa` → 驳回 dev（必须真实测试）
- 测试失败 → 驳回 dev
- 缺少 Epic 专项验证报告 → 驳回 dev
- **测试过程中发现 bug → 立即在评论中标注，不要等到最后**


## 🔴 约束清单
- 工作目录: /root/.openclaw/vibex
- 测试100%通过
- 覆盖所有功能点
- 必须验证上游产出物

## 📦 产出路径
npm test 验证通过

## 📤 上游产物
- dev-e1-u1: /root/.openclaw/vibex

## ⏰ SLA Deadline
`2026-04-22T10:05:54.588159+08:00` (24h 内完成)
