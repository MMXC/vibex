# Epic E07 Spec: 快捷键系统

> **Epic ID**: E07
> **Epic 名称**: 快捷键系统
> **优先级**: P2
> **预计工时**: 1h
> **关联 Feature**: F07
> **关联提案**: P007

---

## 1. 概述

为编辑器和工作流提供常用快捷键支持，提升高级用户操作效率。

---

## 2. 快捷键配置

### 2.1 全局快捷键

| 快捷键 | 操作 | 适用范围 |
|--------|------|---------|
| Ctrl+S / Cmd+S | 保存 | 全局（有编辑功能时） |
| Ctrl+Z / Cmd+Z | 撤销 | 全局 |
| Ctrl+Shift+Z / Cmd+Shift+Z | 重做 | 全局 |
| Ctrl+/ / Cmd+/ | 打开快捷键面板 | 全局 |
| Escape | 关闭弹窗/退出聚焦 | 全局 |

### 2.2 页面快捷键

| 快捷键 | 操作 | 适用范围 |
|--------|------|---------|
| Ctrl+Enter | 提交分析 | 首页输入框 |
| Ctrl+K | 快速搜索 | 项目列表页 |
| N | 新建项目 | 项目列表页 |

---

## 3. 组件设计

### 3.1 ShortcutProvider

```typescript
// src/components/ShortcutProvider.tsx
interface ShortcutProviderProps {
  children: ReactNode
  shortcuts: ShortcutConfig[]
}

interface ShortcutConfig {
  key: string           // "ctrl+s"
  action: () => void
  description: string
  enabled?: boolean
}
```

### 3.2 ShortcutsPanel

| 属性 | 类型 | 说明 |
|------|------|------|
| isOpen | boolean | 面板显示状态 |
| onClose | () => void | 关闭回调 |

**展示**: 所有可用快捷键列表，按分组展示

---

## 4. 实现细节

```typescript
// src/hooks/useKeyboardShortcut.ts
export function useKeyboardShortcut(
  key: string,
  handler: () => void,
  options?: { enabled?: boolean; preventDefault?: boolean }
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!options?.enabled ?? true) return
      
      const keyCombo = [
        e.ctrlKey ? 'ctrl' : '',
        e.metaKey ? 'cmd' : '',
        e.shiftKey ? 'shift' : '',
        e.altKey ? 'alt' : '',
        e.key.toLowerCase()
      ].filter(Boolean).join('+')
      
      if (keyCombo === key) {
        if (options?.preventDefault !== false) {
          e.preventDefault()
        }
        handler()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, handler, options])
}
```

---

## 5. Stories 实现细节

### E07-S1: 快捷键注册（0.5h）

- [ ] 创建 `useKeyboardShortcut` hook
- [ ] 在核心页面注册 Ctrl+S/Ctrl+Z/Ctrl+/
- [ ] 实现撤销/重做栈
- [ ] 冲突检测（与浏览器默认快捷键）

### E07-S2: 快捷键面板（0.5h）

- [ ] 创建 `ShortcutsPanel` 组件
- [ ] 快捷键列表数据
- [ ] 打开/关闭动画
- [ ] 分组展示（全局/页面级）

---

## 6. 验收测试用例

```typescript
describe('E07 快捷键系统', () => {
  it('E07-S1: Ctrl+S 保存', async ({ page }) => {
    await page.goto('/projects/proj_xxx')
    await page.keyboard.press('Control+s')
    await expect(page.locator('.save-indicator')).toContainText('已保存')
  })

  it('E07-S1: Ctrl+Z 撤销', async ({ page }) => {
    await page.goto('/projects/proj_xxx')
    await page.fill('#input', 'original')
    await page.keyboard.press('Control+z')
    await expect(page.locator('#input')).toHaveValue('')
  })

  it('E07-S2: 快捷键面板打开', async ({ page }) => {
    await page.keyboard.press('Control+/')
    await expect(page.locator('.shortcuts-panel')).toBeVisible()
  })

  it('E07-S2: 面板显示所有快捷键', async ({ page }) => {
    await page.keyboard.press('Control+/')
    await expect(page.locator('.shortcut-item').count()).toBeGreaterThan(3)
  })
})
```
