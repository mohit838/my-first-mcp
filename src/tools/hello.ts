import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerHelloTool(server: McpServer) {
  server.registerTool(
    "hello",
    {
      title: "Hello Tool",
      description: "Say hello to a person",
      inputSchema: {
        name: z.string().min(1, "Name is required"),
      },
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
    }
  );
}