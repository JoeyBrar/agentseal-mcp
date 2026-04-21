# agentseal-mcp

[![agentseal-mcp MCP server](https://glama.ai/mcp/servers/JoeyBrar/agentseal-mcp/badges/card.svg)](https://glama.ai/mcp/servers/JoeyBrar/agentseal-mcp)

MCP server for [AgentSeal](https://agentseal.io). Tamper-proof audit logs for AI agents, using SHA-256 hash chains.

Every agent action is recorded in a hash chain. With this, you can actually prove to your clients that your agent did what it said it did.

## Setup

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agentseal": {
      "command": "npx",
      "args": ["-y", "agentseal-mcp"],
      "env": {
        "AGENTSEAL_API_KEY": "as_sk_your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

### Cursor / Other MCP hosts

Same configuration — add the server with your API key.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `AGENTSEAL_API_KEY` | Yes | Your API key from [agentseal.io](https://agentseal.io) |
| `AGENTSEAL_URL` | No | Custom API base URL (defaults to production) |

## Tools

### `record_action`

Record an agent action to the audit trail. Call this after significant actions to create a cryptographically chained record of what happened and why.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `agent_id` | string | Yes | Identifier for the agent (e.g. `research-bot`) |
| `action_type` | string | Yes | What kind of action (e.g. `email:send`, `file:write`, `api:call`) |
| `action_params` | object | No | Details of the action |
| `reasoning` | string | No | Why the agent decided to take this action |
| `authorized_by` | string | No | Who or what approved the action |

Returns a sequence number and SHA-256 hash confirming the entry was chained.

### `query_actions`

Look up previously recorded actions from the audit trail. Use this to check what actions have been taken or recall past decisions.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `agent_id` | string | No | Filter by agent |
| `action_type` | string | No | Filter by action type |
| `limit` | number | No | Max entries to return (default 20) |

### `verify_chain`

Verify the integrity of the hash chain. Each entry's SHA-256 hash includes the previous entry's hash — if any record was modified, the chain breaks and this reports where.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `agent_id` | string | No | Verify chain for a specific agent. If omitted, verifies all entries. |

Returns the number of entries verified and whether the chain is intact.

## How it works

Each recorded action is hashed with SHA-256. That hash includes the previous entry's hash, forming a chain. Modify any record and every hash after it changes — `verify_chain` catches it instantly.

## Get an API key

Sign up at [agentseal.io](https://agentseal.io). Free to use.

## Python SDK

For direct integration without MCP: `pip install agentseal-sdk`. See [agentseal-sdk](https://github.com/JoeyBrar/agentseal-sdk).

## License

MIT
