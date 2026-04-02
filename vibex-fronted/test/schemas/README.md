# API Schema Registry

This directory contains JSON Schema definitions generated from backend route tests.

## Generation

```bash
npx tsx scripts/generate-schemas.ts domain-model
npx tsx scripts/generate-schemas.ts requirement
npx tsx scripts/generate-schemas.ts flow
```

## Files

- `domain-model.json` — BoundedContext/DomainEntity response schema
- `requirement.json` — Requirement API response schema
- `flow.json` — BusinessFlow API response schema

## Usage

Used by `test/contract/mock-consistency.test.ts` to validate that frontend mocks stay in sync with backend API contracts.

## Update Policy

When backend API changes:
1. Update backend route tests with new response fields
2. Run `generate-schemas.ts` to regenerate schemas
3. Update frontend mock data in `test/contract/mock-consistency.test.ts`
4. Run `npm run test:contract` to verify sync
