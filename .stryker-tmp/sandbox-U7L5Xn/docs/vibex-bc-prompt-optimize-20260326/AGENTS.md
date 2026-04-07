# AGENTS.md: vibex-bc-prompt-optimize-20260326

**项目**: DDD Bounded Contexts AI 生成质量优化
**版本**: v1.0
**Architect**: Architect
**时间**: 2026-03-26 18:57 UTC+8

---

## 开发约束

### D1: 不修改 LLM 模型
- 继续使用 GPT-4o，不切换模型
- 仅通过 prompt 优化生成质量

### D2: 不新增外部依赖
- 所有代码使用现有依赖（Jest、TypeScript、Next.js API Routes）
- 新增文件: `src/lib/prompts/bounded-contexts.ts` + `src/lib/bounded-contexts-filter.ts`
- 不引入 prompt 管理框架（如 LangChain、Handlebars）

### D3: 两处 API 统一来源
- `generate-contexts` 和 `analyze/stream` 必须导入同一个 `BOUNDED_CONTEXTS_PROMPT`
- 禁止各自内联 prompt（这是本次优化的核心目标）

### D4: Post-processing 必须在 LLM 返回后执行
- `filterInvalidContexts()` 和 `validateCoreRatio()` 在 LLM 调用之后、返回结果之前执行
- 不要在 prompt 里加"请过滤xxx"的指令（让后处理处理）

### D5: 错误处理
- LLM 返回非 JSON 时: try/catch → 记录 error log → 返回空数组
- JSON parse 失败率 > 1% 时报警

### D6: maxTokens 调整
- 将两处 API 的 `maxTokens` 从 2048 调整为 3072
- 如生成质量下降，将 temperature 从 0.7 调至 0.6

---

## 检查清单 (Dev 实现后必查)

- [ ] `src/lib/prompts/bounded-contexts.ts` 存在且导出正确
- [ ] `src/lib/bounded-contexts-filter.ts` 存在且导出正确
- [ ] `route.ts` (generate-contexts) 不含内联 USER_PROMPT
- [ ] `route.ts` (analyze/stream) 不含内联 planPrompt
- [ ] 两处 route.ts 都导入了 `buildBoundedContextsPrompt`
- [ ] 两处 route.ts 都导入了 `filterInvalidContexts`
- [ ] `npm test -- --testPathPattern="bounded-contexts"` 通过
- [ ] `npm test -- --testPathPattern="generate-contexts"` 通过
- [ ] `npm test -- --testPathPattern="analyze-stream"` 通过
- [ ] `npm run build` 通过
- [ ] `npm run lint` 通过
- [ ] git commit 已提交

---

## Reviewer 审查要点

### R1: Prompt 模板质量
- 4 个结构章节（角色定义/判断标准/真实示例/输出格式）完整
- 示例包含医疗和电商两个行业
- 中文边界判断标准清晰可执行

### R2: 代码质量
- 无新增外部依赖
- 两处 API 共享同一 prompt 模块
- TypeScript 类型完整（`BoundedContext` 接口）

### R3: 测试覆盖
- 单元测试: Prompt 格式 + 过滤规则
- 集成测试: generate-contexts + analyze/stream
- 一致性测试: 两接口对比

### R4: 无回归
- 现有 API 接口不变（请求/响应格式不变）
- 现有功能不受影响
