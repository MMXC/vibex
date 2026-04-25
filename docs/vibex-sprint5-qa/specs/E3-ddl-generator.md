# Spec — E3: DDLGenerator 与 Sprint4 API 兼容性

**文件**: `specs/E3-ddl-generator.md`
**Epic**: E3 DDLGenerator 与 Sprint4 API 兼容性验证
**基于**: PRD vibex-sprint5-qa § E3

---

## 组件描述

DDLGenerator.ts — 将 APIEndpointCard[]（来自 Sprint4 API 章节）转换为 DDLTable[]。

---

## 四态定义

### 1. 理想态（Ideal）

**触发条件**: 有效的 APIEndpointCard[] 输入

```typescript
// 输入
const apiCards: APIEndpointCard[] = [
  {
    path: '/users',
    method: 'GET',
    summary: '获取用户列表',
    parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      '200': { description: 'OK' }
    }
  }
]

// 输出
const ddlTables: DDLTable[] = [
  {
    tableName: 'GET_USERS',  // 路径转大写下划线
    endpoint: '/users',
    method: 'GET',
    columns: [
      { name: 'page', type: 'INTEGER', nullable: true },  // query 参数
      { name: 'name', type: 'VARCHAR(255)', nullable: true },  // requestBody
      { name: 'email', type: 'VARCHAR(255)', nullable: true }
    ]
  }
]
```

---

### 2. 空状态（Empty）

**触发条件**: 空数组输入

```typescript
DDLGenerator([])  // → []
```

---

### 3. 加载态（Loading）

N/A — 纯函数，无异步操作

---

### 4. 错误态（Error）

**触发条件**: 无效输入（undefined / null / 异常结构）

```typescript
DDLGenerator(undefined)  // → []
DDLGenerator(null)       // → []
DDLGenerator([{ ...invalid }])  // → [{ tableName: '_INVALID', columns: [] }]
```

---

## Sprint4 APIEndpointCard 接口兼容性

| 字段 | DDLGenerator 使用方式 |
|------|---------------------|
| `path` | → tableName（GET_USERS）|
| `method` | → endpoint.method（GET/POST/PUT/DELETE）|
| `parameters` | → columns（in: query → nullable）|
| `requestBody` | → columns（必填 → nullable: false）|
| `responses` | → 文档注释 |
