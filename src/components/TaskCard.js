"use client";

import { CATEGORIES, LIST_META, staleness } from "@/lib/constants";

export default function TaskCard({ task, onToggle, draggable }) {
  const cat = CATEGORIES.find((c) => c.id === task.category);
  const stale = staleness(task.added_date);

  const handleDragStart = (e) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ id: task.id, text: task.text }));
    e.dataTransfer.effectAllowed = "copy";
  };

  // Show which lists this task is on (excluding master and current column)
  const otherLists = (task.lists || []).filter((l) => l !== "master");

  return (
    <div
      className="task-card animate-fade-in"
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      style={{
        background: "#1e293b",
        borderRadius: 8,
        padding: "8px 10px",
        marginBottom: 4,
        cursor: draggable ? "grab" : "pointer",
        opacity: task.done ? 0.5 : 1,
      }}
      onClick={() => onToggle(task.id)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        {/* Checkbox */}
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            border: "2px solid",
            borderColor: task.done ? cat?.color || "#10B981" : "#475569",
            background: task.done ? cat?.color || "#10B981" : "transparent",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 1,
            transition: "all 0.15s",
          }}
        >
          {task.done && (
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>
              ✓
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.4,
              textDecoration: task.done ? "line-through" : "none",
              color: task.done ? "#64748b" : "#e2e8f0",
              wordBreak: "break-word",
            }}
          >
            {task.text}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginTop: 4,
            }}
          >
            {cat && (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: cat.color + "20",
                  color: cat.color,
                  fontWeight: 500,
                }}
              >
                {cat.icon} {cat.label}
              </span>
            )}
            {task.from_yesterday && (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "#F9731620",
                  color: "#F97316",
                }}
              >
                ↩️ from yesterday
              </span>
            )}
            {task.recurring && (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "#6366F120",
                  color: "#6366F1",
                }}
              >
                🔄 {task.recurring === "daily" ? "Daily" : "2x/wk"}
              </span>
            )}
            {/* Show list badges */}
            {otherLists.length > 1 && (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "#8B5CF620",
                  color: "#8B5CF6",
                }}
              >
                📋 {otherLists.length} lists
              </span>
            )}
          </div>
        </div>
      </div>

      {stale && !task.done && (
        <div
          style={{
            fontSize: 10,
            marginTop: 6,
            padding: "3px 8px",
            borderRadius: 4,
            border: `1px solid ${stale.color}40`,
            color: stale.color,
            fontWeight: 500,
          }}
        >
          ⏰ {stale.msg}
        </div>
      )}
    </div>
  );
}
