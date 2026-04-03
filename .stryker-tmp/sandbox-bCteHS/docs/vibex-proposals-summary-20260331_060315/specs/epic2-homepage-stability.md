# Spec: Epic 2 — 首页步骤流转稳定性

**Epic ID**: F2
**文件路径**: /root/.openclaw/vibex/vibex-fronted/src/pages/index.tsx
**状态**: Pending

---

## F2.1 AI 生成进度指示

### 描述
Step1→2→3→4 每步 AI 分析时显示进度指示，禁止用户重复点击提交。

### 验收标准
```javascript
// F2.1
expect(progressBar).toBeVisible();
expect(submitButton).toBeDisabled();
```

### 状态定义
```typescript
type StepState = 'idle' | 'generating' | 'completed' | 'error';
```

### UI 行为
- 生成中：按钮 disabled + 进度条 + "AI 分析中..." 文案
- 完成：进度条消失 + 结果显示 + 按钮恢复
- 错误：红色提示 + 重试按钮

### 组件文件
- `src/pages/index.tsx`（首页主组件）
- 新增 `src/components/homepage/StepProgress.tsx`

---

## F2.2 Session 持久化

### 描述
sessionId + 当前步骤写入 sessionStorage，刷新后恢复。

### 验收标准
```javascript
// F2.2
expect(sessionStorage.getItem('vibex_session')).not.toBeNull();
expect(sessionStorage.getItem('vibex_current_step')).toMatch(/step[1-4]/);
```

### 存储结构
```typescript
interface VibexSession {
  sessionId: string;
  currentStep: 'step1' | 'step2' | 'step3' | 'step4';
  requirement: string;
  stepData: {
    step1?: Step1Data;
    step2?: Step2Data;
    step3?: Step3Data;
    step4?: Step4Data;
  };
}
```

---

## F2.3 跳步保护

### 描述
未完成当前 Step 时切换到下一步，弹窗确认。

### 验收标准
```javascript
// F2.3
const dialog = document.querySelector('[role="dialog"]');
expect(dialog.textContent).toMatch(/未完成|跳过/);
```

### 组件文件
- `src/components/homepage/SkipConfirmDialog.tsx`

---

## F2.4 中断恢复

### 描述
相同 requirement 输入时，基于 sessionId 恢复上次分析进度。

### 验收标准
```javascript
// F2.4
expect(resumeBanner).toBeVisible();
expect(resumeButton).toBeInTheDocument();
```

### 触发条件
- 相同 requirement 输入
- sessionStorage 中有未完成的 session
- 提示文案："检测到未完成分析，是否继续？"
