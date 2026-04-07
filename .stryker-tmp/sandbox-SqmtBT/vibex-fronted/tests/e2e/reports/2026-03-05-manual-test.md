# E2E Test Report - 2026-03-05

## Test Summary

- **Date**: Thu Mar 5 12:15:24 PM CST 2026
- **Environment**: https://vibex.top
- **Total**: 9
- **Passed**: 7
- **Failed**: 2

## Test Results

| Test             | Path              | Status |
| ---------------- | ----------------- | ------ |
| Landing Page     | /landing          | ✅     |
| Homepage         | /                 | ✅     |
| Auth Page        | /auth             | ✅     |
| Dashboard        | /dashboard        | ✅     |
| Requirements     | /requirements     | ✅     |
| Flow             | /flow             | ✅     |
| Project Settings | /project-settings | ✅     |
| Templates        | /templates        | ❌     |
| Chat             | /chat             | ❌     |

## Notes

- Manual validation triggered by user request
- Cron job configured: vibex-e2e-daily (daily at 8:00 Asia/Shanghai)
