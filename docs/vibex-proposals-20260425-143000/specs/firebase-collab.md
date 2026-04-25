# S9 Epic 3 Spec: Firebase 实时协作升级

## ⚠️ 前置条件（阻塞）

**必须 Sprint 8 完成以下验证，否则本 Epic 延后到 Sprint 10**：
- P002-S1：Architect 可行性评审（Firebase on Cloudflare Workers V8 isolate）
- P002-S2：冷启动性能测试（目标 < 500ms）

---

## F3.1 多用户 Presence

### 描述
Canvas 侧边栏显示在线用户列表（头像 + 名称），实时更新。

### 技术方案
- 复用已有 `src/lib/firebase/presence.ts`（Firebase REST API 方式）
- 新增：`src/components/canvas/PresenceIndicator.tsx`
- 多人场景：创建 5 个用户加入同一 canvas，验证在线状态

### DoD
- [ ] 5 用户并发 presence < 3s
- [ ] 每个 presence indicator 含 `.avatar-img` + `.user-name`
- [ ] 用户离开后，presence indicator 即时消失

---

## F3.2 Cursor 同步

### 描述
React Flow 内多用户 Cursor 实时同步，延迟 < 500ms。

### 技术方案
- 在 React Flow `onMove` 事件中广播 Cursor 位置
- 使用 Firebase RTDB `onValue` 监听其他用户 Cursor
- Cursor DOM 元素：绝对定位 SVG cursor 图标

### DoD
- [ ] Cursor 同步延迟 < 500ms
- [ ] Cursor 超出画布区域后消失
- [ ] 5 用户并发 Cursor 同步不冲突

---

## F3.3 ConflictBubble 增强

### 描述
冲突气泡显示节点 ID + 解决建议按钮（接受/拒绝/合并）。

### 技术方案
- 复用已有 `src/components/canvas/ConflictBubble.tsx`
- 新增 `.node-id` 显示冲突节点 ID
- 新增 `.conflict-hint` 显示解决建议文案

### DoD
- [ ] ConflictBubble 含 `.node-id`（格式：`node-[a-z0-9]+`）
- [ ] ConflictBubble 含 `.conflict-hint`（文案含"接受"/"拒绝"/"合并"之一）
- [ ] 点击"接受"按钮后 Bubble 消失
