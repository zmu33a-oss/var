import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { fetchAdminHealth, type HealthPayload } from "../lib/admin-api";
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  VAR_ADMIN_EMAIL,
} from "../lib/config";

export function SettingsPage() {
  const [health, setHealth] = useState<HealthPayload | null>(null);

  useEffect(() => {
    void (async () => {
      const result = await fetchAdminHealth();
      if (result.ok) {
        setHealth(result.data);
      }
    })();
  }, []);

  const configRows = [
    { label: "Endpoint", value: APPWRITE_ENDPOINT },
    { label: "Project ID", value: APPWRITE_PROJECT_ID || "—" },
    { label: "Database ID", value: health?.databaseId || "—" },
    { label: "Profiles Collection", value: health?.profilesCollectionId || "—" },
    { label: "Posts Collection", value: health?.postsCollectionId || "—" },
    { label: "Admin Email", value: VAR_ADMIN_EMAIL || "—" },
    { label: "API Writes", value: health?.writesEnabled ? "مفعّل" : "غير مفعّل" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="SETTINGS"
        title="الإعدادات"
        description="خريطة الربط مع Appwrite ومتطلبات Vercel."
      />

      <section className="section-card">
        <div className="section-head">
          <h2 className="section-title">خريطة Appwrite</h2>
          <span className="section-tag">CONFIG</span>
        </div>

        <div className="detail-grid">
          {configRows.map((row) => (
            <div key={row.label} className="detail-item">
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>

        {health?.missing?.length ? (
          <p className="empty-hint" style={{ marginTop: 16 }}>
            ناقص على السيرفر: {health.missing.join(", ")}
          </p>
        ) : null}
      </section>

      <section className="section-card">
        <div className="section-head">
          <h2 className="section-title">Appwrite Console</h2>
          <span className="section-tag">REQUIRED</span>
        </div>
        <div className="health-row">
          <div className="row-copy">
            <strong>profiles</strong>
            <span>isVerified (boolean) · accountStatus (string: active/suspended)</span>
          </div>
        </div>
        <div className="health-row">
          <div className="row-copy">
            <strong>posts</strong>
            <span>status (string: hidden/published) أو isHidden (boolean)</span>
          </div>
        </div>
        <div className="health-row">
          <div className="row-copy">
            <strong>admin_audit</strong>
            <span>
              action, targetId, adminId, adminEmail, details — لتسجيل العمليات
            </span>
          </div>
        </div>
        <div className="health-row">
          <div className="row-copy">
            <strong>APPWRITE_API_KEY</strong>
            <span>
              مفتاح API بصلاحية قراءة/كتابة على Database — في Vercel Environment
              Variables.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
