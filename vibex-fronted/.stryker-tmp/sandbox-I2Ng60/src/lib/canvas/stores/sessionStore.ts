/**
 * VibeX sessionStore — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 5 slice extraction.
 *
 * Responsibilities:
 * - SSE connection status
 * - AI thinking state
 * - Message history
 * - Prototype queue / project state
 */
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { PrototypePage } from '../types';
export type SSEStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';
export type MessageType = 'user_action' | 'ai_suggestion' | 'system' | 'command_executed';
export interface MessageItem {
  id: string;
  type: MessageType;
  content: string;
  meta?: string;
  timestamp: number;
}
let _messageIdCounter = 0;
function newMessageId(): string {
  if (stryMutAct_9fa48("1509")) {
    {}
  } else {
    stryCov_9fa48("1509");
    return stryMutAct_9fa48("1510") ? `` : (stryCov_9fa48("1510"), `msg-${Date.now()}-${stryMutAct_9fa48("1511") ? --_messageIdCounter : (stryCov_9fa48("1511"), ++_messageIdCounter)}`);
  }
}
interface SessionStore {
  // SSE status
  sseStatus: SSEStatus;
  sseError: string | null;
  setSseStatus: (status: SSEStatus, error?: string) => void;

  // AI thinking state
  aiThinking: boolean;
  aiThinkingMessage: string | null;
  flowGenerating: boolean;
  flowGeneratingMessage: string | null;
  requirementText: string;
  setAiThinking: (thinking: boolean, message?: string | null) => void;
  setFlowGenerating: (generating: boolean, message?: string | null) => void;
  setRequirementText: (text: string) => void;

  // Message history
  messages: MessageItem[];
  addMessage: (msg: Omit<MessageItem, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // Queue / project
  projectId: string | null;
  prototypeQueue: PrototypePage[];
  isPolling: boolean;
  setProjectId: (id: string | null) => void;
  setIsPolling: (polling: boolean) => void;
  addToQueue: (pages: PrototypePage[]) => void;
  updateQueueItem: (pageId: string, update: Partial<PrototypePage>) => void;
  removeFromQueue: (pageId: string) => void;
  clearQueue: () => void;
}
export const useSessionStore = create<SessionStore>()(devtools(persist(stryMutAct_9fa48("1512") ? () => undefined : (stryCov_9fa48("1512"), set => stryMutAct_9fa48("1513") ? {} : (stryCov_9fa48("1513"), {
  // SSE status
  sseStatus: 'idle' as SSEStatus,
  sseError: null,
  setSseStatus: stryMutAct_9fa48("1514") ? () => undefined : (stryCov_9fa48("1514"), (status, error) => set(stryMutAct_9fa48("1515") ? {} : (stryCov_9fa48("1515"), {
    sseStatus: status,
    sseError: stryMutAct_9fa48("1516") ? error && null : (stryCov_9fa48("1516"), error ?? null)
  }))),
  // AI thinking
  aiThinking: stryMutAct_9fa48("1517") ? true : (stryCov_9fa48("1517"), false),
  aiThinkingMessage: null,
  flowGenerating: stryMutAct_9fa48("1518") ? true : (stryCov_9fa48("1518"), false),
  flowGeneratingMessage: null,
  requirementText: stryMutAct_9fa48("1519") ? "Stryker was here!" : (stryCov_9fa48("1519"), ''),
  setAiThinking: stryMutAct_9fa48("1520") ? () => undefined : (stryCov_9fa48("1520"), (thinking, message) => set(stryMutAct_9fa48("1521") ? {} : (stryCov_9fa48("1521"), {
    aiThinking: thinking,
    aiThinkingMessage: stryMutAct_9fa48("1522") ? message && null : (stryCov_9fa48("1522"), message ?? null)
  }))),
  setFlowGenerating: stryMutAct_9fa48("1523") ? () => undefined : (stryCov_9fa48("1523"), (generating, message) => set(stryMutAct_9fa48("1524") ? {} : (stryCov_9fa48("1524"), {
    flowGenerating: generating,
    flowGeneratingMessage: stryMutAct_9fa48("1525") ? message && null : (stryCov_9fa48("1525"), message ?? null)
  }))),
  setRequirementText: stryMutAct_9fa48("1526") ? () => undefined : (stryCov_9fa48("1526"), text => set(stryMutAct_9fa48("1527") ? {} : (stryCov_9fa48("1527"), {
    requirementText: text
  }))),
  // Messages
  messages: stryMutAct_9fa48("1528") ? ["Stryker was here"] : (stryCov_9fa48("1528"), []),
  addMessage: stryMutAct_9fa48("1529") ? () => undefined : (stryCov_9fa48("1529"), msg => set(stryMutAct_9fa48("1530") ? () => undefined : (stryCov_9fa48("1530"), s => stryMutAct_9fa48("1531") ? {} : (stryCov_9fa48("1531"), {
    messages: stryMutAct_9fa48("1532") ? [] : (stryCov_9fa48("1532"), [...s.messages, stryMutAct_9fa48("1533") ? {} : (stryCov_9fa48("1533"), {
      ...msg,
      id: newMessageId(),
      timestamp: Date.now()
    })])
  })))),
  clearMessages: stryMutAct_9fa48("1534") ? () => undefined : (stryCov_9fa48("1534"), () => set(stryMutAct_9fa48("1535") ? {} : (stryCov_9fa48("1535"), {
    messages: stryMutAct_9fa48("1536") ? ["Stryker was here"] : (stryCov_9fa48("1536"), [])
  }))),
  // Queue
  projectId: null,
  prototypeQueue: stryMutAct_9fa48("1537") ? ["Stryker was here"] : (stryCov_9fa48("1537"), []),
  isPolling: stryMutAct_9fa48("1538") ? true : (stryCov_9fa48("1538"), false),
  setProjectId: stryMutAct_9fa48("1539") ? () => undefined : (stryCov_9fa48("1539"), id => set(stryMutAct_9fa48("1540") ? {} : (stryCov_9fa48("1540"), {
    projectId: id
  }))),
  setIsPolling: stryMutAct_9fa48("1541") ? () => undefined : (stryCov_9fa48("1541"), polling => set(stryMutAct_9fa48("1542") ? {} : (stryCov_9fa48("1542"), {
    isPolling: polling
  }))),
  addToQueue: stryMutAct_9fa48("1543") ? () => undefined : (stryCov_9fa48("1543"), pages => set(stryMutAct_9fa48("1544") ? () => undefined : (stryCov_9fa48("1544"), s => stryMutAct_9fa48("1545") ? {} : (stryCov_9fa48("1545"), {
    prototypeQueue: stryMutAct_9fa48("1546") ? [] : (stryCov_9fa48("1546"), [...s.prototypeQueue, ...pages])
  })))),
  updateQueueItem: stryMutAct_9fa48("1547") ? () => undefined : (stryCov_9fa48("1547"), (pageId, update) => set(stryMutAct_9fa48("1548") ? () => undefined : (stryCov_9fa48("1548"), s => stryMutAct_9fa48("1549") ? {} : (stryCov_9fa48("1549"), {
    prototypeQueue: s.prototypeQueue.map(stryMutAct_9fa48("1550") ? () => undefined : (stryCov_9fa48("1550"), p => (stryMutAct_9fa48("1553") ? p.pageId !== pageId : stryMutAct_9fa48("1552") ? false : stryMutAct_9fa48("1551") ? true : (stryCov_9fa48("1551", "1552", "1553"), p.pageId === pageId)) ? stryMutAct_9fa48("1554") ? {} : (stryCov_9fa48("1554"), {
      ...p,
      ...update
    }) : p))
  })))),
  removeFromQueue: stryMutAct_9fa48("1555") ? () => undefined : (stryCov_9fa48("1555"), pageId => set(stryMutAct_9fa48("1556") ? () => undefined : (stryCov_9fa48("1556"), s => stryMutAct_9fa48("1557") ? {} : (stryCov_9fa48("1557"), {
    prototypeQueue: stryMutAct_9fa48("1558") ? s.prototypeQueue : (stryCov_9fa48("1558"), s.prototypeQueue.filter(stryMutAct_9fa48("1559") ? () => undefined : (stryCov_9fa48("1559"), p => stryMutAct_9fa48("1562") ? p.pageId === pageId : stryMutAct_9fa48("1561") ? false : stryMutAct_9fa48("1560") ? true : (stryCov_9fa48("1560", "1561", "1562"), p.pageId !== pageId))))
  })))),
  clearQueue: stryMutAct_9fa48("1563") ? () => undefined : (stryCov_9fa48("1563"), () => set(stryMutAct_9fa48("1564") ? {} : (stryCov_9fa48("1564"), {
    prototypeQueue: stryMutAct_9fa48("1565") ? ["Stryker was here"] : (stryCov_9fa48("1565"), []),
    projectId: null
  })))
})), stryMutAct_9fa48("1566") ? {} : (stryCov_9fa48("1566"), {
  name: stryMutAct_9fa48("1567") ? "" : (stryCov_9fa48("1567"), 'vibex-session-store')
})), stryMutAct_9fa48("1568") ? {} : (stryCov_9fa48("1568"), {
  name: stryMutAct_9fa48("1569") ? "" : (stryCov_9fa48("1569"), 'SessionStore')
})));