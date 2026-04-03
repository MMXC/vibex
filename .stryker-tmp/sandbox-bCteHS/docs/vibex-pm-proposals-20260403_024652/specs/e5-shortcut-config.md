# Epic E5 Spec: 快捷键个性化配置

**Epic**: E5 - 快捷键个性化配置
**优先级**: P3
**工时**: 4-5h
**依赖**: Sprint 3 E4 快捷键完成
**状态**: 规划中

---

## 1. Overview

### 1.1 目标
提供本地快捷键配置功能，Power User 可自定义快捷键映射。

### 1.2 用户价值
- 效率用户可以自定义不熟悉的快捷键
- 冲突检测避免误绑定
- 配置持久化，跨会话保持

---

## 2. Page Structure

### 2.1 设置页面 Tab

```
设置
───────────────────────────────────────────────
[通用] [快捷键] [主题] [导出] [关于]

快捷键配置
───────────────────────────────────────────────

┌─ 导航 ─────────────────────────────────────┐
│ 切换到画布         ⌘ + 1        [编辑]       │
│ 切换到流程         ⌘ + 2        [编辑]       │
│ 切换到组件         ⌘ + 3        [编辑]       │
│ 打开设置           ⌘ + ,        [编辑]       │
└─────────────────────────────────────────────┘

┌─ 编辑 ─────────────────────────────────────┐
│ 撤销               ⌘ + Z        [编辑]       │
│ 重做               ⌘ + ⇧ + Z   [编辑]       │
│ 保存               ⌘ + S        [编辑]       │
│ 删除               Delete       [编辑]       │
└─────────────────────────────────────────────┘

┌─ 视图 ─────────────────────────────────────┐
│ 放大                 +          [编辑]       │
│ 缩小                 -          [编辑]       │
│ 重置缩放             0          [编辑]       │
│ 全屏                 F11       [编辑]       │
└─────────────────────────────────────────────┘

┌─ Phase 切换 ───────────────────────────────┐
│ 上一个 Phase        ⌘ + [        [编辑]       │
│ 下一个 Phase        ⌘ + ]        [编辑]       │
└─────────────────────────────────────────────┘

[重置为默认]
```

---

## 3. Component Design

### 3.1 核心组件

| 组件名 | 文件 | 职责 |
|--------|------|------|
| ShortcutSettings | `pages/settings/shortcuts.tsx` | 快捷键设置页面 |
| ShortcutCategory | `components/shortcuts/ShortcutCategory.tsx` | 快捷键分类组件 |
| ShortcutRow | `components/shortcuts/ShortcutRow.tsx` | 快捷键行组件 |
| ShortcutEditModal | `components/shortcuts/ShortcutEditModal.tsx` | 编辑弹窗 |
| ConflictWarning | `components/shortcuts/ConflictWarning.tsx` | 冲突警告 |
| ShortcutUsageStats | `components/shortcuts/ShortcutUsageStats.tsx` | 使用统计 |

### 3.2 Store Design

```typescript
// stores/shortcutStore.ts
interface ShortcutConfig {
  action: string;
  defaultKey: string;
  currentKey: string;
  category: ShortcutCategory;
}

interface ShortcutState {
  shortcuts: ShortcutConfig[];
  editingAction: string | null;
  conflictKey: string | null;
  
  // Actions
  loadShortcuts: () => void;
  startEditing: (action: string) => void;
  cancelEditing: () => void;
  captureKey: (key: string) => ConflictCheckResult;
  saveShortcut: (action: string, key: string) => void;
  resetToDefault: () => void;
  resetAll: () => void;
}

type ShortcutCategory = 'navigation' | 'edit' | 'view' | 'phase';
```

---

## 4. Default Shortcuts

### 4.1 导航快捷键

| Action | Default | Description |
|--------|---------|-------------|
| go-to-canvas | Cmd+1 | 切换到画布 |
| go-to-flows | Cmd+2 | 切换到流程 |
| go-to-components | Cmd+3 | 切换到组件 |
| go-to-settings | Cmd+, | 打开设置 |

### 4.2 编辑快捷键

| Action | Default | Description |
|--------|---------|-------------|
| undo | Cmd+Z | 撤销 |
| redo | Cmd+Shift+Z | 重做 |
| save | Cmd+S | 保存 |
| delete | Delete | 删除 |
| copy | Cmd+C | 复制 |
| paste | Cmd+V | 粘贴 |

### 4.3 视图快捷键

| Action | Default | Description |
|--------|---------|-------------|
| zoom-in | + | 放大 |
| zoom-out | - | 缩小 |
| zoom-reset | 0 | 重置缩放 |
| fullscreen | F11 | 全屏 |
| toggle-sidebar | Cmd+B | 切换侧边栏 |

### 4.4 Phase 切换快捷键

| Action | Default | Description |
|--------|---------|-------------|
| prev-phase | Cmd+[ | 上一个 Phase |
| next-phase | Cmd+] | 下一个 Phase |
| first-phase | Cmd+Home | 第一个 Phase |
| last-phase | Cmd+End | 最后一个 Phase |

---

## 5. Key Capture Implementation

### 5.1 编辑弹窗

```
┌─────────────────────────────────────────────┐
│  修改快捷键                                  │
│                                             │
│  操作: 保存                                  │
│  当前: ⌘ + S                               │
│                                             │
│  请按下新的快捷键:                           │
│                                             │
│  ┌─────────────────────────────────┐        │
│  │                                 │        │
│  │        按键预览区域              │        │
│  │                                 │        │
│  └─────────────────────────────────┘        │
│                                             │
│  ⚠️  冲突: 此快捷键已被"打开设置"使用         │
│                                             │
│           [取消]            [保存(禁用)]    │
│                                             │
└─────────────────────────────────────────────┘
```

### 5.2 按键捕获逻辑

```typescript
// hooks/useKeyCapture.ts
const useKeyCapture = () => {
  const [capturedKey, setCapturedKey] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  useEffect(() => {
    if (!isCapturing) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Build key string
      const parts: string[] = [];
      if (e.metaKey || e.ctrlKey) parts.push('Cmd');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      
      // Key name
      const keyName = e.key.length === 1 
        ? e.key.toUpperCase() 
        : e.key;
      parts.push(keyName);
      
      const keyString = parts.join('+');
      setCapturedKey(keyString);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCapturing]);
  
  return { capturedKey, isCapturing, setIsCapturing };
};
```

### 5.3 冲突检测

```typescript
// utils/shortcutConflict.ts
interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingAction?: string;
}

const checkConflict = (
  key: string,
  shortcuts: ShortcutConfig[],
  currentAction?: string
): ConflictCheckResult => {
  const conflict = shortcuts.find(
    s => s.currentKey === key && s.action !== currentAction
  );
  
  if (conflict) {
    return {
      hasConflict: true,
      conflictingAction: conflict.action,
    };
  }
  
  return { hasConflict: false };
};
```

---

## 6. Storage Schema

### 6.1 localStorage Key

Key: `vibex-shortcuts`

### 6.2 Storage Format

```typescript
interface ShortcutStorage {
  version: 1;
  shortcuts: {
    [action: string]: string; // action -> key mapping
  };
  usageStats: {
    [action: string]: number; // action -> usage count
  };
  updatedAt: string;
}
```

### 6.3 Storage 示例

```json
{
  "version": 1,
  "shortcuts": {
    "go-to-canvas": "Cmd+1",
    "go-to-flows": "Cmd+2",
    "go-to-components": "Cmd+3",
    "go-to-settings": "Cmd+,",
    "undo": "Cmd+Z",
    "redo": "Cmd+Shift+Z",
    "save": "Cmd+S",
    "delete": "Delete"
  },
  "usageStats": {
    "save": 42,
    "undo": 38,
    "delete": 15
  },
  "updatedAt": "2026-04-03T10:00:00Z"
}
```

---

## 7. Integration with ShortcutHintPanel

### 7.1 使用自定义配置

```typescript
// hooks/useKeyboardShortcuts.ts
const useKeyboardShortcuts = () => {
  const { shortcuts } = useShortcutStore();
  
  useEffect(() => {
    // Load custom config
    const customConfig = loadFromStorage();
    
    // Register shortcuts with custom bindings
    shortcuts.forEach(shortcut => {
      const key = customConfig?.shortcuts[shortcut.action] || shortcut.default;
      hotkeys.register(shortcut.action, key, shortcut.handler);
    });
    
    return () => {
      hotkeys.unregisterAll();
    };
  }, [shortcuts]);
};
```

### 7.2 ShortcutHintPanel 集成

```typescript
// components/shortcuts/ShortcutHintPanel.tsx
const ShortcutHintPanel: React.FC = () => {
  const { shortcuts } = useShortcutStore();
  const customConfig = loadFromStorage();
  
  return (
    <div className="shortcut-hints">
      {shortcuts.map(shortcut => {
        // Use custom key if available
        const displayKey = customConfig?.shortcuts[shortcut.action] 
          || shortcut.default;
        
        return (
          <div key={shortcut.action} className="hint-item">
            <span className="action">{shortcut.description}</span>
            <kbd className="key">{displayKey}</kbd>
          </div>
        );
      })}
    </div>
  );
};
```

---

## 8. Acceptance Criteria

### E5-S1: 快捷键配置 Tab
- [ ] `expect(shortcutsTab.isVisible()).toBe(true)` 快捷键Tab可见
- [ ] `expect(shortcutsTab.find('tab-nav').getText()).toContain('导航')` 导航分类存在
- [ ] `expect(shortcutsTab.find('tab-edit').getText()).toContain('编辑')` 编辑分类存在
- [ ] `expect(shortcutsTab.find('tab-view').getText()).toContain('视图')` 视图分类存在
- [ ] `expect(shortcutsTab.find('tab-phase').getText()).toContain('Phase切换')` Phase分类存在

### E5-S2: 快捷键重绑定
- [ ] `expect(shortcutItem.find('.edit-btn').isClickable()).toBe(true)` 编辑按钮可点击
- [ ] `expect(shortcutItem.find('.input').isFocused()).toBe(true)` 进入编辑模式
- [ ] `expect(keyboard.press('Cmd+S').inInput(shortcutItem)).toCaptureKey()` 捕获按键
- [ ] `expect(shortcutItem.find('.new-key').getText()).toBe('⌘S')` 显示新快捷键

### E5-S3: 冲突检测与提示
- [ ] `expect(conflictWarning.isVisible()).toBe(true)` 冲突警告可见
- [ ] `expect(conflictWarning.getText()).toContain('冲突')` 警告文案正确
- [ ] `expect(saveBtn.isDisabled()).toBe(true)` 冲突时保存按钮禁用

### E5-S4: 配置持久化与生效
- [ ] `expect(localStorage.get('vibex-shortcuts')).toBeTruthy()` 配置已存储
- [ ] `expect(shortcutManager.getActiveShortcut('Cmd+S')).toBe('save')` 新快捷键生效
- [ ] `expect(shortcutManager.usesCustomConfig()).toBe(true)` 使用自定义配置

### E5-S5: 重置默认
- [ ] `expect(resetBtn.isVisible()).toBe(true)` 重置按钮可见
- [ ] `expect(resetBtn.isClickable()).toBe(true)` 按钮可点击
- [ ] `expect(localStorage.get('vibex-shortcuts')).toBeNull()` 配置已清除
- [ ] `expect(shortcutManager.getActiveShortcut('Cmd+S')).toBeDefault('save')` 恢复默认

---

## 9. Test Cases

### TC-E5-001: 显示快捷键列表
```typescript
test('TC-E5-001: 应显示所有快捷键分类', async ({ page }) => {
  await page.goto('/settings/shortcuts');
  
  await expect(page.locator('.shortcut-category')).toHaveCount(4);
  await expect(page.locator('.shortcut-category').nth(0)).toContainText('导航');
  await expect(page.locator('.shortcut-category').nth(1)).toContainText('编辑');
  await expect(page.locator('.shortcut-category').nth(2)).toContainText('视图');
  await expect(page.locator('.shortcut-category').nth(3)).toContainText('Phase');
});
```

### TC-E5-002: 重绑定快捷键
```typescript
test('TC-E5-002: 应能重绑定快捷键', async ({ page }) => {
  await page.goto('/settings/shortcuts');
  
  // Click edit on "保存" shortcut
  await page.click('.shortcut-row[data-action="save"] .edit-btn');
  
  // Modal should open
  await expect(page.locator('#shortcut-edit-modal')).toBeVisible();
  
  // Press new key
  await page.keyboard.press('Cmd+Alt+S');
  
  // Preview should show new key
  await expect(page.locator('#key-preview')).toContainText('⌘⌥S');
  
  // Save
  await page.click('#save-btn');
  
  // Modal should close
  await expect(page.locator('#shortcut-edit-modal')).not.toBeVisible();
  
  // Shortcut should be updated
  await expect(page.locator('.shortcut-row[data-action="save"] .key')).toContainText('⌘⌥S');
});
```

### TC-E5-003: 冲突检测
```typescript
test('TC-E5-003: 冲突快捷键应显示警告', async ({ page }) => {
  await page.goto('/settings/shortcuts');
  
  // Edit "保存" shortcut
  await page.click('.shortcut-row[data-action="save"] .edit-btn');
  
  // Press key that conflicts with "打开设置" (Cmd+,)
  await page.keyboard.press('Cmd+Comma');
  
  // Conflict warning should appear
  await expect(page.locator('#conflict-warning')).toBeVisible();
  await expect(page.locator('#conflict-warning')).toContainText('冲突');
  await expect(page.locator('#conflict-warning')).toContainText('打开设置');
  
  // Save button should be disabled
  await expect(page.locator('#save-btn')).toBeDisabled();
});
```

### TC-E5-004: 配置持久化
```typescript
test('TC-E5-004: 快捷键配置应持久化', async ({ page }) => {
  await page.goto('/settings/shortcuts');
  
  // Change shortcut
  await page.click('.shortcut-row[data-action="save"] .edit-btn');
  await page.keyboard.press('Cmd+Alt+S');
  await page.click('#save-btn');
  
  // Reload page
  await page.reload();
  
  // Change should persist
  await expect(page.locator('.shortcut-row[data-action="save"] .key')).toContainText('⌘⌥S');
});
```

### TC-E5-005: 重置为默认
```typescript
test('TC-E5-005: 重置为默认应恢复所有快捷键', async ({ page }) => {
  await page.goto('/settings/shortcuts');
  
  // Change a shortcut
  await page.click('.shortcut-row[data-action="save"] .edit-btn');
  await page.keyboard.press('Cmd+Alt+S');
  await page.click('#save-btn');
  
  // Click reset all
  await page.click('#reset-all-btn');
  await page.click('#confirm-reset');
  
  // Should restore to default
  await expect(page.locator('.shortcut-row[data-action="save"] .key')).toContainText('⌘S');
});
```

---

## 10. Milestone

| 日期 | 里程碑 |
|------|--------|
| Week 1 | 完成快捷键配置页面和基础编辑功能 |
| Week 2 | 完成冲突检测和持久化 |
| Week 3 | 完成重置功能和集成测试 |
