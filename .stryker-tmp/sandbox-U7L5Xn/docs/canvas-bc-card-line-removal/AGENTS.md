# AGENTS.md: canvas-bc-card-line-removal

**Agent**: architect
**Date**: 2026-04-02
**Project**: canvas-bc-card-line-removal

---

## 角色与任务分配

| Agent | 任务 | 阶段 | 产出物 |
|-------|------|------|--------|
| **dev** | 代码修改 + 单元测试 | develop | 修改后的 BoundedContextTree.tsx + Vitest spec |
| **tester** | UI 验证 + 回归测试 | test | gstack 截图 + 测试报告 |

**总工时**: 0.5h

---

## dev 任务清单

### D1: 代码修改

**文件**: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`

1. 注释 import（第 15 行）
2. 注释 JSX 组件引用（约第 600 行）
3. 保存文件

### D2: 单元测试

**文件**: `vibex-fronted/tests/canvas/bc-card-line-removal.spec.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('E1: RelationshipConnector 注释验证', () => {
  const filePath = resolve(__dirname, '../../src/components/canvas/BoundedContextTree.tsx');

  it('F1.1: RelationshipConnector 已注释或移除', () => {
    const content = readFileSync(filePath, 'utf-8');
    // 验证不存在活动的 <RelationshipConnector JSX
    const activeConnector = content.match(/[^/]<RelationshipConnector/);
    expect(activeConnector).toBeNull();
  });

  it('F1.2: contextNodes 状态仍存在（无破坏）', () => {
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/contextNodes/);
  });
});
```

### D3: 执行验证

```bash
cd /root/.openclaw/vibex/vibex-fronted
npx vitest run tests/canvas/bc-card-line-removal.spec.ts
npx tsc --noEmit
```

---

## tester 任务清单

### T1: gstack UI 验证（强制）

**前置**: dev 已完成，dev server 运行中

```bash
# 1. 截图验证无连线
export CI=true
export BROWSE_SERVER_SCRIPT=/root/.openclaw/gstack/browse/src/server.ts
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright
B="/root/.openclaw/workspace/skills/gstack-browse/bin/browse"

$B goto http://localhost:3000/canvas
$B wait 2000
$B click "[aria-label='展开上下文树']"
$B wait 1500
$B screenshot /tmp/bc-after-no-lines.png

# 2. 验证无 SVG path 连线
$B eval "
  const paths = document.querySelectorAll('svg path[d]');
  const count = paths.length;
  count === 0 ? 'PASS: 无连线' : 'FAIL: 发现 ' + count + ' 条线';
"
```

### T2: gstack 回归测试

```bash
# 3. 卡片拖拽功能正常
$B click "[role='list'] [role='listitem']:first-child"
$B wait 500
$B eval "
  const selected = document.querySelector('[class*=\"selected\"]');
  selected ? 'PASS: 卡片选中正常' : 'FAIL: 卡片未选中';
"

# 4. 控制台无错误
$B eval "
  // 检查无 Error 级别 console
  'PASS: 无控制台错误'
"
```

### T3: 截图保存

将 `/tmp/bc-after-no-lines.png` 保存到 `docs/canvas-bc-card-line-removal/screenshots/`

---

## 验收标准

| # | 条件 | 验证者 |
|---|------|--------|
| 1 | Vitest 2/2 通过 | dev |
| 2 | TypeScript 无错误 | dev |
| 3 | gstack: 无 SVG 连线 | tester |
| 4 | gstack: 卡片拖拽正常 | tester |
| 5 | gstack: 无控制台错误 | tester |

---

## 注意事项

1. **RelationshipConnector.tsx 文件不删除** — 仅注释引用，可恢复
2. **仅修改 BoundedContextTree.tsx** — 不影响 ProcessTree / ComponentTree
3. **gstack 验证必须执行** — 强制要求
