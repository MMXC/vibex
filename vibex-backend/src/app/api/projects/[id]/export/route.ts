/**
 * GET /api/projects/:id/export
 * E02-U1: 导出项目为 v1.0 JSON
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { exportProject } from '@/lib/services/projectExporter';
import { ExportErrorCodes } from '@/lib/schemas/vibex';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;

    // 权限检查
    const { success } = getAuthUserFromRequest(req);
    if (!success) {
      return NextResponse.json(
        { error: ExportErrorCodes.PERMISSION_DENIED, message: '需要登录才能导出项目' },
        { status: 401 }
      );
    }

    const data = await exportProject(projectId);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message === 'PROJECT_NOT_FOUND') {
      return NextResponse.json(
        { error: ExportErrorCodes.PROJECT_NOT_FOUND, message: '项目不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'EXPORT_FAILED', message },
      { status: 500 }
    );
  }
}
