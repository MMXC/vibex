# IMPLEMENTATION_PLAN: VibeX PM Proposals 2026-04-11

> **项目**: vibex-pm-proposals-vibex-proposals-20260411  
> **作者**: Architect  
> **日期**: 2026-04-11  
> **版本**: v1.0

---

## Sprint 规划

| Sprint | 周期 | 内容 | 工时 |
|--------|------|------|------|
| Sprint 1 | Day 1 | E1: 需求输入质量 | 10h |
| Sprint 2 | Day 2 | E2: 企业协作 | 13h |
| Sprint 3 | Day 3 | E3: 体验优化 | 8h |

**总工时**: 31h | **团队**: 1 Dev

---

## Sprint 1: 需求输入质量（10h）

### S1.1: AI 智能补全（5h）

**Step 1: 关键词检测**

```typescript
// hooks/useAIClarification.ts
const AMBIGUITY_KEYWORDS = ['大概', '可能', '一些', '某个', 'something'];

export function detectAmbiguity(input: string): boolean {
  if (input.length < 10) return true;
  return AMBIGUITY_KEYWORDS.some(k => input.includes(k));
}
```

**Step 2: 追问生成 API**

```typescript
// app/api/ai/clarify/route.ts
export async function POST(req: Request) {
  const { input } = await req.json();
  const clarification = await generateClarificationPrompt(input);
  return Response.json({ clarification });
}
```

### S1.2: 项目搜索（3h）

```typescript
// hooks/useProjectSearch.ts
export function useProjectSearch(projects: Project[]) {
  const [query, setQuery] = useState('');
  
  const results = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [projects, query]);
  
  return { results, query, setQuery };
}
```

### S1.3: flowId E2E（2h）

```typescript
// tests/e2e/flow-id.spec.ts
test('flowId present in generate-components', async ({ page }) => {
  await page.goto('/dashboard');
  await page.fill('[data-testid="requirement-input"]', 'create login form');
  await page.click('[data-testid="analyze-button"]');
  
  const flowId = await page.evaluate(() => window.__FLOW_ID__);
  expect(flowId).toMatch(/^[0-9a-f-]{36}$/);
});
```

---

## Sprint 2: 企业协作（13h）

### S2.1: 团队协作 UI（6h）

```typescript
// components/TeamCollaborationPanel.tsx
export function TeamCollaborationPanel({ projectId }: { projectId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  
  return (
    <div className="team-panel">
      <h3>Team Members</h3>
      {members.map(m => (
        <div key={m.id} className="member-indicator">
          <Avatar src={m.avatar} />
          <span>{m.name}</span>
        </div>
      ))}
    </div>
  );
}
```

### S2.2: 版本历史（5h）

```typescript
// hooks/useVersionHistory.ts
export function useVersionHistory(projectId: string) {
  const [versions, setVersions] = useState<Version[]>([]);
  
  useEffect(() => {
    fetch(`/api/project/${projectId}/versions`)
      .then(r => r.json())
      .then(setVersions);
  }, [projectId]);
  
  return { versions };
}
```

### S2.3: Tree 按钮统一（2h）

```bash
# 统一为 2 种样式：primary + secondary
grep -rn "TreeToolbarButton" vibex-fronted/src/
```

---

## Sprint 3: 体验优化（8h）

### S3.1-3.4: 各功能实现

| Story | 内容 | 工时 |
|-------|------|------|
| S3.1 | 快捷键系统 | 2h |
| S3.2 | 离线提示 | 1h |
| S3.3 | 导入导出 | 3h |
| S3.4 | AI 评分 | 2h |

---

## 验收

```bash
# AI 补全
expect(detectAmbiguity('需要一个小程序')).toBe(true)

# 搜索响应
expect(searchTime).toBeLessThan(200)

# E2E
pnpm playwright test tests/e2e/flow-id.spec.ts
```

---

*文档版本: v1.0 | 最后更新: 2026-04-11*
