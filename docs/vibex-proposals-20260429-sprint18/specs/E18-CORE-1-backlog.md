# Spec: E18-CORE-1 — Sprint 1-17 遗留功能识别与规划

## 概述

扫描 Sprint 1-17 交付成果与遗留问题，识别高优先级功能增强，输出 backlog 文档。

## 数据源

1. **Git History** — 分析 Sprint 1-17 的 commit message、PR 标题
2. **Issue Tracker** — 未关闭的 issue、feature request
3. **User Feedback** — 用户反馈文档（如有）
4. **Error Logs** — 生产环境错误日志汇总
5. **Tech Debt** — 代码中的 TODO、FIXME 注释

## 识别方法

### Step 1: Git History 分析

```bash
git log --oneline --since="2025-01-01" --until="2026-04-29" | \
  grep -E "fix:|feat:|bug:|hotfix:" | \
  awk '{print $1, $2}' | \
  sort | uniq -c | sort -rn | head -20
```

### Step 2: Issue 汇总

```bash
gh issue list --state open --limit 100 --json number,title,labels
```

### Step 3: Tech Debt 扫描

```bash
grep -rn "TODO\|FIXME\|XXX\|HACK\|deprecated" src/ --include="*.ts" | \
  awk -F':' '{print $3}' | sort | uniq -c | sort -rn
```

## RICE 评分

每个功能点按 RICE 框架评分：

| 维度 | 说明 | 分值 |
|------|------|------|
| **R**each（触达）| 该功能影响多少用户/请求 | 1-10 |
| **I**mpact（影响）| 对用户价值的影响程度 | 0.25/0.5/1/2/3 |
| **C**onfidence（信心）| 对估算的信心程度 | 50%/80%/100% |
| **E**ffort（工时）| 所需人数 × 周数 | 人天 |

**RICE = (R × I × C) / E**

## 输出文档结构

`docs/backlog-sprint17.md`:

```markdown
# Sprint 1-17 Backlog

## 数据源汇总
- Git commits: N 条（分析范围: Sprint 1-17）
- Open issues: N 条
- Tech debt items: N 条

## 遗留功能列表

| ID | 功能点 | 描述 | R | I | C | E | RICE | 优先级 |
|----|--------|------|---|---|---|---|------|--------|
| B1 | xxx | xxx | 8 | 2 | 0.8 | 3 | 4.27 | P1 |
| B2 | xxx | xxx | 5 | 3 | 0.8 | 5 | 2.40 | P2 |

## Top 3 高优先级

### B1: [功能名称]
- **RICE**: 4.27
- **描述**: ...
- **验收标准草稿**: ...
```

## 验收标准（逐条 expect）

```ts
describe('E18-CORE-1: Backlog Identification', () => {
  it('backlog document should exist', () => {
    expect(fs.existsSync('docs/backlog-sprint17.md')).toBe(true);
  });

  it('backlog should have >= 5 items', () => {
    const content = fs.readFileSync('docs/backlog-sprint17.md', 'utf-8');
    const items = content.match(/^\| B\d+/gm);
    expect(items.length).toBeGreaterThanOrEqual(5);
  });

  it('each backlog item should have RICE score', () => {
    const content = fs.readFileSync('docs/backlog-sprint17.md', 'utf-8');
    const ricePattern = /\| P\d+ \|.*?(\d+\.\d+)/;
    const riceMatches = content.match(ricePattern);
    expect(riceMatches.length).toBeGreaterThanOrEqual(5);
  });

  it('top 3 items should be marked as prioritized', () => {
    const content = fs.readFileSync('docs/backlog-sprint17.md', 'utf-8');
    expect(content).toContain('### B1:');
    expect(content).toContain('### B2:');
    expect(content).toContain('### B3:');
  });
});
```

## DoD Checklist

- [ ] `docs/backlog-sprint17.md` 已创建
- [ ] backlog 包含 ≥ 5 个功能点
- [ ] 每个功能点有：描述、R/I/C/E 分值、RICE 总分
- [ ] top 3 功能点有验收标准草稿
- [ ] 与 Architect、Analyst 对齐（review 通过）
