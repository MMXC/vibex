# Spec: E3 — 版本历史规格

**对应 Epic**: E3 画布版本 diff + 对比
**目标文件**: 
- `vibex-fronted/src/stores/prototypeVersionStore.ts`（新建）
- `vibex-fronted/src/app/version-history/page.tsx`（修改）
**相关**: `vibex-fronted/src/stores/prototypeStore.ts`, `vibex-fronted/src/components/version-diff/VersionDiff.tsx`

---

## 1. prototypeVersionStore 规格

```typescript
// 文件: src/stores/prototypeVersionStore.ts
import { create } from 'zustand';
import { prototypeStore } from './prototypeStore';

interface Snapshot {
  id: string;
  name?: string;
  createdAt: string;
  createdBy: string;
  data: PrototypeExportData;
  aiMeta?: {
    model: string;
    generatedAt: string;
    codes?: GeneratedCode[];
  };
}

interface PrototypeVersionState {
  snapshots: Snapshot[];
  selectedSnapshotId: string | null;
  compareSnapshotIds: [string, string] | null;
  loading: boolean;
  error: string | null;
  
  loadSnapshots: () => Promise<void>;
  createSnapshot: (name?: string) => Promise<Snapshot>;
  restoreSnapshot: (id: string) => Promise<void>;
  deleteSnapshot: (id: string) => Promise<void>;
  setSelectedSnapshot: (id: string | null) => void;
  setComparePair: (a: string, b: string) => void;
}

export const usePrototypeVersionStore = create<PrototypeVersionState>((set, get) => ({
  snapshots: [],
  selectedSnapshotId: null,
  compareSnapshotIds: null,
  loading: false,
  error: null,

  loadSnapshots: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/v1/prototype-snapshots');
      const snapshots = await res.json();
      set({ snapshots, loading: false });
    } catch (e) {
      set({ error: '加载失败', loading: false });
    }
  },

  createSnapshot: async (name?: string) => {
    set({ loading: true, error: null });
    try {
      const exportData = prototypeStore.getState().getExportData();
      const res = await fetch('/api/v1/prototype-snapshots', {
        method: 'POST',
        body: JSON.stringify({ name, data: exportData }),
      });
      const snapshot = await res.json();
      set(s => ({ snapshots: [snapshot, ...s.snapshots], loading: false }));
      return snapshot;
    } catch (e) {
      set({ error: '保存失败', loading: false });
      throw e;
    }
  },

  restoreSnapshot: async (id: string) => {
    const snapshot = get().snapshots.find(s => s.id === id);
    if (!snapshot) return;
    prototypeStore.setState({
      nodes: snapshot.data.nodes,
      edges: snapshot.data.edges,
    });
    set({ selectedSnapshotId: id });
  },

  deleteSnapshot: async (id: string) => {
    await fetch(`/api/v1/prototype-snapshots/${id}`, { method: 'DELETE' });
    set(s => ({ snapshots: s.snapshots.filter(ss => ss.id !== id) }));
  },

  setSelectedSnapshot: (id) => set({ selectedSnapshotId: id }),
  setComparePair: (a, b) => set({ compareSnapshotIds: [a, b] }),
}));
```

---

## 2. version-history 页面规格

### 理想态
- 左侧：版本列表（时间倒序）
  - 每个版本：时间 + 名称 + 节点数量 badge
  - 选中高亮
  - hover 显示 "恢复" / "对比" / "删除" 按钮
- 右侧：
  - 选中版本时：显示版本详情 + 预览
  - 对比模式时：显示 VersionDiff 组件

### 空状态
- 无版本时：引导文案 "还没有保存过版本"
- 引导插图（时间机器图标 SVG）
- "保存第一个版本" 按钮
- 禁止只留白

### 加载态
- 版本列表骨架屏（5 个灰色占位块）
- 禁止使用纯转圈

### 错误态
- 加载失败：toast + 重试按钮
- 恢复失败：toast "恢复失败，请重试"

---

## 3. 样式约束

- 间距：8 的倍数
- 颜色：使用 Token
- 禁止硬编码
- 版本列表宽度：300px
- 按钮尺寸：32px 高度
