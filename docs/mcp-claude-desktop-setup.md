# Claude Desktop MCP Setup

**Agent**: dev
**Date**: 2026-04-28
**Epic**: E15-P005

## Overview

This document describes how to configure Claude Desktop to use the VibeX MCP Server with the `coding_agent` tool.

## MCP Server Configuration

Add the following to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vibex": {
      "command": "node",
      "args": ["/path/to/vibex/packages/mcp-server/dist/index.js"],
      "env": {
        "MCP_API_BASE": "http://localhost:3000"
      }
    }
  }
}
```

## Available Tools

### coding_agent

Invoke the VibeX AI coding agent to generate code from design context.

**Parameters**:
- `task` (string, required): The coding task description
- `context` (object, optional): Code generation context with nodes and schemaVersion

**Example**:
```json
{
  "name": "coding_agent",
  "arguments": {
    "task": "Create a React button component with primary and secondary variants",
    "context": {
      "nodes": [
        { "id": "btn-1", "type": "component", "name": "PrimaryButton" }
      ],
      "schemaVersion": "1.2.0"
    }
  }
}
```

## Verification

1. Start the VibeX dev server: `cd vibex-fronted && pnpm dev`
2. Start the MCP server: `cd packages/mcp-server && pnpm build && node dist/index.js`
3. In Claude Desktop, verify the `coding_agent` tool appears in the tools list
4. Test: send a message asking Claude to use `coding_agent` to generate a component

## Troubleshooting

- **Tool not found**: Ensure the MCP server is running and the config file is valid JSON
- **Connection refused**: Check that the VibeX dev server is running on port 3000
- **No response**: Verify `MCP_API_BASE` points to the correct VibeX instance