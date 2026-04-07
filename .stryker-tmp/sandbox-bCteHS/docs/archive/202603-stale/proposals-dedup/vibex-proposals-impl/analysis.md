# 分析师提案落地实施 - 需求分析文档

**项目**: vibex-proposals-impl  
**分析师**: analyst  
**日期**: 2026-03-13  
**版本**: 1.0

---

## 1. 执行摘要

**问题**: 分析师在 `analyst-proposals.md` 中提出了多项优化建议，开发团队已创建相关组件和库，但这些功能**未集成到实际页面**，导致用户无法使用。

**根因**: 开发与产品集成脱节，组件被开发但未被页面导入使用。

**解决方案**: 完成三个功能的页面集成：
1. 智能诊断 UI → 集成到首页需求输入流程
2. 游客模式 → 集成到首页和 middleware
3. 智能模板推荐 → 与现有模板选择流程结合

---

## 2. 现状分析

### 2.1 功能完成度矩阵

| 功能 | 后端/服务 | 前端组件 | 页面集成 | 用户可访问 |
|------|-----------|----------|----------|-----------|
| 智能诊断 | ✅ `services/diagnosis/` | ✅ `components/diagnosis/` | ❌ **未使用** | ❌ 否 |
| 游客模式 | ✅ `lib/guest/` | ✅ 完整库 | ❌ **未使用** | ❌ 否 |
| 智能模板推荐 | ⚠️ `keywordExtractor.ts` | ⚠️ 部分组件 | ⚠️ 不完整 | ⚠️ 部分 |

### 2.2 现有代码资产

#### 2.2.1 智能诊断组件

**已存在的文件**:
```
src/components/diagnosis/
├── DiagnosisPanel.tsx   # 主面板组件
├── RadarChart.tsx       # 雷达图（4维度评分）
├── ScoreDisplay.tsx     # 分数展示
├── SuggestionList.tsx   # 建议列表
└── index.ts

src/services/diagnosis/
├── diagnoser.ts         # 诊断逻辑
├── optimizer.ts         # 一键优化
└── types.ts             # 类型定义

src/hooks/diagnosis/
└── (hooks)
```

**组件功能** (DiagnosisPanel.tsx):
- 输入需求文本
- 调用本地诊断服务
- 显示健康度分数
- 显示改进建议
- 支持一键优化

**问题**: 未被任何页面导入使用。

#### 2.2.2 游客模式库

**已存在的文件**:
```
src/lib/guest/
├── session.ts           # 游客会话管理
├── rateLimiter.ts       # 速率限制
├── lifecycle.ts         # 数据生命周期
├── migration.ts         # 数据迁移
└── index.ts             # 导出
```

**库功能**:
- `session.ts`: 创建游客会话，生成 guestSessionId
- `rateLimiter.ts`: IP 和会话级别的速率限制
- `lifecycle.ts`: 数据自动清理，过期提醒
- `migration.ts`: 注册时迁移游客数据

**问题**: 未被 middleware 或任何页面导入。

#### 2.2.3 智能模板推荐

**已存在的文件**:
```
src/utils/design/
├── keywordExtractor.ts  # 关键词提取（完整）
└── templateMatcher.ts   # 模板匹配（部分）

src/stores/
└── templateStore.ts     # 模板状态管理

src/data/templates/      # 10个模板JSON文件
```

**keywordExtractor.ts 功能**:
- 行业关键词识别（10 个行业）
- 功能关键词识别（30+ 功能）
- N-gram 词组提取
- 性能目标 < 100ms

**问题**: 未与模板选择流程集成。

---

## 3. 集成方案

### 3.1 智能诊断 UI 集成

#### 3.1.1 集成位置

**推荐**: 集成到首页 (`src/app/page.tsx`) 的需求输入区域。

**集成点**:
```
当前流程:
[需求输入] → [开始设计] → [生成限界上下文]

集成后流程:
[需求输入] → [智能诊断] → [显示评分和建议] → [一键优化] → [开始设计]
```

#### 3.1.2 集成方案

**方案 A: 嵌入式面板**（推荐）

在需求输入区域下方添加诊断面板：

```tsx
// src/app/page.tsx

import DiagnosisPanel from '@/components/diagnosis/DiagnosisPanel';

export default function HomePage() {
  const [requirementText, setRequirementText] = useState('');
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  
  return (
    <div className={styles.content}>
      {/* 现有需求输入 */}
      <textarea value={requirementText} onChange={...} />
      
      {/* 新增：智能诊断面板 */}
      <DiagnosisPanel 
        onAnalyze={(text) => {
          // 更新诊断结果
        }}
        onOptimize={(optimizedText) => {
          setRequirementText(optimizedText);
        }}
      />
      
      {/* 现有按钮 */}
      <button onClick={handleGenerate}>开始设计</button>
    </div>
  );
}
```

**方案 B: 侧边栏面板**

将诊断面板放到右侧 AI 助手区域，作为单独的 Tab：

```tsx
<aside className={styles.aiPanel}>
  <TabContainer>
    <Tab name="AI 助手">
      {/* 现有 AI 聊天 */}
    </Tab>
    <Tab name="需求诊断">
      <DiagnosisPanel />
    </Tab>
  </TabContainer>
</aside>
```

**推荐**: 方案 A，与需求输入流程紧密结合。

#### 3.1.3 验收标准

| ID | 验收项 | 验收标准 |
|----|--------|----------|
| F-001 | 诊断面板显示 | 在首页需求输入区可见诊断组件 |
| F-002 | 健康度评分 | 输入需求后显示 0-100 分数 |
| F-003 | 建议展示 | 显示缺失信息和改进建议 |
| F-004 | 一键优化 | 点击后需求文本被优化 |

---

### 3.2 游客模式集成

#### 3.2.1 集成位置

**需要集成的位置**:
1. `src/app/page.tsx` - 首页游客检测
2. `src/middleware.ts` - 路由守卫（需创建）
3. API 路由 - 速率限制

#### 3.2.2 集成方案

**Step 1: 创建 middleware.ts**

```typescript
// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  createGuestSession, 
  isGuestSession,
  checkRateLimit 
} from '@/lib/guest';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 公开路径，无需认证
  const publicPaths = ['/', '/auth', '/api/guest'];
  if (publicPaths.some(p => pathname.startsWith(p))) {
    // 检查是否有游客会话
    let guestSessionId = request.cookies.get('guest_session')?.value;
    
    if (!guestSessionId) {
      // 创建新游客会话
      guestSessionId = createGuestSession();
      const response = NextResponse.next();
      response.cookies.set('guest_session', guestSessionId, {
        maxAge: 24 * 60 * 60, // 24 小时
        httpOnly: true,
      });
      return response;
    }
    
    return NextResponse.next();
  }
  
  // 受保护路径，需要认证
  const protectedPaths = ['/dashboard', '/projects', '/settings'];
  if (protectedPaths.some(p => pathname.startsWith(p))) {
    const authToken = request.cookies.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Step 2: 修改首页游客逻辑**

```tsx
// src/app/page.tsx

import { 
  useGuestSession, 
  checkRateLimit,
  migrateGuestData 
} from '@/lib/guest';

export default function HomePage() {
  const { session, isActive } = useGuestSession();
  const { user } = useAuth();
  const isGuest = !user && isActive;
  
  const handleGenerate = async () => {
    // 游客模式检查速率限制
    if (isGuest) {
      const allowed = await checkRateLimit(session.guestSessionId);
      if (!allowed) {
        // 显示注册引导
        setIsLoginDrawerOpen(true);
        return;
      }
    }
    
    // 正常生成流程
    // ...
  };
  
  // 游客注册后迁移数据
  const handleRegisterSuccess = async (newUser) => {
    if (session?.guestSessionId) {
      await migrateGuestData(newUser.id, session.guestSessionId);
    }
    // ...
  };
  
  return (
    <div>
      {/* 游客模式提示 */}
      {isGuest && (
        <div className="guest-banner">
          🎁 游客模式 - 注册后可保存进度
        </div>
      )}
      {/* ... */}
    </div>
  );
}
```

**Step 3: 后端 API 速率限制**

```typescript
// src/app/api/guest/route.ts

import { rateLimiter } from '@/lib/guest';

export async function POST(request: Request) {
  const guestSessionId = request.headers.get('x-guest-session');
  
  if (guestSessionId) {
    const allowed = rateLimiter.checkLimit(guestSessionId);
    if (!allowed) {
      return Response.json(
        { error: '请求过于频繁，请注册继续' },
        { status: 429 }
      );
    }
  }
  
  // 处理请求
  // ...
}
```

#### 3.2.3 验收标准

| ID | 验收项 | 验收标准 |
|----|--------|----------|
| F-001 | 游客会话创建 | 首次访问自动创建游客会话 |
| F-002 | 游客可输入需求 | 游客可输入需求并查看预览 |
| F-003 | 速率限制生效 | 超过限制后提示注册 |
| F-004 | 注册后数据迁移 | 注册成功后游客数据迁移到账户 |

---

### 3.3 智能模板推荐集成

#### 3.3.1 集成位置

**推荐**: 与首页的"使用模板"按钮和 `/templates` 页面集成。

#### 3.3.2 集成方案

**Step 1: 创建模板推荐 Hook**

```typescript
// src/hooks/useTemplateRecommend.ts

import { extractKeywords } from '@/utils/design/keywordExtractor';
import { matchTemplate } from '@/utils/design/templateMatcher';
import { useTemplateStore } from '@/stores/templateStore';

export function useTemplateRecommend() {
  const { templates } = useTemplateStore();
  
  const getRecommendations = (text: string) => {
    // 1. 提取关键词
    const { keywords, industries } = extractKeywords(text);
    
    // 2. 匹配模板
    const matches = templates
      .map(template => ({
        template,
        score: calculateMatchScore(template, keywords, industries),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    return matches;
  };
  
  return { getRecommendations };
}
```

**Step 2: 集成到首页**

```tsx
// src/app/page.tsx

import { useTemplateRecommend } from '@/hooks/useTemplateRecommend';

export default function HomePage() {
  const { getRecommendations } = useTemplateRecommend();
  const [recommendations, setRecommendations] = useState([]);
  
  // 输入变化时更新推荐
  useEffect(() => {
    if (requirementText.length > 10) {
      const recs = getRecommendations(requirementText);
      setRecommendations(recs);
    }
  }, [requirementText]);
  
  return (
    <div>
      <textarea value={requirementText} onChange={...} />
      
      {/* 智能推荐模板 */}
      {recommendations.length > 0 && (
        <div className="template-recommendations">
          <h4>推荐模板</h4>
          {recommendations.map(({ template, score }) => (
            <div key={template.id} className="recommendation-card">
              <span className="template-name">{template.name}</span>
              <span className="match-score">{(score * 100).toFixed(0)}% 匹配</span>
              <button onClick={() => applyTemplate(template)}>
                使用
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* 现有"使用模板"按钮 */}
      <button onClick={() => router.push('/templates')}>
        📋 使用模板
      </button>
    </div>
  );
}
```

**Step 3: 增强 templates 页面**

```tsx
// src/app/templates/page.tsx

import { extractKeywords } from '@/utils/design/keywordExtractor';

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userRequirement, setUserRequirement] = useState('');
  
  // 根据需求智能推荐
  const recommendations = useMemo(() => {
    if (userRequirement.length < 10) return [];
    const { keywords, industries } = extractKeywords(userRequirement);
    return matchTemplates(templates, keywords, industries);
  }, [userRequirement]);
  
  return (
    <div>
      {/* 新增：需求输入区 */}
      <div className="requirement-input">
        <h3>描述你的需求，获取智能推荐</h3>
        <textarea 
          value={userRequirement}
          onChange={e => setUserRequirement(e.target.value)}
          placeholder="例如：电商系统，需要用户管理、订单管理..."
        />
      </div>
      
      {/* 推荐结果 */}
      {recommendations.length > 0 && (
        <section className="recommendations">
          <h3>为你推荐</h3>
          {recommendations.map(...)}
        </section>
      )}
      
      {/* 现有模板列表 */}
      <section className="all-templates">
        <h3>所有模板</h3>
        {/* ... */}
      </section>
    </div>
  );
}
```

#### 3.3.3 验收标准

| ID | 验收项 | 验收标准 |
|----|--------|----------|
| F-001 | 关键词提取 | 输入需求后自动提取关键词 |
| F-002 | 模板推荐 | 显示 Top-3 推荐模板及匹配度 |
| F-003 | 模板应用 | 点击推荐模板可应用 |
| F-004 | 模板页增强 | templates 页面支持智能推荐 |

---

## 4. 技术风险

### 4.1 风险矩阵

| 风险 | 概率 | 影响 | 风险等级 | 缓解措施 |
|------|------|------|----------|----------|
| 诊断组件样式与现有页面冲突 | 中 | 低 | 🟢 低 | 使用 CSS Modules 或 Tailwind |
| 游客数据丢失 | 低 | 中 | 🟡 中 | 自动保存到 localStorage |
| 模板推荐不准确 | 中 | 低 | 🟢 低 | 用户可手动选择模板 |
| 集成影响现有功能 | 低 | 高 | 🟡 中 | 完整回归测试 |

### 4.2 依赖项

| 功能 | 依赖 | 状态 |
|------|------|------|
| 智能诊断 | 组件已存在 | ✅ 就绪 |
| 游客模式 | 库已存在，需创建 middleware | ⚠️ 部分 |
| 模板推荐 | 关键词提取已存在 | ✅ 就绪 |

---

## 5. 实施计划

### 5.1 工时估算

| 功能 | 工时 | 优先级 |
|------|------|--------|
| 智能诊断集成 | 1 人日 | P0 |
| 游客模式集成 | 2 人日 | P0 |
| 模板推荐集成 | 1 人日 | P1 |
| 测试验证 | 1 人日 | P0 |

**总工时**: 5 人日

### 5.2 实施顺序

1. **Day 1**: 智能诊断 UI 集成到首页
2. **Day 2-3**: 游客模式集成（middleware + 首页逻辑）
3. **Day 4**: 模板推荐集成
4. **Day 5**: 回归测试 + 上线

---

## 6. 验收清单

### 6.1 智能诊断

- [ ] 首页显示诊断面板
- [ ] 输入需求后显示健康度分数
- [ ] 显示改进建议
- [ ] 一键优化功能正常
- [ ] 诊断后生成结果正常

### 6.2 游客模式

- [ ] 首次访问创建游客会话
- [ ] 游客可输入需求
- [ ] 游客可查看限界上下文预览
- [ ] 速率限制生效
- [ ] 注册后数据迁移成功

### 6.3 模板推荐

- [ ] 输入需求后显示推荐模板
- [ ] 推荐模板显示匹配度
- [ ] 点击推荐可应用模板
- [ ] templates 页面支持智能推荐

---

*文档生成时间: 2026-03-13*  
*分析师: analyst*