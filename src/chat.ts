import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import "dotenv/config";
import OpenAI from "openai";
import readline from "readline";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function normalizeToolResult(result: any): string {
  if (!result) return "No tool result";

  const textParts: string[] = [];

  if (Array.isArray(result.content)) {
    for (const item of result.content) {
      if (item?.type === "text" && typeof item.text === "string") {
        textParts.push(item.text);
      } else {
        textParts.push(JSON.stringify(item, null, 2));
      }
    }
  }

  if (textParts.length > 0) {
    return textParts.join("\n");
  }

  if (result.structuredContent) {
    return JSON.stringify(result.structuredContent, null, 2);
  }

  return JSON.stringify(result, null, 2);
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY in .env");
  }

  const mcpClient = new Client(
    {
      name: "my-first-mcp-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );

  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
  });

  await mcpClient.connect(transport);

  const toolsResponse = await mcpClient.listTools();
  const mcpTools = toolsResponse.tools ?? [];

  const openaiTools: OpenAI.Chat.Completions.ChatCompletionTool[] =
    mcpTools.map((tool: any) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description || "",
        parameters: tool.inputSchema || {
          type: "object",
          properties: {},
        },
      },
    }));

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a helpful coding assistant. Use MCP tools when needed. Do not invent tool results.",
    },
  ];

  console.log("MCP chat started. Type 'exit' to quit.\n");
  console.log(
    "Available MCP tools:",
    mcpTools.map((t: any) => t.name).join(", "),
    "\n",
  );

  while (true) {
    const input = await ask("> ");

    if (input.trim().toLowerCase() === "exit") {
      console.log("Goodbye.");
      rl.close();
      process.exit(0);
    }

    messages.push({
      role: "user",
      content: input,
    });

    try {
      while (true) {
        const completion = await openai.chat.completions.create({
          model: "z-ai/glm-4.5-air:free",
          messages,
          tools: openaiTools,
        });

        const message = completion.choices[0]?.message;

        if (!message) {
          console.log("\nNo response from model.\n");
          break;
        }

        const toolCalls = message.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          messages.push({
            role: "assistant",
            content: message.content ?? "",
            tool_calls: toolCalls,
          });

          for (const toolCall of toolCalls) {
            if (toolCall.type !== "function") {
              console.log(
                `Skipping unsupported tool call type: ${toolCall.type}`,
              );
              continue;
            }

            const toolName = toolCall.function.name;

            let parsedArgs: Record<string, unknown> = {};
            try {
              parsedArgs = JSON.parse(toolCall.function.arguments || "{}");
            } catch {
              parsedArgs = {};
            }

            console.log(`\n[tool] ${toolName}(${JSON.stringify(parsedArgs)})`);

            const result = await mcpClient.callTool({
              name: toolName,
              arguments: parsedArgs,
            });

            const toolText = normalizeToolResult(result);

            console.log(`[tool-result]\n${toolText}\n`);

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: toolText,
            });
          }

          continue;
        }

        const finalText = message.content || "(no text reply)";
        console.log(`\n🤖 ${finalText}\n`);

        messages.push({
          role: "assistant",
          content: finalText,
        });

        break;
      }
    } catch (error: any) {
      console.error("Agent error:", error.message || error);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
