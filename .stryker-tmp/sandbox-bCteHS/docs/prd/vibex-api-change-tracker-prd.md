# PRD - VibeX API 变更追踪机制

**项目代号**: vibex-api-change-tracker-impl  
**状态**: In Progress  
**创建时间**: 2026-03-06  
**负责人**: PM Agent  

---

## 1. 功能需求 (Functional Requirements)

### 1.1 核心功能

| 功能点 | 描述 | 优先级 |
|-------|------|-------|
| OpenAPI 文档生成 | 自动从代码生成 OpenAPI 3.0 规范文档 | P0 |
| 变更检测 | 使用 openapi-diff 检测 API 变更 | P0 |
| CI/CD 集成 | 在 CI/CD 流程中集成变更检测 | P0 |
| 变更通知 | 检测到 Breaking Changes 时通知相关人 | P1 |
| 变更报告 | 生成可视化变更报告 | P1 |

### 1.2 用户故事

#### Epic 1: OpenAPI 文档管理

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-001 | OpenAPI 文档自动生成 | 代码变更时自动生成 OpenAPI 文档 |
| US-002 | 版本化管理 | 每次生成带版本号的 OpenAPI 文档 |
| US-003 | 文档存储 | OpenAPI 文档存储在指定目录 |

#### Epic 2: API 变更检测

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-010 | Baseline 文档设置 | 首次运行设置基线版本文档 |
| US-011 | 变更对比 | 对比当前与基线文档，输出变更报告 |
| US-012 | Breaking Change 检测 | 识别并标记 Breaking Changes |
| US-013 | 变更类型分类 | 区分新增/修改/删除/废弃变更 |

#### Epic 3: CI/CD 集成

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-020 | GitHub Actions 集成 | 在 PR 中自动运行变更检测 |
| US-021 | 检查结果输出 | CI 输出清晰的检查结果 |
| US-022 | 构建阻塞 | Breaking Changes 阻止合并 (可选) |

#### Epic 4: 通知与报告

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-030 | PR 评论通知 | 在 PR 中评论变更摘要 |
| US-031 | 变更报告生成 | 生成 Markdown 格式变更报告 |
| US-032 | Webhook 通知 (可选) | 支持发送到外部系统 |

---

## 2. UI/UX 交互流程

### 2.1 开发者工作流

```
代码变更 → Push/PR → CI 触发 → OpenAPI 生成 → 变更对比 → 结果输出
                                                        ↓
                                              ┌─────────┴─────────┐
                                              ↓                   ↓
                                        ✅ 通过合并            ❌ 阻止合并
                                              ↓                   ↓
                                        PR 评论变更摘要       通知相关人
```

### 2.2 文件结构

```
vibex-backend/
├── openapi/
│   ├── baseline.yaml       # 基线版本
│   ├── versions/          # 版本历史
│   │   ├── v1.0.0.yaml
│   │   └── v1.0.1.yaml
│   └── current.yaml       # 当前版本
├── .github/
│   └── workflows/
│       └── api-change-detect.yml
├── scripts/
│   ├── generate-openapi.ts
│   └── detect-changes.ts
└── reports/
    └── change-reports/    # 变更报告
```

---

## 3. Epics 拆分 (业务级)

| Epic | 名称 | 描述 | 工作量 |
|------|------|------|-------|
| Epic 1 | OpenAPI Generation | OpenAPI 文档自动生成 | 2h |
| Epic 2 | Change Detection | openapi-diff 变更检测集成 | 2h |
| Epic 3 | CI Integration | GitHub Actions 集成 | 1h |
| Epic 4 | Notification | PR 评论和通知 | 1h |

---

## 4. 非功能需求 (Non-Functional Requirements)

| 需求类型 | 要求 |
|---------|------|
| 性能 | 变更检测 < 30s |
| 可靠性 | 检测结果准确率 > 95% |
| 可维护性 | 配置简单，易于扩展 |
| 兼容性 | 支持 OpenAPI 3.0 |

---

## 5. 验收标准 (可写 expect() 断言)

### 5.1 OpenAPI 生成验收

```typescript
// OpenAPI 文档生成
expect(fs.existsSync('openapi/current.yaml')).toBe(true)
expect(yaml.parse(openapiDoc).openapi).toBe('3.0.3')
expect(yaml.parse(openapiDoc).paths).toBeDefined()
expect(yaml.parse(openapiDoc).components.schemas).toBeDefined()

// 版本化管理
const versions = fs.readdirSync('openapi/versions')
expect(versions.length).toBeGreaterThan(0)
```

### 5.2 变更检测验收

```typescript
// 变更对比
const result = await runOpenApiDiff(baselinePath, currentPath)
expect(result.compatible).toBe(true) // 或 false 根据实际变更

// Breaking Change 检测
const breakingChanges = result.changes.filter(c => c.type === 'breaking')
expect(breakingChanges.length).toBe(0) // PR 不应包含 Breaking Changes

// 变更类型分类
expect(result.changes).toContainEqual(
  expect.objectContaining({ type: 'added' | 'modified' | 'removed' | 'deprecated' })
)
```

### 5.3 CI 集成验收

```yaml
# .github/workflows/api-change-detect.yml
# 验收: Workflow 正确执行
expect(workflowRun.status).toBe('success')
expect(workflowRun.conclusion).toBe('success')

# PR 评论存在
expect(prComments).toContain('API Change Detection Report')
```

### 5.4 通知验收

```typescript
// PR 评论内容
const prComment = await getPRComment()
expect(prComment.body).toContain('API Changes Summary')
expect(prComment.body).toContain('Breaking Changes: 0')

// 变更报告文件存在
expect(fs.existsSync('reports/change-reports/v1.0.0-v1.0.1.md')).toBe(true)
```

---

## 6. 风险与依赖

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| openapi-diff 兼容性 | 中 | 提前测试，备用方案 |
| 检测误报 | 中 | 人工复核机制 |
| CI 时间增加 | 低 | 优化检测性能 |

---

*PRD 创建完成于 2026-03-06 20:30 (Asia/Shanghai)*
