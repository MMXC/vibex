/**
 * mcp-bridge.ts — MCP Server bridge for Design Review
 *
 * Spawns the VibeX MCP Server in stdio mode and calls the `review_design` tool.
 * Implements graceful degradation: if MCP is unavailable, throws error
 * so the caller can fall back to static analysis.
 *
 * E1 Design Review MCP — Epic1-Design-Review-MCP
 */

import { spawn } from 'child_process';
import { resolve } from 'path';

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

const MCP_SERVER_PATH = resolve(__dirname, '../../../../../packages/mcp-server/dist/index.js');
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

  return new Promise((resolve, reject) => {
    const proc = spawn('node', [MCP_SERVER_PATH], {
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

    // Send request and set up response handler
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
      // Try to parse response from accumulated output
      try {
        // Find the response line (last complete JSON object)
        const lines = output.trim().split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i];
          if (!line) continue;
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const msg = JSON.parse(line) as JSONRPCMessage;
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