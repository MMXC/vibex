# Epic4-错误处理与降级 实现方案

## 背景
Epic 4 目标：确保 CardTree 的错误处理和降级机制完善，保证线上稳定性。

## Epic 3 产出物验证
- CardTreeView ✅ (条件渲染、Feature Flag)
- CardTreeSkeleton ✅ (加载状态)
- FeatureFlagToggle ✅ (手动开关)

## 错误处理实现

### 4.1: useProjectTree 错误处理 ✅
**文件**: `src/hooks/useProjectTree.ts`

| 场景 | 处理方式 | 状态 |
|------|---------|------|
| API 超时（10s） | throw Error + CardTreeError 显示 | ✅ |
| API 500/网络错误 | React Query retry (最多1次，指数退避) | ✅ |
| API 404/无数据 | 返回空 nodes[] | ✅ |
| Mock 数据降级 | useMockOnError=true 时返回 MOCK_DATA | ✅ |
| Null projectId | 返回 MOCK_DATA | ✅ |

### 4.2: CardTreeError 组件 ✅
**文件**: `src/components/homepage/CardTree/CardTreeError.tsx`
- 展示错误信息
- 重试按钮（调用 refetch）
- role="alert" 无障碍支持
- 支持自定义 className

### 4.3: CardTreeView 状态机 ✅
**文件**: `src/components/homepage/CardTree/CardTreeView.tsx`

```
isEnabled=false → null (显示 GridLayout)
isEnabled=true + isLoading=true → CardTreeSkeleton
isEnabled=true + error=true → CardTreeError (重试)
isEnabled=true + 数据为空 → EmptyState
isEnabled=true + 数据正常 → CardTreeRenderer
```

### 4.4: Feature Flag 控制发布 ✅
**环境变量**: `NEXT_PUBLIC_USE_CARD_TREE`
- `true`: 启用 CardTree
- 默认/false: 回退到 GridLayout（MermaidPreview）
- FeatureFlagToggle: 手动临时覆盖

## 降级验证

### 降级路径
1. **API 失败** → 显示 CardTreeError → 用户重试
2. **Feature Flag=false** → 返回 null → PreviewArea 显示 MermaidPreview
3. **Mock 数据** → 黄色 banner 提示（isMockData=true）
4. **超时** → 显示"请求超时（10秒）" → 重试

## 测试覆盖

| 文件 | 测试用例 | 状态 |
|------|---------|------|
| CardTreeError.test.tsx | rendering, interaction, timeout, custom class | ✅ 8 tests |
| CardTreeView.test.tsx | feature flag, loading, error, empty, mock, callbacks | ✅ 12 tests |
| CardTreeSkeleton.test.tsx | rendering | ✅ 3 tests |
| FeatureFlagToggle.test.tsx | toggle UI | ✅ 3 tests |
| useProjectTree.test.tsx | null projectId, mock fallback, API error | ✅ 5 tests |

## 验收标准
- [x] TypeScript 0 errors
- [x] 39 tests pass (CardTree)
- [x] CardTreeError 展示错误信息 + 重试
- [x] CardTreeSkeleton 加载状态
- [x] Feature Flag 控制 CardTree/GridLayout 切换
- [x] Mock 数据降级 (isMockData 标识)
- [x] 超时处理 (10s abort + message)
- [x] 不破坏现有功能 (GridLayout fallback)

## 产出
- `src/components/homepage/CardTree/CardTreeError.tsx` ✅
- `src/components/homepage/CardTree/__tests__/CardTreeError.test.tsx` ✅
- 已在 Epic1-3 实现 `useProjectTree` 错误处理 ✅
- 已在 Epic3 实现 `CardTreeView` 状态机 ✅

**实现方式**: Epic 1-3 的代码已包含完整的错误处理与降级，无需额外开发。
