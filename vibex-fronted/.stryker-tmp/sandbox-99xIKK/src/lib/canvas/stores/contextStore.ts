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
  if (stryMutAct_9fa48("1059")) {
    {}
  } else {
    stryCov_9fa48("1059");
    return stryMutAct_9fa48("1060") ? `` : (stryCov_9fa48("1060"), `${Date.now()}-${stryMutAct_9fa48("1061") ? Math.random().toString(36) : (stryCov_9fa48("1061"), Math.random().toString(36).slice(2, 9))}`);
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
export const useContextStore = create<ContextStore>()(devtools(persist(stryMutAct_9fa48("1062") ? () => undefined : (stryCov_9fa48("1062"), (set, get) => stryMutAct_9fa48("1063") ? {} : (stryCov_9fa48("1063"), {
  contextNodes: stryMutAct_9fa48("1064") ? ["Stryker was here"] : (stryCov_9fa48("1064"), []),
  contextDraft: null,
  setContextNodes: stryMutAct_9fa48("1065") ? () => undefined : (stryCov_9fa48("1065"), nodes => set(stryMutAct_9fa48("1066") ? {} : (stryCov_9fa48("1066"), {
    contextNodes: nodes
  }))),
  addContextNode: data => {
    if (stryMutAct_9fa48("1067")) {
      {}
    } else {
      stryCov_9fa48("1067");
      const newNode: BoundedContextNode = stryMutAct_9fa48("1068") ? {} : (stryCov_9fa48("1068"), {
        nodeId: generateId(),
        name: data.name,
        description: data.description,
        type: data.type,
        isActive: stryMutAct_9fa48("1069") ? true : (stryCov_9fa48("1069"), false),
        status: stryMutAct_9fa48("1070") ? "" : (stryCov_9fa48("1070"), 'pending'),
        children: stryMutAct_9fa48("1071") ? ["Stryker was here"] : (stryCov_9fa48("1071"), [])
      });
      set(s => {
        if (stryMutAct_9fa48("1072")) {
          {}
        } else {
          stryCov_9fa48("1072");
          const newNodes = stryMutAct_9fa48("1073") ? [] : (stryCov_9fa48("1073"), [...s.contextNodes, stryMutAct_9fa48("1074") ? {} : (stryCov_9fa48("1074"), {
            ...newNode
          })]);
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1075") ? "" : (stryCov_9fa48("1075"), 'context'), newNodes);
          return stryMutAct_9fa48("1076") ? {} : (stryCov_9fa48("1076"), {
            contextNodes: newNodes
          });
        }
      });
      // Side effect: record user action message
      postContextActionMessage(stryMutAct_9fa48("1077") ? `` : (stryCov_9fa48("1077"), `添加了上下文节点`), data.name);
    }
  },
  editContextNode: (nodeId, data) => {
    if (stryMutAct_9fa48("1078")) {
      {}
    } else {
      stryCov_9fa48("1078");
      set(s => {
        if (stryMutAct_9fa48("1079")) {
          {}
        } else {
          stryCov_9fa48("1079");
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("1080") ? () => undefined : (stryCov_9fa48("1080"), n => (stryMutAct_9fa48("1083") ? n.nodeId !== nodeId : stryMutAct_9fa48("1082") ? false : stryMutAct_9fa48("1081") ? true : (stryCov_9fa48("1081", "1082", "1083"), n.nodeId === nodeId)) ? stryMutAct_9fa48("1084") ? {} : (stryCov_9fa48("1084"), {
            ...n,
            ...data,
            status: 'pending' as const
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1085") ? "" : (stryCov_9fa48("1085"), 'context'), newNodes);
          return stryMutAct_9fa48("1086") ? {} : (stryCov_9fa48("1086"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  deleteContextNode: nodeId => {
    if (stryMutAct_9fa48("1087")) {
      {}
    } else {
      stryCov_9fa48("1087");
      const nodeToDelete = get().contextNodes.find(stryMutAct_9fa48("1088") ? () => undefined : (stryCov_9fa48("1088"), n => stryMutAct_9fa48("1091") ? n.nodeId !== nodeId : stryMutAct_9fa48("1090") ? false : stryMutAct_9fa48("1089") ? true : (stryCov_9fa48("1089", "1090", "1091"), n.nodeId === nodeId)));
      const deletedName = stryMutAct_9fa48("1092") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("1092"), (stryMutAct_9fa48("1093") ? nodeToDelete.name : (stryCov_9fa48("1093"), nodeToDelete?.name)) ?? nodeId);
      set(s => {
        if (stryMutAct_9fa48("1094")) {
          {}
        } else {
          stryCov_9fa48("1094");
          const newNodes = stryMutAct_9fa48("1095") ? s.contextNodes : (stryCov_9fa48("1095"), s.contextNodes.filter(stryMutAct_9fa48("1096") ? () => undefined : (stryCov_9fa48("1096"), n => stryMutAct_9fa48("1099") ? n.nodeId === nodeId : stryMutAct_9fa48("1098") ? false : stryMutAct_9fa48("1097") ? true : (stryCov_9fa48("1097", "1098", "1099"), n.nodeId !== nodeId))));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1100") ? "" : (stryCov_9fa48("1100"), 'context'), newNodes);
          return stryMutAct_9fa48("1101") ? {} : (stryCov_9fa48("1101"), {
            contextNodes: newNodes
          });
        }
      });
      // Side effect: record user action message
      postContextActionMessage(stryMutAct_9fa48("1102") ? `` : (stryCov_9fa48("1102"), `删除了上下文节点`), deletedName);
    }
  },
  confirmContextNode: nodeId => {
    if (stryMutAct_9fa48("1103")) {
      {}
    } else {
      stryCov_9fa48("1103");
      set(s => {
        if (stryMutAct_9fa48("1104")) {
          {}
        } else {
          stryCov_9fa48("1104");
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("1105") ? () => undefined : (stryCov_9fa48("1105"), n => (stryMutAct_9fa48("1108") ? n.nodeId !== nodeId : stryMutAct_9fa48("1107") ? false : stryMutAct_9fa48("1106") ? true : (stryCov_9fa48("1106", "1107", "1108"), n.nodeId === nodeId)) ? stryMutAct_9fa48("1109") ? {} : (stryCov_9fa48("1109"), {
            ...n,
            isActive: stryMutAct_9fa48("1110") ? false : (stryCov_9fa48("1110"), true),
            status: 'confirmed' as const
          }) : n));
          return stryMutAct_9fa48("1111") ? {} : (stryCov_9fa48("1111"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  setContextDraft: stryMutAct_9fa48("1112") ? () => undefined : (stryCov_9fa48("1112"), draft => set(stryMutAct_9fa48("1113") ? {} : (stryCov_9fa48("1113"), {
    contextDraft: draft
  })))
})), stryMutAct_9fa48("1114") ? {} : (stryCov_9fa48("1114"), {
  name: stryMutAct_9fa48("1115") ? "" : (stryCov_9fa48("1115"), 'vibex-context-store')
})), stryMutAct_9fa48("1116") ? {} : (stryCov_9fa48("1116"), {
  name: stryMutAct_9fa48("1117") ? "" : (stryCov_9fa48("1117"), 'ContextStore')
})));