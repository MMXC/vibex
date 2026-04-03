# Changelog: team-evolution-20260328

All notable changes to the Harness Engineering Self-Evolution project.

## [Unreleased] — Phase3 DeltaTracker

### Added
- **`delta-tracker.sh`**: Delta change tracking script
  - Reads self + scorer scores from `scores.tsv`
  - Computes delta = scorer - self
  - Writes delta to scores.tsv delta column
  - Calls `analyst-evolution.sh delta-record` for trend tracking
  - Triggers Slack alert when |delta| >= 2

- **`analyst-evolution.sh` delta-record branch**: Extended to support delta-record type
  - Reads self/scorer scores from scores.tsv
  - Appends delta-record entries to `analyst-results.tsv`
  - Alerts via Slack when threshold exceeded

### Verified
- ✅ `delta-tracker.sh` computes correct delta (BATS test ok 8)
- ✅ awaiting scorer exits 0 without error (BATS test ok 9)
- ✅ no self-score exits 0 (BATS test ok 10)
- ✅ threshold exceeded triggers alert (BATS test ok 11)
- ✅ 21 delta records in analyst-results.tsv

---

## Phase2: ErrorLog Automation — 2026-03-28

### Added
- **`auto-error-log.sh`**: Automatic error pattern detection and HEARTBEAT.md E00x backfill
  - 5 error patterns: rate-limit, timeout, claim-locked, failure, inconsistent
  - Deduplication against existing E00x entries
  - Atomic write with .bak backup before HEARTBEAT.md modification
  - Lesson reference appended to phase file

### Verified
- ✅ rate limit pattern detected (BATS test ok 5)
- ✅ no error patterns exits 0 (BATS test ok 6)
- ✅ backup created before write (BATS test ok 7)

---

## Phase1: Self-Score Foundation — 2026-03-28

### Added
- **`self-score-hook.sh`**: Agent self-scoring hook
  - Parses phase file to extract agent type and task metadata
  - 9-dimension weighted scoring (0-10, 0.5 step)
  - Agent→dimension weight mapping (6 agents)
  - Writes to scores.tsv with rater=self

### Verified
- ✅ phase file parsed correctly (BATS test ok 1)
- ✅ missing phase file exits 0 (BATS test ok 2)
- ✅ score written to scores.tsv (BATS test ok 3)
- ✅ empty phase file skipped (BATS test ok 4)
