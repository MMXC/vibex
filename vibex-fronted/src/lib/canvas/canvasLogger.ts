/**
 * canvasLogger — Canvas-specific logger
 *
 * Replaces console.error in canvas components.
 * Logs only in non-production environments.
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const isDev = process.env.NODE_ENV !== 'production';

function formatMsg(level: LogLevel, context: string, ...args: unknown[]): string {
  return `[canvas.${context}] ${args.map((a) => String(a)).join(' ')}`;
}

function createLogger(context: string) {
  return {
    error: (...args: unknown[]) => {
      if (isDev) console.error(formatMsg('error', context, ...args));
    },
    warn: (...args: unknown[]) => {
      if (isDev) console.warn(formatMsg('warn', context, ...args));
    },
    info: (...args: unknown[]) => {
      if (isDev) console.info(formatMsg('info', context, ...args));
    },
    debug: (...args: unknown[]) => {
      if (isDev) console.debug(formatMsg('debug', context, ...args));
    },
  };
}

export const canvasLogger = {
  TemplateSelector: createLogger('TemplateSelector'),
  VersionHistoryPanel: createLogger('VersionHistoryPanel'),
  ProjectBar: createLogger('ProjectBar'),
  BusinessFlowTree: createLogger('BusinessFlowTree'),
  BoundedContextTree: createLogger('BoundedContextTree'),
  ComponentTree: createLogger('ComponentTree'),
  LeftDrawer: createLogger('LeftDrawer'),
  CanvasPage: createLogger('CanvasPage'),
};
