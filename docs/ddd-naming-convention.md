# DDD 命名规范

## 允许模式

### 1. 业务动词/名词
描述核心业务活动的名词和动词。

| 示例 | 说明 |
|------|------|
| 患者档案 | 业务核心实体 |
| 订单处理 | 业务流程 |
| 库存管理 | 库存领域核心 |
| 支付结算 | 支付领域 |
| 用户认证 | 认证领域 |

### 2. 限界上下文名称
反映业务边界的有界概念。

| 示例 | 说明 |
|------|------|
| 客户管理 | 客户上下文 |
| 产品目录 | 产品上下文 |
| 订单履约 | 订单上下文 |
| 物流配送 | 物流上下文 |
| 财务结算 | 财务上下文 |

### 3. 聚合根名称
表示业务一致性的实体集合。

| 示例 | 说明 |
|------|------|
| 订单聚合 | Order Aggregate |
| 用户聚合 | User Aggregate |
| 账户聚合 | Account Aggregate |
| 库存聚合 | Inventory Aggregate |
| 购物车聚合 | Cart Aggregate |

### 4. 领域事件
描述业务状态的变更。

| 示例 | 说明 |
|------|------|
| OrderPlaced | 订单已创建 |
| PaymentCompleted | 支付已完成 |
| InventoryReserved | 库存已预留 |
| ShipmentDispatched | 货物已发货 |
| RefundRequested | 退款已申请 |

### 5. 实体标识符
具有唯一业务含义的标识。

| 示例 | 说明 |
|------|------|
| CustomerId | 客户ID |
| OrderNo | 订单号 |
| ProductCode | 产品编码 |
| TrackingNumber | 物流追踪号 |
| InvoiceNumber | 发票号 |

---

## 禁止模式

### 1. 泛化后缀
无领域含义的通用词。

| 禁止 | 原因 |
|------|------|
| xxx管理 | 太泛化，无领域含义 |
| xxx系统 | 层级混乱 |
| xxx模块 | 技术术语混入领域 |
| xxx功能 | 无业务语义 |
| xxx处理 | 动词模糊 |

### 2. 编号命名
无意义的序号命名。

| 禁止 | 原因 |
|------|------|
| Entity1 | 无业务含义 |
| Object2 | 无语义 |
| TableA | 技术实现细节 |
| Data1 | 非领域语言 |
| Infoxxx | 泛化信息词 |

### 3. 英文直译
非 DDD 术语的直译。

| 禁止 | 原因 |
|------|------|
| DataList | 应为 ItemList 或具体实体 |
| InfoManager | 应为 InformationService |
| ObjectBase | 应为 DomainObject |
| ManagerSuffix | 应为 Service 或 Handler |
| DataTransfer | 应为 DTO/ValueObject |

### 4. 技术实现词
技术术语混入领域模型。

| 禁止 | 原因 |
|------|------|
| xxxController | 属于应用层 |
| xxxRepository | 属于基础设施层 |
| xxxServiceImpl | 实现细节 |
| xxxMapper | 技术映射 |
| xxxDTO | 数据传输对象 |

### 5. 模糊动词
无具体业务含义的动词。

| 禁止 | 原因 |
|------|------|
| doSomething | 动作不明确 |
| handleXxx | 应明确 handle 什么 |
| processXxx | 应为具体业务词 |
| executeXxx | 应为具体动作 |
| performXxx | 应为领域动词 |
