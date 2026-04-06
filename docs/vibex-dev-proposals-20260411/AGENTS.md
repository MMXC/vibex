# AGENTS.md: vibex-dev-proposals

**项目**: vibex-dev-proposals-20260411

---

## 开发约束

### 禁止
- [ ] 禁止引入新的 console.log/console.error
- [ ] 禁止新增未处理的 TODO
- [ ] 禁止 ai-service JSON 解析无降级兜底

### 必须
- [ ] 所有 logger 调用包含 LogContext
- [ ] JSON 解析必须有三级降级
- [ ] 每批修改后运行单元测试

---

## 验收检查清单

- [ ] `grep console.log connectionPool.ts == 0`
- [ ] `grep "as any" src/ == 0`（不含测试文件）
- [ ] ai-service JSON 降级单元测试 100% 通过
- [ ] connectionPool 熔断测试覆盖
