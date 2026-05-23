import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import {
  lookupAdminUser,
  setUserAccountStatus,
  setUserVerification,
  type LookupUser,
} from "../lib/admin-api";

type UsersPageProps = {
  onToast: (message: string) => void;
};

export function UsersPage(props: UsersPageProps) {
  const [query, setQuery] = useState("VAR-12345678");
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [user, setUser] = useState<LookupUser | null>(null);

  const runLookup = async () => {
    setIsSearching(true);
    setLookupError("");

    const result = await lookupAdminUser(query);
    setIsSearching(false);

    if (!result.ok) {
      setUser(null);
      setLookupError(result.error);
      return;
    }

    setUser(result.data.user);
  };

  const runAccountStatus = async (status: "active" | "suspended") => {
    if (!user) {
      return;
    }

    setIsUpdating(true);
    const result = await setUserAccountStatus(user.displayVarId, status);
    setIsUpdating(false);

    if (!result.ok) {
      props.onToast(result.error);
      return;
    }

    setUser({ ...user, accountStatus: status });
    props.onToast(status === "suspended" ? "تم إيقاف الحساب." : "تم تفعيل الحساب.");
  };

  const runVerification = async (verified: boolean) => {
    if (!user) {
      return;
    }

    setIsUpdating(true);
    const result = await setUserVerification(user.displayVarId, verified);
    setIsUpdating(false);

    if (!result.ok) {
      props.onToast(result.error);
      return;
    }

    setUser({ ...user, verified });
    props.onToast(verified ? "تم منح التوثيق." : "تم إلغاء التوثيق.");
  };

  return (
    <>
      <PageHeader
        eyebrow="USERS"
        title="المستخدمون"
        description="بحث برقم VAR الظاهر ومنح أو إلغاء التوثيق عبر API الأدمن."
        phaseLabel="مفعّل — بحث + توثيق + إيقاف"
      />

      <section className="section-card">
        <div className="section-head">
          <h2 className="section-title">بحث Display VAR</h2>
          <span className="section-tag">LOOKUP</span>
        </div>

        <div className="search-bar">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="VAR-12345678"
          />
          <button
            type="button"
            className="btn-search"
            disabled={isSearching}
            onClick={() => void runLookup()}
          >
            {isSearching ? "..." : "بحث"}
          </button>
        </div>

        {lookupError ? <p className="empty-hint">{lookupError}</p> : null}

        {user ? (
          <div className="user-result">
            <div>
              <h3>{user.displayName || "بدون اسم"}</h3>
              <p className="user-meta">
                @{user.username || "no-username"} · {user.role} ·{" "}
                {user.verified ? "موثّق" : "غير موثّق"} ·{" "}
                {user.accountStatus === "suspended" ? "موقوف" : "نشط"}
              </p>
            </div>

            <div className="metrics-inline">
              <div className="metric-pill">
                <strong>{user.postsCount}</strong>
                <span>منشورات</span>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span>Display VAR</span>
                <strong>{user.displayVarId}</strong>
              </div>
              <div className="detail-item">
                <span>Internal VAR</span>
                <strong>{user.varId}</strong>
              </div>
            </div>

            <div className="action-grid">
              <button
                type="button"
                className="btn-action primary"
                disabled={isUpdating || user.verified}
                onClick={() => void runVerification(true)}
              >
                منح توثيق
              </button>
              <button
                type="button"
                className="btn-action warn"
                disabled={isUpdating || !user.verified}
                onClick={() => void runVerification(false)}
              >
                إلغاء توثيق
              </button>
              <button
                type="button"
                className="btn-action warn"
                disabled={
                  isUpdating || user.accountStatus === "suspended"
                }
                onClick={() => void runAccountStatus("suspended")}
              >
                إيقاف حساب
              </button>
              <button
                type="button"
                className="btn-action"
                disabled={isUpdating || user.accountStatus === "active"}
                onClick={() => void runAccountStatus("active")}
              >
                إعادة تفعيل
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
