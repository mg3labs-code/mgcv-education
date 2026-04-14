/**
 * Design C: Hybrid — A's card layout + B's rich content boxes
 * Each concept is a card (from A), but inside uses definition/example/formula boxes (from B).
 * Includes "See original textbook text" toggle and containment chain from A.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const sections = [
  {
    icon: "🔢",
    iconBg: "#6366F1",
    title: "Natural Numbers (N)",
    definition: "The counting numbers 1, 2, 3, 4, … are called natural numbers, denoted by N.",
    formula: "N = {1, 2, 3, 4, 5, ...}",
    example: {
      title: "Example: Identifying Natural Numbers",
      content: "Which of these are natural numbers?\n• 5 → Yes ✅\n• 0 → No ❌ (0 is not a counting number)\n• -3 → No ❌ (negative numbers are not natural)",
    },
    note: null,
    original: 'The set of counting numbers 1, 2, 3, … is called natural numbers, denoted by N.',
    source: "SCERT Telangana, Ch.1, Pg.3",
  },
  {
    icon: "0️⃣",
    iconBg: "#F59E0B",
    title: "Whole Numbers (W)",
    definition: "If we include 0 with natural numbers, we get the set of whole numbers W = {0, 1, 2, 3, 4, …}.",
    formula: "W = {0, 1, 2, 3, 4, 5, ...}",
    example: {
      title: "Example: Natural vs Whole",
      content: "Is 0 a natural number? No.\nIs 0 a whole number? Yes!\nEvery natural number is a whole number, but not every whole number is natural.",
    },
    note: "Every natural number is a whole number, but 0 is a whole number that is NOT a natural number.",
    original: 'If we add zero to the set of natural numbers, we get the set of whole numbers W = {0, 1, 2, 3, …}.',
    source: "SCERT Telangana, Ch.1, Pg.3",
  },
  {
    icon: "➖",
    iconBg: "#3B82F6",
    title: "Integers (Z)",
    definition: "The collection of whole numbers along with their negatives forms integers, denoted by Z.",
    formula: "Z = {..., -3, -2, -1, 0, 1, 2, 3, ...}",
    example: {
      title: "Example: Temperature as Integers",
      content: "Temperature can be negative! -5°C, 0°C, 25°C are all integers.\nIntegers extend the number line in both directions infinitely.",
    },
    note: null,
    original: 'The collection of all whole numbers and their negatives is called integers Z = {…, -3, -2, -1, 0, 1, 2, 3, …}.',
    source: "SCERT Telangana, Ch.1, Pg.4",
  },
  {
    icon: "📐",
    iconBg: "#8B5CF6",
    title: "Rational Numbers (Q)",
    definition: "A number that can be expressed as p/q where p and q are integers and q ≠ 0 is called rational.",
    formula: "Rational: p/q where p, q ∈ Z and q ≠ 0",
    example: {
      title: "Example: Identifying Rationals",
      content: "• 3/4 → Rational ✅ (p=3, q=4)\n• 5 → Rational ✅ (5 = 5/1)\n• 0.333... → Rational ✅ (1/3)\n• √2 → NOT rational ❌ (irrational!)",
    },
    note: "The word 'rational' comes from 'ratio' — these numbers can always be written as a ratio of two integers.",
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

export default function DemoDesignC() {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggle = (i: number) => setExpanded((p) => ({ ...p, [i]: !p[i] }));

  return (
    <div style={{ background: "#FAFAF8", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      {/* breadcrumb */}
      <div style={{ textAlign: "center", padding: "18px 0 4px", color: "#10B981", fontSize: 14, fontWeight: 600 }}>
        🧭 Discover · Lesson 1
      </div>
      <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 700, color: "#1C1917", margin: "0 0 20px" }}>
        Number Types &amp; Classification
      </h2>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 16px" }}>
        {sections.map((s, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: "20px 22px",
              marginBottom: 18,
            }}
          >
            {/* icon + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, background: s.iconBg, color: "#fff", fontSize: 14, fontWeight: 700 }}>
                {s.icon}
              </span>
              <span style={{ fontWeight: 700, fontSize: 17, color: "#1C1917" }}>{s.title}</span>
            </div>

            {/* Definition box (from B) */}
            <div style={{ background: "linear-gradient(135deg, #f0f4ff, #e0e7ff)", border: "1.5px solid #6366f1", borderRadius: 10, padding: "12px 16px", margin: "8px 0 12px" }}>
              <p style={{ margin: 0, fontSize: 14, color: "#4338ca", lineHeight: 1.6 }}>
                📖 {s.definition}
              </p>
            </div>

            {/* formula (from A) */}
            <div style={{ background: "#ECFDF5", borderRadius: 8, padding: "10px 16px", fontFamily: "'Courier New', monospace", fontSize: 15, color: "#059669", marginBottom: 12 }}>
              {s.formula}
            </div>

            {/* Example box (from B) */}
            <div style={{ background: "linear-gradient(135deg, #e6fffa, #f0fff4)", border: "1.5px solid #38b2ac", borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
              <h4 style={{ color: "#2c7a7b", margin: "0 0 6px", fontSize: 14, fontWeight: 700 }}>
                💡 {s.example.title}
              </h4>
              {s.example.content.split("\n").map((line, j) => (
                <p key={j} style={{ margin: "2px 0", fontSize: 13, color: "#4a5568", lineHeight: 1.5 }}>
                  {line}
                </p>
              ))}
            </div>

            {/* Note callout (from A) */}
            {s.note && (
              <div style={{ background: "#FEF3C7", borderRadius: 6, padding: "8px 14px", fontSize: 13, color: "#92400E", marginBottom: 10, lineHeight: 1.5 }}>
                ⚠️ {s.note}
              </div>
            )}

            {/* "See original textbook text" toggle (from A) */}
            <button
              onClick={() => toggle(i)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 13, display: "flex", alignItems: "center", gap: 4, padding: 0 }}
            >
              📖 See original textbook text{" "}
              {expanded[i] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {expanded[i] && (
              <div style={{ marginTop: 8, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
                <p style={{ margin: 0 }}>"{s.original}"</p>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9CA3AF" }}>— {s.source}</p>
              </div>
            )}
          </div>
        ))}

        {/* Containment Chain */}
        <div style={{ background: "#F0FDFA", border: "1px solid #99F6E4", borderRadius: 14, padding: "18px 20px", textAlign: "center", marginBottom: 24 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, color: "#0D9488", marginBottom: 14 }}>
            🔗 The Containment Chain
          </h4>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {chain.map((c, i) =>
              c.color ? (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 36, borderRadius: 8, background: c.color, color: "#fff", fontWeight: 700, fontSize: 16 }}>
                  {c.label}
                </span>
              ) : (
                <span key={i} style={{ fontSize: 18, color: "#6B7280", fontWeight: 700 }}>{c.label}</span>
              )
            )}
          </div>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
            Every natural number is a whole number is an integer is a rational number
          </p>
        </div>

        {/* Formula highlight (from B) */}
        <div style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff", borderRadius: 12, padding: 20, margin: "0 0 24px", textAlign: "center", fontSize: "1.1em", fontWeight: 600, boxShadow: "0 8px 25px rgba(102,126,234,0.3)" }}>
          Key Relationship: N ⊂ W ⊂ Z ⊂ Q ⊂ R
        </div>
      </div>
    </div>
  );
}
