import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

const BASE_DIR = process.cwd();

const SKIP_DIRS = new Set(["node_modules", ".git", "dist"]);

async function getAllFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }

      const nestedFiles = await getAllFiles(fullPath);
      files.push(...nestedFiles);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

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

server.registerTool(
  "read_file",
  {
    title: "Read File",
    description: "Read a file from the project directory",
    inputSchema: {
      filePath: z.string().min(1, "filePath is required"),
    },
  },
  async ({ filePath }) => {
    try {
      const targetFile = path.resolve(BASE_DIR, filePath);

      if (!targetFile.startsWith(BASE_DIR)) {
        throw new Error("Access denied: outside base directory");
      }

      const stat = await fs.stat(targetFile);

      if (!stat.isFile()) {
        throw new Error("Target path is not a file");
      }

      const content = await fs.readFile(targetFile, "utf-8");

      return {
        content: [
          {
            type: "text",
            text: content,
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

server.registerTool(
  "search_text",
  {
    title: "Search Text",
    description: "Search for text inside files under the project directory",
    inputSchema: {
      query: z.string().min(1, "query is required"),
      dir: z.string().optional(),
    },
  },
  async ({ query, dir }) => {
    try {
      const targetDir = path.resolve(BASE_DIR, dir || ".");

      if (!targetDir.startsWith(BASE_DIR)) {
        throw new Error("Access denied: outside base directory");
      }

      const stat = await fs.stat(targetDir);

      if (!stat.isDirectory()) {
        throw new Error("Target path is not a directory");
      }

      const allFiles = await getAllFiles(targetDir);
      const matches: string[] = [];

      for (const file of allFiles) {
        try {
          const fileStat = await fs.stat(file);

          // Skip very large files
          if (fileStat.size > 1024 * 1024) {
            continue;
          }

          const content = await fs.readFile(file, "utf-8");
          const lines = content.split("\n");

          lines.forEach((line, index) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              const relativePath = path.relative(BASE_DIR, file);
              matches.push(`${relativePath}:${index + 1}: ${line.trim()}`);
            }
          });
        } catch {
          // Ignore unreadable or binary-like files for now
          continue;
        }
      }

      if (matches.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No matches found for "${query}" in ${dir || "."}.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Found ${matches.length} match(es):\n\n${matches.join("\n")}`,
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

server.registerTool(
  "write_file",
  {
    title: "Write File",
    description: "Write text content to a file inside the project directory",
    inputSchema: {
      filePath: z.string().min(1, "filePath is required"),
      content: z.string(),
    },
  },
  async ({ filePath, content }) => {
    try {
      const targetFile = path.resolve(BASE_DIR, filePath);

      if (!targetFile.startsWith(BASE_DIR)) {
        throw new Error("Access denied: outside base directory");
      }

      const parentDir = path.dirname(targetFile);
      await fs.mkdir(parentDir, { recursive: true });

      await fs.writeFile(targetFile, content, "utf-8");

      return {
        content: [
          {
            type: "text",
            text: `File written successfully: ${filePath}`,
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
