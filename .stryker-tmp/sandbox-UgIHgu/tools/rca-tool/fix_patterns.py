#!/usr/bin/env python3
"""Fix double-escaped regex patterns in pattern files."""
import re
import os

def yaml_to_regex(s):
    """Convert YAML double-escaped regex to standard regex."""
    if not s:
        return s
    result = []
    i = 0
    while i < len(s):
        if i < len(s) - 1 and s[i] == '\\' and s[i+1] == '\\':
            result.append('\\')
            i += 2
        elif i < len(s) - 1 and s[i] == '\\' and s[i+1] != '\\':
            result.append(s[i])
            result.append(s[i+1])
            i += 2
        else:
            result.append(s[i])
            i += 1
    return ''.join(result)

changed_files = []

for root, dirs, files in os.walk('patterns'):
    for fname in files:
        if not fname.endswith('.md'):
            continue
        fpath = os.path.join(root, fname)
        with open(fpath) as f:
            content = f.read()
        
        orig_content = content
        
        # Fix double-quoted patterns
        def replace_dq(m):
            prefix = m.group(1)
            quoted = m.group(2)
            fixed = yaml_to_regex(quoted)
            return f'{prefix}"{fixed}"'
        content = re.sub(r'^(\s*- pattern:\s*)"(.+)"', replace_dq, content, flags=re.MULTILINE)
        
        # Fix single-quoted patterns
        def replace_sq(m):
            prefix = m.group(1)
            quoted = m.group(2)
            fixed = yaml_to_regex(quoted)
            return f"{prefix}'{fixed}'"
        content = re.sub(r"^(\s*- pattern:\s*)'(.+)'", replace_sq, content, flags=re.MULTILINE)
        
        if content != orig_content:
            with open(fpath, 'w') as f:
                f.write(content)
            changed_files.append(fpath)

for f in changed_files:
    print(f"Fixed: {f}")
print(f"Done! Fixed {len(changed_files)} files.")
