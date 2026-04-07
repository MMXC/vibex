# Spec: ADR-002 状态持久化分层策略

**ADR**: ADR-002  
**状态**: 待实施  
**Sprint**: Sprint 2（部分可提前）

---

## 1. 背景

**问题**: 哪些状态该存 Zustand store，哪些该存 localStorage，哪些该同步后端？

---

## 2. 分层策略

| 层级 | 存储 | 适用场景 | 刷新后 |
|------|------|---------|--------|
| L1: Session | 内存 (Zustand) | UI 状态（面板折叠、滚动位置）| 丢失 |
| L2: Session+Refresh | localStorage | 用户偏好（面板折叠记忆）| 保留 |
| L3: 跨设备 | 后端 API | 业务数据（contextNodes、flowNodes）| 跨设备同步 |

---

## 3. 实现规格

### 3.1 L1: 内存状态 (Zustand)

```typescript
// stores/uiStore.ts
interface UIState {
  panelCollapsed: boolean;       // 内存，不持久化
  activePanel: string;            // 内存，不持久化
  scrollPosition: number;        // 内存，不持久化
}
```

### 3.2 L2: localStorage 持久化 (用户偏好)

```typescript
// stores/uiStore.ts
import { persist, createJSONStorage } from 'zustand/middleware';

const storage = createJSONStorage(() => localStorage);

export const useUIStore = create(
  persist(
    (set) => ({
      // 持久化状态
      sidebarWidth: 280,
      theme: 'light',
      
      // 非持久化状态（页面级）
      panelCollapsed: false,
    }),
    {
      name: 'vibex-ui-preferences',
      storage,
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        theme: state.theme,
      }),
    }
  )
);
```

### 3.3 L3: 后端 API 同步 (业务数据)

```typescript
// Zustand persist middleware with backend sync
// 业务数据通过 Zustand persist 同步到后端
// 已有配置，继续保持
```

---

## 4. P-002: 面板状态持久化实现

### 4.1 功能点

- 面板展开/折叠状态保存到 localStorage
- 页面加载时从 localStorage 恢复
- 退出登录后清除（或保留，取决于用户选择）
- 游客使用 sessionStorage（不跨会话）

### 4.2 技术实现

```typescript
// 键名规范: vibex-panel-{panelId}
const PANEL_STORAGE_KEY = 'vibex-panel-state';

interface PanelState {
  [panelId: string]: {
    collapsed: boolean;
    lastUpdated: number;
  };
}

// 恢复逻辑
const loadPanelState = (panelId: string): boolean => {
  const stored = localStorage.getItem(PANEL_STORAGE_KEY);
  if (stored) {
    const state: PanelState = JSON.parse(stored);
    return state[panelId]?.collapsed ?? false;
  }
  return false;
};
```

---

## 5. 验收标准

- [ ] L1/L2/L3 分层策略已文档化
- [ ] 面板状态在刷新后正确恢复
- [ ] localStorage 读取失败时有合理降级（默认展开）
- [ ] 游客模式使用 sessionStorage
- [ ] Playwright 测试覆盖面板状态持久化场景

---

## 6. 未来扩展

- 考虑 IndexedDB 存储大文件（如 Canvas 截图）
- 考虑 Web Crypto API 加密敏感偏好设置
