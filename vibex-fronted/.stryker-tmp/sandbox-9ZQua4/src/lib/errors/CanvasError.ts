/**
 * Canvas-specific error types for VibeX
 * Part of E3 Tech Debt Cleanup (TD-2, TD-4)
 */
// @ts-nocheck


export class CanvasValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'CanvasValidationError';
  }
}

export class CanvasApiError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'CanvasApiError';
  }
}

export class CanvasRenderError extends Error {
  constructor(message: string, public nodeId?: string) {
    super(message);
    this.name = 'CanvasRenderError';
  }
}
