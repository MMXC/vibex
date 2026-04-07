# VibeX 问题知识库

> 记录每个问题的根因、解决方案和防范机制，便于团队查阅和学习

---

## 目录结构

```
knowledge-base/
├── index.md                 # 本索引文件
├── template.md              # 问题文档模板
├── issues/                  # 问题记录 (按 ID 归档)
│   ├── auth-session/        # 认证会话问题
│   ├── state-management/   # 状态管理问题
│   ├── api-integration/    # API 集成问题
│   ├── ui-rendering/       # UI 渲染问题
│   └── performance/        # 性能问题
├── categories/              # 分类索引
│   ├── auth-session.md
│   ├── state-management.md
│   ├── api-integration.md
│   ├── ui-rendering.md
│   └── performance.md
└── prevention-rules/        # 防范规则
    ├── coding-standards.md
    ├── testing-requirements.md
    └── review-checklist.md
```

---

## 分类索引

### 按严重级别

| 级别 | 描述 | 数量 |
|------|------|------|
| P0 | 阻断性问题 | 3 |
| P1 | 重要问题 | 4 |
| P2 | 一般问题 | 0 |
| P3 | 轻微问题 | 0 |

### 按模块

| 分类 | 描述 | 问题数 |
|------|------|--------|
| auth-session | 认证与会话 | 2 |
| state-management | 状态管理 | 0 |
| api-integration | API 集成 | 0 |
| ui-rendering | UI 渲染 | 5 |
| performance | 性能问题 | 0 |

---

## 问题清单

### 按严重级别

#### P0 (阻断性)

| 问题 ID | 标题 | 分类 | 状态 |
|---------|------|------|------|
| KB-ui-001 | 首页路由未重定向到落地页 | ui-rendering | Resolved |
| KB-auth-001 | 登录状态未持久化 | auth-session | Resolved |
| KB-auth-002 | 登录状态和实时预览问题 | auth-session | Resolved |

#### P1 (重要)

| 问题 ID | 标题 | 分类 | 状态 |
|---------|------|------|------|
| KB-ui-002 | 首页布局问题 | ui-rendering | Resolved |
| KB-ui-003 | 缺少预览区域 | ui-rendering | Resolved |
| KB-ui-004 | 首页 UI 功能问题 | ui-rendering | Resolved |
| KB-ui-005 | 首页重构问题 | ui-rendering | Resolved |

---

## 最近更新

| 日期 | 问题 | 分类 |
|------|------|------|
| 2026-03-15 | KB-ui-001 ~ KB-ui-005, KB-auth-001 ~ KB-auth-002 | ui-rendering, auth-session |

---

## 使用指南

### 添加新问题

1. 复制 `template.md` 到 `issues/{分类}/KB-{分类}-{序号}.md`
2. 填写问题详情
3. 更新本索引文件

### 搜索问题

```bash
# 按关键词搜索
grep -r "关键词" docs/knowledge-base/issues/

# 按分类搜索
find docs/knowledge-base/issues/{分类} -name "*.md"
```

---

## 贡献指南

- 每个问题必须包含"根因分析"和"防范机制"章节
- 问题 ID 格式: `KB-{分类}-{序号}`
- 定期回顾并更新防范措施

---

*最后更新: 2026-03-15*
