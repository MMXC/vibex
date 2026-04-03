/**
 * VibeX sessionStore — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 5 slice extraction.
 *
 * Responsibilities:
 * - SSE connection status
 * - AI thinking state
 * - Message history
 * - Prototype queue / project state
 * - generateContextsFromRequirement (cross-store: calls canvasSseApi, modifies contextStore)
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
import type { PrototypePage, BoundedContextNode } from '../types';
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
  if (stryMutAct_9fa48("712")) {
    {}
  } else {
    stryCov_9fa48("712");
    return stryMutAct_9fa48("713") ? `` : (stryCov_9fa48("713"), `msg-${Date.now()}-${stryMutAct_9fa48("714") ? --_messageIdCounter : (stryCov_9fa48("714"), ++_messageIdCounter)}`);
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

  // Abort controller
  abortControllerRef: AbortController | null;
  abortGeneration: () => void;

  // Generate contexts from requirement (cross-store)
  generateContextsFromRequirement: (text: string) => Promise<void>;
}
export const useSessionStore = create<SessionStore>()(devtools(persist(stryMutAct_9fa48("715") ? () => undefined : (stryCov_9fa48("715"), (set, get) => stryMutAct_9fa48("716") ? {} : (stryCov_9fa48("716"), {
  // SSE status
  sseStatus: 'idle' as SSEStatus,
  sseError: null,
  setSseStatus: stryMutAct_9fa48("717") ? () => undefined : (stryCov_9fa48("717"), (status, error) => set(stryMutAct_9fa48("718") ? {} : (stryCov_9fa48("718"), {
    sseStatus: status,
    sseError: stryMutAct_9fa48("719") ? error && null : (stryCov_9fa48("719"), error ?? null)
  }))),
  // AI thinking
  aiThinking: stryMutAct_9fa48("720") ? true : (stryCov_9fa48("720"), false),
  aiThinkingMessage: null,
  flowGenerating: stryMutAct_9fa48("721") ? true : (stryCov_9fa48("721"), false),
  flowGeneratingMessage: null,
  requirementText: stryMutAct_9fa48("722") ? "Stryker was here!" : (stryCov_9fa48("722"), ''),
  setAiThinking: stryMutAct_9fa48("723") ? () => undefined : (stryCov_9fa48("723"), (thinking, message) => set(stryMutAct_9fa48("724") ? {} : (stryCov_9fa48("724"), {
    aiThinking: thinking,
    aiThinkingMessage: stryMutAct_9fa48("725") ? message && null : (stryCov_9fa48("725"), message ?? null)
  }))),
  setFlowGenerating: stryMutAct_9fa48("726") ? () => undefined : (stryCov_9fa48("726"), (generating, message) => set(stryMutAct_9fa48("727") ? {} : (stryCov_9fa48("727"), {
    flowGenerating: generating,
    flowGeneratingMessage: stryMutAct_9fa48("728") ? message && null : (stryCov_9fa48("728"), message ?? null)
  }))),
  setRequirementText: stryMutAct_9fa48("729") ? () => undefined : (stryCov_9fa48("729"), text => set(stryMutAct_9fa48("730") ? {} : (stryCov_9fa48("730"), {
    requirementText: text
  }))),
  // Messages
  messages: stryMutAct_9fa48("731") ? ["Stryker was here"] : (stryCov_9fa48("731"), []),
  addMessage: stryMutAct_9fa48("732") ? () => undefined : (stryCov_9fa48("732"), msg => set(stryMutAct_9fa48("733") ? () => undefined : (stryCov_9fa48("733"), s => stryMutAct_9fa48("734") ? {} : (stryCov_9fa48("734"), {
    messages: stryMutAct_9fa48("735") ? [] : (stryCov_9fa48("735"), [...s.messages, stryMutAct_9fa48("736") ? {} : (stryCov_9fa48("736"), {
      ...msg,
      id: newMessageId(),
      timestamp: Date.now()
    })])
  })))),
  clearMessages: stryMutAct_9fa48("737") ? () => undefined : (stryCov_9fa48("737"), () => set(stryMutAct_9fa48("738") ? {} : (stryCov_9fa48("738"), {
    messages: stryMutAct_9fa48("739") ? ["Stryker was here"] : (stryCov_9fa48("739"), [])
  }))),
  // Queue
  projectId: null,
  prototypeQueue: stryMutAct_9fa48("740") ? ["Stryker was here"] : (stryCov_9fa48("740"), []),
  isPolling: stryMutAct_9fa48("741") ? true : (stryCov_9fa48("741"), false),
  setProjectId: stryMutAct_9fa48("742") ? () => undefined : (stryCov_9fa48("742"), id => set(stryMutAct_9fa48("743") ? {} : (stryCov_9fa48("743"), {
    projectId: id
  }))),
  setIsPolling: stryMutAct_9fa48("744") ? () => undefined : (stryCov_9fa48("744"), polling => set(stryMutAct_9fa48("745") ? {} : (stryCov_9fa48("745"), {
    isPolling: polling
  }))),
  addToQueue: stryMutAct_9fa48("746") ? () => undefined : (stryCov_9fa48("746"), pages => set(stryMutAct_9fa48("747") ? () => undefined : (stryCov_9fa48("747"), s => stryMutAct_9fa48("748") ? {} : (stryCov_9fa48("748"), {
    prototypeQueue: stryMutAct_9fa48("749") ? [] : (stryCov_9fa48("749"), [...s.prototypeQueue, ...pages])
  })))),
  updateQueueItem: stryMutAct_9fa48("750") ? () => undefined : (stryCov_9fa48("750"), (pageId, update) => set(stryMutAct_9fa48("751") ? () => undefined : (stryCov_9fa48("751"), s => stryMutAct_9fa48("752") ? {} : (stryCov_9fa48("752"), {
    prototypeQueue: s.prototypeQueue.map(stryMutAct_9fa48("753") ? () => undefined : (stryCov_9fa48("753"), p => (stryMutAct_9fa48("756") ? p.pageId !== pageId : stryMutAct_9fa48("755") ? false : stryMutAct_9fa48("754") ? true : (stryCov_9fa48("754", "755", "756"), p.pageId === pageId)) ? stryMutAct_9fa48("757") ? {} : (stryCov_9fa48("757"), {
      ...p,
      ...update
    }) : p))
  })))),
  removeFromQueue: stryMutAct_9fa48("758") ? () => undefined : (stryCov_9fa48("758"), pageId => set(stryMutAct_9fa48("759") ? () => undefined : (stryCov_9fa48("759"), s => stryMutAct_9fa48("760") ? {} : (stryCov_9fa48("760"), {
    prototypeQueue: stryMutAct_9fa48("761") ? s.prototypeQueue : (stryCov_9fa48("761"), s.prototypeQueue.filter(stryMutAct_9fa48("762") ? () => undefined : (stryCov_9fa48("762"), p => stryMutAct_9fa48("765") ? p.pageId === pageId : stryMutAct_9fa48("764") ? false : stryMutAct_9fa48("763") ? true : (stryCov_9fa48("763", "764", "765"), p.pageId !== pageId))))
  })))),
  clearQueue: stryMutAct_9fa48("766") ? () => undefined : (stryCov_9fa48("766"), () => set(stryMutAct_9fa48("767") ? {} : (stryCov_9fa48("767"), {
    prototypeQueue: stryMutAct_9fa48("768") ? ["Stryker was here"] : (stryCov_9fa48("768"), []),
    projectId: null
  }))),
  // === Abort controller ===
  abortControllerRef: null as AbortController | null,
  abortGeneration: () => {
    if (stryMutAct_9fa48("769")) {
      {}
    } else {
      stryCov_9fa48("769");
      const {
        abortControllerRef
      } = get();
      if (stryMutAct_9fa48("771") ? false : stryMutAct_9fa48("770") ? true : (stryCov_9fa48("770", "771"), abortControllerRef)) {
        if (stryMutAct_9fa48("772")) {
          {}
        } else {
          stryCov_9fa48("772");
          abortControllerRef.abort();
          set(stryMutAct_9fa48("773") ? {} : (stryCov_9fa48("773"), {
            abortControllerRef: null,
            sseStatus: stryMutAct_9fa48("774") ? "" : (stryCov_9fa48("774"), 'idle'),
            flowGenerating: stryMutAct_9fa48("775") ? true : (stryCov_9fa48("775"), false),
            aiThinking: stryMutAct_9fa48("776") ? true : (stryCov_9fa48("776"), false)
          }));
        }
      }
    }
  },
  // === Generate contexts from requirement ===
  generateContextsFromRequirement: async (text: string) => {
    if (stryMutAct_9fa48("777")) {
      {}
    } else {
      stryCov_9fa48("777");
      // Dynamic import to avoid circular deps
      const {
        canvasSseAnalyze
      } = require('../api/canvasSseApi') as typeof import('../api/canvasSseApi');
      const {
        useContextStore
      } = require('./contextStore');
      const {
        setAiThinking,
        setRequirementText,
        setPhase
      } = get();
      const contextStore = useContextStore.getState();

      // Reset state
      setAiThinking(stryMutAct_9fa48("778") ? false : (stryCov_9fa48("778"), true), stryMutAct_9fa48("779") ? "" : (stryCov_9fa48("779"), '正在连接...'));
      setRequirementText(text);
      setPhase(stryMutAct_9fa48("780") ? "" : (stryCov_9fa48("780"), 'context'));
      canvasSseAnalyze(text, stryMutAct_9fa48("781") ? {} : (stryCov_9fa48("781"), {
        timeoutMs: 30000,
        onThinking: (content: string) => {
          if (stryMutAct_9fa48("782")) {
            {}
          } else {
            stryCov_9fa48("782");
            setAiThinking(stryMutAct_9fa48("783") ? false : (stryCov_9fa48("783"), true), content);
          }
        },
        onStepContext: (content: string, _mermaidCode: string | undefined, confidence: number | undefined, boundedContexts) => {
          if (stryMutAct_9fa48("784")) {
            {}
          } else {
            stryCov_9fa48("784");
            setAiThinking(stryMutAct_9fa48("785") ? false : (stryCov_9fa48("785"), true), content);
            const mapContextType = (type: string): BoundedContextNode['type'] => {
              if (stryMutAct_9fa48("786")) {
                {}
              } else {
                stryCov_9fa48("786");
                const validTypes = stryMutAct_9fa48("787") ? [] : (stryCov_9fa48("787"), [stryMutAct_9fa48("788") ? "" : (stryCov_9fa48("788"), 'core'), stryMutAct_9fa48("789") ? "" : (stryCov_9fa48("789"), 'supporting'), stryMutAct_9fa48("790") ? "" : (stryCov_9fa48("790"), 'generic'), stryMutAct_9fa48("791") ? "" : (stryCov_9fa48("791"), 'external')]);
                return validTypes.includes(type) ? type as BoundedContextNode['type'] : stryMutAct_9fa48("792") ? "" : (stryCov_9fa48("792"), 'core');
              }
            };
            const MAX_CONTEXT_NODES = 10;
            const MAX_NAME_LENGTH = 30;
            const truncateName = (name: string): string => {
              if (stryMutAct_9fa48("793")) {
                {}
              } else {
                stryCov_9fa48("793");
                if (stryMutAct_9fa48("797") ? name.length > MAX_NAME_LENGTH : stryMutAct_9fa48("796") ? name.length < MAX_NAME_LENGTH : stryMutAct_9fa48("795") ? false : stryMutAct_9fa48("794") ? true : (stryCov_9fa48("794", "795", "796", "797"), name.length <= MAX_NAME_LENGTH)) return name;
                return (stryMutAct_9fa48("798") ? name : (stryCov_9fa48("798"), name.substring(0, stryMutAct_9fa48("799") ? MAX_NAME_LENGTH + 3 : (stryCov_9fa48("799"), MAX_NAME_LENGTH - 3)))) + (stryMutAct_9fa48("800") ? "" : (stryCov_9fa48("800"), '...'));
              }
            };
            if (stryMutAct_9fa48("803") ? boundedContexts || boundedContexts.length > 0 : stryMutAct_9fa48("802") ? false : stryMutAct_9fa48("801") ? true : (stryCov_9fa48("801", "802", "803"), boundedContexts && (stryMutAct_9fa48("806") ? boundedContexts.length <= 0 : stryMutAct_9fa48("805") ? boundedContexts.length >= 0 : stryMutAct_9fa48("804") ? true : (stryCov_9fa48("804", "805", "806"), boundedContexts.length > 0)))) {
              if (stryMutAct_9fa48("807")) {
                {}
              } else {
                stryCov_9fa48("807");
                const nodesToAdd = stryMutAct_9fa48("808") ? boundedContexts : (stryCov_9fa48("808"), boundedContexts.slice(0, MAX_CONTEXT_NODES));
                nodesToAdd.forEach((ctx: any) => {
                  if (stryMutAct_9fa48("809")) {
                    {}
                  } else {
                    stryCov_9fa48("809");
                    contextStore.addContextNode(stryMutAct_9fa48("810") ? {} : (stryCov_9fa48("810"), {
                      name: truncateName(ctx.name),
                      description: ctx.description,
                      type: mapContextType(ctx.type)
                    }));
                  }
                });
              }
            } else if (stryMutAct_9fa48("813") ? confidence !== undefined || confidence > 0.5 : stryMutAct_9fa48("812") ? false : stryMutAct_9fa48("811") ? true : (stryCov_9fa48("811", "812", "813"), (stryMutAct_9fa48("815") ? confidence === undefined : stryMutAct_9fa48("814") ? true : (stryCov_9fa48("814", "815"), confidence !== undefined)) && (stryMutAct_9fa48("818") ? confidence <= 0.5 : stryMutAct_9fa48("817") ? confidence >= 0.5 : stryMutAct_9fa48("816") ? true : (stryCov_9fa48("816", "817", "818"), confidence > 0.5)))) {
              if (stryMutAct_9fa48("819")) {
                {}
              } else {
                stryCov_9fa48("819");
                contextStore.addContextNode(stryMutAct_9fa48("820") ? {} : (stryCov_9fa48("820"), {
                  name: stryMutAct_9fa48("821") ? "" : (stryCov_9fa48("821"), 'AI 分析上下文'),
                  description: content,
                  type: stryMutAct_9fa48("822") ? "" : (stryCov_9fa48("822"), 'core')
                }));
              }
            }
          }
        },
        onStepModel: (content: string) => {
          if (stryMutAct_9fa48("823")) {
            {}
          } else {
            stryCov_9fa48("823");
            setAiThinking(stryMutAct_9fa48("824") ? false : (stryCov_9fa48("824"), true), content);
          }
        },
        onStepFlow: (content: string) => {
          if (stryMutAct_9fa48("825")) {
            {}
          } else {
            stryCov_9fa48("825");
            setAiThinking(stryMutAct_9fa48("826") ? false : (stryCov_9fa48("826"), true), content);
          }
        },
        onStepComponents: (content: string) => {
          if (stryMutAct_9fa48("827")) {
            {}
          } else {
            stryCov_9fa48("827");
            setAiThinking(stryMutAct_9fa48("828") ? false : (stryCov_9fa48("828"), true), content);
          }
        },
        onDone: () => {
          if (stryMutAct_9fa48("829")) {
            {}
          } else {
            stryCov_9fa48("829");
            setAiThinking(stryMutAct_9fa48("830") ? true : (stryCov_9fa48("830"), false), null);
          }
        },
        onError: () => {
          if (stryMutAct_9fa48("831")) {
            {}
          } else {
            stryCov_9fa48("831");
            setAiThinking(stryMutAct_9fa48("832") ? true : (stryCov_9fa48("832"), false), null);
          }
        }
      })).catch((err: unknown) => {
        if (stryMutAct_9fa48("833")) {
          {}
        } else {
          stryCov_9fa48("833");
          setAiThinking(stryMutAct_9fa48("834") ? true : (stryCov_9fa48("834"), false), null);
          console.error(stryMutAct_9fa48("835") ? "" : (stryCov_9fa48("835"), '[sessionStore] generateContextsFromRequirement error:'), err);
        }
      });
    }
  }
})), stryMutAct_9fa48("836") ? {} : (stryCov_9fa48("836"), {
  name: stryMutAct_9fa48("837") ? "" : (stryCov_9fa48("837"), 'vibex-session-store'),
  partialize: stryMutAct_9fa48("838") ? () => undefined : (stryCov_9fa48("838"), state => stryMutAct_9fa48("839") ? {} : (stryCov_9fa48("839"), {
    projectId: state.projectId,
    prototypeQueue: state.prototypeQueue
  }))
})), stryMutAct_9fa48("840") ? {} : (stryCov_9fa48("840"), {
  name: stryMutAct_9fa48("841") ? "" : (stryCov_9fa48("841"), 'SessionStore')
})));