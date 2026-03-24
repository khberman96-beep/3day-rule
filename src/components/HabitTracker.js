"use client";

import { useState, useEffect } from "react";
import { getToday } from "@/lib/constants";

export default function HabitTracker({
  habits,
  habitLogs,
  streaks,
  onToggle,
  onAdd,
  onRemove,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("✅");
  const today = getToday();

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newIcon);
    setNewName("");
    setNewIcon("✅");
    setShowAdd(false);
  };

  const completedToday = habits.filter((h) =>
    habitLogs.some((l) => l.habit_id === h.id && l.date === today && l.completed)
  ).length;

  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: 10,
        padding: 14,
        borderTop: "3px solid #10B981",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          🔁 Daily Habits
          <span
            style={{
              fontSize: 11,
              color: "#64748b",
              fontFamily: "'JetBrains Mono', monospace",
              marginLeft: 8,
            }}
          >
            {completedToday}/{habits.length}
          </span>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            background: "none",
            border: "1px solid #334155",
            color: "#94a3b8",
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {showAdd ? "✕" : "+ Add"}
        </button>
      </div>

      {showAdd && (
        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 10,
          }}
        >
          <input
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            style={{
              width: 36,
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 6,
              padding: "4px",
              color: "#e2e8f0",
              fontSize: 16,
              textAlign: "center",
            }}
          />
          <input
            placeholder="Habit name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            style={{
              flex: 1,
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 6,
              padding: "4px 8px",
              color: "#e2e8f0",
              fontSize: 13,
              outline: "none",
              fontFamily: "'Outfit', sans-serif",
            }}
          />
          <button
            onClick={handleAdd}
            style={{
              background: "#10B981",
              border: "none",
              color: "#fff",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Add
          </button>
        </div>
      )}

      {habits.length === 0 && (
        <div
          style={{
            fontSize: 12,
            color: "#475569",
            textAlign: "center",
            padding: 16,
            fontStyle: "italic",
          }}
        >
          No habits yet — add some or ask in chat
        </div>
      )}

      {habits.map((habit) => {
        const isCompleted = habitLogs.some(
          (l) => l.habit_id === habit.id && l.date === today && l.completed
        );
        const streak = streaks[habit.id] || 0;

        return (
          <div
            key={habit.id}
            className="task-card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              marginBottom: 3,
              background: "#1e293b",
              borderRadius: 8,
              cursor: "pointer",
            }}
            onClick={() => onToggle(habit.id, today, !isCompleted)}
          >
            <div
              className="habit-check"
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: `2px solid ${isCompleted ? "#10B981" : "#475569"}`,
                background: isCompleted ? "#10B981" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isCompleted && (
                <span style={{ fontSize: 13, color: "#fff" }}>✓</span>
              )}
            </div>

            <span style={{ fontSize: 16, flexShrink: 0 }}>
              {habit.icon || "✅"}
            </span>

            <span
              style={{
                flex: 1,
                fontSize: 13,
                color: isCompleted ? "#64748b" : "#e2e8f0",
                textDecoration: isCompleted ? "line-through" : "none",
              }}
            >
              {habit.name}
            </span>

            {streak > 0 && (
              <span
                className="streak-badge"
                style={{
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: streak >= 7 ? "#F59E0B" : "#10B981",
                  background:
                    streak >= 7 ? "#F59E0B15" : "#10B98115",
                  padding: "2px 8px",
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                🔥 {streak}d
              </span>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(habit.id);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#334155",
                cursor: "pointer",
                fontSize: 12,
                padding: 2,
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
