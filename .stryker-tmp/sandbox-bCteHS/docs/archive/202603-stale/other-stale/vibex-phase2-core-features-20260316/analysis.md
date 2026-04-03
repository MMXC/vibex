# Phase 2 核心功能特性需求分析

> **项目**: vibex-phase2-core-features-20260316  
> **分析师**: Analyst Agent  
> **日期**: 2026-03-16  
> **状态**: 进行中

---

## 一、项目背景与目标

### 1.1 背景

VibeX 项目已完成 Phase 2 基础设施建设（`vibex-phase2-core-20260316`）：
- ✅ Supabase 数据库集成（PostgreSQL + Auth + Realtime）
- ✅ API Gateway 统一网关（认证、限流、日志、版本管理）
- ✅ WebSocket 协作基础设施（Durable Objects、在线状态、协作锁）

当前技术栈：
- **前端**: Next.js 14 (App Router), React 18, Zustand, React Query
- **后端**: Cloudflare Workers, Hono, Durable Objects
- **数据库**: Supabase PostgreSQL (已迁移)
- **认证**: Supabase Auth (JWT + OAuth)
- **实时通信**: WebSocket + Supabase Realtime

### 1.2 Phase 2 核心功能目标

基于已建成的基础设施，开发面向用户的核心功能特性：

| 目标 | 描述 | 优先级 | 对应 FR |
|------|------|--------|---------|
| 团队协作空间 | 多用户项目共享、权限管理、实时协作 | P0 | FR-004 |
| 项目版本对比 | 需求变更历史、版本对比、回滚功能 | P0 | FR-003 |
| 新手引导流程 | 首次使用引导、功能发现、学习路径 | P0 | FR-009 |
| 需求智能补全 | AI 主动提问澄清、需求优化建议 | P1 | FR-002 |

---

## 二、需求分析

### 2.1 团队协作空间

#### 2.1.1 业务场景

**场景 1: 创建团队**
> 产品经理创建团队"电商项目组"，邀请开发、设计加入，分配不同角色权限。

**场景 2: 项目共享**
> 项目负责人将项目"用户中心重构"共享给团队成员，设置编辑/查看权限。

**场景 3: 实时协作**
> 两个成员同时编辑同一项目的领域模型，实时看到对方的修改，协作锁防止冲突。

**场景 4: 协作历史**
> 团队成员查看项目的协作历史，谁在什么时间做了什么修改。

#### 2.1.2 技术方案

```
┌──────────────────────────────────────────────────────────────────┐
│                    Team Collaboration Architecture                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐         ┌─────────────┐                        │
│  │   Client A  │         │   Client B  │                        │
│  │  (Owner)    │         │  (Editor)   │                        │
│  └──────┬──────┘         └──────┬──────┘                        │
│         │                       │                               │
│         └───────────┬───────────┘                               │
│                     │                                           │
│         ┌───────────▼───────────┐                               │
│         │   CollaborationRoom   │                               │
│         │   (Durable Object)    │                               │
│         └───────────┬───────────┘                               │
│                     │                                           │
│    ┌────────────────┼────────────────┐                          │
│    │                │                │                          │
│    ▼                ▼                ▼                          │
│ ┌────────┐   ┌────────────┐   ┌────────────┐                   │
│ │Presence│   │Collab Lock │   │Change Sync │                   │
│ │(已实现)│   │  (已实现)  │   │  (待开发)  │                   │
│ └────────┘   └────────────┘   └────────────┘                   │
│                                                                   │
│                    ┌──────────────────────┐                      │
│                    │   Supabase Database  │                      │
│                    │ - teams              │                      │
│                    │ - team_members       │                      │
│                    │ - project_shares     │                      │
│                    │ - collaboration_logs │                      │
│                    └──────────────────────┘                      │
└──────────────────────────────────────────────────────────────────┘
```

**数据库 Schema 设计**:

```sql
-- 团队表
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 团队成员表
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role VARCHAR(20) NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 项目共享表
CREATE TABLE project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES auth.users(id),
  permission VARCHAR(20) NOT NULL DEFAULT 'view', -- owner, edit, view
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, COALESCE(team_id, user_id))
);

-- 协作日志表
CREATE TABLE collaboration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL, -- create, update, delete, share, lock
  entity_type VARCHAR(50), -- bounded_context, domain_model, flow
  entity_id UUID,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 策略
CREATE POLICY "Team members can view team"
  ON teams FOR SELECT
  USING (
    owner_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = teams.id AND user_id = auth.uid()
    )
  );
```

**API 端点设计**:

| 端点 | 方法 | 描述 |
|------|------|------|
| `/v1/teams` | POST | 创建团队 |
| `/v1/teams` | GET | 获取我的团队列表 |
| `/v1/teams/:id` | GET | 获取团队详情 |
| `/v1/teams/:id/members` | POST | 邀请成员 |
| `/v1/teams/:id/members/:userId` | DELETE | 移除成员 |
| `/v1/projects/:id/share` | POST | 共享项目 |
| `/v1/projects/:id/share/:shareId` | DELETE | 取消共享 |
| `/v1/projects/:id/logs` | GET | 获取协作历史 |

#### 2.1.3 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 权限泄露 | 低 | 高 | RLS 策略严格校验、API 层双重验证 |
| 协作冲突 | 中 | 中 | 协作锁机制已实现，冲突检测待优化 |
| 实时同步延迟 | 中 | 中 | WebSocket 心跳 + 重连机制 |

#### 2.1.4 验收标准

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| TC-001 | 创建团队成功，创建者自动成为 owner | API 测试：创建团队 → 验证成员角色 |
| TC-002 | 邀请成员成功，成员收到通知 | E2E：邀请 → 邮件通知 → 接受邀请 |
| TC-003 | 项目共享成功，权限正确生效 | API 测试：共享 → 验证权限 → 尝试编辑 |
| TC-004 | 实时协作正常，协作锁防止冲突 | 多客户端测试：同时编辑 → 锁冲突提示 |
| TC-005 | 协作历史完整记录 | API 测试：操作 → 查看日志 → 验证完整性 |

---

### 2.2 项目版本对比

#### 2.2.1 业务场景

**场景 1: 查看变更历史**
> 产品经理查看项目"用户中心"的变更历史，了解每次需求调整的内容。

**场景 2: 版本对比**
> 开发人员对比当前版本和上周版本的差异，快速理解需求变更。

**场景 3: 版本回滚**
> 发现需求调整方向错误，回滚到之前的稳定版本。

#### 2.2.2 技术方案

```
┌──────────────────────────────────────────────────────────────────┐
│                    Version Control Architecture                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Version Storage                           │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │ │
│  │  │ Version v1    │  │ Version v2    │  │ Version v3    │   │ │
│  │  │ (2026-03-10)  │  │ (2026-03-13)  │  │ (2026-03-16)  │   │ │
│  │  │ - 需求文本    │  │ - 需求文本    │  │ - 需求文本    │   │ │
│  │  │ - 限界上下文  │  │ - 限界上下文  │  │ - 限界上下文  │   │ │
│  │  │ - 领域模型    │  │ - 领域模型    │  │ - 领域模型    │   │ │
│  │  │ - 业务流程    │  │ - 业务流程    │  │ - 业务流程    │   │ │
│  │  └───────────────┘  └───────────────┘  └───────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Diff Engine                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│  │  │ Text Diff   │  │ JSON Diff   │  │ Mermaid Diff│         │ │
│  │  │ (diff-match)│  │ (deep-diff) │  │ (AST-based) │         │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**数据库 Schema 设计**:

```sql
-- 项目版本表
CREATE TABLE project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL, -- 完整快照
  changes JSONB, -- 相对上一版本的变更
  change_summary TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, version_number)
);

-- 版本标签表（用于标记重要版本）
CREATE TABLE version_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_project_versions_project ON project_versions(project_id);
CREATE INDEX idx_project_versions_created ON project_versions(created_at DESC);
```

**版本快照格式**:

```typescript
interface ProjectSnapshot {
  requirementText: string;
  boundedContexts: BoundedContext[];
  domainModels: DomainModel[];
  businessFlows: BusinessFlow[];
  pages: Page[];
  createdAt: string;
  createdBy: string;
}

interface VersionDiff {
  requirementText: TextDiff;
  boundedContexts: ArrayDiff<BoundedContext>;
  domainModels: ArrayDiff<DomainModel>;
  businessFlows: ArrayDiff<BusinessFlow>;
  pages: ArrayDiff<Page>;
}
```

**API 端点设计**:

| 端点 | 方法 | 描述 |
|------|------|------|
| `/v1/projects/:id/versions` | GET | 获取版本历史列表 |
| `/v1/projects/:id/versions/:version` | GET | 获取特定版本快照 |
| `/v1/projects/:id/versions/compare` | GET | 对比两个版本 |
| `/v1/projects/:id/versions/:version/restore` | POST | 恢复到特定版本 |
| `/v1/projects/:id/versions/:version/tag` | POST | 标记版本 |

**Diff 算法选择**:

| 数据类型 | 算法 | 库 |
|----------|------|-----|
| 文本 (需求描述) | Myers diff | `diff` npm 包 |
| JSON (领域模型) | Deep diff | `deep-diff` npm 包 |
| Mermaid 代码 | AST diff | 自定义实现 |

#### 2.2.3 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 版本数据膨胀 | 高 | 中 | 增量存储、定期归档、压缩 |
| Diff 性能问题 | 中 | 低 | 增量 Diff 缓存、Web Worker |
| 回滚数据冲突 | 低 | 高 | 回滚前备份当前状态 |

#### 2.2.4 验收标准

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| VC-001 | 每次保存创建新版本 | 操作 → 验证版本号递增 |
| VC-002 | 版本历史正确展示 | 创建多个版本 → 验证列表 |
| VC-003 | 版本对比正确显示差异 | 修改内容 → 对比 → 验证高亮 |
| VC-004 | 版本回滚成功 | 回滚 → 验证数据恢复 |
| VC-005 | 版本标签正确保存 | 添加标签 → 验证显示 |

---

### 2.3 新手引导流程

#### 2.3.1 业务场景

**场景 1: 首次进入**
> 新用户注册后首次进入系统，看到欢迎引导，了解 VibeX 的核心功能。

**场景 2: 创建第一个项目**
> 引导用户完成第一个项目的创建，从需求输入到生成结果。

**场景 3: 功能发现**
> 用户完成核心流程后，引导发现高级功能（协作、版本控制）。

#### 2.3.2 技术方案

```
┌──────────────────────────────────────────────────────────────────┐
│                    Onboarding Flow Architecture                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Onboarding State Machine                  │ │
│  │                                                              │ │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐              │ │
│  │  │ Welcome  │───▶│ Create   │───▶│ Discover │              │ │
│  │  │  Modal   │    │ Project  │    │ Features │              │ │
│  │  └──────────┘    └──────────┘    └──────────┘              │ │
│  │       │              │               │                      │ │
│  │       ▼              ▼               ▼                      │ │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐              │ │
│  │  │ Skip     │    │ Step-by  │    │ Tooltip  │              │ │
│  │  │ Optional │    │ Step     │    │ Hints    │              │ │
│  │  └──────────┘    └──────────┘    └──────────┘              │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Storage (Supabase)                        │ │
│  │  - onboarding_state: 引导状态                                │ │
│  │  - completed_steps: 已完成步骤                               │ │
│  │  - dismissed_at: 跳过时间                                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**引导步骤设计**:

| 步骤 | 触发条件 | 引导内容 | UI 组件 |
|------|----------|----------|---------|
| 1. 欢迎 | 首次登录 | 介绍 VibeX 核心价值 | Modal |
| 2. 创建项目 | 进入 Dashboard | 点击"新建项目"按钮 | Tooltip + Spotlight |
| 3. 输入需求 | 项目创建页 | 如何描述需求 | Inline Tips |
| 4. 生成结果 | 确认流程页 | 等待 AI 生成 | Progress Tips |
| 5. 查看结果 | 结果展示页 | 如何解读结果 | Feature Highlights |
| 6. 功能发现 | 完成首次流程 | 协作、版本功能 | Feature Cards |

**用户状态存储**:

```typescript
interface OnboardingState {
  userId: string;
  hasSeenWelcome: boolean;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  dismissedAt: string | null;
  lastActiveAt: string;
}

enum OnboardingStep {
  WELCOME = 'welcome',
  CREATE_PROJECT = 'create_project',
  INPUT_REQUIREMENT = 'input_requirement',
  VIEW_RESULTS = 'view_results',
  DISCOVER_FEATURES = 'discover_features',
  COMPLETED = 'completed'
}
```

**组件实现方案**:

```typescript
// components/onboarding/OnboardingManager.tsx
export function OnboardingManager() {
  const { state, completeStep, skip } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(state.currentStep);

  const steps: Record<OnboardingStep, React.ReactNode> = {
    welcome: <WelcomeModal onNext={() => advanceStep()} onSkip={skip} />,
    create_project: <Spotlight target="#create-project-btn" />,
    input_requirement: <InlineTip position="right" />,
    view_results: <FeatureHighlight features={['domain-model', 'flow']} />,
    discover_features: <FeatureCards />,
    completed: null,
  };

  return <>{steps[currentStep]}</>;
}
```

#### 2.3.3 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 引导被打断 | 高 | 低 | 进度自动保存，支持继续 |
| 用户跳过引导 | 中 | 低 | 后续可通过 Help 重新触发 |
| 引导内容过时 | 中 | 中 | 引导内容配置化，易于更新 |

#### 2.3.4 验收标准

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| OB-001 | 新用户首次进入显示欢迎 Modal | 新账号登录 → 验证显示 |
| OB-002 | 引导步骤正确推进 | 完成步骤 → 验证状态更新 |
| OB-003 | 跳过引导后不再显示 | 点击跳过 → 刷新验证隐藏 |
| OB-004 | 引导进度持久化 | 中途退出 → 重新登录验证恢复 |
| OB-005 | 完成引导后显示功能发现 | 完成全部 → 验证显示功能卡片 |

---

### 2.4 需求智能补全

#### 2.4.1 业务场景

**场景 1: 需求澄清**
> 用户输入"做一个电商平台"，AI 主动提问："需要支持哪些支付方式？"、"是否有商品评价功能？"

**场景 2: 需求优化建议**
> 用户输入需求后，AI 建议补充非功能性需求："是否需要考虑性能要求？"、"数据安全有什么要求？"

**场景 3: 需求模板推荐**
> 根据用户输入的关键词，推荐相关行业模板。

#### 2.4.2 技术方案

```
┌──────────────────────────────────────────────────────────────────┐
│                    Intelligent Requirement System                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐                                                 │
│  │ User Input  │                                                 │
│  │ "做一个电商"│                                                 │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 Requirement Analyzer (AI)                    │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│  │  │ Domain      │  │ Completeness│  │ Quality     │         │ │
│  │  │ Detection   │  │ Check       │  │ Score       │         │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │ │
│  │                                                              │ │
│  │  输出: {                                                     │ │
│  │    domain: "e-commerce",                                     │ │
│  │    completeness: 0.35,                                       │ │
│  │    missing: ["支付方式", "物流", "评价"],                    │ │
│  │    suggestions: ["是否需要支持多商户?", ...]                  │ │
│  │  }                                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    User Interaction                          │ │
│  │  ┌───────────────────────────────────────────────────────┐  │ │
│  │  │ AI 提问卡片: "需要支持哪些支付方式?"                    │  │ │
│  │  │ [ ] 支付宝  [ ] 微信支付  [ ] 银行卡  [ ] 其他        │  │ │
│  │  │                [提交答案] [跳过]                       │  │ │
│  │  └───────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**AI 分析 Prompt 设计**:

```typescript
const REQUIREMENT_ANALYSIS_PROMPT = `
你是一个需求分析专家。分析用户输入的需求，输出以下 JSON：

{
  "domain": "识别的业务领域（e-commerce/social/saas/enterprise/other）",
  "completeness": 0-1 的完整度评分,
  "detectedFeatures": ["已识别的功能点"],
  "missingAreas": ["缺失的关键领域"],
  "clarificationQuestions": [
    {
      "question": "问题文本",
      "type": "single_select|multi_select|text",
      "options": ["选项1", "选项2"],  // 可选
      "reason": "为什么要问这个问题"
    }
  ],
  "suggestions": ["优化建议"]
}

用户需求：
"""
{requirement}
"""

只输出 JSON，不要其他内容。
`;
```

**交互组件设计**:

```typescript
interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'single_select' | 'multi_select' | 'text';
  options?: string[];
  reason: string;
  userAnswer?: string | string[];
}

function ClarificationCard({ question, onAnswer, onSkip }: Props) {
  return (
    <Card className="clarification-card">
      <div className="question">{question.question}</div>
      {question.type === 'multi_select' && (
        <CheckboxGroup options={question.options} onChange={onAnswer} />
      )}
      <div className="actions">
        <Button onClick={() => onAnswer()}>提交</Button>
        <Button variant="ghost" onClick={onSkip}>跳过</Button>
      </div>
    </Card>
  );
}
```

#### 2.4.3 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| AI 回复延迟 | 高 | 中 | 流式输出、骨架屏 |
| 问题质量不高 | 中 | 中 | Prompt 优化、用户反馈 |
| 成本增加 | 中 | 低 | 缓存分析结果、限流 |

#### 2.4.4 验收标准

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| IR-001 | 输入需求后显示分析结果 | 输入模糊需求 → 验证分析卡片 |
| IR-002 | 澄清问题合理且相关 | 验证问题与需求领域相关 |
| IR-003 | 用户回答后需求完善 | 回答问题 → 验证需求更新 |
| IR-004 | 跳过后可继续生成 | 点击跳过 → 验证生成正常 |
| IR-005 | 完整度评分准确 | 验证评分与实际完整度一致 |

---

## 三、依赖与约束

### 3.1 外部依赖

| 依赖 | 用途 | 状态 |
|------|------|------|
| Supabase | 数据库 + 认证 + Realtime | ✅ 已集成 |
| Cloudflare Workers | API 运行时 | ✅ 已部署 |
| Durable Objects | WebSocket 服务 | ✅ 已实现 |
| MiniMax API | AI 能力 | ✅ 已集成 |

### 3.2 技术约束

| 约束 | 说明 |
|------|------|
| 向后兼容 | 现有 API 接口不能破坏性变更 |
| 部署环境 | 必须在 Cloudflare Edge 部署 |
| 数据安全 | 敏感数据加密存储 |
| 性能要求 | API 响应延迟 < 500ms (P99) |
| AI 成本 | 智能补全调用需要限流 |

### 3.3 时间约束

| Epic | 预估工作量 | 优先级 |
|------|-----------|--------|
| 团队协作空间 | 4 人日 | P0 |
| 项目版本对比 | 3 人日 | P0 |
| 新手引导流程 | 2 人日 | P0 |
| 需求智能补全 | 3 人日 | P1 |

**总工期**: 12 人日

---

## 四、技术风险评估

### 4.1 高风险项

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 权限泄露 | 用户数据安全 | RLS 严格校验 + API 双重验证 |
| 版本数据膨胀 | 存储成本增加 | 增量存储 + 定期归档 |

### 4.2 中风险项

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 协作冲突 | 用户体验差 | 协作锁 + 冲突检测 |
| AI 成本增加 | 预算超支 | 限流 + 缓存 |
| 引导内容过时 | 用户困惑 | 配置化内容 |

### 4.3 低风险项

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 用户跳过引导 | 发现率低 | Help 入口重新触发 |
| 版本回滚冲突 | 数据不一致 | 回滚前备份 |

---

## 五、验收标准汇总

### 5.1 团队协作空间

- [ ] TC-001: 创建团队成功
- [ ] TC-002: 邀请成员成功
- [ ] TC-003: 项目共享权限正确
- [ ] TC-004: 实时协作无冲突
- [ ] TC-005: 协作历史完整

### 5.2 项目版本对比

- [ ] VC-001: 版本自动创建
- [ ] VC-002: 版本历史展示
- [ ] VC-003: 版本对比正确
- [ ] VC-004: 版本回滚成功
- [ ] VC-005: 版本标签正确

### 5.3 新手引导流程

- [ ] OB-001: 欢迎显示正确
- [ ] OB-002: 步骤推进正确
- [ ] OB-003: 跳过后隐藏
- [ ] OB-004: 进度持久化
- [ ] OB-005: 功能发现显示

### 5.4 需求智能补全

- [ ] IR-001: 分析结果显示
- [ ] IR-002: 问题相关合理
- [ ] IR-003: 需求完善生效
- [ ] IR-004: 跳过继续生成
- [ ] IR-005: 评分准确

---

## 六、下一步建议

### 6.1 立即行动

1. **创建数据库 Schema**: teams, team_members, project_shares 等表
2. **实现团队 CRUD API**: 创建、查询、邀请、移除
3. **实现版本存储机制**: 快照创建、版本列表

### 6.2 技术预研

1. **Diff 算法选型**: 测试 diff-match-patch vs deep-diff
2. **引导组件库**: 调研 driver.js vs shepherd.js vs 自研
3. **AI Prompt 优化**: 测试不同 Prompt 的澄清效果

### 6.3 协调事项

1. **UI 设计**: 协作空间界面设计、引导视觉设计
2. **产品确认**: 引导流程步骤确认、功能卡片内容确认
3. **测试准备**: E2E 测试账号准备、协作测试环境

---

*文档版本: 1.0*  
*创建时间: 2026-03-16*  
*分析师: Analyst Agent*