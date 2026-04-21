import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  MessageCirclePlus,
  Plus,
  Send,
  Users,
  X,
} from "lucide-react";
import { supabase } from "./supabase";
import styles from "../pages-css/ChatPage.module.css";

// ────────────────────────────── Types ──────────────────────────────
type Group = {
  id: string;
  name: string;
  is_private: boolean;
  created_at: string;
  last_message?: string;
  last_message_at?: string;
  unread?: number;
};

type Message = {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
};

type AppUser = {
  id: string;
  email?: string;
  full_name?: string;
};

// ────────────────────────────── Main Component ──────────────────────────────
export default function ChatPage({
  initialGroupId,
  initialComposer,
}: {
  initialGroupId?: string;
  initialComposer?: "dm" | "group" | null;
}) {
  const [me, setMe] = useState<AppUser | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState("");

  // modals
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [dmTarget, setDmTarget] = useState("");
  const [creating, setCreating] = useState(false);

  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  // ── fetch current user ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setMe({ id: data.user.id, email: data.user.email });
      }
    });
  }, []);

  // ── fetch user's groups ──
  useEffect(() => {
    if (!me) return;
    fetchGroups();
  }, [me]);

  useEffect(() => {
    if (!me || !initialComposer) return;

    if (initialComposer === "dm") {
      setShowNewGroup(false);
      setShowNewDM(true);
      return;
    }

    if (initialComposer === "group") {
      setShowNewDM(false);
      setShowNewGroup(true);
    }
  }, [me, initialComposer]);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    setError("");

    const { data, error: err } = await supabase
      .from("group_members")
      .select(
        `
        group_id,
        groups (
          id,
          name,
          is_private,
          created_at
        )
      `,
      )
      .eq("user_id", me!.id);

    if (err) {
      setError("تعذر جلب المجموعات");
      setLoadingGroups(false);
      return;
    }

    const list: Group[] = (data ?? [])
      .map((row: any) => row.groups)
      .filter(Boolean);

    setGroups(list);
    setLoadingGroups(false);

    // open initialGroup if provided
    if (initialGroupId) {
      const target = list.find((g) => g.id === initialGroupId);
      if (target) setActiveGroup(target);
    }
  };

  // ── fetch messages for active group ──
  useEffect(() => {
    if (!activeGroup) return;
    fetchMessages(activeGroup.id);
    subscribeRealtime(activeGroup.id);

    return () => {
      realtimeRef.current?.unsubscribe();
    };
  }, [activeGroup?.id]);

  const fetchMessages = async (groupId: string) => {
    setLoadingMsgs(true);
    const { data, error: err } = await supabase
      .from("messages")
      .select("id, group_id, sender_id, content, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (err) {
      setError("تعذر جلب الرسائل");
      setLoadingMsgs(false);
      return;
    }

    setMessages(data ?? []);
    setLoadingMsgs(false);
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      80,
    );
  };

  const subscribeRealtime = (groupId: string) => {
    realtimeRef.current?.unsubscribe();

    realtimeRef.current = supabase
      .channel(`chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(
            () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
            60,
          );
        },
      )
      .subscribe();
  };

  // ── send message ──
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !activeGroup || !me) return;

    const content = msgText.trim();
    setMsgText("");

    const { error: err } = await supabase.from("messages").insert({
      group_id: activeGroup.id,
      sender_id: me.id,
      content,
    });

    if (err) setError("تعذر إرسال الرسالة");
  };

  // ── create group ──
  const createGroup = async () => {
    if (!newGroupName.trim() || !me) return;
    setError("");
    setSuccessMsg("");
    setCreating(true);

    const baseGroupData: Record<string, unknown> = {
      name: newGroupName.trim(),
      is_private: false,
      created_by: me.id,
    };

    let grp: Group | null = null;
    let grpErr: { message?: string } | null = null;

    if (groupImage) {
      const withImage = await supabase
        .from("groups")
        .insert({ ...baseGroupData, avatar_url: groupImage })
        .select()
        .single();

      grp = withImage.data;
      grpErr = withImage.error;
    }

    if (!grp) {
      const fallbackInsert = await supabase
        .from("groups")
        .insert(baseGroupData)
        .select()
        .single();

      grp = fallbackInsert.data;
      grpErr = fallbackInsert.error;
    }

    if (grpErr || !grp) {
      setError(grpErr?.message || "تعذر إنشاء المجموعة");
      setCreating(false);
      return;
    }

    const createdGroup = grp;

    const { error: memberErr } = await supabase
      .from("group_members")
      .insert({ group_id: createdGroup.id, user_id: me.id });

    if (memberErr) {
      setError(memberErr.message || "تم إنشاء القروب لكن تعذر إضافتك إليه");
      setCreating(false);
      return;
    }

    setCreating(false);
    setSuccessMsg(`✅ تم إنشاء قروب "${createdGroup.name}" بنجاح!`);
    setNewGroupName("");
    setGroupImage(null);
    await fetchGroups();

    setTimeout(() => {
      setShowNewGroup(false);
      setSuccessMsg("");
      setActiveGroup(createdGroup);
    }, 1600);
  };

  const handleGroupImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageForGroup(file, 300, 0.85);
      setGroupImage(dataUrl);
    } catch {
      /* ignore */
    }
    e.target.value = "";
  };

  // ── create DM (private group of 2) ──
  const createDM = async () => {
    if (!dmTarget.trim() || !me) return;
    setCreating(true);

    // find target user by email
    const { data: targetUser, error: findErr } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("email", dmTarget.trim())
      .single();

    if (findErr || !targetUser) {
      setError("لم يتم العثور على هذا المستخدم");
      setCreating(false);
      return;
    }

    const dmName = `DM:${me.id}:${targetUser.id}`;

    // check if DM already exists
    const { data: existing } = await supabase
      .from("groups")
      .select("id, name, is_private, created_at")
      .eq("name", dmName)
      .single();

    if (existing) {
      setActiveGroup(existing);
      setShowNewDM(false);
      setDmTarget("");
      setCreating(false);
      return;
    }

    const { data: grp, error: grpErr } = await supabase
      .from("groups")
      .insert({ name: dmName, is_private: true, created_by: me.id })
      .select()
      .single();

    if (grpErr) {
      setError("تعذر إنشاء الدردشة");
      setCreating(false);
      return;
    }

    await supabase.from("group_members").insert([
      { group_id: grp.id, user_id: me.id },
      { group_id: grp.id, user_id: targetUser.id },
    ]);

    setCreating(false);
    setShowNewDM(false);
    setDmTarget("");
    await fetchGroups();
    setActiveGroup({
      ...grp,
      name: targetUser.full_name || targetUser.email || dmName,
    });
  };

  const friendlyName = (g: Group) => {
    if (!g.is_private) return g.name;
    const parts = g.name.split(":");
    return parts.length >= 3 ? `دردشة خاصة` : g.name;
  };

  // ────────────────────────────── Render ──────────────────────────────
  if (!me) {
    return (
      <div className={styles.centered}>
        <p>يرجى تسجيل الدخول للوصول إلى الدردشة</p>
      </div>
    );
  }

  return (
    <div className={styles.chatRoot} dir="rtl">
      {/* ── Sidebar ── */}
      <aside
        className={`${styles.sidebar} ${activeGroup ? styles.sidebarHidden : ""}`}
      >
        <header className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>الدردشة</h2>
          <div className={styles.sidebarActions}>
            <button
              className={styles.iconBtn}
              title="دردشة جديدة"
              onClick={() => setShowNewDM(true)}
            >
              <MessageCirclePlus size={20} />
            </button>
            {/* Dropdown: إنشاء قروب / القروبات */}
            <div className={styles.dropWrap}>
              <button
                className={styles.dropTrigger}
                onClick={() => setShowDropdown((p) => !p)}
              >
                <Users size={16} />
                <span>القروبات</span>
                <ChevronDown size={13} />
              </button>
              {showDropdown && (
                <>
                  <div
                    className={styles.dropOverlay}
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className={styles.dropMenu}>
                    <button
                      className={styles.dropItem}
                      onClick={() => {
                        setShowDropdown(false);
                        setActiveGroup(null);
                        setShowNewGroup(true);
                      }}
                    >
                      <Plus size={15} /> إنشاء قروب
                    </button>
                    <button
                      className={styles.dropItem}
                      onClick={() => {
                        setShowDropdown(false);
                        setActiveGroup(null);
                      }}
                    >
                      <Users size={15} /> القروبات
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {error && <p className={styles.errBanner}>{error}</p>}

        {loadingGroups ? (
          <p className={styles.loadingText}>جاري التحميل...</p>
        ) : groups.length === 0 ? (
          <p className={styles.emptyText}>لا توجد محادثات بعد</p>
        ) : (
          <ul className={styles.groupList}>
            {groups.map((g) => (
              <li
                key={g.id}
                className={`${styles.groupItem} ${activeGroup?.id === g.id ? styles.groupItemActive : ""}`}
                onClick={() => setActiveGroup(g)}
              >
                <div className={styles.groupAvatar}>
                  {g.is_private ? "👤" : <Users size={16} />}
                </div>
                <div className={styles.groupInfo}>
                  <span className={styles.groupName}>{friendlyName(g)}</span>
                  {g.last_message && (
                    <span className={styles.groupLastMsg}>
                      {g.last_message}
                    </span>
                  )}
                </div>
                {(g.unread ?? 0) > 0 && (
                  <span className={styles.unreadBadge}>{g.unread}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ── Chat Window ── */}
      {activeGroup && (
        <section className={styles.chatWindow}>
          <header className={styles.chatHeader}>
            <button
              className={styles.backBtn}
              onClick={() => setActiveGroup(null)}
            >
              <ArrowRight size={20} />
            </button>
            <span className={styles.chatTitle}>
              {friendlyName(activeGroup)}
            </span>
          </header>

          <div className={styles.messages}>
            {loadingMsgs ? (
              <p className={styles.loadingText}>جاري تحميل الرسائل...</p>
            ) : messages.length === 0 ? (
              <p className={styles.emptyText}>لا توجد رسائل بعد، كن الأول!</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.msgBubble} ${msg.sender_id === me.id ? styles.msgMine : styles.msgOther}`}
                >
                  {msg.sender_id !== me.id && (
                    <span className={styles.msgSender}>
                      {msg.sender_name ?? msg.sender_id.slice(0, 6)}
                    </span>
                  )}
                  <p className={styles.msgContent}>{msg.content}</p>
                  <span className={styles.msgTime}>
                    {new Date(msg.created_at).toLocaleTimeString("ar", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {msg.sender_id === me.id && (
                    <Check size={12} className={styles.msgCheck} />
                  )}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form className={styles.inputRow} onSubmit={sendMessage}>
            <input
              className={styles.msgInput}
              placeholder="اكتب رسالة..."
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={!msgText.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      )}

      {/* ── New Group Modal ── */}
      {showNewGroup && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            if (!successMsg) {
              setShowNewGroup(false);
              setGroupImage(null);
              setNewGroupName("");
            }
          }}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {successMsg ? (
              <div className={styles.successWrap}>
                <span className={styles.successIcon}>✅</span>
                <p className={styles.successText}>{successMsg}</p>
              </div>
            ) : (
              <>
                <div className={styles.modalHeader}>
                  <span>إنشاء قروب جديد</span>
                  <button
                    className={styles.iconBtn}
                    onClick={() => {
                      setShowNewGroup(false);
                      setGroupImage(null);
                      setNewGroupName("");
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Group image picker */}
                <div className={styles.groupImgWrap}>
                  <button
                    type="button"
                    className={styles.groupImgBtn}
                    onClick={() => imageRef.current?.click()}
                  >
                    {groupImage ? (
                      <img
                        src={groupImage}
                        alt="group"
                        className={styles.groupImgPreview}
                      />
                    ) : (
                      <Camera size={28} className={styles.groupImgIcon} />
                    )}
                  </button>
                  <span className={styles.groupImgLabel}>اضافة صورة</span>
                  <input
                    ref={imageRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleGroupImageChange}
                  />
                </div>

                <input
                  className={styles.modalInput}
                  placeholder="اسم القروب"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createGroup()}
                  autoFocus
                />
                <button
                  className={styles.modalBtn}
                  onClick={createGroup}
                  disabled={creating || !newGroupName.trim()}
                >
                  {creating ? "جاري الإنشاء..." : "إنشاء"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── New DM Modal ── */}
      {showNewDM && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowNewDM(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>رسالة خاصة جديدة</span>
              <button
                className={styles.iconBtn}
                onClick={() => setShowNewDM(false)}
              >
                <X size={18} />
              </button>
            </div>
            <input
              className={styles.modalInput}
              placeholder="إيميل المستخدم"
              type="email"
              value={dmTarget}
              onChange={(e) => setDmTarget(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createDM()}
              autoFocus
            />
            <button
              className={styles.modalBtn}
              onClick={createDM}
              disabled={creating || !dmTarget.trim()}
            >
              {creating ? "جاري البحث..." : "ابدأ الدردشة"}
            </button>
            {error && <p className={styles.errBanner}>{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function resizeImageForGroup(
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
