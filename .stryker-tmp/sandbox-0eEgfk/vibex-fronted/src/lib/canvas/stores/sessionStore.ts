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
  if (stryMutAct_9fa48("1285")) {
    {}
  } else {
    stryCov_9fa48("1285");
    return stryMutAct_9fa48("1286") ? `` : (stryCov_9fa48("1286"), `msg-${Date.now()}-${stryMutAct_9fa48("1287") ? --_messageIdCounter : (stryCov_9fa48("1287"), ++_messageIdCounter)}`);
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
export const useSessionStore = create<SessionStore>()(devtools(persist(stryMutAct_9fa48("1288") ? () => undefined : (stryCov_9fa48("1288"), set => stryMutAct_9fa48("1289") ? {} : (stryCov_9fa48("1289"), {
  // SSE status
  sseStatus: 'idle' as SSEStatus,
  sseError: null,
  setSseStatus: stryMutAct_9fa48("1290") ? () => undefined : (stryCov_9fa48("1290"), (status, error) => set(stryMutAct_9fa48("1291") ? {} : (stryCov_9fa48("1291"), {
    sseStatus: status,
    sseError: stryMutAct_9fa48("1292") ? error && null : (stryCov_9fa48("1292"), error ?? null)
  }))),
  // AI thinking
  aiThinking: stryMutAct_9fa48("1293") ? true : (stryCov_9fa48("1293"), false),
  aiThinkingMessage: null,
  flowGenerating: stryMutAct_9fa48("1294") ? true : (stryCov_9fa48("1294"), false),
  flowGeneratingMessage: null,
  requirementText: stryMutAct_9fa48("1295") ? "Stryker was here!" : (stryCov_9fa48("1295"), ''),
  setAiThinking: stryMutAct_9fa48("1296") ? () => undefined : (stryCov_9fa48("1296"), (thinking, message) => set(stryMutAct_9fa48("1297") ? {} : (stryCov_9fa48("1297"), {
    aiThinking: thinking,
    aiThinkingMessage: stryMutAct_9fa48("1298") ? message && null : (stryCov_9fa48("1298"), message ?? null)
  }))),
  setFlowGenerating: stryMutAct_9fa48("1299") ? () => undefined : (stryCov_9fa48("1299"), (generating, message) => set(stryMutAct_9fa48("1300") ? {} : (stryCov_9fa48("1300"), {
    flowGenerating: generating,
    flowGeneratingMessage: stryMutAct_9fa48("1301") ? message && null : (stryCov_9fa48("1301"), message ?? null)
  }))),
  setRequirementText: stryMutAct_9fa48("1302") ? () => undefined : (stryCov_9fa48("1302"), text => set(stryMutAct_9fa48("1303") ? {} : (stryCov_9fa48("1303"), {
    requirementText: text
  }))),
  // Messages
  messages: stryMutAct_9fa48("1304") ? ["Stryker was here"] : (stryCov_9fa48("1304"), []),
  addMessage: stryMutAct_9fa48("1305") ? () => undefined : (stryCov_9fa48("1305"), msg => set(stryMutAct_9fa48("1306") ? () => undefined : (stryCov_9fa48("1306"), s => stryMutAct_9fa48("1307") ? {} : (stryCov_9fa48("1307"), {
    messages: stryMutAct_9fa48("1308") ? [] : (stryCov_9fa48("1308"), [...s.messages, stryMutAct_9fa48("1309") ? {} : (stryCov_9fa48("1309"), {
      ...msg,
      id: newMessageId(),
      timestamp: Date.now()
    })])
  })))),
  clearMessages: stryMutAct_9fa48("1310") ? () => undefined : (stryCov_9fa48("1310"), () => set(stryMutAct_9fa48("1311") ? {} : (stryCov_9fa48("1311"), {
    messages: stryMutAct_9fa48("1312") ? ["Stryker was here"] : (stryCov_9fa48("1312"), [])
  }))),
  // Queue
  projectId: null,
  prototypeQueue: stryMutAct_9fa48("1313") ? ["Stryker was here"] : (stryCov_9fa48("1313"), []),
  isPolling: stryMutAct_9fa48("1314") ? true : (stryCov_9fa48("1314"), false),
  setProjectId: stryMutAct_9fa48("1315") ? () => undefined : (stryCov_9fa48("1315"), id => set(stryMutAct_9fa48("1316") ? {} : (stryCov_9fa48("1316"), {
    projectId: id
  }))),
  setIsPolling: stryMutAct_9fa48("1317") ? () => undefined : (stryCov_9fa48("1317"), polling => set(stryMutAct_9fa48("1318") ? {} : (stryCov_9fa48("1318"), {
    isPolling: polling
  }))),
  addToQueue: stryMutAct_9fa48("1319") ? () => undefined : (stryCov_9fa48("1319"), pages => set(stryMutAct_9fa48("1320") ? () => undefined : (stryCov_9fa48("1320"), s => stryMutAct_9fa48("1321") ? {} : (stryCov_9fa48("1321"), {
    prototypeQueue: stryMutAct_9fa48("1322") ? [] : (stryCov_9fa48("1322"), [...s.prototypeQueue, ...pages])
  })))),
  updateQueueItem: stryMutAct_9fa48("1323") ? () => undefined : (stryCov_9fa48("1323"), (pageId, update) => set(stryMutAct_9fa48("1324") ? () => undefined : (stryCov_9fa48("1324"), s => stryMutAct_9fa48("1325") ? {} : (stryCov_9fa48("1325"), {
    prototypeQueue: s.prototypeQueue.map(stryMutAct_9fa48("1326") ? () => undefined : (stryCov_9fa48("1326"), p => (stryMutAct_9fa48("1329") ? p.pageId !== pageId : stryMutAct_9fa48("1328") ? false : stryMutAct_9fa48("1327") ? true : (stryCov_9fa48("1327", "1328", "1329"), p.pageId === pageId)) ? stryMutAct_9fa48("1330") ? {} : (stryCov_9fa48("1330"), {
      ...p,
      ...update
    }) : p))
  })))),
  removeFromQueue: stryMutAct_9fa48("1331") ? () => undefined : (stryCov_9fa48("1331"), pageId => set(stryMutAct_9fa48("1332") ? () => undefined : (stryCov_9fa48("1332"), s => stryMutAct_9fa48("1333") ? {} : (stryCov_9fa48("1333"), {
    prototypeQueue: stryMutAct_9fa48("1334") ? s.prototypeQueue : (stryCov_9fa48("1334"), s.prototypeQueue.filter(stryMutAct_9fa48("1335") ? () => undefined : (stryCov_9fa48("1335"), p => stryMutAct_9fa48("1338") ? p.pageId === pageId : stryMutAct_9fa48("1337") ? false : stryMutAct_9fa48("1336") ? true : (stryCov_9fa48("1336", "1337", "1338"), p.pageId !== pageId))))
  })))),
  clearQueue: stryMutAct_9fa48("1339") ? () => undefined : (stryCov_9fa48("1339"), () => set(stryMutAct_9fa48("1340") ? {} : (stryCov_9fa48("1340"), {
    prototypeQueue: stryMutAct_9fa48("1341") ? ["Stryker was here"] : (stryCov_9fa48("1341"), []),
    projectId: null
  })))
})), stryMutAct_9fa48("1342") ? {} : (stryCov_9fa48("1342"), {
  name: stryMutAct_9fa48("1343") ? "" : (stryCov_9fa48("1343"), 'vibex-session-store')
})), stryMutAct_9fa48("1344") ? {} : (stryCov_9fa48("1344"), {
  name: stryMutAct_9fa48("1345") ? "" : (stryCov_9fa48("1345"), 'SessionStore')
})));