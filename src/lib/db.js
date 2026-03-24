import { supabase } from "./supabase";
import { uid, getToday, migrateTask } from "./constants";

// ═══════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════
export async function loadTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Load tasks error:", error);
    return [];
  }
  // Migrate all tasks to multi-list format
  return (data || []).map(migrateTask);
}

export async function upsertTask(task) {
  // Always save with lists array, keep list for backward compat
  const primaryList = (task.lists || []).find((l) => l !== "master") || "master";
  const toSave = { ...task, list: primaryList };
  const { error } = await supabase.from("tasks").upsert(toSave, { onConflict: "id" });
  if (error) console.error("Upsert task error:", error);
}

export async function deleteTask(id) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) console.error("Delete task error:", error);
}

export async function bulkUpsertTasks(tasks) {
  if (tasks.length === 0) return;
  const toSave = tasks.map((task) => {
    const primaryList = (task.lists || []).find((l) => l !== "master") || "master";
    return { ...task, list: primaryList };
  });
  const { error } = await supabase.from("tasks").upsert(toSave, { onConflict: "id" });
  if (error) console.error("Bulk upsert error:", error);
}

// ═══════════════════════════════════════════
// HABITS
// ═══════════════════════════════════════════
export async function loadHabits() {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("Load habits error:", error);
    return [];
  }
  return data || [];
}

export async function upsertHabit(habit) {
  const { error } = await supabase.from("habits").upsert(habit, { onConflict: "id" });
  if (error) console.error("Upsert habit error:", error);
}

export async function deleteHabit(id) {
  const { error } = await supabase.from("habits").delete().eq("id", id);
  if (error) console.error("Delete habit error:", error);
}

export async function loadHabitLogs(startDate, endDate) {
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate);
  if (error) {
    console.error("Load habit logs error:", error);
    return [];
  }
  return data || [];
}

export async function toggleHabitLog(habitId, date, completed) {
  if (completed) {
    const { error } = await supabase
      .from("habit_logs")
      .upsert({ id: `${habitId}_${date}`, habit_id: habitId, date, completed: true }, { onConflict: "id" });
    if (error) console.error("Toggle habit log error:", error);
  } else {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("id", `${habitId}_${date}`);
    if (error) console.error("Toggle habit log error:", error);
  }
}

export async function getHabitStreak(habitId) {
  const today = getToday();
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const { data, error } = await supabase
    .from("habit_logs")
    .select("date")
    .eq("habit_id", habitId)
    .eq("completed", true)
    .gte("date", yearAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  if (error || !data) return 0;

  const dates = new Set(data.map((d) => d.date));
  let streak = 0;
  let checkDate = new Date(today);

  if (!dates.has(today)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (dates.has(checkDate.toISOString().split("T")[0])) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

// ═══════════════════════════════════════════
// MORNING ROUTINE
// ═══════════════════════════════════════════
export async function loadRoutineItems() {
  const { data, error } = await supabase
    .from("routine_items")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("Load routine items error:", error);
    return [];
  }
  return data || [];
}

export async function upsertRoutineItem(item) {
  const { error } = await supabase.from("routine_items").upsert(item, { onConflict: "id" });
  if (error) console.error("Upsert routine item error:", error);
}

export async function deleteRoutineItem(id) {
  const { error } = await supabase.from("routine_items").delete().eq("id", id);
  if (error) console.error("Delete routine item error:", error);
}

export async function loadRoutineLogs(date) {
  const { data, error } = await supabase
    .from("routine_logs")
    .select("*")
    .eq("date", date);
  if (error) {
    console.error("Load routine logs error:", error);
    return [];
  }
  return data || [];
}

export async function toggleRoutineLog(itemId, date, completed) {
  if (completed) {
    const { error } = await supabase
      .from("routine_logs")
      .upsert({ id: `${itemId}_${date}`, item_id: itemId, date, completed: true }, { onConflict: "id" });
    if (error) console.error("Toggle routine log error:", error);
  } else {
    const { error } = await supabase
      .from("routine_logs")
      .delete()
      .eq("id", `${itemId}_${date}`);
    if (error) console.error("Toggle routine log error:", error);
  }
}

// ═══════════════════════════════════════════
// TIMEBOX
// ═══════════════════════════════════════════
export async function loadTimebox(date) {
  const { data, error } = await supabase
    .from("timeboxes")
    .select("*")
    .eq("date", date)
    .single();
  if (error && error.code !== "PGRST116") {
    console.error("Load timebox error:", error);
    return null;
  }
  return data;
}

export async function saveTimebox(timebox) {
  const { error } = await supabase
    .from("timeboxes")
    .upsert(timebox, { onConflict: "date" });
  if (error) console.error("Save timebox error:", error);
}

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════
export async function loadSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", "user_settings")
    .single();
  if (error && error.code !== "PGRST116") {
    console.error("Load settings error:", error);
    return null;
  }
  return data?.value || null;
}

export async function saveSettings(value) {
  const { error } = await supabase
    .from("settings")
    .upsert({ id: "user_settings", value }, { onConflict: "id" });
  if (error) console.error("Save settings error:", error);
}

// ═══════════════════════════════════════════
// CHAT HISTORY
// ═══════════════════════════════════════════
export async function loadChatHistory() {
  const { data, error } = await supabase
    .from("chat_history")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) {
    console.error("Load chat error:", error);
    return [];
  }
  return data || [];
}

export async function addChatMessage(role, content) {
  const { error } = await supabase
    .from("chat_history")
    .insert({ id: uid(), role, content, created_at: new Date().toISOString() });
  if (error) console.error("Add chat message error:", error);
}

export async function clearChatHistory() {
  const { error } = await supabase.from("chat_history").delete().neq("id", "");
  if (error) console.error("Clear chat error:", error);
}
