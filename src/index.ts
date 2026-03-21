import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

const BASE_DIR = process.cwd();

const server = new McpServer({
  name: "my-first-mcp",
  version: "1.0.0",
});

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
  },
);

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

server.registerTool(
  "list_files",
  {
    title: "List Files",
    description: "List files in a directory (relative to project root)",
    inputSchema: {
      dir: z.string().optional(),
    },
  },
  async ({ dir }) => {
    try {
      const targetDir = path.resolve(BASE_DIR, dir || ".");

      // Security: ensure path is inside project
      if (!targetDir.startsWith(BASE_DIR)) {
        throw new Error("Access denied: outside base directory");
      }

      const files = await fs.readdir(targetDir);

      return {
        content: [
          {
            type: "text",
            text: `Files in ${dir || "."}:\n\n${files.join("\n")}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
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
