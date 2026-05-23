import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { fetchAdminHealth, type HealthPayload } from "../lib/admin-api";

export function OverviewPage() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const result = await fetchAdminHealth();
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setHealth(result.data);
    })();
  }, []);

  const healthRows = [
    {
      label: "Appwrite Project",
      ready: Boolean(health?.projectId),
      detail: health?.projectId || "غير مضبوط",
    },
    {
      label: "Database",
      ready: Boolean(health?.databaseId),
      detail: health?.databaseId || "غير مضبوط",
    },
    {
      label: "كتابة إدارية (API Key)",
      ready: Boolean(health?.writesEnabled),
      detail: health?.writesEnabled
        ? "مفعّل"
        : "أضف APPWRITE_API_KEY في Vercel",
    },
    {
      label: "بريد الأدمن",
      ready: Boolean(health?.adminEmailConfigured),
      detail: health?.adminEmailConfigured ? "مضبوط" : "غير مضبوط",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="OVERVIEW"
        title="نظرة عامة"
        description="حالة الربط مع Appwrite والسيرفر. الإحصائيات التفصيلية قادمة لاحقاً."
        phaseLabel="مرتبط — API + دخول Appwrite"
      />

      {error ? (
        <section className="section-card">
          <p className="empty-hint">{error}</p>
          <p className="empty-hint">
            للتطوير: شغّل <code>npx vercel dev --listen 3000</code> ثم أعد تحميل
            الصفحة.
          </p>
        </section>
      ) : null}

      <div className="stats-grid">
        <article className="stat-card">
          <div className="stat-value" style={{ color: "#63C6FF" }}>
            {health?.writesEnabled ? "ON" : "OFF"}
          </div>
          <div className="stat-label">كتابة API</div>
        </article>
        <article className="stat-card">
          <div className="stat-value" style={{ color: "#41F17B" }}>
            {health?.profilesCollectionId || "—"}
          </div>
          <div className="stat-label">Profiles</div>
        </article>
        <article className="stat-card">
          <div className="stat-value" style={{ color: "#F4C565" }}>
            {health?.postsCollectionId || "—"}
          </div>
          <div className="stat-label">Posts</div>
        </article>
        <article className="stat-card">
          <div className="stat-value" style={{ color: "#F985FF" }}>
            {health?.ok ? "READY" : "SETUP"}
          </div>
          <div className="stat-label">الجاهزية</div>
        </article>
      </div>

      <section className="section-card">
        <div className="section-head">
          <h2 className="section-title">جاهزية النظام</h2>
          <span className="section-tag">SYSTEM HEALTH</span>
        </div>
        {healthRows.map((row) => (
          <div key={row.label} className="health-row">
            <div className="row-copy">
              <strong>{row.label}</strong>
              <span>{row.detail}</span>
            </div>
            <div
              className={
                row.ready ? "health-dot ready" : "health-dot pending"
              }
            >
              {row.ready ? "✓" : "…"}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
