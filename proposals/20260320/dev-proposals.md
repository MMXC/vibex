# Dev Proposals — 2026-03-20

> 从开发视角分析 VibeX 前端项目现状，提出改进提案。

---

## 📊 项目现状快照

| 指标 | 数值 | 状态 |
|------|------|------|
| TypeScript Errors | 0 | ✅ |
| Build | ✅ | ✅ |
| Test Suites | 152 (1 failed) | ⚠️ |
| Failed Tests | 3 | ⚠️ |
| Passed Tests | 1732 | ✅ |
| Lint Warnings | 419 | ⚠️ |
| `as any` instances | 47 | ⚠️ |
| npm audit | 1 moderate | ⚠️ |
| src/ size | 5.9M | ⚠️ |
| Static chunks | 132 | ⚠️ |

---

## D-001: 修复 InputArea.test.tsx 失败的 3 个测试

**优先级**: P0  
**预估工时**: 1h  
**负责人**: dev

### 问题描述
`InputArea.test.tsx` 中有 3 个测试失败，错误为 `getElementError`（找不到匹配 role 的元素），导致整体测试套件无法 100% 通过。

### 根因分析
- `getByRole('button')` 找不到对应元素，疑似按钮文本或 role 属性变更后测试未同步
- 涉及 `StepNavigator` 相关按钮的异步渲染时序问题

### 解决方案
1. 检查 `InputArea.test.tsx:102` 附近代码，确认按钮文本或 aria-label 是否与实现一致
2. 如有必要，使用 `waitFor` 包装异步查询
3. 统一按钮查询方式：优先使用 `getByRole('button', { name: /xxx/i })`

### 验收标准
- `npm test` 100% 通过
- 无 todo/skip 测试

---

## D-002: 清理 47 处 `as any` 类型断言

**优先级**: P1  
**预估工时**: 3h  
**负责人**: dev

### 问题描述
仍有 47 处 `as any`，虽比峰值 92 处已改善，但距离目标 <10 处仍有较大差距。

### 分布范围（预估）
- API 模块 headers 处理：约 10 处
- 动态方法调用（eval/Plugin）：约 8 处
- 第三方库类型不兼容：约 15 处
- 其他：约 14 处

### 解决方案
1. **API headers**：统一封装 `apiClient.ts` 的 headers 处理函数，导出强类型接口
2. **动态方法**：为 Plugin/eval 场景定义 `Record<string, Function>` 或 `any` 接口替代 `as any`
3. **第三方库**：升级类型定义包 `@types/*`，或自建局部 `declare module`
4. **其余场景**：逐文件 review，替换为 `unknown` + 类型守卫

### 验收标准
- `grep -r "as any" src/ --include="*.ts" --include="*.tsx" | wc -l` < 10

---

## D-003: 减少 419 个 Lint 警告

**优先级**: P1  
**预估工时**: 2h  
**负责人**: dev

### 问题描述
ESLint 报告 419 个 warning，主要来自：
- 未使用的变量/导入（约 200+）
- 缺失 React 依赖声明（约 100+）
- 缺失 `key` prop（约 50+）
- 其他（console.log、any 类型等）

### 解决方案
1. 运行 `npx eslint . --fix` 自动修复可自动修复的警告（未使用变量、未使用导入）
2. 人工 review 剩余不可自动修复的警告
3. 配置 `eslint-plugin-react-hooks` exhaustive-deps 规则，减少副作用遗漏

### 验收标准
- Lint warnings < 50

---

## D-004: 修复 npm audit 1 个 moderate 漏洞

**优先级**: P1  
**预估工时**: 0.5h  
**负责人**: dev

### 问题描述
`npm audit` 报告 1 个 moderate 漏洞。

### 解决方案
运行 `npm audit fix` 检查是否可自动修复，若不行则手动升级对应包版本。

### 验收标准
- `npm audit` 无输出（0 vulnerabilities）

---

## D-005: 清理遗留测试文件

**优先级**: P2  
**预估工时**: 0.5h  
**负责人**: dev

### 问题描述
`src/services/api.test.ts.bak` 备份文件残留，应删除或归档。

### 解决方案
1. 确认无有效内容后删除
2. 检查其他 `.bak` / `.tmp` / `node_modules` 外临时文件

### 验收标准
- `find src -name "*.bak" -o -name "*.tmp" | wc -l` = 0

---

## D-006: 优化 Bundle Size（可选，长期）

**优先级**: P2  
**预估工时**: 4h  
**负责人**: dev

### 问题描述
132 个静态 chunk，src 目录 5.9M。首页加载可能存在优化空间。

### 解决方案
1. 分析 `next build` 输出的 bundle 大小报告
2. 识别 >50KB 的第三方依赖，考虑动态导入
3. 检查 `@monaco-editor/react` 是否按需加载（monaco-editor 是大包）

### 验收标准
- Lighthouse Performance > 85
- LCP < 2.5s（在 3G 网络下）

---

*生成时间: 2026-03-20 00:42 (Asia/Shanghai)*
*Agent: dev*
