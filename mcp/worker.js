const REPO = "Dreamhacker-Fear/super-duper-octo-pancake";
const GITHUB = "https://api.github.com";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" }
  });
}

async function github(path) {
  const r = await fetch(GITHUB + path, {
    headers: {
      "Accept": "application/vnd.github+json",
      "User-Agent": "super-duper-octo-pancake-mcp"
    }
  });
  const body = await r.json();
  if (!r.ok) throw new Error(body.message || `GitHub HTTP ${r.status}`);
  return body;
}

async function callTool(name, args) {
  if (name === "repo_info") {
    return github(`/repos/${REPO}`);
  }

  if (name === "list_files") {
    const path = String(args?.path || "");
    return github(`/repos/${REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`);
  }

  if (name === "read_file") {
    const path = String(args?.path || "");
    const file = await github(`/repos/${REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`);
    if (!file.content) throw new Error("File is not a text file.");
    return {
      path: file.path,
      sha: file.sha,
      content: atob(file.content.replace(/\n/g, "")),
      html_url: file.html_url
    };
  }

  if (name === "search_files") {
    const q = String(args?.query || "").trim();
    if (!q) throw new Error("query is required");
    const result = await github(`/search/code?q=${encodeURIComponent(q + " repo:" + REPO)}`);
    return result;
  }

  throw new Error(`Unknown tool: ${name}`);
}

const TOOLS = [
  {
    name: "repo_info",
    description: "Get repository metadata for Dreamhacker-Fear/super-duper-octo-pancake.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "list_files",
    description: "List files and folders in the repository. Optional path selects a folder or file.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Repository path, e.g. plugins/message-templates" } },
      additionalProperties: false
    }
  },
  {
    name: "read_file",
    description: "Read a text file from the repository.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Repository path, e.g. plugins/message-templates/js/index.tsx" } },
      required: ["path"],
      additionalProperties: false
    }
  },
  {
    name: "search_files",
    description: "Search the repository's indexed source files using GitHub code search.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Search text or code pattern" } },
      required: ["query"],
      additionalProperties: false
    }
  }
];

function rpc(id, result) {
  return json({ jsonrpc: "2.0", id, result });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return json({ name: "super-duper-octo-pancake-mcp", status: "ok", repository: REPO });
    }

    if (request.method !== "POST" || url.pathname !== "/mcp") {
      return json({ error: "Not found" }, 404);
    }

    let msg;
    try {
      msg = await request.json();
    } catch {
      return json({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" } }, 400);
    }

    try {
      if (msg.method === "initialize") {
        return rpc(msg.id, {
          protocolVersion: "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: { name: "super-duper-octo-pancake-mcp", version: "1.0.0" }
        });
      }

      if (msg.method === "notifications/initialized") {
        return new Response(null, { status: 202 });
      }

      if (msg.method === "ping") {
        return rpc(msg.id, {});
      }

      if (msg.method === "tools/list") {
        return rpc(msg.id, { tools: TOOLS });
      }

      if (msg.method === "tools/call") {
        const name = msg.params?.name;
        const args = msg.params?.arguments || {};
        const result = await callTool(name, args);
        return rpc(msg.id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        });
      }

      return json({ jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: "Method not found" } }, 404);
    } catch (e) {
      return rpc(msg.id, {
        error: {
          code: -32000,
          message: e instanceof Error ? e.message : String(e)
        }
      });
    }
  }
};