# Rollback Standard Operating Procedure

## Overview
This document defines the rollback procedures for VibeX production incidents.

## Trigger Conditions
Initiate rollback when:
- Error rate exceeds 5% in 5 minutes
- P99 latency > 2s
- Deployment causes data corruption
- Security vulnerability introduced

## Rollback Scenarios

### Scenario 1: Frontend Deployment Failure
**Trigger**: Build fails or runtime errors appear
**Procedure**:
1. Identify failed deployment via Vercel Dashboard
2. Click "Promote Previous Deployment"
3. Verify rollback via health check endpoint
4. Notify #incidents channel
**Rollback Time**: < 2 minutes

### Scenario 2: Backend API Regression
**Trigger**: API error rate spikes > 5%
**Procedure**:
1. Check error logs in monitoring dashboard
2. Identify breaking change via git log
3. Revert to last stable commit
4. Run smoke tests
**Rollback Time**: < 5 minutes

### Scenario 3: Database Migration Failure
**Trigger**: Migration script fails mid-execution
**Procedure**:
1. Do NOT run further migrations
2. Restore from backup (point-in-time)
3. Disable affected feature flags
4. Fix migration script offline
**Rollback Time**: < 15 minutes

### Scenario 4: Feature Flag Gone Wrong
**Trigger**: Feature behaves incorrectly in production
**Procedure**:
1. Set feature flag to 0% rollout
2. Monitor error rates for 5 minutes
3. If stable, keep flag off
4. Investigate root cause
**Rollback Time**: < 1 minute

### Scenario 5: Dependency Supply Chain Attack
**Trigger**: Suspicious activity in dependencies
**Procedure**:
1. Pin dependency versions to last known good
2. Audit recently added packages
3. Enable audit CI workflow
4. Notify security team
**Rollback Time**: < 10 minutes

## Decision Matrix

| Severity | Condition | Action |
|----------|-----------|--------|
| P0 | Service down | Immediate rollback |
| P1 | >5% error rate | Rollback within 5min |
| P2 | Degraded performance | Rollback within 30min |
| P3 | Minor issue | Fix in next deploy |

## Contacts
- On-call: See PagerDuty rotation
- Escalation: @architect
