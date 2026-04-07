# Spec: Output Verification Command

## Command Signature

```bash
python3 task_manager.py verify <project> <stage>
```

## Behavior

1. Read expected outputs from tasks.json
2. Check each output file/directory exists
3. Return 0 if all outputs exist
4. Return 1 with error message if any output missing

## Examples

```bash
# Verify architecture output
python3 task_manager.py verify json-file-bypass-prevention design-architecture

# Verify all outputs for a project
python3 task_manager.py verify json-file-bypass-prevention --all
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All outputs exist |
| 1 | One or more outputs missing |
| 2 | Project not found |
