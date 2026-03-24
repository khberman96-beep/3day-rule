"use client";

import { useState } from "react";
import { fmtTime } from "@/lib/constants";

const SLOTS_PER_BLOCK = 10;
const SLOT_MINUTES = 30;

export default function TimeboxView({ timebox, settings, tasks, onUpdateTimebox }) {
  const wakeUp = settings?.wakeUp || "06:00";
  const [wH, wM] = wakeUp.split(":").map(Number);
  const wakeMin = wH * 60 + wM;
  const morningEnd = wakeMin + 30;

  const blockDefs = [
    { label: "DAY 1", color: "#F59E0B", emoji: "🌅" },
    { label: "DAY 2", color: "#3B82F6", emoji: "☀️" },
    { label: "DAY 3", color: "#8B5CF6", emoji: "🌙" },
  ];

  const eveningStart = morningEnd + 900;
  const sleepStart = eveningStart + 30;

  // Get current block data or empty slots
  const getBlockSlots = (blockIndex) => {
    const block = timebox?.blocks?.[blockIndex];
    if (block?.slots) return block.slots;
    // Legacy: convert tasks array to slots
    if (block?.tasks && block.tasks.length > 0) {
      const slots = Array(SLOTS_PER_BLOCK).fill(null);
      block.tasks.forEach((t, i) => {
        if (i < SLOTS_PER_BLOCK) {
          slots[i] = typeof t === "string" ? { taskId: null, taskText: t } : { taskId: t.id, taskText: t.text };
        }
      });
      return slots;
    }
    return Array(SLOTS_PER_BLOCK).fill(null);
  };

  // Available tasks for the sidebar (from today/next_up, not done)
  const availableTasks = (tasks || []).filter(
    (t) => !t.done && ((t.lists || []).includes("today") || (t.lists || []).includes("next_up"))
  );

  // Tasks already in timebox slots
  const assignedIds = new Set();
  for (let b = 0; b < 3; b++) {
    const slots = getBlockSlots(b);
    slots.forEach((s) => {
      if (s?.taskId) assignedIds.add(s.taskId);
    });
  }

  const unassigned = availableTasks.filter((t) => !assignedIds.has(t.id));

  const handleDrop = (blockIndex, slotIndex, e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (!data.id || !data.text) return;

      const newBlocks = [0, 1, 2].map((bi) => {
        const slots = [...getBlockSlots(bi)];
        if (bi === blockIndex) {
          slots[slotIndex] = { taskId: data.id, taskText: data.text };
        }
        return {
          label: blockDefs[bi].label,
          slots,
          notes: timebox?.blocks?.[bi]?.notes || "",
        };
      });

      const updated = {
        date: timebox?.date || new Date().toISOString().split("T")[0],
        wake_up: wakeUp,
        blocks: newBlocks,
      };

      onUpdateTimebox(updated);
    } catch (err) {
      console.error("Drop error:", err);
    }
  };

  const handleRemoveSlot = (blockIndex, slotIndex) => {
    const newBlocks = [0, 1, 2].map((bi) => {
      const slots = [...getBlockSlots(bi)];
      if (bi === blockIndex) {
        slots[slotIndex] = null;
      }
      return {
        label: blockDefs[bi].label,
        slots,
        notes: timebox?.blocks?.[bi]?.notes || "",
      };
    });

    const updated = {
      date: timebox?.date || new Date().toISOString().split("T")[0],
      wake_up: wakeUp,
      blocks: newBlocks,
    };

    onUpdateTimebox(updated);
  };

  return (
    <div style={{ display: "flex", gap: 16, maxWidth: 900, margin: "0 auto" }}>
      {/* Task sidebar */}
      <div
        style={{
          width: 200,
          minWidth: 200,
          background: "#0f172a",
          borderRadius: 10,
          padding: 12,
          maxHeight: "calc(100vh - 100px)",
          overflow: "auto",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#F59E0B",
            marginBottom: 10,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          📋 Tasks
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>
          Drag tasks into time slots
        </div>
        {unassigned.length === 0 ? (
          <div style={{ fontSize: 12, color: "#334155", fontStyle: "italic", padding: 8 }}>
            All tasks assigned or none on Today
          </div>
        ) : (
          unassigned.map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  "application/json",
                  JSON.stringify({ id: task.id, text: task.text })
                );
                e.dataTransfer.effectAllowed = "copy";
              }}
              style={{
                background: "#1e293b",
                borderRadius: 6,
                padding: "6px 10px",
                marginBottom: 4,
                fontSize: 12,
                color: "#e2e8f0",
                cursor: "grab",
                borderLeft: `3px solid ${
                  (task.lists || []).includes("next_up") ? "#F59E0B" : "#10B981"
                }`,
              }}
            >
              {task.text}
            </div>
          ))
        )}
      </div>

      {/* Main timebox */}
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>⏱️ Ed Mylett 3-Day Time Box</h2>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            3 days in 1 — three 5-hour power blocks • 30-min slots
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Wake + Morning */}
          <SimpleSlot
            time={fmtTime(wakeMin)}
            bg="linear-gradient(135deg, #1e293b, #334155)"
            borderColor="#94a3b8"
            title="🌤️ Wake + Morning Routine"
            subtitle="30 min"
          />

          {/* 3 Day Blocks */}
          {blockDefs.map((block, bi) => {
            const blockStart = morningEnd + bi * 300;
            const slots = getBlockSlots(bi);

            return (
              <div
                key={bi}
                style={{
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${block.color}15, ${block.color}08)`,
                  borderLeft: `3px solid ${block.color}`,
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {block.emoji} {block.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#94a3b8",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {fmtTime(blockStart)} – {fmtTime(blockStart + 300)}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {slots.map((slot, si) => {
                    const slotTime = blockStart + si * SLOT_MINUTES;
                    return (
                      <div
                        key={si}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.background = `${block.color}25`; }}
                        onDragLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        onDrop={(e) => { e.currentTarget.style.background = "transparent"; handleDrop(bi, si, e); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "4px 8px",
                          borderRadius: 6,
                          minHeight: 32,
                          transition: "background 0.15s",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "#475569",
                            fontFamily: "'JetBrains Mono', monospace",
                            width: 70,
                            flexShrink: 0,
                          }}
                        >
                          {fmtTime(slotTime)}
                        </span>
                        {slot ? (
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: `${block.color}15`,
                              borderRadius: 4,
                              padding: "4px 8px",
                              fontSize: 12,
                              color: "#e2e8f0",
                            }}
                          >
                            <span>{slot.taskText}</span>
                            <button
                              onClick={() => handleRemoveSlot(bi, si)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#64748b",
                                fontSize: 14,
                                cursor: "pointer",
                                padding: "0 4px",
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div
                            style={{
                              flex: 1,
                              borderBottom: "1px dashed #1e293b",
                              height: 1,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {timebox?.blocks?.[bi]?.notes && (
                  <div style={{ fontSize: 12, color: "#F59E0B", marginTop: 8, fontStyle: "italic" }}>
                    📝 {timebox.blocks[bi].notes}
                  </div>
                )}
              </div>
            );
          })}

          {/* Evening */}
          <SimpleSlot
            time={fmtTime(eveningStart)}
            bg="linear-gradient(135deg, #1e293b, #334155)"
            borderColor="#94a3b8"
            title="🌙 Evening Routine"
            subtitle="30 min"
          />

          {/* Sleep */}
          <SimpleSlot
            time={fmtTime(sleepStart)}
            bg="linear-gradient(135deg, #0f172a, #1e293b)"
            borderColor="#475569"
            title="😴 Sleep"
            subtitle="8 hours"
          />
        </div>
      </div>
    </div>
  );
}

function SimpleSlot({ time, bg, borderColor, title, subtitle }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
      <div
        style={{
          width: 80,
          flexShrink: 0,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: "#64748b",
          paddingTop: 12,
          textAlign: "right",
        }}
      >
        {time}
      </div>
      <div
        style={{
          flex: 1,
          borderRadius: 10,
          padding: 14,
          background: bg,
          borderLeft: `3px solid ${borderColor}`,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{title}</div>
        <div
          style={{
            fontSize: 12,
            color: "#94a3b8",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}
