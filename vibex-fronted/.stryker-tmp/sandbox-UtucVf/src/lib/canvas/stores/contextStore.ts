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
import type { BoundedContextNode, BoundedContextDraft } from '../types';
import { getHistoryStore } from '../historySlice';
import { postContextActionMessage } from './messageBridge';
function generateId(): string {
  if (stryMutAct_9fa48("1024")) {
    {}
  } else {
    stryCov_9fa48("1024");
    return stryMutAct_9fa48("1025") ? `` : (stryCov_9fa48("1025"), `${Date.now()}-${stryMutAct_9fa48("1026") ? Math.random().toString(36) : (stryCov_9fa48("1026"), Math.random().toString(36).slice(2, 9))}`);
  }
}
interface ContextStore {
  contextNodes: BoundedContextNode[];
  contextDraft: Partial<BoundedContextNode> | null;
  setContextNodes: (nodes: BoundedContextNode[]) => void;
  addContextNode: (data: BoundedContextDraft) => void;
  editContextNode: (nodeId: string, data: Partial<BoundedContextNode>) => void;
  deleteContextNode: (nodeId: string) => void;
  confirmContextNode: (nodeId: string) => void;
  setContextDraft: (draft: Partial<BoundedContextNode> | null) => void;
}
export const useContextStore = create<ContextStore>()(devtools(persist(stryMutAct_9fa48("1027") ? () => undefined : (stryCov_9fa48("1027"), (set, get) => stryMutAct_9fa48("1028") ? {} : (stryCov_9fa48("1028"), {
  contextNodes: stryMutAct_9fa48("1029") ? ["Stryker was here"] : (stryCov_9fa48("1029"), []),
  contextDraft: null,
  setContextNodes: stryMutAct_9fa48("1030") ? () => undefined : (stryCov_9fa48("1030"), nodes => set(stryMutAct_9fa48("1031") ? {} : (stryCov_9fa48("1031"), {
    contextNodes: nodes
  }))),
  addContextNode: data => {
    if (stryMutAct_9fa48("1032")) {
      {}
    } else {
      stryCov_9fa48("1032");
      const newNode: BoundedContextNode = stryMutAct_9fa48("1033") ? {} : (stryCov_9fa48("1033"), {
        nodeId: generateId(),
        name: data.name,
        description: data.description,
        type: data.type,
        isActive: stryMutAct_9fa48("1034") ? true : (stryCov_9fa48("1034"), false),
        status: stryMutAct_9fa48("1035") ? "" : (stryCov_9fa48("1035"), 'pending'),
        children: stryMutAct_9fa48("1036") ? ["Stryker was here"] : (stryCov_9fa48("1036"), [])
      });
      set(s => {
        if (stryMutAct_9fa48("1037")) {
          {}
        } else {
          stryCov_9fa48("1037");
          const newNodes = stryMutAct_9fa48("1038") ? [] : (stryCov_9fa48("1038"), [...s.contextNodes, stryMutAct_9fa48("1039") ? {} : (stryCov_9fa48("1039"), {
            ...newNode
          })]);
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1040") ? "" : (stryCov_9fa48("1040"), 'context'), newNodes);
          return stryMutAct_9fa48("1041") ? {} : (stryCov_9fa48("1041"), {
            contextNodes: newNodes
          });
        }
      });
      // Side effect: record user action message
      postContextActionMessage(stryMutAct_9fa48("1042") ? `` : (stryCov_9fa48("1042"), `添加了上下文节点`), data.name);
    }
  },
  editContextNode: (nodeId, data) => {
    if (stryMutAct_9fa48("1043")) {
      {}
    } else {
      stryCov_9fa48("1043");
      set(s => {
        if (stryMutAct_9fa48("1044")) {
          {}
        } else {
          stryCov_9fa48("1044");
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("1045") ? () => undefined : (stryCov_9fa48("1045"), n => (stryMutAct_9fa48("1048") ? n.nodeId !== nodeId : stryMutAct_9fa48("1047") ? false : stryMutAct_9fa48("1046") ? true : (stryCov_9fa48("1046", "1047", "1048"), n.nodeId === nodeId)) ? stryMutAct_9fa48("1049") ? {} : (stryCov_9fa48("1049"), {
            ...n,
            ...data,
            status: 'pending' as const
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1050") ? "" : (stryCov_9fa48("1050"), 'context'), newNodes);
          return stryMutAct_9fa48("1051") ? {} : (stryCov_9fa48("1051"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  deleteContextNode: nodeId => {
    if (stryMutAct_9fa48("1052")) {
      {}
    } else {
      stryCov_9fa48("1052");
      const nodeToDelete = get().contextNodes.find(stryMutAct_9fa48("1053") ? () => undefined : (stryCov_9fa48("1053"), n => stryMutAct_9fa48("1056") ? n.nodeId !== nodeId : stryMutAct_9fa48("1055") ? false : stryMutAct_9fa48("1054") ? true : (stryCov_9fa48("1054", "1055", "1056"), n.nodeId === nodeId)));
      const deletedName = stryMutAct_9fa48("1057") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("1057"), (stryMutAct_9fa48("1058") ? nodeToDelete.name : (stryCov_9fa48("1058"), nodeToDelete?.name)) ?? nodeId);
      set(s => {
        if (stryMutAct_9fa48("1059")) {
          {}
        } else {
          stryCov_9fa48("1059");
          const newNodes = stryMutAct_9fa48("1060") ? s.contextNodes : (stryCov_9fa48("1060"), s.contextNodes.filter(stryMutAct_9fa48("1061") ? () => undefined : (stryCov_9fa48("1061"), n => stryMutAct_9fa48("1064") ? n.nodeId === nodeId : stryMutAct_9fa48("1063") ? false : stryMutAct_9fa48("1062") ? true : (stryCov_9fa48("1062", "1063", "1064"), n.nodeId !== nodeId))));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1065") ? "" : (stryCov_9fa48("1065"), 'context'), newNodes);
          return stryMutAct_9fa48("1066") ? {} : (stryCov_9fa48("1066"), {
            contextNodes: newNodes
          });
        }
      });
      // Side effect: record user action message
      postContextActionMessage(stryMutAct_9fa48("1067") ? `` : (stryCov_9fa48("1067"), `删除了上下文节点`), deletedName);
    }
  },
  confirmContextNode: nodeId => {
    if (stryMutAct_9fa48("1068")) {
      {}
    } else {
      stryCov_9fa48("1068");
      set(s => {
        if (stryMutAct_9fa48("1069")) {
          {}
        } else {
          stryCov_9fa48("1069");
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("1070") ? () => undefined : (stryCov_9fa48("1070"), n => (stryMutAct_9fa48("1073") ? n.nodeId !== nodeId : stryMutAct_9fa48("1072") ? false : stryMutAct_9fa48("1071") ? true : (stryCov_9fa48("1071", "1072", "1073"), n.nodeId === nodeId)) ? stryMutAct_9fa48("1074") ? {} : (stryCov_9fa48("1074"), {
            ...n,
            isActive: stryMutAct_9fa48("1075") ? false : (stryCov_9fa48("1075"), true),
            status: 'confirmed' as const
          }) : n));
          return stryMutAct_9fa48("1076") ? {} : (stryCov_9fa48("1076"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  setContextDraft: stryMutAct_9fa48("1077") ? () => undefined : (stryCov_9fa48("1077"), draft => set(stryMutAct_9fa48("1078") ? {} : (stryCov_9fa48("1078"), {
    contextDraft: draft
  })))
})), stryMutAct_9fa48("1079") ? {} : (stryCov_9fa48("1079"), {
  name: stryMutAct_9fa48("1080") ? "" : (stryCov_9fa48("1080"), 'vibex-context-store')
})), stryMutAct_9fa48("1081") ? {} : (stryCov_9fa48("1081"), {
  name: stryMutAct_9fa48("1082") ? "" : (stryCov_9fa48("1082"), 'ContextStore')
})));