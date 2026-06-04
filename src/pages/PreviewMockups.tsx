import { useParams, Link } from "react-router-dom";

const PREVIEWS = [
  { slug: "interest-engine", title: "Interest → Curiosity Engine", desc: "Welcome → pick 3 interests → first hook + curiosity prompt." },
  { slug: "day1-flow", title: "Day 1 · 5-min Spark Flow", desc: "Hook → first guess → reveal → sort → loop close." },
  { slug: "3day-arc", title: "Complete 3-Day Arc (Cricket lens)", desc: "Day 1 spark · Day 2 build · Day 3 master, end-to-end." },
];

export default function PreviewMockups() {
  const { slug } = useParams<{ slug?: string }>();

  if (slug) {
    const item = PREVIEWS.find((p) => p.slug === slug);
    if (!item) return <div style={{ padding: 32 }}>Unknown preview.</div>;
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0f172a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", color: "white", fontFamily: "system-ui" }}>
          <Link to="/previews" style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 600, fontSize: 13 }}>← All previews</Link>
          <span style={{ fontSize: 13, opacity: 0.7 }}>{item.title}</span>
        </div>
        <iframe
          title={item.title}
          src={`/previews/${item.slug}.html`}
          style={{ flex: 1, width: "100%", border: 0, background: "#F8F7F4" }}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px", fontFamily: "system-ui" }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#A8A29E", margin: 0 }}>MGCV · Mockups</p>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 6, marginBottom: 8, color: "#1C1917" }}>Interest-to-Concept Engine previews</h1>
      <p style={{ color: "#57534E", marginBottom: 24, fontSize: 14 }}>
        These are the exact HTML mockups you uploaded, served as-is for click-through review. After you sign-off here we'll port them into the live React episode flow.
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        {PREVIEWS.map((p) => (
          <Link
            key={p.slug}
            to={`/previews/${p.slug}`}
            style={{
              display: "block",
              padding: 16,
              borderRadius: 12,
              border: "1px solid #E7E5E4",
              background: "white",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <p style={{ fontWeight: 700, color: "#1C1917", margin: 0 }}>{p.title}</p>
            <p style={{ fontSize: 13, color: "#57534E", margin: "4px 0 0" }}>{p.desc}</p>
            <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 8, fontWeight: 600 }}>Open preview →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
