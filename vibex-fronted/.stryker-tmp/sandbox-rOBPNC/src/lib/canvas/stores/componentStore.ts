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
  if (stryMutAct_9fa48("992")) {
    {}
  } else {
    stryCov_9fa48("992");
    return stryMutAct_9fa48("993") ? `` : (stryCov_9fa48("993"), `${Date.now()}-${stryMutAct_9fa48("994") ? Math.random().toString(36) : (stryCov_9fa48("994"), Math.random().toString(36).slice(2, 9))}`);
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
export const useComponentStore = create<ComponentStore>()(devtools(persist(stryMutAct_9fa48("995") ? () => undefined : (stryCov_9fa48("995"), (set, get) => stryMutAct_9fa48("996") ? {} : (stryCov_9fa48("996"), {
  // State
  componentNodes: stryMutAct_9fa48("997") ? ["Stryker was here"] : (stryCov_9fa48("997"), []),
  componentDraft: null,
  selectedNodeIds: stryMutAct_9fa48("998") ? ["Stryker was here"] : (stryCov_9fa48("998"), []),
  setComponentNodes: stryMutAct_9fa48("999") ? () => undefined : (stryCov_9fa48("999"), nodes => set(stryMutAct_9fa48("1000") ? {} : (stryCov_9fa48("1000"), {
    componentNodes: nodes
  }))),
  addComponentNode: data => {
    if (stryMutAct_9fa48("1001")) {
      {}
    } else {
      stryCov_9fa48("1001");
      const newNode: ComponentNode = stryMutAct_9fa48("1002") ? {} : (stryCov_9fa48("1002"), {
        ...data,
        nodeId: generateId(),
        status: stryMutAct_9fa48("1003") ? "" : (stryCov_9fa48("1003"), 'pending'),
        isActive: stryMutAct_9fa48("1004") ? true : (stryCov_9fa48("1004"), false),
        children: stryMutAct_9fa48("1005") ? ["Stryker was here"] : (stryCov_9fa48("1005"), [])
      });
      set(s => {
        if (stryMutAct_9fa48("1006")) {
          {}
        } else {
          stryCov_9fa48("1006");
          const newNodes = stryMutAct_9fa48("1007") ? [] : (stryCov_9fa48("1007"), [...s.componentNodes, newNode]);
          return stryMutAct_9fa48("1008") ? {} : (stryCov_9fa48("1008"), {
            componentNodes: newNodes
          });
        }
      });
    }
  },
  editComponentNode: (nodeId, data) => {
    if (stryMutAct_9fa48("1009")) {
      {}
    } else {
      stryCov_9fa48("1009");
      set(stryMutAct_9fa48("1010") ? () => undefined : (stryCov_9fa48("1010"), s => stryMutAct_9fa48("1011") ? {} : (stryCov_9fa48("1011"), {
        componentNodes: s.componentNodes.map(stryMutAct_9fa48("1012") ? () => undefined : (stryCov_9fa48("1012"), n => (stryMutAct_9fa48("1015") ? n.nodeId !== nodeId : stryMutAct_9fa48("1014") ? false : stryMutAct_9fa48("1013") ? true : (stryCov_9fa48("1013", "1014", "1015"), n.nodeId === nodeId)) ? stryMutAct_9fa48("1016") ? {} : (stryCov_9fa48("1016"), {
          ...n,
          ...data,
          status: 'pending' as const
        }) : n))
      })));
    }
  },
  deleteComponentNode: nodeId => {
    if (stryMutAct_9fa48("1017")) {
      {}
    } else {
      stryCov_9fa48("1017");
      set(stryMutAct_9fa48("1018") ? () => undefined : (stryCov_9fa48("1018"), s => stryMutAct_9fa48("1019") ? {} : (stryCov_9fa48("1019"), {
        componentNodes: stryMutAct_9fa48("1020") ? s.componentNodes : (stryCov_9fa48("1020"), s.componentNodes.filter(stryMutAct_9fa48("1021") ? () => undefined : (stryCov_9fa48("1021"), n => stryMutAct_9fa48("1024") ? n.nodeId === nodeId : stryMutAct_9fa48("1023") ? false : stryMutAct_9fa48("1022") ? true : (stryCov_9fa48("1022", "1023", "1024"), n.nodeId !== nodeId))))
      })));
    }
  },
  setComponentDraft: stryMutAct_9fa48("1025") ? () => undefined : (stryCov_9fa48("1025"), draft => set(stryMutAct_9fa48("1026") ? {} : (stryCov_9fa48("1026"), {
    componentDraft: draft
  }))),
  // Multi-select
  toggleNodeSelect: nodeId => {
    if (stryMutAct_9fa48("1027")) {
      {}
    } else {
      stryCov_9fa48("1027");
      set(s => {
        if (stryMutAct_9fa48("1028")) {
          {}
        } else {
          stryCov_9fa48("1028");
          const exists = s.selectedNodeIds.includes(nodeId);
          return stryMutAct_9fa48("1029") ? {} : (stryCov_9fa48("1029"), {
            selectedNodeIds: exists ? stryMutAct_9fa48("1030") ? s.selectedNodeIds : (stryCov_9fa48("1030"), s.selectedNodeIds.filter(stryMutAct_9fa48("1031") ? () => undefined : (stryCov_9fa48("1031"), id => stryMutAct_9fa48("1034") ? id === nodeId : stryMutAct_9fa48("1033") ? false : stryMutAct_9fa48("1032") ? true : (stryCov_9fa48("1032", "1033", "1034"), id !== nodeId)))) : stryMutAct_9fa48("1035") ? [] : (stryCov_9fa48("1035"), [...s.selectedNodeIds, nodeId])
          });
        }
      });
    }
  },
  selectNode: stryMutAct_9fa48("1036") ? () => undefined : (stryCov_9fa48("1036"), nodeId => set(stryMutAct_9fa48("1037") ? {} : (stryCov_9fa48("1037"), {
    selectedNodeIds: stryMutAct_9fa48("1038") ? [] : (stryCov_9fa48("1038"), [nodeId])
  }))),
  clearNodeSelection: stryMutAct_9fa48("1039") ? () => undefined : (stryCov_9fa48("1039"), () => set(stryMutAct_9fa48("1040") ? {} : (stryCov_9fa48("1040"), {
    selectedNodeIds: stryMutAct_9fa48("1041") ? ["Stryker was here"] : (stryCov_9fa48("1041"), [])
  }))),
  selectAllNodes: stryMutAct_9fa48("1042") ? () => undefined : (stryCov_9fa48("1042"), () => set(stryMutAct_9fa48("1043") ? () => undefined : (stryCov_9fa48("1043"), s => stryMutAct_9fa48("1044") ? {} : (stryCov_9fa48("1044"), {
    selectedNodeIds: s.componentNodes.map(stryMutAct_9fa48("1045") ? () => undefined : (stryCov_9fa48("1045"), n => n.nodeId))
  })))),
  deleteSelectedNodes: () => {
    if (stryMutAct_9fa48("1046")) {
      {}
    } else {
      stryCov_9fa48("1046");
      const {
        selectedNodeIds,
        componentNodes
      } = get();
      if (stryMutAct_9fa48("1049") ? selectedNodeIds.length !== 0 : stryMutAct_9fa48("1048") ? false : stryMutAct_9fa48("1047") ? true : (stryCov_9fa48("1047", "1048", "1049"), selectedNodeIds.length === 0)) return;
      const toDelete = new Set(selectedNodeIds);
      set(stryMutAct_9fa48("1050") ? {} : (stryCov_9fa48("1050"), {
        componentNodes: stryMutAct_9fa48("1051") ? componentNodes : (stryCov_9fa48("1051"), componentNodes.filter(stryMutAct_9fa48("1052") ? () => undefined : (stryCov_9fa48("1052"), n => stryMutAct_9fa48("1053") ? toDelete.has(n.nodeId) : (stryCov_9fa48("1053"), !toDelete.has(n.nodeId))))),
        selectedNodeIds: stryMutAct_9fa48("1054") ? ["Stryker was here"] : (stryCov_9fa48("1054"), [])
      }));
    }
  }
})), stryMutAct_9fa48("1055") ? {} : (stryCov_9fa48("1055"), {
  name: stryMutAct_9fa48("1056") ? "" : (stryCov_9fa48("1056"), 'vibex-component-store')
})), stryMutAct_9fa48("1057") ? {} : (stryCov_9fa48("1057"), {
  name: stryMutAct_9fa48("1058") ? "" : (stryCov_9fa48("1058"), 'ComponentStore')
})));