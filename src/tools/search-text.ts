import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BASE_DIR } from "../config.js";
import { getAllFiles, resolveSafePath } from "../utils/fs-utils.js";

export function registerSearchTextTool(server: McpServer) {
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
        const targetDir = resolveSafePath(dir || ".");
        const stat = await fs.stat(targetDir);

        if (!stat.isDirectory()) {
          throw new Error("Target path is not a directory");
        }

        const allFiles = await getAllFiles(targetDir);
        const matches: string[] = [];

        for (const file of allFiles) {
          try {
            const fileStat = await fs.stat(file);

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
}
