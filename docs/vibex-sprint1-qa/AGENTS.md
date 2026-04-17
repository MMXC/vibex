# AGENTS.md — vibex-sprint1-qa

**项目**: vibex-sprint1-qa
**版本**: 1.0
**日期**: 2026-04-17
**角色**: Architect

---

## 开发约束总览

所有参与本 Sprint QA 的 Agent 必须遵守以下约束。

---

## G1: QA 执行优先级（强制）

### G1.1 必须按顺序执行

```
① 静态验证（U2/U3/U12/U13/U14）→ 可随时执行，无需 dev server
② 编译与测试（U3/U4）→ Vitest 验证
③ dev server 启动（U1/U5）→ DEF-03 解除
④ 交互验证（U8-U11）→ gstack browse，依赖 dev server
⑤ 缺陷修复（U6/U7）→ 覆盖率提升 + Edge UI 验证
```

**禁止**跳步：gstack browse 交互验证（U8-U11）必须等 dev server 启动后才执行。

### G1.2 QA 阻塞条件

| 阻塞项 | 解除条件 |
|--------|---------|
| DEF-03（dev server 未运行）| U1 dev server 启动成功 |
| DEF-02（ProtoFlowCanvas 覆盖率 < 15）| U6 新增 7+ tests |
| DEF-01（Edge UI 未验证）| U7 gstack browse QA5 通过 |

---

## G2: gstack browse 使用规范（强制）

### G2.1 环境变量（必须设置）

```bash
export CI=true
export BROWSE_SERVER_SCRIPT=/root/.openclaw/gstack/browse/src/server.ts
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright
```

### G2.2 常用命令速查

| 场景 | 命令 |
|------|------|
| 打开页面 | `goto <url>` |
| 元素快照 | `snapshot -i` |
| 按引用点击 | `click @eX` |
| 填表单 | `fill @eX "value"` |
| 断言可见 | `is visible <selector>` |
| 断言隐藏 | `is hidden <selector>` |
| 截图 | `screenshot [path]` |
| 拖拽 | `drag @eX @eY` |
| 等待元素 | `waitForSelector <selector> --timeout=15000` |
| 控制台日志 | `console` |

### G2.3 超时设置

```bash
# dev server 首次加载可能需要 10-15s
$BROWSER waitForSelector ".react-flow" --timeout=15000

# Vitest 正常运行 30s
pnpm vitest run --reporter=verbose --passWithNoTests
```

---

## G3: dev server 管理规范

### G3.1 启动

```bash
# 禁止直接 pnpm dev（后台运行会丢失）
cd vibex-fronted && pnpm dev > /tmp/vibex-dev.log 2>&1 &
sleep 15

# 健康检查
curl -sf http://localhost:3000/prototype/editor > /dev/null && echo "OK" || {
  echo "Server failed, check log:"
  tail -50 /tmp/vibex-dev.log
  exit 1
}
```

### G3.2 关闭

```bash
# 完成后关闭，释放端口
pkill -f "next dev" || true
```

### G3.3 端口冲突处理

```bash
# 检查端口占用
lsof -i :3000 | grep LISTEN

# 如有冲突，kill 后重试
kill $(lsof -t -i:3000) 2>/dev/null || true
sleep 2
pnpm dev &
```

---

## G4: Vitest 测试规范

### G4.1 运行命令

```bash
# 全部测试
pnpm vitest run --reporter=verbose

# 单文件
pnpm vitest run src/stores/prototypeStore.test.ts --reporter=verbose
pnpm vitest run src/components/prototype/__tests__/ProtoFlowCanvas.test.tsx --reporter=verbose

# watch 模式（开发时）
pnpm vitest run --watch
```

### G4.2 覆盖率目标

| 文件 | 当前测试数 | 目标测试数 | 差距 |
|------|-----------|-----------|------|
| prototypeStore.test.ts | 17 | 17 | ✅ 达标 |
| ProtoFlowCanvas.test.tsx | 8 | 15+ | ⚠️ +7 |
| ProtoAttrPanel.test.tsx | 5 | 5 | ✅ 达标 |
| ComponentPanel.test.tsx | 16 | 16 | ✅ 达标 |
| ProtoNode.test.tsx | 18 | 18 | ✅ 达标 |
| **合计** | **64** | **71+** | **+7** |

### G4.3 新增测试规范

- 每个 `it()` 必须有清晰的场景描述
- 优先覆盖 store 层逻辑（mock Zustand store）
- UI 组件测试使用 `@testing-library/react`
- 禁止用 `act()` 包裹 store 副作用测试

---

## G5: QA 报告输出规范

### G5.1 完成后报告格式

```
[QA] ✅ Sprint1 Prototype Canvas 验证完成

日期: YYYY-MM-DD HH:MM
项目: vibex-sprint1-qa

静态验证:
✅ QA1: 12/12 文件完整
✅ QA2: TypeScript 编译 0 error
✅ QA9: .next/ + storybook-static/ 存在
✅ QA10: 架构重组合理
✅ QA11: ErrorBoundary 已实现

Vitest 测试:
✅ QA3: 64 tests passed
✅ QA4: prototypeStore 17 tests，含 addEdge/removeEdge

交互验证（gstack browse）:
✅ QA5: Edge 连线 UI 可用
✅ QA6: 拖拽节点交互正常
✅ QA7: RoutingDrawer 页面管理正常
✅ QA8: ProtoAttrPanel 属性编辑正常
✅ QA12: ProtoFlowCanvas 覆盖率 15+ tests

缺陷追踪:
✅ DEF-01: Edge UI 验证通过
✅ DEF-02: 覆盖率提升至 15+
✅ DEF-03: dev server 已启动
⚠️ DEF-04: 跨 repo addEdge 来源（Monitor）

结论: Sprint1 QA 通过，可进入下一阶段。
```

---

## G6: 回归测试规范

QA 通过后，每次 Sprint 变更前必须运行：

```bash
# 快速冒烟
pnpm tsc --noEmit
pnpm vitest run

# 可选：gstack browse 冒烟
# （仅在有 UI 变更时执行）
```

**禁止**：跳过 Vitest 直接进行 gstack browse 验证。

---

## G7: 文件路径规范

| 场景 | 路径规则 |
|------|---------|
| QA 脚本 | `docs/vibex-sprint1-qa/run-qa.sh` |
| dev server 脚本 | `vibex-fronted/scripts/start-dev-server.sh` |
| 测试文件 | `vibex-fronted/src/**/*.test.{ts,tsx}` |
| QA 报告 | `docs/vibex-sprint1-qa/qa-report-<date>.md` |

---

## G8: PR 合并规范

- Sprint1 QA 通过前不允许合并新的 Sprint2 功能分支（协调决定）
- DEF-02 覆盖率修复作为独立 PR，标题：`fix: ProtoFlowCanvas test coverage 8→15+`
- 回归测试失败 → 阻塞 PR 合并

---

## G9: 文档更新规范

每个 QA 任务完成后：
- [ ] 更新 `docs/vibex-sprint1-qa/qa-report-<date>.md`
- [ ] 如果发现新缺陷，追加到 PRD 缺陷追踪表（DEF-05 等）
- [ ] 如果修改了测试文件，同步更新 `AGENTS.md` 中的测试数统计
