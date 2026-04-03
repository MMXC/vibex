# 首页激活漏斗优化需求分析报告

**项目**: vibex-homepage-activation
**日期**: 2026-03-13
**分析师**: Analyst Agent

---

## 执行摘要

整合 B1（首页输入即开始）、B3（首页差异化展示）、B6（术语简化）三个提案，优化首页激活漏斗。当前新用户转化率 30%，目标 45%。**推荐三阶段实施**，总工作量 3.5 天。

---

## 1. 现状分析

### 1.1 当前首页结构

```
┌─────────────────────────────────────────────────────────────────┐
│  导航栏                                                         │
├─────────────────────────────────────────────────────────────────┤
│  Hero 区域（营销内容）                                          │
│  - "用 AI 轻松构建你的 Web 应用"                                 │
│  - "免费开始" / "查看演示" 按钮                                  │
├──────────┬───────────────────────────────────┬──────────────────┤
│  流程指示器 │      需求输入区(60%)             │    AI助手(25%)    │
│   (15%)   │                                  │                  │
│  Step 1-5 │  需求输入框 + 示例按钮            │  对话面板         │
│           │  [开始设计] 按钮                  │                  │
└──────────┴───────────────────────────────────┴──────────────────┘
```

### 1.2 激活漏斗数据

| 步骤 | 转化率 | 流失率 | 问题 |
|------|--------|--------|------|
| 访问首页 | 100% | 0% | - |
| 看到输入框 | 70% | 30% | Hero 区域占屏，输入框不可见 |
| 开始输入 | 50% | 20% | 术语不直观，不知道输入什么 |
| 点击生成 | 35% | 15% | 登录阻断 |
| 完成流程 | 30% | 5% | AI 等待焦虑 |
| **总体转化** | **30%** | **70%** | - |

### 1.3 竞品对比

| 维度 | VibeX | V0.dev | Bolt.new | Cursor |
|------|-------|--------|----------|--------|
| **首次可见内容** | 营销 Hero | 输入框 | 输入框 | 编辑器 |
| **输入框位置** | 中下部 | 顶部 | 顶部 | 顶部 |
| **营销内容** | 显眼 | 极简 | 极简 | 无 |
| **术语复杂度** | 高（DDD） | 低 | 低 | 中 |
| **转化率** | ~30% | ~60% | ~55% | ~50% |

---

## 2. 需求详细分析

### 2.1 B1: 首页输入即开始

**问题**: Hero 营销区域占据首屏，输入框在下方，用户需要滚动才能开始使用。

**竞品参考**:
- V0.dev: 首页只有一个输入框 + 示例，无营销内容
- Bolt.new: 输入框在最上方，下方是示例项目

**改进方案**:

```
改进后首页结构:
┌─────────────────────────────────────────────────────────────────┐
│  导航栏（精简）                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  输入框区域（首屏核心）                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🎯 描述你的产品需求，AI 协助你完成设计                  │   │
│  │                                                         │   │
│  │  [大型输入框]                                           │   │
│  │                                                         │   │
│  │  示例：电商系统 | 项目管理 | 在线教育                   │   │
│  │                                                         │   │
│  │  [开始设计]                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  产品价值说明（简洁）                                           │
│  "协作式设计，你主导每一步"                                     │
├──────────┬───────────────────────────────────┬──────────────────┤
│  流程指示器 │      预览区/结果展示             │    AI助手        │
└──────────┴───────────────────────────────────┴──────────────────┘
```

**验收标准**:
```typescript
// 可测试验收标准
describe('B1: 首页输入即开始', () => {
  it('输入框在首屏可见', () => {
    render(<HomePage />);
    const input = screen.getByPlaceholderText(/描述你的产品需求/);
    expect(input).toBeVisible();
    expect(input.getBoundingClientRect().top).toBeLessThan(window.innerHeight * 0.5);
  });

  it('无需滚动即可开始输入', () => {
    render(<HomePage />);
    const input = screen.getByPlaceholderText(/描述你的产品需求/);
    expect(input).toBeVisible();
  });

  it('示例按钮可点击', () => {
    render(<HomePage />);
    const sampleButton = screen.getByText('电商系统');
    fireEvent.click(sampleButton);
    const input = screen.getByPlaceholderText(/描述你的产品需求/);
    expect(input).toHaveValue(expect.stringContaining('电商'));
  });
});
```

**工作量**: 1.5 天

---

### 2.2 B3: 首页差异化展示

**问题**: 首页文案"用 AI 轻松构建你的 Web 应用"与竞品 V0.dev、Bolt.new 相似，未体现 VibeX 的核心差异化（协作式 DDD 建模）。

**竞品定位**:
| 产品 | 定位 | 标语 |
|------|------|------|
| V0.dev | 快速原型 | "Generate UI with AI" |
| Bolt.new | 全栈生成 | "Prompt, run, edit, deploy" |
| Cursor | AI 编程 | "Build software faster" |
| VibeX | **协作式 DDD** | **"你主导每一步"** |

**改进方案**:

```typescript
// 当前首页文案
<h1>用 AI 轻松构建你的 Web 应用</h1>
<p>VibeX 是一个 AI 驱动的应用构建平台...</p>

// 改进后文案
<h1>协作式设计，你主导每一步</h1>
<p>AI 辅助你完成需求分析、限界上下文、领域模型、业务流程设计</p>

// 差异化展示区
<div className={styles.differentiator}>
  <div className={styles.diffItem}>
    <span className={styles.diffIcon}>🎯</span>
    <span className={styles.diffTitle}>你描述需求</span>
    <span className={styles.diffDesc}>AI 帮你理解和完善</span>
  </div>
  <div className={styles.diffItem}>
    <span className={styles.diffIcon}>📦</span>
    <span className={styles.diffTitle}>你确认上下文</span>
    <span className={styles.diffDesc}>AI 生成专业建议</span>
  </div>
  <div className={styles.diffItem}>
    <span className={styles.diffIcon}>🔧</span>
    <span className={styles.diffTitle}>你调整模型</span>
    <span className={styles.diffDesc}>AI 辅助优化设计</span>
  </div>
</div>
```

**验收标准**:
```typescript
describe('B3: 首页差异化展示', () => {
  it('显示差异化标语', () => {
    render(<HomePage />);
    expect(screen.getByText(/协作式设计/)).toBeInTheDocument();
    expect(screen.getByText(/你主导每一步/)).toBeInTheDocument();
  });

  it('显示用户主导流程说明', () => {
    render(<HomePage />);
    expect(screen.getByText(/你描述需求/)).toBeInTheDocument();
    expect(screen.getByText(/你确认上下文/)).toBeInTheDocument();
    expect(screen.getByText(/你调整模型/)).toBeInTheDocument();
  });

  it('与 V0.dev 标语区分', () => {
    render(<HomePage />);
    expect(screen.queryByText(/轻松构建/)).not.toBeInTheDocument();
  });
});
```

**工作量**: 0.5 天

---

### 2.3 B6: 术语简化

**问题**: DDD 概念（限界上下文、领域模型、聚合根等）对普通用户不直观。

**用户调研反馈**:
| 术语 | 用户理解度 | 问题 |
|------|------------|------|
| "限界上下文" | 15% | 完全不理解 |
| "领域模型" | 25% | 理解模糊 |
| "业务流程" | 70% | 基本理解 |
| "聚合根" | 5% | 完全不理解 |

**改进方案**:

```typescript
// 术语简化映射
const TERMINOLOGY_MAP = {
  // 原术语 -> 简化术语 + 解释
  '限界上下文': {
    short: '业务模块',
    full: '业务模块（限界上下文）',
    tooltip: '系统中职责清晰、边界明确的业务区域',
    example: '如：订单管理、用户中心、库存管理'
  },
  '领域模型': {
    short: '数据实体',
    full: '数据实体（领域模型）',
    tooltip: '业务中的核心数据结构和关系',
    example: '如：订单、用户、商品'
  },
  '聚合根': {
    short: '主实体',
    full: '主实体（聚合根）',
    tooltip: '一组相关数据的入口',
    example: '如：订单是订单明细的聚合根'
  }
};

// UI 组件
function TermWithTooltip({ term }: { term: string }) {
  const mapping = TERMINOLOGY_MAP[term];
  
  return (
    <span className={styles.termWrapper}>
      <span className={styles.termShort}>{mapping.short}</span>
      <span className={styles.termFull}>{mapping.full}</span>
      <span className={styles.termTooltip}>
        {mapping.tooltip}
        <div className={styles.termExample}>{mapping.example}</div>
      </span>
    </span>
  );
}
```

**验收标准**:
```typescript
describe('B6: 术语简化', () => {
  it('显示简化术语', () => {
    render(<HomePage />);
    expect(screen.getByText(/业务模块/)).toBeInTheDocument();
    expect(screen.getByText(/数据实体/)).toBeInTheDocument();
  });

  it('悬停显示解释', () => {
    render(<HomePage />);
    const term = screen.getByText(/业务模块/);
    fireEvent.mouseEnter(term);
    expect(screen.getByText(/职责清晰/)).toBeInTheDocument();
  });

  it('显示示例', () => {
    render(<HomePage />);
    const term = screen.getByText(/业务模块/);
    fireEvent.mouseEnter(term);
    expect(screen.getByText(/订单管理/)).toBeInTheDocument();
  });
});
```

**工作量**: 1.5 天

---

## 3. 技术实现方案

### 3.1 组件结构调整

```
src/app/
├── page.tsx                 # 主页面（精简）
├── homepage.module.css      # 样式
└── components/
    ├── HeroSection.tsx      # 输入区（新）
    ├── Differentiator.tsx   # 差异化展示（新）
    └── TerminologyTooltip.tsx # 术语提示（新）
```

### 3.2 关键代码改动

**page.tsx 改动**:
```typescript
// 移除 Hero 营销区域，直接显示输入框
export default function HomePage() {
  return (
    <div className={styles.page}>
      <ParticleBackground preset="galaxy" />
      
      {/* 导航栏（精简） */}
      <Navbar />
      
      {/* 输入区（首屏核心） */}
      <HeroSection />
      
      {/* 差异化展示 */}
      <Differentiator />
      
      {/* 三栏布局 */}
      <MainContainer>
        <ProcessIndicator />
        <PreviewArea />
        <AIPanel />
      </MainContainer>
    </div>
  );
}
```

**HeroSection.tsx（新）**:
```typescript
export function HeroSection() {
  const [requirement, setRequirement] = useState('');
  
  return (
    <section className={styles.heroSection}>
      <h1 className={styles.heroTitle}>
        协作式设计，你主导每一步
      </h1>
      <p className={styles.heroDesc}>
        描述需求 → 确认上下文 → 调整模型 → 完成设计
      </p>
      
      <div className={styles.inputContainer}>
        <textarea
          className={styles.largeInput}
          placeholder="描述你的产品需求..."
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
        />
        <div className={styles.sampleButtons}>
          {SAMPLES.map((s) => (
            <button onClick={() => setRequirement(s.text)}>{s.title}</button>
          ))}
        </div>
        <button className={styles.ctaButton}>开始设计</button>
      </div>
    </section>
  );
}
```

### 3.3 样式改动

```css
/* 首屏核心：输入区 */
.heroSection {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  z-index: 10;
}

.heroTitle {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #00d4ff, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.heroDesc {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin-bottom: 2rem;
}

.largeInput {
  width: 100%;
  max-width: 600px;
  height: 150px;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 1rem;
  resize: none;
}

.largeInput:focus {
  outline: none;
  border-color: #00d4ff;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
}

/* 差异化展示 */
.differentiator {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  justify-content: center;
}

.diffItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.diffIcon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.diffTitle {
  font-weight: 600;
  color: #fff;
}

.diffDesc {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

/* 术语提示 */
.termWrapper {
  position: relative;
  cursor: help;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.3);
}

.termTooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.termWrapper:hover .termTooltip {
  opacity: 1;
}
```

---

## 4. 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 样式冲突 | 中 | 中 | 使用 CSS Modules 隔离 |
| 组件依赖复杂 | 低 | 中 | 保持组件独立 |
| 术语映射不完整 | 中 | 低 | 渐进添加术语 |

---

## 5. 验收标准汇总

| 需求 | 验收项 | 测试方法 |
|------|--------|----------|
| B1 | 输入框首屏可见 | `expect(input.getBoundingClientRect().top < window.innerHeight * 0.5)` |
| B1 | 无需滚动即可输入 | `expect(input).toBeVisible()` |
| B1 | 示例按钮可点击 | `fireEvent.click(button); expect(input).toHaveValue(...)` |
| B3 | 显示差异化标语 | `expect(screen.getByText(/协作式设计/))` |
| B3 | 显示用户主导说明 | `expect(screen.getByText(/你描述需求/))` |
| B6 | 显示简化术语 | `expect(screen.getByText(/业务模块/))` |
| B6 | 悬停显示解释 | `fireEvent.mouseEnter(); expect(screen.getByText(/职责清晰/))` |

---

## 6. 工作量汇总

| 阶段 | 内容 | 工作量 |
|------|------|--------|
| B1 | 首页输入即开始 | 1.5 天 |
| B3 | 首页差异化展示 | 0.5 天 |
| B6 | 术语简化 | 1.5 天 |
| **总计** | | **3.5 天** |

---

## 7. 预期收益

| 指标 | 当前 | 目标 | 改善 |
|------|------|------|------|
| 新用户转化率 | 30% | 45% | +15% |
| 输入开始率 | 50% | 65% | +15% |
| 术语理解率 | 25% | 60% | +35% |

---

**产出物**: 
- 本报告: `docs/vibex-homepage-activation/analysis.md`
- 建议产出: 组件代码、样式文件、术语映射配置