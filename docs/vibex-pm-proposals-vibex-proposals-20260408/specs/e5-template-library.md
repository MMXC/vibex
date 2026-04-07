# Spec: Epic E5 — 需求模板库

## 1. 模板 JSON

```json
// templates/requirement-templates.json
[
  {
    "id": "ecommerce",
    "name": "电商系统",
    "icon": "🛒",
    "description": "商品/订单/支付/物流",
    "template": "我需要一个电商平台，包含以下核心功能：..."
  },
  {
    "id": "social",
    "name": "社交平台",
    "icon": "👥",
    "description": "用户/内容/关系/消息",
    "template": "我需要一个社交平台，包含..."
  }
]
```

## 2. 组件集成

```typescript
// CanvasPage.tsx
const templates = useTemplateStore(s => s.templates);
const handleSelectTemplate = (template: RequirementTemplate) => {
  setRequirementInput(template.template);
};
```

## 3. 验收标准

```typescript
expect(screen.getAllByText(/电商系统/i).length).toBeGreaterThan(0);
await userEvent.click(screen.getByText('电商系统'));
expect(screen.getByRole('textbox').value).toContain('电商');
```
