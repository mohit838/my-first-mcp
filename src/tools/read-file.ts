import fs from "fs/promises";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveSafePath } from "../utils/fs-utils.js";

export function registerReadFileTool(server: McpServer) {
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
        const targetFile = resolveSafePath(filePath);
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
}
