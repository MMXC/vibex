# SPEC: E1 — CHANGELOG 规范落地

**项目**: vibex-reviewer-proposals-20260403_024652
**Epic**: E1: CHANGELOG 规范落地
**版本**: v1.0
**日期**: 2026-04-03
**状态**: 待开发

---

## 1. Epic 概述

### 1.1 目标
在 AGENTS.md 中明确 CHANGELOG 路径规范，消除路径歧义导致的重复驳回。

### 1.2 背景问题
- Frontend 有 2 个 CHANGELOG 位置（根目录 Markdown + App 页面），Reviewer 和 Dev 理解不一致
- `canvas-json-persistence` Epic3 因 CHANGELOG 遗漏经历 4 轮审查驳回
- Backend 有独立 CHANGELOG 路径，Frontend/Backend 规范不一致

### 1.3 预期收益
- 新 Epic 的 CHANGELOG 相关驳回次数从平均 2-3 轮降至 ≤ 1 轮
- Reviewer 无需每次解释 CHANGELOG 路径规则

---

## 2. Stories

### E1-S1: AGENTS.md CHANGELOG 规范章节编写

**功能点**:
在 `vibex-fronted/AGENTS.md` 中增加 CHANGELOG 规范章节，包含：

1. **路径规则**
   - Frontend 项目只维护根目录 `vibex-fronted/CHANGELOG.md`
   - App 页面 `src/app/changelog/page.tsx` 为自动渲染文件，**禁止手动修改**
   - 所有 CHANGELOG 更新必须写入根目录 Markdown 文件

2. **更新时机**
   - 每个 Epic 结束时必须更新 CHANGELOG.md
   - 更新时机：PR merge 前完成

3. **格式规范**
   - 参考 `CHANGELOG_CONVENTION.md` 的标准格式
   - 必须包含 Epic 名称、变更类型、变更摘要

4. **Reviewer Constraints 检查项**
   ```
   - [ ] CHANGELOG.md 已更新（根目录 Markdown，不是 App 页面）
   - [ ] 更新格式符合 CHANGELOG_CONVENTION.md
   ```

**验收标准**:
```javascript
// E1-S1 验收测试
const fs = require('fs');
const agentsMd = fs.readFileSync('vibex-fronted/AGENTS.md', 'utf8');

expect(agentsMd).toContain('CHANGELOG 规范');
expect(agentsMd).toContain('src/app/changelog/page.tsx');
expect(agentsMd).toContain('禁止手动修改 App 页面');
expect(agentsMd).toContain('Reviewer Constraints');
expect(agentsMd).toContain('CHANGELOG.md 已更新');
expect(agentsMd).toContain('CHANGELOG_CONVENTION.md');
```

**工时**: 1h
**依赖**: 无
**优先级**: P0

---

### E1-S2: CHANGELOG_CONVENTION.md功能点**:
创建 ` 格式规范文档

**vibex-fronted/CHANGELOG_CONVENTION.md`，定义标准更新格式：

1. **文档结构**
   - Epic 维度记录（每个 Epic 一个 section）
   - 每个 Epic 包含：名称、日期、变更摘要

2. **变更类型标签**
   - `feat`: 新功能
   - `fix`: Bug 修复
   - `refactor`: 重构
   - `docs`: 文档更新
   - `test`: 测试更新
   - `chore`: 杂项

3. **示例模板**
   ```markdown
   ## [Epic名称] — YYYY-MM-DD
   
   ### feat: [功能描述]
   - 详细变更说明
   
   ### fix: [修复描述]
   - 问题：xxx
   - 修复：xxx
   ```

4. **Commit ID 关联**（可选）
   - 可在变更后附加 `(commit: <hash>)`

**验收标准**:
```javascript
// E1-S2 验收测试
const fs = require('fs');
const convPath = 'vibex-fronted/CHANGELOG_CONVENTION.md';

expect(fs.existsSync(convPath)).toBe(true);
const convMd = fs.readFileSync(convPath, 'utf8');
expect(convMd).toContain('Epic');
expect(convMd).toContain('feat/fix/refactor');
expect(convMd).toContain('示例');
expect(convMd).toContain('yyyy-mm-dd');
```

**工时**: 1h
**依赖**: E1-S1
**优先级**: P0

---

### E1-S3: Backend AGENTS.md CHANGELOG 规范同步

**功能点**:
在 `vibex-backend/AGENTS.md` 中同步 CHANGELOG 规范：

1. **路径规则**
   - Backend 项目只维护 `vibex-backend/CHANGELOG.md`
   - 不接受其他位置的 CHANGELOG 记录

2. **Reviewer Constraints 检查项**
   ```
   - [ ] CHANGELOG.md 已更新（vibex-backend/CHANGELOG.md）
   - [ ] 更新格式符合项目规范
   ```

3. **Frontend/Backend 隔离说明**
   - 明确说明 Frontend 和 Backend 的 CHANGELOG 完全隔离
   - 跨项目 Epic 需要各自更新对应的 CHANGELOG

**验收标准**:
```javascript
// E1-S3 验收测试
const fs = require('fs');
const backendAgentsMd = fs.readFileSync('vibex-backend/AGENTS.md', 'utf8');

expect(backendAgentsMd).toContain('CHANGELOG 规范');
expect(backendAgentsMd).toContain('vibex-backend/CHANGELOG.md');
expect(backendAgentsMd).toContain('Reviewer Constraints');
expect(backendAgentsMd).toContain('Frontend 和 Backend 的 CHANGELOG 完全隔离');
```

**工时**: 0.5h
**依赖**: E1-S1
**优先级**: P0

---

## 3. 文件清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `vibex-fronted/AGENTS.md` | 修改 | 增加 CHANGELOG 规范章节 |
| `vibex-fronted/CHANGELOG_CONVENTION.md` | 创建 | 格式规范文档 |
| `vibex-backend/AGENTS.md` | 修改 | 同步 CHANGELOG 规范 |

---

## 4. 测试计划

| 测试 ID | 测试内容 | 预期结果 |
|---------|---------|---------|
| T-E1-01 | 读取 `vibex-fronted/AGENTS.md`，搜索 `CHANGELOG 规范` 关键词 | 存在且包含完整规范内容 |
| T-E1-02 | 读取 `vibex-fronted/AGENTS.md`，搜索 `src/app/changelog/page.tsx` | 存在且标记为禁止手动修改 |
| T-E1-03 | 检查 `vibex-fronted/CHANGELOG_CONVENTION.md` 是否存在 | 文件存在 |
| T-E1-04 | 读取 `vibex-fronted/CHANGELOG_CONVENTION.md`，验证包含示例模板 | 包含 feat/fix/refactor 标签和示例 |
| T-E1-05 | 读取 `vibex-backend/AGENTS.md`，搜索 Backend CHANGELOG 路径 | 存在且明确为 `vibex-backend/CHANGELOG.md` |

---

## 5. DoD Checklist

- [ ] `vibex-fronted/AGENTS.md` 包含完整 CHANGELOG 规范章节（E1-S1）
- [ ] `vibex-fronted/CHANGELOG_CONVENTION.md` 已创建并包含格式规范（E1-S2）
- [ ] `vibex-backend/AGENTS.md` 包含同步的 CHANGELOG 规范（E1-S3）
- [ ] 所有验收测试通过
- [ ] 团队已在 Slack 收到规范通知
