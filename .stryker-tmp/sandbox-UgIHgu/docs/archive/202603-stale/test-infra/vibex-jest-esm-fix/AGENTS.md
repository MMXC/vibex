# AGENTS.md: vibex-jest-esm-fix

> Agent commands and verification checklist for the vibex-jest-esm-fix project

---

## Working Directory
```
/root/.openclaw/vibex/vibex-backend
```

---

## Dev Commands

```bash
# Run all tests
cd /root/.openclaw/vibex/vibex-backend && npm test

# Run specific test file
cd /root/.openclaw/vibex/vibex-backend && npx jest src/path/to/file.test.ts

# Validate Jest config
cd /root/.openclaw/vibex/vibex-backend && npx jest --showConfig

# List all test files
cd /root/.openclaw/vibex/vibex-backend && npx jest --listTests
```

---

## Static Analysis

```bash
# TypeScript type check
cd /root/.openclaw/vibex/vibex-backend && npx tsc --noEmit

# ESLint
cd /root/.openclaw/vibex/vibex-backend && npm run lint

# Coverage report
cd /root/.openclaw/vibex/vibex-backend && npm test -- --coverage
```

---

## Pre-commit Checklist (Dev)

Before marking `impl-*` task done:

- [ ] `jest.setup.ts` created at `<rootDir>/jest.setup.ts`
- [ ] `jest.setup.ts` contains `jest.spyOn(console, 'error').mockImplementation(() => {})`
- [ ] `jest.config.js` updated with `setupFilesAfterEnv`
- [ ] `git -C /root/.openclaw/vibex status --porcelain` shows only the 2 expected changes
- [ ] `npm test` passes (exit code 0)

---

## Pre-review Checklist (Reviewer)

Before marking `review-*` task done:

- [ ] `git -C /root/.openclaw/vibex log --oneline -1` has meaningful commit message
- [ ] `git diff HEAD~1 --stat` shows only `jest.config.js` and `jest.setup.ts`
- [ ] `npm test` still passes after changes
- [ ] No new dependencies in `package.json`
- [ ] CHANGELOG.md updated (optional for config-only changes)

---

## Expected Git Diff

```
+ jest.setup.ts       (new file)
  jest.config.js      (1 line added: setupFilesAfterEnv)
```

If the diff shows anything else → **驳回 dev**
