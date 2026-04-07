# Epic Definition of Done Template

## Template
Each Epic must define its DoD before implementation begins.

## DoD Sections

### Code Quality
- [ ] All new code passes lint
- [ ] TypeScript strict mode satisfied
- [ ] Test coverage ≥ 80%

### Functional
- [ ] All acceptance criteria met
- [ ] Manual verification completed
- [ ] Edge cases handled

### Process
- [ ] PR reviewed by ≥ 1 reviewer
- [ ] Documentation updated
- [ ] No breaking changes to existing features

### Sign-off
- Dev: _______
- Tester: _______
- Reviewer: _______

## Feature Flag Lifecycle
1. Flag created at Epic start
2. Flag 0% rollout → verify no errors
3. Flag 100% rollout → stable for 24h
4. Flag removed in next Epic (cleanup)
