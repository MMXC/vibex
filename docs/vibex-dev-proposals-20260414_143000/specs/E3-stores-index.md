# Spec: E3 - Zustand Stores 规范化规格

## E3.1 stores/index.ts 统一导出

```typescript
// stores/index.ts
export { useProjectStore } from './projectStore';
export { useCanvasStore } from './canvasStore';
export { useAuthStore } from './authStore';
export { useToastStore } from './toastStore';
// ... 所有 stores
```

## E3.2 Slice Pattern 规范

```typescript
// ✅ 正确: 使用 create + slice
interface CanvasState {
  phase: Phase;
  setPhase: (p: Phase) => void;
}

const createCanvasSlice = (set, get) => ({
  phase: 'context' as Phase,
  setPhase: (phase) => set({ phase }),
});

// ✅ 错误: 直接在 store 中定义所有状态（单体 store）
// const useCanvasStore = create((set) => ({
//   phase: 'context',
//   setPhase: (phase) => set({ phase }),
//   // 30+ 个状态和 actions...
// }));
```

## E3.3 TypeScript 类型完整性

```typescript
// 每个 store 必须有完整类型定义
interface ProjectStore {
  // State
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (data: CreateProjectInput) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
}
```
