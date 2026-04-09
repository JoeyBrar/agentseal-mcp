# agentseal-mcp

MCP server for [AgentSeal](https://agentseal.io). Unalterable cryptographic audit trails for AI agents.

Record everything your agent does with unalterable cryptographic proof.

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

### Cursor / Other MCP hosts

Same configuration — add the server with your API key.

## Tools

### `record_action`

Record an agent action to the cryptographic audit trail.

- `agent_id` — which agent took the action
- `action_type` — what kind of action (e.g. `email:send`, `file:write`)
- `action_params` — details of the action
- `reasoning` — why the agent decided to do this
- `authorized_by` — who approved it

### `query_actions`

Look up previously recorded actions. Filter by agent, action type, or time range.

## Get an API key

Sign up at [agentseal.io](https://agentseal.io)

## License

MIT
