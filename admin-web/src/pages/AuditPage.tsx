import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import {
  formatAuditAction,
  listAdminAuditLogs,
  type AuditLogEntry,
} from "../lib/admin-api";

function formatRelativeTime(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value || "—";
  }

  return new Date(parsed).toLocaleString("ar-SA");
}

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState("");
  const [collectionId, setCollectionId] = useState("");

  useEffect(() => {
    void (async () => {
      const result = await listAdminAuditLogs();
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setLogs(result.data.logs);
      setCollectionId(result.data.collectionId);
    })();
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="AUDIT"
        title="سجل العمليات"
        description="كل إجراء إداري يُسجّل هنا تلقائياً بعد تفعيل collection التدقيق."
        phaseLabel="مفعّل — سجل حي"
      />

      <section className="section-card">
        <div className="section-head">
          <h2 className="section-title">آخر العمليات</h2>
          <span className="section-tag">{collectionId || "AUDIT"}</span>
        </div>

        {error ? <p className="empty-hint">{error}</p> : null}

        {logs.length ? (
          logs.map((row) => (
            <div key={row.id} className="list-row">
              <div className="row-copy">
                <strong>{formatAuditAction(row.action)}</strong>
                <span>
                  الهدف: {row.targetId} · بواسطة {row.adminEmail || "—"} ·{" "}
                  {formatRelativeTime(row.createdAt)}
                </span>
                {row.details ? (
                  <span style={{ display: "block", marginTop: 4 }}>
                    {row.details}
                  </span>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="empty-hint">
            لا توجد عمليات مسجلة بعد. أنشئ collection باسم admin_audit بالحقول:
            action, targetId, adminId, adminEmail, details.
          </p>
        )}
      </section>
    </>
  );
}
