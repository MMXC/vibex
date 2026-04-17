# VibeX Sprint 4 实施计划

**项目**: vibex-proposals-summary-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03
**状态**: Architect 设计完成

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: 待 coord 创建 Sprint 4 项目并绑定
- **执行日期**: 2026-04-03

---

## 1. Sprint 分批计划

### Sprint 4.1: 基础清理 + 质量门禁（~6h）

| # | Story | 负责人 | 工时 | 依赖 |
|---|-------|--------|------|------|
| S1.1 | TS 编译错误修复 | dev | 0.5h | 无 |
| S2.1 | CHANGELOG 规范统一 | dev | 1h | 无 |
| S2.2 | Pre-submit 自查脚本 | dev | 3h | S2.1 |
| S2.3 | Reviewer 驳回模板 | reviewer | 0.5h | 无 |
| S2.4 | reports/INDEX.md | reviewer | 1h | 无 |

**Sprint 4.1 交付物**:
- `npx tsc --noEmit` 零错误
- `scripts/pre-submit-check.sh` 可执行
- AGENTS.md 包含 CHANGELOG 规范
- reports/INDEX.md 存在

---

### Sprint 4.2: E4 Sync + Facade 清理（~9h）

| # | Story | 负责人 | 工时 | 依赖 |
|---|-------|--------|------|------|
| S1.2 | E4 Sync Protocol 后端 | dev | 3h | S1.1 |
| S1.2 | ConflictDialog 组件 | dev | 2h | S1.2 后端 |
| S1.3 | canvasStore Facade 清理 | dev | 4h | 无 |

**Sprint 4.2 交付物**:
- `POST /api/canvas/sync` 返回 200/409
- ConflictDialog 覆盖 3 种冲突场景
- `canvasStore.ts < 300 行`

---

### Sprint 4.3: UX 增强（~8h）

| # | Story | 负责人 | 工时 | 依赖 |
|---|-------|--------|------|------|
| S3.1 | Phase 状态指示器 | dev | 2h | 无 |
| S3.2 | 新手引导卡片 | dev | 2h | 无 |
| S3.3 | Feedback FAB + Slack | dev | 3h | 无 |
| S3.4 | 示例项目快速入口 | dev | 1h | S3.2 |

**Sprint 4.3 交付物**:
- Phase 指示器在画布任何位置可见
- GuideCard 首次显示，关闭后不再出现
- Feedback 提交后 #coord 收到 Slack 通知

---

### Sprint 4.4: 测试工程化（~10h）

| # | Story | 负责人 | 工时 | 依赖 |
|---|-------|--------|------|------|
| S4.1 | E2E Flaky 治理 | tester | 3h | 无 |
| S4.2 | API Contract 测试 | tester | 4h | S1.2 |
| S4.3 | auto-save E2E 覆盖 | tester | 3h | S1.2 |

**Sprint 4.4 交付物**:
- E2E 通过率连续 3 次 ≥ 95%
- Contract 测试覆盖所有新 API
- auto-save E2E 覆盖 beacon 和 debounce

---

### Sprint 5: 协作基础设施（~12h）

| # | Story | 负责人 | 工时 | 依赖 |
|---|-------|--------|------|------|
| S5.1 | 只读分享链接 | dev | 2h | 无 |
| S5.2 | CI 质量仪表盘 | dev | 3h | S4.1 |
| S5.3 | 质量异常报警 | dev | 1h | S5.2 |
| S5.4 | 设计版本快照 | dev | 4h | S1.2 |
| S5.5 | 快照对比 | dev | 2h | S5.4 |

**Sprint 5 交付物**:
- 分享链接可访问，编辑功能禁用
- Quality 页面 < 2s 加载，显示折线图
- 快照支持命名、预览、对比 diff

---

## 2. 技术实现顺序

### 阶段一：立即可执行（无需后端）

```
S1.1 TS修复 → S2.1 CHANGELOG规范 → S2.3 驳回模板
                                      ↓
                                S2.2 自查脚本
S1.3 Facade清理（可并行，不依赖后端）
S3.1 Phase指示器（可并行，不依赖后端）
S3.2 引导卡片（可并行，不依赖后端）
```

### 阶段二：依赖后端（E4 Sync）

```
后端实现 S1.2 sync API
    ↓
前端 ConflictDialog + E2E 测试
    ↓
E4.2 Contract 测试 + E4.3 auto-save E2E
```

### 阶段三：协作功能（Sprint 5）

```
S5.1 分享链接（独立后端 API）
S5.4 快照（依赖 S1.2 的 sync 基础设施）
S5.2 质量仪表盘（依赖 CI webhook）
S5.5 快照对比（依赖 S5.4）
```

---

## 3. 开发约束

### 3.1 E4 Sync 开发约束

1. **不修改现有 auto-save 逻辑**: E4 Sync 仅在冲突时介入
2. **版本号原子递增**: 使用 D1 transaction 确保并发安全
3. **ConflictDialog 渐进增强**: 优先处理 BoundedContext 冲突节点
4. **checksum 快速检测**: 相同 checksum 直接返回 `no_change`

### 3.2 Facade 清理约束

1. **先审计后迁移**: 用 `grep` 列出所有非 re-export 行
2. **deprecation 警告**: 每个待迁移函数加 `// TODO: migrate to xxxStore`
3. **测试先行**: 单元测试覆盖迁移后的每个 split store
4. **行数分步达标**: Phase1 < 800行, Phase2 < 500行, Phase3 < 300行

### 3.3 Quality Dashboard 约束

1. **懒加载**: 整个 dashboard 使用 `next/dynamic` 动态导入
2. **SWR 缓存**: 数据缓存 5 分钟，减少 CI 查询压力
3. **数据保护**: E2E pass rate 不公开，仅 #coord 可见

### 3.4 Share Links 约束

1. **无需认证**: `GET /api/share/:token` 跳过 auth 中间件
2. **只读模式**: 分享页面 `mode = 'readonly'` 禁用所有写入操作
3. **token 不可枚举**: 8-char 随机字符串 + rate limit 防护

---

## 4. CI/CD 集成

### 4.1 GitHub Actions Webhook

```yaml
# .github/workflows/ci.yml
- name: Report CI metrics
  if: always()
  run: |
    curl -X POST ${{ vars.BACKEND_URL }}/api/ci/webhook \
      -H "Content-Type: application/json" \
      -d '{
        "buildNumber": ${{ github.run_number }},
        "project": "vibex-fronted",
        "branch": "${{ github.ref_name }}",
        "status": "${{ job.status }}",
        "e2ePassRate": ${{ env.E2E_PASS_RATE }},
        "tsErrors": ${{ env.TS_ERRORS }}
      }'
```

### 4.2 Pre-submit CI 集成

```yaml
# 在 PR CI 中运行 pre-submit 检查
- name: Pre-submit check
  run: bash scripts/pre-submit-check.sh
```

---

## 5. 关键里程碑

| 里程碑 | 日期 | 交付物 |
|--------|------|--------|
| M1: CI 通过 | Sprint 4.1 结束 | TS 零错误，CHANGELOG 规范 |
| M2: 无冲突保存 | Sprint 4.2 结束 | E4 Sync 上线，Facade < 300 行 |
| M3: UX 就绪 | Sprint 4.3 结束 | Phase 指示器、引导卡片、Feedback |
| M4: 测试稳定 | Sprint 4.4 结束 | E2E ≥ 95%，Contract 测试完整 |
| M5: 协作上线 | Sprint 5 结束 | 分享链接、质量仪表盘、快照 |

---

*实施计划版本: v1.0 | 架构师: Architect Agent | 日期: 2026-04-03*
