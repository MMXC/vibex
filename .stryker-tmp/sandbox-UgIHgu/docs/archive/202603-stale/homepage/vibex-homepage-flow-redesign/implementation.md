# vibex-homepage-flow-redesign 实现方案

## 背景

当前首页流程存在以下问题需要重构：
1. 步骤状态流转不完整
2. 数据在步骤间传递不完整
3. 缺少错误恢复机制

## 分析

### 现有代码结构
- `src/components/homepage/HomePage.tsx` - 主页面组件
- `src/components/homepage/hooks/useHomePage.ts` - 状态管理 Hook
- `src/components/homepage/InputArea/` - 输入区域组件
- `src/components/homepage/PreviewArea/` - 预览区域组件
- `src/components/homepage/Sidebar/` - 侧边栏组件

### 影响范围
- HomePage 组件及子组件
- useHomePage Hook
- InputArea/PreviewArea 组件

## 方案设计

### 方案A (推荐): 基于现有 Hook 增强
- 优点: 改动最小，复用现有代码
- 缺点: 需要仔细处理状态同步

### 方案B: 完全重构 HomePage
- 优点: 结构更清晰
- 缺点: 工作量大，风险高

## 实施步骤

1. 分析现有代码结构
2. 编写 useHomePage 增强方案
3. 修改 HomePage 布局
4. 添加状态持久化
5. 验证 Build

## 验收标准
- [ ] npm run build 通过
- [ ] 步骤 1→5 完整流转
- [ ] 错误可恢复

## 回滚计划
- 使用 git revert 回滚提交
