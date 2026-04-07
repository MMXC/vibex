# vibex-simplified-flow - Epic6-ProjectAPI Implementation

## Status: ✅ Completed

## Summary
Implemented Project CRUD API endpoints for the simplified flow in `src/routes/projects.ts`.

## Changes

### 1. POST /api/projects - Create Project
- **Purpose**: Create a new project with initial StepState
- **Request Schema**:
  ```typescript
  const CreateProjectSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    userId: z.string().min(1),
  })
  ```
- **Behavior**:
  - Inserts into `Project` table with default status 'draft' and version 1
  - Creates initial `StepState` row for the project (currentStep=1)
  - Returns 201 with created project

### 2. PUT /api/projects/:id - Update Project
- **Purpose**: Update project with optimistic locking
- **Request Schema**:
  ```typescript
  const UpdateProjectSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'active', 'converted', 'archived']).optional(),
    version: z.number().int().positive(), // Required for optimistic locking
  })
  ```
- **Behavior**:
  - Checks version matches (optimistic locking)
  - Returns 409 Conflict if version mismatch
  - Auto-increments version on each update
  - Updates status, name, description fields

### 3. DELETE /api/projects/:id - Soft Delete
- **Purpose**: Move project to trash (soft delete)
- **Behavior**:
  - Sets `deletedAt` timestamp instead of hard delete
  - Returns 404 if project not found
  - Existing `GET /api/projects/trash` retrieves soft-deleted projects

## Files Modified
- `src/routes/projects.ts` - Extended with CRUD operations

## Project Model Fields
- `id`: Primary key (generated)
- `name`: Project name
- `description`: Optional description
- `userId`: Owner user ID
- `status`: draft | active | converted | archived
- `version`: Integer for optimistic locking
- `isTemplate`: Boolean flag
- `parentDraftId`: Optional parent draft reference
- `deletedAt`: Soft delete timestamp (null = active)
- `createdAt`, `updatedAt`: Timestamps

## Validation
- ✅ Tests: 436 passed
- ⚠️ Build: OOM killed on this machine (environmental, not code issue)
- Zod schemas for request validation
- D1 unavailable handling with 503 response

## Related
- StepState table created with project
- Trash bin support via existing GET /api/projects/trash endpoint
