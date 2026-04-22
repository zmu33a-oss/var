import { useState, useRef } from "react";
import { Camera, Pencil, X, LogOut, MapPin, Calendar } from "lucide-react";
import styles from "../pages-css/ProfilePage.module.css";
import { useAuth } from "../lib/AuthContext";
import { buildXHandle } from "../lib/xPosts";
import { supabase } from "./supabase";

const GALLERY = [
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=80",
  "https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=400&q=80",
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&q=80",
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&q=80",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80",
  "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=400&q=80",
];

interface Props {
  onSignOut?: () => void;
}

async function saveUserProfileFields(
  userId: string,
  payload: Record<string, unknown>,
) {
  const existing = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing.data?.id) {
    return supabase.from("users").update(payload).eq("id", userId);
  }

  return supabase.from("users").insert({ id: userId, ...payload });
}

function normalizeHandle(value: string | null | undefined) {
  if (!value?.trim()) return null;

  const trimmedValue = value.trim();
  return trimmedValue.startsWith("@") ? trimmedValue : `@${trimmedValue}`;
}

function uniqueNonEmptyStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

export default function ProfilePage({ onSignOut }: Props) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAvatarFrameEnabled, setEditAvatarFrameEnabled] = useState(false);

  const rawEmail = profile?.email ?? user?.email ?? "";
  const displayName =
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    rawEmail.split("@")[0] ??
    "مستخدم";
  const username = profile?.username ?? `@${rawEmail.split("@")[0] || "user"}`;
  const bio = profile?.bio ?? "";
  const location = profile?.location ?? "";
  const avatarUrl =
    profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? null;
  const avatarFrameEnabled = Boolean(
    profile?.avatar_frame_enabled ?? user?.user_metadata?.avatar_frame_enabled,
  );
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("ar", {
        year: "numeric",
        month: "long",
      })
    : "";

  const openEdit = () => {
    setEditName(displayName);
    setEditBio(bio);
    setEditPhone(profile?.phone ?? "");
    setEditLocation(location);
    setEditAvatarFrameEnabled(avatarFrameEnabled);
    setMsg("");
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!user) return;
    const nextDisplayName = editName.trim() || displayName;
    const currentProfileHandle =
      normalizeHandle(profile?.username) ?? buildXHandle(displayName);
    const nextProfileHandle =
      normalizeHandle(profile?.username) ?? buildXHandle(nextDisplayName);
    const existingDisplayNameAliases = Array.isArray(
      user.user_metadata?.x_display_name_aliases,
    )
      ? user.user_metadata.x_display_name_aliases.filter(
          (value: unknown): value is string => typeof value === "string",
        )
      : [];
    const existingHandleAliases = Array.isArray(
      user.user_metadata?.x_handle_aliases,
    )
      ? user.user_metadata.x_handle_aliases.filter(
          (value: unknown): value is string => typeof value === "string",
        )
      : [];

    setSaving(true);
    const { error } = await saveUserProfileFields(user.id, {
      full_name: nextDisplayName || null,
      bio: editBio.trim() || null,
      phone: editPhone.trim() || null,
      location: editLocation.trim() || null,
    });
    if (error) {
      setSaving(false);
      setMsg("خطأ: " + error.message);
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        full_name: nextDisplayName,
        name: nextDisplayName,
        avatar_frame_enabled: editAvatarFrameEnabled,
        x_display_name_aliases: uniqueNonEmptyStrings([
          displayName,
          nextDisplayName,
          ...existingDisplayNameAliases,
        ]),
        x_handle_aliases: uniqueNonEmptyStrings([
          currentProfileHandle,
          nextProfileHandle,
          ...existingHandleAliases,
        ]),
      },
    });

    setSaving(false);
    if (authError) {
      setMsg("خطأ: " + authError.message);
      return;
    }

    await refreshProfile();
    setShowEdit(false);
  };

  // Resize image client-side via canvas (no bucket needed)
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 15 * 1024 * 1024) {
      setMsg("الصورة أكبر من 15MB");
      return;
    }
    setUploading(true);
    setMsg("جاري معالجة الصورة...");
    try {
      const dataUrl = await resizeImage(file, 400, 0.85);
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          avatar_url: dataUrl,
        },
      });
      if (error) {
        setMsg("فشل الحفظ: " + error.message);
      } else {
        await refreshProfile();
        setMsg("تم تحديث الصورة ✅");
        setTimeout(() => setMsg(""), 3000);
      }
    } catch {
      setMsg("فشل معالجة الصورة");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleSignOut = async () => {
    await signOut();
    onSignOut?.();
  };

  return (
    <main className={styles.page}>
      {/* Cover */}
      <div className={styles.cover} />

      {/* Avatar + edit button row */}
      <div className={styles.avatarRow}>
        <div className={styles.avatarMedia}>
          {avatarFrameEnabled && (
            <img
              src="/profile-frame-rsl.svg"
              alt=""
              aria-hidden="true"
              className={styles.avatarFrame}
            />
          )}
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
          ) : (
            <div className={styles.avatarFallback}>
              {displayName[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <button type="button" className={styles.editBtn} onClick={openEdit}>
          <Pencil size={14} /> تعديل
        </button>
      </div>

      {/* Name + bio */}
      <div className={styles.nameSection}>
        <h2 className={styles.displayName}>{displayName}</h2>
        <p className={styles.usernameText}>{username}</p>
        {bio && <p className={styles.bioText}>{bio}</p>}
        <div className={styles.metaRow}>
          {location && (
            <span className={styles.metaItem}>
              <MapPin size={13} /> {location}
            </span>
          )}
          {joinDate && (
            <span className={styles.metaItem}>
              <Calendar size={13} /> {joinDate}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <strong>0</strong>
          <span>متابع</span>
        </div>
        <div className={styles.statDiv} />
        <div className={styles.stat}>
          <strong>0</strong>
          <span>يتابع</span>
        </div>
        <div className={styles.statDiv} />
        <div className={styles.stat}>
          <strong>0</strong>
          <span>لايك</span>
        </div>
      </div>

      {/* Gallery */}
      <div className={styles.galleryGrid}>
        {GALLERY.map((url, i) => (
          <div key={i} className={styles.galleryCell}>
            <img src={url} alt="" loading="lazy" />
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div style={{ padding: "0 16px 20px" }}>
        <button
          type="button"
          onClick={handleSignOut}
          className={styles.signOutBtn}
        >
          <LogOut size={15} /> تسجيل الخروج
        </button>
      </div>

      {/* ── Edit Modal ── */}
      {showEdit && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowEdit(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowEdit(false)}
              >
                <X size={18} />
              </button>
              <h3>تعديل الملف الشخصي</h3>
              <button
                type="button"
                className={styles.saveBtnHeader}
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? "..." : "حفظ"}
              </button>
            </div>

            {/* Avatar upload */}
            <div className={styles.modalAvatarWrap}>
              <div className={styles.modalAvatarRow}>
                <button
                  type="button"
                  className={styles.modalAvatarBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <div className={styles.modalAvatarMedia}>
                    {editAvatarFrameEnabled && (
                      <img
                        src="/profile-frame-rsl.svg"
                        alt=""
                        aria-hidden="true"
                        className={styles.avatarFrame}
                      />
                    )}
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="avatar"
                        className={styles.modalAvatarImg}
                      />
                    ) : (
                      <div className={styles.modalAvatarFallback}>
                        {displayName[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className={styles.modalCamOverlay}>
                      {uploading ? (
                        <span className={styles.spinner} />
                      ) : (
                        <Camera size={22} />
                      )}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  className={`${styles.frameToggleBtn} ${editAvatarFrameEnabled ? styles.frameToggleBtnActive : ""}`}
                  onClick={() =>
                    setEditAvatarFrameEnabled((current) => !current)
                  }
                >
                  ايطار
                </button>
              </div>
              <p className={styles.changePhotoHint}>اضغط لتغيير الصورة</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />

            {msg && <p className={styles.modalMsg}>{msg}</p>}

            {/* Fields */}
            <div className={styles.fieldList}>
              <label className={styles.fieldWrap}>
                <span className={styles.fieldLabel}>الاسم</span>
                <input
                  className={styles.fieldInput}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={60}
                  placeholder="اسمك الكامل"
                />
              </label>
              <label className={styles.fieldWrap}>
                <span className={styles.fieldLabel}>السيرة الذاتية</span>
                <textarea
                  className={styles.fieldInput}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  maxLength={160}
                  placeholder="اكتب شيئاً عن نفسك..."
                />
              </label>
              <label className={styles.fieldWrap}>
                <span className={styles.fieldLabel}>الجوال</span>
                <input
                  className={styles.fieldInput}
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  type="tel"
                  maxLength={20}
                  placeholder="+966 5x xxx xxxx"
                />
              </label>
              <label className={styles.fieldWrap}>
                <span className={styles.fieldLabel}>الموقع</span>
                <input
                  className={styles.fieldInput}
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  maxLength={60}
                  placeholder="المدينة، الدولة"
                />
              </label>
              <label className={`${styles.fieldWrap} ${styles.fieldReadonly}`}>
                <span className={styles.fieldLabel}>الإيميل</span>
                <input
                  className={styles.fieldInput}
                  value={rawEmail}
                  readOnly
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function resizeImage(
  file: File,
  maxSize: number,
  quality: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width,
          h = img.height;
        if (w > h) {
          if (w > maxSize) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          }
        } else {
          if (h > maxSize) {
            w = Math.round((w * maxSize) / h);
            h = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = ev.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
