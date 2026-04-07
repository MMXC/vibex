# MCP Server Integration Guide

## Overview
The VibeX MCP Server enables Claude Desktop to interact with VibeX projects.

## Installation

```bash
cd packages/mcp-server
npm install
npm run build
```

## Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vibex": {
      "command": "node",
      "args": ["/absolute/path/to/packages/mcp-server/dist/index.js"]
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| create_project | Create a new VibeX project |
| get_project | Get project details |
| list_components | List project components |
| generate_code | Generate component code |

## Examples

```
You: Create a project called "my-app" for an e-commerce checkout flow
Claude: [calls create_project tool]

You: Generate React code for the checkout component
Claude: [calls generate_code tool with framework=react]
```
