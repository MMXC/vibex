/**
 * POST /api/canvas/generate — Trigger prototype page generation
 *
 * Epic 5: S5.2 触发生成
 * Input: { projectId, pageIds, mode: 'parallel'|'sequential' }
 * Output: { queueId, pages: [{ pageId, status }] }
 *
 * Part of: vibex-backend-fixes-20260410 / E1-Schema统一
 * - Uses AppError for error handling
 * - Uses canvasGenerateSchema for input validation
 */
import { NextRequest, NextResponse } from 'next/server';
import { canvasGenerateSchema } from '@/schemas/canvas';
import { AppError, AuthError, NotFoundError, ValidationError } from '@/lib/errors';
import { errorToResponse } from '@/lib/errors';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// MiniMax API config (shared with ai-ui-generation route)
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_API_BASE = process.env.MINIMAX_API_BASE || 'https://api.minimax.chat/v1';
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'abab6.5s-chat';

// Auth helper
async function requireAuth(req: NextRequest) {
  const jwtSecret = process.env.JWT_SECRET || 'vibex-dev-secret';
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Unauthorized: authentication required');
  }
  const token = authHeader.substring(7);
  const jwt = await import('jsonwebtoken');
  try {
    return jwt.default.verify(token, jwtSecret) as { userId: string; email: string };
  } catch {
    throw new AuthError('Invalid or expired token');
  }
}

export async function POST(request: NextRequest) {
  // E1: Authentication check
  await requireAuth(request);

  try {
    const body = await request.json();

    // E1: Schema validation
    const parsed = canvasGenerateSchema.safeParse(body);
    if (!parsed.success) {
      const error = ValidationError.fromZodError(parsed.error, 'Invalid request body');
      return NextResponse.json(errorToResponse(error), { status: 400 });
    }

    const { projectId, pageIds } = parsed.data;

    // Load canvas project and its components
    const canvasProject = await prisma.canvasProject.findUnique({
      where: { id: projectId },
      include: { pages: true },
    });

    if (!canvasProject) {
      throw new NotFoundError('Canvas project not found');
    }

    const components = JSON.parse(canvasProject.componentsJson) as Array<{
      nodeId: string;
      name: string;
      type: string;
      props: Record<string, unknown>;
    }>;

    const donePages = canvasProject.pages;
    void donePages; // used implicitly in type inference

    const queueId = `queue_${Date.now()}`;
    const resultPages: Array<{ pageId: string; status: string }> = [];

    // Create or update CanvasPage entries for each requested component
    for (const componentId of pageIds) {
      const component = components.find((c) => c.nodeId === componentId);
      if (!component) continue;

      // Check if page already exists
      const existing = canvasProject.pages.find((p: { componentId: string }) => p.componentId === componentId);
      if (existing) {
        // Reset status to queued
        await prisma.canvasPage.update({
          where: { id: existing.id },
          data: { status: 'queued', progress: 0, errorMessage: null },
        });
        resultPages.push({ pageId: existing.id, status: 'queued' });
      } else {
        // Create new page
        const page = await prisma.canvasPage.create({
          data: {
            canvasProjectId: projectId,
            componentId,
            name: component.name,
            status: 'queued',
            progress: 0,
            retryCount: 0,
          },
        });
        resultPages.push({ pageId: page.id, status: 'queued' });
      }

      // Trigger generation (fire-and-forget, status updated via /status endpoint)
      void triggerGeneration(projectId, componentId, component).catch(console.error);
    }

    return NextResponse.json({ queueId, pages: resultPages }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(errorToResponse(error), { status: error.statusCode });
    }
    console.error('[canvas/generate] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Fire-and-forget generation: updates page status to 'generating' then runs AI generation
 */
async function triggerGeneration(
  projectId: string,
  componentId: string,
  component: { nodeId: string; name: string; type: string; props: Record<string, unknown> }
): Promise<void> {
  const canvasProject = await prisma.canvasProject.findUnique({ where: { id: projectId } });
  if (!canvasProject) return;

  // Find the page
  const pages = await prisma.canvasPage.findMany({
    where: { canvasProjectId: projectId, componentId },
    take: 1,
  });
  const page = pages[0];
  if (!page) return;

  // Update to generating
  await prisma.canvasPage.update({
    where: { id: page.id },
    data: { status: 'generating', progress: 10 },
  });

  try {
    // Build generation prompt from component data
    const prompt = buildComponentPrompt(component, canvasProject);
    const code = await generateWithAI(prompt);

    // Simulate progress steps
    await prisma.canvasPage.update({
      where: { id: page.id },
      data: { progress: 80 },
    });

    // Save generated code
    await prisma.canvasPage.update({
      where: { id: page.id },
      data: {
        status: 'done',
        progress: 100,
        codeJson: JSON.stringify({ code, componentId }),
        generatedAt: new Date(),
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Generation failed';
    await prisma.canvasPage.update({
      where: { id: page.id },
      data: {
        status: 'error',
        errorMessage,
        retryCount: { increment: 1 },
      },
    });
  }
}

function buildComponentPrompt(
  component: { nodeId: string; name: string; type: string; props: Record<string, unknown> },
  canvasProject: { name: string; contextsJson: string; flowsJson: string }
): string {
  const contexts = JSON.parse(canvasProject.contextsJson);
  const flows = JSON.parse(canvasProject.flowsJson);

  return `Generate a React + TypeScript page component for VibeX project.

Project: ${canvasProject.name}
Component: ${component.name}
Type: ${component.type}

Domain Contexts:
${contexts.map((c: { name: string; description: string }) => `- ${c.name}: ${c.description}`).join('\n')}

Business Flows:
${flows.map((f: { name: string; steps: Array<{ name: string }> }) => `- ${f.name}: ${f.steps?.map((s) => s.name).join(' → ')}`).join('\n')}

Props: ${JSON.stringify(component.props, null, 2)}

Requirements:
- React with TypeScript
- Tailwind CSS for styling
- Use 'use client' directive
- Export as default
- Include proper types
- Make it a complete, runnable page
- Project name: ${canvasProject.name}
- Component name: ${component.name}`;
}

async function generateWithAI(prompt: string): Promise<string> {
  if (!MINIMAX_API_KEY) {
    // Mock generation when no API key
    await new Promise((r) => setTimeout(r, 1000));
    return `// Generated page for: ${prompt.split('\n')[3]?.replace('Component: ', '') || 'Unknown'}
'use client';

import React from 'react';

export default function GeneratedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Generated Page</h1>
        <p className="text-gray-600">VibeX Canvas Prototype</p>
      </div>
    </div>
  );
}`;
  }

  const url = `${MINIMAX_API_BASE}/text/chatcompletion_v2`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are VibeX UI Generator. Generate React + TypeScript page code. Return ONLY the code in a JSON object: {"code": "..."}. No markdown, no explanation.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`MiniMax API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content || '';

  // Try to parse JSON response
  const match = content.match(/\{[\s\S]*\}/);
  if (match) {
    const parsed = JSON.parse(match[0]);
    return parsed.code || content;
  }
  return content;
}
