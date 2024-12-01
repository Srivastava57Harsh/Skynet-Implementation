import dotenv from "dotenv";
dotenv.config();

if (!process.env.OPENAI_API_KEY || !process.env.TAVILY_API_KEY) {
  throw new Error("Missing required API keys in .env file");
}

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4",
    temperature: 0,
  },
  tavily: {
    apiKey: process.env.TAVILY_API_KEY,
  },
  server: {
    port: process.env.PORT || 3000,
  },
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/agent_rag",
  },
};

export default config;
