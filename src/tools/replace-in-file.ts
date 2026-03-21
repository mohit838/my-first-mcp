import fs from "fs/promises";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveSafePath } from "../utils/fs-utils.js";

export function registerReplaceInFileTool(server: McpServer) {
  server.registerTool(
    "replace_in_file",
    {
      title: "Replace In File",
      description: "Replace text inside a file in the project directory",
      inputSchema: {
        filePath: z.string().min(1, "filePath is required"),
        search: z.string().min(1, "search text is required"),
        replace: z.string(),
      },
    },
    async ({ filePath, search, replace }) => {
      try {
        const targetFile = resolveSafePath(filePath);
        const stat = await fs.stat(targetFile);

        if (!stat.isFile()) {
          throw new Error("Target path is not a file");
        }

        const originalContent = await fs.readFile(targetFile, "utf-8");

        if (!originalContent.includes(search)) {
          throw new Error("Search text not found in file");
        }

        const updatedContent = originalContent.replace(search, replace);
        await fs.writeFile(targetFile, updatedContent, "utf-8");

        return {
          content: [
            {
              type: "text",
              text: `Replaced text successfully in: ${filePath}`,
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
