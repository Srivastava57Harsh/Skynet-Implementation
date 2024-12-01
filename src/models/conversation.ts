import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'researcher', 'chart_generator'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  intent: {
    type: String,
    required: true
  },
  userQuery: {
    type: String,
    required: true
  },
  messages: [messageSchema],
  metadata: {
    agentPath: [String],  // tracks which agents were involved
    searchQueries: [String], // if researcher was used
    chartData: mongoose.Schema.Types.Mixed, // if chart generator was used
    completedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Conversation = mongoose.model('Conversation', conversationSchema);
