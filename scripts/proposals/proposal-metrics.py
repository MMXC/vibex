#!/usr/bin/env python3
"""proposal-metrics.py - Generate proposal health metrics from INDEX.md"""

import sys
import argparse
import json
import re
from datetime import datetime, date
from pathlib import Path

def parse_index(path):
    """Parse INDEX.md and extract proposal data."""
    if not Path(path).exists():
        print(f"ERROR: INDEX.md not found at {path}", file=sys.stderr)
        sys.exit(1)
    
    proposals = []
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parse table rows: | ID | Title | Sprint | Status | Owner | Created | Updated |
    # ID formats: A-P0-1, R-P1-2, T001, D001, P001
    rows = re.findall(
        r'^\| ((?:A-P\d+-\d+|R-P\d+-\d+|T\d+|D\d+|P\d+)) \| (.+?) \| (\S+) \| (\S+) \| (\S+) \| (\S+) \| (\S+) \|',
        content, re.MULTILINE
    )
    
    for row in rows:
        proposal_id, title, sprint, status, owner, created, updated = row
        # Derive priority tier from ID
        if 'P0' in proposal_id:
            priority = 'P0'
        elif 'P1' in proposal_id:
            priority = 'P1'
        else:
            priority = 'P2+'
        created_date = None
        try:
            created_date = datetime.strptime(created, '%Y-%m-%d').date()
        except ValueError:
            pass
        proposals.append({
            'id': proposal_id,
            'title': title.strip(),
            'sprint': sprint,
            'status': status.strip(),
            'owner': owner.strip(),
            'created': created,
            'created_date': created_date,
            'priority': priority,
        })
    
    return proposals

def compute_metrics(proposals):
    """Compute metrics from proposal list."""
    today = date.today()
    
    p0 = [p for p in proposals if p['priority'] == 'P0']
    p1 = [p for p in proposals if p['priority'] == 'P1']
    p2plus = [p for p in proposals if p['priority'] == 'P2+']
    
    def stats(group):
        total = len(group)
        done = len([p for p in group if p['status'] == 'done'])
        pending = len([p for p in group if p['status'] in ('pending', 'in-progress')])
        closure_rate = done / total if total > 0 else 0.0
        
        ages = []
        stale = []
        for p in group:
            if p['created_date']:
                age = (today - p['created_date']).days
                ages.append(age)
                if age > 7 and p['status'] != 'done':
                    stale.append({'id': p['id'], 'title': p['title'], 'age': age})
        
        avg_age = sum(ages) / len(ages) if ages else 0
        
        return {
            'total': total,
            'done': done,
            'pending': pending,
            'closure_rate': round(closure_rate, 3),
            'avg_age_days': round(avg_age, 1),
            'stale': stale,
        }
    
    total = len(proposals)
    done = len([p for p in proposals if p['status'] == 'done'])
    closure_rate = done / total if total > 0 else 0.0
    
    return {
        'total': total,
        'done': done,
        'closure_rate': round(closure_rate, 3),
        'p0': stats(p0),
        'p1': stats(p1),
        'p2plus': stats(p2plus),
    }

def print_table(metrics):
    """Print human-readable table."""
    print("=" * 60)
    print("  VibeX Proposal Metrics")
    print("=" * 60)
    print(f"  Total: {metrics['total']} proposals, closure rate: {metrics['closure_rate']:.1%}")
    print()
    
    for group, label in [('p0', 'P0'), ('p1', 'P1'), ('p2plus', 'P2+')]:
        g = metrics[group]
        print(f"  [{label}] Total: {g['total']} | Done: {g['done']} | Pending: {g['pending']} | Avg Age: {g['avg_age_days']}d")
        if g['stale']:
            print(f"    Stale (>7d):")
            for s in g['stale'][:5]:
                print(f"      - {s['id']}: {s['title']} ({s['age']}d)")
        print()
    
    print("=" * 60)

def main():
    parser = argparse.ArgumentParser(description='Proposal health metrics')
    parser.add_argument('--json', action='store_true', help='Output JSON format')
    parser.add_argument('--index', default='docs/proposals/INDEX.md', help='INDEX.md path')
    args = parser.parse_args()
    
    proposals = parse_index(args.index)
    metrics = compute_metrics(proposals)
    
    if args.json:
        print(json.dumps(metrics, indent=2, ensure_ascii=False))
    else:
        print_table(metrics)
    
    sys.exit(0)

if __name__ == '__main__':
    main()
