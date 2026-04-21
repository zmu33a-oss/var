import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  Plus,
  UserPlus,
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
  created_at?: string;
  avatar_url?: string | null;
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
  user_id?: string;
  text?: string;
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
  onClose,
}: {
  initialGroupId?: string;
  initialComposer?: "dm" | "group" | null;
  onClose?: () => void;
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
  const [groupSearch, setGroupSearch] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const chatRootRef = useRef<HTMLDivElement | null>(null);

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

  const mergeGroups = (items: Group[]) => {
    const unique = new Map<string, Group>();
    items.forEach((group) => {
      if (group?.id) {
        unique.set(group.id, group);
      }
    });

    return Array.from(unique.values()).sort(
      (left, right) =>
        new Date(right.created_at ?? 0).getTime() -
        new Date(left.created_at ?? 0).getTime(),
    );
  };

  const normalizeMessage = (row: any): Message => ({
    id: row.id,
    group_id: row.group_id,
    sender_id: row.sender_id ?? row.user_id,
    content: row.content ?? row.text ?? "",
    created_at: row.created_at,
    sender_name: row.sender_name,
    user_id: row.user_id,
    text: row.text,
  });

  const fetchGroups = async () => {
    setLoadingGroups(true);
    setError("");

    let memberIds: string[] = [];
    let memberErr: { message?: string } | null = null;
    let ownedData: Group[] | null = null;
    let ownedErr: { message?: string } | null = null;

    const memberships = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", me!.id);

    if (memberships.error) {
      memberErr = memberships.error;
    } else {
      memberIds = (memberships.data ?? [])
        .map((row) => row.group_id)
        .filter(Boolean);
    }

    const ownedGroups = await supabase
      .from("groups")
      .select("id, name, is_private")
      .eq("created_by", me!.id);

    ownedData = ownedGroups.data as Group[] | null;
    ownedErr = ownedGroups.error;

    let memberGroups: Group[] = [];
    if (memberIds.length > 0) {
      const memberGroupsRes = await supabase
        .from("groups")
        .select("id, name, is_private")
        .in("id", memberIds);

      if (memberGroupsRes.error) {
        memberErr = memberGroupsRes.error;
      } else {
        memberGroups = (memberGroupsRes.data ?? []) as Group[];
      }
    }

    if (memberErr && ownedErr) {
      setError("تعذر جلب المجموعات");
      setLoadingGroups(false);
      return;
    }

    const list = mergeGroups([
      ...memberGroups,
      ...((ownedData ?? []) as Group[]),
    ]);

    setGroups(list);
    setLoadingGroups(false);

    if (initialGroupId) {
      const target = list.find((group) => group.id === initialGroupId);
      if (target) setActiveGroup(target);
    }
  };

  const fetchMessages = async (groupId: string) => {
    setLoadingMsgs(true);

    let data: any[] | null = null;
    let err: { message?: string } | null = null;

    const primary = await supabase
      .from("messages")
      .select("id, group_id, user_id, text, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(200);

    data = primary.data;
    err = primary.error;

    if (err) {
      const fallback = await supabase
        .from("messages")
        .select("id, group_id, sender_id, content, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(200);

      data = fallback.data;
      err = fallback.error;
    }

    if (err) {
      setError("تعذر جلب الرسائل");
      setLoadingMsgs(false);
      return;
    }

    setMessages((data ?? []).map(normalizeMessage));
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
          const newMsg = normalizeMessage(payload.new);
          setMessages((prev) => {
            if (prev.find((message) => message.id === newMsg.id)) return prev;
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !activeGroup || !me) return;

    const content = msgText.trim();
    setMsgText("");
    setError("");

    let err: { message?: string } | null = null;
    let savedRow: any = null;

    const primary = await supabase
      .from("messages")
      .insert({
        group_id: activeGroup.id,
        user_id: me.id,
        text: content,
      })
      .select("id, group_id, user_id, text, created_at")
      .single();

    err = primary.error;
    savedRow = primary.data;

    if (err) {
      const fallback = await supabase
        .from("messages")
        .insert({
          group_id: activeGroup.id,
          sender_id: me.id,
          content,
        })
        .select("id, group_id, sender_id, content, created_at")
        .single();

      err = fallback.error;
      savedRow = fallback.data;
    }

    if (err) {
      setError("تعذر إرسال الرسالة");
      setMsgText(content);
      return;
    }

    if (savedRow) {
      const sentMessage = normalizeMessage(savedRow);
      setMessages((prev) => {
        if (prev.find((message) => message.id === sentMessage.id)) return prev;
        return [...prev, sentMessage];
      });
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        60,
      );
    } else {
      fetchMessages(activeGroup.id);
    }
  };

  useEffect(() => {
    if (!activeGroup) return;
    fetchMessages(activeGroup.id);
    subscribeRealtime(activeGroup.id);

    return () => {
      realtimeRef.current?.unsubscribe();
    };
  }, [activeGroup?.id]);

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

    const createdGroup: Group = {
      ...grp,
      avatar_url: groupImage ?? grp.avatar_url ?? null,
    };

    const { error: memberErr } = await supabase
      .from("group_members")
      .insert({ group_id: createdGroup.id, user_id: me.id });

    if (memberErr) {
      setError(
        memberErr.message || "تم إنشاء القروب لكن تعذر ربطه بعضويتك تلقائيًا",
      );
    }

    setCreating(false);
    setSuccessMsg(`✅ تم إنشاء قروب "${createdGroup.name}" بنجاح!`);
    setNewGroupName("");
    setGroupImage(null);
    setGroups((prev) => mergeGroups([createdGroup, ...prev]));
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

  const closeChat = () => {
    setShowNewDM(false);
    setShowNewGroup(false);
    onClose?.();
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
      .select("id, name, is_private")
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

  const filteredGroups = groups.filter((group) =>
    friendlyName(group)
      .toLowerCase()
      .includes(groupSearch.trim().toLowerCase()),
  );

  const showInlineEmptyState =
    !activeGroup &&
    !showNewGroup &&
    !showNewDM &&
    !loadingGroups &&
    filteredGroups.length === 0;

  useEffect(() => {
    const root = chatRootRef.current;
    if (!root) return;

    const body = document.body;
    const html = document.documentElement;
    const scrollY = window.scrollY;

    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyLeft = body.style.left;
    const prevBodyRight = body.style.right;
    const prevBodyWidth = body.style.width;
    const prevHtmlOverflow = html.style.overflow;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    html.style.overflow = "hidden";

    const viewport = window.visualViewport;
    const baseHeight = viewport?.height ?? window.innerHeight;

    const updateKeyboardOffset = () => {
      const visibleHeight = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const keyboardOffset = Math.max(
        0,
        baseHeight - (visibleHeight + offsetTop),
      );

      root.style.setProperty("--keyboard-offset", `${keyboardOffset}px`);
    };

    updateKeyboardOffset();

    viewport?.addEventListener("resize", updateKeyboardOffset);
    viewport?.addEventListener("scroll", updateKeyboardOffset);

    return () => {
      viewport?.removeEventListener("resize", updateKeyboardOffset);
      viewport?.removeEventListener("scroll", updateKeyboardOffset);
      root.style.setProperty("--keyboard-offset", "0px");

      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.left = prevBodyLeft;
      body.style.right = prevBodyRight;
      body.style.width = prevBodyWidth;
      html.style.overflow = prevHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const renderGroupAvatar = (group: Group) => {
    if (group.avatar_url) {
      return (
        <img
          src={group.avatar_url}
          alt={friendlyName(group)}
          className={styles.groupAvatarImg}
        />
      );
    }

    return group.is_private ? "👤" : <Users size={16} />;
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
    <div className={styles.chatOverlay} dir="rtl">
      <div ref={chatRootRef} className={styles.chatRoot}>
        {!activeGroup && (
          <button className={styles.closeChatBtn} onClick={closeChat}>
            <X size={18} />
          </button>
        )}

        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>
          <header className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>الدردشة</h2>
          </header>

          <div className={styles.searchRow}>
            <input
              className={styles.searchInput}
              placeholder="بحث"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
            />
          </div>

          {error && <p className={styles.errBanner}>{error}</p>}

          {loadingGroups ? (
            <p className={styles.loadingText}>جاري التحميل...</p>
          ) : filteredGroups.length === 0 ? (
            <div className={styles.sidebarEmptyState}>
              <button
                type="button"
                className={styles.createGroupBtn}
                onClick={() => setShowNewGroup(true)}
              >
                <Plus size={18} />
                <span>إنشاء قروب</span>
              </button>
              <p className={styles.emptyText}>
                اختر قروبًا من القائمة أو أنشئ قروبًا جديدًا
              </p>
            </div>
          ) : (
            <ul className={styles.groupList}>
              {filteredGroups.map((g) => (
                <li
                  key={g.id}
                  className={`${styles.groupItem} ${activeGroup?.id === g.id ? styles.groupItemActive : ""}`}
                  onClick={() => setActiveGroup(g)}
                >
                  <div className={styles.groupAvatar}>
                    {renderGroupAvatar(g)}
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

          {!showInlineEmptyState && (
            <div className={styles.sidebarFooter}>Xtik</div>
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
              <div className={styles.chatIdentity}>
                <div className={styles.chatGroupAvatar}>
                  {renderGroupAvatar(activeGroup)}
                </div>
                <span className={styles.chatTitle}>
                  {friendlyName(activeGroup)}
                </span>
              </div>
              <div className={styles.chatHeaderActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="إضافة عضو"
                >
                  <UserPlus size={18} />
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="إغلاق الدردشة"
                  onClick={closeChat}
                >
                  <X size={18} />
                </button>
              </div>
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
              <div className={styles.msgComposer}>
                <button type="button" className={styles.attachBtn}>
                  <Plus size={18} />
                </button>
                <input
                  className={styles.msgInput}
                  placeholder="اكتب رسالة..."
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className={styles.shootBtn}
                disabled={!msgText.trim()}
              >
                <Camera size={17} />
                <span>شوت</span>
              </button>
            </form>
          </section>
        )}
      </div>

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
                <div className={styles.modalHeaderCentered}>
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
                  <span>انشاء قروب جديد</span>
                  <span className={styles.modalGhostBtn} />
                </div>

                <div className={styles.groupCreatorLayout}>
                  <div className={styles.groupCreatorMain}>
                    <input
                      className={styles.modalInput}
                      placeholder="اسم القروب"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && createGroup()}
                      autoFocus
                    />
                  </div>

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
                        <Plus size={34} className={styles.groupImgIcon} />
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
                </div>

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
