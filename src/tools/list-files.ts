import fs from "fs/promises";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveSafePath } from "../utils/fs-utils.js";

export function registerListFilesTool(server: McpServer) {
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
        const targetDir = resolveSafePath(dir || ".");
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
}
