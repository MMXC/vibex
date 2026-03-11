# Contributing to VibeX

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

## Pre-commit Hooks

This project uses pre-commit hooks to ensure code quality and security.

### Setup

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install
```

### Hooks Included

- **Gitleaks**: Scans for secrets (API keys, passwords, etc.)
- **ESLint**: Lints TypeScript/JavaScript files
- **Trailing Whitespace**: Removes trailing whitespace
- **End-of-file Fixer**: Ensures files end with newline
- **YAML Check**: Validates YAML files
- **Large Files Check**: Prevents commits with files > 1MB

### Run Manually

```bash
# Run all hooks on all files
pre-commit run --all-files

# Run specific hook
pre-commit run gitleaks --all-files
```

## Security Scanning

### Vulnerability Scan

```bash
# Run vulnerability scan
npm run scan:vuln

# Generate vulnerability report
npm run report:vuln
```

### CI/CD

- Vulnerability scans run automatically on push and PR
- Pre-commit hooks run locally before each commit
- Gitleaks scans for secrets in CI

## Code Style

- Use ESLint configuration
- Run `npm run lint` before committing
- Fix issues with `npm run lint:fix`

## Testing

- Unit tests: `npm test`
- Coverage: `npm run test:coverage`
- E2E tests: `npm run test:e2e`

## Branch Naming

- Feature: `feat/xxx`
- Fix: `fix/xxx`
- Chore: `chore/xxx`

## Commit Messages

Follow conventional commits:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `chore: maintenance task`