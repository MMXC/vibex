# AGENTS.md — vibex-proposals-20260405-final 开发约束

**项目**: vibex-proposals-20260405-final
**日期**: 2026-04-05
**仓库**: /root/.openclaw/vibex

---

## 1. 文档规范

### 1.1 proposals/index.md 格式

```markdown
| Epic | 提案 | 状态 | 派发时间 | 完成时间 |
|------|------|------|---------|---------|
```

- **状态枚举**: `🔄 ready` / `🔧 in-progress` / `✅ done` / `❌ rejected` / `⏸️ blocked`
- **时间格式**: `YYYY-MM-DD HH:MM` 或 `-`（未完成时）

### 1.2 proposals/canvas-api-tracker.md 格式

```markdown
| 端点 | 方法 | 状态 | 最后更新 | 负责人 |
|------|------|------|---------|---------|
```

---

## 2. Git 提交规范

```bash
docs(proposals): 创建 canvas-api-tracker.md 追踪文档
docs(proposals): 更新 proposals/index.md Sprint 5 追踪
feat(quality): proposals 提案质量门禁脚本
```

---

## 3. 代码审查清单

### E1
- [ ] `canvas-api-tracker.md` 包含所有 4 个端点
- [ ] 覆盖率计算正确

### E2
- [ ] `index.md` 包含今天所有提案（≥6条）
- [ ] 状态 emoji 使用正确

### E3
- [ ] `quality_gate.py` 纯函数无副作用
- [ ] `TEMPLATE.md` 包含所有强制章节

---

*本文档由 Architect Agent 生成于 2026-04-05 03:33 GMT+8*
