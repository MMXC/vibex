# E01: 实时协作整合 — 详细规格

## 1. 范围

- S01.1 PresenceLayer 合并到 CanvasPage
- S01.2 实时节点同步（useRealtimeSync hook）
- S01.3 Firebase 凭证配置

## 2. 技术架构

### 2.1 现有组件（已验证）
```
lib/firebase/presence.ts        ✅ Firebase RTDB presence
components/canvas/Presence/PresenceLayer.tsx  ✅ 用户头像层
hooks/usePresence.ts            ✅ presence hook
tests/e2e/presence-mvp.spec.ts  ✅ E2E 测试（mock 降级）
```

### 2.2 缺失部分
- PresenceLayer 未集成到 CanvasPage
- Firebase 生产凭证未配置（.env.staging）
- 实时节点编辑同步未实现（useRealtimeSync）

## 3. S01.1: PresenceLayer 合并

### 3.1 集成点
在 `CanvasPage.tsx` 中：
1. 导入 `PresenceLayer` 和 `usePresence`
2. 在 Canvas 三栏上方（z-index 最高层）渲染 `<PresenceLayer />`
3. `usePresence` 初始化用户在线状态

### 3.2 渲染位置
```tsx
// CanvasPage.tsx 结构
<div className="canvas-container">
  <PresenceLayer />  {/* 叠加层，position: absolute */}
  <div className="canvas-three-columns">
    <ComponentTreePanel />
    <FlowTreePanel />
    <ContextTreePanel />
  </div>
</div>
```

### 3.3 验收标准（expect()）
```ts
expect(CanvasPage rendered, PresenceLayer mounted)
expect(presence state === "online" after render)
expect(user avatar visible at top-right corner)
expect(tsc --noEmit exits 0)
```

## 4. S01.2: 实时节点同步

### 4.1 useRealtimeSync Hook 设计
```ts
// hooks/useRealtimeSync.ts
interface RealtimeNode {
  id: string
  projectId: string
  content: Record<string, unknown>
  updatedAt: number
  updatedBy: string
}

function useRealtimeSync(projectId: string): {
  nodes: RealtimeNode[]
  updateNode: (id: string, content: Record<string, unknown>) => void
}
```

### 4.2 Firebase RTDB 结构
```
/projects/{projectId}/nodes/{nodeId}
  - content: Record
  - updatedAt: timestamp
  - updatedBy: userId
```

### 4.3 冲突处理：last-write-wins
- 每次写入携带 `updatedAt` 时间戳
- 读取时比较时间戳，保留最新
- 不需要 OT/CRDT，最简化实现

### 4.4 验收标准（expect()）
```ts
expect(useRealtimeSync defined and exported)
expect(node update received within 500ms after Firebase write)
expect(conflict resolved by last-write-wins (latest timestamp wins))
expect(no data loss in single-writer scenario)
```

## 5. S01.3: Firebase 凭证

### 5.1 .env.staging 必需变量
```
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_DATABASE_URL=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
```

### 5.2 验证步骤
1. 配置完变量后运行 `npm run dev`
2. 打开 CanvasPage，检查 Console 无 Firebase 错误
3. 验证 Firebase RTDB 连接：`expect(firebase.database().ref().once('value'))`

### 5.3 验收标准（expect()）
```ts
expect(env.staging contains all required FIREBASE_* vars)
expect(Firebase connection established without console.error)
expect(firebase.database().ref().once('value') resolves)
```

## 6. DoD

- [ ] PresenceLayer 正确渲染在 CanvasPage 三栏上方
- [ ] Firebase 连接无 console.error
- [ ] useRealtimeSync hook 单元测试通过
- [ ] 多人编辑冲突时 last-write-wins 生效
- [ ] 集成测试 presence-mvp.spec.ts 通过
- [ ] TS 编译 0 errors

## 7. 风险与缓解

| 风险 | 缓解 |
|------|------|
| Firebase 凭证申请延迟 | Day 1 启动申请，并行开发 S01.1（mock 数据） |
| worktree 合并冲突 | 尽早合并，充分测试 |
| 多人同时编辑节点覆盖 | last-write-wins，不用 CRDT |
