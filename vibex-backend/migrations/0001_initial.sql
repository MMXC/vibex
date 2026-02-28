-- VibeX D1 Database Schema
-- Compatible with SQLite (D1)

-- Users table
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password TEXT NOT NULL,
  avatar TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Projects table
CREATE TABLE IF NOT EXISTS Project (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  userId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- Pages table
CREATE TABLE IF NOT EXISTS Page (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT,
  projectId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
);

-- Agents table
CREATE TABLE IF NOT EXISTS Agent (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  model TEXT DEFAULT 'abab6.5s-chat',
  temperature REAL DEFAULT 0.7,
  userId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- Conversations table
CREATE TABLE IF NOT EXISTS Conversation (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  messages TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- Messages table
CREATE TABLE IF NOT EXISTS Message (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  projectId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
);

-- FlowData table
CREATE TABLE IF NOT EXISTS FlowData (
  id TEXT PRIMARY KEY,
  name TEXT,
  nodes TEXT NOT NULL,
  edges TEXT NOT NULL,
  projectId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_userId ON Project(userId);
CREATE INDEX IF NOT EXISTS idx_page_projectId ON Page(projectId);
CREATE INDEX IF NOT EXISTS idx_agent_userId ON Agent(userId);
CREATE INDEX IF NOT EXISTS idx_conversation_userId ON Conversation(userId);
CREATE INDEX IF NOT EXISTS idx_message_projectId ON Message(projectId);
CREATE INDEX IF NOT EXISTS idx_flow_projectId ON FlowData(projectId);