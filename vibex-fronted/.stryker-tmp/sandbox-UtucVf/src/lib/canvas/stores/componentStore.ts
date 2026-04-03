/**
 * VibeX componentStore — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 4 slice extraction.
 *
 * Responsibilities:
 * - ComponentNode state (componentNodes, componentDraft)
 * - CRUD operations on component nodes
 * - Multi-select for component tree
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
function generateId(): string {
  if (stryMutAct_9fa48("957")) {
    {}
  } else {
    stryCov_9fa48("957");
    return stryMutAct_9fa48("958") ? `` : (stryCov_9fa48("958"), `${Date.now()}-${stryMutAct_9fa48("959") ? Math.random().toString(36) : (stryCov_9fa48("959"), Math.random().toString(36).slice(2, 9))}`);
  }
}
interface ComponentStore {
  // State
  componentNodes: ComponentNode[];
  componentDraft: Partial<ComponentNode> | null;
  selectedNodeIds: string[];

  // Node CRUD
  setComponentNodes: (nodes: ComponentNode[]) => void;
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
}
export const useComponentStore = create<ComponentStore>()(devtools(persist(stryMutAct_9fa48("960") ? () => undefined : (stryCov_9fa48("960"), (set, get) => stryMutAct_9fa48("961") ? {} : (stryCov_9fa48("961"), {
  // State
  componentNodes: stryMutAct_9fa48("962") ? ["Stryker was here"] : (stryCov_9fa48("962"), []),
  componentDraft: null,
  selectedNodeIds: stryMutAct_9fa48("963") ? ["Stryker was here"] : (stryCov_9fa48("963"), []),
  setComponentNodes: stryMutAct_9fa48("964") ? () => undefined : (stryCov_9fa48("964"), nodes => set(stryMutAct_9fa48("965") ? {} : (stryCov_9fa48("965"), {
    componentNodes: nodes
  }))),
  addComponentNode: data => {
    if (stryMutAct_9fa48("966")) {
      {}
    } else {
      stryCov_9fa48("966");
      const newNode: ComponentNode = stryMutAct_9fa48("967") ? {} : (stryCov_9fa48("967"), {
        ...data,
        nodeId: generateId(),
        status: stryMutAct_9fa48("968") ? "" : (stryCov_9fa48("968"), 'pending'),
        isActive: stryMutAct_9fa48("969") ? true : (stryCov_9fa48("969"), false),
        children: stryMutAct_9fa48("970") ? ["Stryker was here"] : (stryCov_9fa48("970"), [])
      });
      set(s => {
        if (stryMutAct_9fa48("971")) {
          {}
        } else {
          stryCov_9fa48("971");
          const newNodes = stryMutAct_9fa48("972") ? [] : (stryCov_9fa48("972"), [...s.componentNodes, newNode]);
          return stryMutAct_9fa48("973") ? {} : (stryCov_9fa48("973"), {
            componentNodes: newNodes
          });
        }
      });
    }
  },
  editComponentNode: (nodeId, data) => {
    if (stryMutAct_9fa48("974")) {
      {}
    } else {
      stryCov_9fa48("974");
      set(stryMutAct_9fa48("975") ? () => undefined : (stryCov_9fa48("975"), s => stryMutAct_9fa48("976") ? {} : (stryCov_9fa48("976"), {
        componentNodes: s.componentNodes.map(stryMutAct_9fa48("977") ? () => undefined : (stryCov_9fa48("977"), n => (stryMutAct_9fa48("980") ? n.nodeId !== nodeId : stryMutAct_9fa48("979") ? false : stryMutAct_9fa48("978") ? true : (stryCov_9fa48("978", "979", "980"), n.nodeId === nodeId)) ? stryMutAct_9fa48("981") ? {} : (stryCov_9fa48("981"), {
          ...n,
          ...data,
          status: 'pending' as const
        }) : n))
      })));
    }
  },
  deleteComponentNode: nodeId => {
    if (stryMutAct_9fa48("982")) {
      {}
    } else {
      stryCov_9fa48("982");
      set(stryMutAct_9fa48("983") ? () => undefined : (stryCov_9fa48("983"), s => stryMutAct_9fa48("984") ? {} : (stryCov_9fa48("984"), {
        componentNodes: stryMutAct_9fa48("985") ? s.componentNodes : (stryCov_9fa48("985"), s.componentNodes.filter(stryMutAct_9fa48("986") ? () => undefined : (stryCov_9fa48("986"), n => stryMutAct_9fa48("989") ? n.nodeId === nodeId : stryMutAct_9fa48("988") ? false : stryMutAct_9fa48("987") ? true : (stryCov_9fa48("987", "988", "989"), n.nodeId !== nodeId))))
      })));
    }
  },
  setComponentDraft: stryMutAct_9fa48("990") ? () => undefined : (stryCov_9fa48("990"), draft => set(stryMutAct_9fa48("991") ? {} : (stryCov_9fa48("991"), {
    componentDraft: draft
  }))),
  // Multi-select
  toggleNodeSelect: nodeId => {
    if (stryMutAct_9fa48("992")) {
      {}
    } else {
      stryCov_9fa48("992");
      set(s => {
        if (stryMutAct_9fa48("993")) {
          {}
        } else {
          stryCov_9fa48("993");
          const exists = s.selectedNodeIds.includes(nodeId);
          return stryMutAct_9fa48("994") ? {} : (stryCov_9fa48("994"), {
            selectedNodeIds: exists ? stryMutAct_9fa48("995") ? s.selectedNodeIds : (stryCov_9fa48("995"), s.selectedNodeIds.filter(stryMutAct_9fa48("996") ? () => undefined : (stryCov_9fa48("996"), id => stryMutAct_9fa48("999") ? id === nodeId : stryMutAct_9fa48("998") ? false : stryMutAct_9fa48("997") ? true : (stryCov_9fa48("997", "998", "999"), id !== nodeId)))) : stryMutAct_9fa48("1000") ? [] : (stryCov_9fa48("1000"), [...s.selectedNodeIds, nodeId])
          });
        }
      });
    }
  },
  selectNode: stryMutAct_9fa48("1001") ? () => undefined : (stryCov_9fa48("1001"), nodeId => set(stryMutAct_9fa48("1002") ? {} : (stryCov_9fa48("1002"), {
    selectedNodeIds: stryMutAct_9fa48("1003") ? [] : (stryCov_9fa48("1003"), [nodeId])
  }))),
  clearNodeSelection: stryMutAct_9fa48("1004") ? () => undefined : (stryCov_9fa48("1004"), () => set(stryMutAct_9fa48("1005") ? {} : (stryCov_9fa48("1005"), {
    selectedNodeIds: stryMutAct_9fa48("1006") ? ["Stryker was here"] : (stryCov_9fa48("1006"), [])
  }))),
  selectAllNodes: stryMutAct_9fa48("1007") ? () => undefined : (stryCov_9fa48("1007"), () => set(stryMutAct_9fa48("1008") ? () => undefined : (stryCov_9fa48("1008"), s => stryMutAct_9fa48("1009") ? {} : (stryCov_9fa48("1009"), {
    selectedNodeIds: s.componentNodes.map(stryMutAct_9fa48("1010") ? () => undefined : (stryCov_9fa48("1010"), n => n.nodeId))
  })))),
  deleteSelectedNodes: () => {
    if (stryMutAct_9fa48("1011")) {
      {}
    } else {
      stryCov_9fa48("1011");
      const {
        selectedNodeIds,
        componentNodes
      } = get();
      if (stryMutAct_9fa48("1014") ? selectedNodeIds.length !== 0 : stryMutAct_9fa48("1013") ? false : stryMutAct_9fa48("1012") ? true : (stryCov_9fa48("1012", "1013", "1014"), selectedNodeIds.length === 0)) return;
      const toDelete = new Set(selectedNodeIds);
      set(stryMutAct_9fa48("1015") ? {} : (stryCov_9fa48("1015"), {
        componentNodes: stryMutAct_9fa48("1016") ? componentNodes : (stryCov_9fa48("1016"), componentNodes.filter(stryMutAct_9fa48("1017") ? () => undefined : (stryCov_9fa48("1017"), n => stryMutAct_9fa48("1018") ? toDelete.has(n.nodeId) : (stryCov_9fa48("1018"), !toDelete.has(n.nodeId))))),
        selectedNodeIds: stryMutAct_9fa48("1019") ? ["Stryker was here"] : (stryCov_9fa48("1019"), [])
      }));
    }
  }
})), stryMutAct_9fa48("1020") ? {} : (stryCov_9fa48("1020"), {
  name: stryMutAct_9fa48("1021") ? "" : (stryCov_9fa48("1021"), 'vibex-component-store')
})), stryMutAct_9fa48("1022") ? {} : (stryCov_9fa48("1022"), {
  name: stryMutAct_9fa48("1023") ? "" : (stryCov_9fa48("1023"), 'ComponentStore')
})));