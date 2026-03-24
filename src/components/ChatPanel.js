"use client";

import { useState, useRef, useEffect } from "react";
import { OPENING_QUOTE, SIGNAL_REMINDER } from "@/lib/constants";

const MAX_DISPLAYED = 50;

export default function ChatPanel({
  chatHistory,
  onSend,
  onClear,
  isLoading,
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput("");
    onSend(msg);
  };

  const displayedMessages = chatHistory.slice(-MAX_DISPLAYED);

  return (
    <div
      className="chat-panel"
      style={{
        width: 380,
        minWidth: 380,
        borderLeft: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        background: "#080c15",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #1e293b",
          fontWeight: 600,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          color: "#F59E0B",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>💬 Command Chat</span>
        {onClear && (
          <button
            onClick={onClear}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 6,
              color: "#94a3b8",
              fontSize: 11,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Input at TOP */}
      <div
        style={{
          padding: 12,
          borderBottom: "1px solid #1e293b",
          display: "flex",
          gap: 8,
        }}
      >
        <input
          ref={inputRef}
          className="chat-input"
          placeholder="Add tasks, check things off, build your time box..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          disabled={isLoading}
          style={{
            flex: 1,
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 8,
            padding: "10px 14px",
            color: "#e2e8f0",
            fontSize: 13,
            outline: "none",
            fontFamily: "'Outfit', sans-serif",
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          style={{
            background: isLoading || !input.trim() ? "#334155" : "#F59E0B",
            color: isLoading || !input.trim() ? "#64748b" : "#0a0f1a",
            border: "none",
            borderRadius: 8,
            width: 40,
            fontSize: 18,
            fontWeight: 700,
            cursor:
              isLoading || !input.trim() ? "not-allowed" : "pointer",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {isLoading ? "..." : "→"}
        </button>
      </div>

      {/* Messages flowing downward */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Reminders */}
        <div
          style={{
            background: "linear-gradient(135deg, #F59E0B10, #F59E0B05)",
            borderRadius: 10,
            padding: 14,
            border: "1px solid #F59E0B20",
            marginBottom: 4,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#F59E0B",
              fontStyle: "italic",
              lineHeight: 1.5,
              marginBottom: 8,
            }}
          >
            {OPENING_QUOTE}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            📡 {SIGNAL_REMINDER}
          </div>
        </div>

        {/* Welcome */}
        {chatHistory.length === 0 && (
          <div style={{ padding: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              What's up Kyle 👋
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#94a3b8",
                lineHeight: 1.5,
                marginBottom: 12,
              }}
            >
              Add tasks, move things around, check stuff off, or build your time
              box — just type naturally.
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {[
                'Add "finish pitch deck" to today under work',
                "Move the pitch deck to next up",
                "Build my time box for tomorrow",
                "What's on my radar?",
                "Add a habit: meditate",
                "I wake up at 7am",
              ].map((ex, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setInput(ex);
                    inputRef.current?.focus();
                  }}
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    background: "#1e293b",
                    padding: "8px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    lineHeight: 1.3,
                    transition: "background 0.15s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#253347")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#1e293b")
                  }
                >
                  {ex}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {displayedMessages.map((msg, i) => (
          <div
            key={i}
            className="animate-slide-in"
            style={{
              display: "flex",
              justifyContent:
                msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                background:
                  msg.role === "user" ? "#1e3a5f" : "#1e293b",
                borderRadius:
                  msg.role === "user"
                    ? "12px 12px 4px 12px"
                    : "12px 12px 12px 4px",
                padding: "10px 14px",
                maxWidth: "85%",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {msg.content.split("\n").map((line, j) => {
                const isAction =
                  line.startsWith("✅") ||
                  line.startsWith("☑️") ||
                  line.startsWith("📦") ||
                  line.startsWith("🗑️") ||
                  line.startsWith("✏️") ||
                  line.startsWith("📐") ||
                  line.startsWith("🔄") ||
                  line.startsWith("⚡") ||
                  line.startsWith("🔁") ||
                  line.startsWith("🌅") ||
                  line.startsWith("🏷️") ||
                  line.startsWith("⏰") ||
                  line.startsWith("⚠️");
                return (
                  <div
                    key={j}
                    style={
                      isAction
                        ? {
                            fontSize: 12,
                            color: line.startsWith("⚠️") ? "#EF4444" : "#10B981",
                            fontFamily:
                              "'JetBrains Mono', monospace",
                            padding: "2px 0",
                          }
                        : {}
                    }
                  >
                    {line || "\u00A0"}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Loading */}
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                background: "#1e293b",
                borderRadius: "12px 12px 12px 4px",
                padding: "10px 14px",
              }}
            >
              <div className="dot-pulse" style={{ display: "flex", gap: 4 }}>
                <span style={{ fontSize: 10, color: "#64748b" }}>●</span>
                <span style={{ fontSize: 10, color: "#64748b" }}>●</span>
                <span style={{ fontSize: 10, color: "#64748b" }}>●</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
