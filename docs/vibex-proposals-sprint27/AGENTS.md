# VibeX Sprint 27 — 开发约束

**Agent**: architect
**日期**: 2026-05-07
**项目**: vibex-proposals-sprint27

---

## 1. 开发规范

### 1.1 代码规范

- **TS 配置**: `strict: true`，所有新文件 TS 编译 0 errors
- **代码风格**: ESLint + Prettier（现有配置），提交前必须 lint
- **分支命名**: `feature/sprint27/<proposal>-<story>`（如 `feature/sprint27/p002-virtualized-list`）
- **Commit 规范**: `feat|sfix|docs|test: <描述>`，参考 Conventional Commits

### 1.2 测试规范

- **覆盖率**: 核心业务逻辑 ≥ 80%，React 组件 ≥ 60%
- **E2E**: 所有新功能必须覆盖 Playwright E2E 测试
- **性能测试**: P002 需 Lighthouse CI 集成，Score ≥ 85
- **回归**: 每次 PR 必须通过现有测试套件

### 1.3 评审规范

- **PR 规模**: 单个 PR ≤ 400 行修改，超出需拆分
- **Reviewer**: 至少 1 人 Code Review 通过才能合并
- **Critical Path**: P001 和 P003 需 Architect 审批

---

## 2. 环境配置

### 2.1 开发环境

```bash
# .env.local（前端）
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_OPENAI_API_KEY=

# .env.staging（后端）
FIREBASE_DATABASE_URL=
FIREBASE_API_KEY=
OPENAI_API_KEY=sk-...
LLM_TIMEOUT_MS=30000
TEMPLATE_STORAGE_PATH=./data/templates
```

### 2.2 Firebase 配置（Coord + DevOps 负责）

- **RTDB 规则**: 需配置 presence 路径读写权限
- **凭证管理**: `.env.staging` 由 DevOps 管理，勿提交到 Git

### 2.3 LLM API 配置（Coord 负责）

- **Provider**: OpenAI GPT-4o-mini
- **Key 管理**: 存储在 `.env.staging`，不暴露客户端

---

## 3. 依赖管理

### 3.1 新增依赖

| 依赖 | 版本 | 用途 | 审批 |
|------|------|------|------|
| react-window | 1.8.x | P002 属性面板虚拟化 | Architect 审批 |
| yjs | 13.x | P001 CRDT 冲突处理 | Architect 审批 |
| openai | latest | P003 AI 解析 | Architect 审批 |
| @types/react-window | latest | TS 类型 | 自动通过 |

### 3.2 依赖版本锁定

- 所有依赖锁定到 `package.json`，不使用 `latest`
- 更新依赖需单独 PR + Code Review

---

## 4. 文件路径规范

```
vibex-fronted/src/
├── components/
│   ├── canvas/
│   │   ├── PropertyPanel/
│   │   │   ├── PropertyPanel.tsx        # P002
│   │   │   ├── PropertyList.tsx         # P002 虚拟化
│   │   │   └── PropertyItem.tsx
│   │   ├── PresenceLayer/               # P001
│   │   │   ├── PresenceLayer.tsx
│   │   │   ├── CursorLayer.tsx
│   │   │   └── usePresence.ts
│   │   └── CanvasPage.tsx
│   └── onboarding/
│       ├── ClarifyStep/                 # P003
│       │   ├── ClarifyStep.tsx
│       │   ├── ClarifyAI.tsx
│       │   ├── AIParsePreview.tsx
│       │   └── useAIClarify.ts
│       └── PreviewStep/
│           └── PreviewStep.tsx
├── pages/
│   └── dashboard/
│       └── templates/                    # P004
│           ├── index.tsx
│           ├── TemplateList.tsx
│           └── TemplateForm.tsx
└── hooks/
    └── useTemplates.ts                  # 已存在

vibex-backend/src/
├── routes/
│   ├── templates.ts                     # P004 扩展
│   └── ai.ts                           # P003 新增
├── services/
│   ├── firebase.ts
│   ├── openai.ts                       # P003
│   └── template.ts
└── middleware/
    └── rbac.ts                         # 已存在
```

---

## 5. 接口约定

### 5.1 REST API 规范

- **路径**: `/api/v1/<resource>`（如 `/api/v1/templates`）
- **版本**: 当前 V1，不做版本前缀变更
- **错误格式**:
  ```json
  {
    "error": "VALIDATION_ERROR",
    "message": "模板名称不能为空",
    "details": {}
  }
  ```

### 5.2 状态码规范

| 场景 | 状态码 |
|------|--------|
| 成功创建 | 201 |
| 成功获取 | 200 |
| 成功更新 | 200 |
| 成功删除 | 200 |
| 资源不存在 | 404 |
| 验证失败 | 400 |
| 未授权 | 401 |
| 禁止访问 | 403 |
| 内部错误 | 500 |

### 5.3 AI 接口降级约定

- **超时**: 30s 后降级为纯文本
- **降级标志**: `response.fallback = true` + `response.reason`
- **不抛异常**: 降级过程中静默处理，用户无感知

---

## 6. 性能预算

### 6.1 Bundle 预算

| 指标 | 目标 |
|------|------|
| JS Bundle（未压缩） | ≤ 500KB（当前基线） |
| 首次加载（4G 网络） | ≤ 3s |
| TTI（Time to Interactive） | ≤ 5s |
| Lighthouse Performance | ≥ 85 |

### 6.2 Firebase RTDB 写入频率

- **Presence 更新**: 节流 100ms，最大 10 条/秒
- **节点同步**: 按需，仅变更时同步，批量合并

---

## 7. 安全约束

- **RBAC**: 所有新 API 必须通过 `rbacMiddleware`
- **API Key**: 不暴露在客户端，调用在服务端
- **数据校验**: 所有输入必须 `zod` schema 校验
- **CORS**: 仅允许配置的域名

---

## 8. 部署约束

### 8.1 发布流程

1. Feature Branch → PR → Code Review → 合并到 `develop`
2. `develop` 自动部署到 staging
3. staging 验证通过 → 合并到 `main` → 自动部署到 production

### 8.2 环境变量

- **本地**: `.env.local`（gitignore）
- **Staging**: `.env.staging`（DevOps 管理）
- **生产**: `.env.production`（DevOps 管理）

---

## 9. 团队协作

### 9.1 会议节奏

| 类型 | 频率 | 参与者 |
|------|------|--------|
| Sprint Planning | Sprint 开始 | 全部 |
| Daily Standup | 每天 10:00 | 全部 |
| Code Review | PR 创建时 | 相关开发者 |
| Sprint Review | Sprint 结束 | 全部 |

### 9.2 任务管理

- 使用 `task update <project> <stage> <status>` 更新状态
- 每日 18:00 前更新当日进度
- 阻塞任务立即上报 Coord

### 9.3 知识共享

- 技术决策记录在 `docs/adr/`（Architecture Decision Records）
- Sprint 结束后产出 `docs/vibex-proposals-sprintN/retro.md`

---

## 10. 特殊情况处理

### P001 Firebase 不可用
- 降级到 mock，数据存储在内存
- 标记 `isFallback: true`
- 不影响其他功能

### P003 LLM API 不可用
- 降级为纯文本传递
- UI 显示 "AI 解析超时，已使用原始输入"（可选）
- 不阻断 Onboarding 流程

### P004 模板存储失败
- 返回 500 + 错误信息
- 前端显示友好错误提示
- 不保存脏数据

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint27
- **执行日期**: 2026-05-07