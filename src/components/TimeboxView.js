"use client";

import { fmtTime } from "@/lib/constants";

export default function TimeboxView({ timebox, settings }) {
  const wakeUp = settings?.wakeUp || "06:00";
  const [wH, wM] = wakeUp.split(":").map(Number);
  const wakeMin = wH * 60 + wM;
  const morningEnd = wakeMin + 30;

  const blocks = [
    { label: "DAY 1", start: morningEnd, end: morningEnd + 300, color: "#F59E0B", emoji: "🌅" },
    { label: "DAY 2", start: morningEnd + 300, end: morningEnd + 600, color: "#3B82F6", emoji: "☀️" },
    { label: "DAY 3", start: morningEnd + 600, end: morningEnd + 900, color: "#8B5CF6", emoji: "🌙" },
  ];
  const eveningStart = morningEnd + 900;
  const sleepStart = eveningStart + 30;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>⏱️ Ed Mylett 3-Day Time Box</h2>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
          3 days in 1 — three 5-hour power blocks
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Wake + Morning */}
        <TimeSlot
          time={fmtTime(wakeMin)}
          bg="linear-gradient(135deg, #1e293b, #334155)"
          borderColor="#94a3b8"
          title="🌤️ Wake + Morning Routine"
          duration="30 min"
        />

        {/* 3 Day Blocks */}
        {blocks.map((block, i) => (
          <TimeSlot
            key={i}
            time={fmtTime(block.start)}
            bg={`linear-gradient(135deg, ${block.color}15, ${block.color}08)`}
            borderColor={block.color}
            title={`${block.emoji} ${block.label}`}
            duration={`${fmtTime(block.start)} – ${fmtTime(block.end)} (5 hrs)`}
          >
            {timebox?.blocks?.[i]?.tasks?.length > 0 ? (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                {timebox.blocks[i].tasks.map((t, j) => (
                  <div key={j} style={{ fontSize: 13, color: "#cbd5e1", paddingLeft: 4 }}>
                    • {typeof t === "string" ? t : t.text}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#475569", marginTop: 10, fontStyle: "italic" }}>
                No tasks scheduled — use chat to build your time box
              </div>
            )}
            {timebox?.blocks?.[i]?.notes && (
              <div style={{ fontSize: 12, color: "#F59E0B", marginTop: 8, fontStyle: "italic" }}>
                📝 {timebox.blocks[i].notes}
              </div>
            )}
          </TimeSlot>
        ))}

        {/* Evening */}
        <TimeSlot
          time={fmtTime(eveningStart)}
          bg="linear-gradient(135deg, #1e293b, #334155)"
          borderColor="#94a3b8"
          title="🌙 Evening Routine"
          duration="30 min"
        />

        {/* Sleep */}
        <TimeSlot
          time={fmtTime(sleepStart)}
          bg="linear-gradient(135deg, #0f172a, #1e293b)"
          borderColor="#475569"
          title="😴 Sleep"
          duration="8 hours"
        />
      </div>
    </div>
  );
}

function TimeSlot({ time, bg, borderColor, title, duration, children }) {
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
          {duration}
        </div>
        {children}
      </div>
    </div>
  );
}
