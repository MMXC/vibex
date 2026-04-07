# Epic 4: 依赖安全加固 — Spec

**Epic ID**: E4
**优先级**: P0
**工时**: 0.5h
**页面集成**: package.json / npm dependencies

---

## 功能点列表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|-------|------|---------|---------|
| E4-S1 | DOMPurify 版本管控 | 在 `package.json` 添加 `overrides`，固定 monaco-editor 间接依赖 dompurify 为 3.3.3 | `expect(execSync('npm ls dompurify').toString()).toContain('3.3.3')`；`expect(execSync('npm audit', { encoding: 'utf-8' })).not.toMatch(/dompurify.*vulnerability/)` | package.json |

---

## 详细验收条件

### E4-S1: DOMPurify 版本管控

- [ ] `package.json` 包含 `overrides` 字段
- [ ] `overrides` 中指定 dompurify 版本为 3.3.3
- [ ] `npm ls dompurify` 输出显示 3.3.3
- [ ] `npm audit` 无 dompurify 相关漏洞
- [ ] `npm install` 后 monaco-editor 依赖的 dompurify 确实为 3.3.3

---

## 实现注意事项

1. **版本锁定**：overrides 字段可强制统一间接依赖版本
2. **持续监控**：将 `npm audit` 加入 CI pipeline，每次 PR 自动检查
3. **定期更新**：每季度检查一次 dompurify 是否有新补丁版本
