#!/usr/bin/env python3
"""
zombie-alert.py — 检测 zombie 任务并发送告警
用法: python3 zombie-alert.py [--config <json-config>]
集成: task_manager.py 的 zombie 检测逻辑
"""
import sys
import os
import json
import time
import argparse
from pathlib import Path
from typing import List, Optional

# 告警配置
DEFAULT_CONFIG = {
    'warning_threshold': 2,       # zombie > 2 时告警
    'critical_threshold': 5,       # zombie >= 5 时严重告警
    'escalation_time': 30,       # 响应超时阈值（分钟）
    're_alert_interval': 5,      # 重复告警最小间隔（分钟）
    'dry_run': False
}


def get_zombie_tasks() -> List[dict]:
    """
    从 task_manager 获取 zombie 任务列表
    模拟: 返回空列表（实际集成时调用 task_manager API）
    """
    # TODO: 集成 task_manager.get_zombie_tasks()
    # 临时返回模拟数据用于测试
    return []


def check_zombie_alert(config: dict = None) -> dict:
    """
    检测 zombie 任务并生成告警
    Returns: {zombies: [], alerts: [], stats: {}}
    """
    if config is None:
        config = DEFAULT_CONFIG

    zombies = get_zombie_tasks()
    alerts = []

    # 阈值检查
    zombie_count = len(zombies)
    if zombie_count >= config['critical_threshold']:
        alerts.append({
            'level': 'critical',
            'message': f'🚨 严重: {zombie_count} 个 zombie 任务，超过临界值 {config["critical_threshold"]}'
        })
    elif zombie_count > config['warning_threshold']:
        alerts.append({
            'level': 'warning',
            'message': f'⚠️  警告: {zombie_count} 个 zombie 任务'
        })

    # 响应时间检查
    now = time.time()
    for z in zombies:
        elapsed_min = (now - z.get('zombie_start_time', now)) / 60
        if elapsed_min > config['escalation_time']:
            alerts.append({
                'level': 'escalation',
                'message': f'⏰ Zombie {z.get("task_id")} 响应时间超过 {config["escalation_time"]}min',
                'task_id': z.get('task_id'),
                'elapsed_min': round(elapsed_min, 1)
            })

    # 统计信息
    stats = {
        'zombie_count': zombie_count,
        'alert_count': len(alerts),
        'checked_at': time.strftime('%Y-%m-%d %H:%M:%S')
    }

    return {
        'zombies': zombies,
        'alerts': alerts,
        'stats': stats,
        'config': config
    }


def should_send_alert(alerts: List[dict], config: dict) -> bool:
    """检查是否应该发送告警（基于重复告警间隔）"""
    if not alerts:
        return False

    # 检查最近告警时间（可通过文件锁实现，这里简化处理）
    return True


def send_alert(alerts: List[dict], config: dict) -> bool:
    """
    发送告警到 Slack
    TODO: 集成 openclaw 的 Slack 通知
    """
    if config.get('dry_run'):
        for a in alerts:
            print(f'[DRY RUN] 告警: {a["message"]}')
        return True

    # TODO: 实际调用 Slack API
    # openclaw slack send --channel ... --message ...
    return True


def main():
    parser = argparse.ArgumentParser(description='Zombie 任务告警检测')
    parser.add_argument('--config', type=str, help='JSON 配置文件路径')
    parser.add_argument('--dry-run', action='store_true', help='仅打印告警，不发送')
    parser.add_argument('--threshold', type=int, help='警告阈值（覆盖配置）')
    args = parser.parse_args()

    config = DEFAULT_CONFIG.copy()
    if args.dry_run:
        config['dry_run'] = True
    if args.threshold:
        config['warning_threshold'] = args.threshold
    if args.config and os.path.exists(args.config):
        with open(args.config, 'r') as f:
            user_config = json.load(f)
            config.update(user_config)

    result = check_zombie_alert(config)

    if result['alerts']:
        if should_send_alert(result['alerts'], config):
            send_alert(result['alerts'], config)
        print(f'🚨 告警: {len(result["alerts"])} 条')
        for a in result['alerts']:
            print(f'  {a["message"]}')
    else:
        print(f'✅ 无告警 ({result["stats"]["zombie_count"]} zombie)')

    return 0


if __name__ == '__main__':
    sys.exit(main())
