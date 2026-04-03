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
  if (stryMutAct_9fa48("0")) {
    {}
  } else {
    stryCov_9fa48("0");
    return stryMutAct_9fa48("1") ? `` : (stryCov_9fa48("1"), `${Date.now()}-${stryMutAct_9fa48("2") ? Math.random().toString(36) : (stryCov_9fa48("2"), Math.random().toString(36).slice(2, 9))}`);
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

  // === FlowEdge Slice ===
  flowEdges: import('../types').FlowEdge[];
  addFlowEdge: (edgeData: Omit<import('../types').FlowEdge, 'id'>) => void;
  removeFlowEdge: (id: string) => void;
  clearFlowEdges: () => void;
  setFlowEdges: (edges: import('../types').FlowEdge[]) => void;

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
export const useContextStore = create<ContextStore>()(devtools(persist(stryMutAct_9fa48("3") ? () => undefined : (stryCov_9fa48("3"), (set, get) => stryMutAct_9fa48("4") ? {} : (stryCov_9fa48("4"), {
  // === Phase Slice ===
  phase: stryMutAct_9fa48("5") ? "" : (stryCov_9fa48("5"), 'input'),
  activeTree: null,
  _prevActiveTree: null,
  setPhase: phase => {
    if (stryMutAct_9fa48("6")) {
      {}
    } else {
      stryCov_9fa48("6");
      set(stryMutAct_9fa48("7") ? {} : (stryCov_9fa48("7"), {
        phase
      }));
      get().recomputeActiveTree();
    }
  },
  advancePhase: () => {
    if (stryMutAct_9fa48("8")) {
      {}
    } else {
      stryCov_9fa48("8");
      const {
        phase
      } = get();
      const phaseOrder: Phase[] = stryMutAct_9fa48("9") ? [] : (stryCov_9fa48("9"), [stryMutAct_9fa48("10") ? "" : (stryCov_9fa48("10"), 'input'), stryMutAct_9fa48("11") ? "" : (stryCov_9fa48("11"), 'context'), stryMutAct_9fa48("12") ? "" : (stryCov_9fa48("12"), 'flow'), stryMutAct_9fa48("13") ? "" : (stryCov_9fa48("13"), 'component'), stryMutAct_9fa48("14") ? "" : (stryCov_9fa48("14"), 'prototype')]);
      const idx = phaseOrder.indexOf(phase);
      if (stryMutAct_9fa48("18") ? idx >= phaseOrder.length - 1 : stryMutAct_9fa48("17") ? idx <= phaseOrder.length - 1 : stryMutAct_9fa48("16") ? false : stryMutAct_9fa48("15") ? true : (stryCov_9fa48("15", "16", "17", "18"), idx < (stryMutAct_9fa48("19") ? phaseOrder.length + 1 : (stryCov_9fa48("19"), phaseOrder.length - 1)))) {
        if (stryMutAct_9fa48("20")) {
          {}
        } else {
          stryCov_9fa48("20");
          set(stryMutAct_9fa48("21") ? {} : (stryCov_9fa48("21"), {
            phase: phaseOrder[stryMutAct_9fa48("22") ? idx - 1 : (stryCov_9fa48("22"), idx + 1)]
          }));
          get().recomputeActiveTree();
        }
      }
    }
  },
  setActiveTree: stryMutAct_9fa48("23") ? () => undefined : (stryCov_9fa48("23"), activeTree => set(stryMutAct_9fa48("24") ? () => undefined : (stryCov_9fa48("24"), s => stryMutAct_9fa48("25") ? {} : (stryCov_9fa48("25"), {
    activeTree,
    _prevActiveTree: s.activeTree
  })))),
  recomputeActiveTree: () => {
    if (stryMutAct_9fa48("26")) {
      {}
    } else {
      stryCov_9fa48("26");
      const {
        contextNodes,
        phase,
        _prevActiveTree,
        setActiveTree,
        setPhase
      } = get();
      // Import flowNodes from flowStore (avoids circular import)
      const {
        useFlowStore
      } = require('./flowStore');
      const flows = useFlowStore.getState().flowNodes;
      let newActiveTree: TreeType | null = null;
      if (stryMutAct_9fa48("29") ? phase !== 'input' : stryMutAct_9fa48("28") ? false : stryMutAct_9fa48("27") ? true : (stryCov_9fa48("27", "28", "29"), phase === (stryMutAct_9fa48("30") ? "" : (stryCov_9fa48("30"), 'input')))) {
        if (stryMutAct_9fa48("31")) {
          {}
        } else {
          stryCov_9fa48("31");
          newActiveTree = null;
        }
      } else if (stryMutAct_9fa48("34") ? phase !== 'context' : stryMutAct_9fa48("33") ? false : stryMutAct_9fa48("32") ? true : (stryCov_9fa48("32", "33", "34"), phase === (stryMutAct_9fa48("35") ? "" : (stryCov_9fa48("35"), 'context')))) {
        if (stryMutAct_9fa48("36")) {
          {}
        } else {
          stryCov_9fa48("36");
          const allConfirmed = areAllConfirmed(contextNodes);
          newActiveTree = (stryMutAct_9fa48("39") ? allConfirmed || contextNodes.length > 0 : stryMutAct_9fa48("38") ? false : stryMutAct_9fa48("37") ? true : (stryCov_9fa48("37", "38", "39"), allConfirmed && (stryMutAct_9fa48("42") ? contextNodes.length <= 0 : stryMutAct_9fa48("41") ? contextNodes.length >= 0 : stryMutAct_9fa48("40") ? true : (stryCov_9fa48("40", "41", "42"), contextNodes.length > 0)))) ? stryMutAct_9fa48("43") ? "" : (stryCov_9fa48("43"), 'flow') : stryMutAct_9fa48("44") ? "" : (stryCov_9fa48("44"), 'context');
        }
      } else if (stryMutAct_9fa48("47") ? phase !== 'flow' : stryMutAct_9fa48("46") ? false : stryMutAct_9fa48("45") ? true : (stryCov_9fa48("45", "46", "47"), phase === (stryMutAct_9fa48("48") ? "" : (stryCov_9fa48("48"), 'flow')))) {
        if (stryMutAct_9fa48("49")) {
          {}
        } else {
          stryCov_9fa48("49");
          const flowReady = areAllConfirmed(flows);
          const contextReady = areAllConfirmed(contextNodes);
          newActiveTree = (stryMutAct_9fa48("52") ? flowReady || flows.length > 0 : stryMutAct_9fa48("51") ? false : stryMutAct_9fa48("50") ? true : (stryCov_9fa48("50", "51", "52"), flowReady && (stryMutAct_9fa48("55") ? flows.length <= 0 : stryMutAct_9fa48("54") ? flows.length >= 0 : stryMutAct_9fa48("53") ? true : (stryCov_9fa48("53", "54", "55"), flows.length > 0)))) ? stryMutAct_9fa48("56") ? "" : (stryCov_9fa48("56"), 'component') : stryMutAct_9fa48("57") ? "" : (stryCov_9fa48("57"), 'flow');
          if (stryMutAct_9fa48("60") ? contextReady && flowReady || flows.length > 0 : stryMutAct_9fa48("59") ? false : stryMutAct_9fa48("58") ? true : (stryCov_9fa48("58", "59", "60"), (stryMutAct_9fa48("62") ? contextReady || flowReady : stryMutAct_9fa48("61") ? true : (stryCov_9fa48("61", "62"), contextReady && flowReady)) && (stryMutAct_9fa48("65") ? flows.length <= 0 : stryMutAct_9fa48("64") ? flows.length >= 0 : stryMutAct_9fa48("63") ? true : (stryCov_9fa48("63", "64", "65"), flows.length > 0)))) {
            if (stryMutAct_9fa48("66")) {
              {}
            } else {
              stryCov_9fa48("66");
              setPhase(stryMutAct_9fa48("67") ? "" : (stryCov_9fa48("67"), 'component'));
              return;
            }
          }
        }
      } else if (stryMutAct_9fa48("70") ? phase !== 'component' : stryMutAct_9fa48("69") ? false : stryMutAct_9fa48("68") ? true : (stryCov_9fa48("68", "69", "70"), phase === (stryMutAct_9fa48("71") ? "" : (stryCov_9fa48("71"), 'component')))) {
        if (stryMutAct_9fa48("72")) {
          {}
        } else {
          stryCov_9fa48("72");
          newActiveTree = stryMutAct_9fa48("73") ? "" : (stryCov_9fa48("73"), 'component');
        }
      } else {
        if (stryMutAct_9fa48("74")) {
          {}
        } else {
          stryCov_9fa48("74");
          newActiveTree = null;
        }
      }
      if (stryMutAct_9fa48("77") ? newActiveTree === _prevActiveTree : stryMutAct_9fa48("76") ? false : stryMutAct_9fa48("75") ? true : (stryCov_9fa48("75", "76", "77"), newActiveTree !== _prevActiveTree)) {
        if (stryMutAct_9fa48("78")) {
          {}
        } else {
          stryCov_9fa48("78");
          setActiveTree(newActiveTree);
        }
      } else {
        if (stryMutAct_9fa48("79")) {
          {}
        } else {
          stryCov_9fa48("79");
          setActiveTree(newActiveTree);
        }
      }
    }
  },
  // === Bounded Group Slice ===
  boundedGroups: stryMutAct_9fa48("80") ? ["Stryker was here"] : (stryCov_9fa48("80"), []),
  addBoundedGroup: groupData => {
    if (stryMutAct_9fa48("81")) {
      {}
    } else {
      stryCov_9fa48("81");
      const newGroup: BoundedGroup = stryMutAct_9fa48("82") ? {} : (stryCov_9fa48("82"), {
        ...groupData,
        groupId: generateId()
      });
      set(stryMutAct_9fa48("83") ? () => undefined : (stryCov_9fa48("83"), s => stryMutAct_9fa48("84") ? {} : (stryCov_9fa48("84"), {
        boundedGroups: stryMutAct_9fa48("85") ? [] : (stryCov_9fa48("85"), [...s.boundedGroups, newGroup])
      })));
    }
  },
  removeBoundedGroup: groupId => {
    if (stryMutAct_9fa48("86")) {
      {}
    } else {
      stryCov_9fa48("86");
      set(stryMutAct_9fa48("87") ? () => undefined : (stryCov_9fa48("87"), s => stryMutAct_9fa48("88") ? {} : (stryCov_9fa48("88"), {
        boundedGroups: stryMutAct_9fa48("89") ? s.boundedGroups : (stryCov_9fa48("89"), s.boundedGroups.filter(stryMutAct_9fa48("90") ? () => undefined : (stryCov_9fa48("90"), g => stryMutAct_9fa48("93") ? g.groupId === groupId : stryMutAct_9fa48("92") ? false : stryMutAct_9fa48("91") ? true : (stryCov_9fa48("91", "92", "93"), g.groupId !== groupId))))
      })));
    }
  },
  toggleBoundedGroupVisibility: groupId => {
    if (stryMutAct_9fa48("94")) {
      {}
    } else {
      stryCov_9fa48("94");
      set(stryMutAct_9fa48("95") ? () => undefined : (stryCov_9fa48("95"), s => stryMutAct_9fa48("96") ? {} : (stryCov_9fa48("96"), {
        boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("97") ? () => undefined : (stryCov_9fa48("97"), g => (stryMutAct_9fa48("100") ? g.groupId !== groupId : stryMutAct_9fa48("99") ? false : stryMutAct_9fa48("98") ? true : (stryCov_9fa48("98", "99", "100"), g.groupId === groupId)) ? stryMutAct_9fa48("101") ? {} : (stryCov_9fa48("101"), {
          ...g,
          visible: (stryMutAct_9fa48("104") ? g.visible === undefined && g.visible === true : stryMutAct_9fa48("103") ? false : stryMutAct_9fa48("102") ? true : (stryCov_9fa48("102", "103", "104"), (stryMutAct_9fa48("106") ? g.visible !== undefined : stryMutAct_9fa48("105") ? false : (stryCov_9fa48("105", "106"), g.visible === undefined)) || (stryMutAct_9fa48("108") ? g.visible !== true : stryMutAct_9fa48("107") ? false : (stryCov_9fa48("107", "108"), g.visible === (stryMutAct_9fa48("109") ? false : (stryCov_9fa48("109"), true)))))) ? stryMutAct_9fa48("110") ? true : (stryCov_9fa48("110"), false) : stryMutAct_9fa48("111") ? false : (stryCov_9fa48("111"), true)
        }) : g))
      })));
    }
  },
  updateBoundedGroupLabel: (groupId, label) => {
    if (stryMutAct_9fa48("112")) {
      {}
    } else {
      stryCov_9fa48("112");
      set(stryMutAct_9fa48("113") ? () => undefined : (stryCov_9fa48("113"), s => stryMutAct_9fa48("114") ? {} : (stryCov_9fa48("114"), {
        boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("115") ? () => undefined : (stryCov_9fa48("115"), g => (stryMutAct_9fa48("118") ? g.groupId !== groupId : stryMutAct_9fa48("117") ? false : stryMutAct_9fa48("116") ? true : (stryCov_9fa48("116", "117", "118"), g.groupId === groupId)) ? stryMutAct_9fa48("119") ? {} : (stryCov_9fa48("119"), {
          ...g,
          label
        }) : g))
      })));
    }
  },
  addNodeToGroup: (groupId, nodeId) => {
    if (stryMutAct_9fa48("120")) {
      {}
    } else {
      stryCov_9fa48("120");
      set(stryMutAct_9fa48("121") ? () => undefined : (stryCov_9fa48("121"), s => stryMutAct_9fa48("122") ? {} : (stryCov_9fa48("122"), {
        boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("123") ? () => undefined : (stryCov_9fa48("123"), g => (stryMutAct_9fa48("126") ? g.groupId === groupId || !g.nodeIds.includes(nodeId) : stryMutAct_9fa48("125") ? false : stryMutAct_9fa48("124") ? true : (stryCov_9fa48("124", "125", "126"), (stryMutAct_9fa48("128") ? g.groupId !== groupId : stryMutAct_9fa48("127") ? true : (stryCov_9fa48("127", "128"), g.groupId === groupId)) && (stryMutAct_9fa48("129") ? g.nodeIds.includes(nodeId) : (stryCov_9fa48("129"), !g.nodeIds.includes(nodeId))))) ? stryMutAct_9fa48("130") ? {} : (stryCov_9fa48("130"), {
          ...g,
          nodeIds: stryMutAct_9fa48("131") ? [] : (stryCov_9fa48("131"), [...g.nodeIds, nodeId])
        }) : g))
      })));
    }
  },
  removeNodeFromGroup: (groupId, nodeId) => {
    if (stryMutAct_9fa48("132")) {
      {}
    } else {
      stryCov_9fa48("132");
      set(stryMutAct_9fa48("133") ? () => undefined : (stryCov_9fa48("133"), s => stryMutAct_9fa48("134") ? {} : (stryCov_9fa48("134"), {
        boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("135") ? () => undefined : (stryCov_9fa48("135"), g => (stryMutAct_9fa48("138") ? g.groupId !== groupId : stryMutAct_9fa48("137") ? false : stryMutAct_9fa48("136") ? true : (stryCov_9fa48("136", "137", "138"), g.groupId === groupId)) ? stryMutAct_9fa48("139") ? {} : (stryCov_9fa48("139"), {
          ...g,
          nodeIds: stryMutAct_9fa48("140") ? g.nodeIds : (stryCov_9fa48("140"), g.nodeIds.filter(stryMutAct_9fa48("141") ? () => undefined : (stryCov_9fa48("141"), id => stryMutAct_9fa48("144") ? id === nodeId : stryMutAct_9fa48("143") ? false : stryMutAct_9fa48("142") ? true : (stryCov_9fa48("142", "143", "144"), id !== nodeId))))
        }) : g))
      })));
    }
  },
  clearBoundedGroups: stryMutAct_9fa48("145") ? () => undefined : (stryCov_9fa48("145"), () => set(stryMutAct_9fa48("146") ? {} : (stryCov_9fa48("146"), {
    boundedGroups: stryMutAct_9fa48("147") ? ["Stryker was here"] : (stryCov_9fa48("147"), [])
  }))),
  // === BoundedEdge Slice ===
  boundedEdges: stryMutAct_9fa48("148") ? ["Stryker was here"] : (stryCov_9fa48("148"), []),
  flowEdges: stryMutAct_9fa48("149") ? ["Stryker was here"] : (stryCov_9fa48("149"), []),
  addBoundedEdge: edgeData => {
    if (stryMutAct_9fa48("150")) {
      {}
    } else {
      stryCov_9fa48("150");
      const newEdge: BoundedEdge = stryMutAct_9fa48("151") ? {} : (stryCov_9fa48("151"), {
        ...edgeData,
        id: generateId()
      });
      set(stryMutAct_9fa48("152") ? () => undefined : (stryCov_9fa48("152"), s => stryMutAct_9fa48("153") ? {} : (stryCov_9fa48("153"), {
        boundedEdges: stryMutAct_9fa48("154") ? [] : (stryCov_9fa48("154"), [...s.boundedEdges, newEdge])
      })));
    }
  },
  removeBoundedEdge: id => {
    if (stryMutAct_9fa48("155")) {
      {}
    } else {
      stryCov_9fa48("155");
      set(stryMutAct_9fa48("156") ? () => undefined : (stryCov_9fa48("156"), s => stryMutAct_9fa48("157") ? {} : (stryCov_9fa48("157"), {
        boundedEdges: stryMutAct_9fa48("158") ? s.boundedEdges : (stryCov_9fa48("158"), s.boundedEdges.filter(stryMutAct_9fa48("159") ? () => undefined : (stryCov_9fa48("159"), e => stryMutAct_9fa48("162") ? e.id === id : stryMutAct_9fa48("161") ? false : stryMutAct_9fa48("160") ? true : (stryCov_9fa48("160", "161", "162"), e.id !== id))))
      })));
    }
  },
  clearBoundedEdges: stryMutAct_9fa48("163") ? () => undefined : (stryCov_9fa48("163"), () => set(stryMutAct_9fa48("164") ? {} : (stryCov_9fa48("164"), {
    boundedEdges: stryMutAct_9fa48("165") ? ["Stryker was here"] : (stryCov_9fa48("165"), [])
  }))),
  setBoundedEdges: stryMutAct_9fa48("166") ? () => undefined : (stryCov_9fa48("166"), edges => set(stryMutAct_9fa48("167") ? {} : (stryCov_9fa48("167"), {
    boundedEdges: edges
  }))),
  // === FlowEdge Slice ===
  addFlowEdge: edgeData => {
    if (stryMutAct_9fa48("168")) {
      {}
    } else {
      stryCov_9fa48("168");
      const {
        FlowEdge
      } = require('../types');
      const newEdge: FlowEdge = stryMutAct_9fa48("169") ? {} : (stryCov_9fa48("169"), {
        ...edgeData,
        id: generateId()
      });
      set(stryMutAct_9fa48("170") ? () => undefined : (stryCov_9fa48("170"), s => stryMutAct_9fa48("171") ? {} : (stryCov_9fa48("171"), {
        flowEdges: stryMutAct_9fa48("172") ? [] : (stryCov_9fa48("172"), [...s.flowEdges, newEdge])
      })));
    }
  },
  removeFlowEdge: id => {
    if (stryMutAct_9fa48("173")) {
      {}
    } else {
      stryCov_9fa48("173");
      set(stryMutAct_9fa48("174") ? () => undefined : (stryCov_9fa48("174"), s => stryMutAct_9fa48("175") ? {} : (stryCov_9fa48("175"), {
        flowEdges: stryMutAct_9fa48("176") ? s.flowEdges : (stryCov_9fa48("176"), s.flowEdges.filter(stryMutAct_9fa48("177") ? () => undefined : (stryCov_9fa48("177"), (e: any) => stryMutAct_9fa48("180") ? e.id === id : stryMutAct_9fa48("179") ? false : stryMutAct_9fa48("178") ? true : (stryCov_9fa48("178", "179", "180"), e.id !== id))))
      })));
    }
  },
  clearFlowEdges: stryMutAct_9fa48("181") ? () => undefined : (stryCov_9fa48("181"), () => set(stryMutAct_9fa48("182") ? {} : (stryCov_9fa48("182"), {
    flowEdges: stryMutAct_9fa48("183") ? ["Stryker was here"] : (stryCov_9fa48("183"), [])
  }))),
  setFlowEdges: stryMutAct_9fa48("184") ? () => undefined : (stryCov_9fa48("184"), edges => set(stryMutAct_9fa48("185") ? {} : (stryCov_9fa48("185"), {
    flowEdges: edges
  }))),
  // === Multi-Select Slice ===
  selectedNodeIds: stryMutAct_9fa48("186") ? {} : (stryCov_9fa48("186"), {
    context: stryMutAct_9fa48("187") ? ["Stryker was here"] : (stryCov_9fa48("187"), []),
    flow: stryMutAct_9fa48("188") ? ["Stryker was here"] : (stryCov_9fa48("188"), []),
    component: stryMutAct_9fa48("189") ? ["Stryker was here"] : (stryCov_9fa48("189"), [])
  }),
  toggleNodeSelect: (tree, nodeId) => {
    if (stryMutAct_9fa48("190")) {
      {}
    } else {
      stryCov_9fa48("190");
      set(s => {
        if (stryMutAct_9fa48("191")) {
          {}
        } else {
          stryCov_9fa48("191");
          const current = s.selectedNodeIds[tree];
          const exists = current.includes(nodeId);
          return stryMutAct_9fa48("192") ? {} : (stryCov_9fa48("192"), {
            selectedNodeIds: stryMutAct_9fa48("193") ? {} : (stryCov_9fa48("193"), {
              ...s.selectedNodeIds,
              [tree]: exists ? stryMutAct_9fa48("194") ? current : (stryCov_9fa48("194"), current.filter(stryMutAct_9fa48("195") ? () => undefined : (stryCov_9fa48("195"), id => stryMutAct_9fa48("198") ? id === nodeId : stryMutAct_9fa48("197") ? false : stryMutAct_9fa48("196") ? true : (stryCov_9fa48("196", "197", "198"), id !== nodeId)))) : stryMutAct_9fa48("199") ? [] : (stryCov_9fa48("199"), [...current, nodeId])
            })
          });
        }
      });
    }
  },
  selectNode: (tree, nodeId) => {
    if (stryMutAct_9fa48("200")) {
      {}
    } else {
      stryCov_9fa48("200");
      set(stryMutAct_9fa48("201") ? () => undefined : (stryCov_9fa48("201"), s => stryMutAct_9fa48("202") ? {} : (stryCov_9fa48("202"), {
        selectedNodeIds: stryMutAct_9fa48("203") ? {} : (stryCov_9fa48("203"), {
          ...s.selectedNodeIds,
          [tree]: stryMutAct_9fa48("204") ? [] : (stryCov_9fa48("204"), [nodeId])
        })
      })));
    }
  },
  clearNodeSelection: tree => {
    if (stryMutAct_9fa48("205")) {
      {}
    } else {
      stryCov_9fa48("205");
      set(stryMutAct_9fa48("206") ? () => undefined : (stryCov_9fa48("206"), s => stryMutAct_9fa48("207") ? {} : (stryCov_9fa48("207"), {
        selectedNodeIds: stryMutAct_9fa48("208") ? {} : (stryCov_9fa48("208"), {
          ...s.selectedNodeIds,
          [tree]: stryMutAct_9fa48("209") ? ["Stryker was here"] : (stryCov_9fa48("209"), [])
        })
      })));
    }
  },
  selectAllNodes: tree => {
    if (stryMutAct_9fa48("210")) {
      {}
    } else {
      stryCov_9fa48("210");
      set(s => {
        if (stryMutAct_9fa48("211")) {
          {}
        } else {
          stryCov_9fa48("211");
          if (stryMutAct_9fa48("214") ? tree !== 'context' : stryMutAct_9fa48("213") ? false : stryMutAct_9fa48("212") ? true : (stryCov_9fa48("212", "213", "214"), tree === (stryMutAct_9fa48("215") ? "" : (stryCov_9fa48("215"), 'context')))) {
            if (stryMutAct_9fa48("216")) {
              {}
            } else {
              stryCov_9fa48("216");
              return stryMutAct_9fa48("217") ? {} : (stryCov_9fa48("217"), {
                selectedNodeIds: stryMutAct_9fa48("218") ? {} : (stryCov_9fa48("218"), {
                  ...s.selectedNodeIds,
                  context: s.contextNodes.map(stryMutAct_9fa48("219") ? () => undefined : (stryCov_9fa48("219"), n => n.nodeId))
                })
              });
            }
          }
          // flow and component need state from other stores — use dynamic require
          if (stryMutAct_9fa48("222") ? tree !== 'flow' : stryMutAct_9fa48("221") ? false : stryMutAct_9fa48("220") ? true : (stryCov_9fa48("220", "221", "222"), tree === (stryMutAct_9fa48("223") ? "" : (stryCov_9fa48("223"), 'flow')))) {
            if (stryMutAct_9fa48("224")) {
              {}
            } else {
              stryCov_9fa48("224");
              const {
                useFlowStore
              } = require('./flowStore');
              return stryMutAct_9fa48("225") ? {} : (stryCov_9fa48("225"), {
                selectedNodeIds: stryMutAct_9fa48("226") ? {} : (stryCov_9fa48("226"), {
                  ...s.selectedNodeIds,
                  flow: useFlowStore.getState().flowNodes.map(stryMutAct_9fa48("227") ? () => undefined : (stryCov_9fa48("227"), (n: any) => n.nodeId))
                })
              });
            }
          }
          // component: use dynamic require
          const {
            useComponentStore
          } = require('./componentStore');
          return stryMutAct_9fa48("228") ? {} : (stryCov_9fa48("228"), {
            selectedNodeIds: stryMutAct_9fa48("229") ? {} : (stryCov_9fa48("229"), {
              ...s.selectedNodeIds,
              component: useComponentStore.getState().componentNodes.map(stryMutAct_9fa48("230") ? () => undefined : (stryCov_9fa48("230"), (n: any) => n.nodeId))
            })
          });
        }
      });
    }
  },
  deleteSelectedNodes: (tree, deleteContextNode, deleteFlowNode) => {
    if (stryMutAct_9fa48("231")) {
      {}
    } else {
      stryCov_9fa48("231");
      const {
        selectedNodeIds
      } = get();
      const toDelete = new Set(selectedNodeIds[tree]);
      if (stryMutAct_9fa48("234") ? toDelete.size !== 0 : stryMutAct_9fa48("233") ? false : stryMutAct_9fa48("232") ? true : (stryCov_9fa48("232", "233", "234"), toDelete.size === 0)) return;
      const historyStore = getHistoryStore();
      if (stryMutAct_9fa48("237") ? tree !== 'context' : stryMutAct_9fa48("236") ? false : stryMutAct_9fa48("235") ? true : (stryCov_9fa48("235", "236", "237"), tree === (stryMutAct_9fa48("238") ? "" : (stryCov_9fa48("238"), 'context')))) {
        if (stryMutAct_9fa48("239")) {
          {}
        } else {
          stryCov_9fa48("239");
          const nodes = get().contextNodes;
          historyStore.recordSnapshot(stryMutAct_9fa48("240") ? "" : (stryCov_9fa48("240"), 'context'), nodes);
          toDelete.forEach(stryMutAct_9fa48("241") ? () => undefined : (stryCov_9fa48("241"), id => deleteContextNode(id)));
        }
      } else if (stryMutAct_9fa48("244") ? tree !== 'flow' : stryMutAct_9fa48("243") ? false : stryMutAct_9fa48("242") ? true : (stryCov_9fa48("242", "243", "244"), tree === (stryMutAct_9fa48("245") ? "" : (stryCov_9fa48("245"), 'flow')))) {
        if (stryMutAct_9fa48("246")) {
          {}
        } else {
          stryCov_9fa48("246");
          const {
            useFlowStore
          } = require('./flowStore');
          const nodes = useFlowStore.getState().flowNodes;
          historyStore.recordSnapshot(stryMutAct_9fa48("247") ? "" : (stryCov_9fa48("247"), 'flow'), nodes);
          toDelete.forEach(stryMutAct_9fa48("248") ? () => undefined : (stryCov_9fa48("248"), id => deleteFlowNode(id)));
        }
      }
      set(stryMutAct_9fa48("249") ? () => undefined : (stryCov_9fa48("249"), s => stryMutAct_9fa48("250") ? {} : (stryCov_9fa48("250"), {
        selectedNodeIds: stryMutAct_9fa48("251") ? {} : (stryCov_9fa48("251"), {
          ...s.selectedNodeIds,
          [tree]: stryMutAct_9fa48("252") ? ["Stryker was here"] : (stryCov_9fa48("252"), [])
        })
      })));
    }
  },
  // === Context Slice ===
  contextNodes: stryMutAct_9fa48("253") ? ["Stryker was here"] : (stryCov_9fa48("253"), []),
  contextDraft: null,
  setContextNodes: stryMutAct_9fa48("254") ? () => undefined : (stryCov_9fa48("254"), nodes => set(stryMutAct_9fa48("255") ? {} : (stryCov_9fa48("255"), {
    contextNodes: nodes
  }))),
  addContextNode: data => {
    if (stryMutAct_9fa48("256")) {
      {}
    } else {
      stryCov_9fa48("256");
      const newNode: BoundedContextNode = stryMutAct_9fa48("257") ? {} : (stryCov_9fa48("257"), {
        nodeId: generateId(),
        name: data.name,
        description: data.description,
        type: data.type,
        isActive: stryMutAct_9fa48("258") ? true : (stryCov_9fa48("258"), false),
        status: stryMutAct_9fa48("259") ? "" : (stryCov_9fa48("259"), 'pending'),
        children: stryMutAct_9fa48("260") ? ["Stryker was here"] : (stryCov_9fa48("260"), [])
      });
      set(s => {
        if (stryMutAct_9fa48("261")) {
          {}
        } else {
          stryCov_9fa48("261");
          const newNodes = stryMutAct_9fa48("262") ? [] : (stryCov_9fa48("262"), [...s.contextNodes, stryMutAct_9fa48("263") ? {} : (stryCov_9fa48("263"), {
            ...newNode
          })]);
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("264") ? "" : (stryCov_9fa48("264"), 'context'), newNodes);
          return stryMutAct_9fa48("265") ? {} : (stryCov_9fa48("265"), {
            contextNodes: newNodes
          });
        }
      });
      postContextActionMessage(stryMutAct_9fa48("266") ? `` : (stryCov_9fa48("266"), `添加了上下文节点`), data.name);
    }
  },
  editContextNode: (nodeId, data) => {
    if (stryMutAct_9fa48("267")) {
      {}
    } else {
      stryCov_9fa48("267");
      set(s => {
        if (stryMutAct_9fa48("268")) {
          {}
        } else {
          stryCov_9fa48("268");
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("269") ? () => undefined : (stryCov_9fa48("269"), n => (stryMutAct_9fa48("272") ? n.nodeId !== nodeId : stryMutAct_9fa48("271") ? false : stryMutAct_9fa48("270") ? true : (stryCov_9fa48("270", "271", "272"), n.nodeId === nodeId)) ? stryMutAct_9fa48("273") ? {} : (stryCov_9fa48("273"), {
            ...n,
            ...data,
            status: 'pending' as const
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("274") ? "" : (stryCov_9fa48("274"), 'context'), newNodes);
          return stryMutAct_9fa48("275") ? {} : (stryCov_9fa48("275"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  deleteContextNode: nodeId => {
    if (stryMutAct_9fa48("276")) {
      {}
    } else {
      stryCov_9fa48("276");
      const nodeToDelete = get().contextNodes.find(stryMutAct_9fa48("277") ? () => undefined : (stryCov_9fa48("277"), n => stryMutAct_9fa48("280") ? n.nodeId !== nodeId : stryMutAct_9fa48("279") ? false : stryMutAct_9fa48("278") ? true : (stryCov_9fa48("278", "279", "280"), n.nodeId === nodeId)));
      const deletedName = stryMutAct_9fa48("281") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("281"), (stryMutAct_9fa48("282") ? nodeToDelete.name : (stryCov_9fa48("282"), nodeToDelete?.name)) ?? nodeId);
      set(s => {
        if (stryMutAct_9fa48("283")) {
          {}
        } else {
          stryCov_9fa48("283");
          const newNodes = stryMutAct_9fa48("284") ? s.contextNodes : (stryCov_9fa48("284"), s.contextNodes.filter(stryMutAct_9fa48("285") ? () => undefined : (stryCov_9fa48("285"), n => stryMutAct_9fa48("288") ? n.nodeId === nodeId : stryMutAct_9fa48("287") ? false : stryMutAct_9fa48("286") ? true : (stryCov_9fa48("286", "287", "288"), n.nodeId !== nodeId))));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("289") ? "" : (stryCov_9fa48("289"), 'context'), newNodes);
          return stryMutAct_9fa48("290") ? {} : (stryCov_9fa48("290"), {
            contextNodes: newNodes
          });
        }
      });
      postContextActionMessage(stryMutAct_9fa48("291") ? `` : (stryCov_9fa48("291"), `删除了上下文节点`), deletedName);
    }
  },
  confirmContextNode: nodeId => {
    if (stryMutAct_9fa48("292")) {
      {}
    } else {
      stryCov_9fa48("292");
      set(s => {
        if (stryMutAct_9fa48("293")) {
          {}
        } else {
          stryCov_9fa48("293");
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("294") ? () => undefined : (stryCov_9fa48("294"), n => (stryMutAct_9fa48("297") ? n.nodeId !== nodeId : stryMutAct_9fa48("296") ? false : stryMutAct_9fa48("295") ? true : (stryCov_9fa48("295", "296", "297"), n.nodeId === nodeId)) ? stryMutAct_9fa48("298") ? {} : (stryCov_9fa48("298"), {
            ...n,
            isActive: stryMutAct_9fa48("299") ? false : (stryCov_9fa48("299"), true),
            status: 'confirmed' as const
          }) : n));
          return stryMutAct_9fa48("300") ? {} : (stryCov_9fa48("300"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  toggleContextNode: nodeId => {
    if (stryMutAct_9fa48("301")) {
      {}
    } else {
      stryCov_9fa48("301");
      set(s => {
        if (stryMutAct_9fa48("302")) {
          {}
        } else {
          stryCov_9fa48("302");
          const node = s.contextNodes.find(stryMutAct_9fa48("303") ? () => undefined : (stryCov_9fa48("303"), n => stryMutAct_9fa48("306") ? n.nodeId !== nodeId : stryMutAct_9fa48("305") ? false : stryMutAct_9fa48("304") ? true : (stryCov_9fa48("304", "305", "306"), n.nodeId === nodeId)));
          if (stryMutAct_9fa48("309") ? false : stryMutAct_9fa48("308") ? true : stryMutAct_9fa48("307") ? node : (stryCov_9fa48("307", "308", "309"), !node)) return {};
          const isConfirmed = stryMutAct_9fa48("312") ? node.status !== 'confirmed' : stryMutAct_9fa48("311") ? false : stryMutAct_9fa48("310") ? true : (stryCov_9fa48("310", "311", "312"), node.status === (stryMutAct_9fa48("313") ? "" : (stryCov_9fa48("313"), 'confirmed')));
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("314") ? () => undefined : (stryCov_9fa48("314"), n => (stryMutAct_9fa48("317") ? n.nodeId !== nodeId : stryMutAct_9fa48("316") ? false : stryMutAct_9fa48("315") ? true : (stryCov_9fa48("315", "316", "317"), n.nodeId === nodeId)) ? stryMutAct_9fa48("318") ? {} : (stryCov_9fa48("318"), {
            ...n,
            isActive: isConfirmed ? stryMutAct_9fa48("319") ? true : (stryCov_9fa48("319"), false) : stryMutAct_9fa48("320") ? false : (stryCov_9fa48("320"), true),
            status: isConfirmed ? 'pending' as const : 'confirmed' as const
          }) : n));
          return stryMutAct_9fa48("321") ? {} : (stryCov_9fa48("321"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  setContextDraft: stryMutAct_9fa48("322") ? () => undefined : (stryCov_9fa48("322"), draft => set(stryMutAct_9fa48("323") ? {} : (stryCov_9fa48("323"), {
    contextDraft: draft
  })))
})), stryMutAct_9fa48("324") ? {} : (stryCov_9fa48("324"), {
  name: stryMutAct_9fa48("325") ? "" : (stryCov_9fa48("325"), 'vibex-context-store'),
  partialize: stryMutAct_9fa48("326") ? () => undefined : (stryCov_9fa48("326"), state => stryMutAct_9fa48("327") ? {} : (stryCov_9fa48("327"), {
    contextNodes: state.contextNodes,
    boundedGroups: state.boundedGroups,
    boundedEdges: state.boundedEdges,
    phase: state.phase
  }))
})), stryMutAct_9fa48("328") ? {} : (stryCov_9fa48("328"), {
  name: stryMutAct_9fa48("329") ? "" : (stryCov_9fa48("329"), 'ContextStore')
})));