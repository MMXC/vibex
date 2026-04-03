/**
 * VibeX Context Store — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 1 slice extraction.
 *
 * Responsibilities:
 * - BoundedContextNode CRUD operations
 * - Context draft state
 * - History recording on mutations
 * - User action messages via canvasStore.addMessage
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
import type { BoundedContextNode, BoundedContextDraft, Phase, TreeType } from '../types';
import { getHistoryStore } from '../historySlice';
import { postContextActionMessage } from './messageBridge';
function generateId(): string {
  if (stryMutAct_9fa48("0")) {
    {}
  } else {
    stryCov_9fa48("0");
    return stryMutAct_9fa48("1") ? `` : (stryCov_9fa48("1"), `${Date.now()}-${stryMutAct_9fa48("2") ? Math.random().toString(36) : (stryCov_9fa48("2"), Math.random().toString(36).slice(2, 9))}`);
  }
}
interface SelectedNodeIds {
  context: string[];
  flow: string[];
}
interface ContextStore {
  // Phase state
  phase: Phase;
  setPhase: (phase: Phase) => void;
  // Active tree
  activeTree: TreeType | null;
  setActiveTree: (tree: TreeType | null) => void;
  recomputeActiveTree: () => void;
  // Multi-select
  selectedNodeIds: SelectedNodeIds;
  selectAllNodes: (tree: TreeType) => void;
  clearNodeSelection: (tree: TreeType) => void;
  deleteSelectedNodes: (tree: TreeType) => void;
  // Context nodes
  contextNodes: BoundedContextNode[];
  contextDraft: Partial<BoundedContextNode> | null;
  setContextNodes: (nodes: BoundedContextNode[]) => void;
  addContextNode: (data: BoundedContextDraft) => void;
  editContextNode: (nodeId: string, data: Partial<BoundedContextNode>) => void;
  deleteContextNode: (nodeId: string) => void;
  confirmContextNode: (nodeId: string) => void;
  toggleContextSelection: (nodeId: string) => void;
  setContextDraft: (draft: Partial<BoundedContextNode> | null) => void;
}
export const useContextStore = create<ContextStore>()(devtools(persist(stryMutAct_9fa48("3") ? () => undefined : (stryCov_9fa48("3"), (set, get) => stryMutAct_9fa48("4") ? {} : (stryCov_9fa48("4"), {
  // E3 S3.1: Phase state — drives the PhaseIndicator component
  phase: stryMutAct_9fa48("5") ? "" : (stryCov_9fa48("5"), 'input'),
  setPhase: stryMutAct_9fa48("6") ? () => undefined : (stryCov_9fa48("6"), phase => set(stryMutAct_9fa48("7") ? {} : (stryCov_9fa48("7"), {
    phase
  }))),
  // E3 S3.1: Active tree
  activeTree: null,
  setActiveTree: stryMutAct_9fa48("8") ? () => undefined : (stryCov_9fa48("8"), tree => set(stryMutAct_9fa48("9") ? {} : (stryCov_9fa48("9"), {
    activeTree: tree
  }))),
  recomputeActiveTree: () => {
    if (stryMutAct_9fa48("10")) {
      {}
    } else {
      stryCov_9fa48("10");
      const ctxs = stryMutAct_9fa48("11") ? get().contextNodes : (stryCov_9fa48("11"), get().contextNodes.filter(stryMutAct_9fa48("12") ? () => undefined : (stryCov_9fa48("12"), n => stryMutAct_9fa48("15") ? n.isActive === false : stryMutAct_9fa48("14") ? false : stryMutAct_9fa48("13") ? true : (stryCov_9fa48("13", "14", "15"), n.isActive !== (stryMutAct_9fa48("16") ? true : (stryCov_9fa48("16"), false))))));
      const flows = stryMutAct_9fa48("17") ? ["Stryker was here"] : (stryCov_9fa48("17"), []); // accessed via flowStore
      const currentTree = get().activeTree;
      if (stryMutAct_9fa48("20") ? !currentTree || ctxs.length > 0 : stryMutAct_9fa48("19") ? false : stryMutAct_9fa48("18") ? true : (stryCov_9fa48("18", "19", "20"), (stryMutAct_9fa48("21") ? currentTree : (stryCov_9fa48("21"), !currentTree)) && (stryMutAct_9fa48("24") ? ctxs.length <= 0 : stryMutAct_9fa48("23") ? ctxs.length >= 0 : stryMutAct_9fa48("22") ? true : (stryCov_9fa48("22", "23", "24"), ctxs.length > 0)))) set(stryMutAct_9fa48("25") ? {} : (stryCov_9fa48("25"), {
        activeTree: stryMutAct_9fa48("26") ? "" : (stryCov_9fa48("26"), 'context')
      }));
    }
  },
  // E3 S3.1: Multi-select
  selectedNodeIds: stryMutAct_9fa48("27") ? {} : (stryCov_9fa48("27"), {
    context: stryMutAct_9fa48("28") ? ["Stryker was here"] : (stryCov_9fa48("28"), []),
    flow: stryMutAct_9fa48("29") ? ["Stryker was here"] : (stryCov_9fa48("29"), [])
  }),
  selectAllNodes: stryMutAct_9fa48("30") ? () => undefined : (stryCov_9fa48("30"), tree => set(s => {
    if (stryMutAct_9fa48("31")) {
      {}
    } else {
      stryCov_9fa48("31");
      if (stryMutAct_9fa48("34") ? tree !== 'context' : stryMutAct_9fa48("33") ? false : stryMutAct_9fa48("32") ? true : (stryCov_9fa48("32", "33", "34"), tree === (stryMutAct_9fa48("35") ? "" : (stryCov_9fa48("35"), 'context')))) {
        if (stryMutAct_9fa48("36")) {
          {}
        } else {
          stryCov_9fa48("36");
          return stryMutAct_9fa48("37") ? {} : (stryCov_9fa48("37"), {
            selectedNodeIds: stryMutAct_9fa48("38") ? {} : (stryCov_9fa48("38"), {
              ...s.selectedNodeIds,
              context: s.contextNodes.map(stryMutAct_9fa48("39") ? () => undefined : (stryCov_9fa48("39"), n => n.nodeId))
            })
          });
        }
      }
      return s;
    }
  })),
  clearNodeSelection: stryMutAct_9fa48("40") ? () => undefined : (stryCov_9fa48("40"), tree => set(s => {
    if (stryMutAct_9fa48("41")) {
      {}
    } else {
      stryCov_9fa48("41");
      if (stryMutAct_9fa48("44") ? tree !== 'context' : stryMutAct_9fa48("43") ? false : stryMutAct_9fa48("42") ? true : (stryCov_9fa48("42", "43", "44"), tree === (stryMutAct_9fa48("45") ? "" : (stryCov_9fa48("45"), 'context')))) {
        if (stryMutAct_9fa48("46")) {
          {}
        } else {
          stryCov_9fa48("46");
          return stryMutAct_9fa48("47") ? {} : (stryCov_9fa48("47"), {
            selectedNodeIds: stryMutAct_9fa48("48") ? {} : (stryCov_9fa48("48"), {
              ...s.selectedNodeIds,
              context: stryMutAct_9fa48("49") ? ["Stryker was here"] : (stryCov_9fa48("49"), [])
            })
          });
        }
      }
      return s;
    }
  })),
  deleteSelectedNodes: tree => {
    if (stryMutAct_9fa48("50")) {
      {}
    } else {
      stryCov_9fa48("50");
      const {
        selectedNodeIds,
        contextNodes
      } = get();
      if (stryMutAct_9fa48("53") ? tree === 'context' || selectedNodeIds.context.length > 0 : stryMutAct_9fa48("52") ? false : stryMutAct_9fa48("51") ? true : (stryCov_9fa48("51", "52", "53"), (stryMutAct_9fa48("55") ? tree !== 'context' : stryMutAct_9fa48("54") ? true : (stryCov_9fa48("54", "55"), tree === (stryMutAct_9fa48("56") ? "" : (stryCov_9fa48("56"), 'context')))) && (stryMutAct_9fa48("59") ? selectedNodeIds.context.length <= 0 : stryMutAct_9fa48("58") ? selectedNodeIds.context.length >= 0 : stryMutAct_9fa48("57") ? true : (stryCov_9fa48("57", "58", "59"), selectedNodeIds.context.length > 0)))) {
        if (stryMutAct_9fa48("60")) {
          {}
        } else {
          stryCov_9fa48("60");
          const ids = new Set(selectedNodeIds.context);
          const remaining = stryMutAct_9fa48("61") ? contextNodes : (stryCov_9fa48("61"), contextNodes.filter(stryMutAct_9fa48("62") ? () => undefined : (stryCov_9fa48("62"), n => stryMutAct_9fa48("63") ? ids.has(n.nodeId) : (stryCov_9fa48("63"), !ids.has(n.nodeId)))));
          const newSelected = stryMutAct_9fa48("64") ? {} : (stryCov_9fa48("64"), {
            context: stryMutAct_9fa48("65") ? ["Stryker was here"] : (stryCov_9fa48("65"), []),
            flow: selectedNodeIds.flow
          });
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("66") ? "" : (stryCov_9fa48("66"), 'context'), remaining);
          set(stryMutAct_9fa48("67") ? {} : (stryCov_9fa48("67"), {
            contextNodes: remaining,
            selectedNodeIds: newSelected
          }));
          selectedNodeIds.context.forEach(id => {
            if (stryMutAct_9fa48("68")) {
              {}
            } else {
              stryCov_9fa48("68");
              const node = contextNodes.find(stryMutAct_9fa48("69") ? () => undefined : (stryCov_9fa48("69"), n => stryMutAct_9fa48("72") ? n.nodeId !== id : stryMutAct_9fa48("71") ? false : stryMutAct_9fa48("70") ? true : (stryCov_9fa48("70", "71", "72"), n.nodeId === id)));
              postContextActionMessage(stryMutAct_9fa48("73") ? `` : (stryCov_9fa48("73"), `删除了上下文节点`), stryMutAct_9fa48("74") ? node?.name && id : (stryCov_9fa48("74"), (stryMutAct_9fa48("75") ? node.name : (stryCov_9fa48("75"), node?.name)) ?? id));
            }
          });
        }
      }
    }
  },
  // Existing fields
  contextNodes: stryMutAct_9fa48("76") ? ["Stryker was here"] : (stryCov_9fa48("76"), []),
  contextDraft: null,
  setContextNodes: stryMutAct_9fa48("77") ? () => undefined : (stryCov_9fa48("77"), nodes => set(stryMutAct_9fa48("78") ? {} : (stryCov_9fa48("78"), {
    contextNodes: nodes
  }))),
  addContextNode: data => {
    if (stryMutAct_9fa48("79")) {
      {}
    } else {
      stryCov_9fa48("79");
      const newNode: BoundedContextNode = stryMutAct_9fa48("80") ? {} : (stryCov_9fa48("80"), {
        nodeId: generateId(),
        name: data.name,
        description: data.description,
        type: data.type,
        isActive: stryMutAct_9fa48("81") ? true : (stryCov_9fa48("81"), false),
        status: stryMutAct_9fa48("82") ? "" : (stryCov_9fa48("82"), 'pending'),
        children: stryMutAct_9fa48("83") ? ["Stryker was here"] : (stryCov_9fa48("83"), [])
      });
      set(s => {
        if (stryMutAct_9fa48("84")) {
          {}
        } else {
          stryCov_9fa48("84");
          const newNodes = stryMutAct_9fa48("85") ? [] : (stryCov_9fa48("85"), [...s.contextNodes, stryMutAct_9fa48("86") ? {} : (stryCov_9fa48("86"), {
            ...newNode
          })]);
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("87") ? "" : (stryCov_9fa48("87"), 'context'), newNodes);
          return stryMutAct_9fa48("88") ? {} : (stryCov_9fa48("88"), {
            contextNodes: newNodes
          });
        }
      });
      // Side effect: record user action message
      postContextActionMessage(stryMutAct_9fa48("89") ? `` : (stryCov_9fa48("89"), `添加了上下文节点`), data.name);
    }
  },
  editContextNode: (nodeId, data) => {
    if (stryMutAct_9fa48("90")) {
      {}
    } else {
      stryCov_9fa48("90");
      set(s => {
        if (stryMutAct_9fa48("91")) {
          {}
        } else {
          stryCov_9fa48("91");
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("92") ? () => undefined : (stryCov_9fa48("92"), n => (stryMutAct_9fa48("95") ? n.nodeId !== nodeId : stryMutAct_9fa48("94") ? false : stryMutAct_9fa48("93") ? true : (stryCov_9fa48("93", "94", "95"), n.nodeId === nodeId)) ? stryMutAct_9fa48("96") ? {} : (stryCov_9fa48("96"), {
            ...n,
            ...data,
            status: 'pending' as const
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("97") ? "" : (stryCov_9fa48("97"), 'context'), newNodes);
          return stryMutAct_9fa48("98") ? {} : (stryCov_9fa48("98"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  deleteContextNode: nodeId => {
    if (stryMutAct_9fa48("99")) {
      {}
    } else {
      stryCov_9fa48("99");
      const nodeToDelete = get().contextNodes.find(stryMutAct_9fa48("100") ? () => undefined : (stryCov_9fa48("100"), n => stryMutAct_9fa48("103") ? n.nodeId !== nodeId : stryMutAct_9fa48("102") ? false : stryMutAct_9fa48("101") ? true : (stryCov_9fa48("101", "102", "103"), n.nodeId === nodeId)));
      const deletedName = stryMutAct_9fa48("104") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("104"), (stryMutAct_9fa48("105") ? nodeToDelete.name : (stryCov_9fa48("105"), nodeToDelete?.name)) ?? nodeId);
      set(s => {
        if (stryMutAct_9fa48("106")) {
          {}
        } else {
          stryCov_9fa48("106");
          const newNodes = stryMutAct_9fa48("107") ? s.contextNodes : (stryCov_9fa48("107"), s.contextNodes.filter(stryMutAct_9fa48("108") ? () => undefined : (stryCov_9fa48("108"), n => stryMutAct_9fa48("111") ? n.nodeId === nodeId : stryMutAct_9fa48("110") ? false : stryMutAct_9fa48("109") ? true : (stryCov_9fa48("109", "110", "111"), n.nodeId !== nodeId))));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("112") ? "" : (stryCov_9fa48("112"), 'context'), newNodes);
          return stryMutAct_9fa48("113") ? {} : (stryCov_9fa48("113"), {
            contextNodes: newNodes
          });
        }
      });
      // Side effect: record user action message
      postContextActionMessage(stryMutAct_9fa48("114") ? `` : (stryCov_9fa48("114"), `删除了上下文节点`), deletedName);
    }
  },
  confirmContextNode: nodeId => {
    if (stryMutAct_9fa48("115")) {
      {}
    } else {
      stryCov_9fa48("115");
      set(s => {
        if (stryMutAct_9fa48("116")) {
          {}
        } else {
          stryCov_9fa48("116");
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("117") ? () => undefined : (stryCov_9fa48("117"), n => (stryMutAct_9fa48("120") ? n.nodeId !== nodeId : stryMutAct_9fa48("119") ? false : stryMutAct_9fa48("118") ? true : (stryCov_9fa48("118", "119", "120"), n.nodeId === nodeId)) ? stryMutAct_9fa48("121") ? {} : (stryCov_9fa48("121"), {
            ...n,
            isActive: stryMutAct_9fa48("122") ? false : (stryCov_9fa48("122"), true),
            status: 'confirmed' as const
          }) : n));
          return stryMutAct_9fa48("123") ? {} : (stryCov_9fa48("123"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  toggleContextSelection: stryMutAct_9fa48("124") ? () => undefined : (stryCov_9fa48("124"), nodeId => set(stryMutAct_9fa48("125") ? () => undefined : (stryCov_9fa48("125"), state => stryMutAct_9fa48("126") ? {} : (stryCov_9fa48("126"), {
    contextNodes: state.contextNodes.map(stryMutAct_9fa48("127") ? () => undefined : (stryCov_9fa48("127"), node => (stryMutAct_9fa48("130") ? node.nodeId !== nodeId : stryMutAct_9fa48("129") ? false : stryMutAct_9fa48("128") ? true : (stryCov_9fa48("128", "129", "130"), node.nodeId === nodeId)) ? stryMutAct_9fa48("131") ? {} : (stryCov_9fa48("131"), {
      ...node,
      selected: stryMutAct_9fa48("132") ? node.selected : (stryCov_9fa48("132"), !node.selected)
    }) : node))
  })))),
  setContextDraft: stryMutAct_9fa48("133") ? () => undefined : (stryCov_9fa48("133"), draft => set(stryMutAct_9fa48("134") ? {} : (stryCov_9fa48("134"), {
    contextDraft: draft
  })))
})), stryMutAct_9fa48("135") ? {} : (stryCov_9fa48("135"), {
  name: stryMutAct_9fa48("136") ? "" : (stryCov_9fa48("136"), 'vibex-context-store')
})), stryMutAct_9fa48("137") ? {} : (stryCov_9fa48("137"), {
  name: stryMutAct_9fa48("138") ? "" : (stryCov_9fa48("138"), 'ContextStore')
})));