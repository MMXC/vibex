/**
 * projectExporter.ts — VibeX 项目导出聚合服务
 * E02-U1: 聚合三个 store → v1.0 JSON
 */
import prisma from '@/lib/prisma';

export async function exportProject(projectId: string, exportedBy?: string) {
  // 查询项目基本信息
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, description: true },
  });

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  // 并行查询所有关联数据
  const [uiNodes, businessDomains, flowData, pages, requirements] = await Promise.all([
    prisma.uINode.findMany({ where: { projectId } }),
    prisma.businessDomain.findMany({ where: { projectId } }),
    prisma.flowData.findMany({ where: { projectId } }),
    prisma.page.findMany({ where: { projectId } }),
    prisma.requirement.findMany({ where: { projectId } }),
  ]);

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy,
    project: {
      name: project.name,
      description: project.description ?? undefined,
    },
    uiNodes,
    businessDomains,
    flowData,
    pages,
    requirements,
  };
}
