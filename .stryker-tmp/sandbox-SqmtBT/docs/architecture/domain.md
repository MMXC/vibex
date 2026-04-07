# Domain Architecture

## Overview
@updated: 2026-04-01

Vibex is a collaborative architecture visualization platform that maps bounded contexts, business flows, and component relationships. The domain model centers on **Canvas** as the primary aggregate, with **BoundedContext**, **BusinessFlow**, and **Component** as core entities.

## Core Concepts
@updated: 2026-04-01

### BoundedContext
A bounded context represents a distinct domain boundary in DDD terms. It contains:
- `nodeId`: Unique identifier
- `name`: Display name
- `description`: Domain description
- `type`: Classification (`core`, `supporting`, `generic`, `external`)
- `status`: Lifecycle status (draft, active, deprecated)
- `children`: Child node IDs (for nested contexts)

### BusinessFlow
A business flow represents a user journey or process spanning multiple bounded contexts:
- `flowId`: Unique identifier
- `name`: Flow name
- `actor`: Primary actor
- `steps`: Ordered collection of flow steps
- `status`: Flow state

### FlowStep
A single step within a business flow:
- `stepId`: Unique step identifier
- `name`: Step name
- `actor`: Responsible actor
- `order`: Execution order
- `isActive`: Current execution state
- `status`: Step state

### Component
A service or module within a bounded context:
- `nodeId`: Unique identifier
- `flowId`: Associated flow (if applicable)
- `name`: Component name
- `type`: Component type (service, gateway, handler, etc.)
- `props`: Component configuration
- `api`: API contract (method, path)

### ContextRelationship
Relationships between bounded contexts:
- `type`: `dependency`, `aggregate`, `calls`, `event-driven`
- `sourceId` / `targetId`: Endpoint context IDs
- `label`: Optional relationship label

## Data Flow
@updated: 2026-04-01

```
User Interaction
       ↓
React Frontend (Canvas View)
       ↓
API Routes (Next.js /app/api)
       ↓
Service Layer (CollaborationService, CanvasService, etc.)
       ↓
Prisma ORM → PostgreSQL
```

### Canvas State Management
- Zustand store for client-side canvas state
- React Flow for node/edge rendering
- Optimistic updates with server reconciliation

### Sync Flow
1. User action triggers store mutation
2. Store calls canvasApi (typed fetch wrapper)
3. API route validates with Zod schema
4. Service layer processes via Prisma
5. Server broadcasts via SSE/WebSocket
6. Client receives event and updates store

## Services
@updated: 2026-04-01

### CollaborationService
Handles real-time collaboration via SSE (Server-Sent Events). Manages session tokens, presence, and event broadcasting.

### CanvasService
Core domain operations: CRUD for nodes, edges, groups, and layouts.

### ImportService
Handles project import from GitHub/Figma/Architecture tools.

### ExportService
Supports export to PNG, SVG, PDF, and Markdown documentation.

## Stores
@updated: 2026-04-01

### canvasStore (Zustand)
Manages canvas nodes, edges, groups, selection state, and viewport.

### contextTreeStore
Manages bounded context tree structure and selection state.

### flowTreeStore
Manages business flow tree structure and active flow state.

### uiStore
Manages UI state: drawers, panels, modals, and preferences.
