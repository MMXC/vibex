#!/usr/bin/env python3
"""
Batch-replace console.log/error/warn in vibex-fronted with canvasLogger.default.*.
Replaces console.log -> canvasLogger.default.debug, console.error -> canvasLogger.default.error, console.warn -> canvasLogger.default.warn.
"""
import os
import re
from pathlib import Path

FRONTEND_ROOT = Path("/root/.openclaw/vibex/vibex-fronted/src")

IMPORT_RE = re.compile(r"import \{ ([^}]+) \} from ['\"]@/lib/canvas/canvasLogger['\"]")
IMPORT_NAMED = re.compile(r"import (canvasLogger|logger) from ['\"]@/lib/canvas/canvasLogger['\"]")
IMPORT_STAR = re.compile(r"import \* as (canvasLogger|logger) from ['\"]@/lib/canvas/canvasLogger['\"]")

def process_frontend_file(file_rel: str):
    file_path = FRONTEND_ROOT / file_rel
    if not file_path.exists():
        return False, "file not found"
    
    content = file_path.read_text()
    
    has_console_log = "console.log" in content
    has_console_error = "console.error" in content
    has_console_warn = "console.warn" in content
    has_console_info = "console.info" in content
    if not (has_console_log or has_console_error or has_console_warn or has_console_info):
        return False, "no console"
    
    # Check existing canvasLogger import
    has_canvaslogger_import = bool(IMPORT_RE.search(content) or IMPORT_NAMED.search(content) or IMPORT_STAR.search(content))
    has_canvaslogger_default = "canvasLogger.default" in content
    
    # Perform replacements
    # Replace console.log -> canvasLogger.default.debug
    content = re.sub(r'\bconsole\.log\b', 'canvasLogger.default.debug', content)
    # Replace console.error -> canvasLogger.default.error
    content = re.sub(r'\bconsole\.error\b', 'canvasLogger.default.error', content)
    # Replace console.warn -> canvasLogger.default.warn
    content = re.sub(r'\bconsole\.warn\b', 'canvasLogger.default.warn', content)
    # Replace console.info -> canvasLogger.default.info
    content = re.sub(r'\bconsole\.info\b', 'canvasLogger.default.info', content)
    
    # Add import if needed
    if not has_canvaslogger_import and "canvasLogger.default" in content:
        import_str = "import { canvasLogger } from '@/lib/canvas/canvasLogger';\n"
        import_lines = list(re.finditer(r'^import .+? from ["\'].+?["\'];?\s*$', content, re.MULTILINE))
        if import_lines:
            last_import = import_lines[-1]
            content = content[:last_import.end()] + "\n" + import_str + content[last_import.end():]
        else:
            content = import_str + content
    
    file_path.write_text(content)
    return True, "ok"

def main():
    files = []
    for root, dirs, filenames in os.walk(FRONTEND_ROOT):
        for f in filenames:
            if f.endswith((".ts", ".tsx")):
                rel = os.path.relpath(os.path.join(root, f), FRONTEND_ROOT)
                files.append(rel)
    
    print(f"Scanning {len(files)} TypeScript files...")
    
    processed = 0
    for file_rel in sorted(files):
        try:
            changed, detail = process_frontend_file(file_rel)
            if changed:
                processed += 1
                print(f"  ✓ {file_rel}")
        except Exception as e:
            print(f"  ✗ {file_rel}: {e}")
    
    print(f"\nDone. Processed {processed} files.")

if __name__ == "__main__":
    main()
