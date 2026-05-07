/**
 * Unit tests for E05: PRD → Canvas 自动流程
 *
 * 覆盖范围：
 *  1. mapPRDToCanvas — 映射逻辑验证
 *  2. POST /api/v1/canvas/from-prd — API 端点
 *
 * E05 C5: PRD Chapter → 左栏 context，Step → 中栏 flow，Requirement → 右栏 design
 * E05 C5: 单向同步：PRD 变更 → Canvas 更新，Canvas 编辑不影响 PRD
 */

import { NextRequest } from 'next/server';
import { mapPRDToCanvas, type PRDDocument, type CanvasNode } from './route';

describe('mapPRDToCanvas — E05 S05.1 映射逻辑', () => {
  const minimalPRD: PRDDocument = {
    id: 'prd-1',
    title: '测试 PRD',
    chapters: [],
  };

  const singleChapterPRD: PRDDocument = {
    id: 'prd-1',
    title: '电商 PRD',
    chapters: [
      {
        id: 'ch-1',
        title: '用户模块',
        steps: [
          {
            id: 'step-1',
            title: '用户注册',
            requirements: [
              { id: 'req-1', text: '支持邮箱注册', priority: 'P0' },
              { id: 'req-2', text: '支持手机号注册', priority: 'P1' },
            ],
          },
          {
            id: 'step-2',
            title: '用户登录',
            requirements: [
              { id: 'req-3', text: '支持密码登录', priority: 'P0' },
            ],
          },
        ],
      },
    ],
  };

  it('TC1: 空 PRD → 返回空数组', () => {
    const result = mapPRDToCanvas(minimalPRD);
    expect(result.nodes.leftPanel).toEqual([]);
    expect(result.nodes.centerPanel).toEqual([]);
    expect(result.nodes.rightPanel).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('TC2: 单 chapter + 2 steps + 3 requirements → 节点数量正确', () => {
    const result = mapPRDToCanvas(singleChapterPRD);

    // Chapters → 左栏
    expect(result.nodes.leftPanel).toHaveLength(1);
    expect(result.nodes.leftPanel[0].type).toBe('context');
    expect(result.nodes.leftPanel[0].metadata.sourceType).toBe('chapter');

    // Steps → 中栏
    expect(result.nodes.centerPanel).toHaveLength(2);
    expect(result.nodes.centerPanel.every(n => n.type === 'flow')).toBe(true);
    expect(result.nodes.centerPanel.every(n => n.metadata.sourceType === 'step')).toBe(true);

    // Requirements → 右栏
    expect(result.nodes.rightPanel).toHaveLength(3);
    expect(result.nodes.rightPanel.every(n => n.type === 'design')).toBe(true);
    expect(result.nodes.rightPanel.every(n => n.metadata.sourceType === 'requirement')).toBe(true);
  });

  it('TC3: E05 验收 — nodes.leftPanel.length === prd.chapters.length', () => {
    const result = mapPRDToCanvas(singleChapterPRD);
    expect(result.nodes.leftPanel).toHaveLength(singleChapterPRD.chapters.length);
  });

  it('TC4: E05 验收 — nodes.centerPanel.length === total steps', () => {
    const result = mapPRDToCanvas(singleChapterPRD);
    const totalSteps = singleChapterPRD.chapters.reduce(
      (sum, ch) => sum + ch.steps.length, 0
    );
    expect(result.nodes.centerPanel).toHaveLength(totalSteps);
  });

  it('TC5: E05 验收 — nodes.rightPanel.length === total requirements', () => {
    const result = mapPRDToCanvas(singleChapterPRD);
    const totalReqs = singleChapterPRD.chapters.reduce(
      (sum, ch) => sum + ch.steps.reduce((s, st) => s + st.requirements.length, 0), 0
    );
    expect(result.nodes.rightPanel).toHaveLength(totalReqs);
  });

  it('TC6: E05 验收 — edges.length > 0', () => {
    const result = mapPRDToCanvas(singleChapterPRD);
    expect(result.edges.length).toBeGreaterThan(0);
  });

  it('TC7: chapter 节点 label = chapter.title', () => {
    const result = mapPRDToCanvas(singleChapterPRD);
    expect(result.nodes.leftPanel[0].label).toBe('用户模块');
  });

  it('TC8: step 节点 label = step.title', () => {
    const result = mapPRDToCanvas(singleChapterPRD);
    const stepLabels = result.nodes.centerPanel.map(n => n.label);
    expect(stepLabels).toContain('用户注册');
    expect(stepLabels).toContain('用户登录');
  });

  it('TC9: requirement 节点 label = req.text', () => {
    const result = mapPRDToCanvas(singleChapterPRD);
    const reqLabels = result.nodes.rightPanel.map(n => n.label);
    expect(reqLabels).toContain('支持邮箱注册');
    expect(reqLabels).toContain('支持手机号注册');
    expect(reqLabels).toContain('支持密码登录');
  });

  it('TC10: edges 包含 chapter → step 边', () => {
    const result = mapPRDToCanvas(singleChapterPRD);
    const chNodeId = result.nodes.leftPanel[0].id;
    const stepNodeId = result.nodes.centerPanel[0].id;

    const edge = result.edges.find(e => e.source === chNodeId && e.target === stepNodeId);
    expect(edge).toBeDefined();
    expect(edge?.type).toBe('chapter-to-step');
  });

  it('TC11: edges 包含 step → requirement 边', () => {
    const result = mapPRDToCanvas(singleChapterPRD);
    const stepNodeId = result.nodes.centerPanel[0].id;
    const reqNodeId = result.nodes.rightPanel[0].id;

    const edge = result.edges.find(e => e.source === stepNodeId && e.target === reqNodeId);
    expect(edge).toBeDefined();
    expect(edge?.type).toBe('step-to-requirement');
  });

  it('TC12: requirement priority 正确传递到 metadata', () => {
    const result = mapPRDToCanvas(singleChapterPRD);
    const reqNode = result.nodes.rightPanel.find(n => n.label === '支持邮箱注册');
    expect(reqNode?.metadata.priority).toBe('P0');
  });

  it('TC13: 节点 id 唯一', () => {
    const result = mapPRDToCanvas(singleChapterPRD);
    const allIds = [
      ...result.nodes.leftPanel.map(n => n.id),
      ...result.nodes.centerPanel.map(n => n.id),
      ...result.nodes.rightPanel.map(n => n.id),
    ];
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it('TC14: 多 chapter 时 chapter 间 edges 不互通', () => {
    const multiChapterPRD: PRDDocument = {
      id: 'prd-2',
      title: '多章节 PRD',
      chapters: [
        { id: 'ch-a', title: '模块 A', steps: [] },
        { id: 'ch-b', title: '模块 B', steps: [] },
      ],
    };
    const result = mapPRDToCanvas(multiChapterPRD);

    // 两章节之间不应有边
    const chAId = result.nodes.leftPanel[0].id;
    const chBId = result.nodes.leftPanel[1].id;
    const crossEdge = result.edges.find(e =>
      (e.source === chAId && e.target === chBId) ||
      (e.source === chBId && e.target === chAId)
    );
    expect(crossEdge).toBeUndefined();
  });

  it('TC15: 单 chapter 单 step 单 requirement → 正确', () => {
    const simplePRD: PRDDocument = {
      id: 'prd-simple',
      title: '简单 PRD',
      chapters: [
        {
          id: 'ch-1',
          title: '单一章节',
          steps: [
            {
              id: 'step-1',
              title: '唯一步骤',
              requirements: [{ id: 'req-1', text: '唯一需求', priority: 'P1' }],
            },
          ],
        },
      ],
    };
    const result = mapPRDToCanvas(simplePRD);

    expect(result.nodes.leftPanel).toHaveLength(1);
    expect(result.nodes.centerPanel).toHaveLength(1);
    expect(result.nodes.rightPanel).toHaveLength(1);
    expect(result.edges).toHaveLength(2); // ch→step + step→req
  });
});

// =============================================================================
// API Route Tests
// =============================================================================

describe('POST /api/v1/canvas/from-prd — E05 S05.1 API 端点', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function callRoute(prd: unknown) {
    const { POST } = await import('./route');
    const request = new NextRequest('http://localhost:3000/api/v1/canvas/from-prd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prd }),
    });
    return POST(request);
  }

  it('TC16: 正常 PRD → 200 + 映射结果', async () => {
    const prd: PRDDocument = {
      id: 'prd-api',
      title: 'API 测试 PRD',
      chapters: [
        {
          id: 'ch-1',
          title: '测试章节',
          steps: [
            { id: 'step-1', title: '测试步骤', requirements: [{ id: 'r-1', text: '需求', priority: 'P0' }] },
          ],
        },
      ],
    };
    const response = await callRoute(prd);
    const data = await response.json() as { success: boolean; nodes: { leftPanel: unknown[] } };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.nodes.leftPanel).toHaveLength(1);
  });

  it('TC17: 缺少 prd 字段 → 400', async () => {
    const response = await callRoute({});
    expect(response.status).toBe(400);
  });

  it('TC18: chapters 不是数组 → 400', async () => {
    const response = await callRoute({ id: 'x', title: 'x', chapters: 'not-array' });
    expect(response.status).toBe(400);
  });

  it('TC19: 验收标准映射正确性', async () => {
    const prd: PRDDocument = {
      id: 'prd-verify',
      title: '验收测试',
      chapters: [
        {
          id: 'ch-x',
          title: 'Chapter X',
          steps: [
            {
              id: 'step-a',
              title: 'Step A',
              requirements: [
                { id: 'r-a', text: 'Req A', priority: 'P0' },
                { id: 'r-b', text: 'Req B', priority: 'P1' },
                { id: 'r-c', text: 'Req C', priority: 'P2' },
                { id: 'r-d', text: 'Req D', priority: 'P0' },
                { id: 'r-e', text: 'Req E', priority: 'P1' },
              ],
            },
          ],
        },
      ],
    };
    const response = await callRoute(prd);
    const data = await response.json() as {
      success: boolean;
      nodes: { leftPanel: unknown[]; centerPanel: unknown[]; rightPanel: unknown[] };
      edges: unknown[];
    };

    expect(data.nodes.leftPanel.length).toBe(1);      // 1 chapter
    expect(data.nodes.centerPanel.length).toBe(1);     // 1 step
    expect(data.nodes.rightPanel.length).toBe(5);      // 5 requirements
    expect(data.edges.length).toBeGreaterThan(0);      // > 0 edges
    // Chapter label
    expect((data.nodes.leftPanel[0] as CanvasNode).label).toBe('Chapter X');
  });

  it('TC20: 节点包含 metadata.sourceType', async () => {
    const prd: PRDDocument = {
      id: 'prd-meta',
      title: 'Meta 测试',
      chapters: [
        { id: 'ch-1', title: 'Ch1', steps: [{ id: 's-1', title: 'S1', requirements: [{ id: 'r-1', text: 'R1', priority: 'P0' }] }] },
      ],
    };
    const response = await callRoute(prd);
    const data = await response.json() as { nodes: { leftPanel: CanvasNode[]; centerPanel: CanvasNode[]; rightPanel: CanvasNode[] } };

    expect(data.nodes.leftPanel[0].metadata.sourceType).toBe('chapter');
    expect(data.nodes.centerPanel[0].metadata.sourceType).toBe('step');
    expect(data.nodes.rightPanel[0].metadata.sourceType).toBe('requirement');
  });

  it('TC21: 多个 chapters 和 steps 时 edges 数量正确', async () => {
    const prd: PRDDocument = {
      id: 'prd-multi',
      title: '多章节步骤',
      chapters: [
        { id: 'c1', title: 'C1', steps: [{ id: 's1', title: 'S1', requirements: [{ id: 'r1', text: 'R1', priority: 'P0' }] }] },
        { id: 'c2', title: 'C2', steps: [{ id: 's2', title: 'S2', requirements: [{ id: 'r2', text: 'R2', priority: 'P0' }] }] },
      ],
    };
    const response = await callRoute(prd);
    const data = await response.json() as { edges: unknown[] };

    // 2 chapter→step edges + 2 step→requirement edges = 4 edges
    expect(data.edges).toHaveLength(4);
  });
});
