// ═══════════════════════════════════════════
// LISTS
// ═══════════════════════════════════════════
export const LISTS = [
  "next_up",
  "urgent",
  "today",
  "this_week",
  "tomorrow",
  "master",
  "radar",
];

export const LIST_META = {
  next_up: {
    label: "Next Up",
    emoji: "🎯",
    color: "#F59E0B",
    maxItems: 3,
    desc: "Top 1–3 focus items",
  },
  urgent: {
    label: "Urgent",
    emoji: "🔥",
    color: "#EF4444",
    desc: "Drop everything",
  },
  today: {
    label: "Today",
    emoji: "📋",
    color: "#10B981",
    desc: "Today's agenda",
  },
  this_week: {
    label: "This Week",
    emoji: "📅",
    color: "#3B82F6",
    desc: "On deck this week",
  },
  tomorrow: {
    label: "Tomorrow",
    emoji: "🌅",
    color: "#F97316",
    desc: "Queued for tomorrow",
  },
  master: {
    label: "Master List",
    emoji: "📚",
    color: "#8B5CF6",
    desc: "Everything, organized",
  },
  radar: {
    label: "Radar",
    emoji: "📡",
    color: "#6366F1",
    desc: "Keeping an eye on",
  },
};

// ═══════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════
export const CATEGORIES = [
  { id: "work", label: "Work", color: "#3B82F6", icon: "💼" },
  { id: "personal", label: "Personal", color: "#10B981", icon: "🏠" },
  { id: "growth", label: "Growth & Learning", color: "#8B5CF6", icon: "📖" },
  { id: "health", label: "Health & Fitness", color: "#EF4444", icon: "💪" },
  { id: "finance", label: "Finance", color: "#F59E0B", icon: "💰" },
  { id: "social", label: "Social & Relationships", color: "#EC4899", icon: "👥" },
];

// ═══════════════════════════════════════════
// REMINDERS
// ═══════════════════════════════════════════
export const OPENING_QUOTE = `"There are decades where nothing happens; and there are weeks where decades happen."`;
export const SIGNAL_REMINDER = `Make sure you're taking Hormozi's advice about signal.`;

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const getToday = () => new Date().toISOString().split("T")[0];

export const daysBetween = (a, b) =>
  Math.floor((new Date(b) - new Date(a)) / 86400000);

export function staleness(addedDate) {
  const days = daysBetween(addedDate, getToday());
  if (days >= 30)
    return {
      level: "critical",
      msg: `${days}d — Do it, delegate it, or drop it.`,
      color: "#EF4444",
    };
  if (days >= 14)
    return {
      level: "warning",
      msg: `${days}d — This has been sitting. Time to act.`,
      color: "#F59E0B",
    };
  if (days >= 7)
    return { level: "note", msg: `${days}d on list`, color: "#6B7280" };
  return null;
}

export function fmtTime(totalMin) {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Ensure a task's lists array always includes "master" and applies auto-rules */
export function normalizeLists(lists) {
  const arr = Array.isArray(lists) ? [...lists] : lists ? [lists] : ["master"];
  if (!arr.includes("master")) arr.push("master");
  // Next Up auto-adds to Today
  if (arr.includes("next_up") && !arr.includes("today")) arr.push("today");
  return [...new Set(arr)];
}

/** Migrate a task from old single-list to new multi-list format */
export function migrateTask(task) {
  if (task.lists && Array.isArray(task.lists) && task.lists.length > 0) {
    return { ...task, lists: normalizeLists(task.lists) };
  }
  // Old format: single "list" string
  const lists = normalizeLists(task.list ? [task.list] : ["master"]);
  return { ...task, lists };
}
