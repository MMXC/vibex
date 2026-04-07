# ~/.bashrc for vibex workspace
# Ensures proper PATH and PYTHONPATH even in sandbox/isolated environments

# Core paths that must be present
export PATH="/usr/bin:/usr/local/bin:/bin:/root/.local/bin:/root/.local/share/pnpm:/root/.bun/bin:/root/.npm-global/bin:/root/bin:/root/.volta/bin:/root/.asdf/shims:/root/.nvm/current/bin:/root/.fnm/current/bin:$PATH"

# Python path for local modules
export PYTHONPATH="/root/.openclaw/vibex:$PYTHONPATH"

# Node path for global packages
export NODE_PATH="/root/.npm-global/lib/node_modules:/root/.local/share/pnpm:/root/.bun/lib/node_modules:$NODE_PATH"

# Ensure workspace is in PATH
export PATH="/root/.openclaw/vibex/node_modules/.bin:/root/.openclaw/vibex/vibex-fronted/node_modules/.bin:/root/.openclaw/vibex/vibex-backend/node_modules/.bin:$PATH"
