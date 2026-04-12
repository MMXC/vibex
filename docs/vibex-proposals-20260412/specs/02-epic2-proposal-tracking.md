# Spec: Epic 2 — 提案状态追踪

**Epic**: E2  
**PRD 引用**: `prd.md` § Epic 2  
**优先级**: P0  
**目标 Sprint**: Sprint 1（04/12-04/14）  
**工时**: 2h（Story S2.1: 1h, S2.2: 1h）  
**前置依赖**: 无  
**状态**: 待开发

---

## 概述

建立提案从提交到实现的完整状态追踪机制，解决提案状态不透明导致的重复提案问题。

**核心问题**: 当前 INDEX.md 中提案缺少状态字段，团队成员无法判断一个提案是"已拒绝"、"进行中"还是"已实现"，导致同一主题多次重复出现。

---

## 详细设计

### S2.1 — INDEX.md 状态字段

#### F2.1: 提案状态字段设计

**状态枚举**:
```typescript
type ProposalStatus =
  | 'pending'    // 待评审
  | 'in-progress' // 评审通过，开发中
  | 'done'       // 已实现
  | 'rejected'   // 已拒绝
  | 'deferred';  // 延期

interface ProposalEntry {
  id: string;
  title: string;
  status: ProposalStatus;
  owner: string;       // 负责人
  updatedAt: string;   // YYYY-MM-DD
  epic?: string;       // 关联 Epic
  notes?: string;
}
```

**INDEX.md 修改格式**:
```markdown
## 提案列表

| ID | 标题 | 状态 | 负责人 | Epic | 更新日期 | 备注 |
|----|------|------|--------|------|----------|------|
| P001 | Token 日志安全 | done | @analyst | E1 | 2026-04-10 | 已合并 |
| P002 | Canvas ErrorBoundary | in-progress | @architect | E4 | 2026-04-11 | 开发中 |
| P003 | 画布演进路线图 | pending | @analyst | E7 | 2026-04-07 | 待评审 |
| P004 | 旧版 API 清理 | rejected | @architect | E4 | 2026-04-05 | v1 已废弃 |
```

#### 迁移策略

1. **自动化脚本**: 扫描所有提案 MD 文件，提取已有元数据
2. **手动补充**: 无法自动提取的字段人工补全
3. **验证脚本**: 验证每条提案都有 status 字段

```typescript
// scripts/validate-proposal-index.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const INDEX_PATH = '/root/.openclaw/vibex/docs/vibex-proposals-20260412/INDEX.md';

interface ProposalEntry {
  id: string;
  title: string;
  status: string;
}

export function validateIndex(): { valid: boolean; missing: string[] } {
  const content = fs.readFileSync(INDEX_PATH, 'utf-8');
  const lines = content.split('\n');
  const validStatuses = ['pending', 'in-progress', 'done', 'rejected', 'deferred'];
  const missing: string[] = [];

  lines.forEach((line, idx) => {
    if (line.startsWith('|') && !line.includes('---')) {
      const cols = line.split('|').map(c => c.trim());
      const statusCol = cols[3]; // 状态列
      if (statusCol && !validStatuses.includes(statusCol)) {
        missing.push(`Line ${idx + 1}: invalid status "${statusCol}"`);
      }
    }
  });

  return { valid: missing.length === 0, missing };
}
```

### S2.2 — 状态更新 SOP

#### F2.2: 提案状态更新标准操作流程

**触发条件**:

| 事件 | 状态变更 | 操作人 |
|------|----------|--------|
| 提案提交 | pending | 提案人 |
| PM 评审通过 | in-progress | PM |
| 开发完成并合并 | done | Dev |
| PM/Architect 评审拒绝 | rejected | PM/Architect |
| 资源不足，延后处理 | deferred | PM |

**SOP 文档**（写入 `docs/proposals/SOP.md`）:

```markdown
# 提案状态管理 SOP

## 状态定义

| 状态 | 含义 | 颜色标识 |
|------|------|----------|
| pending | 待评审 | 🟡 |
| in-progress | 开发中 | 🔵 |
| done | 已实现 | 🟢 |
| rejected | 已拒绝 | 🔴 |
| deferred | 延期 | ⚪ |

## 更新规则

1. 提案状态变更后，提案人在 24h 内更新 INDEX.md
2. 状态变更必须附带原因（备注列）
3. 拒绝的提案必须说明拒绝理由
4. 延期提案在条件满足后可重新激活

## 流程

[提案提交] → [PM 评审] → [in-progress / rejected / deferred]
                ↓
         [开发实现] → [done]
```

---

## API/接口

本 Epic 不涉及 API 接口，变更仅限于文档和流程规范。

---

## 实现步骤

### Phase 1: INDEX.md 状态字段（1h）

1. **扫描现有提案**
   ```bash
   # 统计提案数量
   find /root/.openclaw/vibex/docs/vibex-proposals-20260412/proposals -name "*.md" | wc -l
   ```

2. **执行自动化迁移脚本**
   - 提取已有 frontmatter 中的 status
   - 合并到 INDEX.md

3. **手动补充缺失状态**
   - 逐条审查无状态提案
   - 与提案人确认状态

4. **运行验证脚本**
   ```bash
   npx ts-node scripts/validate-proposal-index.ts
   # 输出: validation result
   ```

### Phase 2: SOP 文档化（1h）

1. **编写 SOP 文档**
   - 创建 `docs/proposals/SOP.md`
   - 包含状态定义、更新规则、流程图

2. **集成到 AGENTS.md**
   - 在 PM 相关章节引用 SOP

3. **通知团队**
   - 发送 Slack 消息告知 SOP

---

## 验收测试

### AC2.1 — INDEX.md 状态字段

```typescript
//验收测试: INDEX.md状态字段100%覆盖
describe('Proposal Status Field (AC2.1)', () => {
  const INDEX_PATH = '/root/.openclaw/vibex/docs/vibex-proposals-20260412/INDEX.md';
  const validStatuses = ['pending', 'in-progress', 'done', 'rejected', 'deferred'];

  function parseIndexTable(content: string): Array<{ id: string; status: string }> {
    const lines = content.split('\n');
    const proposals: Array<{ id: string; status: string }> = [];
    let inTable = false;

    lines.forEach(line => {
      if (line.includes('| ID |') || line.includes('|---')) {
        inTable = true;
        return;
      }
      if (line.startsWith('##') || line.startsWith('#')) {
        inTable = false;
      }
      if (inTable && line.startsWith('|') && !line.includes('---')) {
        const cols = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cols.length >= 4 && cols[0] && cols[0] !== 'ID') {
          proposals.push({ id: cols[0], status: cols[3] });
        }
      }
    });

    return proposals;
  }

  it('INDEX.md exists', () => {
    expect(fs.existsSync(INDEX_PATH)).toBe(true);
  });

  it('all proposals have a status field', () => {
    const content = fs.readFileSync(INDEX_PATH, 'utf-8');
    const proposals = parseIndexTable(content);
    expect(proposals.length).toBeGreaterThan(0);
    proposals.forEach(p => {
      expect(p.status).toBeDefined();
      expect(p.status.length).toBeGreaterThan(0);
    });
  });

  it('all status values are valid enum values', () => {
    const content = fs.readFileSync(INDEX_PATH, 'utf-8');
    const proposals = parseIndexTable(content);
    proposals.forEach(p => {
      expect(validStatuses).toContain(p.status);
    });
  });

  it('100% coverage: every proposal row has status', () => {
    const content = fs.readFileSync(INDEX_PATH, 'utf-8');
    const proposals = parseIndexTable(content);
    const allHaveStatus = proposals.every(p => p.status && p.status.length > 0);
    const coverage = proposals.filter(p => p.status).length / proposals.length;
    expect(allHaveStatus).toBe(true);
    expect(coverage).toBe(1.0); // 100%
  });
});
```

### AC2.2 — 状态更新触发

```typescript
//验收测试: 状态更新SOP
describe('Status Update SOP (AC2.2)', () => {
  const SOP_PATH = '/root/.openclaw/vibex/docs/proposals/SOP.md';

  it('SOP document exists', () => {
    expect(fs.existsSync(SOP_PATH)).toBe(true);
  });

  it('SOP defines all 5 status values', () => {
    const content = fs.readFileSync(SOP_PATH, 'utf-8');
    const statuses = ['pending', 'in-progress', 'done', 'rejected', 'deferred'];
    statuses.forEach(s => {
      expect(content).toContain(s);
    });
  });

  it('SOP defines update rules', () => {
    const content = fs.readFileSync(SOP_PATH, 'utf-8');
    expect(content).toMatch(/更新规则|规则/);
  });

  it('SOP is referenced in AGENTS.md', () => {
    const agentsPath = '/root/.openclaw/vibex/docs/vibex-proposals-20260412/AGENTS.md';
    const agentsContent = fs.readFileSync(agentsPath, 'utf-8');
    expect(agentsContent).toMatch(/SOP|sop/);
  });

  it('status update triggers are documented', () => {
    const content = fs.readFileSync(SOP_PATH, 'utf-8');
    expect(content).toMatch(/触发|触发条件/);
    expect(content).toMatch(/pending|in-progress/);
  });
});
```

---

## 风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 历史提案状态无法确定 | 中 | 中 | 由提案人或 PM 回溯判断 |
| SOP 文档无人遵守 | 中 | 中 | 将 SOP 纳入 AGENTS.md，自动化验证 |
| 提案数量过多导致迁移工作量大 | 低 | 低 | 自动化脚本辅助，仅需人工确认 |
