# F3: 后端旧路由废弃规格说明

**功能域**: 删除 `/app/api/canvas/` 旧路由目录  
**PRD ID**: F3  
**状态**: 待开发

---

## 1. 规格详情

### F3.1 依赖扫描（必须先执行）

**规格要求**:
- 在删除任何旧路由前，必须全库搜索 `/api/canvas/`（不含 v1）的所有引用
- 搜索范围: `.ts`, `.tsx`, `.js`, `.jsx` 文件
- 确认无外部依赖（前端、测试文件、配置文件）后再进行删除

**验证命令**:
```bash
# 全库搜索旧路由引用（应无结果）
grep -r "/api/canvas" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . | grep -v "/v1/canvas" | grep -v "node_modules"
# 期望结果: 无输出

# 确认旧路由目录存在
find . -path "*/app/api/canvas" -type d | head -5
```

**必须满足条件**:
1. 全库无 `/api/canvas/`（不含 v1）引用
2. 旧路由目录存在

---

### F3.2 旧路由目录删除

**规格要求**:
- 删除 `/app/api/canvas/` 目录（确认无外部依赖后）
- 可选: 保留一个空占位文件 `_deprecated.ts` 作为文档标记
  ```typescript
  // _deprecated.ts
  // This directory is deprecated. All routes have been moved to /api/v1/canvas/
  // Removed on: 2026-03-29
  export {};
  ```

**验证命令**:
```bash
# 确认目录已删除或仅保留占位文件
find . -path "*/app/api/canvas" -type d
# 期望结果: 无常规文件目录（仅可能有占位文件）
```

---

### F3.3 v1 路由功能验证

**规格要求**:
- 验证所有 7 个 v1 端点响应正常
- 端点列表:

| 端点 | 路径 | 方法 |
|------|------|------|
| contexts | `/api/v1/canvas/generate-contexts` | POST |
| flows | `/api/v1/canvas/generate-flows` | POST |
| components | `/api/v1/canvas/generate-components` | POST |
| generate | `/api/v1/canvas/generate` | POST |
| project | `/api/v1/canvas/project` | GET |
| status | `/api/v1/canvas/status` | GET |
| export | `/api/v1/canvas/export` | POST |

**验证方法**:
1. 启动本地 dev server: `npm run dev`
2. 访问各端点，确认返回 `{success, data, error?}` 结构
3. 运行 Canvas E2E 测试验证完整流程

---

## 2. 相关文件

| 文件路径 | 操作 |
|----------|------|
| `app/api/canvas/` | 删除（或保留占位文件） |
| `app/api/v1/canvas/` | 保留，确认功能正常 |

---

## 3. 验收标准

| ID | 验收标准 | 验证方法 |
|----|----------|----------|
| AC-3.1 | 全库无旧路由引用 | `grep` 验证 |
| AC-3.2 | 旧路由目录已删除 | `find` 验证 |
| AC-3.3 | 7 个 v1 端点响应正常 | API 测试 |
| AC-3.4 | API 响应格式一致 | 抽样检查响应结构 |

---

## 4. 风险缓解

**高风险操作**: 删除旧路由目录是不可逆操作

**缓解措施**:
1. ✅ 确认 git 已提交最新代码
2. ✅ 备份旧路由目录（git 历史可恢复）
3. ✅ 先在本地环境测试，确认功能正常后再部署
4. ✅ 使用 `git mv` 移动目录而非直接删除（保留历史）
