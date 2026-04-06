#!/usr/bin/env python3
"""
Batch-replace console.log/error/warn in vibex-backend with devLog/safeError.
"""
import os
import re
from pathlib import Path

BACKEND_ROOT = Path("/root/.openclaw/vibex/vibex-backend/src")

def process_backend_file(file_rel: str):
    """Process a single backend file."""
    file_path = BACKEND_ROOT / file_rel
    if not file_path.exists():
        return False, "file not found"
    
    content = file_path.read_text()
    
    # Check if file has console statements to replace
    has_console_log = "console.log" in content
    has_console_error = "console.error" in content
    has_console_warn = "console.warn" in content
    if not (has_console_log or has_console_error or has_console_warn):
        return False, "no console"
    
    # Check if already importing from log-sanitizer
    ls_import_match = re.search(
        r"import \{([^}]+)\} from ['\"]@/lib/log-sanitizer['\"]",
        content
    )
    
    already_has_devlog = False
    already_has_safeerror = False
    already_has_devdebug = False
    already_has_sanitize = False
    
    if ls_import_match:
        imported = [x.strip() for x in ls_import_match.group(1).split(",")]
        already_has_devlog = "devLog" in imported
        already_has_safeerror = "safeError" in imported
        already_has_devdebug = "devDebug" in imported
        already_has_sanitize = "sanitize" in imported
    
    # Perform replacements (console.* -> devLog/safeError)
    content = re.sub(r'\bconsole\.log\b', 'devLog', content)
    content = re.sub(r'\bconsole\.error\b', 'safeError', content)
    content = re.sub(r'\bconsole\.warn\b', 'safeError', content)
    
    # Determine imports to add
    needs_devlog = "devLog" in content
    needs_safeerror = "safeError" in content
    
    imports_to_add = []
    if needs_devlog and not already_has_devlog:
        imports_to_add.append("devLog")
    if needs_safeerror and not already_has_safeerror:
        imports_to_add.append("safeError")
    
    if imports_to_add:
        if ls_import_match:
            # Append to existing import
            old_import = ls_import_match.group(0)
            existing = [x.strip() for x in ls_import_match.group(1).split(",")]
            for imp in imports_to_add:
                if imp not in existing:
                    existing.append(imp)
            new_import = f"import {{ {', '.join(existing)} }} from '@/lib/log-sanitizer'"
            content = content.replace(old_import, new_import)
        else:
            # Add new import after the last import line or at top
            import_str = f"import {{ {', '.join(imports_to_add)} }} from '@/lib/log-sanitizer';\n"
            # Try to insert after last import
            import_lines = list(re.finditer(r'^import .+? from ["\'].+?["\'];?\s*$', content, re.MULTILINE))
            if import_lines:
                last_import = import_lines[-1]
                content = content[:last_import.end()] + "\n" + import_str + content[last_import.end():]
            else:
                content = import_str + content
    
    file_path.write_text(content)
    return True, f"added: {imports_to_add}" if imports_to_add else "replaced"

def main():
    backend_files = []
    for root, dirs, files in os.walk(BACKEND_ROOT):
        for f in files:
            if f.endswith(".ts"):
                rel = os.path.relpath(os.path.join(root, f), BACKEND_ROOT)
                backend_files.append(rel)
    
    print(f"Scanning {len(backend_files)} TypeScript files...")
    
    processed = 0
    for file_rel in sorted(backend_files):
        try:
            changed, detail = process_backend_file(file_rel)
            if changed:
                processed += 1
                print(f"  ✓ {file_rel} ({detail})")
        except Exception as e:
            print(f"  ✗ {file_rel}: {e}")
    
    print(f"\nDone. Processed {processed} files.")

if __name__ == "__main__":
    main()
