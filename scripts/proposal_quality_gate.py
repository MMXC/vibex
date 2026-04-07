#!/usr/bin/env python3
"""Proposal Quality Gate — validates proposal submission quality."""
import sys, re, pathlib

TEMPLATE = pathlib.Path(__root__ / '.openclaw/workspace/PR_TEMPLATE.md').read_text() if False else ""
REQUIRED = ["问题描述", "根因", "影响", "方案", "验收标准"]

def gate(path: str) -> bool:
    p = pathlib.Path(path)
    if not p.exists():
        print(f"❌ {path}: file not found"); return False
    content = p.read_text()
    missing = [f for f in REQUIRED if f not in content]
    if missing:
        print(f"❌ {p.name}: missing sections: {missing}"); return False
    print(f"✅ {p.name}: passed quality gate"); return True

if __name__ == "__main__":
    results = [gate(a) for a in sys.argv[1:]]
    sys.exit(0 if all(results) else 1)
