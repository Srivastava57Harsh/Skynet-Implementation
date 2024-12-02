# AI Agent RAG System

A multi-agent system that combines research and data visualization capabilities with conversation memory.

## Features

- Multi-agent architecture with researcher and chart generator agents
- Conversation history tracking in MongoDB
- RESTful API endpoints
- Supervisor agent for routing between agents
- Data visualization capabilities
- Web research integration

## Tech Stack

- Node.js/Express
- TypeScript
- MongoDB
- LangChain
- OpenAI GPT-4
- Tavily Search API
- D3.js for charts

## Prerequisites

- Node.js v18+
- MongoDB
- OpenAI API key
- Tavily API key

## Environment Variables

- OPENAI_API_KEY=your_openai_key
- TAVILY_API_KEY=your_tavily_key
- MONGODB_URI=mongodb://localhost:27017/agent_rag
- PORT=3000

## Installation

- bash
- npm install
- npm run build
- npm start
