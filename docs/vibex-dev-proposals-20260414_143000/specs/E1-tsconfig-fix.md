# Spec: E1 - tsconfig 修复 + CI Gate 规格

## E1.1 前端 tsconfig 修复

```json
// vibex-fronted/tsconfig.json 检查
{
  "compilerOptions": {
    // ✅ 正确配置
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "types": ["node"], // 或移除 types，让编译器自动推断
    
    // ❌ 错误配置（需移除）
    "plugins": [{ "name": "next" }]  // ← 移除
  }
}
```

## E1.2 后端 tsconfig 修复

```json
// vibex-backend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "types": ["@cloudflare/workers-types"], // ✅ 正确
    
    // ❌ 错误配置（需移除）
    "plugins": [{ "name": "next" }]  // ← 必须移除
  }
}
```

## E1.3 CI TypeScript Gate

```yaml
# .github/workflows/ci.yml 或等效 CI 配置
steps:
  - name: TypeScript check (frontend)
    run: |
      cd vibex-fronted
      npx tsc --noEmit
  - name: TypeScript check (backend)
    run: |
      cd vibex-backend
      npx tsc --noEmit
```

## E1.4 验证命令

```bash
# 前端
cd vibex-fronted && npx tsc --noEmit; echo $?  # 期望: 0

# 后端
cd vibex-backend && npx tsc --noEmit; echo $?  # 期望: 0

# CI 验证（tsc 失败时阻断）
npx tsc --noEmit || { echo "tsc failed"; exit 1; }
```
