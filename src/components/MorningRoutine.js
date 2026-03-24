"use client";

import { useState } from "react";
import { getToday } from "@/lib/constants";

export default function MorningRoutine({
  items,
  logs,
  onToggle,
  onAdd,
  onRemove,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("☀️");
  const [newDuration, setNewDuration] = useState(5);
  const today = getToday();

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newIcon, newDuration);
    setNewName("");
    setNewIcon("☀️");
    setNewDuration(5);
    setShowAdd(false);
  };

  const completedToday = items.filter((i) =>
    logs.some((l) => l.item_id === i.id && l.date === today && l.completed)
  ).length;

  const totalDuration = items.reduce((sum, i) => sum + (i.duration_min || 5), 0);

  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: 10,
        padding: 14,
        borderTop: "3px solid #F59E0B",
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
          🌅 Morning Routine
          <span
            style={{
              fontSize: 11,
              color: "#64748b",
              fontFamily: "'JetBrains Mono', monospace",
              marginLeft: 8,
            }}
          >
            {completedToday}/{items.length} · {totalDuration}min
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
            flexWrap: "wrap",
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
            placeholder="Routine step..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            style={{
              flex: 1,
              minWidth: 120,
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
          <input
            type="number"
            value={newDuration}
            onChange={(e) => setNewDuration(parseInt(e.target.value) || 5)}
            placeholder="min"
            style={{
              width: 50,
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 6,
              padding: "4px 6px",
              color: "#e2e8f0",
              fontSize: 12,
              textAlign: "center",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
          <button
            onClick={handleAdd}
            style={{
              background: "#F59E0B",
              border: "none",
              color: "#0a0f1a",
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

      {items.length === 0 && (
        <div
          style={{
            fontSize: 12,
            color: "#475569",
            textAlign: "center",
            padding: 16,
            fontStyle: "italic",
          }}
        >
          No routine items yet — add some or ask in chat
        </div>
      )}

      {items.map((item, idx) => {
        const isCompleted = logs.some(
          (l) => l.item_id === item.id && l.date === today && l.completed
        );

        return (
          <div
            key={item.id}
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
            onClick={() => onToggle(item.id, today, !isCompleted)}
          >
            <span
              style={{
                fontSize: 11,
                color: "#475569",
                fontFamily: "'JetBrains Mono', monospace",
                width: 16,
                flexShrink: 0,
              }}
            >
              {idx + 1}
            </span>

            <div
              className="habit-check"
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: `2px solid ${isCompleted ? "#F59E0B" : "#475569"}`,
                background: isCompleted ? "#F59E0B" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isCompleted && (
                <span style={{ fontSize: 13, color: "#0a0f1a" }}>✓</span>
              )}
            </div>

            <span style={{ fontSize: 16, flexShrink: 0 }}>
              {item.icon || "☀️"}
            </span>

            <span
              style={{
                flex: 1,
                fontSize: 13,
                color: isCompleted ? "#64748b" : "#e2e8f0",
                textDecoration: isCompleted ? "line-through" : "none",
              }}
            >
              {item.name}
            </span>

            <span
              style={{
                fontSize: 10,
                color: "#475569",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {item.duration_min || 5}m
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
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
