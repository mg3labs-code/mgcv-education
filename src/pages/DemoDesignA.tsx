/**
 * Design A: Two-Track Cards
 * Matches the screenshot exactly — concept cards with colored formula boxes,
 * "See original textbook text" toggles, note callouts, containment chain.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, Volume2 } from "lucide-react";

/* ── sample data ── */
const concepts = [
  {
    icon: "🔢",
    iconBg: "#6366F1",
    title: "Natural Numbers (N)",
    description: "The counting numbers 1, 2, 3, 4, ..",
    formula: "N = {1, 2, 3, 4, 5, ...}",
    note: null,
    original: 'The set of counting numbers 1, 2, 3, … is called natural numbers, denoted by N.',
    source: "SCERT Telangana, Ch.1, Pg.3",
  },
  {
    icon: "0️⃣",
    iconBg: "#F59E0B",
    title: "Whole Numbers (W)",
    description: "Including zero with natural numbers gives whole numbers, denoted by W = {0, 1, 2, 3, 4, ..",
    formula: "W = {0, 1, 2, 3, 4, 5, ...}",
    note: "Every natural number is a whole number, but 0 is a whole number that is NOT a natural number.",
    original: 'If we add zero to the set of natural numbers, we get the set of whole numbers W = {0, 1, 2, 3, …}.',
    source: "SCERT Telangana, Ch.1, Pg.3",
  },
  {
    icon: "➖",
    iconBg: "#3B82F6",
    title: "Integers (Z)",
    description: "The collection of whole numbers along with their negatives forms integers, denoted by Z = {..",
    formula: "Z = {..., -3, -2, -1, 0, 1, 2, 3, ...}",
    note: null,
    original: 'The collection of all whole numbers and their negatives is called integers Z = {…, -3, -2, -1, 0, 1, 2, 3, …}.',
    source: "SCERT Telangana, Ch.1, Pg.4",
  },
  {
    icon: "📐",
    iconBg: "#8B5CF6",
    title: "Rational Numbers (Q)",
    description: "A number expressible as p/q where p, q are integers and q ≠ 0 is rational. Denoted by Q (from 'quotient').",
    formula: "Rational: p/q where p, q ∈ Z and q ≠ 0",
    note: null,
    original: 'A number is called rational if it can be expressed in the form p/q where p and q are integers, q ≠ 0.',
    source: "SCERT Telangana, Ch.1, Pg.5",
  },
];

const chain = [
  { label: "N", color: "#EF4444" },
  { label: "⊂", color: null },
  { label: "W", color: "#F59E0B" },
  { label: "⊂", color: null },
  { label: "Z", color: "#3B82F6" },
  { label: "⊂", color: null },
  { label: "Q", color: "#8B5CF6" },
];

export default function DemoDesignA() {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggle = (i: number) =>
    setExpanded((p) => ({ ...p, [i]: !p[i] }));

  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      {/* top breadcrumb */}
      <div style={{ textAlign: "center", padding: "18px 0 4px", color: "#10B981", fontSize: 14, fontWeight: 600 }}>
        🧭 Discover · Lesson 1
      </div>

      {/* title */}
      <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 700, color: "#1C1917", margin: "0 0 20px" }}>
        Number Types &amp; Classification
      </h2>

      {/* scrollbar indicator (decorative) */}
      <div style={{ position: "fixed", right: 8, top: 60, width: 6, height: 200, background: "#E5E7EB", borderRadius: 3 }}>
        <div style={{ width: 6, height: 60, background: "#9CA3AF", borderRadius: 3 }} />
      </div>

      {/* concept cards */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px" }}>
        {concepts.map((c, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: "18px 20px",
              marginBottom: 16,
            }}
          >
            {/* icon + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: c.iconBg,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {c.icon}
              </span>
              <span style={{ fontWeight: 700, fontSize: 17, color: "#1C1917" }}>{c.title}</span>
            </div>

            {/* description */}
            <p style={{ fontSize: 14, color: "#6B7280", margin: "4px 0 10px", lineHeight: 1.5 }}>
              {c.description}
            </p>

            {/* formula box — mint green bg */}
            <div
              style={{
                background: "#ECFDF5",
                borderRadius: 8,
                padding: "10px 16px",
                fontFamily: "'Courier New', monospace",
                fontSize: 15,
                color: "#059669",
                marginBottom: 10,
              }}
            >
              {c.formula}
            </div>

            {/* note callout (yellow) */}
            {c.note && (
              <div
                style={{
                  background: "#FEF3C7",
                  borderRadius: 6,
                  padding: "8px 14px",
                  fontSize: 13,
                  color: "#92400E",
                  marginBottom: 10,
                  lineHeight: 1.5,
                }}
              >
                💡 {c.note}
              </div>
            )}

            {/* "See original textbook text" toggle */}
            <button
              onClick={() => toggle(i)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9CA3AF",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: 0,
              }}
            >
              📖 See original textbook text{" "}
              {expanded[i] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* expanded original text */}
            {expanded[i] && (
              <div
                style={{
                  marginTop: 8,
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 6,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#6B7280",
                  lineHeight: 1.6,
                }}
              >
                <p style={{ margin: 0 }}>"{c.original}"</p>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9CA3AF" }}>
                  — {c.source}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* ── Containment Chain ── */}
        <div
          style={{
            background: "#F0FDFA",
            border: "1px solid #99F6E4",
            borderRadius: 14,
            padding: "18px 20px",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <h4 style={{ fontSize: 16, fontWeight: 700, color: "#0D9488", marginBottom: 14 }}>
            🔗 The Containment Chain
          </h4>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {chain.map((c, i) =>
              c.color ? (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 40,
                    height: 36,
                    borderRadius: 8,
                    background: c.color,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {c.label}
                </span>
              ) : (
                <span key={i} style={{ fontSize: 18, color: "#6B7280", fontWeight: 700 }}>
                  {c.label}
                </span>
              )
            )}
          </div>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
            Every natural number is a whole number is an integer is a rational number
          </p>
        </div>
      </div>
    </div>
  );
}
