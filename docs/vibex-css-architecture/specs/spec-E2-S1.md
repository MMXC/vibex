# Spec: E2-S1 — 创建 CSS Modules 全局类型声明

## 文件

- **新建**: `vibex-fronted/src/types/css-modules.d.ts`

## 目的

解决 TypeScript `strict: true` + `noImplicitAny: true` 环境下，`import styles from '*.module.css'` 类型为 `string | undefined`，导致所有 `styles['xxx']` 动态访问都需要非空断言的问题。

## 类型声明内容

```typescript
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
  export = classes;
}
```

## 效果

| 场景 | 之前 | 之后 |
|------|------|------|
| `styles['foo']` 类型 | `string \| undefined` | `string` |
| `tsc` 对 CSS import | `cannot find module` | 无错误 |
| 需要显式断言 | `styles['foo']!` | 不需要 |

## DoD 检查单

- [ ] `src/types/css-modules.d.ts` 存在
- [ ] `tsc --noEmit` 对任意 `.tsx` 文件中 `import styles from './Foo.module.css'` 不报找不到模块
- [ ] `styles['anyKey']` 推断类型为 `string`（非 `string | undefined`）
- [ ] `styles.nonExistent` 仍然类型为 `string`（全局声明无法检测具体键的存在性，需配合 E2-S2）
