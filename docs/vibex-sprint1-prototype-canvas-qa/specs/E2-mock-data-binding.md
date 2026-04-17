# Spec: E2 — Mock 数据绑定

**对应 Epic**: E2 Mock 数据绑定
**文件**: `vibex-fronted/src/components/prototype/ProtoAttrPanel.tsx`
**相关**: `vibex-fronted/src/stores/prototypeStore.ts`

---

## ProtoAttrPanel MockData Tab

### 理想态（Ideal）
- Tab 切换到 MockData 时，显示 Key-Value 编辑器
- 每行显示：字段名 input + 值 input + 删除按钮
- 底部有 "添加字段" 按钮
- 保存后节点预览实时更新

### 空状态（Empty）
- 无 mock 数据时显示：
- 文案："还没有绑定模拟数据"
- "添加第一个字段" 按钮
- 引导插图
- 禁止只留白

### 加载态（Loading）
- Tab 切换时显示骨架屏（3 行占位块）
- 禁止使用转圈

### 错误态（Error）
- JSON 格式非法：input 边框变红 + inline 错误文案
- 数据超长：字符数计数 + 警告提示
- 保存失败：toast 提示 + 不丢失已输入内容
- 禁止覆盖用户已输入内容

---

## ProtoNode Mock 渲染

### 理想态（Ideal）
- 节点读取 node.mockData，传递给 ui-schema render 函数
- 渲染结果反映 mock 数据内容（文本/数值/选项等）

### 空状态（Empty）
- 节点无 mockData 时显示组件默认值（DEFAULT_COMPONENTS.defaultProps）

### 加载态（Loading）
- 节点内容使用骨架屏

### 错误态（Error）
- mockData 类型不匹配：显示回退到默认值 + 警告 icon

---

## 样式约束

- 间距：8 的倍数
- 颜色：使用 Token
- 禁止硬编码
