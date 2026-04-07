/**
 * Mock for react-resizable-panels in Jest environment
 * Fixes: TypeError: n is not a constructor
 */

import React from 'react';

export const PanelGroup = ({ children, ...props }: any) => (
  <div data-testid="panel-group" {...props}>{children}</div>
);

export const Panel = ({ children, ...props }: any) => (
  <div data-testid="panel" {...props}>{children}</div>
);

export const PanelResizeHandle = ({ ...props }: any) => (
  <div data-testid="panel-resize-handle" {...props} />
);

export const ImperativePanelGroupHandle = {} as any;
export const ImperativePanelHandle = {} as any;
