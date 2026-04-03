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
  if (stryMutAct_9fa48("1342")) {
    {}
  } else {
    stryCov_9fa48("1342");
    return stryMutAct_9fa48("1343") ? `` : (stryCov_9fa48("1343"), `${Date.now()}-${stryMutAct_9fa48("1344") ? Math.random().toString(36) : (stryCov_9fa48("1344"), Math.random().toString(36).slice(2, 9))}`);
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
export const useFlowStore = create<FlowStore>()(devtools(persist(stryMutAct_9fa48("1345") ? () => undefined : (stryCov_9fa48("1345"), (set, get) => stryMutAct_9fa48("1346") ? {} : (stryCov_9fa48("1346"), {
  // State
  flowNodes: stryMutAct_9fa48("1347") ? ["Stryker was here"] : (stryCov_9fa48("1347"), []),
  flowDraft: null,
  setFlowNodes: stryMutAct_9fa48("1348") ? () => undefined : (stryCov_9fa48("1348"), nodes => set(stryMutAct_9fa48("1349") ? {} : (stryCov_9fa48("1349"), {
    flowNodes: nodes
  }))),
  addFlowNode: data => {
    if (stryMutAct_9fa48("1350")) {
      {}
    } else {
      stryCov_9fa48("1350");
      const newNode: BusinessFlowNode = stryMutAct_9fa48("1351") ? {} : (stryCov_9fa48("1351"), {
        nodeId: generateId(),
        contextId: data.contextId,
        name: data.name,
        steps: data.steps.map(stryMutAct_9fa48("1352") ? () => undefined : (stryCov_9fa48("1352"), (s, i) => stryMutAct_9fa48("1353") ? {} : (stryCov_9fa48("1353"), {
          ...s,
          stepId: generateId(),
          status: 'pending' as const,
          isActive: stryMutAct_9fa48("1354") ? true : (stryCov_9fa48("1354"), false),
          order: i
        }))),
        isActive: stryMutAct_9fa48("1355") ? true : (stryCov_9fa48("1355"), false),
        status: stryMutAct_9fa48("1356") ? "" : (stryCov_9fa48("1356"), 'pending'),
        children: stryMutAct_9fa48("1357") ? ["Stryker was here"] : (stryCov_9fa48("1357"), [])
      });
      set(s => {
        if (stryMutAct_9fa48("1358")) {
          {}
        } else {
          stryCov_9fa48("1358");
          const newNodes = stryMutAct_9fa48("1359") ? [] : (stryCov_9fa48("1359"), [...s.flowNodes, newNode]);
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1360") ? "" : (stryCov_9fa48("1360"), 'flow'), newNodes);
          return stryMutAct_9fa48("1361") ? {} : (stryCov_9fa48("1361"), {
            flowNodes: newNodes
          });
        }
      });
      stryMutAct_9fa48("1362") ? useCanvasStore.getState().addMessage({
        type: 'user_action',
        content: `添加了流程节点`,
        meta: data.name
      }) : (stryCov_9fa48("1362"), useCanvasStore.getState().addMessage?.(stryMutAct_9fa48("1363") ? {} : (stryCov_9fa48("1363"), {
        type: stryMutAct_9fa48("1364") ? "" : (stryCov_9fa48("1364"), 'user_action'),
        content: stryMutAct_9fa48("1365") ? `` : (stryCov_9fa48("1365"), `添加了流程节点`),
        meta: data.name
      })));
    }
  },
  editFlowNode: (nodeId, data) => {
    if (stryMutAct_9fa48("1366")) {
      {}
    } else {
      stryCov_9fa48("1366");
      set(s => {
        if (stryMutAct_9fa48("1367")) {
          {}
        } else {
          stryCov_9fa48("1367");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("1368") ? () => undefined : (stryCov_9fa48("1368"), n => (stryMutAct_9fa48("1371") ? n.nodeId !== nodeId : stryMutAct_9fa48("1370") ? false : stryMutAct_9fa48("1369") ? true : (stryCov_9fa48("1369", "1370", "1371"), n.nodeId === nodeId)) ? stryMutAct_9fa48("1372") ? {} : (stryCov_9fa48("1372"), {
            ...n,
            ...data,
            status: 'pending' as const
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1373") ? "" : (stryCov_9fa48("1373"), 'flow'), newNodes);
          return stryMutAct_9fa48("1374") ? {} : (stryCov_9fa48("1374"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  deleteFlowNode: nodeId => {
    if (stryMutAct_9fa48("1375")) {
      {}
    } else {
      stryCov_9fa48("1375");
      const nodeToDelete = get().flowNodes.find(stryMutAct_9fa48("1376") ? () => undefined : (stryCov_9fa48("1376"), n => stryMutAct_9fa48("1379") ? n.nodeId !== nodeId : stryMutAct_9fa48("1378") ? false : stryMutAct_9fa48("1377") ? true : (stryCov_9fa48("1377", "1378", "1379"), n.nodeId === nodeId)));
      const deletedName = stryMutAct_9fa48("1380") ? nodeToDelete?.name && nodeId : (stryCov_9fa48("1380"), (stryMutAct_9fa48("1381") ? nodeToDelete.name : (stryCov_9fa48("1381"), nodeToDelete?.name)) ?? nodeId);
      set(s => {
        if (stryMutAct_9fa48("1382")) {
          {}
        } else {
          stryCov_9fa48("1382");
          const newNodes = stryMutAct_9fa48("1383") ? s.flowNodes : (stryCov_9fa48("1383"), s.flowNodes.filter(stryMutAct_9fa48("1384") ? () => undefined : (stryCov_9fa48("1384"), n => stryMutAct_9fa48("1387") ? n.nodeId === nodeId : stryMutAct_9fa48("1386") ? false : stryMutAct_9fa48("1385") ? true : (stryCov_9fa48("1385", "1386", "1387"), n.nodeId !== nodeId))));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1388") ? "" : (stryCov_9fa48("1388"), 'flow'), newNodes);
          return stryMutAct_9fa48("1389") ? {} : (stryCov_9fa48("1389"), {
            flowNodes: newNodes
          });
        }
      });
      stryMutAct_9fa48("1390") ? useCanvasStore.getState().addMessage({
        type: 'user_action',
        content: `删除了流程节点`,
        meta: deletedName
      }) : (stryCov_9fa48("1390"), useCanvasStore.getState().addMessage?.(stryMutAct_9fa48("1391") ? {} : (stryCov_9fa48("1391"), {
        type: stryMutAct_9fa48("1392") ? "" : (stryCov_9fa48("1392"), 'user_action'),
        content: stryMutAct_9fa48("1393") ? `` : (stryCov_9fa48("1393"), `删除了流程节点`),
        meta: deletedName
      })));
    }
  },
  confirmFlowNode: nodeId => {
    if (stryMutAct_9fa48("1394")) {
      {}
    } else {
      stryCov_9fa48("1394");
      set(s => {
        if (stryMutAct_9fa48("1395")) {
          {}
        } else {
          stryCov_9fa48("1395");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("1396")) {
              {}
            } else {
              stryCov_9fa48("1396");
              if (stryMutAct_9fa48("1399") ? n.nodeId === nodeId : stryMutAct_9fa48("1398") ? false : stryMutAct_9fa48("1397") ? true : (stryCov_9fa48("1397", "1398", "1399"), n.nodeId !== nodeId)) return n;
              // Toggle: if already confirmed, unconfirm; otherwise confirm
              const isConfirmed = stryMutAct_9fa48("1402") ? n.status !== 'confirmed' : stryMutAct_9fa48("1401") ? false : stryMutAct_9fa48("1400") ? true : (stryCov_9fa48("1400", "1401", "1402"), n.status === (stryMutAct_9fa48("1403") ? "" : (stryCov_9fa48("1403"), 'confirmed')));
              return stryMutAct_9fa48("1404") ? {} : (stryCov_9fa48("1404"), {
                ...n,
                isActive: stryMutAct_9fa48("1405") ? isConfirmed : (stryCov_9fa48("1405"), !isConfirmed),
                status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending',
                steps: n.steps.map(stryMutAct_9fa48("1406") ? () => undefined : (stryCov_9fa48("1406"), step => stryMutAct_9fa48("1407") ? {} : (stryCov_9fa48("1407"), {
                  ...step,
                  isActive: stryMutAct_9fa48("1408") ? isConfirmed : (stryCov_9fa48("1408"), !isConfirmed),
                  status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending'
                })))
              });
            }
          });
          return stryMutAct_9fa48("1409") ? {} : (stryCov_9fa48("1409"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  toggleFlowNode: nodeId => {
    if (stryMutAct_9fa48("1410")) {
      {}
    } else {
      stryCov_9fa48("1410");
      set(s => {
        if (stryMutAct_9fa48("1411")) {
          {}
        } else {
          stryCov_9fa48("1411");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("1412")) {
              {}
            } else {
              stryCov_9fa48("1412");
              if (stryMutAct_9fa48("1415") ? n.nodeId === nodeId : stryMutAct_9fa48("1414") ? false : stryMutAct_9fa48("1413") ? true : (stryCov_9fa48("1413", "1414", "1415"), n.nodeId !== nodeId)) return n;
              const isConfirmed = stryMutAct_9fa48("1418") ? n.status !== 'confirmed' : stryMutAct_9fa48("1417") ? false : stryMutAct_9fa48("1416") ? true : (stryCov_9fa48("1416", "1417", "1418"), n.status === (stryMutAct_9fa48("1419") ? "" : (stryCov_9fa48("1419"), 'confirmed')));
              return stryMutAct_9fa48("1420") ? {} : (stryCov_9fa48("1420"), {
                ...n,
                isActive: stryMutAct_9fa48("1421") ? isConfirmed : (stryCov_9fa48("1421"), !isConfirmed),
                status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending',
                steps: n.steps.map(stryMutAct_9fa48("1422") ? () => undefined : (stryCov_9fa48("1422"), step => stryMutAct_9fa48("1423") ? {} : (stryCov_9fa48("1423"), {
                  ...step,
                  isActive: stryMutAct_9fa48("1424") ? isConfirmed : (stryCov_9fa48("1424"), !isConfirmed),
                  status: (isConfirmed ? 'pending' : 'confirmed') as 'confirmed' | 'pending'
                })))
              });
            }
          });
          return stryMutAct_9fa48("1425") ? {} : (stryCov_9fa48("1425"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  confirmStep: (flowNodeId, stepId) => {
    if (stryMutAct_9fa48("1426")) {
      {}
    } else {
      stryCov_9fa48("1426");
      set(s => {
        if (stryMutAct_9fa48("1427")) {
          {}
        } else {
          stryCov_9fa48("1427");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("1428") ? () => undefined : (stryCov_9fa48("1428"), n => (stryMutAct_9fa48("1431") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("1430") ? false : stryMutAct_9fa48("1429") ? true : (stryCov_9fa48("1429", "1430", "1431"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("1432") ? {} : (stryCov_9fa48("1432"), {
            ...n,
            steps: n.steps.map(stryMutAct_9fa48("1433") ? () => undefined : (stryCov_9fa48("1433"), step => (stryMutAct_9fa48("1436") ? step.stepId !== stepId : stryMutAct_9fa48("1435") ? false : stryMutAct_9fa48("1434") ? true : (stryCov_9fa48("1434", "1435", "1436"), step.stepId === stepId)) ? stryMutAct_9fa48("1437") ? {} : (stryCov_9fa48("1437"), {
              ...step,
              isActive: stryMutAct_9fa48("1438") ? false : (stryCov_9fa48("1438"), true),
              status: 'confirmed' as const
            }) : step))
          }) : n));
          return stryMutAct_9fa48("1439") ? {} : (stryCov_9fa48("1439"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  addStepToFlow: (flowNodeId, data) => {
    if (stryMutAct_9fa48("1440")) {
      {}
    } else {
      stryCov_9fa48("1440");
      set(s => {
        if (stryMutAct_9fa48("1441")) {
          {}
        } else {
          stryCov_9fa48("1441");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("1442")) {
              {}
            } else {
              stryCov_9fa48("1442");
              if (stryMutAct_9fa48("1445") ? n.nodeId === flowNodeId : stryMutAct_9fa48("1444") ? false : stryMutAct_9fa48("1443") ? true : (stryCov_9fa48("1443", "1444", "1445"), n.nodeId !== flowNodeId)) return n;
              const newStep: FlowStep = stryMutAct_9fa48("1446") ? {} : (stryCov_9fa48("1446"), {
                stepId: generateId(),
                name: data.name,
                actor: stryMutAct_9fa48("1447") ? data.actor && '待定' : (stryCov_9fa48("1447"), data.actor ?? (stryMutAct_9fa48("1448") ? "" : (stryCov_9fa48("1448"), '待定'))),
                description: stryMutAct_9fa48("1449") ? data.description && '' : (stryCov_9fa48("1449"), data.description ?? (stryMutAct_9fa48("1450") ? "Stryker was here!" : (stryCov_9fa48("1450"), ''))),
                order: n.steps.length,
                isActive: stryMutAct_9fa48("1451") ? true : (stryCov_9fa48("1451"), false),
                status: 'pending' as const
              });
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("1452") ? "" : (stryCov_9fa48("1452"), 'flow'), stryMutAct_9fa48("1453") ? [] : (stryCov_9fa48("1453"), [...s.flowNodes]));
              return stryMutAct_9fa48("1454") ? {} : (stryCov_9fa48("1454"), {
                ...n,
                steps: stryMutAct_9fa48("1455") ? [] : (stryCov_9fa48("1455"), [...n.steps, newStep]),
                status: 'pending' as const
              });
            }
          });
          return stryMutAct_9fa48("1456") ? {} : (stryCov_9fa48("1456"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  editStep: (flowNodeId, stepId, data) => {
    if (stryMutAct_9fa48("1457")) {
      {}
    } else {
      stryCov_9fa48("1457");
      set(s => {
        if (stryMutAct_9fa48("1458")) {
          {}
        } else {
          stryCov_9fa48("1458");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("1459") ? () => undefined : (stryCov_9fa48("1459"), n => (stryMutAct_9fa48("1462") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("1461") ? false : stryMutAct_9fa48("1460") ? true : (stryCov_9fa48("1460", "1461", "1462"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("1463") ? {} : (stryCov_9fa48("1463"), {
            ...n,
            status: 'pending' as const,
            steps: n.steps.map(stryMutAct_9fa48("1464") ? () => undefined : (stryCov_9fa48("1464"), st => (stryMutAct_9fa48("1467") ? st.stepId !== stepId : stryMutAct_9fa48("1466") ? false : stryMutAct_9fa48("1465") ? true : (stryCov_9fa48("1465", "1466", "1467"), st.stepId === stepId)) ? stryMutAct_9fa48("1468") ? {} : (stryCov_9fa48("1468"), {
              ...st,
              ...data,
              status: 'pending' as const
            }) : st))
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1469") ? "" : (stryCov_9fa48("1469"), 'flow'), newNodes);
          return stryMutAct_9fa48("1470") ? {} : (stryCov_9fa48("1470"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  deleteStep: (flowNodeId, stepId) => {
    if (stryMutAct_9fa48("1471")) {
      {}
    } else {
      stryCov_9fa48("1471");
      set(s => {
        if (stryMutAct_9fa48("1472")) {
          {}
        } else {
          stryCov_9fa48("1472");
          const newNodes = s.flowNodes.map(stryMutAct_9fa48("1473") ? () => undefined : (stryCov_9fa48("1473"), n => (stryMutAct_9fa48("1476") ? n.nodeId !== flowNodeId : stryMutAct_9fa48("1475") ? false : stryMutAct_9fa48("1474") ? true : (stryCov_9fa48("1474", "1475", "1476"), n.nodeId === flowNodeId)) ? stryMutAct_9fa48("1477") ? {} : (stryCov_9fa48("1477"), {
            ...n,
            steps: stryMutAct_9fa48("1478") ? n.steps : (stryCov_9fa48("1478"), n.steps.filter(stryMutAct_9fa48("1479") ? () => undefined : (stryCov_9fa48("1479"), st => stryMutAct_9fa48("1482") ? st.stepId === stepId : stryMutAct_9fa48("1481") ? false : stryMutAct_9fa48("1480") ? true : (stryCov_9fa48("1480", "1481", "1482"), st.stepId !== stepId))))
          }) : n));
          getHistoryStore().recordSnapshot(stryMutAct_9fa48("1483") ? "" : (stryCov_9fa48("1483"), 'flow'), newNodes);
          return stryMutAct_9fa48("1484") ? {} : (stryCov_9fa48("1484"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  reorderSteps: (flowNodeId, fromIndex, toIndex) => {
    if (stryMutAct_9fa48("1485")) {
      {}
    } else {
      stryCov_9fa48("1485");
      set(s => {
        if (stryMutAct_9fa48("1486")) {
          {}
        } else {
          stryCov_9fa48("1486");
          const newNodes = s.flowNodes.map(n => {
            if (stryMutAct_9fa48("1487")) {
              {}
            } else {
              stryCov_9fa48("1487");
              if (stryMutAct_9fa48("1490") ? n.nodeId === flowNodeId : stryMutAct_9fa48("1489") ? false : stryMutAct_9fa48("1488") ? true : (stryCov_9fa48("1488", "1489", "1490"), n.nodeId !== flowNodeId)) return n;
              const steps = stryMutAct_9fa48("1491") ? [] : (stryCov_9fa48("1491"), [...n.steps]);
              const [moved] = steps.splice(fromIndex, 1);
              const insertAt = (stryMutAct_9fa48("1495") ? fromIndex >= toIndex : stryMutAct_9fa48("1494") ? fromIndex <= toIndex : stryMutAct_9fa48("1493") ? false : stryMutAct_9fa48("1492") ? true : (stryCov_9fa48("1492", "1493", "1494", "1495"), fromIndex < toIndex)) ? stryMutAct_9fa48("1496") ? toIndex + 1 : (stryCov_9fa48("1496"), toIndex - 1) : toIndex;
              steps.splice(insertAt, 0, moved);
              getHistoryStore().recordSnapshot(stryMutAct_9fa48("1497") ? "" : (stryCov_9fa48("1497"), 'flow'), stryMutAct_9fa48("1498") ? [] : (stryCov_9fa48("1498"), [...s.flowNodes]));
              return stryMutAct_9fa48("1499") ? {} : (stryCov_9fa48("1499"), {
                ...n,
                steps: steps.map(stryMutAct_9fa48("1500") ? () => undefined : (stryCov_9fa48("1500"), (st, i) => stryMutAct_9fa48("1501") ? {} : (stryCov_9fa48("1501"), {
                  ...st,
                  order: i
                }))),
                status: 'pending' as const
              });
            }
          });
          return stryMutAct_9fa48("1502") ? {} : (stryCov_9fa48("1502"), {
            flowNodes: newNodes
          });
        }
      });
    }
  },
  setFlowDraft: stryMutAct_9fa48("1503") ? () => undefined : (stryCov_9fa48("1503"), draft => set(stryMutAct_9fa48("1504") ? {} : (stryCov_9fa48("1504"), {
    flowDraft: draft
  })))
})), stryMutAct_9fa48("1505") ? {} : (stryCov_9fa48("1505"), {
  name: stryMutAct_9fa48("1506") ? "" : (stryCov_9fa48("1506"), 'vibex-flow-store')
})), stryMutAct_9fa48("1507") ? {} : (stryCov_9fa48("1507"), {
  name: stryMutAct_9fa48("1508") ? "" : (stryCov_9fa48("1508"), 'FlowStore')
})));