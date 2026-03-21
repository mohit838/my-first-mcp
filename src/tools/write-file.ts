import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveSafePath } from "../utils/fs-utils.js";

export function registerWriteFileTool(server: McpServer) {
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
        const targetFile = resolveSafePath(filePath);
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
}
