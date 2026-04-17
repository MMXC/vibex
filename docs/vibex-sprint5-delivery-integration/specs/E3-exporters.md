# Spec: E3 — 交付导出器规格

**对应 Epic**: E3 交付导出器
**目标文件**: `vibex-fronted/src/lib/delivery/DDLExporter.ts`（新建）
**相关**: `vibex-fronted/src/components/delivery/DeliveryTabs.tsx`, `vibex-fronted/src/components/delivery/ComponentTab.tsx`

---

## 1. DDL 生成器规格

### 接口定义

```typescript
// 文件: src/lib/delivery/DDLExporter.ts

interface DDLExporterOptions {
  dialect: 'postgresql' | 'mysql' | 'sqlite';
  tablePrefix?: string;
}

function exportToDDL(
  contexts: DeliveryContext[],
  options?: DDLExporterOptions
): string {
  const dialect = options?.dialect || 'postgresql';
  const prefix = options?.tablePrefix || '';
  
  return contexts.map(ctx => {
    const tableName = `${prefix}${ctx.name.toLowerCase().replace(/\s+/g, '_')}`;
    return `
CREATE TABLE ${tableName} (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`.trim();
  }).join('\n\n');
}
```

### DDL 生成验证用例

```typescript
// E3-U1: 单个上下文
test('E3-U1: 单个 BoundedContext 生成 CREATE TABLE', () => {
  const ddl = exportToDDL([{ id: 'bc1', name: 'UserDomain', description: 'User management' }]);
  expect(ddl).toMatch(/CREATE TABLE/i);
  expect(ddl).toMatch(/userdomain/i);
  expect(ddl).toMatch(/PRIMARY KEY/i);
});

// E3-U2: 多个上下文
test('E3-U2: 多个 BoundedContext 生成多个 CREATE TABLE', () => {
  const ddl = exportToDDL([
    { id: 'bc1', name: 'UserDomain', description: '' },
    { id: 'bc2', name: 'OrderDomain', description: '' },
  ]);
  expect(ddl.split(/CREATE TABLE/i)).toHaveLength(3);  // 2个TABLE + 1个头
});

// E3-U3: SQL 方言
test('E3-U3: MySQL 方言生成 INT 而非 UUID', () => {
  const ddl = exportToDDL([{ id: 'bc1', name: 'Test', description: '' }], { dialect: 'mysql' });
  expect(ddl).toMatch(/BIGINT/i);
  expect(ddl).not.toMatch(/UUID/i);
});
```

---

## 2. DeliveryTabs 规格

### 理想态
- 5 个 Tab：章节 / 流程 / 组件 / PRD / API（API Tab 条件渲染）
- 当前 Tab 高亮（primary 颜色）
- Tab 可键盘导航

### 空状态
- 每个 Tab 无数据时各自显示引导页（见 specs/E5）

### 加载态
- Tab 切换时目标 Tab 内容区骨架屏
- 当前活跃 Tab 不闪动

### 错误态
- Tab 数据加载失败：该 Tab 显示错误引导，不影响其他 Tab

---

## 3. ComponentTab 规格

### 理想态
- 组件列表（卡片或表格）
- 每个组件显示：名称 / 类型 / 创建时间
- 支持搜索/筛选
- 支持单个导出 JSON

### 空状态
- 引导文案："原型画布中还没有组件"
- 按钮："去原型画布添加"

### 加载态
- 骨架屏占位

### 错误态
- 加载失败：显示错误 + 重试

---

## 4. 批量导出 ZIP Modal

### 理想态
- Modal 列出 4 个导出文件：
  - spec.json（组件规格）
  - openapi.yaml（API 规格，Sprint4 完成后）
  - ddl.sql（DDL）
  - prd.md（PRD）
- 每个文件显示：文件名 + 文件大小
- "全选" 复选框
- "导出选中" 按钮

### 空状态
- 所有文件为空时：按钮禁用

### 加载态
- 导出中显示进度条 + 百分比

### 错误态
- 部分文件失败：显示 "3/4 成功，1 个失败" + 重试失败的
- 全部失败：Modal 显示错误 + 重试

---

## 样式约束

- 间距：8 的倍数
- 颜色：使用 Token
- 禁止硬编码
- Tab 高度：48px
- 按钮：32px 高度
