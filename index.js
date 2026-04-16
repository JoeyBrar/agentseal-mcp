#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_KEY = process.env.AGENTSEAL_API_KEY;
const BASE_URL = (process.env.AGENTSEAL_URL || "https://agentseal-api-production.up.railway.app").replace(/\/$/, "");

if (!API_KEY) {
  console.error("AGENTSEAL_API_KEY environment variable is required");
  process.exit(1);
}

async function apiCall(method, path, body = null) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AgentSeal API error ${res.status}: ${text}`);
  }
  return res.json();
}

const server = new Server(
  { name: "agentseal", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "record_action",
      description:
        "Record an agent action to the AgentSeal audit hash trail. " +
        "Call this after every significant action (sending emails, modifying files, " +
        "running queries, making API calls) to create a cryptographically sealed record " +
        "of what happened and why.",
      inputSchema: {
        type: "object",
        properties: {
          agent_id: {
            type: "string",
            description: "Identifier for this agent (e.g. 'research-bot', 'finance-agent')",
          },
          action_type: {
            type: "string",
            description:
              "What type of action was taken (e.g. 'email:send', 'file:write', 'api:call', 'db:query')",
          },
          action_params: {
            type: "object",
            description: "Parameters of the action (e.g. {to: 'user@example.com', subject: '...'})",
          },
          reasoning: {
            type: "string",
            description: "Why you decided to take this action — your chain of thought",
          },
          authorized_by: {
            type: "string",
            description: "Who or what authorized this action (e.g. 'user:alice', 'policy:auto-approve')",
          },
        },
        required: ["agent_id", "action_type"],
      },
    },
    {
      name: "query_actions",
      description:
        "Look up previously recorded actions from the audit trail. " +
        "Use this to check what actions have been taken, verify history, " +
        "or recall past decisions.",
      inputSchema: {
        type: "object",
        properties: {
          agent_id: {
            type: "string",
            description: "Filter by agent ID",
          },
          action_type: {
            type: "string",
            description: "Filter by action type",
          },
          limit: {
            type: "number",
            description: "Max entries to return (default 20)",
          },
        },
      },
    },
    {
      name: "verify_chain",
      description:
        "Verify the integrity of the audit trail hash chain. " +
        "Each entry's SHA-256 hash includes the previous entry's hash — " +
        "if any record was modified, the chain breaks and this will report where.",
      inputSchema: {
        type: "object",
        properties: {
          agent_id: {
            type: "string",
            description: "Verify chain for a specific agent only. If omitted, verifies all entries.",
          },
        },
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "record_action") {
      const result = await apiCall("POST", "/v1/entries", {
        agent_id: args.agent_id,
        action_type: args.action_type,
        action_params: args.action_params || {},
        reasoning: args.reasoning || null,
        authorization: args.authorized_by
          ? { authorized_by: args.authorized_by }
          : null,
      });

      return {
        content: [
          {
            type: "text",
            text: `Action recorded. Sequence: ${result.sequence}, Hash: ${result.entry_hash}`,
          },
        ],
      };
    }

    if (name === "query_actions") {
      const params = new URLSearchParams();
      if (args.agent_id) params.set("agent_id", args.agent_id);
      if (args.action_type) params.set("action_type", args.action_type);
      params.set("limit", String(args.limit || 20));

      const entries = await apiCall("GET", `/v1/entries?${params}`);

      if (entries.length === 0) {
        return {
          content: [{ type: "text", text: "No actions found matching the query." }],
        };
      }

      const summary = entries
        .map(
          (e) =>
            `[${e.timestamp}] ${e.agent_id} — ${e.action_type}: ${JSON.stringify(e.action_params)}` +
            (e.reasoning ? `\n  Reasoning: ${e.reasoning}` : "")
        )
        .join("\n\n");

      return {
        content: [{ type: "text", text: `Found ${entries.length} entries:\n\n${summary}` }],
      };
    }

    if (name === "verify_chain") {
      const body = args.agent_id ? { agent_id: args.agent_id } : {};
      const result = await apiCall("POST", "/v1/verify", body);

      if (result.valid) {
        return {
          content: [
            {
              type: "text",
              text: `Chain intact. ${result.entries_verified} entries verified, no tampering detected.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Chain broken at sequence ${result.broken_at_sequence}. Reason: ${result.reason}`,
          },
        ],
      };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

// Start
const transport = new StdioServerTransport();
await server.connect(transport);
