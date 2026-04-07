# 编码规范

> 团队编码规范，用于预防常见问题

---

## TypeScript 规范

### 必须遵守

1. **禁止使用 `any` 类型**
   - 使用 `unknown` 替代
   - 或定义具体类型

2. **启用严格模式**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true
     }
   }
   ```

3. **接口定义**
   - 所有 API 响应必须定义类型
   - 所有组件 props 必须定义类型

---

## React 规范

### 组件规范

1. **Props 定义**
   - 使用 TypeScript 接口定义
   - 提供默认值

2. **状态管理**
   - 使用 Zustand 进行全局状态
   - useState 用于组件局部状态

3. **副作用**
   - 使用 useEffect 处理副作用
   - 记得清理副作用

---

## 文件组织

```
src/
├── components/     # UI 组件
├── hooks/         # 自定义 Hooks
├── stores/        # Zustand Stores
├── services/      # API 服务
└── types/         # 类型定义
```

---

*最后更新: 2026-03-15*
