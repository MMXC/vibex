# AGENTS.md — vibex-proposals-20260405 开发约束

**项目**: vibex-proposals-20260405
**日期**: 2026-04-05
**仓库**: /root/.openclaw/vibex

---

## 1. 角色职责

| 角色 | 职责 |
|------|------|
| **Dev** | 实现 API 端点 + 虚假完成检测 |
| **Architect** | 架构设计 + 接口定义 |
| **Reviewer** | API 审查 + 验收测试 |

---

## 2. E1: Canvas API 开发约束

### 2.1 禁止事项

```typescript
// ❌ 禁止：抛出异常（必须返回 NextResponse.json）
throw new Error('something');

// ❌ 禁止：无 .catch() 的 AI 服务调用
const result = await aiService.generateJSON(...);

// ❌ 禁止：部分响应缺少字段
return { success: true };  // ← 必须包含 data
```

### 2.2 必须事项

```typescript
// ✅ 必须：添加 .catch()
const result = await aiService.generateJSON(...).catch(err => ({
  success: false, error: err.message, data: null,
}));

// ✅ 必须：输入验证（最早执行）
if (!body?.requirementText?.trim()) {
  return NextResponse.json({ success: false, data: [], error: '...' }, { status: 400 });
}

// ✅ 必须：统一响应字段
{ success: boolean, data?: T, error?: string, generationId?: string }
```

### 2.3 新端点创建模板

```typescript
// src/app/api/v1/canvas/{endpoint}/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.requirementText?.trim()) {
      return NextResponse.json({ success: false, data: [], error: 'requirementText 不能为空' }, { status: 400 });
    }
    if (!process.env.MINIMAX_API_KEY) {
      return NextResponse.json({ success: false, data: [], error: 'AI 服务未配置' }, { status: 500 });
    }
    const result = await aiService.generateJSON(...).catch(err => ({ success: false, error: err.message, data: null }));
    if (!result.success) {
      return NextResponse.json({ success: false, data: [], error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    return NextResponse.json({ success: false, data: [], error: '服务器内部错误' }, { status: 500 });
  }
}
```

---

## 3. E4: 虚假完成检测约束

```python
# task_manager.py — validate_task_completion

# ✅ 正确：commit hash 不变时警告
def validate_task_completion(project, stage, info, repo):
    current_commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo).decode().strip()
    if info.get('commit') == current_commit:
        print(f"⚠️ Warning: No new commit since last done. Stage may be 虚假完成.")
        return False  # 虚假完成

# ❌ 错误：不检查 commit
# ❌ 错误：不检查测试文件（Dev 任务）
```

---

## 4. Git 提交规范

```bash
feat(api): generate-flows 端点实现
feat(api): generate-components 端点实现
fix(api): Canvas API 错误处理规范化
feat(tracker): 提案执行追踪机制
feat(quality): 虚假完成检测自动化
test(api): generate-flows 单元测试
test(api): generate-components 单元测试
test(quality): validate_task_completion 单元测试
```

---

## 5. 代码审查清单

### E1 API 端点
- [ ] `requirementText` 非空验证最早执行
- [ ] `.catch()` 存在且返回 `{ success: false, ... }`
- [ ] 所有分支返回 `NextResponse.json()`（无 throw）
- [ ] 响应包含 `success` + `data` 字段

### E4 虚假完成检测
- [ ] `validate_task_completion()` 在 done 时被调用
- [ ] Dev 任务检查测试文件变更
- [ ] commit hash 不变时警告输出

### E2 提案追踪
- [ ] `EXECUTION_TRACKER.json` 每日更新
- [ ] 提案状态与 task 状态同步

---

## 6. 回滚条件

| 触发条件 | 回滚 |
|---------|------|
| API 返回 500 | `git checkout HEAD --` 相应 route.ts |
| 虚假完成检测误报 | 调整 validate 函数阈值 |
| 提案追踪数据不一致 | 重新生成 EXECUTION_TRACKER.json |

---

*本文档由 Architect Agent 生成于 2026-04-05 00:20 GMT+8*
