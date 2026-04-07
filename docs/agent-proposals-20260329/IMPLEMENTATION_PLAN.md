# IMPLEMENTATION_PLAN — VibeX Agent 提案汇总

**项目**: agent-proposals-20260329  
**Architect**: 架构设计  
**总工时**: ~8.5d (约 2 周)  
**最后更新**: 2026-03-29

---

## Phase 概览

| Phase | 内容 | 负责 | 工时 | 依赖 |
|-------|------|------|------|------|
| Phase 0 | 架构设计（本阶段） | architect | 0.5h | PRD |
| Phase 1 | Sprint 0 止血 | dev | 1.5d | — |
| Phase 2 | Sprint 1 稳定 | dev+architect+tester+pm | 3.5d | Phase 1 |
| Phase 3 | Sprint 2 方法论 | analyst | 1d | Phase 2 |

---

## Phase 1: Sprint 0 止血 (Day 1-2)

### F1.1: page.test.tsx 4 预存失败修复

**任务卡**:
```
任务: F1.1 page.test.tsx 预存失败修复
文件: src/__tests__/page.test.tsx
负责人: dev
工时: 1h
验收: npm test -- --testPathPattern="page.test.tsx" 全套件 PASS
```

**步骤**:
1. `npm test -- --testPathPattern="page.test.tsx" --verbose` 复现 4 个失败
2. 分析根因：axios mock interceptors 问题
3. 修复 mock 逻辑（参考 axios-mock-interceptor 提案）
4. 验证全套件 PASS
5. 提交 commit，PR review

**检查清单**:
- [ ] 4 个失败全部修复
- [ ] `npm test -- --testPathPattern="page.test.tsx"` 绿色
- [ ] CI pipeline 通过

---

### F1.2: ErrorBoundary 组件去重

**任务卡**:
```
任务: F1.2 ErrorBoundary 去重
文件: src/components/ErrorBoundary/（保留）/ src/legacy/ErrorBoundary.tsx（删除）
负责人: dev
工时: 0.5d
验收: grep -r "ErrorBoundary" src/ 结果≤2 处
```

**步骤**:
1. `find . -name "*.tsx" -exec grep -l "ErrorBoundary" {} \;` 定位所有引用
2. 确认保留版本（优先选择功能更完整的）
3. 删除重复版本
4. 更新所有引用到保留版本
5. 全量测试验证无回归

**检查清单**:
- [ ] 仅 1 份 ErrorBoundary 实现
- [ ] 所有引用已更新
- [ ] 全套件测试 PASS

---

### F1.3: task_manager 挂起修复

**任务卡**:
```
任务: F1.3 task_manager 挂起修复
文件: scripts/task_manager.py
负责人: dev
工时: 2-4h
验收: python3 task_manager.py health 响应 < 3s，无 timeout 错误
```

**步骤**:
1. 复现挂起场景（并发调用 / 大文件写入）
2. 添加 filelock 文件锁（超时 5s）
3. 所有 subprocess 添加 timeout=3 参数
4. coord-state.json 写入改为原子操作（临时文件 + rename）
5. 并发测试验证无数据损坏

**关键代码**:
```python
import filelock

@contextmanager
def safe_state_lock():
    lock = filelock.FileLock("/tmp/task_manager.lock", timeout=5)
    try:
        lock.acquire()
        yield
    except filelock.Timeout:
        raise TimeoutError("Could not acquire lock in 5s")
    finally:
        lock.release()
```

**检查清单**:
- [ ] `health` 命令响应 < 3s
- [ ] 并发 3 实例无数据损坏
- [ ] 超时有明确错误信息

**依赖**: 无（最优先修复，解锁后续任务）

---

## Phase 2: Sprint 1 稳定 (Day 3-5)

### F2.1: heartbeat 幽灵任务修复

**任务卡**:
```
任务: F2.1 heartbeat 幽灵任务修复
文件: scripts/heartbeat/*.sh
负责人: dev
工时: 0.5d
验收: openclaw heartbeat 无"幽灵任务"报告
```

**步骤**:
1. 定位 heartbeat 扫描逻辑
2. 添加目录存在性预检
3. 全量测试验证

**检查清单**:
- [ ] 无幽灵任务误报
- [ ] 正常任务仍被正确报告

---

### F2.2: dedup 生产验证

**任务卡**:
```
任务: F2.2 dedup 生产验证
文件: scripts/proposer-dedup.sh
负责人: dev + tester
工时: 2d
验收: proposals/20260324 和 proposals/20260325 上 dedup 无漏报/误报
```

**步骤**:
1. 在 proposals/20260324 上运行 dedup，记录输出
2. 在 proposals/20260325 上运行 dedup，记录输出
3. 手动交叉验证（analyst 参与）
4. 确认无敏感信息泄露
5. 建立回归测试脚本

**检查清单**:
- [ ] 无漏报（真提案未被过滤）
- [ ] 无误报（假提案未被漏过）
- [ ] 敏感信息不泄露

---

### F2.3: confirmationStore 拆分重构

**任务卡**:
```
任务: F2.3 confirmationStore 拆分重构
文件: src/stores/confirmationStore.ts → src/stores/slices/
负责人: dev + architect（架构指导）
工时: 1.5d
验收: confirmationStore.ts ≤ 200 行，所有测试 PASS
```

**步骤**:

**Step 1: 现状分析（0.25d）**
- 统计现有 action 数量和行数分布
- 识别 slice 边界（ui/data/logic）
- 建立重构前后行为对比测试用例

**Step 2: Slice 实现（0.5d）**
```
src/stores/
├── confirmationStore.ts          # 入口（~30 行）
├── slices/
│   ├── uiSlice.ts                # ~40 行
│   ├── dataSlice.ts              # ~50 行
│   └── logicSlice.ts             # ~30 行
```

**Step 3: 集成与向后兼容（0.25d）**
- create() 合并所有 slice
- 验证所有 `useConfirmationStore()` 调用点无需修改

**Step 4: 测试验证（0.25d）**
- 运行单元测试
- 全套件测试 PASS
- 行数验证 ≤ 200

**Step 5: 代码审查（0.25d）**
- reviewer 确认架构合理性
- 确认向后兼容策略

**检查清单**:
- [ ] confirmationStore.ts 总行数 ≤ 200
- [ ] 所有 `useConfirmationStore()` 调用点无需修改
- [ ] vitest run src/stores/confirmationStore PASS
- [ ] 审查通过

---

### F2.4: 提案执行追踪机制

**任务卡**:
```
任务: F2.4 提案执行追踪机制
文件: proposals/EXECUTION_TRACKER.md
负责人: pm
工时: 0.5d
验收: EXECUTION_TRACKER.md 包含全部 P0-P1 提案状态
```

**步骤**:
1. 建立 EXECUTION_TRACKER.md 格式
2. 填入所有 P0-P1 提案状态
3. 建立更新规范（每 48h 更新或任务完成后更新）

**检查清单**:
- [ ] 文件存在且格式正确
- [ ] 包含全部 P0-P1 提案
- [ ] 每条记录有负责人和预计工时

---

## Phase 3: Sprint 2 方法论 (Day 6-10)

### F3.1: 提案模板标准化

**任务卡**:
```
任务: F3.1 提案模板标准化
文件: proposals/TEMPLATE.md
负责人: analyst
工时: 0.5d
验收: TEMPLATE.md 符合规范，包含 P0-P3 标注 + expect() 断言
```

### F3.2: 跨 Agent 聚类分析规范

**任务卡**:
```
任务: F3.2 跨 Agent 聚类分析规范
文件: proposals/METHODOLOGY.md
负责人: analyst
工时: 0.5d
验收: METHODOLOGY.md 描述 4 个聚类维度的分析流程
```

---

## 资源分配

| 角色 | 任务 | 工时 |
|------|------|------|
| dev | F1.1 + F1.2 + F1.3 + F2.1 + F2.2(半) + F2.3 | ~5.5d |
| tester | F2.2(半) | 1d |
| architect | F2.3 架构指导 | 0.5d |
| analyst | F3.1 + F3.2 | 1d |
| pm | F2.4 | 0.5d |

---

## 风险缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Dev 瓶颈 | 延期 | F2.2 tester 主导验证；F2.3 architect 协助 |
| confirmationStore 重构破坏风险 | 功能回归 | 全量测试 + 灰度切换 + 向后兼容接口 |
| task_manager 修复不完整 | 阻塞后续 | 优先修复，health 命令验证后再推进 |

---

*Architect Agent | 2026-03-29 17:20 GMT+8*
