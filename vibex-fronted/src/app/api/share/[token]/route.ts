/**
export const dynamic = 'force-static';
 * Share Page — 只读分享页面
 *
 * Epic 5 实现: S5.1 (只读分享链接)
 * 接收 token 参数，获取项目数据，以只读模式渲染画布
 */
import { NextResponse } from 'next/server';

export interface ShareProject {
  id: string;
  name: string;
  description?: string;
  contextNodes: unknown[];
  flowNodes: unknown[];
  componentNodes: unknown[];
  phase: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/share/:token
 * 获取分享项目数据（仅限 public 项目）
 * @param token - 分享令牌
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const { token } = await params;

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' },
      { status: 400 }
    );
  }

  try {
    // TODO: 后续集成后端数据库，验证 token 并返回真实数据
    // 目前模拟返回示例数据
    const mockProject: ShareProject = {
      id: 'proj_share_001',
      name: '示例分享项目',
      description: '这是一个通过分享链接访问的只读项目',
      contextNodes: [
        {
          id: 'ctx_1',
          label: '用户模块',
          description: '管理系统用户相关功能',
          type: 'bounded_context',
          children: [],
        },
        {
          id: 'ctx_2',
          label: '订单模块',
          description: '处理订单流程',
          type: 'bounded_context',
          children: [],
        },
      ],
      flowNodes: [
        {
          id: 'flow_1',
          label: '用户注册流程',
          type: 'business_flow',
          steps: ['填写信息', '验证手机', '完成注册'],
        },
      ],
      componentNodes: [
        {
          id: 'comp_1',
          label: '注册表单',
          type: 'component',
          category: 'form',
        },
      ],
      phase: 'clarification',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 验证 token 格式（实际应查询数据库）
    // 简单的 token 格式验证：至少 8 位字符
    if (token.length < 8) {
      return NextResponse.json(
        { error: 'Invalid share token' },
        { status: 404 }
      );
    }

    return NextResponse.json(mockProject, { status: 200 });
  } catch (error) {
    console.error('Error fetching share project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share project' },
      { status: 500 }
    );
  }
}
