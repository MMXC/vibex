# Spec: Epic 7 — 文档与工具

**Epic**: E7  
**PRD 引用**: `prd.md` § Epic 7  
**优先级**: P2  
**目标 Sprint**: Sprint 2（04/15-04/18）  
**工时**: 2h（S7.1: 1h, S7.2: 1h）  
**前置依赖**: 无  
**状态**: 待开发

---

## 概述

文档化演进路线，便于新成员上手，降低知识传递成本。

---

## 详细设计

### S7.1 — 画布演进路线图

#### F7.1: canvas-roadmap.md

**目标读者**: 新加入的前端开发者、设计师、产品经理

**文档结构**:
```markdown
# Canvas 演进路线图

## 当前架构

### 三栏布局
- ContextTree（左侧）— 上下文数据
- FlowTree（中间）— Flow 可视化
- ComponentTree（右侧）— 组件树

### 技术栈
- React 18 + TypeScript
- Zustand（状态管理）
- React Flow（节点编排）

## 演进阶段

### Phase 1: 稳定性（当前）
- ✅ ErrorBoundary 独立化
- ✅ 状态持久化
- ⏳ 性能优化

### Phase 2: 可扩展性
- [ ] 节点自定义 API
- [ ] 多 Flow 同时编辑
- [ ] 插件系统

### Phase 3: 协作
- [ ] 实时协同编辑
- [ ] 操作历史与回滚
- [ ] 评论与标注

## 技术债务

| 债务项 | 优先级 | 预估工时 | 状态 |
|--------|--------|----------|------|
| waitForTimeout 重构 | P1 | 4h | 进行中 |
| 类型系统统一 | P1 | 2h | 待开始 |

## 决策记录

| 日期 | 决策 | 理由 | 影响 |
|------|------|------|------|
| 2026-04-10 | ErrorBoundary 独立化 | 一栏崩溃不应影响全局 | 三栏解耦 |
| 2026-04-07 | 使用 React Flow | 社区成熟，文档完善 | 学习成本低 |

## 贡献指南

### 添加新节点类型
1. 在 `packages/types/src/nodes/` 定义类型
2. 在 `apps/frontend/src/components/canvas/nodes/` 实现渲染
3. 添加单元测试
4. 更新本文档

### 修改三栏之一
1. 确保 ErrorBoundary 包裹
2. 添加对应 key 的状态持久化
3. 更新本文档
```

### S7.2 — CHANGELOG 自动化

#### F7.2: commit 时自动更新 CHANGELOG

**解决方案**: 使用 `release-please` 或 `standard-changelog` 工具自动生成 CHANGELOG。

**release-please 配置**:
```yaml
# release-please-config.json
{
  "packages": {
    ".": {
      "changelog-path": "CHANGELOG.md",
      "release-type": "node",
      "includeComponentInTag": false,
      "includeVulnerabilityAlerts": true
    }
  }
}
```

**CI 集成**:
```yaml
# .github/workflows/release-please.yml
name: release-please

on:
  push:
    branches:
      - main

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          release-please-action: 'release-pr'
```

**手动触发 CHANGELOG 生成**:
```bash
# 根据 conventional commits 生成
npx conventional-changelog -p angular -i CHANGELOG.md -s
```

**Commit 规范（conventional commits）**:
```
<type>(<scope>): <subject>

Types:
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

Examples:
feat(canvas): add multi-flow support
fix(auth): resolve token refresh race condition
docs(readme): update installation instructions
```

---

## API/接口

本 Epic 不涉及 API 接口变更，纯文档和工具层面。

---

## 实现步骤

### Phase 1: canvas-roadmap.md（1h）

1. **创建目录**
   ```bash
   mkdir -p docs
   ```

2. **编写文档**
   - 创建 `docs/canvas-roadmap.md`
   - 包含架构、阶段、技术债务、决策记录

3. **链接到 AGENTS.md**
   - 在 Architect 相关章节引用

### Phase 2: CHANGELOG 自动化（1h）

1. **安装 release-please**
   ```bash
   npm install -D release-please
   ```

2. **创建配置文件**
   - 创建 `release-please-config.json`

3. **创建 GitHub Actions workflow**
   - 创建 `.github/workflows/release-please.yml`

4. **验证**
   ```bash
   # 测试 conventional changelog 生成
   npx conventional-changelog -p angular -i CHANGELOG.md -s -r 1
   ```

---

## 验收测试

### AC7.1 — canvas-roadmap

```typescript
//验收测试: canvas-roadmap文档存在且完整
describe('Canvas Roadmap (AC7.1)', () => {
  const roadmapPath = '/root/.openclaw/vibex/docs/canvas-roadmap.md';

  it('canvas-roadmap.md exists', () => {
    expect(fs.existsSync(roadmapPath)).toBe(true);
  });

  it('canvas-roadmap has architecture section', () => {
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    expect(content).toMatch(/架构|architecture/i);
  });

  it('canvas-roadmap has evolution phases', () => {
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    expect(content).toMatch(/Phase|阶段|演进/i);
  });

  it('canvas-roadmap covers all three panels', () => {
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    expect(content).toMatch(/ContextTree|FlowTree|ComponentTree/);
  });

  it('canvas-roadmap has technical debt section', () => {
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    expect(content).toMatch(/技术债务|debt|债务/i);
  });

  it('canvas-roadmap has decision records', () => {
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    expect(content).toMatch(/决策|decision|记录/i);
  });

  it('canvas-roadmap is linked in AGENTS.md', () => {
    const agentsPath = '/root/.openclaw/vibex/docs/vibex-proposals-20260412/AGENTS.md';
    const agentsContent = fs.readFileSync(agentsPath, 'utf-8');
    expect(agentsContent).toMatch(/canvas-roadmap|roadmap/i);
  });

  it('canvas-roadmap has contribution guide', () => {
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    expect(content).toMatch(/贡献指南|contribution|指南/i);
  });
});
```

### AC7.2 — CHANGELOG 自动化

```typescript
//验收测试: CHANGELOG自动化集成
describe('CHANGELOG Automation (AC7.2)', () => {
  const changelogPath = '/root/.openclaw/vibex/CHANGELOG.md';
  const releasePleaseConfig = '/root/.openclaw/vibex/release-please-config.json';
  const workflowPath = '/root/.openclaw/vibex/.github/workflows/release-please.yml';

  it('CHANGELOG.md exists', () => {
    expect(fs.existsSync(changelogPath)).toBe(true);
  });

  it('release-please config exists', () => {
    expect(fs.existsSync(releasePleaseConfig)).toBe(true);
  });

  it('release-please workflow exists', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  it('release-please workflow triggers on main branch push', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    expect(content).toMatch(/on:.*push.*branches.*main/s);
  });

  it('release-please config references CHANGELOG.md', () => {
    const config = JSON.parse(fs.readFileSync(releasePleaseConfig, 'utf-8'));
    const packages = Object.values(config.packages || config);
    const pkg: any = Array.isArray(packages) ? packages[0] : packages;
    expect(pkg['changelog-path']).toBe('CHANGELOG.md');
  });

  it('conventional changelog generation works', () => {
    // 测试 conventional-changelog 工具可用
    const result = execSync(
      'npx conventional-changelog --dry-run 2>&1 | head -20',
      { encoding: 'utf-8', cwd: '/root/.openclaw/vibex' }
    );
    // 应输出 changelog 格式内容（即使是空的）
    expect(result).toBeDefined();
  });

  it('CHANGELOG.md follows conventional format', () => {
    const content = fs.readFileSync(changelogPath, 'utf-8');
    // conventional changelog 格式
    expect(content).toMatch(/#{1,3}\s+\d+\.\d+\.\d+/); // 版本号
  });
});
```

---

## 风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| canvas-roadmap 写成后就过时 | 高 | 低 | 使用 checkboxes 定期更新，链接到 team-tasks |
| commit 规范执行率低 | 中 | 中 | pre-commit hook 拦截不规范 commit message |
| release-please 配置复杂 | 低 | 中 | 从简单配置开始，逐步完善 |
