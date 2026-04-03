# E4 Spec: useAIController

## 接口设计

```typescript
interface UseAIControllerReturn {
  // State
  requirementInput: string;
  setRequirementInput: (v: string) => void;
  isQuickGenerating: boolean;
  componentGenerating: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
  conflictData: ConflictData | null;

  // Generation
  quickGenerate: () => Promise<void>;
  handleContinueToComponents: () => Promise<void>;
  handleGenerateFromRequirement: () => Promise<void>;
  loadExample: () => void;

  // Conflict
  handlers: {
    handleConflictKeepLocal: () => void;
    handleConflictUseServer: () => void;
    handleConflictMerge: () => void;
  };
}
```

## 冲突处理逻辑

```typescript
// keep-local: 强制覆盖，version = serverVersion + 1
const handleConflictKeepLocal = async () => {
  if (!conflictData) return;
  await canvasApi.postSnapshot({
    projectId,
    data: conflictData.localData,
    version: conflictData.serverVersion + 1, // 强制
  });
  setConflictData(null);
  setSaveStatus('idle');
};

// use-server: 从服务器恢复
const handleConflictUseServer = async () => {
  if (!conflictData) return;
  const { serverSnapshot } = conflictData;
  canvasSetContextNodes(serverSnapshot.contexts);
  canvasSetFlowNodes(serverSnapshot.flows);
  canvasSetComponentNodes(serverSnapshot.components);
  setConflictData(null);
  setSaveStatus('idle');
};
```
