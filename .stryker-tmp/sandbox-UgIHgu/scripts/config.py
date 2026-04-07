#!/usr/bin/env python3
"""config.py — 统一路径配置常量

所有绝对路径常量在此集中管理，避免散落在 task_manager.py 中。
导入方式:
  from config import TASK_LOCK_BASE, UPDATE_LOG, MAC_KEY_FILE, ...
"""

import os

# ── 本脚本所在目录 ─────────────────────────────────────────────────
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── 锁文件根目录 ───────────────────────────────────────────────────
# 用于多进程/多 agent 的任务锁，防止并发 claim
TASK_LOCK_BASE = os.path.expanduser("~/.task_locks")

# ── update 操作日志 ────────────────────────────────────────────────
UPDATE_LOG = os.path.join(_SCRIPT_DIR, "../logs/update.log")

# ── HMAC 防篡改密钥文件 ─────────────────────────────────────────────
MAC_KEY_FILE = os.path.expanduser("~/.openclaw/.task_mac_key")

# ── current_report 包路径 ──────────────────────────────────────────
CURRENT_REPORT_PKG = os.path.join(_SCRIPT_DIR, "current_report")

# ── 默认工作目录 ───────────────────────────────────────────────────
DEFAULT_WORK_DIR = "/root/.openclaw/vibex"

# ── 报告输出根目录 ─────────────────────────────────────────────────
REPORTS_DIR = os.path.join(_SCRIPT_DIR, "reports")

# ── Slack 通知模板目录 ──────────────────────────────────────────────
SLACK_TEMPLATE_DIR = os.path.join(_SCRIPT_DIR, "reports")
