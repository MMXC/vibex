/**
 * EmbeddedAgentContext — React context for embedded agent panel
 * Sprint57 E2: Canvas-Inline AI Session Panel
 *
 * Allows DDSToolbar to open the panel without prop drilling.
 */

import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';

interface AgentPanelContextValue {
  openPanel: () => void;
  closePanel: () => void;
  isOpen: boolean;
}

const EmbeddedAgentContext = createContext<AgentPanelContextValue>({
  openPanel: () => {},
  closePanel: () => {},
  isOpen: false,
});

export function EmbeddedAgentProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);

  return (
    <EmbeddedAgentContext.Provider value={{ openPanel, closePanel, isOpen }}>
      {children}
    </EmbeddedAgentContext.Provider>
  );
}

export function useEmbeddedAgentContext() {
  return useContext(EmbeddedAgentContext);
}

export default EmbeddedAgentContext;
