import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAddNumbersTool } from "./tools/add-numbers.js";
import { registerHelloTool } from "./tools/hello.js";
import { registerListFilesTool } from "./tools/list-files.js";
import { registerReadFileTool } from "./tools/read-file.js";
import { registerReplaceInFileTool } from "./tools/replace-in-file.js";
import { registerSearchTextTool } from "./tools/search-text.js";
import { registerWriteFileTool } from "./tools/write-file.js";

const server = new McpServer({
  name: "pai-my-first-mcp",
  version: "1.0.0",
});

registerHelloTool(server);
registerAddNumbersTool(server);
registerListFilesTool(server);
registerReadFileTool(server);
registerSearchTextTool(server);
registerWriteFileTool(server);
registerReplaceInFileTool(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server is running on stdio...");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
