# AGENTS.md — 开发约束

**项目**: vibex-tester-proposals-vibex-build-fixes-20260411
**角色**: Architect
**日期**: 2026-04-11

---

## 1. 变更范围约束

**允许操作**:
- ✅ 修改 CI/CD 配置
- ✅ 新建检查脚本
- ✅ 更新 ESLint 配置
- ✅ 删除孤立文件

**禁止操作**:
- ❌ 修改业务逻辑
- ❌ 修改 API 接口
- ❌ 删除 CI 门禁步骤

## 2. 质量门槛

| 检查项 | 门槛 |
|--------|------|
| TypeScript | 退出码 0 |
| ESLint | 无 error |
| 构建 | 退出码 0 |
