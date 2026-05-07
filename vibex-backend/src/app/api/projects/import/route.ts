/**
 * POST /api/projects/import
 * E02-U2: 导入 v1.0 JSON → 创建新项目
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import {
  validateExportJson,
  ExportErrorCodes,
} from '@/lib/schemas/vibex';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { success, user } = getAuthUserFromRequest(req);
    const userId = user?.userId ?? 'anonymous';
    if (!success) {
      return NextResponse.json(
        { error: ExportErrorCodes.PERMISSION_DENIED, message: '需要登录才能导入项目' },
        { status: 401 }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: ExportErrorCodes.INVALID_JSON, message: '无效的 JSON body' },
        { status: 400 }
      );
    }

    const validation = validateExportJson(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, message: validation.message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const project = await prisma.project.create({
      data: {
        name: data.project.name,
        description: data.project.description ?? null,
        userId,
        status: 'draft',
      },
    });

    if (data.pages && data.pages.length > 0) {
      await prisma.page.createMany({
        data: data.pages.map((p) => ({
          id: p.id,
          name: p.name,
          content: p.content ?? null,
          projectId: project.id,
        })) as never[],
      });
    }

    if (data.uiNodes && data.uiNodes.length > 0) {
      await prisma.uINode.createMany({
        data: data.uiNodes.map((node) => ({
          id: node.id,
          name: node.name,
          nodeType: node.nodeType,
          description: node.description ?? null,
          linkedFlowNodeId: node.linkedFlowNodeId ?? null,
          children: node.children ?? null,
          annotations: node.annotations ?? null,
          positionX: node.positionX ?? 0,
          positionY: node.positionY ?? 0,
          checked: node.checked ?? false,
          priority: node.priority ?? null,
          status: node.status ?? null,
          projectId: project.id,
        })) as never[],
      });
    }

    if (data.businessDomains && data.businessDomains.length > 0) {
      await prisma.businessDomain.createMany({
        data: data.businessDomains.map((bd) => ({
          id: bd.id,
          name: bd.name,
          description: bd.description ?? null,
          domainType: bd.domainType ?? null,
          features: bd.features ?? null,
          relationships: bd.relationships ?? null,
          projectId: project.id,
        })) as never[],
      });
    }

    if (data.flowData && data.flowData.length > 0) {
      await prisma.flowData.createMany({
        data: data.flowData.map((flow) => ({
          id: flow.id,
          name: flow.name ?? 'node',
          nodes: flow.nodes ?? '{}',
          position: flow.position ?? '{}',
          style: flow.style ?? '{}',
          projectId: project.id,
        })) as never[],
      });
    }

    if (data.requirements && data.requirements.length > 0) {
      await prisma.requirement.createMany({
        data: data.requirements.map((r) => ({
          id: r.id,
          text: r.text,
          status: r.status ?? 'pending',
          projectId: project.id,
          userId,
        })) as never[],
      });
    }

    return NextResponse.json(
      {
        success: true,
        projectId: project.id,
        projectName: project.name,
        importedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: ExportErrorCodes.IMPORT_FAILED, message },
      { status: 500 }
    );
  }
}
