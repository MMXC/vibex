# Epic 3 Spec: P2 基础设施提升

**Epic ID**: EP-03
**Epic 名称**: P2 基础设施提升
**优先级**: P2
**工时**: 5h（Option B 延后至 Phase 2）
**Sprint**: Sprint 2（规划中）
**状态**: Planned

---

## 1. Overview

完成 P2 级别的工程基础设施提升，支持长期可维护性和团队协作效率。

---

## 2. Stories

### S3.1: ComponentRegistry 版本化
**工时**: 3h | **负责人**: dev

#### 背景
Canvas ComponentRegistry 无版本控制，新增组件无法热加载，旧组件缓存导致 UI 错位。用户经常需要手动清除浏览器缓存才能看到更新后的组件。

#### 实现方案

**Registry Entry 扩展**:
```typescript
// packages/component-registry/types.ts
export interface RegistryEntry {
  version: string;
  component: React.ComponentType<any>;
  hash: string;
  registeredAt: number;
  metadata: {
    author: string;
    description?: string;
    tags?: string[];
  };
}

export interface ComponentRegistry {
  register(def: ComponentDefinition): RegistryEntry;
  get(id: string): RegistryEntry | undefined;
  getVersion(id: string): string;
  invalidate(id: string): void;
  invalidateAll(): void;
}
```

**Hash 计算 + 热更新**:
```typescript
// packages/component-registry/registry.ts
import { createHash } from 'crypto';

export class ComponentRegistryImpl implements ComponentRegistry {
  private entries = new Map<string, RegistryEntry>();

  register(def: ComponentDefinition): RegistryEntry {
    const hash = createHash('sha256')
      .update(JSON.stringify(def))
      .digest('hex')
      .slice(0, 8);

    const entry: RegistryEntry = {
      version: def.version || '1.0.0',
      component: def.component,
      hash,
      registeredAt: Date.now(),
      metadata: def.metadata || {},
    };

    this.entries.set(def.id, entry);
    
    // 通知热更新（如在 HMR 环境）
    if (import.meta.hot) {
      import.meta.hot.invalidate({
        type: 'registry-update',
        id: def.id,
        hash,
      });
    }

    return entry;
  }

  get(id: string): RegistryEntry | undefined {
    return this.entries.get(id);
  }

  getVersion(id: string): string {
    return this.entries.get(id)?.version || 'unknown';
  }

  invalidate(id: string): void {
    this.entries.delete(id);
  }

  invalidateAll(): void {
    this.entries.clear();
  }
}
```

**客户端热更新监听**:
```typescript
// 在 Canvas 入口注册
if (import.meta.hot) {
  import.meta.hot.accept({
    type: 'registry-update',
    handler: ({ id, hash }) => {
      console.log(`[Registry] Component ${id} updated, hash: ${hash}`);
      // 触发组件重新渲染
      store.getState().invalidateComponent(id);
    },
  });
}
```

#### 文件变更
```
packages/component-registry/types.ts    — 新增 RegistryEntry 类型
packages/component-registry/registry.ts — 实现版本化注册
packages/component-registry/hmr.ts     — 新增 HMR 集成
```

#### 验收标准
- [ ] 组件版本变更自动热更新（无需手动清除缓存）
- [ ] `registry.getVersion(id)` 返回正确版本号
- [ ] Registry hash 变更触发 UI 更新

#### 测试
```typescript
test('组件 hash 变更触发热更新', async () => {
  const registry = new ComponentRegistryImpl();
  const mockComponent = () => null;
  
  const entry1 = registry.register({ id: 'rect', component: mockComponent, version: '1.0.0' });
  const hash1 = entry1.hash;
  
  const entry2 = registry.register({ id: 'rect', component: mockComponent, version: '1.0.1' });
  const hash2 = entry2.hash;
  
  expect(hash1).not.toBe(hash2);
  expect(registry.getVersion('rect')).toBe('1.0.1');
});
```

---

### S3.2: Reviewer 任务派发去重
**工时**: 2h | **负责人**: analyst/dev

#### 背景
同一 PR 被多个 subagent 并发 review，重复工作浪费资源。Reviewer agent 在收到任务派发时未检查该 PR 是否已有活跃 review session。

#### 实现方案

**Step 1**: 添加活跃 review 检查
```python
# scripts/task_manager.py
def is_review_in_progress(pr_id: str) -> bool:
    """检查是否有活跃的 review 任务"""
    # 检查 team-tasks 中是否存在 review 状态的任务
    tasks = load_tasks()
    for task in tasks.values():
        if task.get('stage') == 'review' and task.get('pr_id') == pr_id:
            # 检查任务是否在超时时间内
            created_at = task.get('created_at', 0)
            if time.time() - created_at < REVIEW_TIMEOUT_SECONDS:
                return True
    return False

def assign_review_task(pr_id: str, reviewer: str) -> Optional[str]:
    """派发 review 任务前检查重复"""
    if is_review_in_progress(pr_id):
        logger.info(f"PR {pr_id} 已有活跃 review，跳过派发")
        return None
    
    task_id = create_task(stage='review', pr_id=pr_id, assignee=reviewer)
    return task_id
```

**Step 2**: Slack 通知优化
```python
def notify_reviewer(task_id: str, pr_id: str, url: str):
    """发送 review 通知前检查"""
    if is_review_in_progress(pr_id):
        logger.info(f"PR {pr_id} 已有活跃 review，跳过 Slack 通知")
        return
    # ... 发送通知
```

**Step 3**: CI 检查
```yaml
# .github/workflows/reviewer-dedup.yml
- name: Check active reviews
  run: |
    python3 scripts/task_manager.py check-review --pr-id ${{ github.event.pull_request.number }}
```

#### 文件变更
```
scripts/task_manager.py                   — 新增 is_review_in_progress, assign_review_task
.github/workflows/reviewer-dedup.yml     — 新增 CI 检查
```

#### 验收标准
- [ ] 同一 PR 不被并发 review（连续派发去重率 100%）
- [ ] `python3 scripts/task_manager.py check-review --pr-id <id>` 返回正确状态
- [ ] review 任务去重率 ≥ 90%（生产验证）

#### 测试
```python
def test_review_dedup():
    """验证 reviewer 任务去重"""
    # 模拟第一次派发
    task_id1 = assign_review_task(pr_id='PR-123', reviewer='agent-reviewer')
    assert task_id1 is not None
    
    # 模拟第二次派发（同一 PR）
    task_id2 = assign_review_task(pr_id='PR-123', reviewer='agent-reviewer')
    assert task_id2 is None  # 应该跳过
    
    # 验证任务确实只创建了一个
    tasks = get_tasks_by_pr('PR-123')
    assert len(tasks) == 1
```

---

## 3. Epic Acceptance Criteria

- [ ] S3.1: ComponentRegistry 支持版本 + hash 热更新
- [ ] S3.2: Reviewer 任务派发去重逻辑实现并验证
- [ ] 所有变更经过 code review
- [ ] Sprint 2 完成

## 4. 依赖关系

| Story | 前置依赖 | 说明 |
|-------|----------|------|
| S3.1 | Wrangler 部署成功（S1.3） | 需要确认 HMR 在 CF Workers 环境兼容 |
| S3.2 | 提案追踪 CLI CI 集成（S2.4） | 使用相同的任务检查框架 |
