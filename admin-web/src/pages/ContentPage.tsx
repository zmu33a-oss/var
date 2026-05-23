import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import {
  deleteAdminPost,
  listAdminPosts,
  setPostHidden,
  type AdminPost,
} from "../lib/admin-api";

type ContentPageProps = {
  onToast: (message: string) => void;
};

function formatRelativeTime(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value || "—";
  }

  const deltaMinutes = Math.max(
    1,
    Math.round((Date.now() - parsed) / 60000),
  );

  if (deltaMinutes < 60) {
    return `منذ ${deltaMinutes} دقيقة`;
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `منذ ${deltaHours} ساعة`;
  }

  return `منذ ${Math.round(deltaHours / 24)} يوم`;
}

export function ContentPage(props: ContentPageProps) {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [hidingId, setHidingId] = useState("");

  const loadPosts = async () => {
    const result = await listAdminPosts();
    if (!result.ok) {
      setError(result.error);
      setPosts([]);
      return;
    }

    setError("");
    setPosts(result.data.posts);
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const handleHide = async (post: AdminPost, hidden: boolean) => {
    setHidingId(post.id);
    const result = await setPostHidden(post.id, hidden);
    setHidingId("");

    if (!result.ok) {
      props.onToast(result.error);
      return;
    }

    setPosts((current) =>
      current.map((item) =>
        item.id === post.id ? { ...item, hidden } : item,
      ),
    );
    props.onToast(hidden ? "تم إخفاء المنشور." : "تم إظهار المنشور.");
  };

  const handleDelete = async (post: AdminPost) => {
    const confirmed = window.confirm(
      `حذف المنشور "${post.title || post.id}"؟ لا يمكن التراجع.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(post.id);
    const result = await deleteAdminPost(post.id);
    setDeletingId("");

    if (!result.ok) {
      props.onToast(result.error);
      return;
    }

    setPosts((current) => current.filter((item) => item.id !== post.id));
    props.onToast("تم حذف المنشور.");
  };

  return (
    <>
      <PageHeader
        eyebrow="CONTENT"
        title="المحتوى"
        description="عرض وحذف منشورات X من Appwrite."
        phaseLabel="مفعّل — إخفاء + حذف"
      />

      <section className="section-card">
        <div className="section-head">
          <h2 className="section-title">أحدث المنشورات</h2>
          <span className="section-tag">X FEED</span>
        </div>

        {error ? <p className="empty-hint">{error}</p> : null}

        {posts.length ? (
          posts.map((post) => (
            <div key={post.id} className="list-row">
              <div className="row-copy" style={{ flex: 1 }}>
                <strong>
                  {post.title || "منشور بدون عنوان"}
                  {post.hidden ? " · مخفي" : ""}
                </strong>
                <span>
                  {post.varId || post.authorId} ·{" "}
                  {formatRelativeTime(post.createdAt)}
                </span>
                <span style={{ display: "block", marginTop: 6 }}>
                  {post.content}
                </span>
              </div>
              <div className="post-actions">
                <button
                  type="button"
                  className="btn-action warn"
                  disabled={hidingId === post.id}
                  onClick={() => void handleHide(post, !post.hidden)}
                >
                  {post.hidden ? "إظهار" : "إخفاء"}
                </button>
                <button
                  type="button"
                  className="btn-action danger"
                  disabled={deletingId === post.id}
                  onClick={() => void handleDelete(post)}
                >
                  {deletingId === post.id ? "..." : "حذف"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-hint">
            لا توجد منشورات أو أن API Key غير مضبوط بعد.
          </p>
        )}
      </section>
    </>
  );
}
