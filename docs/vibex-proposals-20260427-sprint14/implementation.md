# E1 Design-to-Code Pipeline — Implementation Plan

## 现状分析

| 组件 | 状态 |
|------|------|
| CodeGenPanel + CSS Module | ✅ 実装済み (E10) |
| codeGenerator.ts | ✅ 実装済み (E10) |
| codeGenerator.test.ts | ✅ テスト済み |
| featureFlags.ts | ✅ 基盤存在 |
| figma-import.ts | ✅ Figma URL解析済み |

## 追加実装タスク

### E1-U1: Feature Flag + Type Definitions + Validation
1. featureFlags.ts に `FEATURE_DESIGN_TO_CODE_PIPELINE` 登録
2. `DesignNode` / `CodeGenContext` 型定義
3. `agentStore.injectContext()` コンテキスト検証

### E1-U2: Token Extraction Service
1. `DesignTokenService` — Figma token nodes → internal schema
2. `token_snapshots` table interface
3. 200ノード上限の警告（設定可能に）

### E1-U3: Template Engine + Format Renderers
1. Handlebars テンプレート（CSS / Tailwind / JS constants）
2. 出力フォーマット: JSON, CSS, SCSS, JS
3. 各フォーマットのスキーマバリデーション

### E1-U4: Bidirectional Sync (flag gated)
1. `FEATURE_DESIGN_TO_CODE_BIDIRECTIONAL` フラグ
2. Drift detection (schemaVersion hash 比)
3. ConflictResolutionDialog UI

### E1-U5: Batch Export
1. バックグラウンド job queue
2. Bulk export 複数 token sets

### E1-U6: Export Format Variants
1. 既存 codeGenerator 拡張
2. SCSS / JS export renderer

## ファイル一覧

| ファイル | アクション |
|----------|------------|
| src/lib/featureFlags.ts | フラグ追加 |
| src/types/design.ts | 型定義追加 |
| src/types/codegen.ts | 新規（CodeGenContext他）|
| src/services/design-token/DesignTokenService.ts | 新規 |
| src/lib/design-token/templates/ | 新規（Handlebars）|
| src/lib/design-token/renderers/ | 新規（JSON/CSS/SCSS/JS）|
| src/lib/design-token/validation.ts | 新規 |
| src/components/ConflictResolutionDialog/ | 新規 |
| src/components/batch-export/ | 新規 |
| src/services/agent/CodingAgentService.ts | injectContext追加 |
