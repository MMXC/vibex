# E3: Import/Export E2E 覆盖

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | Teams API E2E 验证 | ✅ | — | `/teams` 页面关键路径 Playwright E2E 通过 |
| E3-U2 | JSON round-trip E2E 测试 | ✅ | — | 导出 → 删除 → 导入，JSON 内容完全一致 |
| E3-U3 | YAML round-trip E2E 测试 | ✅ | — | 含特殊字符 round-trip 无转义丢失 |
| E3-U4 | 5MB 文件大小限制前端拦截 | ✅ | — | 文件 > 5MB 显示正确错误提示 |

### E3-U1 详细说明

**文件变更**：`vibex-fronted/e2e/teams-api.spec.ts`

**实现步骤**：已由上一轮 dev 完成。覆盖 Teams API CRUD 端点 + 页面渲染。

**E2E 测试用例**：5 个测试（`test(` 出现 5 次）
- GET /v1/teams 返回团队列表
- POST /v1/teams 创建团队
- GET /v1/teams/:id 获取团队详情
- DELETE /v1/teams/:id 删除团队
- /dashboard/teams 页面渲染

**Status**：✅ 完成于 a7f0ce9e2

---

### E3-U2 详细说明

**文件变更**：`vibex-fronted/e2e/json-export-import.spec.ts`

**E2E 测试用例**：7 个测试
- 非法 JSON 返回 400 错误
- UTF-8 中文 round-trip 保留
- 嵌套对象结构保留
- 导出字段完整性（对比 key 列表）
- 导出/导入字段顺序一致性
- JSON 导出格式正确（数组/对象）
- 导入覆盖逻辑

**Status**：✅ 完成于 a7f0ce9e2

---

### E3-U3 详细说明

**文件变更**：`vibex-fronted/e2e/yaml-export-import.spec.ts`

**E2E 测试用例**：
- YAML 特殊字符保留（冒号/井号/管道符）
- 多行块字面量（literal block | 和 folded >）
- Unicode（中文、emoji）正确处理
- YAML 导出格式正确

**Status**：✅ 完成于 a7f0ce9e2

---

### E3-U4 详细说明

**文件变更**：`vibex-fronted/e2e/import-size-limit.spec.ts`

**前端实现**：`vibex-fronted/src/lib/import-export/api.ts` 中已实现 `validateFile()` 函数

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```

**E2E 测试用例**：8 个测试
- validateFile 拒绝 > 5MB 文件
- validateFile 接受 < 5MB 文件
- 边界值: 5MB 接受
- 边界值: 5MB+1KB 拒绝
- 错误提示文案正确
- 重试后可正常导入
- 多个文件顺序处理

**Status**：✅ 完成于 a7f0ce9e2

---

## 依赖关系总图

```
E3-U1, E3-U2, E3-U3, E3-U4（可并行）
```
