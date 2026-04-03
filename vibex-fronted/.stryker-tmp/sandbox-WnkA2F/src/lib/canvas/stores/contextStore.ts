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
  if (stryMutAct_9fa48("184")) {
    {}
  } else {
    stryCov_9fa48("184");
    return stryMutAct_9fa48("185") ? `` : (stryCov_9fa48("185"), `${Date.now()}-${stryMutAct_9fa48("186") ? Math.random().toString(36) : (stryCov_9fa48("186"), Math.random().toString(36).slice(2, 9))}`);
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
export const useContextStore = create<ContextStore>()(devtools(persist(stryMutAct_9fa48("187") ? () => undefined : (stryCov_9fa48("187"), (set, get) => stryMutAct_9fa48("188") ? {} : (stryCov_9fa48("188"), {
  // === Phase Slice ===
  phase: stryMutAct_9fa48("189") ? "" : (stryCov_9fa48("189"), 'input'),
  activeTree: null,
  _prevActiveTree: null,
  setPhase: phase => {
    if (stryMutAct_9fa48("190")) {
      {}
    } else {
      stryCov_9fa48("190");
      set(stryMutAct_9fa48("191") ? {} : (stryCov_9fa48("191"), {
        phase
      }));
      get().recomputeActiveTree();
    }
  },
  advancePhase: () => {
    if (stryMutAct_9fa48("192")) {
      {}
    } else {
      stryCov_9fa48("192");
      const {
        phase
      } = get();
      const phaseOrder: Phase[] = stryMutAct_9fa48("193") ? [] : (stryCov_9fa48("193"), [stryMutAct_9fa48("194") ? "" : (stryCov_9fa48("194"), 'input'), stryMutAct_9fa48("195") ? "" : (stryCov_9fa48("195"), 'context'), stryMutAct_9fa48("196") ? "" : (stryCov_9fa48("196"), 'flow'), stryMutAct_9fa48("197") ? "" : (stryCov_9fa48("197"), 'component'), stryMutAct_9fa48("198") ? "" : (stryCov_9fa48("198"), 'prototype')]);
      const idx = phaseOrder.indexOf(phase);
      if (stryMutAct_9fa48("202") ? idx >= phaseOrder.length - 1 : stryMutAct_9fa48("201") ? idx <= phaseOrder.length - 1 : stryMutAct_9fa48("200") ? false : stryMutAct_9fa48("199") ? true : (stryCov_9fa48("199", "200", "201", "202"), idx < (stryMutAct_9fa48("203") ? phaseOrder.length + 1 : (stryCov_9fa48("203"), phaseOrder.length - 1)))) {
        if (stryMutAct_9fa48("204")) {
          {}
        } else {
          stryCov_9fa48("204");
          set(stryMutAct_9fa48("205") ? {} : (stryCov_9fa48("205"), {
            phase: phaseOrder[stryMutAct_9fa48("206") ? idx - 1 : (stryCov_9fa48("206"), idx + 1)]
          }));
          get().recomputeActiveTree();
        }
      }
    }
  },
  setActiveTree: stryMutAct_9fa48("207") ? () => undefined : (stryCov_9fa48("207"), activeTree => set(stryMutAct_9fa48("208") ? () => undefined : (stryCov_9fa48("208"), s => stryMutAct_9fa48("209") ? {} : (stryCov_9fa48("209"), {
    activeTree,
    _prevActiveTree: s.activeTree
  })))),
  recomputeActiveTree: () => {
    if (stryMutAct_9fa48("210")) {
      {}
    } else {
      stryCov_9fa48("210");
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
      if (stryMutAct_9fa48("213") ? phase !== 'input' : stryMutAct_9fa48("212") ? false : stryMutAct_9fa48("211") ? true : (stryCov_9fa48("211", "212", "213"), phase === (stryMutAct_9fa48("214") ? "" : (stryCov_9fa48("214"), 'input')))) {
        if (stryMutAct_9fa48("215")) {
          {}
        } else {
          stryCov_9fa48("215");
          newActiveTree = null;
        }
      } else if (stryMutAct_9fa48("218") ? phase !== 'context' : stryMutAct_9fa48("217") ? false : stryMutAct_9fa48("216") ? true : (stryCov_9fa48("216", "217", "218"), phase === (stryMutAct_9fa48("219") ? "" : (stryCov_9fa48("219"), 'context')))) {
        if (stryMutAct_9fa48("220")) {
          {}
        } else {
          stryCov_9fa48("220");
          const allConfirmed = areAllConfirmed(contextNodes);
          newActiveTree = (stryMutAct_9fa48("223") ? allConfirmed || contextNodes.length > 0 : stryMutAct_9fa48("222") ? false : stryMutAct_9fa48("221") ? true : (stryCov_9fa48("221", "222", "223"), allConfirmed && (stryMutAct_9fa48("226") ? contextNodes.length <= 0 : stryMutAct_9fa48("225") ? contextNodes.length >= 0 : stryMutAct_9fa48("224") ? true : (stryCov_9fa48("224", "225", "226"), contextNodes.length > 0)))) ? stryMutAct_9fa48("227") ? "" : (stryCov_9fa48("227"), 'flow') : stryMutAct_9fa48("228") ? "" : (stryCov_9fa48("228"), 'context');
        }
      } else if (stryMutAct_9fa48("231") ? phase !== 'flow' : stryMutAct_9fa48("230") ? false : stryMutAct_9fa48("229") ? true : (stryCov_9fa48("229", "230", "231"), phase === (stryMutAct_9fa48("232") ? "" : (stryCov_9fa48("232"), 'flow')))) {
        if (stryMutAct_9fa48("233")) {
          {}
        } else {
          stryCov_9fa48("233");
          const flowReady = areAllConfirmed(flows);
          const contextReady = areAllConfirmed(contextNodes);
          newActiveTree = (stryMutAct_9fa48("236") ? flowReady || flows.length > 0 : stryMutAct_9fa48("235") ? false : stryMutAct_9fa48("234") ? true : (stryCov_9fa48("234", "235", "236"), flowReady && (stryMutAct_9fa48("239") ? flows.length <= 0 : stryMutAct_9fa48("238") ? flows.length >= 0 : stryMutAct_9fa48("237") ? true : (stryCov_9fa48("237", "238", "239"), flows.length > 0)))) ? stryMutAct_9fa48("240") ? "" : (stryCov_9fa48("240"), 'component') : stryMutAct_9fa48("241") ? "" : (stryCov_9fa48("241"), 'flow');
          if (stryMutAct_9fa48("244") ? contextReady && flowReady || flows.length > 0 : stryMutAct_9fa48("243") ? false : stryMutAct_9fa48("242") ? true : (stryCov_9fa48("242", "243", "244"), (stryMutAct_9fa48("246") ? contextReady || flowReady : stryMutAct_9fa48("245") ? true : (stryCov_9fa48("245", "246"), contextReady && flowReady)) && (stryMutAct_9fa48("249") ? flows.length <= 0 : stryMutAct_9fa48("248") ? flows.length >= 0 : stryMutAct_9fa48("247") ? true : (stryCov_9fa48("247", "248", "249"), flows.length > 0)))) {
            if (stryMutAct_9fa48("250")) {
              {}
            } else {
              stryCov_9fa48("250");
              setPhase(stryMutAct_9fa48("251") ? "" : (stryCov_9fa48("251"), 'component'));
              return;
            }
          }
        }
      } else if (stryMutAct_9fa48("254") ? phase !== 'component' : stryMutAct_9fa48("253") ? false : stryMutAct_9fa48("252") ? true : (stryCov_9fa48("252", "253", "254"), phase === (stryMutAct_9fa48("255") ? "" : (stryCov_9fa48("255"), 'component')))) {
        if (stryMutAct_9fa48("256")) {
          {}
        } else {
          stryCov_9fa48("256");
          newActiveTree = stryMutAct_9fa48("257") ? "" : (stryCov_9fa48("257"), 'component');
        }
      } else {
        if (stryMutAct_9fa48("258")) {
          {}
        } else {
          stryCov_9fa48("258");
          newActiveTree = null;
        }
      }
      if (stryMutAct_9fa48("261") ? newActiveTree === _prevActiveTree : stryMutAct_9fa48("260") ? false : stryMutAct_9fa48("259") ? true : (stryCov_9fa48("259", "260", "261"), newActiveTree !== _prevActiveTree)) {
        if (stryMutAct_9fa48("262")) {
          {}
        } else {
          stryCov_9fa48("262");
          setActiveTree(newActiveTree);
        }
      } else {
        if (stryMutAct_9fa48("263")) {
          {}
        } else {
          stryCov_9fa48("263");
          setActiveTree(newActiveTree);
        }
      }
    }
  },
  // === Bounded Group Slice ===
  boundedGroups: stryMutAct_9fa48("264") ? ["Stryker was here"] : (stryCov_9fa48("264"), []),
  addBoundedGroup: groupData => {
    if (stryMutAct_9fa48("265")) {
      {}
    } else {
      stryCov_9fa48("265");
      const newGroup: BoundedGroup = stryMutAct_9fa48("266") ? {} : (stryCov_9fa48("266"), {
        ...groupData,
        groupId: generateId()
      });
      set(stryMutAct_9fa48("267") ? () => undefined : (stryCov_9fa48("267"), s => stryMutAct_9fa48("268") ? {} : (stryCov_9fa48("268"), {
        boundedGroups: stryMutAct_9fa48("269") ? [] : (stryCov_9fa48("269"), [...s.boundedGroups, newGroup])
      })));
    }
  },
  removeBoundedGroup: groupId => {
    if (stryMutAct_9fa48("270")) {
      {}
    } else {
      stryCov_9fa48("270");
      set(stryMutAct_9fa48("271") ? () => undefined : (stryCov_9fa48("271"), s => stryMutAct_9fa48("272") ? {} : (stryCov_9fa48("272"), {
        boundedGroups: stryMutAct_9fa48("273") ? s.boundedGroups : (stryCov_9fa48("273"), s.boundedGroups.filter(stryMutAct_9fa48("274") ? () => undefined : (stryCov_9fa48("274"), g => stryMutAct_9fa48("277") ? g.groupId === groupId : stryMutAct_9fa48("276") ? false : stryMutAct_9fa48("275") ? true : (stryCov_9fa48("275", "276", "277"), g.groupId !== groupId))))
      })));
    }
  },
  toggleBoundedGroupVisibility: groupId => {
    if (stryMutAct_9fa48("278")) {
      {}
    } else {
      stryCov_9fa48("278");
      set(stryMutAct_9fa48("279") ? () => undefined : (stryCov_9fa48("279"), s => stryMutAct_9fa48("280") ? {} : (stryCov_9fa48("280"), {
        boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("281") ? () => undefined : (stryCov_9fa48("281"), g => (stryMutAct_9fa48("284") ? g.groupId !== groupId : stryMutAct_9fa48("283") ? false : stryMutAct_9fa48("282") ? true : (stryCov_9fa48("282", "283", "284"), g.groupId === groupId)) ? stryMutAct_9fa48("285") ? {} : (stryCov_9fa48("285"), {
          ...g,
          visible: (stryMutAct_9fa48("288") ? g.visible === undefined && g.visible === true : stryMutAct_9fa48("287") ? false : stryMutAct_9fa48("286") ? true : (stryCov_9fa48("286", "287", "288"), (stryMutAct_9fa48("290") ? g.visible !== undefined : stryMutAct_9fa48("289") ? false : (stryCov_9fa48("289", "290"), g.visible === undefined)) || (stryMutAct_9fa48("292") ? g.visible !== true : stryMutAct_9fa48("291") ? false : (stryCov_9fa48("291", "292"), g.visible === (stryMutAct_9fa48("293") ? false : (stryCov_9fa48("293"), true)))))) ? stryMutAct_9fa48("294") ? true : (stryCov_9fa48("294"), false) : stryMutAct_9fa48("295") ? false : (stryCov_9fa48("295"), true)
        }) : g))
      })));
    }
  },
  updateBoundedGroupLabel: (groupId, label) => {
    if (stryMutAct_9fa48("296")) {
      {}
    } else {
      stryCov_9fa48("296");
      set(stryMutAct_9fa48("297") ? () => undefined : (stryCov_9fa48("297"), s => stryMutAct_9fa48("298") ? {} : (stryCov_9fa48("298"), {
        boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("299") ? () => undefined : (stryCov_9fa48("299"), g => (stryMutAct_9fa48("302") ? g.groupId !== groupId : stryMutAct_9fa48("301") ? false : stryMutAct_9fa48("300") ? true : (stryCov_9fa48("300", "301", "302"), g.groupId === groupId)) ? stryMutAct_9fa48("303") ? {} : (stryCov_9fa48("303"), {
          ...g,
          label
        }) : g))
      })));
    }
  },
  addNodeToGroup: (groupId, nodeId) => {
    if (stryMutAct_9fa48("304")) {
      {}
    } else {
      stryCov_9fa48("304");
      set(stryMutAct_9fa48("305") ? () => undefined : (stryCov_9fa48("305"), s => stryMutAct_9fa48("306") ? {} : (stryCov_9fa48("306"), {
        boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("307") ? () => undefined : (stryCov_9fa48("307"), g => (stryMutAct_9fa48("310") ? g.groupId === groupId || !g.nodeIds.includes(nodeId) : stryMutAct_9fa48("309") ? false : stryMutAct_9fa48("308") ? true : (stryCov_9fa48("308", "309", "310"), (stryMutAct_9fa48("312") ? g.groupId !== groupId : stryMutAct_9fa48("311") ? true : (stryCov_9fa48("311", "312"), g.groupId === groupId)) && (stryMutAct_9fa48("313") ? g.nodeIds.includes(nodeId) : (stryCov_9fa48("313"), !g.nodeIds.includes(nodeId))))) ? stryMutAct_9fa48("314") ? {} : (stryCov_9fa48("314"), {
          ...g,
          nodeIds: stryMutAct_9fa48("315") ? [] : (stryCov_9fa48("315"), [...g.nodeIds, nodeId])
        }) : g))
      })));
    }
  },
  removeNodeFromGroup: (groupId, nodeId) => {
    if (stryMutAct_9fa48("316")) {
      {}
    } else {
      stryCov_9fa48("316");
      set(stryMutAct_9fa48("317") ? () => undefined : (stryCov_9fa48("317"), s => stryMutAct_9fa48("318") ? {} : (stryCov_9fa48("318"), {
        boundedGroups: s.boundedGroups.map(stryMutAct_9fa48("319") ? () => undefined : (stryCov_9fa48("319"), g => (stryMutAct_9fa48("322") ? g.groupId !== groupId : stryMutAct_9fa48("321") ? false : stryMutAct_9fa48("320") ? true : (stryCov_9fa48("320", "321", "322"), g.groupId === groupId)) ? stryMutAct_9fa48("323") ? {} : (stryCov_9fa48("323"), {
          ...g,
          nodeIds: stryMutAct_9fa48("324") ? g.nodeIds : (stryCov_9fa48("324"), g.nodeIds.filter(stryMutAct_9fa48("325") ? () => undefined : (stryCov_9fa48("325"), id => stryMutAct_9fa48("328") ? id === nodeId : stryMutAct_9fa48("327") ? false : stryMutAct_9fa48("326") ? true : (stryCov_9fa48("326", "327", "328"), id !== nodeId))))
        }) : g))
      })));
    }
  },
  clearBoundedGroups: stryMutAct_9fa48("329") ? () => undefined : (stryCov_9fa48("329"), () => set(stryMutAct_9fa48("330") ? {} : (stryCov_9fa48("330"), {
    boundedGroups: stryMutAct_9fa48("331") ? ["Stryker was here"] : (stryCov_9fa48("331"), [])
  }))),
  // === BoundedEdge Slice ===
  boundedEdges: stryMutAct_9fa48("332") ? ["Stryker was here"] : (stryCov_9fa48("332"), []),
  flowEdges: stryMutAct_9fa48("333") ? ["Stryker was here"] : (stryCov_9fa48("333"), []),
  addBoundedEdge: edgeData => {
    if (stryMutAct_9fa48("334")) {
      {}
    } else {
      stryCov_9fa48("334");
      const newEdge: BoundedEdge = stryMutAct_9fa48("335") ? {} : (stryCov_9fa48("335"), {
        ...edgeData,
        id: generateId()
      });
      set(stryMutAct_9fa48("336") ? () => undefined : (stryCov_9fa48("336"), s => stryMutAct_9fa48("337") ? {} : (stryCov_9fa48("337"), {
        boundedEdges: stryMutAct_9fa48("338") ? [] : (stryCov_9fa48("338"), [...s.boundedEdges, newEdge])
      })));
    }
  },
  removeBoundedEdge: id => {
    if (stryMutAct_9fa48("339")) {
      {}
    } else {
      stryCov_9fa48("339");
      set(stryMutAct_9fa48("340") ? () => undefined : (stryCov_9fa48("340"), s => stryMutAct_9fa48("341") ? {} : (stryCov_9fa48("341"), {
        boundedEdges: stryMutAct_9fa48("342") ? s.boundedEdges : (stryCov_9fa48("342"), s.boundedEdges.filter(stryMutAct_9fa48("343") ? () => undefined : (stryCov_9fa48("343"), e => stryMutAct_9fa48("346") ? e.id === id : stryMutAct_9fa48("345") ? false : stryMutAct_9fa48("344") ? true : (stryCov_9fa48("344", "345", "346"), e.id !== id))))
      })));
    }
  },
  clearBoundedEdges: stryMutAct_9fa48("347") ? () => undefined : (stryCov_9fa48("347"), () => set(stryMutAct_9fa48("348") ? {} : (stryCov_9fa48("348"), {
    boundedEdges: stryMutAct_9fa48("349") ? ["Stryker was here"] : (stryCov_9fa48("349"), [])
  }))),
  setBoundedEdges: stryMutAct_9fa48("350") ? () => undefined : (stryCov_9fa48("350"), edges => set(stryMutAct_9fa48("351") ? {} : (stryCov_9fa48("351"), {
    boundedEdges: edges
  }))),
  // === FlowEdge Slice ===
  addFlowEdge: edgeData => {
    if (stryMutAct_9fa48("352")) {
      {}
    } else {
      stryCov_9fa48("352");
      const {
        FlowEdge
      } = require('../types');
      const newEdge: FlowEdge = stryMutAct_9fa48("353") ? {} : (stryCov_9fa48("353"), {
        ...edgeData,
        id: generateId()
      });
      set(stryMutAct_9fa48("354") ? () => undefined : (stryCov_9fa48("354"), s => stryMutAct_9fa48("355") ? {} : (stryCov_9fa48("355"), {
        flowEdges: stryMutAct_9fa48("356") ? [] : (stryCov_9fa48("356"), [...s.flowEdges, newEdge])
      })));
    }
  },
  removeFlowEdge: id => {
    if (stryMutAct_9fa48("357")) {
      {}
    } else {
      stryCov_9fa48("357");
      set(stryMutAct_9fa48("358") ? () => undefined : (stryCov_9fa48("358"), s => stryMutAct_9fa48("359") ? {} : (stryCov_9fa48("359"), {
        flowEdges: stryMutAct_9fa48("360") ? s.flowEdges : (stryCov_9fa48("360"), s.flowEdges.filter(stryMutAct_9fa48("361") ? () => undefined : (stryCov_9fa48("361"), (e: any) => stryMutAct_9fa48("364") ? e.id === id : stryMutAct_9fa48("363") ? false : stryMutAct_9fa48("362") ? true : (stryCov_9fa48("362", "363", "364"), e.id !== id))))
      })));
    }
  },
  clearFlowEdges: stryMutAct_9fa48("365") ? () => undefined : (stryCov_9fa48("365"), () => set(stryMutAct_9fa48("366") ? {} : (stryCov_9fa48("366"), {
    flowEdges: stryMutAct_9fa48("367") ? ["Stryker was here"] : (stryCov_9fa48("367"), [])
  }))),
  setFlowEdges: stryMutAct_9fa48("368") ? () => undefined : (stryCov_9fa48("368"), edges => set(stryMutAct_9fa48("369") ? {} : (stryCov_9fa48("369"), {
    flowEdges: edges
  }))),
  // === Multi-Select Slice ===
  selectedNodeIds: stryMutAct_9fa48("370") ? {} : (stryCov_9fa48("370"), {
    context: stryMutAct_9fa48("371") ? ["Stryker was here"] : (stryCov_9fa48("371"), []),
    flow: stryMutAct_9fa48("372") ? ["Stryker was here"] : (stryCov_9fa48("372"), []),
    component: stryMutAct_9fa48("373") ? ["Stryker was here"] : (stryCov_9fa48("373"), [])
  }),
  toggleNodeSelect: (tree, nodeId) => {
    if (stryMutAct_9fa48("374")) {
      {}
    } else {
      stryCov_9fa48("374");
      set(s => {
        if (stryMutAct_9fa48("375")) {
          {}
        } else {
          stryCov_9fa48("375");
          const current = s.selectedNodeIds[tree];
          const exists = current.includes(nodeId);
          return stryMutAct_9fa48("376") ? {} : (stryCov_9fa48("376"), {
            selectedNodeIds: stryMutAct_9fa48("377") ? {} : (stryCov_9fa48("377"), {
              ...s.selectedNodeIds,
              [tree]: exists ? stryMutAct_9fa48("378") ? current : (stryCov_9fa48("378"), current.filter(stryMutAct_9fa48("379") ? () => undefined : (stryCov_9fa48("379"), id => stryMutAct_9fa48("382") ? id === nodeId : stryMutAct_9fa48("381") ? false : stryMutAct_9fa48("380") ? true : (stryCov_9fa48("380", "381", "382"), id !== nodeId)))) : stryMutAct_9fa48("383") ? [] : (stryCov_9fa48("383"), [...current, nodeId])
            })
          });
        }
      });
    }
  },
  selectNode: (tree, nodeId) => {
    if (stryMutAct_9fa48("384")) {
      {}
    } else {
      stryCov_9fa48("384");
      set(stryMutAct_9fa48("385") ? () => undefined : (stryCov_9fa48("385"), s => stryMutAct_9fa48("386") ? {} : (stryCov_9fa48("386"), {
        selectedNodeIds: stryMutAct_9fa48("387") ? {} : (stryCov_9fa48("387"), {
          ...s.selectedNodeIds,
          [tree]: stryMutAct_9fa48("388") ? [] : (stryCov_9fa48("388"), [nodeId])
        })
      })));
    }
  },
  clearNodeSelection: tree => {
    if (stryMutAct_9fa48("389")) {
      {}
    } else {
      stryCov_9fa48("389");
      set(stryMutAct_9fa48("390") ? () => undefined : (stryCov_9fa48("390"), s => stryMutAct_9fa48("391") ? {} : (stryCov_9fa48("391"), {
        selectedNodeIds: stryMutAct_9fa48("392") ? {} : (stryCov_9fa48("392"), {
          ...s.selectedNodeIds,
          [tree]: stryMutAct_9fa48("393") ? ["Stryker was here"] : (stryCov_9fa48("393"), [])
        })
      })));
    }
  },
  selectAllNodes: tree => {
    if (stryMutAct_9fa48("394")) {
      {}
    } else {
      stryCov_9fa48("394");
      set(s => {
        if (stryMutAct_9fa48("395")) {
          {}
        } else {
          stryCov_9fa48("395");
          if (stryMutAct_9fa48("398") ? tree !== 'context' : stryMutAct_9fa48("397") ? false : stryMutAct_9fa48("396") ? true : (stryCov_9fa48("396", "397", "398"), tree === (stryMutAct_9fa48("399") ? "" : (stryCov_9fa48("399"), 'context')))) {
            if (stryMutAct_9fa48("400")) {
              {}
            } else {
              stryCov_9fa48("400");
              return stryMutAct_9fa48("401") ? {} : (stryCov_9fa48("401"), {
                selectedNodeIds: stryMutAct_9fa48("402") ? {} : (stryCov_9fa48("402"), {
                  ...s.selectedNodeIds,
                  context: s.contextNodes.map(stryMutAct_9fa48("403") ? () => undefined : (stryCov_9fa48("403"), n => n.nodeId))
                })
              });
            }
          }
          // flow and component need state from other stores — use dynamic require
          if (stryMutAct_9fa48("406") ? tree !== 'flow' : stryMutAct_9fa48("405") ? false : stryMutAct_9fa48("404") ? true : (stryCov_9fa48("404", "405", "406"), tree === (stryMutAct_9fa48("407") ? "" : (stryCov_9fa48("407"), 'flow')))) {
            if (stryMutAct_9fa48("408")) {
              {}
            } else {
              stryCov_9fa48("408");
              const {
                useFlowStore
              } = require('./flowStore');
              return stryMutAct_9fa48("409") ? {} : (stryCov_9fa48("409"), {
                selectedNodeIds: stryMutAct_9fa48("410") ? {} : (stryCov_9fa48("410"), {
                  ...s.selectedNodeIds,
                  flow: useFlowStore.getState().flowNodes.map(stryMutAct_9fa48("411") ? () => undefined : (stryCov_9fa48("411"), (n: any) => n.nodeId))
                })
              });
            }
          }
          // component: use dynamic require
          const {
            useComponentStore
          } = require('./componentStore');
          return stryMutAct_9fa48("412") ? {} : (stryCov_9fa48("412"), {
            selectedNodeIds: stryMutAct_9fa48("413") ? {} : (stryCov_9fa48("413"), {
              ...s.selectedNodeIds,
              component: useComponentStore.getState().componentNodes.map(stryMutAct_9fa48("414") ? () => undefined : (stryCov_9fa48("414"), (n: any) => n.nodeId))
            })
          });
        }
      });
    }
  },
  deleteSelectedNodes: (tree, deleteContextNode, deleteFlowNode) => {
    if (stryMutAct_9fa48("415")) {
      {}
    } else {
      stryCov_9fa48("415");
      const {
        selectedNodeIds
      } = get();
      const toDelete = new Set(selectedNodeIds[tree]);
      if (stryMutAct_9fa48("418") ? toDelete.size !== 0 : stryMutAct_9fa48("417") ? false : stryMutAct_9fa48("416") ? true : (stryCov_9fa48("416", "417", "418"), toDelete.size === 0)) return;
      const historyStore = getHistoryStore();
      if (stryMutAct_9fa48("421") ? tree !== 'context' : stryMutAct_9fa48("420") ? false : stryMutAct_9fa48("419") ? true : (stryCov_9fa48("419", "420", "421"), tree === (stryMutAct_9fa48("422") ? "" : (stryCov_9fa48("422"), 'context')))) {
        if (stryMutAct_9fa48("423")) {
          {}
        } else {
          stryCov_9fa48("423");
          const nodes = get().contextNodes;
          historyStore.recordSnapshot(stryMutAct_9fa48("424") ? "" : (stryCov_9fa48("424"), 'context'), nodes);
          toDelete.forEach(stryMutAct_9fa48("425") ? () => undefined : (stryCov_9fa48("425"), id => deleteContextNode(id)));
        }
      } else if (stryMutAct_9fa48("428") ? tree !== 'flow' : stryMutAct_9fa48("427") ? false : stryMutAct_9fa48("426") ? true : (stryCov_9fa48("426", "427", "428"), tree === (stryMutAct_9fa48("429") ? "" : (stryCov_9fa48("429"), 'flow')))) {
        if (stryMutAct_9fa48("430")) {
          {}
        } else {
          stryCov_9fa48("430");
          const {
            useFlowStore
          } = require('./flowStore');
          const nodes = useFlowStore.getState().flowNodes;
          historyStore.recordSnapshot(stryMutAct_9fa48("431") ? "" : (stryCov_9fa48("431"), 'flow'), nodes);
          toDelete.forEach(stryMutAct_9fa48("432") ? () => undefined : (stryCov_9fa48("432"), id => deleteFlowNode(id)));
        }
      }
      set(stryMutAct_9fa48("433") ? () => undefined : (stryCov_9fa48("433"), s => stryMutAct_9fa48("434") ? {} : (stryCov_9fa48("434"), {
        selectedNodeIds: stryMutAct_9fa48("435") ? {} : (stryCov_9fa48("435"), {
          ...s.selectedNodeIds,
          [tree]: stryMutAct_9fa48("436") ? ["Stryker was here"] : (stryCov_9fa48("436"), [])
        })
      })));
    }
  },
  // === Context Slice ===
  contextNodes: stryMutAct_9fa48("437") ? ["Stryker was here"] : (stryCov_9fa48("437"), []),
  contextDraft: null,
  setContextNodes: stryMutAct_9fa48("438") ? () => undefined : (stryCov_9fa48("438"), nodes => set(stryMutAct_9fa48("439") ? {} : (stryCov_9fa48("439"), {
    contextNodes: nodes
  }))),
  addContextNode: data => {
    if (stryMutAct_9fa48("440")) {
      {}
    } else {
      stryCov_9fa48("440");
      const newNode: BoundedContextNode = stryMutAct_9fa48("441") ? {} : (stryCov_9fa48("441"), {
        nodeId: generateId(),
        name: data.name,
        description: data.description,
        type: data.type,
        isActive: stryMutAct_9fa48("442") ? true : (stryCov_9fa48("442"), false),
        status: stryMutAct_9fa48("443") ? "" : (stryCov_9fa48("443"), 'pending'),
        children: stryMutAct_9fa48("444") ? ["Stryker was here"] : (stryCov_9fa48("444"), [])
      });
      set(s => {
        if (stryMutAct_9fa48("445")) {
          {}
        } else {
          stryCov_9fa48("445");
          const newNodes = stryMutAct_9fa48("446") ? [] : (stryCov_9fa48("446"), [...s.contextNodes, stryMutAct_9fa48("447") ? {} : (stryCov_9fa48("447"), {
            ...newNode
          })]);
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("448") ? "" : (stryCov_9fa48("448"), 'context'), newNodes);
          return stryMutAct_9fa48("449") ? {} : (stryCov_9fa48("449"), {
            contextNodes: newNodes
          });
        }
      });
      postContextActionMessage(stryMutAct_9fa48("450") ? `` : (stryCov_9fa48("450"), `添加了上下文节点`), data.name);
    }
  },
  editContextNode: (nodeId, data) => {
    if (stryMutAct_9fa48("451")) {
      {}
    } else {
      stryCov_9fa48("451");
      set(s => {
        if (stryMutAct_9fa48("452")) {
          {}
        } else {
          stryCov_9fa48("452");
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("453") ? () => undefined : (stryCov_9fa48("453"), n => (stryMutAct_9fa48("456") ? n.nodeId !== nodeId : stryMutAct_9fa48("455") ? false : stryMutAct_9fa48("454") ? true : (stryCov_9fa48("454", "455", "456"), n.nodeId === nodeId)) ? stryMutAct_9fa48("457") ? {} : (stryCov_9fa48("457"), {
            ...n,
            ...data,
            status: 'pending' as const
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("458") ? "" : (stryCov_9fa48("458"), 'context'), newNodes);
          return stryMutAct_9fa48("459") ? {} : (stryCov_9fa48("459"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  deleteContextNode: nodeId => {
    if (stryMutAct_9fa48("460")) {
      {}
    } else {
      stryCov_9fa48("460");
      const nodeToDelete = get().contextNodes.find(stryMutAct_9fa48("461") ? () => undefined : (stryCov_9fa48("461"), n => stryMutAct_9fa48("464") ? n.nodeId !== nodeId : stryMutAct_9fa48("463") ? false : stryMutAct_9fa48("462") ? true : (stryCov_9fa48("462", "463", "464"), n.nodeId === nodeId)));
      const deletedName = stryMutAct_9fa48("465") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("465"), (stryMutAct_9fa48("466") ? nodeToDelete.name : (stryCov_9fa48("466"), nodeToDelete?.name)) ?? nodeId);
      set(s => {
        if (stryMutAct_9fa48("467")) {
          {}
        } else {
          stryCov_9fa48("467");
          const newNodes = stryMutAct_9fa48("468") ? s.contextNodes : (stryCov_9fa48("468"), s.contextNodes.filter(stryMutAct_9fa48("469") ? () => undefined : (stryCov_9fa48("469"), n => stryMutAct_9fa48("472") ? n.nodeId === nodeId : stryMutAct_9fa48("471") ? false : stryMutAct_9fa48("470") ? true : (stryCov_9fa48("470", "471", "472"), n.nodeId !== nodeId))));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("473") ? "" : (stryCov_9fa48("473"), 'context'), newNodes);
          return stryMutAct_9fa48("474") ? {} : (stryCov_9fa48("474"), {
            contextNodes: newNodes
          });
        }
      });
      postContextActionMessage(stryMutAct_9fa48("475") ? `` : (stryCov_9fa48("475"), `删除了上下文节点`), deletedName);
    }
  },
  confirmContextNode: nodeId => {
    if (stryMutAct_9fa48("476")) {
      {}
    } else {
      stryCov_9fa48("476");
      set(s => {
        if (stryMutAct_9fa48("477")) {
          {}
        } else {
          stryCov_9fa48("477");
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("478") ? () => undefined : (stryCov_9fa48("478"), n => (stryMutAct_9fa48("481") ? n.nodeId !== nodeId : stryMutAct_9fa48("480") ? false : stryMutAct_9fa48("479") ? true : (stryCov_9fa48("479", "480", "481"), n.nodeId === nodeId)) ? stryMutAct_9fa48("482") ? {} : (stryCov_9fa48("482"), {
            ...n,
            isActive: stryMutAct_9fa48("483") ? false : (stryCov_9fa48("483"), true),
            status: 'confirmed' as const
          }) : n));
          return stryMutAct_9fa48("484") ? {} : (stryCov_9fa48("484"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  toggleContextNode: nodeId => {
    if (stryMutAct_9fa48("485")) {
      {}
    } else {
      stryCov_9fa48("485");
      set(s => {
        if (stryMutAct_9fa48("486")) {
          {}
        } else {
          stryCov_9fa48("486");
          const node = s.contextNodes.find(stryMutAct_9fa48("487") ? () => undefined : (stryCov_9fa48("487"), n => stryMutAct_9fa48("490") ? n.nodeId !== nodeId : stryMutAct_9fa48("489") ? false : stryMutAct_9fa48("488") ? true : (stryCov_9fa48("488", "489", "490"), n.nodeId === nodeId)));
          if (stryMutAct_9fa48("493") ? false : stryMutAct_9fa48("492") ? true : stryMutAct_9fa48("491") ? node : (stryCov_9fa48("491", "492", "493"), !node)) return {};
          const isConfirmed = stryMutAct_9fa48("496") ? node.status !== 'confirmed' : stryMutAct_9fa48("495") ? false : stryMutAct_9fa48("494") ? true : (stryCov_9fa48("494", "495", "496"), node.status === (stryMutAct_9fa48("497") ? "" : (stryCov_9fa48("497"), 'confirmed')));
          const newNodes = s.contextNodes.map(stryMutAct_9fa48("498") ? () => undefined : (stryCov_9fa48("498"), n => (stryMutAct_9fa48("501") ? n.nodeId !== nodeId : stryMutAct_9fa48("500") ? false : stryMutAct_9fa48("499") ? true : (stryCov_9fa48("499", "500", "501"), n.nodeId === nodeId)) ? stryMutAct_9fa48("502") ? {} : (stryCov_9fa48("502"), {
            ...n,
            isActive: isConfirmed ? stryMutAct_9fa48("503") ? true : (stryCov_9fa48("503"), false) : stryMutAct_9fa48("504") ? false : (stryCov_9fa48("504"), true),
            status: isConfirmed ? 'pending' as const : 'confirmed' as const
          }) : n));
          return stryMutAct_9fa48("505") ? {} : (stryCov_9fa48("505"), {
            contextNodes: newNodes
          });
        }
      });
    }
  },
  setContextDraft: stryMutAct_9fa48("506") ? () => undefined : (stryCov_9fa48("506"), draft => set(stryMutAct_9fa48("507") ? {} : (stryCov_9fa48("507"), {
    contextDraft: draft
  })))
})), stryMutAct_9fa48("508") ? {} : (stryCov_9fa48("508"), {
  name: stryMutAct_9fa48("509") ? "" : (stryCov_9fa48("509"), 'vibex-context-store'),
  partialize: stryMutAct_9fa48("510") ? () => undefined : (stryCov_9fa48("510"), state => stryMutAct_9fa48("511") ? {} : (stryCov_9fa48("511"), {
    contextNodes: state.contextNodes,
    boundedGroups: state.boundedGroups,
    boundedEdges: state.boundedEdges,
    phase: state.phase
  }))
})), stryMutAct_9fa48("512") ? {} : (stryCov_9fa48("512"), {
  name: stryMutAct_9fa48("513") ? "" : (stryCov_9fa48("513"), 'ContextStore')
})));