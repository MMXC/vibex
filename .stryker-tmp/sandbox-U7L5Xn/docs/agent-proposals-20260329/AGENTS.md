# AGENTS.md — VibeX Agent 提案汇总开发约束

**项目**: agent-proposals-20260329  
**版本**: 1.0  
**最后更新**: 2026-03-29

---

## Dev 开发约束

### 通用约束

1. **强制使用 gstack 技能**：`/browse` 或 `/qa` 验证问题真实性后再开始修复
2. **CI 绿色原则**：所有修改必须保证 `npm test` 全套件通过后再提交
3. **小步提交**：每项任务（ F1.1 / F1.2 / F1.3 等）单独 commit，方便回滚

### F1.1 — page.test.tsx 修复

**约束**:
- 先复现 4 个失败，再用 gstack browse 确认问题可观测
- 修复必须对 axios mock interceptors 行为做说明注释
- 修复后运行完整测试套件确认无新引入

**禁止**:
- 禁止跳过任何测试用例
- 禁止注释掉失败用例（必须真正修复）

### F1.2 — ErrorBoundary 去重

**约束**:
- 保留功能最完整的版本
- 删除前必须确认所有引用已迁移
- 删除后全量测试验证无遗漏

**禁止**:
- 禁止在组件内 inline 实现 ErrorBoundary（必须复用）

### F1.3 — task_manager 修复

**约束**:
- 所有 subprocess 调用必须带 timeout 参数
- 文件锁必须设置超时（5s），超时后抛出明确错误
- coord-state.json 写入使用原子操作（临时文件 + rename）
- 修改后必须进行并发测试（3 个实例同时执行）

**代码规范**:
```python
# ✅ 正确
import filelock
with filelock.FileLock("/tmp/task_manager.lock", timeout=5):
    ...

# ✅ 正确
subprocess.run(cmd, timeout=3)

# ✅ 正确
temp = f"{path}.tmp"
with open(temp, 'w') as f: f.write(data)
os.rename(temp, path)  # 原子操作

# ❌ 禁止
subprocess.run(cmd)  # 无超时
with open(path, 'a') as f: f.write(data)  # 非原子
```

### F2.1 — heartbeat 幽灵任务修复

**约束**:
- 扫描任务文件前必须验证目录存在
- 脚本必须有 `--dry-run` 选项方便测试

### F2.3 — confirmationStore 重构

**约束**:
- 使用 Zustand v4 slice pattern（`create(...slice)` 模式）
- **禁止修改任何 `useConfirmationStore()` 调用点**
- 每个 slice 独立导出类型和初始状态
- 主文件（confirmationStore.ts）只做 slice 合并，**不超过 50 行**
- 保留旧接口作为 alias，3 周后删除

**代码规范**:
```typescript
// ✅ 正确: slice 独立
export const uiSlice = (set, get) => ({
  showConfirm: false,
  openConfirm: (type) => set({ showConfirm: true, modalType: type }),
  ...
});

// ✅ 正确: 主文件做合并
export const useConfirmationStore = create(
  devtools((...a) => ({
    ...uiSlice(...a),
    ...dataSlice(...a),
    ...logicSlice(...a),
  }))
);

// ❌ 禁止: 主文件写业务逻辑
// ❌ 禁止: 修改调用点 useConfirmationStore(state => state.xxx)
```

**测试规范**:
- 必须有向后兼容测试：`useConfirmationStore()` 返回所有原有属性
- 必须有 slice 独立测试：每个 slice 的 action 行为正确
- 覆盖率要求：> 80%

---

## Tester 检查清单

### F1.1 验收检查
- [ ] `npm test -- --testPathPattern="page.test.tsx"` 全套件 PASS
- [ ] CI pipeline 绿色
- [ ] 无新引入的测试跳过或注释

### F1.2 验收检查
- [ ] `grep -r "ErrorBoundary" src/` 结果≤2 处
- [ ] 全套件测试 PASS

### F1.3 验收检查
- [ ] `python3 task_manager.py health` 响应 < 3s
- [ ] 并发 3 实例无数据损坏
- [ ] 超时有明确错误信息

### F2.1 验收检查
- [ ] `openclaw heartbeat` 无"幽灵任务"误报
- [ ] 正常任务仍被正确报告

### F2.2 验收检查
- [ ] dedup 在 proposals/20260324 上无漏报/误报
- [ ] dedup 在 proposals/20260325 上无漏报/误报
- [ ] 敏感信息不泄露

### F2.3 验收检查
- [ ] `confirmationStore.ts` 总行数 ≤ 200
- [ ] `vitest run src/stores/confirmationStore` PASS
- [ ] 向后兼容：所有调用点无需修改
- [ ] `grep -r "useConfirmationStore" src/` 所有引用点测试通过

---

## Code Review 清单

### 通用审查项
- [ ] TypeScript 零错误（`npx tsc --noEmit`）
- [ ] ESLint 零警告（`npm run lint`）
- [ ] 测试覆盖率报告存在
- [ ] 无硬编码敏感信息

### F1.3 专项审查
- [ ] 所有 subprocess 调用有 timeout
- [ ] 文件锁有超时处理
- [ ] coord-state.json 写入是原子操作
- [ ] 并发测试通过

### F2.3 专项审查
- [ ] 主文件 ≤ 50 行
- [ ] slice 文件各自独立，无循环依赖
- [ ] 向后兼容测试存在且 PASS
- [ ] 覆盖率 > 80%

---

## 禁止事项（红线）

1. ❌ 禁止跳过测试或注释掉失败用例
2. ❌ 禁止修改 `useConfirmationStore()` 调用点
3. ❌ confirmationStore.ts 主文件禁止写业务逻辑
4. ❌ 禁止在生产环境测试（dedup 验证必须用历史数据）
5. ❌ task_manager 禁止不带超时调用 subprocess

---

*Architect Agent | 2026-03-29 17:20 GMT+8*
