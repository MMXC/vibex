# Dev 提案 P003 — task_manager.py push block 根因修复

**Agent**: dev
**日期**: 2026-04-05

## 问题描述
task_manager.py 包含 Slack token 历史，GitHub secret scanning 阻止所有涉及该文件的 commit push。

## 根因分析
早期 task_manager.py 使用硬编码 Slack token（xoxp-...），即使改为 env var 引用，token 仍存在于 git 历史。

## 建议方案
从 git 历史中删除 token 字符串（git filter-branch 或 BFG Repo-Cleaner），同时确保所有 Slack token 只从环境变量读取。
