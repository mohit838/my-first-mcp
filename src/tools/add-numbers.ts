import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerAddNumbersTool(server: McpServer) {
  server.registerTool(
    "add_numbers",
    {
      title: "Add Numbers",
      description: "Add two numbers together",
      inputSchema: {
        a: z.number(),
        b: z.number(),
      },
    },
    async ({ a, b }) => {
      const sum = a + b;

      return {
        content: [
          {
            type: "text",
            text: `The sum of ${a} and ${b} is ${sum}.`,
          },
        ],
      };
    },
  );
}
