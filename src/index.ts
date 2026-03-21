import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-first-mcp",
  version: "1.0.0",
});

server.registerTool(
  "hello",
  {
    title: "Hello Tool",
    description: "Say hello to a person",
    inputSchema: z.object({
      name: z.string().min(1, "Name is required"),
    }),
  },
  async ({ name }) => {
    return {
      content: [
        {
          type: "text",
          text: `Hello, ${name}! This is your first MCP tool.`,
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server is running on stdio...");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
