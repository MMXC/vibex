# VibeX Data Model Schema

> Last Updated: 2026-03-12
> Source: `/prisma/schema.prisma`

## Overview

This document describes the VibeX data model schema used in the backend database (SQLite via Prisma).

---

## Entity Relationship Diagram

```
User (1) ──────< Project (N)
  │                 │
  │                 ├─< Page (N)
  │                 ├─< Message (N)
  │                 ├─< FlowData (N)
  │                 ├─< Requirement (N)
  │                 │       │
  │                 │       └─< DomainEntity (N)
  │                 │               │
  │                 │               └─< EntityRelation (N)
  │                 │
  │                 ├─< PrototypeSnapshot (N)
  │                 │
  │                 └─< PrototypeCollaboration (N)
  │
  └─< Agent (N)
  └─< Conversation (N)

Component (standalone, optional projectId)
ProjectSettings (standalone, projectId + key + userId)
```

---

## Models

### User

Represents a registered user of the platform.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | Auto | Primary key |
| email | String | Yes | Unique user email |
| name | String | No | Display name |
| password | String | Yes | Hashed password |
| role | String | Default: "viewer" | One of: admin, editor, viewer |
| avatar | String | No | Avatar URL |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Relations:**
- `projects`: One-to-Many with Project
- `agents`: One-to-Many with Agent
- `conversations`: One-to-Many with Conversation

---

### Project

Represents a user's VibeX project.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | Auto | Primary key |
| name | String | Yes | Project name |
| description | String | No | Project description |
| userId | String | Yes | Foreign key to User |
| deletedAt | DateTime | No | Soft delete timestamp (trash bin) |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Relations:**
- `user`: Many-to-One with User
- `pages`: One-to-Many with Page
- `messages`: One-to-Many with Message
- `flows`: One-to-Many with FlowData
- `requirements`: One-to-Many with Requirement
- `prototypeSnapshots`: One-to-Many with PrototypeSnapshot
- `prototypeCollaborations`: One-to-Many with PrototypeCollaboration

---

### Page

Represents a page within a project.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | Auto | Primary key |
| name | String | Yes | Page name |
| content | String | No | JSON string for page content |
| projectId | String | Yes | Foreign key to Project |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Relations:**
- `project`: Many-to-One with Project

---

### Agent

Represents an AI agent configuration.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | Auto | Primary key |
| name | String | Yes | Agent name |
| prompt | String | Yes | System prompt |
| model | String | Default: "abab6.5s-chat" | Model identifier |
| temperature | Float | Default: 0.7 | Temperature setting |
| userId | String | Yes | Foreign key to User |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Relations:**
- `user`: Many-to-One with User

---

### Conversation

Represents a user conversation session.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | Auto | Primary key |
| userId | String | Yes | Foreign key to User |
| messages | String | Yes | JSON string of messages |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Relations:**
- `user`: Many-to-One with User

---

### Message

Represents a chat message in a project.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | Auto | Primary key |
| role | String | Yes | One of: user, assistant, system |
| content | String | Yes | Message content |
| projectId | String | Yes | Foreign key to Project |
| createdAt | DateTime | Auto | Creation timestamp |

**Relations:**
- `project`: Many-to-One with Project

---

### FlowData

Stores React Flow diagram data for a project.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | Auto | Primary key |
| name | String | No | Flow name |
| nodes | String | Yes | JSON string for React Flow nodes |
| edges | String | Yes | JSON string for React Flow edges |
| projectId | String | Yes | Foreign key to Project |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Relations:**
- `project`: Many-to-One with Project

---

### Requirement

Represents a user requirement for AI prototype generation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | Auto | Primary key |
| projectId | String | Yes | Foreign key to Project |
| rawInput | String | Yes | Original requirement text |
| parsedData | String | No | JSON: structured parsing result |
| status | String | Default: "draft" | One of: draft, analyzing, clarified, confirmed |
| priority | String | Default: "medium" | One of: low, medium, high, critical |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Relations:**
- `project`: Many-to-One with Project
- `entities`: One-to-Many with DomainEntity

---

### DomainEntity

Represents a domain entity extracted from requirements.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | Auto | Primary key |
| requirementId | String | Yes | Foreign key to Requirement |
| name | String | Yes | Entity name |
| type | String | Yes | One of: person, place, object, concept, event |
| description | String | No | Entity description |
| properties | String | No | JSON: property list |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Relations:**
- `requirement`: Many-to-One with Requirement
- `relationsFrom`: One-to-Many with EntityRelation (as source)
- `relationsTo`: One-to-Many with EntityRelation (as target)

---

### EntityRelation

Represents a relationship between domain entities.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | Auto | Primary key |
| fromEntityId | String | Yes | Source entity ID |
| toEntityId | String | Yes | Target entity ID |
| relationType | String | Yes | One of: owns, uses, contains, depends-on, etc. |
| description | String | No | Relation description |
| createdAt | DateTime | Auto | Creation timestamp |

**Relations:**
- `fromEntity`: Many-to-One with DomainEntity
- `toEntity`: Many-to-One with DomainEntity

---

### PrototypeSnapshot

Stores snapshots of generated UI prototypes.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | Auto | Primary key |
| projectId | String | Yes | Foreign key to Project |
| version | Int | Default: 1 | Snapshot version |
| name | String | No | Snapshot name |
| description | String | No | Snapshot description |
| content | String | Yes | JSON: UI snapshot data |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Relations:**
- `project`: Many-to-One with Project

---

### PrototypeCollaboration

Manages collaborators on prototype projects.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | Auto | Primary key |
| projectId | String | Yes | Foreign key to Project |
| userId | String | Yes | Collaborator user ID |
| userName | String | No | Collaborator display name |
| userEmail | String | No | Collaborator email |
| role | String | Default: "viewer" | One of: owner, editor, viewer |
| status | String | Default: "active" | One of: active, pending, revoked |
| invitedBy | String | No | User ID of inviter |
| invitedAt | DateTime | No | Invitation timestamp |
| joinedAt | DateTime | No | Join timestamp |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Constraints:**
- Unique: [projectId, userId]
- Indexes: projectId, userId

---

### Component

Stores UI component library definitions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | Auto | Primary key |
| name | String | Yes | Component name |
| category | String | Yes | One of: layout, basic, display, feedback, etc. |
| description | String | No | Component description |
| props | String | Default: "{}" | JSON: default props |
| variants | String | Default: "[]" | JSON: array of variants |
| style | String | Default: "{}" | JSON: default style |
| interactions | String | Default: "{}" | JSON: interaction config |
| replaceable | Boolean | Default: false | Can be replaced by alternatives |
| alternatives | String | Default: "[]" | JSON: alternative component names |
| projectId | String | No | Optional project association |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes:**
- category
- projectId
- name

---

### ProjectSettings

Stores project configurations and user preferences.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String (cuid) | Auto | Primary key |
| projectId | String | Yes | Foreign key to Project |
| key | String | Yes | Setting key |
| value | String | Yes | Setting value |
| userId | String | No | User ID (null for project-level settings) |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Constraints:**
- Unique: [projectId, key, userId]
- Indexes: projectId, userId

---

## Enums

### User Roles
- `admin`: Full system access
- `editor`: Can create and edit projects
- `viewer`: Read-only access

### Project Roles (PrototypeCollaboration)
- `owner`: Project owner with full control
- `editor`: Can edit project content
- `viewer`: Read-only access

### Requirement Status
- `draft`: Initial draft
- `analyzing`: Currently being analyzed
- `clarified`: Clarified with AI
- `confirmed`: Confirmed by user

### Requirement Priority
- `low`
- `medium`
- `high`
- `critical`

### Entity Types (DomainEntity)
- `person`
- `place`
- `object`
- `concept`
- `event`

### Message Roles
- `user`
- `assistant`
- `system`

### Collaboration Status
- `active`: Active collaborator
- `pending`: Invitation pending
- `revoked`: Access revoked

### Component Categories
- `layout`
- `basic`
- `display`
- `feedback`
- (custom categories supported)

---

## API Versioning

> Note: API routes now use versioned paths. All API endpoints are prefixed with `/api/v1/`.

Example:
- `/api/v1/projects` (v1)
- `/api/v1/users` (v1)
- `/api/v1/auth/login` (v1)
