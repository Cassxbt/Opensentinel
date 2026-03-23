import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg)",
        color: "var(--text)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          border: "1px solid var(--border)",
          background: "var(--bg-panel)",
          padding: "1.5rem",
        }}
      >
        <p style={{ color: "var(--accent)", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Open Sentinel
        </p>
        <h1 style={{ marginTop: "0.9rem", fontSize: "2rem", lineHeight: 1.05 }}>
          Policy-bound wallet control for AI agents.
        </h1>
        <p style={{ marginTop: "1rem", color: "var(--dim)", lineHeight: 1.7 }}>
          Open Sentinel turns natural-language wallet objectives into a checked execution plan,
          explicit policy verdict, and receipt-grade action log.
        </p>
        <div style={{ marginTop: "1.4rem" }}>
          <Link
            href="/sentinel"
            style={{
              display: "inline-block",
              border: "1px solid var(--border-hi)",
              padding: "0.6rem 1rem",
              color: "var(--accent)",
              textDecoration: "none",
            }}
          >
            enter sentinel
          </Link>
        </div>
      </div>
    </main>
  );
}
