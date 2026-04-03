# AGENTS.md: vibex-frontend-build-fail

## dev (impl-zustand-fix)
- 执行: pnpm add zustand@4.5.7 到 dependencies
- 检查: git status --porcelain
- 提交: git add + commit

## tester (test-zustand-fix)
- 执行: cd /root/.openclaw/vibex && npm run build
- 检查: npm test 通过

## reviewer (review-zustand-fix)
- 检查: git diff --stat
- 检查: npm audit
- 检查: git log --oneline -1

## reviewer (review-push-zustand-fix)
- 执行: git push origin main
- 检查: git fetch && git log origin/main -1
