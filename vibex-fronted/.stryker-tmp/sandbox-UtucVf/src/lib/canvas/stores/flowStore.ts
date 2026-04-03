/**
 * VibeX flowStore — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 3 slice extraction.
 *
 * Responsibilities:
 * - BusinessFlowNode state (flowNodes, flowDraft)
 * - CRUD operations on flow nodes and their steps
 * - Step-level confirm/edit/delete/reorder
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
import { useCanvasStore } from '../canvasStore'; // for addMessage side effect

function generateId(): string {
  if (stryMutAct_9fa48("1083")) {
    {}
  } else {
    stryCov_9fa48("1083");
    return stryMutAct_9fa48("1084") ? `` : (stryCov_9fa48("1084"), `${Date.now()}-${stryMutAct_9fa48("1085") ? Math.random().toString(36) : (stryCov_9fa48("1085"), Math.random().toString(36).slice(2, 9))}`);
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
}
export const useFlowStore = create<FlowStore>()(devtools(persist(stryMutAct_9fa48("1086") ? () => undefined : (stryCov_9fa48("1086"), (set, get) => stryMutAct_9fa48("1087") ? {} : (stryCov_9fa48("1087"), {
  // State
  flowNodes: stryMutAct_9fa48("1088") ? ["Stryker was here"] : (stryCov_9fa48("1088"), []),
  flowDraft: null,
  setFlowNodes: stryMutAct_9fa48("1089") ? () => undefined : (stryCov_9fa48("1089"), nodes => set(stryMutAct_9fa48("1090") ? {} : (stryCov_9fa48("1090"), {
    flowNodes: nodes
  }))),
  addFlowNode: data => {
    if (stryMutAct_9fa48("1091")) {
      {}
    } else {
      stryCov_9fa48("1091");
      const newNode: BusinessFlowNode = stryMutAct_9fa48("1092") ? {} : (stryCov_9fa48("1092"), {
        nodeId: generateId(),
        contextId: data.contextId,
        name: data.name,
        steps: data.steps.map(stryMutAct_9fa48("1093") ? () => undefined : (stryCov_9fa48("1093"), (s, i) => stryMutAct_9fa48("1094") ? {} : (stryCov_9fa48("1094"), {
          ...s,
          stepId: generateId(),
          status: 'pending' as const,
          isActive: stryMutAct_9fa48("1095") ? true : (stryCov_9fa48("1095"), false),
          order: i
        }))),
        isActive: stryMutAct_9fa48("1096") ? true : (stryCov_9fa48("1096"), false),
        status: stryMutAct_9fa48("1097") ? "" : (stryCov_9fa48("1097"), 'pending'),
        children: stryMutAct_9fa48("1098") ? ["Stryker was here"] : (stryCov_9fa48("1098"), [])
      });
      set(s => {
        if (stryMutAct_9fa48("1099")) {
          {}
        } else {
          stryCov_9fa48("1099");
          const newNodes = stryMutAct_9fa48("1100") ? [] : (stryCov_9fa48("1100"), [...s.flowNodes, newNode]);
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1101") ? "" : (stryCov_9fa48("1101"), 'flow'), newNodes);
          return stryMutAct_9fa48("1102") ? {} : (stryCov_9fa48("1102"), {
            flowNodes: newNodes
          });
        }
      });
      stryMutAct_9fa48("1103") ? useCanvasStore.getState().addMessage({
        type: 'user_action',
        content: `添加了流程节点`,
        meta: data.name
      }) : (stryCov_9fa48("1103"), useCanvasStore.getState().addMessage?.(stryMutAct_9fa48("1104") ? {} : (stryCov_9fa48("1104"), {
        type: stryMutAct_9fa48("1105") ? "" : (stryCov_9fa48("1105"), 'user_action'),
        content: stryMutAct_9fa48("1106") ? `` : (stryCov_9fa48("1106"), `添加了流程节点`),
        meta: data.name
      })));
    }
  },
  editFlowNode: (nodeId, data) => {
    if (stryMutAct_9fa48("1107")) {
      {}
    } else {
      stryCov_9fa48("1107");
      set(s => {
        if (stryMutAct_9fa48("1108")) {
          {}
        } else {
          stryCov_9fa48("1108");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("1109") ? () => undefined : (stryCov_9fa48("1109"), n => (stryMutAct_9fa48("1112") ? n.nodeId !== nodeId : stryMutAct_9fa48("1111") ? false : stryMutAct_9fa48("1110") ? true : (stryCov_9fa48("1110", "1111", "1112"), n.nodeId === nodeId)) ? stryMutAct_9fa48("1113") ? {} : (stryCov_9fa48("1113"), {
            ...n,
            ...data,
            status: 'pending' as const
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1114") ? "" : (stryCov_9fa48("1114"), 'flow'), newNodes);
          return stryMutAct_9fa48("1115") ? {} : (stryCov_9fa48("1115"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  deleteFlowNode: nodeId => {
    if (stryMutAct_9fa48("1116")) {
      {}
    } else {
      stryCov_9fa48("1116");
      const nodeToDelete = get().flowNodes.find(stryMutAct_9fa48("1117") ? () => undefined : (stryCov_9fa48("1117"), n => stryMutAct_9fa48("1120") ? n.nodeId !== nodeId : stryMutAct_9fa48("1119") ? false : stryMutAct_9fa48("1118") ? true : (stryCov_9fa48("1118", "1119", "1120"), n.nodeId === nodeId)));
      const deletedName = stryMutAct_9fa48("1121") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("1121"), (stryMutAct_9fa48("1122") ? nodeToDelete.name : (stryCov_9fa48("1122"), nodeToDelete?.name)) ?? nodeId);
      set(s => {
        if (stryMutAct_9fa48("1123")) {
          {}
        } else {
          stryCov_9fa48("1123");
          const newNodes = stryMutAct_9fa48("1124") ? s.flowNodes : (stryCov_9fa48("1124"), s.flowNodes.filter(stryMutAct_9fa48("1125") ? () => undefined : (stryCov_9fa48("1125"), n => stryMutAct_9fa48("1128") ? n.nodeId === nodeId : stryMutAct_9fa48("1127") ? false : stryMutAct_9fa48("1126") ? true : (stryCov_9fa48("1126", "1127", "1128"), n.nodeId !== nodeId))));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1129") ? "" : (stryCov_9fa48("1129"), 'flow'), newNodes);
          return stryMutAct_9fa48("1130") ? {} : (stryCov_9fa48("1130"), {
            flowNodes: newNodes
          });
        }
      });
      stryMutAct_9fa48("1131") ? useCanvasStore.getState().addMessage({
        type: 'user_action',
        content: `删除了流程节点`,
        meta: deletedName
      }) : (stryCov_9fa48("1131"), useCanvasStore.getState().addMessage?.(stryMutAct_9fa48("1132") ? {} : (stryCov_9fa48("1132"), {
        type: stryMutAct_9fa48("1133") ? "" : (stryCov_9fa48("1133"), 'user_action'),
        content: stryMutAct_9fa48("1134") ? `` : (stryCov_9fa48("1134"), `删除了流程节点`),
        meta: deletedName
      })));
    }
  },
  confirmFlowNode: nodeId => {
    if (stryMutAct_9fa48("1135")) {
      {}
    } else {
      stryCov_9fa48("1135");
      set(s => {
        if (stryMutAct_9fa48("1136")) {
          {}
        } else {
          stryCov_9fa48("1136");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("1137")) {
              {}
            } else {
              stryCov_9fa48("1137");
              if (stryMutAct_9fa48("1140") ? n.nodeId === nodeId : stryMutAct_9fa48("1139") ? false : stryMutAct_9fa48("1138") ? true : (stryCov_9fa48("1138", "1139", "1140"), n.nodeId !== nodeId)) return n;
              // Toggle: if already confirmed, unconfirm; otherwise confirm
              const isConfirmed = stryMutAct_9fa48("1143") ? n.status !== 'confirmed' : stryMutAct_9fa48("1142") ? false : stryMutAct_9fa48("1141") ? true : (stryCov_9fa48("1141", "1142", "1143"), n.status === (stryMutAct_9fa48("1144") ? "" : (stryCov_9fa48("1144"), 'confirmed')));
              return stryMutAct_9fa48("1145") ? {} : (stryCov_9fa48("1145"), {
                ...n,
                isActive: stryMutAct_9fa48("1146") ? isConfirmed : (stryCov_9fa48("1146"), !isConfirmed),
                status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending',
                steps: n.steps.map(stryMutAct_9fa48("1147") ? () => undefined : (stryCov_9fa48("1147"), step => stryMutAct_9fa48("1148") ? {} : (stryCov_9fa48("1148"), {
                  ...step,
                  isActive: stryMutAct_9fa48("1149") ? isConfirmed : (stryCov_9fa48("1149"), !isConfirmed),
                  status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending'
                })))
              });
            }
          });
          return stryMutAct_9fa48("1150") ? {} : (stryCov_9fa48("1150"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  toggleFlowNode: nodeId => {
    if (stryMutAct_9fa48("1151")) {
      {}
    } else {
      stryCov_9fa48("1151");
      set(s => {
        if (stryMutAct_9fa48("1152")) {
          {}
        } else {
          stryCov_9fa48("1152");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("1153")) {
              {}
            } else {
              stryCov_9fa48("1153");
              if (stryMutAct_9fa48("1156") ? n.nodeId === nodeId : stryMutAct_9fa48("1155") ? false : stryMutAct_9fa48("1154") ? true : (stryCov_9fa48("1154", "1155", "1156"), n.nodeId !== nodeId)) return n;
              const isConfirmed = stryMutAct_9fa48("1159") ? n.status !== 'confirmed' : stryMutAct_9fa48("1158") ? false : stryMutAct_9fa48("1157") ? true : (stryCov_9fa48("1157", "1158", "1159"), n.status === (stryMutAct_9fa48("1160") ? "" : (stryCov_9fa48("1160"), 'confirmed')));
              return stryMutAct_9fa48("1161") ? {} : (stryCov_9fa48("1161"), {
                ...n,
                isActive: stryMutAct_9fa48("1162") ? isConfirmed : (stryCov_9fa48("1162"), !isConfirmed),
                status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending',
                steps: n.steps.map(stryMutAct_9fa48("1163") ? () => undefined : (stryCov_9fa48("1163"), step => stryMutAct_9fa48("1164") ? {} : (stryCov_9fa48("1164"), {
                  ...step,
                  isActive: stryMutAct_9fa48("1165") ? isConfirmed : (stryCov_9fa48("1165"), !isConfirmed),
                  status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending'
                })))
              });
            }
          });
          return stryMutAct_9fa48("1166") ? {} : (stryCov_9fa48("1166"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  confirmStep: (flowNodeId, stepId) => {
    if (stryMutAct_9fa48("1167")) {
      {}
    } else {
      stryCov_9fa48("1167");
      set(s => {
        if (stryMutAct_9fa48("1168")) {
          {}
        } else {
          stryCov_9fa48("1168");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("1169") ? () => undefined : (stryCov_9fa48("1169"), n => (stryMutAct_9fa48("1172") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("1171") ? false : stryMutAct_9fa48("1170") ? true : (stryCov_9fa48("1170", "1171", "1172"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("1173") ? {} : (stryCov_9fa48("1173"), {
            ...n,
            steps: n.steps.map(stryMutAct_9fa48("1174") ? () => undefined : (stryCov_9fa48("1174"), step => (stryMutAct_9fa48("1177") ? step.stepId !== stepId : stryMutAct_9fa48("1176") ? false : stryMutAct_9fa48("1175") ? true : (stryCov_9fa48("1175", "1176", "1177"), step.stepId === stepId)) ? stryMutAct_9fa48("1178") ? {} : (stryCov_9fa48("1178"), {
              ...step,
              isActive: stryMutAct_9fa48("1179") ? false : (stryCov_9fa48("1179"), true),
              status: 'confirmed' as const
            }) : step))
          }) : n));
          return stryMutAct_9fa48("1180") ? {} : (stryCov_9fa48("1180"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  addStepToFlow: (flowNodeId, data) => {
    if (stryMutAct_9fa48("1181")) {
      {}
    } else {
      stryCov_9fa48("1181");
      set(s => {
        if (stryMutAct_9fa48("1182")) {
          {}
        } else {
          stryCov_9fa48("1182");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("1183")) {
              {}
            } else {
              stryCov_9fa48("1183");
              if (stryMutAct_9fa48("1186") ? n.nodeId === flowNodeId : stryMutAct_9fa48("1185") ? false : stryMutAct_9fa48("1184") ? true : (stryCov_9fa48("1184", "1185", "1186"), n.nodeId !== flowNodeId)) return n;
              const newStep: FlowStep = stryMutAct_9fa48("1187") ? {} : (stryCov_9fa48("1187"), {
                stepId: generateId(),
                name: data.name,
                actor: stryMutAct_9fa48("1188") ? data.actor && '待定' : (stryCov_9fa48("1188"), data.actor ?? (stryMutAct_9fa48("1189") ? "" : (stryCov_9fa48("1189"), '待定'))),
                description: stryMutAct_9fa48("1190") ? data.description && '' : (stryCov_9fa48("1190"), data.description ?? (stryMutAct_9fa48("1191") ? "Stryker was here!" : (stryCov_9fa48("1191"), ''))),
                order: n.steps.length,
                isActive: stryMutAct_9fa48("1192") ? true : (stryCov_9fa48("1192"), false),
                status: 'pending' as const
              });
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("1193") ? "" : (stryCov_9fa48("1193"), 'flow'), stryMutAct_9fa48("1194") ? [] : (stryCov_9fa48("1194"), [...s.flowNodes]));
              return stryMutAct_9fa48("1195") ? {} : (stryCov_9fa48("1195"), {
                ...n,
                steps: stryMutAct_9fa48("1196") ? [] : (stryCov_9fa48("1196"), [...n.steps, newStep]),
                status: 'pending' as const
              });
            }
          });
          return stryMutAct_9fa48("1197") ? {} : (stryCov_9fa48("1197"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  editStep: (flowNodeId, stepId, data) => {
    if (stryMutAct_9fa48("1198")) {
      {}
    } else {
      stryCov_9fa48("1198");
      set(s => {
        if (stryMutAct_9fa48("1199")) {
          {}
        } else {
          stryCov_9fa48("1199");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("1200") ? () => undefined : (stryCov_9fa48("1200"), n => (stryMutAct_9fa48("1203") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("1202") ? false : stryMutAct_9fa48("1201") ? true : (stryCov_9fa48("1201", "1202", "1203"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("1204") ? {} : (stryCov_9fa48("1204"), {
            ...n,
            status: 'pending' as const,
            steps: n.steps.map(stryMutAct_9fa48("1205") ? () => undefined : (stryCov_9fa48("1205"), st => (stryMutAct_9fa48("1208") ? st.stepId !== stepId : stryMutAct_9fa48("1207") ? false : stryMutAct_9fa48("1206") ? true : (stryCov_9fa48("1206", "1207", "1208"), st.stepId === stepId)) ? stryMutAct_9fa48("1209") ? {} : (stryCov_9fa48("1209"), {
              ...st,
              ...data,
              status: 'pending' as const
            }) : st))
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1210") ? "" : (stryCov_9fa48("1210"), 'flow'), newNodes);
          return stryMutAct_9fa48("1211") ? {} : (stryCov_9fa48("1211"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  deleteStep: (flowNodeId, stepId) => {
    if (stryMutAct_9fa48("1212")) {
      {}
    } else {
      stryCov_9fa48("1212");
      set(s => {
        if (stryMutAct_9fa48("1213")) {
          {}
        } else {
          stryCov_9fa48("1213");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("1214") ? () => undefined : (stryCov_9fa48("1214"), n => (stryMutAct_9fa48("1217") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("1216") ? false : stryMutAct_9fa48("1215") ? true : (stryCov_9fa48("1215", "1216", "1217"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("1218") ? {} : (stryCov_9fa48("1218"), {
            ...n,
            steps: stryMutAct_9fa48("1219") ? n.steps : (stryCov_9fa48("1219"), n.steps.filter(stryMutAct_9fa48("1220") ? () => undefined : (stryCov_9fa48("1220"), st => stryMutAct_9fa48("1223") ? st.stepId === stepId : stryMutAct_9fa48("1222") ? false : stryMutAct_9fa48("1221") ? true : (stryCov_9fa48("1221", "1222", "1223"), st.stepId !== stepId))))
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1224") ? "" : (stryCov_9fa48("1224"), 'flow'), newNodes);
          return stryMutAct_9fa48("1225") ? {} : (stryCov_9fa48("1225"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  reorderSteps: (flowNodeId, fromIndex, toIndex) => {
    if (stryMutAct_9fa48("1226")) {
      {}
    } else {
      stryCov_9fa48("1226");
      set(s => {
        if (stryMutAct_9fa48("1227")) {
          {}
        } else {
          stryCov_9fa48("1227");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("1228")) {
              {}
            } else {
              stryCov_9fa48("1228");
              if (stryMutAct_9fa48("1231") ? n.nodeId === flowNodeId : stryMutAct_9fa48("1230") ? false : stryMutAct_9fa48("1229") ? true : (stryCov_9fa48("1229", "1230", "1231"), n.nodeId !== flowNodeId)) return n;
              const steps = stryMutAct_9fa48("1232") ? [] : (stryCov_9fa48("1232"), [...n.steps]);
              const [moved] = steps.splice(fromIndex, 1);
              const insertAt = (stryMutAct_9fa48("1236") ? fromIndex >= toIndex : stryMutAct_9fa48("1235") ? fromIndex <= toIndex : stryMutAct_9fa48("1234") ? false : stryMutAct_9fa48("1233") ? true : (stryCov_9fa48("1233", "1234", "1235", "1236"), fromIndex < toIndex)) ? stryMutAct_9fa48("1237") ? toIndex + 1 : (stryCov_9fa48("1237"), toIndex - 1) : toIndex;
              steps.splice(insertAt, 0, moved);
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("1238") ? "" : (stryCov_9fa48("1238"), 'flow'), stryMutAct_9fa48("1239") ? [] : (stryCov_9fa48("1239"), [...s.flowNodes]));
              return stryMutAct_9fa48("1240") ? {} : (stryCov_9fa48("1240"), {
                ...n,
                steps: steps.map(stryMutAct_9fa48("1241") ? () => undefined : (stryCov_9fa48("1241"), (st, i) => stryMutAct_9fa48("1242") ? {} : (stryCov_9fa48("1242"), {
                  ...st,
                  order: i
                }))),
                status: 'pending' as const
              });
            }
          });
          return stryMutAct_9fa48("1243") ? {} : (stryCov_9fa48("1243"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  setFlowDraft: stryMutAct_9fa48("1244") ? () => undefined : (stryCov_9fa48("1244"), draft => set(stryMutAct_9fa48("1245") ? {} : (stryCov_9fa48("1245"), {
    flowDraft: draft
  })))
})), stryMutAct_9fa48("1246") ? {} : (stryCov_9fa48("1246"), {
  name: stryMutAct_9fa48("1247") ? "" : (stryCov_9fa48("1247"), 'vibex-flow-store')
})), stryMutAct_9fa48("1248") ? {} : (stryCov_9fa48("1248"), {
  name: stryMutAct_9fa48("1249") ? "" : (stryCov_9fa48("1249"), 'FlowStore')
})));