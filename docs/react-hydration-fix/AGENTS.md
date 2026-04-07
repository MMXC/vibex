# AGENTS.md — react-hydration-fix 开发约束

**项目**: react-hydration-fix
**日期**: 2026-04-04
**仓库**: /root/.openclaw/vibex

---

## 1. 开发约束

### 1.1 E1-F1 MermaidInitializer

```typescript
// ✅ 正确：直接初始化，无状态
useEffect(() => {
  mermaidManager.initialize().catch(console.error);
}, []);
return null;

// ❌ 错误：保留任何 setInterval
setInterval(() => { ... }, 100);  // ← 禁止

// ❌ 错误：保留 tick 状态
const [tick, setTick] = useState(0);  // ← 禁止
```

### 1.2 E1-F2 QueryProvider

```typescript
// ✅ 正确：hydration 后持久化
useEffect(() => {
  hydrationRef.current = true;
  persistQueryClient({...}).catch(console.error);
}, [queryClient]);

// ❌ 错误：hydration 完成标记前执行持久化
persistQueryClient({...});  // ← 禁止在 useEffect 外
```

### 1.3 E2-F1 日期格式化

```typescript
// ✅ 正确：使用 toISOString 基准的 formatDate
import { formatDate } from '@/lib/format';
const date = formatDate('2026-04-04T12:00:00Z');

// ❌ 错误：使用 locale 相关的日期 API
new Date().toLocaleDateString('zh-CN');  // ← 禁止
new Date().toLocaleString();              // ← 禁止
```

### 1.4 E2-F2 suppressHydrationWarning

```tsx
// ✅ 正确：仅在 dangerouslySetInnerHTML 上添加
<div
  dangerouslySetInnerHTML={{ __html: content }}
  suppressHydrationWarning  // ← 仅加在 SVG/富文本元素上
/>

// ❌ 错误：全局添加或添加到普通元素
<div suppressHydrationWarning>text</div>  // ← 普通文本无需添加
```

---

## 2. Git 提交规范

```bash
fix(hydration): MermaidInitializer 移除 setInterval 轮询
fix(hydration): QueryProvider hydration 后延迟持久化
feat(format): formatDate 时区安全的日期格式化工具
fix(hydration): MermaidRenderer 添加 suppressHydrationWarning
fix(hydration): MermaidPreview 添加 suppressHydrationWarning
test(hydration): MermaidInitializer 单元测试
test(format): formatDate 时区一致性测试
```

---

## 3. 代码审查清单

### E1-F1 MermaidInitializer
- [ ] 无 `setInterval` 关键字
- [ ] 无 `setTick` / `tick` 关键字
- [ ] `useEffect` 中直接调用 `initialize()`
- [ ] `return null`

### E1-F2 QueryProvider
- [ ] `persistQueryClient` 在 `useEffect` 内
- [ ] `hydrationRef` 标记 hydration 完成

### E2-F1 format.ts
- [ ] `formatDate` 使用 `split('T')` 而非 `toLocaleDateString`
- [ ] UTC 和 CST 时区返回一致结果

### E2-F2 suppressHydrationWarning
- [ ] 仅在 `dangerouslySetInnerHTML` 元素上添加
- [ ] 不滥用在普通文本元素上

---

## 4. 测试规范

```typescript
// __tests__/MermaidInitializer.spec.tsx
describe('MermaidInitializer hydration 修复', () => {
  it('无 setInterval', () => {
    const src = fs.readFileSync('MermaidInitializer.tsx', 'utf-8');
    expect(src).not.toMatch(/setInterval/);
  });
  it('无 setTick', () => {
    const src = fs.readFileSync('MermaidInitializer.tsx', 'utf-8');
    expect(src).not.toMatch(/setTick/);
  });
});

// __tests__/format.test.ts
describe('formatDate 时区一致性', () => {
  it('UTC 和 CST 返回相同结果', () => {
    expect(formatDate('2026-04-04T12:00:00Z'))
      .toBe(formatDate('2026-04-04T20:00:00+08:00'));
  });
  it('返回 YYYY-MM-DD 格式', () => {
    expect(formatDate('2026-04-04T12:00:00Z')).toBe('2026-04-04');
  });
});
```

---

## 5. 回滚条件

| 触发条件 | 回滚命令 |
|---------|---------|
| 页面 hydration error 增加 | `git checkout HEAD --` 相关文件 |
| Mermaid 图表不渲染 | 检查 `initialize()` 调用时机 |
| QueryCache 丢失 | 检查 `persistQueryClient` 时机 |

---

*本文档由 Architect Agent 生成于 2026-04-04 22:30 GMT+8*
