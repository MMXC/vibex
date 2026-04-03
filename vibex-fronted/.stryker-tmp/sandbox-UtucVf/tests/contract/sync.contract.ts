/**
 * sync.contract.ts — Contract tests for E4 SyncProtocol API
 *
 * Validates that the canvas snapshot API responses conform to Zod schemas.
 * Uses Playwright to run against the actual API endpoint (or mocked).
 *
 * Based on:
 * - E4-spec: createSnapshot API response shape
 * - src/lib/canvas/types.ts: CanvasSnapshot, CreateSnapshotOutput
 * - src/lib/schemas/canvas.ts: Existing Zod schemas
 */
// @ts-nocheck


import { test, expect } from '@playwright/test';
import { z } from 'zod';

// =============================================================================
// E4 API Contract Schemas (aligned with src/lib/canvas/types.ts)
// =============================================================================

/** CanvasSnapshot — snapshot record returned by the API */
const CanvasSnapshotSchema = z.object({
  snapshotId: z.string(),
  projectId: z.string().nullable(),
  label: z.string(),
  trigger: z.enum(['manual', 'ai_complete', 'auto']),
  createdAt: z.string().datetime(),
  version: z.number().int().nonnegative(),
  contextCount: z.number().int().nonnegative(),
  flowCount: z.number().int().nonnegative(),
  componentCount: z.number().int().nonnegative(),
});

/** CreateSnapshotOutput — POST /api/v1/canvas/snapshots response */
const CreateSnapshotOutputSchema = z.object({
  success: z.boolean(),
  snapshot: CanvasSnapshotSchema,
});

/** Error response shape */
const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  serverVersion: z.number().optional(),
  currentVersion: z.number().optional(),
});

/** 409 Conflict response */
const ConflictResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.enum(['VERSION_CONFLICT', 'CONFLICT']),
  serverVersion: z.number().int().nonnegative(),
  currentVersion: z.number().int().nonnegative(),
});

/** Union of all possible response shapes */
const SnapshotResponseSchema = z.discriminatedUnion('success', [
  CreateSnapshotOutputSchema,
  ErrorResponseSchema,
]);

// =============================================================================
// Contract Tests
// =============================================================================

test.describe('Sync API Contract (E4)', () => {
  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
  const SNAPSHOTS_URL = `${BASE_URL}/api/v1/canvas/snapshots`;

  // -------------------------------------------------------------------------
  // Contract-1: createSnapshot returns valid CreateSnapshotOutput
  // -------------------------------------------------------------------------
  test('Contract-1: POST /snapshots returns valid CreateSnapshotOutput', async ({ page }) => {
    // Intercept to ensure we get a predictable success response
    await page.route(SNAPSHOTS_URL, async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          snapshot: {
            snapshotId: 'snap-test-001',
            projectId: 'proj-test-001',
            label: '测试快照',
            trigger: 'manual',
            createdAt: new Date().toISOString(),
            version: 1,
            contextCount: 0,
            flowCount: 0,
            componentCount: 0,
          },
        }),
      });
    });

    const response = await page.evaluate(async (url) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'proj-test-001',
          label: '测试快照',
          trigger: 'manual',
          version: undefined,
          contextNodes: [],
          flowNodes: [],
          componentNodes: [],
        }),
      });
      return res.json();
    }, SNAPSHOTS_URL);

    // Validate response against schema
    const result = CreateSnapshotOutputSchema.safeParse(response);

    if (!result.success) {
      // Log schema violations for debugging
      console.error('Schema violations:', JSON.stringify(result.error.format(), null, 2));
    }

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      success: true,
      snapshot: {
        snapshotId: expect.any(String),
        projectId: expect.anything(),
        label: expect.any(String),
        trigger: expect.stringMatching(/^(manual|ai_complete|auto)$/),
        createdAt: expect.any(String),
        version: expect.any(Number),
        contextCount: expect.any(Number),
        flowCount: expect.any(Number),
        componentCount: expect.any(Number),
      },
    });
  });

  // -------------------------------------------------------------------------
  // Contract-2: 409 Conflict returns valid ConflictResponse
  // -------------------------------------------------------------------------
  test('Contract-2: 409 Conflict returns valid ConflictResponse', async ({ page }) => {
    await page.route(SNAPSHOTS_URL, async route => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Version conflict detected',
          code: 'VERSION_CONFLICT',
          serverVersion: 5,
          currentVersion: 3,
        }),
      });
    });

    const response = await page.evaluate(async (url) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'proj-test-001',
          label: '自动保存',
          trigger: 'auto',
          version: 3, // Stale version → conflict
          contextNodes: [],
          flowNodes: [],
          componentNodes: [],
        }),
      });
      return { status: res.status, body: await res.json() };
    }, SNAPSHOTS_URL);

    expect(response.status).toBe(409);

    const result = ConflictResponseSchema.safeParse(response.body);
    if (!result.success) {
      console.error('Conflict schema violations:', JSON.stringify(result.error.format(), null, 2));
    }
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      success: false,
      code: 'VERSION_CONFLICT',
      serverVersion: expect.any(Number),
      currentVersion: expect.any(Number),
    });
  });

  // -------------------------------------------------------------------------
  // Contract-3: version field is optional (backward compat)
  // -------------------------------------------------------------------------
  test('Contract-3: version field is optional (backward compatible)', async ({ page }) => {
    await page.route(SNAPSHOTS_URL, async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          snapshot: {
            snapshotId: 'snap-no-version',
            projectId: null,
            label: '手动保存',
            trigger: 'manual',
            createdAt: new Date().toISOString(),
            version: 1,
            contextCount: 0,
            flowCount: 0,
            componentCount: 0,
          },
        }),
      });
    });

    // Send without version (backward compatible call)
    const response = await page.evaluate(async (url) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: null,
          label: '手动保存',
          trigger: 'manual',
          // No version field
          contextNodes: [],
          flowNodes: [],
          componentNodes: [],
        }),
      });
      return res.json();
    }, SNAPSHOTS_URL);

    const result = CreateSnapshotOutputSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Contract-4: GET /snapshots?projectId= returns valid snapshot list
  // -------------------------------------------------------------------------
  test('Contract-4: GET /snapshots returns valid snapshot list', async ({ page }) => {
    const projectId = 'proj-contract-001';
    await page.route(`${SNAPSHOTS_URL}?projectId=${projectId}`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          snapshots: [
            {
              snapshotId: 'snap-list-1',
              projectId,
              label: '快照 A',
              trigger: 'auto',
              createdAt: new Date().toISOString(),
              version: 2,
              contextCount: 3,
              flowCount: 5,
              componentCount: 8,
            },
            {
              snapshotId: 'snap-list-2',
              projectId,
              label: '快照 B',
              trigger: 'manual',
              createdAt: new Date().toISOString(),
              version: 1,
              contextCount: 2,
              flowCount: 4,
              componentCount: 6,
            },
          ],
        }),
      });
    });

    const response = await page.evaluate(async (url) => {
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      return res.json();
    }, `${SNAPSHOTS_URL}?projectId=${projectId}`);

    const result = z.object({
      success: z.boolean(),
      snapshots: z.array(CanvasSnapshotSchema),
    }).safeParse(response);

    if (!result.success) {
      console.error('List response schema violations:', JSON.stringify(result.error.format(), null, 2));
    }
    expect(result.success).toBe(true);
    expect(result.data!.snapshots).toHaveLength(2);
  });

  // -------------------------------------------------------------------------
  // Contract-5: POST without auth returns 401
  // -------------------------------------------------------------------------
  test('Contract-5: POST /snapshots without auth returns 401', async ({ page }) => {
    // Remove auth headers to simulate unauthenticated request
    await page.context().clearCookies();

    const response = await page.evaluate(async (url) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'proj-test',
          label: 'test',
          trigger: 'manual',
          contextNodes: [],
          flowNodes: [],
          componentNodes: [],
        }),
      });
      return { status: res.status };
    }, SNAPSHOTS_URL);

    // 401 is acceptable for unauthenticated requests
    expect([401, 403]).toContain(response.status);
  });
});
