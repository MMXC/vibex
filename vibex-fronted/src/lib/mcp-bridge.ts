/**
 * mcp-bridge.ts — MCP Server bridge for Design Review
 *
 * Spawns the VibeX MCP Server in stdio mode and calls the `review_design` tool.
 * Implements graceful degradation: if MCP is unavailable, throws error
 * so the caller can fall back to static analysis.
 *
 * E1 Design Review MCP — Epic1-Design-Review-MCP
 *
 * Turbopack compatibility: the MCP server path is resolved at runtime from
 * the environment variable MCP_SERVER_PATH, not from any file-system path.
 * If the env var is not set, the function throws with a clear error message,
 * which the route handler catches and converts to the static analysis fallback.
 */

import { spawn } from 'child_process';

// =============================================================================
// Types
// =============================================================================

export interface ReviewDesignInput {
  canvasId: string;
  nodes?: Array<Record<string, unknown>>;
  checkCompliance?: boolean;
  checkA11y?: boolean;
  checkReuse?: boolean;
}

export interface MCPCallResult {
  /** Raw MCP JSON-RPC response content */
  content: Array<{ type: 'text'; text: string }>;
  /** Structured design review report parsed from content */
  _designReview?: DesignReviewReport;
}

export interface DesignReviewReport {
  canvasId: string;
  reviewedAt: string;
  /** AI-driven design quality score (0-100), computed from compliance/a11y/reuse analysis */
  aiScore: number;
  /** Actionable improvement suggestions derived from design review */
  suggestions: Array<{ type: string; message: string; priority: 'high' | 'medium' | 'low' }>;
  summary: {
    compliance: 'pass' | 'warn' | 'fail';
    a11y: 'pass' | 'warn' | 'fail';
    reuseCandidates: number;
    totalNodes: number;
  };
  designCompliance?: {
    colors: boolean;
    colorIssues: unknown[];
    typography: boolean;
    typographyIssues: unknown[];
    spacing: boolean;
    spacingIssues: unknown[];
  };
  a11y?: {
    passed: boolean;
    critical: number;
    high: number;
    medium: number;
    low: number;
    issues: unknown[];
  };
  reuse?: {
    candidatesAboveThreshold: number;
    candidates: unknown[];
    recommendations: string[];
  };
}

// =============================================================================
// MCP Bridge
// =============================================================================

const CALL_TIMEOUT_MS = 5000; // C-E1-2: 5s timeout

interface JSONRPCMessage {
  jsonrpc: '2.0';
  id: number | string;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

/**
 * Get the MCP server binary path at runtime (avoids Turbopack static analysis).
 * 
 * Resolution order:
 * 1. MCP_SERVER_PATH env var (set by DevOps for staging/prod deployments)
 * 2. For local dev, MCP is typically unavailable so we throw a clear error
 *    and let the caller fall back to static analysis.
 */
function getMcpServerPath(): string {
  if (process.env.MCP_SERVER_PATH) {
    return process.env.MCP_SERVER_PATH;
  }
  // In development/CI without env var, MCP server is not configured.
  // Throw with clear message so the route's try/catch can handle graceful degradation.
  throw new Error('MCP_SERVER_PATH environment variable is not set. Set it to the absolute path of packages/mcp-server/dist/index.js, or leave unset to use static analysis fallback.');
}

/**
 * Call an MCP tool via stdio JSON-RPC.
 * Throws if MCP server is unavailable or call times out.
 */
export async function callTool(
  toolName: string,
  args: Record<string, unknown>,
  options: { timeoutMs?: number } = {}
): Promise<MCPCallResult> {
  const timeoutMs = options.timeoutMs ?? CALL_TIMEOUT_MS;
  let output = '';
  let errorOutput = '';

  // Resolve MCP server path at runtime
  let mcpServerPath: string;
  try {
    mcpServerPath = getMcpServerPath();
  } catch (err) {
    // MCP not configured — throw immediately so route can catch and degrade
    return Promise.reject(err);
  }

  return new Promise((resolve, reject) => {
    const proc = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV ?? 'development',
      },
    });

    const id = Date.now();
    const request: JSONRPCMessage = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    };

    proc.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });

    proc.stderr?.on('data', (chunk: Buffer) => {
      errorOutput += chunk.toString();
    });

    proc.stdin?.write(JSON.stringify(request) + '\n', (err) => {
      if (err) {
        proc.kill();
        reject(new Error(`Failed to write to MCP stdin: ${err.message}`));
      }
    });

    // Timeout
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`MCP call timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    // Collect response
    let resolved = false;
    proc.stdout?.on('data', () => {
      try {
        const lines = output.trim().split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i];
          if (!line) continue;
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const msg = JSON.parse(trimmed) as JSONRPCMessage;
            if (msg.id === id) {
              clearTimeout(timer);
              if (msg.error) {
                resolved = true;
                reject(new Error(`MCP error: ${msg.error.message}`));
              } else {
                resolved = true;
                const result = msg.result as MCPCallResult;
                resolve(result);
              }
              return;
            }
          } catch {
            // Not a valid JSON line, continue
          }
        }
      } catch {
        // Partial output, keep collecting
      }
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (!resolved) {
        if (code !== 0 && errorOutput) {
          reject(new Error(`MCP server exited with code ${code}: ${errorOutput}`));
        } else {
          reject(new Error(`MCP server closed unexpectedly (code ${code})`));
        }
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      if (!resolved) {
        reject(new Error(`MCP server spawn failed: ${err.message}`));
      }
    });
  });
}

/**
 * Call the `review_design` MCP tool with graceful degradation support.
 */
export async function callReviewDesignTool(input: ReviewDesignInput): Promise<MCPCallResult> {
  return callTool('review_design', {
    canvasId: input.canvasId,
    nodes: input.nodes ?? [],
    checkCompliance: input.checkCompliance ?? true,
    checkA11y: input.checkA11y ?? true,
    checkReuse: input.checkReuse ?? true,
  });
}