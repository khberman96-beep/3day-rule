-- ═══════════════════════════════════════════
-- 3-DAY RULE: Database Setup
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  list TEXT NOT NULL DEFAULT 'master',
  category TEXT DEFAULT 'personal',
  done BOOLEAN DEFAULT FALSE,
  added_date TEXT,
  completed_date TEXT,
  from_yesterday BOOLEAN DEFAULT FALSE,
  recurring TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '✅',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit Logs (daily check-ins)
CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Morning Routine Items
CREATE TABLE IF NOT EXISTS routine_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '☀️',
  duration_min INTEGER DEFAULT 5,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine Logs (daily check-ins)
CREATE TABLE IF NOT EXISTS routine_logs (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES routine_items(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeboxes (one per day)
CREATE TABLE IF NOT EXISTS timeboxes (
  date TEXT PRIMARY KEY,
  wake_up TEXT DEFAULT '06:00',
  blocks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat History
CREATE TABLE IF NOT EXISTS chat_history (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- Indexes for performance
-- ═══════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_tasks_list ON tasks(list);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_routine_logs_item_date ON routine_logs(item_id, date);
CREATE INDEX IF NOT EXISTS idx_chat_history_created ON chat_history(created_at);

-- ═══════════════════════════════════════════
-- Row Level Security (RLS) - disable for single-user app
-- ═══════════════════════════════════════════
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Allow all operations with anon key (single-user app)
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON habit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON routine_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON routine_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON timeboxes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON chat_history FOR ALL USING (true) WITH CHECK (true);
