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
  if (stryMutAct_9fa48("1250")) {
    {}
  } else {
    stryCov_9fa48("1250");
    return stryMutAct_9fa48("1251") ? `` : (stryCov_9fa48("1251"), `msg-${Date.now()}-${stryMutAct_9fa48("1252") ? --_messageIdCounter : (stryCov_9fa48("1252"), ++_messageIdCounter)}`);
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
export const useSessionStore = create<SessionStore>()(devtools(persist(stryMutAct_9fa48("1253") ? () => undefined : (stryCov_9fa48("1253"), set => stryMutAct_9fa48("1254") ? {} : (stryCov_9fa48("1254"), {
  // SSE status
  sseStatus: 'idle' as SSEStatus,
  sseError: null,
  setSseStatus: stryMutAct_9fa48("1255") ? () => undefined : (stryCov_9fa48("1255"), (status, error) => set(stryMutAct_9fa48("1256") ? {} : (stryCov_9fa48("1256"), {
    sseStatus: status,
    sseError: stryMutAct_9fa48("1257") ? error && null : (stryCov_9fa48("1257"), error ?? null)
  }))),
  // AI thinking
  aiThinking: stryMutAct_9fa48("1258") ? true : (stryCov_9fa48("1258"), false),
  aiThinkingMessage: null,
  flowGenerating: stryMutAct_9fa48("1259") ? true : (stryCov_9fa48("1259"), false),
  flowGeneratingMessage: null,
  requirementText: stryMutAct_9fa48("1260") ? "Stryker was here!" : (stryCov_9fa48("1260"), ''),
  setAiThinking: stryMutAct_9fa48("1261") ? () => undefined : (stryCov_9fa48("1261"), (thinking, message) => set(stryMutAct_9fa48("1262") ? {} : (stryCov_9fa48("1262"), {
    aiThinking: thinking,
    aiThinkingMessage: stryMutAct_9fa48("1263") ? message && null : (stryCov_9fa48("1263"), message ?? null)
  }))),
  setFlowGenerating: stryMutAct_9fa48("1264") ? () => undefined : (stryCov_9fa48("1264"), (generating, message) => set(stryMutAct_9fa48("1265") ? {} : (stryCov_9fa48("1265"), {
    flowGenerating: generating,
    flowGeneratingMessage: stryMutAct_9fa48("1266") ? message && null : (stryCov_9fa48("1266"), message ?? null)
  }))),
  setRequirementText: stryMutAct_9fa48("1267") ? () => undefined : (stryCov_9fa48("1267"), text => set(stryMutAct_9fa48("1268") ? {} : (stryCov_9fa48("1268"), {
    requirementText: text
  }))),
  // Messages
  messages: stryMutAct_9fa48("1269") ? ["Stryker was here"] : (stryCov_9fa48("1269"), []),
  addMessage: stryMutAct_9fa48("1270") ? () => undefined : (stryCov_9fa48("1270"), msg => set(stryMutAct_9fa48("1271") ? () => undefined : (stryCov_9fa48("1271"), s => stryMutAct_9fa48("1272") ? {} : (stryCov_9fa48("1272"), {
    messages: stryMutAct_9fa48("1273") ? [] : (stryCov_9fa48("1273"), [...s.messages, stryMutAct_9fa48("1274") ? {} : (stryCov_9fa48("1274"), {
      ...msg,
      id: newMessageId(),
      timestamp: Date.now()
    })])
  })))),
  clearMessages: stryMutAct_9fa48("1275") ? () => undefined : (stryCov_9fa48("1275"), () => set(stryMutAct_9fa48("1276") ? {} : (stryCov_9fa48("1276"), {
    messages: stryMutAct_9fa48("1277") ? ["Stryker was here"] : (stryCov_9fa48("1277"), [])
  }))),
  // Queue
  projectId: null,
  prototypeQueue: stryMutAct_9fa48("1278") ? ["Stryker was here"] : (stryCov_9fa48("1278"), []),
  isPolling: stryMutAct_9fa48("1279") ? true : (stryCov_9fa48("1279"), false),
  setProjectId: stryMutAct_9fa48("1280") ? () => undefined : (stryCov_9fa48("1280"), id => set(stryMutAct_9fa48("1281") ? {} : (stryCov_9fa48("1281"), {
    projectId: id
  }))),
  setIsPolling: stryMutAct_9fa48("1282") ? () => undefined : (stryCov_9fa48("1282"), polling => set(stryMutAct_9fa48("1283") ? {} : (stryCov_9fa48("1283"), {
    isPolling: polling
  }))),
  addToQueue: stryMutAct_9fa48("1284") ? () => undefined : (stryCov_9fa48("1284"), pages => set(stryMutAct_9fa48("1285") ? () => undefined : (stryCov_9fa48("1285"), s => stryMutAct_9fa48("1286") ? {} : (stryCov_9fa48("1286"), {
    prototypeQueue: stryMutAct_9fa48("1287") ? [] : (stryCov_9fa48("1287"), [...s.prototypeQueue, ...pages])
  })))),
  updateQueueItem: stryMutAct_9fa48("1288") ? () => undefined : (stryCov_9fa48("1288"), (pageId, update) => set(stryMutAct_9fa48("1289") ? () => undefined : (stryCov_9fa48("1289"), s => stryMutAct_9fa48("1290") ? {} : (stryCov_9fa48("1290"), {
    prototypeQueue: s.prototypeQueue.map(stryMutAct_9fa48("1291") ? () => undefined : (stryCov_9fa48("1291"), p => (stryMutAct_9fa48("1294") ? p.pageId !== pageId : stryMutAct_9fa48("1293") ? false : stryMutAct_9fa48("1292") ? true : (stryCov_9fa48("1292", "1293", "1294"), p.pageId === pageId)) ? stryMutAct_9fa48("1295") ? {} : (stryCov_9fa48("1295"), {
      ...p,
      ...update
    }) : p))
  })))),
  removeFromQueue: stryMutAct_9fa48("1296") ? () => undefined : (stryCov_9fa48("1296"), pageId => set(stryMutAct_9fa48("1297") ? () => undefined : (stryCov_9fa48("1297"), s => stryMutAct_9fa48("1298") ? {} : (stryCov_9fa48("1298"), {
    prototypeQueue: stryMutAct_9fa48("1299") ? s.prototypeQueue : (stryCov_9fa48("1299"), s.prototypeQueue.filter(stryMutAct_9fa48("1300") ? () => undefined : (stryCov_9fa48("1300"), p => stryMutAct_9fa48("1303") ? p.pageId === pageId : stryMutAct_9fa48("1302") ? false : stryMutAct_9fa48("1301") ? true : (stryCov_9fa48("1301", "1302", "1303"), p.pageId !== pageId))))
  })))),
  clearQueue: stryMutAct_9fa48("1304") ? () => undefined : (stryCov_9fa48("1304"), () => set(stryMutAct_9fa48("1305") ? {} : (stryCov_9fa48("1305"), {
    prototypeQueue: stryMutAct_9fa48("1306") ? ["Stryker was here"] : (stryCov_9fa48("1306"), []),
    projectId: null
  })))
})), stryMutAct_9fa48("1307") ? {} : (stryCov_9fa48("1307"), {
  name: stryMutAct_9fa48("1308") ? "" : (stryCov_9fa48("1308"), 'vibex-session-store')
})), stryMutAct_9fa48("1309") ? {} : (stryCov_9fa48("1309"), {
  name: stryMutAct_9fa48("1310") ? "" : (stryCov_9fa48("1310"), 'SessionStore')
})));