/**
 * VibeX componentStore — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 4 slice extraction.
 *
 * Responsibilities:
 * - ComponentNode state (componentNodes, componentDraft)
 * - CRUD operations on component nodes
 * - Multi-select for component tree
 * - generateComponentFromFlow (cross-store: reads contextStore + flowStore)
 *
 * E4 migration: Added generateComponentFromFlow, clearComponentCanvas.
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
import type { ComponentNode } from '../types';
import { canvasApi } from '../api/canvasApi';
import { getHistoryStore } from '../historySlice';
import { postContextActionMessage } from './messageBridge';
function generateId(): string {
  if (stryMutAct_9fa48("43")) {
    {}
  } else {
    stryCov_9fa48("43");
    return stryMutAct_9fa48("44") ? `` : (stryCov_9fa48("44"), `${Date.now()}-${stryMutAct_9fa48("45") ? Math.random().toString(36) : (stryCov_9fa48("45"), Math.random().toString(36).slice(2, 9))}`);
  }
}
interface ComponentStore {
  // State
  componentNodes: ComponentNode[];
  componentDraft: Partial<ComponentNode> | null;
  selectedNodeIds: string[];

  // Node CRUD
  setComponentNodes: (nodes: ComponentNode[]) => void;
  clearComponentCanvas: () => void;
  addComponentNode: (data: Omit<ComponentNode, 'nodeId' | 'status' | 'isActive' | 'children'>) => void;
  editComponentNode: (nodeId: string, data: Partial<ComponentNode>) => void;
  deleteComponentNode: (nodeId: string) => void;

  // Draft
  setComponentDraft: (draft: Partial<ComponentNode> | null) => void;

  // Multi-select
  toggleNodeSelect: (nodeId: string) => void;
  selectNode: (nodeId: string) => void;
  clearNodeSelection: () => void;
  selectAllNodes: () => void;
  deleteSelectedNodes: () => void;

  // Manual Component Generation (cross-store)
  generateComponentFromFlow: () => Promise<void>;
}
export const useComponentStore = create<ComponentStore>()(devtools(persist(stryMutAct_9fa48("46") ? () => undefined : (stryCov_9fa48("46"), (set, get) => stryMutAct_9fa48("47") ? {} : (stryCov_9fa48("47"), {
  // State
  componentNodes: stryMutAct_9fa48("48") ? ["Stryker was here"] : (stryCov_9fa48("48"), []),
  componentDraft: null,
  selectedNodeIds: stryMutAct_9fa48("49") ? ["Stryker was here"] : (stryCov_9fa48("49"), []),
  setComponentNodes: stryMutAct_9fa48("50") ? () => undefined : (stryCov_9fa48("50"), nodes => set(stryMutAct_9fa48("51") ? {} : (stryCov_9fa48("51"), {
    componentNodes: nodes
  }))),
  clearComponentCanvas: () => {
    if (stryMutAct_9fa48("52")) {
      {}
    } else {
      stryCov_9fa48("52");
      const nodes = get().componentNodes;
      if (stryMutAct_9fa48("55") ? nodes.length !== 0 : stryMutAct_9fa48("54") ? false : stryMutAct_9fa48("53") ? true : (stryCov_9fa48("53", "54", "55"), nodes.length === 0)) return;
      getHistoryStore().recordSnapshot(stryMutAct_9fa48("56") ? "" : (stryCov_9fa48("56"), 'component'), nodes);
      set(stryMutAct_9fa48("57") ? {} : (stryCov_9fa48("57"), {
        componentNodes: stryMutAct_9fa48("58") ? ["Stryker was here"] : (stryCov_9fa48("58"), [])
      }));
    }
  },
  addComponentNode: data => {
    if (stryMutAct_9fa48("59")) {
      {}
    } else {
      stryCov_9fa48("59");
      const newNode: ComponentNode = stryMutAct_9fa48("60") ? {} : (stryCov_9fa48("60"), {
        ...data,
        nodeId: generateId(),
        status: stryMutAct_9fa48("61") ? "" : (stryCov_9fa48("61"), 'pending'),
        isActive: stryMutAct_9fa48("62") ? true : (stryCov_9fa48("62"), false),
        children: stryMutAct_9fa48("63") ? ["Stryker was here"] : (stryCov_9fa48("63"), [])
      });
      set(s => {
        if (stryMutAct_9fa48("64")) {
          {}
        } else {
          stryCov_9fa48("64");
          const newNodes = stryMutAct_9fa48("65") ? [] : (stryCov_9fa48("65"), [...s.componentNodes, newNode]);
          return stryMutAct_9fa48("66") ? {} : (stryCov_9fa48("66"), {
            componentNodes: newNodes
          });
        }
      });
      postContextActionMessage(stryMutAct_9fa48("67") ? `` : (stryCov_9fa48("67"), `添加了组件节点`), data.name);
    }
  },
  editComponentNode: (nodeId, data) => {
    if (stryMutAct_9fa48("68")) {
      {}
    } else {
      stryCov_9fa48("68");
      set(stryMutAct_9fa48("69") ? () => undefined : (stryCov_9fa48("69"), s => stryMutAct_9fa48("70") ? {} : (stryCov_9fa48("70"), {
        componentNodes: s.componentNodes.map(stryMutAct_9fa48("71") ? () => undefined : (stryCov_9fa48("71"), n => (stryMutAct_9fa48("74") ? n.nodeId !== nodeId : stryMutAct_9fa48("73") ? false : stryMutAct_9fa48("72") ? true : (stryCov_9fa48("72", "73", "74"), n.nodeId === nodeId)) ? stryMutAct_9fa48("75") ? {} : (stryCov_9fa48("75"), {
          ...n,
          ...data,
          status: 'pending' as const
        }) : n))
      })));
    }
  },
  deleteComponentNode: nodeId => {
    if (stryMutAct_9fa48("76")) {
      {}
    } else {
      stryCov_9fa48("76");
      const nodeToDelete = get().componentNodes.find(stryMutAct_9fa48("77") ? () => undefined : (stryCov_9fa48("77"), n => stryMutAct_9fa48("80") ? n.nodeId !== nodeId : stryMutAct_9fa48("79") ? false : stryMutAct_9fa48("78") ? true : (stryCov_9fa48("78", "79", "80"), n.nodeId === nodeId)));
      const deletedName = stryMutAct_9fa48("81") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("81"), (stryMutAct_9fa48("82") ? nodeToDelete.name : (stryCov_9fa48("82"), nodeToDelete?.name)) ?? nodeId);
      set(stryMutAct_9fa48("83") ? () => undefined : (stryCov_9fa48("83"), s => stryMutAct_9fa48("84") ? {} : (stryCov_9fa48("84"), {
        componentNodes: stryMutAct_9fa48("85") ? s.componentNodes : (stryCov_9fa48("85"), s.componentNodes.filter(stryMutAct_9fa48("86") ? () => undefined : (stryCov_9fa48("86"), n => stryMutAct_9fa48("89") ? n.nodeId === nodeId : stryMutAct_9fa48("88") ? false : stryMutAct_9fa48("87") ? true : (stryCov_9fa48("87", "88", "89"), n.nodeId !== nodeId))))
      })));
      postContextActionMessage(stryMutAct_9fa48("90") ? `` : (stryCov_9fa48("90"), `删除了组件节点`), deletedName);
    }
  },
  setComponentDraft: stryMutAct_9fa48("91") ? () => undefined : (stryCov_9fa48("91"), draft => set(stryMutAct_9fa48("92") ? {} : (stryCov_9fa48("92"), {
    componentDraft: draft
  }))),
  // Multi-select
  toggleNodeSelect: nodeId => {
    if (stryMutAct_9fa48("93")) {
      {}
    } else {
      stryCov_9fa48("93");
      set(s => {
        if (stryMutAct_9fa48("94")) {
          {}
        } else {
          stryCov_9fa48("94");
          const exists = s.selectedNodeIds.includes(nodeId);
          return stryMutAct_9fa48("95") ? {} : (stryCov_9fa48("95"), {
            selectedNodeIds: exists ? stryMutAct_9fa48("96") ? s.selectedNodeIds : (stryCov_9fa48("96"), s.selectedNodeIds.filter(stryMutAct_9fa48("97") ? () => undefined : (stryCov_9fa48("97"), id => stryMutAct_9fa48("100") ? id === nodeId : stryMutAct_9fa48("99") ? false : stryMutAct_9fa48("98") ? true : (stryCov_9fa48("98", "99", "100"), id !== nodeId)))) : stryMutAct_9fa48("101") ? [] : (stryCov_9fa48("101"), [...s.selectedNodeIds, nodeId])
          });
        }
      });
    }
  },
  selectNode: stryMutAct_9fa48("102") ? () => undefined : (stryCov_9fa48("102"), nodeId => set(stryMutAct_9fa48("103") ? {} : (stryCov_9fa48("103"), {
    selectedNodeIds: stryMutAct_9fa48("104") ? [] : (stryCov_9fa48("104"), [nodeId])
  }))),
  clearNodeSelection: stryMutAct_9fa48("105") ? () => undefined : (stryCov_9fa48("105"), () => set(stryMutAct_9fa48("106") ? {} : (stryCov_9fa48("106"), {
    selectedNodeIds: stryMutAct_9fa48("107") ? ["Stryker was here"] : (stryCov_9fa48("107"), [])
  }))),
  selectAllNodes: stryMutAct_9fa48("108") ? () => undefined : (stryCov_9fa48("108"), () => set(stryMutAct_9fa48("109") ? () => undefined : (stryCov_9fa48("109"), s => stryMutAct_9fa48("110") ? {} : (stryCov_9fa48("110"), {
    selectedNodeIds: s.componentNodes.map(stryMutAct_9fa48("111") ? () => undefined : (stryCov_9fa48("111"), n => n.nodeId))
  })))),
  deleteSelectedNodes: () => {
    if (stryMutAct_9fa48("112")) {
      {}
    } else {
      stryCov_9fa48("112");
      const {
        selectedNodeIds,
        componentNodes
      } = get();
      if (stryMutAct_9fa48("115") ? selectedNodeIds.length !== 0 : stryMutAct_9fa48("114") ? false : stryMutAct_9fa48("113") ? true : (stryCov_9fa48("113", "114", "115"), selectedNodeIds.length === 0)) return;
      const toDelete = new Set(selectedNodeIds);
      set(stryMutAct_9fa48("116") ? {} : (stryCov_9fa48("116"), {
        componentNodes: stryMutAct_9fa48("117") ? componentNodes : (stryCov_9fa48("117"), componentNodes.filter(stryMutAct_9fa48("118") ? () => undefined : (stryCov_9fa48("118"), n => stryMutAct_9fa48("119") ? toDelete.has(n.nodeId) : (stryCov_9fa48("119"), !toDelete.has(n.nodeId))))),
        selectedNodeIds: stryMutAct_9fa48("120") ? ["Stryker was here"] : (stryCov_9fa48("120"), [])
      }));
    }
  },
  // === Manual Component Generation (Epic 4) ===
  generateComponentFromFlow: async () => {
    if (stryMutAct_9fa48("121")) {
      {}
    } else {
      stryCov_9fa48("121");
      // Import from other stores to avoid circular deps
      const {
        useContextStore
      } = require('./contextStore');
      const {
        useFlowStore
      } = require('./flowStore');
      const {
        useSessionStore
      } = require('./sessionStore');
      const contextNodes = useContextStore.getState().contextNodes;
      const flowNodes = useFlowStore.getState().flowNodes;
      if (stryMutAct_9fa48("124") ? flowNodes.length !== 0 : stryMutAct_9fa48("123") ? false : stryMutAct_9fa48("122") ? true : (stryCov_9fa48("122", "123", "124"), flowNodes.length === 0)) {
        if (stryMutAct_9fa48("125")) {
          {}
        } else {
          stryCov_9fa48("125");
          console.warn(stryMutAct_9fa48("126") ? "" : (stryCov_9fa48("126"), '[componentStore] generateComponentFromFlow: no flow nodes'));
          return;
        }
      }
      try {
        if (stryMutAct_9fa48("127")) {
          {}
        } else {
          stryCov_9fa48("127");
          // E2: Only send confirmed nodes to the API
          const confirmedContexts = stryMutAct_9fa48("128") ? contextNodes : (stryCov_9fa48("128"), contextNodes.filter(stryMutAct_9fa48("129") ? () => undefined : (stryCov_9fa48("129"), (ctx: any) => stryMutAct_9fa48("132") ? ctx.status !== 'confirmed' : stryMutAct_9fa48("131") ? false : stryMutAct_9fa48("130") ? true : (stryCov_9fa48("130", "131", "132"), ctx.status === (stryMutAct_9fa48("133") ? "" : (stryCov_9fa48("133"), 'confirmed'))))));
          const confirmedFlows = stryMutAct_9fa48("134") ? flowNodes : (stryCov_9fa48("134"), flowNodes.filter(stryMutAct_9fa48("135") ? () => undefined : (stryCov_9fa48("135"), (f: any) => stryMutAct_9fa48("138") ? f.status !== 'confirmed' : stryMutAct_9fa48("137") ? false : stryMutAct_9fa48("136") ? true : (stryCov_9fa48("136", "137", "138"), f.status === (stryMutAct_9fa48("139") ? "" : (stryCov_9fa48("139"), 'confirmed'))))));
          const mappedContexts = confirmedContexts.map(stryMutAct_9fa48("140") ? () => undefined : (stryCov_9fa48("140"), (ctx: any) => stryMutAct_9fa48("141") ? {} : (stryCov_9fa48("141"), {
            id: ctx.nodeId,
            name: ctx.name,
            description: stryMutAct_9fa48("142") ? ctx.description && '' : (stryCov_9fa48("142"), ctx.description ?? (stryMutAct_9fa48("143") ? "Stryker was here!" : (stryCov_9fa48("143"), ''))),
            type: ctx.type
          })));
          const mappedFlows = confirmedFlows.map(stryMutAct_9fa48("144") ? () => undefined : (stryCov_9fa48("144"), (f: any) => stryMutAct_9fa48("145") ? {} : (stryCov_9fa48("145"), {
            name: f.name,
            contextId: f.contextId,
            steps: f.steps.map(stryMutAct_9fa48("146") ? () => undefined : (stryCov_9fa48("146"), (s: any) => stryMutAct_9fa48("147") ? {} : (stryCov_9fa48("147"), {
              name: s.name,
              actor: s.actor
            })))
          })));
          const {
            projectId
          } = useSessionStore.getState();
          const sessionId = stryMutAct_9fa48("148") ? projectId && `session-${Date.now()}` : (stryCov_9fa48("148"), projectId ?? (stryMutAct_9fa48("149") ? `` : (stryCov_9fa48("149"), `session-${Date.now()}`)));
          const result = await canvasApi.generateComponents(stryMutAct_9fa48("150") ? {} : (stryCov_9fa48("150"), {
            contexts: mappedContexts,
            flows: mappedFlows,
            sessionId
          }));
          if (stryMutAct_9fa48("153") ? result.success || result.components : stryMutAct_9fa48("152") ? false : stryMutAct_9fa48("151") ? true : (stryCov_9fa48("151", "152", "153"), result.success && result.components)) {
            if (stryMutAct_9fa48("154")) {
              {}
            } else {
              stryCov_9fa48("154");
              const validTypes = ['page', 'form', 'list', 'detail', 'modal'] as const;
              const validMethods = ['GET', 'POST'] as const;
              const newNodes: ComponentNode[] = result.components.map((c: any) => {
                if (stryMutAct_9fa48("155")) {
                  {}
                } else {
                  stryCov_9fa48("155");
                  const type = (stryMutAct_9fa48("158") ? c.type || validTypes.includes(c.type as typeof validTypes[number]) : stryMutAct_9fa48("157") ? false : stryMutAct_9fa48("156") ? true : (stryCov_9fa48("156", "157", "158"), c.type && validTypes.includes(c.type as typeof validTypes[number]))) ? c.type as ComponentNode['type'] : stryMutAct_9fa48("159") ? "" : (stryCov_9fa48("159"), 'page');
                  const method = (stryMutAct_9fa48("162") ? c.api?.method || validMethods.includes(c.api.method as typeof validMethods[number]) : stryMutAct_9fa48("161") ? false : stryMutAct_9fa48("160") ? true : (stryCov_9fa48("160", "161", "162"), (stryMutAct_9fa48("163") ? c.api.method : (stryCov_9fa48("163"), c.api?.method)) && validMethods.includes(c.api.method as typeof validMethods[number]))) ? c.api.method : stryMutAct_9fa48("164") ? "" : (stryCov_9fa48("164"), 'GET');
                  const flowId = (stryMutAct_9fa48("167") ? c.flowId || c.flowId !== 'unknown' : stryMutAct_9fa48("166") ? false : stryMutAct_9fa48("165") ? true : (stryCov_9fa48("165", "166", "167"), c.flowId && (stryMutAct_9fa48("169") ? c.flowId === 'unknown' : stryMutAct_9fa48("168") ? true : (stryCov_9fa48("168", "169"), c.flowId !== (stryMutAct_9fa48("170") ? "" : (stryCov_9fa48("170"), 'unknown')))))) ? c.flowId : stryMutAct_9fa48("171") ? "Stryker was here!" : (stryCov_9fa48("171"), '');
                  return {
                    nodeId: generateId(),
                    flowId,
                    name: c.name ?? '未命名组件',
                    type,
                    props: {},
                    api: {
                      method,
                      path: c.api?.path ?? '/api/' + (c.name ?? 'component').toLowerCase(),
                      params: c.api?.params ?? []
                    },
                    status: 'pending' as const,
                    children: []
                  } as ComponentNode;
                }
              });
              get().setComponentNodes(newNodes);
              useContextStore.getState().setPhase(stryMutAct_9fa48("172") ? "" : (stryCov_9fa48("172"), 'component'));
              postContextActionMessage(stryMutAct_9fa48("173") ? `` : (stryCov_9fa48("173"), `生成了 ${newNodes.length} 个组件节点`));
            }
          } else {
            if (stryMutAct_9fa48("174")) {
              {}
            } else {
              stryCov_9fa48("174");
              console.error(stryMutAct_9fa48("175") ? "" : (stryCov_9fa48("175"), '[componentStore] generateComponentFromFlow: no components'), result.error);
            }
          }
        }
      } catch (err) {
        if (stryMutAct_9fa48("176")) {
          {}
        } else {
          stryCov_9fa48("176");
          console.error(stryMutAct_9fa48("177") ? "" : (stryCov_9fa48("177"), '[componentStore] generateComponentFromFlow error:'), err);
          throw err;
        }
      }
    }
  }
})), stryMutAct_9fa48("178") ? {} : (stryCov_9fa48("178"), {
  name: stryMutAct_9fa48("179") ? "" : (stryCov_9fa48("179"), 'vibex-component-store'),
  partialize: stryMutAct_9fa48("180") ? () => undefined : (stryCov_9fa48("180"), state => stryMutAct_9fa48("181") ? {} : (stryCov_9fa48("181"), {
    componentNodes: state.componentNodes
  }))
})), stryMutAct_9fa48("182") ? {} : (stryCov_9fa48("182"), {
  name: stryMutAct_9fa48("183") ? "" : (stryCov_9fa48("183"), 'ComponentStore')
})));