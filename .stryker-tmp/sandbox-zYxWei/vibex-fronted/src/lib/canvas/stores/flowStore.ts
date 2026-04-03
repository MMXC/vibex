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
  if (stryMutAct_9fa48("1118")) {
    {}
  } else {
    stryCov_9fa48("1118");
    return stryMutAct_9fa48("1119") ? `` : (stryCov_9fa48("1119"), `${Date.now()}-${stryMutAct_9fa48("1120") ? Math.random().toString(36) : (stryCov_9fa48("1120"), Math.random().toString(36).slice(2, 9))}`);
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
export const useFlowStore = create<FlowStore>()(devtools(persist(stryMutAct_9fa48("1121") ? () => undefined : (stryCov_9fa48("1121"), (set, get) => stryMutAct_9fa48("1122") ? {} : (stryCov_9fa48("1122"), {
  // State
  flowNodes: stryMutAct_9fa48("1123") ? ["Stryker was here"] : (stryCov_9fa48("1123"), []),
  flowDraft: null,
  setFlowNodes: stryMutAct_9fa48("1124") ? () => undefined : (stryCov_9fa48("1124"), nodes => set(stryMutAct_9fa48("1125") ? {} : (stryCov_9fa48("1125"), {
    flowNodes: nodes
  }))),
  addFlowNode: data => {
    if (stryMutAct_9fa48("1126")) {
      {}
    } else {
      stryCov_9fa48("1126");
      const newNode: BusinessFlowNode = stryMutAct_9fa48("1127") ? {} : (stryCov_9fa48("1127"), {
        nodeId: generateId(),
        contextId: data.contextId,
        name: data.name,
        steps: data.steps.map(stryMutAct_9fa48("1128") ? () => undefined : (stryCov_9fa48("1128"), (s, i) => stryMutAct_9fa48("1129") ? {} : (stryCov_9fa48("1129"), {
          ...s,
          stepId: generateId(),
          status: 'pending' as const,
          isActive: stryMutAct_9fa48("1130") ? true : (stryCov_9fa48("1130"), false),
          order: i
        }))),
        isActive: stryMutAct_9fa48("1131") ? true : (stryCov_9fa48("1131"), false),
        status: stryMutAct_9fa48("1132") ? "" : (stryCov_9fa48("1132"), 'pending'),
        children: stryMutAct_9fa48("1133") ? ["Stryker was here"] : (stryCov_9fa48("1133"), [])
      });
      set(s => {
        if (stryMutAct_9fa48("1134")) {
          {}
        } else {
          stryCov_9fa48("1134");
          const newNodes = stryMutAct_9fa48("1135") ? [] : (stryCov_9fa48("1135"), [...s.flowNodes, newNode]);
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1136") ? "" : (stryCov_9fa48("1136"), 'flow'), newNodes);
          return stryMutAct_9fa48("1137") ? {} : (stryCov_9fa48("1137"), {
            flowNodes: newNodes
          });
        }
      });
      stryMutAct_9fa48("1138") ? useCanvasStore.getState().addMessage({
        type: 'user_action',
        content: `添加了流程节点`,
        meta: data.name
      }) : (stryCov_9fa48("1138"), useCanvasStore.getState().addMessage?.(stryMutAct_9fa48("1139") ? {} : (stryCov_9fa48("1139"), {
        type: stryMutAct_9fa48("1140") ? "" : (stryCov_9fa48("1140"), 'user_action'),
        content: stryMutAct_9fa48("1141") ? `` : (stryCov_9fa48("1141"), `添加了流程节点`),
        meta: data.name
      })));
    }
  },
  editFlowNode: (nodeId, data) => {
    if (stryMutAct_9fa48("1142")) {
      {}
    } else {
      stryCov_9fa48("1142");
      set(s => {
        if (stryMutAct_9fa48("1143")) {
          {}
        } else {
          stryCov_9fa48("1143");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("1144") ? () => undefined : (stryCov_9fa48("1144"), n => (stryMutAct_9fa48("1147") ? n.nodeId !== nodeId : stryMutAct_9fa48("1146") ? false : stryMutAct_9fa48("1145") ? true : (stryCov_9fa48("1145", "1146", "1147"), n.nodeId === nodeId)) ? stryMutAct_9fa48("1148") ? {} : (stryCov_9fa48("1148"), {
            ...n,
            ...data,
            status: 'pending' as const
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1149") ? "" : (stryCov_9fa48("1149"), 'flow'), newNodes);
          return stryMutAct_9fa48("1150") ? {} : (stryCov_9fa48("1150"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  deleteFlowNode: nodeId => {
    if (stryMutAct_9fa48("1151")) {
      {}
    } else {
      stryCov_9fa48("1151");
      const nodeToDelete = get().flowNodes.find(stryMutAct_9fa48("1152") ? () => undefined : (stryCov_9fa48("1152"), n => stryMutAct_9fa48("1155") ? n.nodeId !== nodeId : stryMutAct_9fa48("1154") ? false : stryMutAct_9fa48("1153") ? true : (stryCov_9fa48("1153", "1154", "1155"), n.nodeId === nodeId)));
      const deletedName = stryMutAct_9fa48("1156") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("1156"), (stryMutAct_9fa48("1157") ? nodeToDelete.name : (stryCov_9fa48("1157"), nodeToDelete?.name)) ?? nodeId);
      set(s => {
        if (stryMutAct_9fa48("1158")) {
          {}
        } else {
          stryCov_9fa48("1158");
          const newNodes = stryMutAct_9fa48("1159") ? s.flowNodes : (stryCov_9fa48("1159"), s.flowNodes.filter(stryMutAct_9fa48("1160") ? () => undefined : (stryCov_9fa48("1160"), n => stryMutAct_9fa48("1163") ? n.nodeId === nodeId : stryMutAct_9fa48("1162") ? false : stryMutAct_9fa48("1161") ? true : (stryCov_9fa48("1161", "1162", "1163"), n.nodeId !== nodeId))));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1164") ? "" : (stryCov_9fa48("1164"), 'flow'), newNodes);
          return stryMutAct_9fa48("1165") ? {} : (stryCov_9fa48("1165"), {
            flowNodes: newNodes
          });
        }
      });
      stryMutAct_9fa48("1166") ? useCanvasStore.getState().addMessage({
        type: 'user_action',
        content: `删除了流程节点`,
        meta: deletedName
      }) : (stryCov_9fa48("1166"), useCanvasStore.getState().addMessage?.(stryMutAct_9fa48("1167") ? {} : (stryCov_9fa48("1167"), {
        type: stryMutAct_9fa48("1168") ? "" : (stryCov_9fa48("1168"), 'user_action'),
        content: stryMutAct_9fa48("1169") ? `` : (stryCov_9fa48("1169"), `删除了流程节点`),
        meta: deletedName
      })));
    }
  },
  confirmFlowNode: nodeId => {
    if (stryMutAct_9fa48("1170")) {
      {}
    } else {
      stryCov_9fa48("1170");
      set(s => {
        if (stryMutAct_9fa48("1171")) {
          {}
        } else {
          stryCov_9fa48("1171");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("1172")) {
              {}
            } else {
              stryCov_9fa48("1172");
              if (stryMutAct_9fa48("1175") ? n.nodeId === nodeId : stryMutAct_9fa48("1174") ? false : stryMutAct_9fa48("1173") ? true : (stryCov_9fa48("1173", "1174", "1175"), n.nodeId !== nodeId)) return n;
              // Toggle: if already confirmed, unconfirm; otherwise confirm
              const isConfirmed = stryMutAct_9fa48("1178") ? n.status !== 'confirmed' : stryMutAct_9fa48("1177") ? false : stryMutAct_9fa48("1176") ? true : (stryCov_9fa48("1176", "1177", "1178"), n.status === (stryMutAct_9fa48("1179") ? "" : (stryCov_9fa48("1179"), 'confirmed')));
              return stryMutAct_9fa48("1180") ? {} : (stryCov_9fa48("1180"), {
                ...n,
                isActive: stryMutAct_9fa48("1181") ? isConfirmed : (stryCov_9fa48("1181"), !isConfirmed),
                status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending',
                steps: n.steps.map(stryMutAct_9fa48("1182") ? () => undefined : (stryCov_9fa48("1182"), step => stryMutAct_9fa48("1183") ? {} : (stryCov_9fa48("1183"), {
                  ...step,
                  isActive: stryMutAct_9fa48("1184") ? isConfirmed : (stryCov_9fa48("1184"), !isConfirmed),
                  status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending'
                })))
              });
            }
          });
          return stryMutAct_9fa48("1185") ? {} : (stryCov_9fa48("1185"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  toggleFlowNode: nodeId => {
    if (stryMutAct_9fa48("1186")) {
      {}
    } else {
      stryCov_9fa48("1186");
      set(s => {
        if (stryMutAct_9fa48("1187")) {
          {}
        } else {
          stryCov_9fa48("1187");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("1188")) {
              {}
            } else {
              stryCov_9fa48("1188");
              if (stryMutAct_9fa48("1191") ? n.nodeId === nodeId : stryMutAct_9fa48("1190") ? false : stryMutAct_9fa48("1189") ? true : (stryCov_9fa48("1189", "1190", "1191"), n.nodeId !== nodeId)) return n;
              const isConfirmed = stryMutAct_9fa48("1194") ? n.status !== 'confirmed' : stryMutAct_9fa48("1193") ? false : stryMutAct_9fa48("1192") ? true : (stryCov_9fa48("1192", "1193", "1194"), n.status === (stryMutAct_9fa48("1195") ? "" : (stryCov_9fa48("1195"), 'confirmed')));
              return stryMutAct_9fa48("1196") ? {} : (stryCov_9fa48("1196"), {
                ...n,
                isActive: stryMutAct_9fa48("1197") ? isConfirmed : (stryCov_9fa48("1197"), !isConfirmed),
                status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending',
                steps: n.steps.map(stryMutAct_9fa48("1198") ? () => undefined : (stryCov_9fa48("1198"), step => stryMutAct_9fa48("1199") ? {} : (stryCov_9fa48("1199"), {
                  ...step,
                  isActive: stryMutAct_9fa48("1200") ? isConfirmed : (stryCov_9fa48("1200"), !isConfirmed),
                  status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending'
                })))
              });
            }
          });
          return stryMutAct_9fa48("1201") ? {} : (stryCov_9fa48("1201"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  confirmStep: (flowNodeId, stepId) => {
    if (stryMutAct_9fa48("1202")) {
      {}
    } else {
      stryCov_9fa48("1202");
      set(s => {
        if (stryMutAct_9fa48("1203")) {
          {}
        } else {
          stryCov_9fa48("1203");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("1204") ? () => undefined : (stryCov_9fa48("1204"), n => (stryMutAct_9fa48("1207") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("1206") ? false : stryMutAct_9fa48("1205") ? true : (stryCov_9fa48("1205", "1206", "1207"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("1208") ? {} : (stryCov_9fa48("1208"), {
            ...n,
            steps: n.steps.map(stryMutAct_9fa48("1209") ? () => undefined : (stryCov_9fa48("1209"), step => (stryMutAct_9fa48("1212") ? step.stepId !== stepId : stryMutAct_9fa48("1211") ? false : stryMutAct_9fa48("1210") ? true : (stryCov_9fa48("1210", "1211", "1212"), step.stepId === stepId)) ? stryMutAct_9fa48("1213") ? {} : (stryCov_9fa48("1213"), {
              ...step,
              isActive: stryMutAct_9fa48("1214") ? false : (stryCov_9fa48("1214"), true),
              status: 'confirmed' as const
            }) : step))
          }) : n));
          return stryMutAct_9fa48("1215") ? {} : (stryCov_9fa48("1215"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  addStepToFlow: (flowNodeId, data) => {
    if (stryMutAct_9fa48("1216")) {
      {}
    } else {
      stryCov_9fa48("1216");
      set(s => {
        if (stryMutAct_9fa48("1217")) {
          {}
        } else {
          stryCov_9fa48("1217");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("1218")) {
              {}
            } else {
              stryCov_9fa48("1218");
              if (stryMutAct_9fa48("1221") ? n.nodeId === flowNodeId : stryMutAct_9fa48("1220") ? false : stryMutAct_9fa48("1219") ? true : (stryCov_9fa48("1219", "1220", "1221"), n.nodeId !== flowNodeId)) return n;
              const newStep: FlowStep = stryMutAct_9fa48("1222") ? {} : (stryCov_9fa48("1222"), {
                stepId: generateId(),
                name: data.name,
                actor: stryMutAct_9fa48("1223") ? data.actor && '待定' : (stryCov_9fa48("1223"), data.actor ?? (stryMutAct_9fa48("1224") ? "" : (stryCov_9fa48("1224"), '待定'))),
                description: stryMutAct_9fa48("1225") ? data.description && '' : (stryCov_9fa48("1225"), data.description ?? (stryMutAct_9fa48("1226") ? "Stryker was here!" : (stryCov_9fa48("1226"), ''))),
                order: n.steps.length,
                isActive: stryMutAct_9fa48("1227") ? true : (stryCov_9fa48("1227"), false),
                status: 'pending' as const
              });
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("1228") ? "" : (stryCov_9fa48("1228"), 'flow'), stryMutAct_9fa48("1229") ? [] : (stryCov_9fa48("1229"), [...s.flowNodes]));
              return stryMutAct_9fa48("1230") ? {} : (stryCov_9fa48("1230"), {
                ...n,
                steps: stryMutAct_9fa48("1231") ? [] : (stryCov_9fa48("1231"), [...n.steps, newStep]),
                status: 'pending' as const
              });
            }
          });
          return stryMutAct_9fa48("1232") ? {} : (stryCov_9fa48("1232"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  editStep: (flowNodeId, stepId, data) => {
    if (stryMutAct_9fa48("1233")) {
      {}
    } else {
      stryCov_9fa48("1233");
      set(s => {
        if (stryMutAct_9fa48("1234")) {
          {}
        } else {
          stryCov_9fa48("1234");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("1235") ? () => undefined : (stryCov_9fa48("1235"), n => (stryMutAct_9fa48("1238") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("1237") ? false : stryMutAct_9fa48("1236") ? true : (stryCov_9fa48("1236", "1237", "1238"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("1239") ? {} : (stryCov_9fa48("1239"), {
            ...n,
            status: 'pending' as const,
            steps: n.steps.map(stryMutAct_9fa48("1240") ? () => undefined : (stryCov_9fa48("1240"), st => (stryMutAct_9fa48("1243") ? st.stepId !== stepId : stryMutAct_9fa48("1242") ? false : stryMutAct_9fa48("1241") ? true : (stryCov_9fa48("1241", "1242", "1243"), st.stepId === stepId)) ? stryMutAct_9fa48("1244") ? {} : (stryCov_9fa48("1244"), {
              ...st,
              ...data,
              status: 'pending' as const
            }) : st))
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1245") ? "" : (stryCov_9fa48("1245"), 'flow'), newNodes);
          return stryMutAct_9fa48("1246") ? {} : (stryCov_9fa48("1246"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  deleteStep: (flowNodeId, stepId) => {
    if (stryMutAct_9fa48("1247")) {
      {}
    } else {
      stryCov_9fa48("1247");
      set(s => {
        if (stryMutAct_9fa48("1248")) {
          {}
        } else {
          stryCov_9fa48("1248");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("1249") ? () => undefined : (stryCov_9fa48("1249"), n => (stryMutAct_9fa48("1252") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("1251") ? false : stryMutAct_9fa48("1250") ? true : (stryCov_9fa48("1250", "1251", "1252"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("1253") ? {} : (stryCov_9fa48("1253"), {
            ...n,
            steps: stryMutAct_9fa48("1254") ? n.steps : (stryCov_9fa48("1254"), n.steps.filter(stryMutAct_9fa48("1255") ? () => undefined : (stryCov_9fa48("1255"), st => stryMutAct_9fa48("1258") ? st.stepId === stepId : stryMutAct_9fa48("1257") ? false : stryMutAct_9fa48("1256") ? true : (stryCov_9fa48("1256", "1257", "1258"), st.stepId !== stepId))))
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1259") ? "" : (stryCov_9fa48("1259"), 'flow'), newNodes);
          return stryMutAct_9fa48("1260") ? {} : (stryCov_9fa48("1260"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  reorderSteps: (flowNodeId, fromIndex, toIndex) => {
    if (stryMutAct_9fa48("1261")) {
      {}
    } else {
      stryCov_9fa48("1261");
      set(s => {
        if (stryMutAct_9fa48("1262")) {
          {}
        } else {
          stryCov_9fa48("1262");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("1263")) {
              {}
            } else {
              stryCov_9fa48("1263");
              if (stryMutAct_9fa48("1266") ? n.nodeId === flowNodeId : stryMutAct_9fa48("1265") ? false : stryMutAct_9fa48("1264") ? true : (stryCov_9fa48("1264", "1265", "1266"), n.nodeId !== flowNodeId)) return n;
              const steps = stryMutAct_9fa48("1267") ? [] : (stryCov_9fa48("1267"), [...n.steps]);
              const [moved] = steps.splice(fromIndex, 1);
              const insertAt = (stryMutAct_9fa48("1271") ? fromIndex >= toIndex : stryMutAct_9fa48("1270") ? fromIndex <= toIndex : stryMutAct_9fa48("1269") ? false : stryMutAct_9fa48("1268") ? true : (stryCov_9fa48("1268", "1269", "1270", "1271"), fromIndex < toIndex)) ? stryMutAct_9fa48("1272") ? toIndex + 1 : (stryCov_9fa48("1272"), toIndex - 1) : toIndex;
              steps.splice(insertAt, 0, moved);
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("1273") ? "" : (stryCov_9fa48("1273"), 'flow'), stryMutAct_9fa48("1274") ? [] : (stryCov_9fa48("1274"), [...s.flowNodes]));
              return stryMutAct_9fa48("1275") ? {} : (stryCov_9fa48("1275"), {
                ...n,
                steps: steps.map(stryMutAct_9fa48("1276") ? () => undefined : (stryCov_9fa48("1276"), (st, i) => stryMutAct_9fa48("1277") ? {} : (stryCov_9fa48("1277"), {
                  ...st,
                  order: i
                }))),
                status: 'pending' as const
              });
            }
          });
          return stryMutAct_9fa48("1278") ? {} : (stryCov_9fa48("1278"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  setFlowDraft: stryMutAct_9fa48("1279") ? () => undefined : (stryCov_9fa48("1279"), draft => set(stryMutAct_9fa48("1280") ? {} : (stryCov_9fa48("1280"), {
    flowDraft: draft
  })))
})), stryMutAct_9fa48("1281") ? {} : (stryCov_9fa48("1281"), {
  name: stryMutAct_9fa48("1282") ? "" : (stryCov_9fa48("1282"), 'vibex-flow-store')
})), stryMutAct_9fa48("1283") ? {} : (stryCov_9fa48("1283"), {
  name: stryMutAct_9fa48("1284") ? "" : (stryCov_9fa48("1284"), 'FlowStore')
})));