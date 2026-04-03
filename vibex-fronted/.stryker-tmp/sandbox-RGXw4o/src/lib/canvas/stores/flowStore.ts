/**
 * VibeX flowStore — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 3 slice extraction.
 *
 * Responsibilities:
 * - BusinessFlowNode state (flowNodes, flowDraft)
 * - CRUD operations on flow nodes and their steps
 * - Step-level confirm/edit/delete/reorder
 * - autoGenerateFlows (cross-store: calls canvasApi, reads contextNodes)
 *
 * E4 migration: Added autoGenerateFlows, removed circular useCanvasStore import.
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
import type { BusinessFlowNode, BusinessFlowDraft, FlowStep } from '../types';
import { getHistoryStore } from '../historySlice';
import { canvasApi } from '../api/canvasApi';
import { postContextActionMessage } from './messageBridge';
function generateId(): string {
  if (stryMutAct_9fa48("514")) {
    {}
  } else {
    stryCov_9fa48("514");
    return stryMutAct_9fa48("515") ? `` : (stryCov_9fa48("515"), `${Date.now()}-${stryMutAct_9fa48("516") ? Math.random().toString(36) : (stryCov_9fa48("516"), Math.random().toString(36).slice(2, 9))}`);
  }
}
interface FlowStore {
  // State
  flowNodes: BusinessFlowNode[];
  flowDraft: Partial<BusinessFlowNode> | null;

  // Node CRUD
  setFlowNodes: (nodes: BusinessFlowNode[]) => void;
  addFlowNode: (data: BusinessFlowDraft) => void;
  editFlowNode: (nodeId: string, data: Partial<BusinessFlowNode>) => void;
  deleteFlowNode: (nodeId: string) => void;
  confirmFlowNode: (nodeId: string) => void;
  toggleFlowNode: (nodeId: string) => void;

  // Step CRUD
  confirmStep: (flowNodeId: string, stepId: string) => void;
  addStepToFlow: (flowNodeId: string, data: {
    name: string;
    actor?: string;
    description?: string;
  }) => void;
  editStep: (flowNodeId: string, stepId: string, data: Partial<FlowStep>) => void;
  deleteStep: (flowNodeId: string, stepId: string) => void;
  reorderSteps: (flowNodeId: string, fromIndex: number, toIndex: number) => void;

  // Draft
  setFlowDraft: (draft: Partial<BusinessFlowNode> | null) => void;

  // Auto-generation (cross-store: reads from contextStore)
  autoGenerateFlows: (contexts: BusinessFlowNode[]) => Promise<void>;
}
export const useFlowStore = create<FlowStore>()(devtools(persist(stryMutAct_9fa48("517") ? () => undefined : (stryCov_9fa48("517"), (set, get) => stryMutAct_9fa48("518") ? {} : (stryCov_9fa48("518"), {
  // State
  flowNodes: stryMutAct_9fa48("519") ? ["Stryker was here"] : (stryCov_9fa48("519"), []),
  flowDraft: null,
  setFlowNodes: stryMutAct_9fa48("520") ? () => undefined : (stryCov_9fa48("520"), nodes => set(stryMutAct_9fa48("521") ? {} : (stryCov_9fa48("521"), {
    flowNodes: nodes
  }))),
  addFlowNode: data => {
    if (stryMutAct_9fa48("522")) {
      {}
    } else {
      stryCov_9fa48("522");
      const newNode: BusinessFlowNode = stryMutAct_9fa48("523") ? {} : (stryCov_9fa48("523"), {
        nodeId: generateId(),
        contextId: data.contextId,
        name: data.name,
        steps: data.steps.map(stryMutAct_9fa48("524") ? () => undefined : (stryCov_9fa48("524"), (s, i) => stryMutAct_9fa48("525") ? {} : (stryCov_9fa48("525"), {
          ...s,
          stepId: generateId(),
          status: 'pending' as const,
          isActive: stryMutAct_9fa48("526") ? true : (stryCov_9fa48("526"), false),
          order: i
        }))),
        isActive: stryMutAct_9fa48("527") ? true : (stryCov_9fa48("527"), false),
        status: stryMutAct_9fa48("528") ? "" : (stryCov_9fa48("528"), 'pending'),
        children: stryMutAct_9fa48("529") ? ["Stryker was here"] : (stryCov_9fa48("529"), [])
      });
      set(s => {
        if (stryMutAct_9fa48("530")) {
          {}
        } else {
          stryCov_9fa48("530");
          const newNodes = stryMutAct_9fa48("531") ? [] : (stryCov_9fa48("531"), [...s.flowNodes, newNode]);
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("532") ? "" : (stryCov_9fa48("532"), 'flow'), newNodes);
          return stryMutAct_9fa48("533") ? {} : (stryCov_9fa48("533"), {
            flowNodes: newNodes
          });
        }
      });
      postContextActionMessage(stryMutAct_9fa48("534") ? `` : (stryCov_9fa48("534"), `添加了流程节点`), data.name);
    }
  },
  editFlowNode: (nodeId, data) => {
    if (stryMutAct_9fa48("535")) {
      {}
    } else {
      stryCov_9fa48("535");
      set(s => {
        if (stryMutAct_9fa48("536")) {
          {}
        } else {
          stryCov_9fa48("536");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("537") ? () => undefined : (stryCov_9fa48("537"), n => (stryMutAct_9fa48("540") ? n.nodeId !== nodeId : stryMutAct_9fa48("539") ? false : stryMutAct_9fa48("538") ? true : (stryCov_9fa48("538", "539", "540"), n.nodeId === nodeId)) ? stryMutAct_9fa48("541") ? {} : (stryCov_9fa48("541"), {
            ...n,
            ...data,
            status: 'pending' as const
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("542") ? "" : (stryCov_9fa48("542"), 'flow'), newNodes);
          return stryMutAct_9fa48("543") ? {} : (stryCov_9fa48("543"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  deleteFlowNode: nodeId => {
    if (stryMutAct_9fa48("544")) {
      {}
    } else {
      stryCov_9fa48("544");
      const nodeToDelete = get().flowNodes.find(stryMutAct_9fa48("545") ? () => undefined : (stryCov_9fa48("545"), n => stryMutAct_9fa48("548") ? n.nodeId !== nodeId : stryMutAct_9fa48("547") ? false : stryMutAct_9fa48("546") ? true : (stryCov_9fa48("546", "547", "548"), n.nodeId === nodeId)));
      const deletedName = stryMutAct_9fa48("549") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("549"), (stryMutAct_9fa48("550") ? nodeToDelete.name : (stryCov_9fa48("550"), nodeToDelete?.name)) ?? nodeId);
      set(s => {
        if (stryMutAct_9fa48("551")) {
          {}
        } else {
          stryCov_9fa48("551");
          const newNodes = stryMutAct_9fa48("552") ? s.flowNodes : (stryCov_9fa48("552"), s.flowNodes.filter(stryMutAct_9fa48("553") ? () => undefined : (stryCov_9fa48("553"), n => stryMutAct_9fa48("556") ? n.nodeId === nodeId : stryMutAct_9fa48("555") ? false : stryMutAct_9fa48("554") ? true : (stryCov_9fa48("554", "555", "556"), n.nodeId !== nodeId))));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("557") ? "" : (stryCov_9fa48("557"), 'flow'), newNodes);
          return stryMutAct_9fa48("558") ? {} : (stryCov_9fa48("558"), {
            flowNodes: newNodes
          });
        }
      });
      postContextActionMessage(stryMutAct_9fa48("559") ? `` : (stryCov_9fa48("559"), `删除了流程节点`), deletedName);
    }
  },
  confirmFlowNode: nodeId => {
    if (stryMutAct_9fa48("560")) {
      {}
    } else {
      stryCov_9fa48("560");
      set(s => {
        if (stryMutAct_9fa48("561")) {
          {}
        } else {
          stryCov_9fa48("561");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("562")) {
              {}
            } else {
              stryCov_9fa48("562");
              if (stryMutAct_9fa48("565") ? n.nodeId === nodeId : stryMutAct_9fa48("564") ? false : stryMutAct_9fa48("563") ? true : (stryCov_9fa48("563", "564", "565"), n.nodeId !== nodeId)) return n;
              const isConfirmed = stryMutAct_9fa48("568") ? n.status !== 'confirmed' : stryMutAct_9fa48("567") ? false : stryMutAct_9fa48("566") ? true : (stryCov_9fa48("566", "567", "568"), n.status === (stryMutAct_9fa48("569") ? "" : (stryCov_9fa48("569"), 'confirmed')));
              return stryMutAct_9fa48("570") ? {} : (stryCov_9fa48("570"), {
                ...n,
                isActive: stryMutAct_9fa48("571") ? isConfirmed : (stryCov_9fa48("571"), !isConfirmed),
                status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending',
                steps: n.steps.map(stryMutAct_9fa48("572") ? () => undefined : (stryCov_9fa48("572"), step => stryMutAct_9fa48("573") ? {} : (stryCov_9fa48("573"), {
                  ...step,
                  isActive: stryMutAct_9fa48("574") ? isConfirmed : (stryCov_9fa48("574"), !isConfirmed),
                  status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending'
                })))
              });
            }
          });
          return stryMutAct_9fa48("575") ? {} : (stryCov_9fa48("575"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  toggleFlowNode: nodeId => {
    if (stryMutAct_9fa48("576")) {
      {}
    } else {
      stryCov_9fa48("576");
      set(s => {
        if (stryMutAct_9fa48("577")) {
          {}
        } else {
          stryCov_9fa48("577");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("578")) {
              {}
            } else {
              stryCov_9fa48("578");
              if (stryMutAct_9fa48("581") ? n.nodeId === nodeId : stryMutAct_9fa48("580") ? false : stryMutAct_9fa48("579") ? true : (stryCov_9fa48("579", "580", "581"), n.nodeId !== nodeId)) return n;
              const isConfirmed = stryMutAct_9fa48("584") ? n.status !== 'confirmed' : stryMutAct_9fa48("583") ? false : stryMutAct_9fa48("582") ? true : (stryCov_9fa48("582", "583", "584"), n.status === (stryMutAct_9fa48("585") ? "" : (stryCov_9fa48("585"), 'confirmed')));
              return stryMutAct_9fa48("586") ? {} : (stryCov_9fa48("586"), {
                ...n,
                isActive: stryMutAct_9fa48("587") ? isConfirmed : (stryCov_9fa48("587"), !isConfirmed),
                status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending',
                steps: n.steps.map(stryMutAct_9fa48("588") ? () => undefined : (stryCov_9fa48("588"), step => stryMutAct_9fa48("589") ? {} : (stryCov_9fa48("589"), {
                  ...step,
                  isActive: stryMutAct_9fa48("590") ? isConfirmed : (stryCov_9fa48("590"), !isConfirmed),
                  status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending'
                })))
              });
            }
          });
          return stryMutAct_9fa48("591") ? {} : (stryCov_9fa48("591"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  confirmStep: (flowNodeId, stepId) => {
    if (stryMutAct_9fa48("592")) {
      {}
    } else {
      stryCov_9fa48("592");
      set(s => {
        if (stryMutAct_9fa48("593")) {
          {}
        } else {
          stryCov_9fa48("593");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("594") ? () => undefined : (stryCov_9fa48("594"), n => (stryMutAct_9fa48("597") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("596") ? false : stryMutAct_9fa48("595") ? true : (stryCov_9fa48("595", "596", "597"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("598") ? {} : (stryCov_9fa48("598"), {
            ...n,
            steps: n.steps.map(stryMutAct_9fa48("599") ? () => undefined : (stryCov_9fa48("599"), step => (stryMutAct_9fa48("602") ? step.stepId !== stepId : stryMutAct_9fa48("601") ? false : stryMutAct_9fa48("600") ? true : (stryCov_9fa48("600", "601", "602"), step.stepId === stepId)) ? stryMutAct_9fa48("603") ? {} : (stryCov_9fa48("603"), {
              ...step,
              isActive: stryMutAct_9fa48("604") ? false : (stryCov_9fa48("604"), true),
              status: 'confirmed' as const
            }) : step))
          }) : n));
          return stryMutAct_9fa48("605") ? {} : (stryCov_9fa48("605"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  addStepToFlow: (flowNodeId, data) => {
    if (stryMutAct_9fa48("606")) {
      {}
    } else {
      stryCov_9fa48("606");
      set(s => {
        if (stryMutAct_9fa48("607")) {
          {}
        } else {
          stryCov_9fa48("607");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("608")) {
              {}
            } else {
              stryCov_9fa48("608");
              if (stryMutAct_9fa48("611") ? n.nodeId === flowNodeId : stryMutAct_9fa48("610") ? false : stryMutAct_9fa48("609") ? true : (stryCov_9fa48("609", "610", "611"), n.nodeId !== flowNodeId)) return n;
              const newStep: FlowStep = stryMutAct_9fa48("612") ? {} : (stryCov_9fa48("612"), {
                stepId: generateId(),
                name: data.name,
                actor: stryMutAct_9fa48("613") ? data.actor && '待定' : (stryCov_9fa48("613"), data.actor ?? (stryMutAct_9fa48("614") ? "" : (stryCov_9fa48("614"), '待定'))),
                description: stryMutAct_9fa48("615") ? data.description && '' : (stryCov_9fa48("615"), data.description ?? (stryMutAct_9fa48("616") ? "Stryker was here!" : (stryCov_9fa48("616"), ''))),
                order: n.steps.length,
                isActive: stryMutAct_9fa48("617") ? true : (stryCov_9fa48("617"), false),
                status: 'pending' as const
              });
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("618") ? "" : (stryCov_9fa48("618"), 'flow'), stryMutAct_9fa48("619") ? [] : (stryCov_9fa48("619"), [...s.flowNodes]));
              return stryMutAct_9fa48("620") ? {} : (stryCov_9fa48("620"), {
                ...n,
                steps: stryMutAct_9fa48("621") ? [] : (stryCov_9fa48("621"), [...n.steps, newStep]),
                status: 'pending' as const
              });
            }
          });
          return stryMutAct_9fa48("622") ? {} : (stryCov_9fa48("622"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  editStep: (flowNodeId, stepId, data) => {
    if (stryMutAct_9fa48("623")) {
      {}
    } else {
      stryCov_9fa48("623");
      set(s => {
        if (stryMutAct_9fa48("624")) {
          {}
        } else {
          stryCov_9fa48("624");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("625") ? () => undefined : (stryCov_9fa48("625"), n => (stryMutAct_9fa48("628") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("627") ? false : stryMutAct_9fa48("626") ? true : (stryCov_9fa48("626", "627", "628"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("629") ? {} : (stryCov_9fa48("629"), {
            ...n,
            status: 'pending' as const,
            steps: n.steps.map(stryMutAct_9fa48("630") ? () => undefined : (stryCov_9fa48("630"), st => (stryMutAct_9fa48("633") ? st.stepId !== stepId : stryMutAct_9fa48("632") ? false : stryMutAct_9fa48("631") ? true : (stryCov_9fa48("631", "632", "633"), st.stepId === stepId)) ? stryMutAct_9fa48("634") ? {} : (stryCov_9fa48("634"), {
              ...st,
              ...data,
              status: 'pending' as const
            }) : st))
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("635") ? "" : (stryCov_9fa48("635"), 'flow'), newNodes);
          return stryMutAct_9fa48("636") ? {} : (stryCov_9fa48("636"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  deleteStep: (flowNodeId, stepId) => {
    if (stryMutAct_9fa48("637")) {
      {}
    } else {
      stryCov_9fa48("637");
      set(s => {
        if (stryMutAct_9fa48("638")) {
          {}
        } else {
          stryCov_9fa48("638");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("639") ? () => undefined : (stryCov_9fa48("639"), n => (stryMutAct_9fa48("642") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("641") ? false : stryMutAct_9fa48("640") ? true : (stryCov_9fa48("640", "641", "642"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("643") ? {} : (stryCov_9fa48("643"), {
            ...n,
            steps: stryMutAct_9fa48("644") ? n.steps : (stryCov_9fa48("644"), n.steps.filter(stryMutAct_9fa48("645") ? () => undefined : (stryCov_9fa48("645"), st => stryMutAct_9fa48("648") ? st.stepId === stepId : stryMutAct_9fa48("647") ? false : stryMutAct_9fa48("646") ? true : (stryCov_9fa48("646", "647", "648"), st.stepId !== stepId))))
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("649") ? "" : (stryCov_9fa48("649"), 'flow'), newNodes);
          return stryMutAct_9fa48("650") ? {} : (stryCov_9fa48("650"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  reorderSteps: (flowNodeId, fromIndex, toIndex) => {
    if (stryMutAct_9fa48("651")) {
      {}
    } else {
      stryCov_9fa48("651");
      set(s => {
        if (stryMutAct_9fa48("652")) {
          {}
        } else {
          stryCov_9fa48("652");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("653")) {
              {}
            } else {
              stryCov_9fa48("653");
              if (stryMutAct_9fa48("656") ? n.nodeId === flowNodeId : stryMutAct_9fa48("655") ? false : stryMutAct_9fa48("654") ? true : (stryCov_9fa48("654", "655", "656"), n.nodeId !== flowNodeId)) return n;
              const steps = stryMutAct_9fa48("657") ? [] : (stryCov_9fa48("657"), [...n.steps]);
              const [moved] = steps.splice(fromIndex, 1);
              const insertAt = (stryMutAct_9fa48("661") ? fromIndex >= toIndex : stryMutAct_9fa48("660") ? fromIndex <= toIndex : stryMutAct_9fa48("659") ? false : stryMutAct_9fa48("658") ? true : (stryCov_9fa48("658", "659", "660", "661"), fromIndex < toIndex)) ? stryMutAct_9fa48("662") ? toIndex + 1 : (stryCov_9fa48("662"), toIndex - 1) : toIndex;
              steps.splice(insertAt, 0, moved);
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("663") ? "" : (stryCov_9fa48("663"), 'flow'), stryMutAct_9fa48("664") ? [] : (stryCov_9fa48("664"), [...s.flowNodes]));
              return stryMutAct_9fa48("665") ? {} : (stryCov_9fa48("665"), {
                ...n,
                steps: steps.map(stryMutAct_9fa48("666") ? () => undefined : (stryCov_9fa48("666"), (st, i) => stryMutAct_9fa48("667") ? {} : (stryCov_9fa48("667"), {
                  ...st,
                  order: i
                }))),
                status: 'pending' as const
              });
            }
          });
          return stryMutAct_9fa48("668") ? {} : (stryCov_9fa48("668"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  setFlowDraft: stryMutAct_9fa48("669") ? () => undefined : (stryCov_9fa48("669"), draft => set(stryMutAct_9fa48("670") ? {} : (stryCov_9fa48("670"), {
    flowDraft: draft
  }))),
  // === Auto-generation (Epic 3 S3.1) ===
  autoGenerateFlows: async contexts => {
    if (stryMutAct_9fa48("671")) {
      {}
    } else {
      stryCov_9fa48("671");
      const {
        useSessionStore
      } = require('./sessionStore');
      const {
        useContextStore
      } = require('./contextStore');
      useSessionStore.getState().setFlowGenerating(stryMutAct_9fa48("672") ? false : (stryCov_9fa48("672"), true), stryMutAct_9fa48("673") ? "" : (stryCov_9fa48("673"), '正在生成流程树...'));
      try {
        if (stryMutAct_9fa48("674")) {
          {}
        } else {
          stryCov_9fa48("674");
          const {
            projectId
          } = useSessionStore.getState();
          const sessionId = stryMutAct_9fa48("675") ? projectId && `session-${Date.now()}` : (stryCov_9fa48("675"), projectId ?? (stryMutAct_9fa48("676") ? `` : (stryCov_9fa48("676"), `session-${Date.now()}`)));

          // Map context nodes to API format (user-edited data)
          const mappedContexts = contexts.map(stryMutAct_9fa48("677") ? () => undefined : (stryCov_9fa48("677"), (ctx: any) => stryMutAct_9fa48("678") ? {} : (stryCov_9fa48("678"), {
            id: ctx.nodeId,
            name: ctx.name,
            description: stryMutAct_9fa48("679") ? ctx.description && '' : (stryCov_9fa48("679"), ctx.description ?? (stryMutAct_9fa48("680") ? "Stryker was here!" : (stryCov_9fa48("680"), ''))),
            type: ctx.type
          })));
          const result = await canvasApi.generateFlows(stryMutAct_9fa48("681") ? {} : (stryCov_9fa48("681"), {
            contexts: mappedContexts,
            sessionId
          }));
          if (stryMutAct_9fa48("684") ? result.success && result.flows || result.flows.length > 0 : stryMutAct_9fa48("683") ? false : stryMutAct_9fa48("682") ? true : (stryCov_9fa48("682", "683", "684"), (stryMutAct_9fa48("686") ? result.success || result.flows : stryMutAct_9fa48("685") ? true : (stryCov_9fa48("685", "686"), result.success && result.flows)) && (stryMutAct_9fa48("689") ? result.flows.length <= 0 : stryMutAct_9fa48("688") ? result.flows.length >= 0 : stryMutAct_9fa48("687") ? true : (stryCov_9fa48("687", "688", "689"), result.flows.length > 0)))) {
            if (stryMutAct_9fa48("690")) {
              {}
            } else {
              stryCov_9fa48("690");
              const flows: BusinessFlowNode[] = result.flows.map(stryMutAct_9fa48("691") ? () => undefined : (stryCov_9fa48("691"), (f: any) => stryMutAct_9fa48("692") ? {} : (stryCov_9fa48("692"), {
                nodeId: generateId(),
                contextId: f.contextId,
                name: f.name,
                steps: f.steps.map(stryMutAct_9fa48("693") ? () => undefined : (stryCov_9fa48("693"), (step: any, idx: number) => stryMutAct_9fa48("694") ? {} : (stryCov_9fa48("694"), {
                  stepId: generateId(),
                  name: step.name,
                  actor: step.actor,
                  description: step.description,
                  order: stryMutAct_9fa48("695") ? step.order && idx : (stryCov_9fa48("695"), step.order ?? idx),
                  isActive: stryMutAct_9fa48("696") ? true : (stryCov_9fa48("696"), false),
                  status: 'pending' as const
                }))),
                isActive: stryMutAct_9fa48("697") ? true : (stryCov_9fa48("697"), false),
                status: 'pending' as const,
                children: stryMutAct_9fa48("698") ? ["Stryker was here"] : (stryCov_9fa48("698"), [])
              })));
              get().setFlowNodes(flows);
              useContextStore.getState().setPhase(stryMutAct_9fa48("699") ? "" : (stryCov_9fa48("699"), 'flow'));
            }
          } else {
            if (stryMutAct_9fa48("700")) {
              {}
            } else {
              stryCov_9fa48("700");
              console.error(stryMutAct_9fa48("701") ? "" : (stryCov_9fa48("701"), '[flowStore] generateFlows: API returned no flows'), result.error);
            }
          }
        }
      } catch (err) {
        if (stryMutAct_9fa48("702")) {
          {}
        } else {
          stryCov_9fa48("702");
          console.error(stryMutAct_9fa48("703") ? "" : (stryCov_9fa48("703"), '[flowStore] autoGenerateFlows error:'), err);
        }
      } finally {
        if (stryMutAct_9fa48("704")) {
          {}
        } else {
          stryCov_9fa48("704");
          useSessionStore.getState().setFlowGenerating(stryMutAct_9fa48("705") ? true : (stryCov_9fa48("705"), false), null);
        }
      }
    }
  }
})), stryMutAct_9fa48("706") ? {} : (stryCov_9fa48("706"), {
  name: stryMutAct_9fa48("707") ? "" : (stryCov_9fa48("707"), 'vibex-flow-store'),
  partialize: stryMutAct_9fa48("708") ? () => undefined : (stryCov_9fa48("708"), state => stryMutAct_9fa48("709") ? {} : (stryCov_9fa48("709"), {
    flowNodes: state.flowNodes
  }))
})), stryMutAct_9fa48("710") ? {} : (stryCov_9fa48("710"), {
  name: stryMutAct_9fa48("711") ? "" : (stryCov_9fa48("711"), 'FlowStore')
})));