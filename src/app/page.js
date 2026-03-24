"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LISTS,
  LIST_META,
  CATEGORIES,
  OPENING_QUOTE,
  SIGNAL_REMINDER,
  uid,
  getToday,
} from "@/lib/constants";
import {
  loadTasks, upsertTask, deleteTask as dbDeleteTask, bulkUpsertTasks,
  loadHabits, upsertHabit, deleteHabit as dbDeleteHabit,
  loadHabitLogs, toggleHabitLog, getHabitStreak,
  loadRoutineItems, upsertRoutineItem, deleteRoutineItem as dbDeleteRoutineItem,
  loadRoutineLogs, toggleRoutineLog,
  loadTimebox, saveTimebox as dbSaveTimebox,
  loadSettings, saveSettings,
  loadChatHistory, addChatMessage,
} from "@/lib/db";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import TaskCard from "@/components/TaskCard";
import HabitTracker from "@/components/HabitTracker";
import MorningRoutine from "@/components/MorningRoutine";
import TimeboxView from "@/components/TimeboxView";
import ChatPanel from "@/components/ChatPanel";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [routineItems, setRoutineItems] = useState([]);
  const [routineLogs, setRoutineLogs] = useState([]);
  const [timebox, setTimebox] = useState(null);
  const [settings, setSettings] = useState({ wakeUp: "06:00", recurringDays: { callParents: [2, 0] } });
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("board");
  const [initialized, setInitialized] = useState(false);

  // ── INIT ──
  useEffect(() => {
    (async () => {
      try {
        const today = getToday();
        let [t, h, hl, ri, rl, tb, s, ch] = await Promise.all([
          loadTasks(),
          loadHabits(),
          loadHabitLogs(
            new Date(Date.now() - 400 * 86400000).toISOString().split("T")[0],
            today
          ),
          loadRoutineItems(),
          loadRoutineLogs(today),
          loadTimebox(today),
          loadSettings(),
          loadChatHistory(),
        ]);

        const savedSettings = s || { wakeUp: "06:00", recurringDays: { callParents: [2, 0] } };

        // Day rollover — check last_date on tasks
        const lastDate = savedSettings.lastDate || today;
        if (lastDate !== today) {
          // Move uncompleted "today" to "tomorrow" with from_yesterday flag
          const updates = [];
          t = t.map((item) => {
            if (item.list === "today" && !item.done) {
              const updated = { ...item, list: "tomorrow", from_yesterday: true };
              updates.push(updated);
              return updated;
            }
            return item;
          });
          // Remove completed tasks
          const completedIds = t.filter((i) => i.done).map((i) => i.id);
          t = t.filter((i) => !i.done);
          // Bulk update
          if (updates.length > 0) await bulkUpsertTasks(updates);

          // Add recurring: Work Out
          if (!t.some((i) => i.text === "Work Out" && i.list === "today")) {
            const workout = {
              id: uid(), text: "Work Out", list: "today", category: "health",
              done: false, added_date: today, recurring: "daily",
            };
            t.push(workout);
            await upsertTask(workout);
          }

          // Add recurring: Call Parents
          const dow = new Date().getDay();
          const parentDays = savedSettings.recurringDays?.callParents || [2, 0];
          if (parentDays.includes(dow)) {
            if (!t.some((i) => i.text === "Call Parents" && i.list === "today")) {
              const call = {
                id: uid(), text: "Call Parents", list: "today", category: "social",
                done: false, added_date: today, recurring: "twice_weekly",
              };
              t.push(call);
              await upsertTask(call);
            }
          }

          savedSettings.lastDate = today;
          await saveSettings(savedSettings);
        }

        // Compute streaks
        const streakMap = {};
        for (const habit of h) {
          streakMap[habit.id] = await getHabitStreak(habit.id);
        }

        setTasks(t);
        setHabits(h);
        setHabitLogs(hl);
        setStreaks(streakMap);
        setRoutineItems(ri);
        setRoutineLogs(rl);
        setTimebox(tb);
        setSettings(savedSettings);
        setChatHistory(ch.map((c) => ({ role: c.role, content: c.content })));
        setInitialized(true);
      } catch (err) {
        console.error("Init error:", err);
        setInitialized(true); // Still show UI
      }
    })();
  }, []);

  // ── TASK ACTIONS ──
  const toggleTask = useCallback(async (id) => {
    setTasks((prev) => {
      const updated = prev.map((i) =>
        i.id === id
          ? { ...i, done: !i.done, completed_date: !i.done ? getToday() : null }
          : i
      );
      const task = updated.find((i) => i.id === id);
      if (task) upsertTask(task);
      return updated;
    });
  }, []);

  // ── HABIT ACTIONS ──
  const handleToggleHabit = useCallback(async (habitId, date, completed) => {
    await toggleHabitLog(habitId, date, completed);
    setHabitLogs((prev) => {
      if (completed) {
        return [
          ...prev.filter((l) => !(l.habit_id === habitId && l.date === date)),
          { id: `${habitId}_${date}`, habit_id: habitId, date, completed: true },
        ];
      }
      return prev.filter((l) => !(l.habit_id === habitId && l.date === date));
    });
    // Update streak
    const streak = await getHabitStreak(habitId);
    setStreaks((prev) => ({ ...prev, [habitId]: streak }));
  }, []);

  const handleAddHabit = useCallback(async (name, icon) => {
    const habit = {
      id: uid(),
      name,
      icon,
      sort_order: habits.length,
    };
    await upsertHabit(habit);
    setHabits((prev) => [...prev, habit]);
  }, [habits]);

  const handleRemoveHabit = useCallback(async (id) => {
    await dbDeleteHabit(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  // ── ROUTINE ACTIONS ──
  const handleToggleRoutine = useCallback(async (itemId, date, completed) => {
    await toggleRoutineLog(itemId, date, completed);
    setRoutineLogs((prev) => {
      if (completed) {
        return [
          ...prev.filter((l) => !(l.item_id === itemId && l.date === date)),
          { id: `${itemId}_${date}`, item_id: itemId, date, completed: true },
        ];
      }
      return prev.filter((l) => !(l.item_id === itemId && l.date === date));
    });
  }, []);

  const handleAddRoutine = useCallback(async (name, icon, duration) => {
    const item = {
      id: uid(),
      name,
      icon,
      duration_min: duration,
      sort_order: routineItems.length,
    };
    await upsertRoutineItem(item);
    setRoutineItems((prev) => [...prev, item]);
  }, [routineItems]);

  const handleRemoveRoutine = useCallback(async (id) => {
    await dbDeleteRoutineItem(id);
    setRoutineItems((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // ── CHAT ──
  const processCommands = useCallback(
    async (cmds) => {
      let updatedTasks = [...tasks];
      let updatedTimebox = timebox ? { ...timebox } : null;
      let updatedHabits = [...habits];
      let updatedRoutine = [...routineItems];
      let updatedSettings = { ...settings };

      for (const cmd of cmds) {
        switch (cmd.action) {
          case "add": {
            const newTask = {
              id: uid(),
              text: cmd.text,
              list: cmd.list || "master",
              category: cmd.category || "personal",
              done: false,
              added_date: getToday(),
              from_yesterday: false,
            };
            updatedTasks.push(newTask);
            await upsertTask(newTask);
            break;
          }
          case "complete": {
            updatedTasks = updatedTasks.map((i) =>
              i.id === cmd.id
                ? { ...i, done: true, completed_date: getToday() }
                : i
            );
            const t = updatedTasks.find((i) => i.id === cmd.id);
            if (t) await upsertTask(t);
            break;
          }
          case "uncomplete": {
            updatedTasks = updatedTasks.map((i) =>
              i.id === cmd.id ? { ...i, done: false, completed_date: null } : i
            );
            const t = updatedTasks.find((i) => i.id === cmd.id);
            if (t) await upsertTask(t);
            break;
          }
          case "move": {
            updatedTasks = updatedTasks.map((i) =>
              i.id === cmd.id ? { ...i, list: cmd.to } : i
            );
            const t = updatedTasks.find((i) => i.id === cmd.id);
            if (t) await upsertTask(t);
            break;
          }
          case "delete": {
            await dbDeleteTask(cmd.id);
            updatedTasks = updatedTasks.filter((i) => i.id !== cmd.id);
            break;
          }
          case "edit": {
            updatedTasks = updatedTasks.map((i) =>
              i.id === cmd.id ? { ...i, text: cmd.text } : i
            );
            const t = updatedTasks.find((i) => i.id === cmd.id);
            if (t) await upsertTask(t);
            break;
          }
          case "add_habit": {
            const h = { id: uid(), name: cmd.name, icon: cmd.icon || "✅", sort_order: updatedHabits.length };
            updatedHabits.push(h);
            await upsertHabit(h);
            break;
          }
          case "remove_habit": {
            await dbDeleteHabit(cmd.id);
            updatedHabits = updatedHabits.filter((h) => h.id !== cmd.id);
            break;
          }
          case "add_routine": {
            const r = { id: uid(), name: cmd.name, icon: cmd.icon || "☀️", duration_min: cmd.duration_min || 5, sort_order: updatedRoutine.length };
            updatedRoutine.push(r);
            await upsertRoutineItem(r);
            break;
          }
          case "remove_routine": {
            await dbDeleteRoutineItem(cmd.id);
            updatedRoutine = updatedRoutine.filter((r) => r.id !== cmd.id);
            break;
          }
          case "timebox": {
            updatedTimebox = {
              date: cmd.date || getToday(),
              wake_up: cmd.wakeUp || settings.wakeUp,
              blocks: (cmd.blocks || []).map((b) => ({
                label: b.label,
                tasks: (b.taskIds || [])
                  .map((id) => updatedTasks.find((t) => t.id === id))
                  .filter(Boolean)
                  .map((t) => ({ id: t.id, text: t.text })),
                notes: b.notes || "",
              })),
            };
            await dbSaveTimebox(updatedTimebox);
            break;
          }
          case "set_recurring": {
            if (cmd.task === "callParents") {
              updatedSettings.recurringDays = {
                ...updatedSettings.recurringDays,
                callParents: cmd.days,
              };
              await saveSettings(updatedSettings);
            }
            break;
          }
        }
      }

      setTasks(updatedTasks);
      setTimebox(updatedTimebox);
      setHabits(updatedHabits);
      setRoutineItems(updatedRoutine);
      setSettings(updatedSettings);
    },
    [tasks, timebox, habits, routineItems, settings]
  );

  const handleSendMessage = useCallback(
    async (msg) => {
      const userMsg = { role: "user", content: msg };
      setChatHistory((prev) => [...prev, userMsg]);
      await addChatMessage("user", msg);
      setIsLoading(true);

      try {
        const systemPrompt = buildSystemPrompt(
          tasks, habits, routineItems, timebox, settings
        );
        const apiMessages = [...chatHistory, userMsg]
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, systemPrompt }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        let assistantText = data.content || "Something went wrong.";

        // Parse JSON commands
        const jsonMatch = assistantText.match(/```json\s*([\s\S]*?)```/);
        let displayText = assistantText.replace(/```json\s*[\s\S]*?```/g, "").trim();

        if (jsonMatch) {
          try {
            const cmds = JSON.parse(jsonMatch[1]);
            const arr = Array.isArray(cmds) ? cmds : [cmds];
            await processCommands(arr);
            const actions = arr
              .map((c) => {
                if (c.action === "add") return `✅ Added "${c.text}" → ${LIST_META[c.list]?.label || c.list}`;
                if (c.action === "complete") return `☑️ Marked complete`;
                if (c.action === "move") return `📦 Moved → ${LIST_META[c.to]?.label || c.to}`;
                if (c.action === "delete") return `🗑️ Removed`;
                if (c.action === "edit") return `✏️ Edited`;
                if (c.action === "timebox") return `📐 Time box updated`;
                if (c.action === "set_recurring") return `🔄 Recurring days updated`;
                if (c.action === "add_habit") return `🔁 Added habit: ${c.name}`;
                if (c.action === "remove_habit") return `🔁 Removed habit`;
                if (c.action === "add_routine") return `🌅 Added routine: ${c.name}`;
                if (c.action === "remove_routine") return `🌅 Removed routine item`;
                return `⚡ ${c.action}`;
              })
              .join("\n");
            displayText += (displayText ? "\n\n" : "") + actions;
          } catch (e) {
            console.error("JSON parse error:", e);
          }
        }

        setChatHistory((prev) => [...prev, { role: "assistant", content: displayText }]);
        await addChatMessage("assistant", displayText);
      } catch (err) {
        const errMsg = `Error: ${err.message}. Check your connection and try again.`;
        setChatHistory((prev) => [...prev, { role: "assistant", content: errMsg }]);
      }

      setIsLoading(false);
    },
    [tasks, habits, routineItems, timebox, settings, chatHistory, processCommands]
  );

  // ── LOADING ──
  if (!initialized) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0a0f1a",
          color: "#e2e8f0",
        }}
      >
        <div style={{ fontSize: 48, animation: "dotPulse 1.4s infinite" }}>⚡</div>
        <div
          style={{
            marginTop: 16,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            color: "#64748b",
          }}
        >
          Loading Command Center...
        </div>
      </div>
    );
  }

  // ── RENDER ──
  return (
    <div
      style={{
        fontFamily: "'Outfit', sans-serif",
        background: "#0a0f1a",
        color: "#e2e8f0",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid #1e293b",
          background: "linear-gradient(180deg, #0f172a, #0a0f1a)",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: 18,
              color: "#F59E0B",
              letterSpacing: 1,
            }}
          >
            ⚡ 3-DAY RULE
          </div>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 300 }}>
            Command Center
          </div>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {["board", "habits", "timebox"].map((tab) => (
            <button
              key={tab}
              className="tab-btn"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 16px",
                borderRadius: 6,
                border: activeTab === tab ? "1px solid #F59E0B40" : "1px solid #1e293b",
                background: activeTab === tab ? "#F59E0B15" : "transparent",
                color: activeTab === tab ? "#F59E0B" : "#94a3b8",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: activeTab === tab ? 600 : 500,
              }}
            >
              {tab === "board" ? "📋 Board" : tab === "habits" ? "🔁 Habits" : "⏱️ Time Box"}
            </button>
          ))}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div
        className="main-layout"
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          height: "calc(100vh - 53px)",
        }}
      >
        {/* CONTENT AREA */}
        <div
          className="board-area"
          style={{ flex: 1, overflow: "auto", padding: 16 }}
        >
          {activeTab === "board" && (
            <div
              className="board-columns"
              style={{
                display: "flex",
                gap: 12,
                minWidth: "fit-content",
                paddingBottom: 16,
              }}
            >
              {LISTS.map((listId) => {
                const meta = LIST_META[listId];
                const items = tasks.filter((t) => t.list === listId);
                const isMaster = listId === "master";

                return (
                  <div
                    key={listId}
                    className="board-column"
                    style={{
                      width: 260,
                      minWidth: 260,
                      background: "#0f172a",
                      borderRadius: 10,
                      padding: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      maxHeight: "calc(100vh - 100px)",
                      overflow: "auto",
                      borderTop: `3px solid ${meta.color}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontWeight: 600,
                        fontSize: 14,
                        padding: "4px 0 8px",
                      }}
                    >
                      <span>
                        {meta.emoji} {meta.label}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          background: "#1e293b",
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: "#94a3b8",
                        }}
                      >
                        {items.filter((i) => !i.done).length}
                        {listId === "next_up" ? "/3" : ""}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>
                      {meta.desc}
                    </div>

                    {/* Reminders on Master List */}
                    {isMaster && (
                      <div
                        style={{
                          background: "#1e293b",
                          borderRadius: 8,
                          padding: 10,
                          marginBottom: 8,
                          borderLeft: "3px solid #F59E0B",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "#F59E0B",
                            fontStyle: "italic",
                            lineHeight: 1.4,
                            marginBottom: 6,
                          }}
                        >
                          {OPENING_QUOTE}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          📡 {SIGNAL_REMINDER}
                        </div>
                      </div>
                    )}

                    {/* Categorized view for Master List */}
                    {isMaster
                      ? CATEGORIES.map((cat) => {
                          const catItems = items.filter(
                            (t) => t.category === cat.id
                          );
                          if (catItems.length === 0) return null;
                          return (
                            <div key={cat.id}>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  padding: "8px 0 4px",
                                  letterSpacing: 0.5,
                                  color: cat.color,
                                }}
                              >
                                {cat.icon} {cat.label}
                              </div>
                              {catItems.map((task) => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  onToggle={toggleTask}
                                />
                              ))}
                            </div>
                          );
                        })
                      : items.length === 0 ? (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#334155",
                              textAlign: "center",
                              padding: 20,
                              fontStyle: "italic",
                            }}
                          >
                            No tasks
                          </div>
                        ) : (
                          items.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onToggle={toggleTask}
                            />
                          ))
                        )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "habits" && (
            <div
              style={{
                maxWidth: 600,
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <MorningRoutine
                items={routineItems}
                logs={routineLogs}
                onToggle={handleToggleRoutine}
                onAdd={handleAddRoutine}
                onRemove={handleRemoveRoutine}
              />
              <HabitTracker
                habits={habits}
                habitLogs={habitLogs}
                streaks={streaks}
                onToggle={handleToggleHabit}
                onAdd={handleAddHabit}
                onRemove={handleRemoveHabit}
              />
            </div>
          )}

          {activeTab === "timebox" && (
            <TimeboxView timebox={timebox} settings={settings} />
          )}
        </div>

        {/* CHAT PANEL */}
        <ChatPanel
          chatHistory={chatHistory}
          onSend={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
