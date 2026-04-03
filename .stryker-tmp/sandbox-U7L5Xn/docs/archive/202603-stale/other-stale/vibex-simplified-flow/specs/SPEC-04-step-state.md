# SPEC-04: POST /api/step-state — Autosave API

> **步骤状态自动保存** — 简化流程 Autosave 核心

---

## 基本信息

| 字段 | 值 |
|------|-----|
| **API 名称** | `POST /api/step-state` |
| **所属模块** | `StepState` |
| **Agent 负责人** | `dev` |
| **状态** | `draft` |
| **创建日期** | `2026-03-23` |

---

## 功能说明

Autosave 核心 API：前端 debounce 3s 后自动调用，记录步骤状态 + 变更历史 + 乐观锁版本控制。

---

## 接口定义

### 请求

**方法**: `POST`  
**路径**: `/api/step-state`  
**认证**: `Required`  
**Content-Type**: `application/json`

#### Request Body

```typescript
interface SaveStepStateRequest {
  projectId: string;      // required
  currentStep: 1 | 2 | 3; // required
  step1?: Step1Data | null;  // 传 null 表示清除
  step2?: Step2Data | null;
  step3?: Step3Data | null;
  updatedAt?: string;     // ISO 8601, 乐观锁
}

interface Step1Data {
  domainIds: string[];
  flowId?: string;
  uiNodeIds?: string[];
  checkedDomainIds: string[];
  checkedFeatureIds: Record<string, string[]>;
  generationTime: number;
  interruptedAt?: string;
  interruptedDomainId?: string;
  flowType: 'core_only' | 'core_with_supporting' | 'full';
}

interface Step2Data {
  uiNodeIds: string[];
  annotations: Record<string, UINodeAnnotation[]>;
  naturalLanguageInputs: string[];
}

interface Step3Data {
  status: 'pending' | 'queued' | 'generating' | 'done' | 'failed';
  queueId?: string;
  progress?: number;
  currentPage?: string;
  generatedPages: string[];
  failedPages: string[];
}

interface UINodeAnnotation {
  id: string;
  text: string;
  source: 'user_input' | 'ai_suggestion';
  timestamp: string;
  applied: boolean;
}
```

---

## 响应

### 200 OK

```typescript
interface SaveStepStateResponse {
  success: true;
  data: StepState;
  updatedAt: string;       // 服务端时间戳
  version: number;          // 新版本号
}
```

### 409 Conflict (乐观锁)

```typescript
interface ConflictResponse {
  success: false;
  error: 'State was modified. Please refresh and try again.';
  code: 'VERSION_CONFLICT';
  serverData: StepState;    // 服务端最新数据
  serverUpdatedAt: string;
}
```

---

## 示例

### curl 示例

```bash
# Autosave: Step1 数据变更
curl -X POST "https://api.vibex.top/api/step-state" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "projectId": "proj_abc",
    "currentStep": 1,
    "step1": {
      "domainIds": ["bd_001", "bd_002"],
      "flowId": "flow_xyz",
      "checkedDomainIds": ["bd_001"],
      "checkedFeatureIds": { "bd_001": ["f001", "f002"] },
      "generationTime": 3240,
      "flowType": "core_only"
    }
  }'

# 更新 currentStep 到 Step2
curl -X POST "https://api.vibex.top/api/step-state" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "projectId": "proj_abc",
    "currentStep": 2,
    "step1": {
      "domainIds": ["bd_001"],
      "flowId": "flow_xyz",
      "checkedDomainIds": ["bd_001"],
      "checkedFeatureIds": {},
      "generationTime": 3240,
      "flowType": "core_only"
    },
    "step2": {
      "uiNodeIds": ["ui_1", "ui_2"],
      "annotations": {},
      "naturalLanguageInputs": []
    }
  }'
```

---

## 边界条件

| 场景 | 输入 | 期望输出 |
|------|------|---------|
| projectId 缺失 | `{}` | `400` |
| currentStep 无效 | `currentStep: 4` | `400` |
| projectId 不存在 | 伪造 projectId | `404` 或 `403` |
| 越权 | 其他用户的 projectId | `403` |
| 版本冲突 | 过时的 updatedAt | `409` + serverData |
| 正常保存 | 有效数据 | `200` + 新 version |

---

## 测试用例

```typescript
describe('POST /api/step-state', () => {
  it('should save step1 data and increment version', async () => {
    const res = await api.post('/api/step-state', {
      projectId: 'proj_abc',
      currentStep: 1,
      step1: { domainIds: ['bd_001'], checkedDomainIds: [], checkedFeatureIds: {}, generationTime: 100, flowType: 'core_only' },
    });
    expect(res.status).toBe(200);
    expect(res.data.version).toBeGreaterThan(0);
  });

  it('should return 409 on version conflict', async () => {
    // 先保存
    const first = await api.post('/api/step-state', { projectId: 'proj_abc', currentStep: 1, step1: { domainIds: [], checkedDomainIds: [], checkedFeatureIds: {}, generationTime: 0, flowType: 'core_only' } });
    // 用旧的 updatedAt 再保存
    const res = await api.post('/api/step-state', {
      projectId: 'proj_abc',
      currentStep: 1,
      step1: { domainIds: ['bd_001'], checkedDomainIds: [], checkedFeatureIds: {}, generationTime: 0, flowType: 'core_only' },
      updatedAt: '2020-01-01T00:00:00Z', // 旧时间
    });
    expect(res.status).toBe(409);
    expect(res.data.code).toBe('VERSION_CONFLICT');
    expect(res.data.serverData).toBeDefined();
  });

  it('should append changeLog on each save', async () => {
    await api.post('/api/step-state', { projectId: 'proj_abc', currentStep: 1, step1: { domainIds: ['bd_001'], checkedDomainIds: [], checkedFeatureIds: {}, generationTime: 0, flowType: 'core_only' } });
    await api.post('/api/step-state', { projectId: 'proj_abc', currentStep: 1, step1: { domainIds: ['bd_001'], checkedDomainIds: ['bd_001'], checkedFeatureIds: {}, generationTime: 0, flowType: 'core_only' } });
    const snapshot = await api.get('/api/projects?id=proj_abc&include=snapshot');
    expect(snapshot.data.data.stepState.version).toBe(2);
    expect(snapshot.data.data.history.length).toBeGreaterThan(0);
  });

  it('should return 400 for invalid currentStep', async () => {
    const res = await api.post('/api/step-state', { projectId: 'proj_abc', currentStep: 5 });
    expect(res.status).toBe(400);
    expect(res.data.code).toBe('VALIDATION_ERROR');
  });
});
```

---

## 验证命令

```bash
# 1. Autosave 测试
START=$(date +%s%3N)
curl -s -X POST "https://api.vibex.top/api/step-state" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"projectId":"proj_abc","currentStep":1,"step1":{"domainIds":["bd_001"],"checkedDomainIds":[],"checkedFeatureIds":{},"generationTime":100,"flowType":"core_only"}}' | \
  jq '{version, updatedAt}'
END=$(date +%s%3N)
echo "Latency: $((END - START))ms"

# 2. 版本递增验证
V1=$(curl -s ... | jq '.version')
sleep 1
V2=$(curl -s ... | jq '.version')
echo "Version: $V1 -> $V2"
# Expected: V2 = V1 + 1

# 3. 冲突检测
# 在两个标签页同时保存，第二个应返回 409
curl -s -X POST ... -d '{"updatedAt":"old_timestamp"}' | jq '.code'
# Expected: VERSION_CONFLICT
```

---

## 前端集成

```typescript
// useAutosave.ts
const AUTOSAVE_DELAY = 3000; // 3s debounce

export function useAutosave(projectId: string, state: Partial<SaveStepStateRequest>) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  const save = useCallback(async (data: SaveStepStateRequest) => {
    try {
      setIsSaving(true);
      const res = await api.post('/api/step-state', data);
      setLastSaved(res.data.updatedAt);
      setConflict(false);
    } catch (e) {
      if (e.code === 'VERSION_CONFLICT') {
        setConflict(true);
        // 通知用户：数据已被其他人修改
        notifyUser('数据冲突，请刷新页面');
        // 提供合并选项
        const merged = await mergeState(e.serverData, state);
        // 重试
        await save(merged);
      }
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (state.currentStep) {
      timeoutRef.current = setTimeout(() => save(state as SaveStepStateRequest), AUTOSAVE_DELAY);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [state, save]);

  // 页面卸载时立即保存
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/step-state', JSON.stringify(state));
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state]);

  return { isSaving, lastSaved, conflict };
}
```

---

## 关联 Specs

- **核心**: 被所有生成 API 依赖
- **关联**: `SPEC-03-project-snapshot.md`
- **关联**: `SPEC-01-business-domain-generate.md`

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-03-23 | 1.0 | 初始版本 | architect |
