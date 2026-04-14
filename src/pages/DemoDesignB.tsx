/**
 * Design B: Full Reader — matches textbook-3.html exactly
 * Traditional textbook with definition/formula/example/note boxes, sidebar nav.
 */
import { useState } from "react";

const topics = [
  { id: "euclid", label: "Euclid's Division Lemma", status: "completed" },
  { id: "fundamental", label: "Fundamental Theorem of Arithmetic", status: "completed" },
  { id: "hcf-lcm", label: "HCF and LCM", status: "current" },
  { id: "irrational", label: "Irrational Numbers", status: "" },
];

export default function DemoDesignB() {
  const [activeTopic, setActiveTopic] = useState("hcf-lcm");

  return (
    <div style={{ display: "flex", height: "100vh", maxWidth: 1400, margin: "0 auto", background: "#fff", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", boxShadow: "0 0 30px rgba(0,0,0,0.1)" }}>
      {/* ── Sidebar ── */}
      <div style={{ width: 320, background: "#f8f9fa", borderRight: "1px solid #e9ecef", overflowY: "auto", padding: 20, flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#2c5282", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
          📚 MathShala
        </div>
        <div style={{ color: "#3182ce", fontSize: 14, marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>
          📊 Progress Report
        </div>

        {/* Chapter header */}
        <div style={{ background: "#3182ce", color: "#fff", padding: "10px 14px", borderRadius: 8, fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
          📐 Chapter 1: Real Numbers
        </div>

        {/* Topics */}
        <div style={{ paddingLeft: 12 }}>
          {topics.map((t) => (
            <div
              key={t.id}
              onClick={() => setActiveTopic(t.id)}
              style={{
                padding: "10px 14px",
                margin: "4px 0",
                borderRadius: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderLeft: t.id === activeTopic ? "3px solid #3182ce" : "3px solid transparent",
                background: t.id === activeTopic ? "#bee3f8" : "transparent",
                color: t.id === activeTopic ? "#2c5282" : "#4a5568",
                fontSize: 14,
                transition: "all 0.2s",
              }}
            >
              {t.status === "completed" && "✅"}
              {t.status === "current" && "▶️"}
              {t.label}
            </div>
          ))}
        </div>

        {/* Other chapters (collapsed) */}
        {["📊 Chapter 2: Polynomials", "➕ Chapter 3: Linear Equations", "📐 Chapter 4: Quadratic Equations"].map((ch) => (
          <div
            key={ch}
            style={{
              background: "#e2e8f0",
              padding: "10px 14px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              margin: "8px 0",
              color: "#4a5568",
              cursor: "pointer",
            }}
          >
            {ch}
          </div>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1e40af 0%, #3730a3 100%)", color: "#fff", padding: "18px 30px" }}>
          <div style={{ color: "#fbbf24", fontSize: 13, marginBottom: 4 }}>Chapter 1 &gt; Topic 3 &gt; Detailed Explanation</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontSize: 28, fontWeight: 300, margin: 0 }}>HCF and LCM</h1>
            <div style={{ display: "flex", gap: 8 }}>
              {["MindMap", "Practical Questions", "Q Bank"].map((b) => (
                <button
                  key={b}
                  style={{
                    background: "linear-gradient(45deg, #667eea, #764ba2)",
                    border: "none",
                    borderRadius: 20,
                    padding: "8px 18px",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, padding: 30, overflowY: "auto", background: "#fff" }}>
          <div style={{ maxWidth: 900, lineHeight: 1.8, fontSize: 16 }}>
            <h2 style={{ color: "#2d3748", fontSize: "1.8em", borderBottom: "3px solid #3182ce", paddingBottom: 10, marginBottom: 20 }}>
              HCF and LCM — The Dynamic Duo of Mathematics
            </h2>

            <p style={{ color: "#4a5568", textAlign: "justify", marginBottom: 18 }}>
              Have you ever wondered how to find the greatest common factor or the least common multiple of numbers? HCF and LCM are like mathematical detectives that help us solve many real-world problems!
            </p>

            {/* Definition Box */}
            <div style={{ background: "linear-gradient(135deg, #f0f4ff, #e0e7ff)", border: "2px solid #6366f1", borderRadius: 12, padding: 20, margin: "20px 0" }}>
              <h4 style={{ color: "#4338ca", marginBottom: 10, display: "flex", alignItems: "center", gap: 8, fontSize: "1.2em" }}>
                📖 What are HCF and LCM?
              </h4>
              <p style={{ margin: "0 0 8px", color: "#4a5568" }}>
                <strong>HCF (Highest Common Factor):</strong> The largest number that divides two or more numbers exactly.
              </p>
              <p style={{ margin: 0, color: "#4a5568" }}>
                <strong>LCM (Least Common Multiple):</strong> The smallest positive number that is divisible by two or more numbers.
              </p>
            </div>

            {/* Section heading */}
            <h3 style={{ color: "#4a5568", fontSize: "1.3em", background: "#f7fafc", padding: "10px 15px", borderLeft: "4px solid #3182ce", margin: "25px 0 15px" }}>
              Understanding HCF with Examples
            </h3>

            {/* Example Box */}
            <div style={{ background: "linear-gradient(135deg, #e6fffa, #f0fff4)", border: "2px solid #38b2ac", borderRadius: 12, padding: 20, margin: "20px 0" }}>
              <h4 style={{ color: "#2c7a7b", marginBottom: 12, fontSize: "1.2em" }}>
                💡 Example 1: Find HCF of 12 and 18
              </h4>
              <p style={{ color: "#4a5568" }}><strong>Method 1: Listing Factors</strong></p>
              <p style={{ color: "#4a5568" }}>Factors of 12: 1, 2, 3, 4, 6, 12</p>
              <p style={{ color: "#4a5568" }}>Factors of 18: 1, 2, 3, 6, 9, 18</p>
              <p style={{ color: "#4a5568" }}>Common factors: 1, 2, 3, 6</p>
              <p style={{ color: "#4a5568", fontWeight: 700 }}>HCF = 6 (the highest common factor)</p>

              <p style={{ color: "#4a5568", marginTop: 14 }}><strong>Method 2: Prime Factorization</strong></p>
              <p style={{ color: "#4a5568" }}>12 = 2² × 3</p>
              <p style={{ color: "#4a5568" }}>18 = 2 × 3²</p>
              <p style={{ color: "#4a5568", fontWeight: 700 }}>HCF = 2¹ × 3¹ = 6</p>
            </div>

            {/* Formula Box */}
            <div
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                color: "#fff",
                borderRadius: 12,
                padding: 22,
                margin: "22px 0",
                textAlign: "center",
                fontSize: "1.2em",
                fontWeight: 600,
                boxShadow: "0 8px 25px rgba(102,126,234,0.3)",
              }}
            >
              For any two numbers a and b:<br />
              HCF(a,b) × LCM(a,b) = a × b
            </div>

            {/* Important Note */}
            <div style={{ background: "linear-gradient(135deg, #fef5e7, #fff5d6)", border: "2px solid #f6ad55", borderRadius: 12, padding: 20, margin: "20px 0" }}>
              <h4 style={{ color: "#c05621", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                ⚠️ Key Point to Remember
              </h4>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#92400E" }}>
                <li>The remainder <strong>r</strong> is always less than the divisor <strong>b</strong></li>
                <li>For co-prime numbers: HCF = 1, LCM = product of the numbers</li>
                <li>Using the relationship: If you know HCF, then LCM = (a × b) ÷ HCF</li>
              </ul>
            </div>

            {/* Application Example */}
            <div style={{ background: "linear-gradient(135deg, #e6fffa, #f0fff4)", border: "2px solid #38b2ac", borderRadius: 12, padding: 20, margin: "20px 0" }}>
              <h4 style={{ color: "#2c7a7b", marginBottom: 12, fontSize: "1.2em" }}>
                💡 Application: Meeting Schedules
              </h4>
              <p style={{ color: "#4a5568" }}>
                <strong>Problem:</strong> Two friends visit a library. One comes every 12 days, the other every 18 days. If they meet today, after how many days will they meet again?
              </p>
              <p style={{ color: "#4a5568" }}><strong>Solution:</strong> We need LCM(12, 18) = 36</p>
              <p style={{ color: "#4a5568", fontWeight: 700 }}>Answer: They will meet again after 36 days.</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding: "16px 30px", background: "#f8f9fa", borderTop: "1px solid #e9ecef", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button style={{ background: "#3182ce", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>
            ← Previous
          </button>
          <span style={{ color: "#6B7280", fontSize: 14 }}>Topic 3 of 4</span>
          <button style={{ background: "#3182ce", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
