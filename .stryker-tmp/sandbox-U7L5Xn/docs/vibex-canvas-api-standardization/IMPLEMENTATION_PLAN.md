# IMPLEMENTATION_PLAN.md — Canvas API 标准化实施计划

**项目**: vibex-canvas-api-standardization  
**Agent**: architect (设计) → dev (执行) → tester (验证) → reviewer (审查)  
**日期**: 2026-03-29  
**总工时估算**: ~3 人天

---

## 1. 阶段总览

```
Phase 1: 前端标准化 (0.5d)
  └── Step 1.1: 审查 api-config.ts
  └── Step 1.2: 清理 canvasApi.ts
  └── Step 1.3: 迁移 dddApi.ts → canvasSseApi.ts
  └── Step 1.4: 更新引用 + 删除原文件

Phase 2: 后端旧路由废弃 (0.5d)
  └── Step 2.1: 全库依赖扫描
  └── Step 2.2: 删除旧路由目录（或标记删除）

Phase 3: 测试验证 (1d)
  └── Step 3.1: E2E 测试覆盖
  └── Step 3.2: 页面无 404 验证
  └── Step 3.3: API 响应格式检查

Phase 4: 代码审查 + 发布 (0.5d)
  └── Step 4.1: Reviewer 审查
  └── Step 4.2: CHANGELOG 更新
  └── Step 4.3: 提交 PR + Merge
```

---

## 2. Phase 1: 前端标准化

**执行者**: dev  
**工时**: 0.5d  
**工作目录**: `vibex-fronted/`

### Step 1.1: 审查 api-config.ts

**操作**: 读取 `src/lib/api-config.ts`，确认 canvas 相关端点均以 `/v1/canvas/` 开头。

**验收**: 
- `canvas.generateContexts` → `/v1/canvas/generate-contexts`
- `canvas.generateFlows` → `/v1/canvas/generate-flows`
- `canvas.generateComponents` → `/v1/canvas/generate-components`
- `canvas.status` → `/v1/canvas/status`
- `canvas.project` → `/v1/canvas/project`
- `canvas.generate` → `/v1/canvas/generate`
- `canvas.export` → `/v1/canvas/export`

**预期结果**: 如已满足，跳过此步骤。

---

### Step 1.2: 清理 canvasApi.ts

**操作**: 读取 `src/lib/canvas/api/canvasApi.ts`

**检查清单**:
- [ ] 所有 `fetch` 调用均通过 `getApiUrl()` 获取 URL
- [ ] 无直接写死 URL 字符串（如 `/api/canvas/generate-contexts` 硬编码）
- [ ] 无对旧路由 `/api/canvas/` 的调用（不含 v1）

**修复方式**: 如果发现硬编码 URL，替换为 `getApiUrl(API_CONFIG.canvas.generateContexts)` 等配置调用。

**验收**: ESLint 检查通过，`grep` 无硬编码。

---

### Step 1.3: 迁移 dddApi.ts → canvasSseApi.ts

**操作**: 
1. 读取 `src/lib/canvas/api/dddApi.ts`
2. 创建 `src/lib/canvas/api/canvasSseApi.ts`
3. 内容迁移 + 重构:
   - 文件头部注释更新
   - 所有导出函数重命名为 `canvasSse*` 前缀
   - 保留 SSE 事件类型定义（`ThinkingEvent`, `BoundedContext` 等）

**命名映射**:
| 原函数名 | 新函数名 |
|----------|----------|
| `analyzeThinking` | `canvasSseAnalyze` |
| `streamAnalyze` | `canvasSseStream` |
| (其他 SSE 函数) | `canvasSse*` |

**验收**: `canvasSseApi.ts` 文件存在，函数命名符合规范。

---

### Step 1.4: 更新引用 + 删除原文件

**操作**: 
1. 扫描所有引用 `dddApi.ts` 的文件:
   ```bash
   grep -r "dddApi" --include="*.ts" --include="*.tsx" /root/.openclaw/vibex/vibex-fronted/src/
   ```
2. 更新每个文件的 import 语句:
   ```typescript
   // 旧
   import { analyzeThinking } from '@/lib/canvas/api/dddApi';
   // 新
   import { canvasSseAnalyze } from '@/lib/canvas/api/canvasSseApi';
   ```
3. 更新函数调用名称
4. 确认所有引用更新后，删除 `dddApi.ts`

**验收**:
- `grep -r "dddApi" --include="*.ts" --include="*.tsx"` 返回空
- `canvasSseApi.ts` 存在
- 功能无回归

---

## 3. Phase 2: 后端旧路由废弃

**执行者**: dev  
**工时**: 0.5d  
**工作目录**: `vibex-backend/`

### Step 2.1: 全库依赖扫描

**操作**: 
```bash
# 扫描旧路由引用（不含 v1）
grep -r "/api/canvas" --include="*.ts" --include="*.tsx" \
  /root/.openclaw/vibex/vibex-fronted/src/ \
  /root/.openclaw/vibex/vibex-backend/src/ \
  | grep -v "v1/canvas"

# 扫描旧测试引用
find /root/.openclaw/vibex/vibex-backend/src -path "*/__tests__/*" -name "*.ts" \
  | xargs grep "/api/canvas" | grep -v "v1"
```

**预期结果**: 无任何匹配。如果存在引用，先修复引用再继续。

**风险**: 如果发现外部系统调用旧路由，停止删除操作，升级给 coord。

---

### Step 2.2: 删除旧路由目录

**操作**: 
```bash
# 确认目录存在
ls /root/.openclaw/vibex/vibex-backend/src/app/api/canvas/

# 删除旧路由目录
rm -rf /root/.openclaw/vibex/vibex-backend/src/app/api/canvas/
```

**前提**: Step 2.1 全库扫描无任何引用。

**验收**: 
```bash
find /root/.openclaw/vibex/vibex-backend/src -path "*/app/api/canvas" -type d
# 应返回空
```

---

## 4. Phase 3: 测试验证

**执行者**: tester  
**工时**: 1d  
**工作目录**: `vibex-fronted/` + `vibex-backend/`

### Step 3.1: E2E 测试覆盖

**操作**: 运行 Canvas 完整流程 E2E 测试

```bash
cd /root/.openclaw/vibex/vibex-fronted
npm run e2e
```

**测试用例**:
1. 输入需求文本 → 验证 contexts 生成
2. 验证 sessionId 在 contexts → flows 传递
3. 验证 sessionId 在 flows → components 传递
4. 验证 components → project 保存
5. 验证项目加载正常

**验收**: 所有 Canvas E2E 测试通过，100% 覆盖率。

**失败处理**: 如果 E2E 失败，先确认是路由问题还是功能问题。路由问题回滚旧路由删除；功能问题创建 bug 修复任务。

---

### Step 3.2: 页面无 404 验证

**操作**: 使用 Playwright 检查 VibeX Canvas 页面加载

```bash
# 启动开发服务器
cd /root/.openclaw/vibex/vibex-fronted
npm run dev &

# 等待服务器启动
sleep 5

# 截图验证（可选）
npx playwright screenshot http://localhost:3000/canvas /tmp/canvas-check.png
```

**验收**: 页面加载正常，控制台无 404 错误。

---

### Step 3.3: API 响应格式检查

**操作**: 抽样检查各端点响应格式

```bash
# 检查 generate-contexts 响应格式
curl -X POST http://localhost:3000/api/v1/canvas/generate-contexts \
  -H "Content-Type: application/json" \
  -d '{"requirementText": "测试需求"}' \
  | jq '.success, .contexts, .sessionId, .confidence'
```

**验收**: 所有端点返回 `{ success: true/false, data: ..., error?: ... }` 结构。

---

## 5. Phase 4: 代码审查 + 发布

**执行者**: reviewer → dev (修复) → reviewer (复核)  
**工时**: 0.5d

### Step 4.1: Reviewer 审查

**审查清单** (见 AGENTS.md 5.1-5.3):
- [ ] canvasApi.ts 无硬编码 URL
- [ ] 全库无旧路由引用
- [ ] 旧路由目录已删除
- [ ] dddApi.ts 已迁移
- [ ] canvasSseApi.ts 函数命名正确
- [ ] E2E 测试通过

**通过条件**: 所有清单项通过方可合并。

---

### Step 4.2: CHANGELOG 更新

**操作**: 在 `CHANGELOG.md` 中添加条目:

```markdown
## [版本号] - 2026-03-29

### 标准化
- Canvas API 统一使用 `/api/v1/canvas/*` 前缀
- 废弃旧路由 `/api/canvas/*`
- `dddApi.ts` 迁移至 `canvasSseApi.ts`
- 所有 Canvas API 调用通过 `api-config.ts` 统一配置
```

---

### Step 4.3: 提交 PR + Merge

**操作**: 
```bash
cd /root/.openclaw/vibex
git checkout -b feature/canvas-api-standardization
git add .
git commit -m "feat(canvas): standardize API routes to /api/v1/canvas/*

- Remove legacy /api/canvas/* routes
- Migrate dddApi.ts to canvasSseApi.ts
- Enforce api-config.ts for all endpoint URLs
- Add E2E coverage for canvas flow

Closes: vibex-canvas-api-standardization"
git push origin feature/canvas-api-standardization
```

**Merge 条件**: Reviewer 审查通过 + E2E 测试 100% 通过。

---

## 6. 优先级排序

| 顺序 | 步骤 | 优先级 | 工时 | 依赖 |
|------|------|--------|------|------|
| 1 | Step 1.1 api-config 审查 | P0 | 0.25h | 无 |
| 2 | Step 1.2 canvasApi 清理 | ✅ P0 | 0.25h | Step 1.1 |
| 3 | Step 2.1 依赖扫描 | P0 | 0.25h | Step 1.2 |
| 4 | Step 1.3 dddApi 迁移 | P1 | 0.25h | Step 1.2 |
| 5 | Step 1.4 更新引用 | P1 | 0.25h | Step 1.3 |
| 6 | Step 2.2 删除旧路由 | P1 | 0.25h | Step 2.1 |
| 7 | Step 3.1 E2E 测试 | P1 | 0.5h | Step 2.2 |
| 8 | Step 3.2 页面验证 | P2 | 0.25h | Step 3.1 |
| 9 | Step 3.3 响应格式检查 | P2 | 0.25h | Step 3.1 |
| 10 | Step 4.1-4.3 审查发布 | P1 | 0.5h | Step 3.3 |

---

## 7. 任务拆分 (task_manager.py phase2)

```
dev:
  - impl-canvas-frontend-cleanup  (P0)
    - Step 1.1 + 1.2 + 1.3 + 1.4

  - impl-canvas-backend-cleanup  (P1)
    - Step 2.1 + 2.2

tester:
  - test-canvas-e2e  (P1)
    - Step 3.1 + 3.2 + 3.3

reviewer:
  - review-canvas-standardization  (P1)
    - Step 4.1

dev:
  - impl-canvas-changelog  (P2)
    - Step 4.2 + 4.3
```

---

## 8. 里程碑

| 里程碑 | 完成标准 | 预期时间 |
|--------|----------|----------|
| M1: 前端标准化完成 | canvasApi.ts + canvasSseApi.ts 就绪 | Day 1 上午 |
| M2: 后端清理完成 | 旧路由目录删除，无引用 | Day 1 下午 |
| M3: E2E 测试通过 | Canvas 完整流程 100% 通过 | Day 2 |
| M4: 发布完成 | PR merged，主分支更新 | Day 2 下午 |

---

*实施计划制定人: architect | 审核: pm | 日期: 2026-03-29*
