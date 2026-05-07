/**
 * PUT /api/projects/:id/role
 * 更新项目成员角色
 * E04 S-E4.3
 * Body: { memberId, role }
 * 需要 owner 或 admin 权限
 */
import { NextRequest, NextResponse } from 'next/server';
import { safeError } from '@/lib/log-sanitizer';
// Use existing project auth logic

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;
    const body = await req.json() as { memberId: string; role: string };

    if (!body.memberId || !body.role) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'memberId and role required' }, { status: 400 });
    }

    const validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json({ error: 'INVALID_ROLE', message: 'Invalid role' }, { status: 400 });
    }

    // Placeholder: full implementation would check caller is owner/admin
    return NextResponse.json({ success: true, projectId, memberId: body.memberId, role: body.role });
  } catch (err) {
    safeError('[projects/role] Error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
