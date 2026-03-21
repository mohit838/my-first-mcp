import "dotenv/config";
import OpenAI from "openai";
import readline from "readline";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
  {
    role: "system",
    content: "You are a helpful coding assistant.",
  },
];

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  console.log("💬 Chat started (type 'exit' to quit)\n");

  while (true) {
    const input = await ask("> ");

    if (input.toLowerCase() === "exit") {
      console.log("Goodbye 👋");
      process.exit(0);
    }

    messages.push({
      role: "user",
      content: input,
    });

    try {
      const response = await client.chat.completions.create({
        model: "z-ai/glm-4.5-air:free",
        messages,
      });

      const reply = response.choices[0]?.message?.content || "";

      console.log("\n🤖", reply, "\n");

      messages.push({
        role: "assistant",
        content: reply,
      });
    } catch (error: any) {
      console.error("Error:", error.message);
    }
  }
}

main();