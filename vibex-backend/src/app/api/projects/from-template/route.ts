/**
 * POST /api/projects/from-template
 *
 * Creates a new project from a template (E2: Project Template Library).
 *
 * Body: { templateId: string; userId: string; projectName?: string }
 * Response: { projectId: string; canvasProjectId: string; name: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTemplateById } from '@/lib/template-data';

import { safeError } from '@/lib/log-sanitizer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    let body: { templateId?: string; userId?: string; projectName?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { templateId, userId, projectName } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: `Template '${templateId}' not found` }, { status: 404 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const name = projectName?.trim() || template.name;

    // Create project + canvas data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the base Project
      const project = await tx.project.create({
        data: {
          name,
          description: template.description,
          userId,
          status: 'draft',
        },
      });

      // 2. Create CanvasProject
      const canvasProject = await tx.canvasProject.create({
        data: {
          projectId: project.id,
          name,
          contextsJson: JSON.stringify(template.contexts),
          flowsJson: JSON.stringify(template.flows),
          componentsJson: JSON.stringify([]),
        },
      });

      // 3. Create CanvasBoundedContexts from template contexts
      for (const ctx of template.contexts) {
        await tx.canvasBoundedContext.create({
          data: {
            projectId: project.id,
            name: ctx.name,
            description: ctx.description,
            ctxType: 'core',
            confirmed: false,
          },
        });
      }

      // 4. Create CanvasFlows and CanvasFlowSteps from template flows
      for (const flow of template.flows) {
        const canvasFlow = await tx.canvasFlow.create({
          data: {
            projectId: project.id,
            ctxId: '', // ctxId is not directly mappable; leave blank
            name: flow.name,
            confirmed: false,
          },
        });

        for (let i = 0; i < flow.steps.length; i++) {
          await tx.canvasFlowStep.create({
            data: {
              flowId: canvasFlow.id,
              name: flow.steps[i],
              actor: '用户',
              description: '',
              stepOrder: i,
              confirmed: false,
            },
          });
        }
      }

      // 5. Initialize StepState at step 1 with template data
      await tx.stepState.create({
        data: {
          projectId: project.id,
          currentStep: 1,
          step1Data: JSON.stringify({ contexts: template.contexts }),
          step2Data: JSON.stringify({ flows: template.flows }),
          step3Data: JSON.stringify({ components: [] }),
          lastModifiedBy: userId,
        },
      });

      return { project, canvasProject };
    });

    return NextResponse.json(
      {
        projectId: result.project.id,
        canvasProjectId: result.canvasProject.id,
        name: result.project.name,
        templateId: template.id,
      },
      { status: 201 }
    );
  } catch (error) {
    safeError('[Projects/FromTemplate] Error:', error);
    return NextResponse.json({ error: 'Failed to create project from template' }, { status: 500 });
  }
}
