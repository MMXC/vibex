/**
 * VibeX Context Store — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 1 slice extraction.
 *
 * Responsibilities:
 * - BoundedContextNode CRUD operations
 * - Context draft state
 * - History recording on mutations
 * - Phase and activeTree management
 * - BoundedGroups and BoundedEdges (F2)
 * - Global selectedNodeIds (multi-select for context/flow trees)
 *
 * E4 migration: Added phase/activeTree/boundedGroups/boundedEdges/selectedNodeIds
 * from canvasStore to serve as the primary source of truth.
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
import type { BoundedContextNode, BoundedContextDraft, Phase, TreeType, BoundedGroup, BoundedEdge } from '../types';
import { getHistoryStore } from '../historySlice';
import { postContextActionMessage } from './messageBridge';
import { areAllConfirmed } from '../cascade';
function generateId(): string {
  if (stryMutAct_9fa48("1024")) {
    {}
  } else {
    stryCov_9fa48("1024");
    return stryMutAct_9fa48("1025") ? `` : (stryCov_9fa48("1025"), `${Date.now()}-${stryMutAct_9fa48("1026") ? Math.random().toString(36) : (stryCov_9fa48("1026"), Math.random().toString(36).slice(2, 9))}`);
  }
}
interface ContextStore {
  // === Phase Slice ===
  phase: Phase;
  activeTree: TreeType | null;
  _prevActiveTree: TreeType | null;
  setPhase: (phase: Phase) => void;
  advancePhase: () => void;
  setActiveTree: (tree: TreeType | null) => void;
  recomputeActiveTree: () => void;

  // === Bounded Group Slice ===
  boundedGroups: BoundedGroup[];
  addBoundedGroup: (groupData: Omit<BoundedGroup, 'groupId'>) => void;
  removeBoundedGroup: (groupId: string) => void;
  toggleBoundedGroupVisibility: (groupId: string) => void;
  updateBoundedGroupLabel: (groupId: string, label: string) => void;
  addNodeToGroup: (groupId: string, nodeId: string) => void;
  removeNodeFromGroup: (groupId: string, nodeId: string) => void;
  clearBoundedGroups: () => void;

  // === BoundedEdge Slice ===
  boundedEdges: BoundedEdge[];
  addBoundedEdge: (edgeData: Omit<BoundedEdge, 'id'>) => void;
  removeBoundedEdge: (id: string) => void;
  clearBoundedEdges: () => void;
  setBoundedEdges: (edges: BoundedEdge[]) => void;

  // === Multi-Select Slice (global, per-tree) ===
  selectedNodeIds: Record<TreeType, string[]>;
  toggleNodeSelect: (tree: TreeType, nodeId: string) => void;
  selectNode: (tree: TreeType, nodeId: string) => void;
  clearNodeSelection: (tree: TreeType) => void;
  selectAllNodes: (tree: TreeType) => void;
  deleteSelectedNodes: (tree: TreeType, deleteContextNode: (id: string) => void, deleteFlowNode: (id: string) => void) => void;

  // === Context Slice ===
  contextNodes: BoundedContextNode[];
  contextDraft: Partial<BoundedContextNode> | null;
  setContextNodes: (nodes: BoundedContextNode[]) => void;
  addContextNode: (data: BoundedContextDraft) => void;
  editContextNode: (nodeId: string, data: Partial<BoundedContextNode>) => void;
  deleteContextNode: (nodeId: string) => void;
  confirmContextNode: (nodeId: string) => void;
  toggleContextNode: (nodeId: string) => void;
  setContextDraft: (draft: Partial<BoundedContextNode> | null) => void;
}
export const useContextStore = create<ContextStore>()(devtools(persist(stryMutAct_9fa48("1027") ? () => undefined : (stryCov_9fa48("1027"), (set, get) => stryMutAct_9fa48("1028") ? {} : (stryCov_9fa48("1028"), {
  // === Phase Slice ===
  phase: stryMutAct_9fa48("1029") ? "" : (stryCov_9fa48("1029"), 'input'),
  activeTree: null,
  _prevActiveTree: null,
  setPhase: phase => {
    if (stryMutAct_9fa48("1030")) {
      {}
    } else {
      stryCov_9fa48("1030");
      set(stryMutAct_9fa48("1031") ? {} : (stryCov_9fa48("1031"), {
        phase
      }));
      get().recomputeActiveTree();
    }
  },
  advancePhase: () => {
    if (stryMutAct_9fa48("1032")) {
      {}
    } else {
      stryCov_9fa48("1032");
      const {
        phase
      } = get();
      const phaseOrder: Phase[] = stryMutAct_9fa48("1033") ? [] : (stryCov_9fa48("1033"), [stryMutAct_9fa48("1034") ? "" : (stryCov_9fa48("1034"), 'input'), stryMutAct_9fa48("1035") ? "" : (stryCov_9fa48("1035"), 'context'), stryMutAct_9fa48("1036") ? "" : (stryCov_9fa48("1036"), 'flow'), stryMutAct_9fa48("1037") ? "" : (stryCov_9fa48("1037"), 'component'), stryMutAct_9fa48("1038") ? "" : (stryCov_9fa48("1038"), 'prototype')]);
      const idx = phaseOrder.indexOf(phase);
      if (stryMutAct_9fa48("1042") ? idx >= phaseOrder.length - 1 : stryMutAct_9fa48("1041") ? idx <= phaseOrder.length - 1 : stryMutAct_9fa48("1040") ? false : stryMutAct_9fa48("1039") ? true : (stryCov_9fa48("1039", "1040", "1041", "1042"), idx < (stryMutAct_9fa48("1043") ? phaseOrder.length + 1 : (stryCov_9fa48("1043"), phaseOrder.length - 1)))) {
        if (stryMutAct_9fa48("1044")) {
          {}
        } else {
          stryCov_9fa48("1044");
          set(stryMutAct_9fa48("1045") ? {} : (stryCov_9fa48("1045"), {
            phase: phaseOrder[stryMutAct_9fa48("1046") ? idx - 1 : (stryCov_9fa48("1046"), idx + 1)]
          }));
          get().recomputeActiveTree();
        }
      }
    }
  },
  setActiveTree: stryMutAct_9fa48("1047") ? () => undefined : (stryCov_9fa48("1047"), activeTree => set(stryMutAct_9fa48("1048") ? () => undefined : (stryCov_9fa48("1048"), s => stryMutAct_9fa48("1049") ? {} : (stryCov_9fa48("1049"), {
    activeTree,
    _prevActiveTree: s.activeTree
  })))),
  recomputeActiveTree: () => {
    if (stryMutAct_9fa48("1050")) {
      {}
    } else {
      stryCov_9fa48("1050");
      const {
        contextNodes,
        flowNodes,
        phase,
        _prevActiveTree,
        setActiveTree,
        setPhase,
        setCenterExpand
      } = get();
      // Import flowNodes from flowStore (avoids circular import)
      const {
        useFlowStore
      } = require('./flowStore');
      const flows = useFlowStore.getState().flowNodes;
      let newActiveTree: TreeType | null = null;
      if (stryMutAct_9fa48("1053") ? phase !== 'input' : stryMutAct_9fa48("1052") ? false : stryMutAct_9fa48("1051") ? true : (stryCov_9fa48("1051", "1052", "1053"), phase === (stryMutAct_9fa48("1054") ? "" : (stryCov_9fa48("1054"), 'input')))) {
        if (stryMutAct_9fa48("1055")) {
          {}
        } else {
          stryCov_9fa48("1055");
          newActiveTree = null;
        }
      } else if (stryMutAct_9fa48("1058") ? phase !== 'context' : stryMutAct_9fa48("1057") ? false : stryMutAct_9fa48("1056") ? true : (stryCov_9fa48("1056", "1057", "1058"), phase === (stryMutAct_9fa48("1059") ? "" : (stryCov_9fa48("1059"), 'context')))) {
        if (stryMutAct_9fa48("1060")) {
          {}
        } else {
          stryCov_9fa48("1060");
          const allConfirmed = areAllConfirmed(contextNodes);
          newActiveTree = (stryMutAct_9fa48("1063") ? allConfirmed || contextNodes.length > 0 : stryMutAct_9fa48("1062") ? false : stryMutAct_9fa48("1061") ? true : (stryCov_9fa48("1061", "1062", "1063"), allConfirmed && (stryMutAct_9fa48("1066") ? contextNodes.length <= 0 : stryMutAct_9fa48("1065") ? contextNodes.length >= 0 : stryMutAct_9fa48("1064") ? true : (stryCov_9fa48("1064", "1065", "1066"), contextNodes.length > 0)))) ? stryMutAct_9fa48("1067") ? "" : (stryCov_9fa48("1067"), 'flow') : stryMutAct_9fa48("1068") ? "" : (stryCov_9fa48("1068"), 'context');
        }
      } else if (stryMutAct_9fa48("1071") ? phase !== 'flow' : stryMutAct_9fa48("1070") ? false : stryMutAct_9fa48("1069") ? true : (stryCov_9fa48("1069", "1070", "1071"), phase === (stryMutAct_9fa48("1072") ? "" : (stryCov_9fa48("1072"), 'flow')))) {
        if (stryMutAct_9fa48("1073")) {
          {}
        } else {
          stryCov_9fa48("1073");
          const flowReady = areAllConfirmed(flows);
          const contextReady = areAllConfirmed(contextNodes);
          newActiveTree = (stryMutAct_9fa48("1076") ? flowReady || flows.length > 0 : stryMutAct_9fa48("1075") ? false : stryMutAct_9fa48("1074") ? true : (stryCov_9fa48("1074", "1075", "1076"), flowReady && (stryMutAct_9fa48("1079") ? flows.length <= 0 : stryMutAct_9fa48("1078") ? flows.length >= 0 : stryMutAct_9fa48("1077") ? true : (stryCov_9fa48("1077", "1078", "1079"), flows.length > 0)))) ? stryMutAct_9fa48("1080") ? "" : (stryCov_9fa48("1080"), 'component') : stryMutAct_9fa48("1081") ? "" : (stryCov_9fa48("1081"), 'flow');
          if (stryMutAct_9fa48("1084") ? contextReady && flowReady || flows.length > 0 : stryMutAct_9fa48("1083") ? false : stryMutAct_9fa48("1082") ? true : (stryCov_9fa48("1082", "1083", "1084"), (stryMutAct_9fa48("1086") ? contextReady || flowReady : stryMutAct_9fa48("1085") ? true : (stryCov_9fa48("1085", "1086"), contextReady && flowReady)) && (stryMutAct_9fa48("1089") ? flows.length <= 0 : stryMutAct_9fa48("1088") ? flows.length >= 0 : stryMutAct_9fa48("1087") ? true : (stryCov_9fa48("1087", "1088", "1089"), flows.length > 0)))) {
            if (stryMutAct_9fa48("1090")) {
              {}
            } else {
              stryCov_9fa48("1090");
              setPhase(stryMutAct_9fa48("1091") ? "" : (stryCov_9fa48("1091"), 'component'));
              setCenterExpand(stryMutAct_9fa48("1092") ? "" : (stryCov_9fa48("1092"), 'expand-left'));
              return;
            }
          }
        }
      } else if (stryMutAct_9fa48("1095") ? phase !== 'component' : stryMutAct_9fa48("1094") ? false : stryMutAct_9fa48("1093") ? true : (stryCov_9fa48("1093", "1094", "1095"), phase === (stryMutAct_9fa48("1096") ? "" : (stryCov_9fa48("1096"), 'component')))) {
        if (stryMutAct_9fa48("1097")) {
          {}
        } else {
          stryCov_9fa48("1097");
          newActiveTree = stryMutAct_9fa48("1098") ? "" : (stryCov_9fa48("1098"), 'component');
        }
      } else {
        if (stryMutAct_9fa48("1099")) {
          {}
        } else {
          stryCov_9fa48("1099");
          newActiveTree = null;
        }
      }
      if (stryMutAct_9fa48("1102") ? newActiveTree === _prevActiveTree : stryMutAct_9fa48("1101") ? false : stryMutAct_9fa48("1100") ? true : (stryCov_9fa48("1100", "1101", "1102"), newActiveTree !== _prevActiveTree)) {
        if (stryMutAct_9fa48("1103")) {
          {}
        } else {
          stryCov_9fa48("1103");
          if (stryMutAct_9fa48("1106") ? newActiveTree === 'flow' && newActiveTree === 'component' : stryMutAct_9fa48("1105") ? false : stryMutAct_9fa48("1104") ? true : (stryCov_9fa48("1104", "1105", "1106"), (stryMutAct_9fa48("1108") ? newActiveTree !== 'flow' : stryMutAct_9fa48("1107") ? false : (stryCov_9fa48("1107", "1108"), newActiveTree === (stryMutAct_9fa48("1109") ? "" : (stryCov_9fa48("1109"), 'flow')))) || (stryMutAct_9fa48("1111") ? newActiveTree !== 'component' : stryMutAct_9fa48("1110") ? false : (stryCov_9fa48("1110", "1111"), newActiveTree === (stryMutAct_9fa48("1112") ? "" : (stryCov_9fa48("1112"), 'component')))))) {
            if (stryMutAct_9fa48("1113")) {
              {}
            } else {
              stryCov_9fa48("1113");
              setActiveTree(newActiveTree);
              setCenterExpand(stryMutAct_9fa48("1114") ? "" : (stryCov_9fa48("1114"), 'expand-left'));
            }
          } else if (stryMutAct_9fa48("1117") ? newActiveTree !== null : stryMutAct_9fa48("1116") ? false : stryMutAct_9fa48("1115") ? true : (stryCov_9fa48("1115", "1116", "1117"), newActiveTree === null)) {
            if (stryMutAct_9fa48("1118")) {
              {}
            } else {
              stryCov_9fa48("1118");
              setActiveTree(null);
              setCenterExpand(stryMutAct_9fa48("1119") ? "" : (stryCov_9fa48("1119"), 'default'));
            }
          } else {
            if (stryMutAct_9fa48("1120")) {
              {}
            } else {
              stryCov_9fa48("1120");
              setActiveTree(newActiveTree);
            }
          }
        }
      } else {
        if (stryMutAct_9fa48("1121")) {
          {}
        } else {
          stryCov_9fa48("1121");
          setActiveTree(newActiveTree);
        }
      }
    }
  },
  // === Bounded Group Slice ===
  boundedGroups: stryMutAct_9fa48("1122") ? ["Stryker was here"] : (stryCov_9fa48("1122"), []),
  addBoundedGroup: groupData => {
    if (stryMutAct_9fa48("1123")) {
      {}
    } else {
      stryCov_9fa48("1123");
      const newGroup: BoundedGroup = stryMutAct_9fa48("1124") ? {} : (stryCov_9fa48("1124"), {
        ...groupData,
        groupId: generateId()
      });
      set(stryMutAct_9fa48("1125") ? () => undefined : (stryCov_9fa48("1125"), s => stryMutAct_9fa48("1126") ? {} : (stryCov_9fa48("1126"), {
        boundedGroups: stryMutAct_9fa48("1127") ? [] : (stryCov_9fa48("1127"), [...s.boundedGroups, newGroup])
      })));
    }
  },
  removeBoundedGroup: groupId => {
    if (stryMutAct_9fa48("1128")) {
      {}
    } else {
      stryCov_9fa48("1128");
      set(stryMutAct_9fa48("1129") ? () => undefined : (stryCov_9fa48("1129"), s => stryMutAct_9fa48("1130") ? {} : (stryCov_9fa48("1130"), {
        boundedGroups: stryMutAct_9fa48("1131") ? s.boundedGroups : (stryCov_9fa48("1131"), s.boundedGroups.filter(stryMutAct_9fa48("1132") ? () => undefined : (stryCov_9fa48("1132"), g => stryMutAct_9fa48("1135") ? g.groupId === groupId : stryMutAct_9fa48("1134") ? false : stryMutAct_9fa48("1133") ? true : (stryCov_9fa48("1133", "1134", "1135"), g.groupId !== groupId))))
      })));
    }
  },
  toggleBoundedGroupVisibility: groupId => {
    if (stryMutAct_9fa48("1136")) {
      {}
    } else {
      stryCov_9fa48("1136");
      set(stryMutAct_9fa48("1137") ? () => undefined : (stryCov_9fa48("1137"), s => stryMutAct_9fa48("1138") ? {} : (stryCov_9fa48("1138"), {
        boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("1139") ? () => undefined : (stryCov_9fa48("1139"), g => (stryMutAct_9fa48("1142") ? g.groupId !== groupId : stryMutAct_9fa48("1141") ? false : stryMutAct_9fa48("1140") ? true : (stryCov_9fa48("1140", "1141", "1142"), g.groupId === groupId)) ? stryMutAct_9fa48("1143") ? {} : (stryCov_9fa48("1143"), {
          ...g,
          visible: (stryMutAct_9fa48("1146") ? g.visible === undefined && g.visible === true : stryMutAct_9fa48("1145") ? false : stryMutAct_9fa48("1144") ? true : (stryCov_9fa48("1144", "1145", "1146"), (stryMutAct_9fa48("1148") ? g.visible !== undefined : stryMutAct_9fa48("1147") ? false : (stryCov_9fa48("1147", "1148"), g.visible === undefined)) || (stryMutAct_9fa48("1150") ? g.visible !== true : stryMutAct_9fa48("1149") ? false : (stryCov_9fa48("1149", "1150"), g.visible === (stryMutAct_9fa48("1151") ? false : (stryCov_9fa48("1151"), true)))))) ? stryMutAct_9fa48("1152") ? true : (stryCov_9fa48("1152"), false) : stryMutAct_9fa48("1153") ? false : (stryCov_9fa48("1153"), true)
        }) : g))
      })));
    }
  },
  updateBoundedGroupLabel: (groupId, label) => {
    if (stryMutAct_9fa48("1154")) {
      {}
    } else {
      stryCov_9fa48("1154");
      set(stryMutAct_9fa48("1155") ? () => undefined : (stryCov_9fa48("1155"), s => stryMutAct_9fa48("1156") ? {} : (stryCov_9fa48("1156"), {
        boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("1157") ? () => undefined : (stryCov_9fa48("1157"), g => (stryMutAct_9fa48("1160") ? g.groupId !== groupId : stryMutAct_9fa48("1159") ? false : stryMutAct_9fa48("1158") ? true : (stryCov_9fa48("1158", "1159", "1160"), g.groupId === groupId)) ? stryMutAct_9fa48("1161") ? {} : (stryCov_9fa48("1161"), {
          ...g,
          label
        }) : g))
      })));
    }
  },
  addNodeToGroup: (groupId, nodeId) => {
    if (stryMutAct_9fa48("1162")) {
      {}
    } else {
      stryCov_9fa48("1162");
      set(stryMutAct_9fa48("1163") ? () => undefined : (stryCov_9fa48("1163"), s => stryMutAct_9fa48("1164") ? {} : (stryCov_9fa48("1164"), {
        boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("1165") ? () => undefined : (stryCov_9fa48("1165"), g => (stryMutAct_9fa48("1168") ? g.groupId === groupId || !g.nodeIds.includes(nodeId) : stryMutAct_9fa48("1167") ? false : stryMutAct_9fa48("1166") ? true : (stryCov_9fa48("1166", "1167", "1168"), (stryMutAct_9fa48("1170") ? g.groupId !== groupId : stryMutAct_9fa48("1169") ? true : (stryCov_9fa48("1169", "1170"), g.groupId === groupId)) && (stryMutAct_9fa48("1171") ? g.nodeIds.includes(nodeId) : (stryCov_9fa48("1171"), !g.nodeIds.includes(nodeId))))) ? stryMutAct_9fa48("1172") ? {} : (stryCov_9fa48("1172"), {
          ...g,
          nodeIds: stryMutAct_9fa48("1173") ? [] : (stryCov_9fa48("1173"), [...g.nodeIds, nodeId])
        }) : g))
      })));
    }
  },
  removeNodeFromGroup: (groupId, nodeId) => {
    if (stryMutAct_9fa48("1174")) {
      {}
    } else {
      stryCov_9fa48("1174");
      set(stryMutAct_9fa48("1175") ? () => undefined : (stryCov_9fa48("1175"), s => stryMutAct_9fa48("1176") ? {} : (stryCov_9fa48("1176"), {
        boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("1177") ? () => undefined : (stryCov_9fa48("1177"), g => (stryMutAct_9fa48("1180") ? g.groupId !== groupId : stryMutAct_9fa48("1179") ? false : stryMutAct_9fa48("1178") ? true : (stryCov_9fa48("1178", "1179", "1180"), g.groupId === groupId)) ? stryMutAct_9fa48("1181") ? {} : (stryCov_9fa48("1181"), {
          ...g,
          nodeIds: stryMutAct_9fa48("1182") ? g.nodeIds : (stryCov_9fa48("1182"), g.nodeIds.filter(stryMutAct_9fa48("1183") ? () => undefined : (stryCov_9fa48("1183"), id => stryMutAct_9fa48("1186") ? id === nodeId : stryMutAct_9fa48("1185") ? false : stryMutAct_9fa48("1184") ? true : (stryCov_9fa48("1184", "1185", "1186"), id !== nodeId))))
        }) : g))
      })));
    }
  },
  clearBoundedGroups: stryMutAct_9fa48("1187") ? () => undefined : (stryCov_9fa48("1187"), () => set(stryMutAct_9fa48("1188") ? {} : (stryCov_9fa48("1188"), {
    boundedGroups: stryMutAct_9fa48("1189") ? ["Stryker was here"] : (stryCov_9fa48("1189"), [])
  }))),
  // === BoundedEdge Slice ===
  boundedEdges: stryMutAct_9fa48("1190") ? ["Stryker was here"] : (stryCov_9fa48("1190"), []),
  addBoundedEdge: edgeData => {
    if (stryMutAct_9fa48("1191")) {
      {}
    } else {
      stryCov_9fa48("1191");
      const newEdge: BoundedEdge = stryMutAct_9fa48("1192") ? {} : (stryCov_9fa48("1192"), {
        ...edgeData,
        id: generateId()
      });
      set(stryMutAct_9fa48("1193") ? () => undefined : (stryCov_9fa48("1193"), s => stryMutAct_9fa48("1194") ? {} : (stryCov_9fa48("1194"), {
        boundedEdges: stryMutAct_9fa48("1195") ? [] : (stryCov_9fa48("1195"), [...s.boundedEdges, newEdge])
      })));
    }
  },
  removeBoundedEdge: id => {
    if (stryMutAct_9fa48("1196")) {
      {}
    } else {
      stryCov_9fa48("1196");
      set(stryMutAct_9fa48("1197") ? () => undefined : (stryCov_9fa48("1197"), s => stryMutAct_9fa48("1198") ? {} : (stryCov_9fa48("1198"), {
        boundedEdges: stryMutAct_9fa48("1199") ? s.boundedEdges : (stryCov_9fa48("1199"), s.boundedEdges.filter(stryMutAct_9fa48("1200") ? () => undefined : (stryCov_9fa48("1200"), e => stryMutAct_9fa48("1203") ? e.id === id : stryMutAct_9fa48("1202") ? false : stryMutAct_9fa48("1201") ? true : (stryCov_9fa48("1201", "1202", "1203"), e.id !== id))))
      })));
    }
  },
  clearBoundedEdges: stryMutAct_9fa48("1204") ? () => undefined : (stryCov_9fa48("1204"), () => set(stryMutAct_9fa48("1205") ? {} : (stryCov_9fa48("1205"), {
    boundedEdges: stryMutAct_9fa48("1206") ? ["Stryker was here"] : (stryCov_9fa48("1206"), [])
  }))),
  setBoundedEdges: stryMutAct_9fa48("1207") ? () => undefined : (stryCov_9fa48("1207"), edges => set(stryMutAct_9fa48("1208") ? {} : (stryCov_9fa48("1208"), {
    boundedEdges: edges
  }))),
  // === Multi-Select Slice ===
  selectedNodeIds: stryMutAct_9fa48("1209") ? {} : (stryCov_9fa48("1209"), {
    context: stryMutAct_9fa48("1210") ? ["Stryker was here"] : (stryCov_9fa48("1210"), []),
    flow: stryMutAct_9fa48("1211") ? ["Stryker was here"] : (stryCov_9fa48("1211"), []),
    component: stryMutAct_9fa48("1212") ? ["Stryker was here"] : (stryCov_9fa48("1212"), [])
  }),
  toggleNodeSelect: (tree, nodeId) => {
    if (stryMutAct_9fa48("1213")) {
      {}
    } else {
      stryCov_9fa48("1213");
      set(s => {
        if (stryMutAct_9fa48("1214")) {
          {}
        } else {
          stryCov_9fa48("1214");
          const current = s.selectedNodeIds[tree];
          const exists = current.includes(nodeId);
          return stryMutAct_9fa48("1215") ? {} : (stryCov_9fa48("1215"), {
            selectedNodeIds: stryMutAct_9fa48("1216") ? {} : (stryCov_9fa48("1216"), {
              ...s.selectedNodeIds,
              [tree]: exists ? stryMutAct_9fa48("1217") ? current : (stryCov_9fa48("1217"), current.filter(stryMutAct_9fa48("1218") ? () => undefined : (stryCov_9fa48("1218"), id => stryMutAct_9fa48("1221") ? id === nodeId : stryMutAct_9fa48("1220") ? false : stryMutAct_9fa48("1219") ? true : (stryCov_9fa48("1219", "1220", "1221"), id !== nodeId)))) : stryMutAct_9fa48("1222") ? [] : (stryCov_9fa48("1222"), [...current, nodeId])
            })
          });
        }
      });
    }
  },
  selectNode: (tree, nodeId) => {
    if (stryMutAct_9fa48("1223")) {
      {}
    } else {
      stryCov_9fa48("1223");
      set(stryMutAct_9fa48("1224") ? () => undefined : (stryCov_9fa48("1224"), s => stryMutAct_9fa48("1225") ? {} : (stryCov_9fa48("1225"), {
        selectedNodeIds: stryMutAct_9fa48("1226") ? {} : (stryCov_9fa48("1226"), {
          ...s.selectedNodeIds,
          [tree]: stryMutAct_9fa48("1227") ? [] : (stryCov_9fa48("1227"), [nodeId])
        })
      })));
    }
  },
  clearNodeSelection: tree => {
    if (stryMutAct_9fa48("1228")) {
      {}
    } else {
      stryCov_9fa48("1228");
      set(stryMutAct_9fa48("1229") ? () => undefined : (stryCov_9fa48("1229"), s => stryMutAct_9fa48("1230") ? {} : (stryCov_9fa48("1230"), {
        selectedNodeIds: stryMutAct_9fa48("1231") ? {} : (stryCov_9fa48("1231"), {
          ...s.selectedNodeIds,
          [tree]: stryMutAct_9fa48("1232") ? ["Stryker was here"] : (stryCov_9fa48("1232"), [])
        })
      })));
    }
  },
  selectAllNodes: tree => {
    if (stryMutAct_9fa48("1233")) {
      {}
    } else {
      stryCov_9fa48("1233");
      set(s => {
        if (stryMutAct_9fa48("1234")) {
          {}
        } else {
          stryCov_9fa48("1234");
          if (stryMutAct_9fa48("1237") ? tree !== 'context' : stryMutAct_9fa48("1236") ? false : stryMutAct_9fa48("1235") ? true : (stryCov_9fa48("1235", "1236", "1237"), tree === (stryMutAct_9fa48("1238") ? "" : (stryCov_9fa48("1238"), 'context')))) {
            if (stryMutAct_9fa48("1239")) {
              {}
            } else {
              stryCov_9fa48("1239");
              return stryMutAct_9fa48("1240") ? {} : (stryCov_9fa48("1240"), {
                selectedNodeIds: stryMutAct_9fa48("1241") ? {} : (stryCov_9fa48("1241"), {
                  ...s.selectedNodeIds,
                  context: s.contextNodes.map(stryMutAct_9fa48("1242") ? () => undefined : (stryCov_9fa48("1242"), n => n.nodeId))
                })
              });
            }
          }
          // flow and component need state from other stores — handled by subscriptions
          return {};
        }
      });
    }
  },
  deleteSelectedNodes: (tree, deleteContextNode, deleteFlowNode) => {
    if (stryMutAct_9fa48("1243")) {
      {}
    } else {
      stryCov_9fa48("1243");
      const {
        selectedNodeIds
      } = get();
      const toDelete = new Set(selectedNodeIds[tree]);
      if (stryMutAct_9fa48("1246") ? toDelete.size !== 0 : stryMutAct_9fa48("1245") ? false : stryMutAct_9fa48("1244") ? true : (stryCov_9fa48("1244", "1245", "1246"), toDelete.size === 0)) return;
      const historyStore = getHistoryStore();
      if (stryMutAct_9fa48("1249") ? tree !== 'context' : stryMutAct_9fa48("1248") ? false : stryMutAct_9fa48("1247") ? true : (stryCov_9fa48("1247", "1248", "1249"), tree === (stryMutAct_9fa48("1250") ? "" : (stryCov_9fa48("1250"), 'context')))) {
        if (stryMutAct_9fa48("1251")) {
          {}
        } else {
          stryCov_9fa48("1251");
          const nodes = get().contextNodes;
          historyStore.recordSnapshot(stryMutAct_9fa48("1252") ? "" : (stryCov_9fa48("1252"), 'context'), nodes);
          toDelete.forEach(stryMutAct_9fa48("1253") ? () => undefined : (stryCov_9fa48("1253"), id => deleteContextNode(id)));
        }
      } else if (stryMutAct_9fa48("1256") ? tree !== 'flow' : stryMutAct_9fa48("1255") ? false : stryMutAct_9fa48("1254") ? true : (stryCov_9fa48("1254", "1255", "1256"), tree === (stryMutAct_9fa48("1257") ? "" : (stryCov_9fa48("1257"), 'flow')))) {
        if (stryMutAct_9fa48("1258")) {
          {}
        } else {
          stryCov_9fa48("1258");
          const {
            useFlowStore
          } = require('./flowStore');
          const nodes = useFlowStore.getState().flowNodes;
          historyStore.recordSnapshot(stryMutAct_9fa48("1259") ? "" : (stryCov_9fa48("1259"), 'flow'), nodes);
          toDelete.forEach(stryMutAct_9fa48("1260") ? () => undefined : (stryCov_9fa48("1260"), id => deleteFlowNode(id)));
        }
      }
      set(stryMutAct_9fa48("1261") ? () => undefined : (stryCov_9fa48("1261"), s => stryMutAct_9fa48("1262") ? {} : (stryCov_9fa48("1262"), {
        selectedNodeIds: stryMutAct_9fa48("1263") ? {} : (stryCov_9fa48("1263"), {
          ...s.selectedNodeIds,
          [tree]: stryMutAct_9fa48("1264") ? ["Stryker was here"] : (stryCov_9fa48("1264"), [])
        })
      })));
    }
  },
  // === Context Slice ===
  contextNodes: stryMutAct_9fa48("1265") ? ["Stryker was here"] : (stryCov_9fa48("1265"), []),
  contextDraft: null,
  setContextNodes: stryMutAct_9fa48("1266") ? () => undefined : (stryCov_9fa48("1266"), nodes => set(stryMutAct_9fa48("1267") ? {} : (stryCov_9fa48("1267"), {
    contextNodes: nodes
  }))),
  addContextNode: data => {
    if (stryMutAct_9fa48("1268")) {
      {}
    } else {
      stryCov_9fa48("1268");
      const newNode: BoundedContextNode = stryMutAct_9fa48("1269") ? {} : (stryCov_9fa48("1269"), {
        nodeId: generateId(),
        name: data.name,
        description: data.description,
        type: data.type,
        isActive: stryMutAct_9fa48("1270") ? true : (stryCov_9fa48("1270"), false),
        status: stryMutAct_9fa48("1271") ? "" : (stryCov_9fa48("1271"), 'pending'),
        children: stryMutAct_9fa48("1272") ? ["Stryker was here"] : (stryCov_9fa48("1272"), [])
      });
      set(s => {
        if (stryMutAct_9fa48("1273")) {
          {}
        } else {
          stryCov_9fa48("1273");
          const newNodes = stryMutAct_9fa48("1274") ? [] : (stryCov_9fa48("1274"), [...s.contextNodes, stryMutAct_9fa48("1275") ? {} : (stryCov_9fa48("1275"), {
            ...newNode
          })]);
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1276") ? "" : (stryCov_9fa48("1276"), 'context'), newNodes);
          return stryMutAct_9fa48("1277") ? {} : (stryCov_9fa48("1277"), {
            contextNodes: newNodes
          });
        }
      });
      postContextActionMessage(stryMutAct_9fa48("1278") ? `` : (stryCov_9fa48("1278"), `添加了上下文节点`), data.name);
    }
  },
  editContextNode: (nodeId, data) => {
    if (stryMutAct_9fa48("1279")) {
      {}
    } else {
      stryCov_9fa48("1279");
      set(s => {
        if (stryMutAct_9fa48("1280")) {
          {}
        } else {
          stryCov_9fa48("1280");
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("1281") ? () => undefined : (stryCov_9fa48("1281"), n => (stryMutAct_9fa48("1284") ? n.nodeId !== nodeId : stryMutAct_9fa48("1283") ? false : stryMutAct_9fa48("1282") ? true : (stryCov_9fa48("1282", "1283", "1284"), n.nodeId === nodeId)) ? stryMutAct_9fa48("1285") ? {} : (stryCov_9fa48("1285"), {
            ...n,
            ...data,
            status: 'pending' as const
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1286") ? "" : (stryCov_9fa48("1286"), 'context'), newNodes);
          return stryMutAct_9fa48("1287") ? {} : (stryCov_9fa48("1287"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  deleteContextNode: nodeId => {
    if (stryMutAct_9fa48("1288")) {
      {}
    } else {
      stryCov_9fa48("1288");
      const nodeToDelete = get().contextNodes.find(stryMutAct_9fa48("1289") ? () => undefined : (stryCov_9fa48("1289"), n => stryMutAct_9fa48("1292") ? n.nodeId !== nodeId : stryMutAct_9fa48("1291") ? false : stryMutAct_9fa48("1290") ? true : (stryCov_9fa48("1290", "1291", "1292"), n.nodeId === nodeId)));
      const deletedName = stryMutAct_9fa48("1293") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("1293"), (stryMutAct_9fa48("1294") ? nodeToDelete.name : (stryCov_9fa48("1294"), nodeToDelete?.name)) ?? nodeId);
      set(s => {
        if (stryMutAct_9fa48("1295")) {
          {}
        } else {
          stryCov_9fa48("1295");
          const newNodes = stryMutAct_9fa48("1296") ? s.contextNodes : (stryCov_9fa48("1296"), s.contextNodes.filter(stryMutAct_9fa48("1297") ? () => undefined : (stryCov_9fa48("1297"), n => stryMutAct_9fa48("1300") ? n.nodeId === nodeId : stryMutAct_9fa48("1299") ? false : stryMutAct_9fa48("1298") ? true : (stryCov_9fa48("1298", "1299", "1300"), n.nodeId !== nodeId))));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1301") ? "" : (stryCov_9fa48("1301"), 'context'), newNodes);
          return stryMutAct_9fa48("1302") ? {} : (stryCov_9fa48("1302"), {
            contextNodes: newNodes
          });
        }
      });
      postContextActionMessage(stryMutAct_9fa48("1303") ? `` : (stryCov_9fa48("1303"), `删除了上下文节点`), deletedName);
    }
  },
  confirmContextNode: nodeId => {
    if (stryMutAct_9fa48("1304")) {
      {}
    } else {
      stryCov_9fa48("1304");
      set(s => {
        if (stryMutAct_9fa48("1305")) {
          {}
        } else {
          stryCov_9fa48("1305");
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("1306") ? () => undefined : (stryCov_9fa48("1306"), n => (stryMutAct_9fa48("1309") ? n.nodeId !== nodeId : stryMutAct_9fa48("1308") ? false : stryMutAct_9fa48("1307") ? true : (stryCov_9fa48("1307", "1308", "1309"), n.nodeId === nodeId)) ? stryMutAct_9fa48("1310") ? {} : (stryCov_9fa48("1310"), {
            ...n,
            isActive: stryMutAct_9fa48("1311") ? false : (stryCov_9fa48("1311"), true),
            status: 'confirmed' as const
          }) : n));
          return stryMutAct_9fa48("1312") ? {} : (stryCov_9fa48("1312"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  toggleContextNode: nodeId => {
    if (stryMutAct_9fa48("1313")) {
      {}
    } else {
      stryCov_9fa48("1313");
      set(s => {
        if (stryMutAct_9fa48("1314")) {
          {}
        } else {
          stryCov_9fa48("1314");
          const node = s.contextNodes.find(stryMutAct_9fa48("1315") ? () => undefined : (stryCov_9fa48("1315"), n => stryMutAct_9fa48("1318") ? n.nodeId !== nodeId : stryMutAct_9fa48("1317") ? false : stryMutAct_9fa48("1316") ? true : (stryCov_9fa48("1316", "1317", "1318"), n.nodeId === nodeId)));
          if (stryMutAct_9fa48("1321") ? false : stryMutAct_9fa48("1320") ? true : stryMutAct_9fa48("1319") ? node : (stryCov_9fa48("1319", "1320", "1321"), !node)) return {};
          const isConfirmed = stryMutAct_9fa48("1324") ? node.status !== 'confirmed' : stryMutAct_9fa48("1323") ? false : stryMutAct_9fa48("1322") ? true : (stryCov_9fa48("1322", "1323", "1324"), node.status === (stryMutAct_9fa48("1325") ? "" : (stryCov_9fa48("1325"), 'confirmed')));
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("1326") ? () => undefined : (stryCov_9fa48("1326"), n => (stryMutAct_9fa48("1329") ? n.nodeId !== nodeId : stryMutAct_9fa48("1328") ? false : stryMutAct_9fa48("1327") ? true : (stryCov_9fa48("1327", "1328", "1329"), n.nodeId === nodeId)) ? stryMutAct_9fa48("1330") ? {} : (stryCov_9fa48("1330"), {
            ...n,
            isActive: isConfirmed ? stryMutAct_9fa48("1331") ? true : (stryCov_9fa48("1331"), false) : stryMutAct_9fa48("1332") ? false : (stryCov_9fa48("1332"), true),
            status: isConfirmed ? 'pending' as const : 'confirmed' as const
          }) : n));
          return stryMutAct_9fa48("1333") ? {} : (stryCov_9fa48("1333"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  setContextDraft: stryMutAct_9fa48("1334") ? () => undefined : (stryCov_9fa48("1334"), draft => set(stryMutAct_9fa48("1335") ? {} : (stryCov_9fa48("1335"), {
    contextDraft: draft
  })))
})), stryMutAct_9fa48("1336") ? {} : (stryCov_9fa48("1336"), {
  name: stryMutAct_9fa48("1337") ? "" : (stryCov_9fa48("1337"), 'vibex-context-store'),
  partialize: stryMutAct_9fa48("1338") ? () => undefined : (stryCov_9fa48("1338"), state => stryMutAct_9fa48("1339") ? {} : (stryCov_9fa48("1339"), {
    contextNodes: state.contextNodes,
    boundedGroups: state.boundedGroups,
    boundedEdges: state.boundedEdges,
    phase: state.phase
  }))
})), stryMutAct_9fa48("1340") ? {} : (stryCov_9fa48("1340"), {
  name: stryMutAct_9fa48("1341") ? "" : (stryCov_9fa48("1341"), 'ContextStore')
})));