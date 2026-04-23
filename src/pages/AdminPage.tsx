import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronRight,
  Film,
  Flag,
  LoaderCircle,
  MessageSquareText,
  RefreshCcw,
  ScrollText,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import styles from "../pages-css/AdminPage.module.css";
import type { AdminRole } from "../lib/admin";
import {
  ADMIN_STORE_EVENT,
  appendAdminAuditLog,
  loadAdminAuditLogs,
  loadAdminReports,
  type AdminAuditLog,
  type AdminReport,
  type AdminReportStatus,
  updateAdminReportStatus,
} from "../lib/adminStore";
import {
  deleteAdminGroup as deleteAdminGroupApi,
  deleteAdminVideo as deleteAdminVideoApi,
  fetchAdminDashboard,
  shouldFallbackAdminApi,
  type AdminGroupRow,
  type VerificationBadgeVariant,
  type AdminUserRow,
  type AdminVideoRow,
  type VerifiedUserRecord,
  updateAdminUserVerification,
} from "../lib/adminApi";
import VerificationBadge from "../components/VerificationBadge";
import { loadVerifiedUsers, syncVerifiedUsersCache } from "../lib/verification";
import {
  getVerificationBadgeAccentLabel,
  getVerificationBadgeButtonLabel,
  getVerificationBadgeStatusLabel,
  VERIFICATION_BADGE_OPTIONS,
} from "../lib/verificationBadges";
import { supabase } from "./supabase";
import type { XPost } from "../lib/xPosts";

type AdminSection =
  | "overview"
  | "users"
  | "groups"
  | "x-content"
  | "videos"
  | "reports"
  | "audit";

type AdminPageProps = {
  role: AdminRole;
  onClose: () => void;
  posts: XPost[];
  onDeletePost: (postId: number) => void;
  actorLabel: string;
};

const adminSections: Array<{
  id: AdminSection;
  label: string;
  hint: string;
  icon: typeof Shield;
}> = [
  {
    id: "overview",
    label: "اللوحة الرئيسية",
    hint: "ملخص فوري لحالة المنصة",
    icon: Shield,
  },
  {
    id: "users",
    label: "إدارة المستخدمين",
    hint: "بحث الحسابات ومنح الشارة الصفراء أو الزرقاء",
    icon: Users,
  },
  {
    id: "groups",
    label: "إدارة القروبات",
    hint: "أعضاء وملكية وحذف القروبات",
    icon: MessageSquareText,
  },
  {
    id: "x-content",
    label: "محتوى X",
    hint: "مراجعة التغريدات والتفاعلات",
    icon: MessageSquareText,
  },
  {
    id: "videos",
    label: "فيديوهات TikTok",
    hint: "تنظيم الفيديوهات ورفع المشاكل",
    icon: Film,
  },
  {
    id: "reports",
    label: "البلاغات",
    hint: "فرز البلاغات واتخاذ الإجراء",
    icon: Flag,
  },
  {
    id: "audit",
    label: "سجل العمليات",
    hint: "كل قرارات الأدمن في مكان واحد",
    icon: ScrollText,
  },
];

const sectionDescriptions: Record<AdminSection, string> = {
  overview:
    "تعرض هذه اللوحة إحصاءات حية لحالة المنصة مع أحدث البلاغات وآخر عمليات الإدارة.",
  users:
    "يعرض هذا القسم حسابات المستخدمين الحالية مع البحث السريع وأزرار منح الشارة الصفراء أو الزرقاء أو سحب التوثيق.",
  groups:
    "يعرض هذا القسم القروبات الحالية وعدد الأعضاء مع أدوات الحذف المباشر عند الحاجة.",
  "x-content":
    "يجمع هذا القسم منشورات X الحالية مع عداد البلاغات وأداة حذف المنشور من إدارة المنصة.",
  videos:
    "يعرض هذا القسم فيديوهات TikTok الحالية مع إمكانية حذف الفيديو من الجدول ومحاولة إزالة الملف من التخزين.",
  reports:
    "يجمع هذا القسم البلاغات الواردة من الواجهة مع تحديث الحالة ومتابعة المعالجة خطوة بخطوة.",
  audit:
    "يسجل هذا القسم كل الإجراءات الإدارية المنفذة حاليًا مثل تحديث حالة البلاغات أو حذف المحتوى.",
};

const reportStatusLabels: Record<AdminReportStatus, string> = {
  new: "جديد",
  reviewing: "قيد المراجعة",
  resolved: "تم الإجراء",
  dismissed: "مرفوض",
};

const reportStatusOrder: AdminReportStatus[] = [
  "new",
  "reviewing",
  "resolved",
  "dismissed",
];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ar", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getVideoStoragePath(videoUrl: string) {
  try {
    const parsedUrl = new URL(videoUrl);
    const marker = "/storage/v1/object/public/videos/";
    const markerIndex = parsedUrl.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(
      parsedUrl.pathname.slice(markerIndex + marker.length),
    );
  } catch {
    return null;
  }
}

function mergeUsersWithVerification(
  rows: Array<Pick<AdminUserRow, "id" | "email" | "full_name">>,
  verifiedUsers: VerifiedUserRecord[],
): AdminUserRow[] {
  const verificationByUserId = new Map(
    verifiedUsers.map((entry) => [entry.userId, entry.badge]),
  );

  return rows.map((user) => ({
    ...user,
    verified: verificationByUserId.has(user.id),
    verificationBadge: verificationByUserId.get(user.id) ?? null,
  }));
}

export default function AdminPage({
  role,
  onClose,
  posts,
  onDeletePost,
  actorLabel,
}: AdminPageProps) {
  const safePosts = Array.isArray(posts) ? posts : [];
  const safeActorLabel = actorLabel || "admin";
  const shouldUseLocalAdminFallback = (error: unknown) => {
    return import.meta.env.DEV || shouldFallbackAdminApi(error);
  };

  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [groups, setGroups] = useState<AdminGroupRow[]>([]);
  const [videos, setVideos] = useState<AdminVideoRow[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusyKey, setActionBusyKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const refreshAdminActivity = async () => {
    const [nextReports, nextAuditLogs] = await Promise.all([
      loadAdminReports(),
      loadAdminAuditLogs(),
    ]);

    setReports(nextReports);
    setAuditLogs(nextAuditLogs);
  };

  const loadClientAdminData = async () => {
    setErrorMessage("");

    const [
      usersRes,
      groupsRes,
      membersRes,
      videosRes,
      nextReports,
      nextAuditLogs,
      verifiedUsers,
    ] = await Promise.all([
      supabase.from("users").select("id, email, full_name"),
      supabase.from("groups").select("id, name, is_private, created_by"),
      supabase.from("group_members").select("group_id, user_id"),
      supabase.from("videos").select("id, video_url, caption").order("id", {
        ascending: false,
      }),
      loadAdminReports(),
      loadAdminAuditLogs(),
      loadVerifiedUsers(true),
    ]);

    const firstError =
      usersRes.error ?? groupsRes.error ?? membersRes.error ?? videosRes.error;

    if (firstError) {
      throw new Error(firstError.message || "تعذر تحميل بيانات الأدمن الآن");
    }

    const memberCountMap = new Map<string, number>();
    (membersRes.data ?? []).forEach((member) => {
      const currentCount = memberCountMap.get(member.group_id) ?? 0;
      memberCountMap.set(member.group_id, currentCount + 1);
    });

    return {
      users: mergeUsersWithVerification(
        (usersRes.data ?? []) as Array<{
          id: string;
          email: string | null;
          full_name: string | null;
        }>,
        verifiedUsers,
      ),
      groups: (
        (groupsRes.data ?? []) as Array<{
          id: string;
          name: string;
          is_private: boolean;
          created_by: string | null;
        }>
      ).map((group) => ({
        ...group,
        memberCount: memberCountMap.get(group.id) ?? 0,
      })),
      videos: (videosRes.data ?? []) as AdminVideoRow[],
      reports: nextReports,
      auditLogs: nextAuditLogs,
      verifiedUsers,
    };
  };

  const refreshAdminData = async () => {
    setErrorMessage("");

    try {
      const dashboard = await fetchAdminDashboard();
      syncVerifiedUsersCache(dashboard.verifiedUsers);
      setUsers(dashboard.users);
      setGroups(dashboard.groups);
      setVideos(dashboard.videos);
      setReports(dashboard.reports);
      setAuditLogs(dashboard.auditLogs);
      return;
    } catch (error) {
      if (!shouldUseLocalAdminFallback(error)) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "تعذر تحميل بيانات الأدمن الآن",
        );
        return;
      }
    }

    try {
      const fallbackData = await loadClientAdminData();
      syncVerifiedUsersCache(fallbackData.verifiedUsers);
      setUsers(fallbackData.users);
      setGroups(fallbackData.groups);
      setVideos(fallbackData.videos);
      setReports(fallbackData.reports);
      setAuditLogs(fallbackData.auditLogs);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "تعذر تحميل بيانات الأدمن الآن",
      );
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      setLoading(true);
      await refreshAdminData();
      if (isMounted) {
        setLoading(false);
      }
    };

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleStoreUpdate = () => {
      void refreshAdminActivity().catch((error) => {
        if (!shouldUseLocalAdminFallback(error)) {
          setErrorMessage(
            error instanceof Error ? error.message : "تعذر تحديث نشاط الأدمن",
          );
        }
      });
    };

    window.addEventListener(ADMIN_STORE_EVENT, handleStoreUpdate);
    return () => {
      window.removeEventListener(ADMIN_STORE_EVENT, handleStoreUpdate);
    };
  }, []);

  const reportCountByPostId = useMemo(() => {
    const counts = new Map<string, number>();
    reports.forEach((report) => {
      if (report.targetType !== "x_post") return;
      counts.set(report.targetId, (counts.get(report.targetId) ?? 0) + 1);
    });
    return counts;
  }, [reports]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return users;

    return users.filter((user) =>
      [user.full_name, user.email, user.id]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    );
  }, [searchValue, users]);

  const filteredGroups = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return groups;

    return groups.filter((group) =>
      [group.name, group.created_by]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    );
  }, [groups, searchValue]);

  const filteredVideos = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return videos;

    return videos.filter((video) =>
      [video.caption, video.video_url, String(video.id)]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    );
  }, [searchValue, videos]);

  const filteredPosts = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return safePosts;

    return safePosts.filter((post) =>
      [post.user, post.handle, post.content, String(post.id)]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    );
  }, [safePosts, searchValue]);

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return reports;

    return reports.filter((report) =>
      [report.summary, report.reason, report.targetId, report.reporterLabel]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    );
  }, [reports, searchValue]);

  const filteredAuditLogs = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return auditLogs;

    return auditLogs.filter((log) =>
      [log.action, log.details, log.targetId, log.actor]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    );
  }, [auditLogs, searchValue]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAdminData();
    setRefreshing(false);
  };

  const handleDeleteGroup = async (group: AdminGroupRow) => {
    const confirmed = window.confirm(
      `سيتم حذف القروب "${group.name}" نهائيًا. هل تريد المتابعة؟`,
    );
    if (!confirmed) return;

    setActionBusyKey(`group-${group.id}`);
    setFeedbackMessage("");
    setErrorMessage("");

    try {
      await deleteAdminGroupApi(group.id);
    } catch (error) {
      if (!shouldUseLocalAdminFallback(error)) {
        setActionBusyKey("");
        setErrorMessage(
          error instanceof Error ? error.message : "تعذر حذف القروب",
        );
        return;
      }

      await supabase.from("group_members").delete().eq("group_id", group.id);
      await supabase.from("messages").delete().eq("group_id", group.id);

      const { error: deleteError } = await supabase
        .from("groups")
        .delete()
        .eq("id", group.id);

      if (deleteError) {
        setActionBusyKey("");
        setErrorMessage(deleteError.message || "تعذر حذف القروب");
        return;
      }
    }

    await appendAdminAuditLog({
      action: "delete_group",
      targetType: "group",
      targetId: group.id,
      details: `تم حذف القروب ${group.name}`,
      actor: safeActorLabel,
    });
    setActionBusyKey("");
    await refreshAdminData();
    setFeedbackMessage(`تم حذف القروب ${group.name}`);
  };

  const handleDeleteVideo = async (video: AdminVideoRow) => {
    const confirmed = window.confirm(
      `سيتم حذف الفيديو رقم ${video.id}. هل تريد المتابعة؟`,
    );
    if (!confirmed) return;

    setActionBusyKey(`video-${video.id}`);
    setFeedbackMessage("");
    setErrorMessage("");

    try {
      await deleteAdminVideoApi(video.id);
    } catch (error) {
      if (!shouldUseLocalAdminFallback(error)) {
        setActionBusyKey("");
        setErrorMessage(
          error instanceof Error ? error.message : "تعذر حذف الفيديو",
        );
        return;
      }

      const { error: deleteError } = await supabase
        .from("videos")
        .delete()
        .eq("id", video.id);

      if (deleteError) {
        setActionBusyKey("");
        setErrorMessage(deleteError.message || "تعذر حذف الفيديو");
        return;
      }

      const storagePath = getVideoStoragePath(video.video_url);
      if (storagePath) {
        await supabase.storage
          .from("videos")
          .remove([storagePath])
          .catch(() => {
            return null;
          });
      }
    }

    await appendAdminAuditLog({
      action: "delete_video",
      targetType: "video",
      targetId: String(video.id),
      details: `تم حذف فيديو TikTok رقم ${video.id}`,
      actor: safeActorLabel,
    });
    setActionBusyKey("");
    await refreshAdminData();
    setFeedbackMessage(`تم حذف الفيديو رقم ${video.id}`);
  };

  const handleDeletePost = async (post: XPost) => {
    const confirmed = window.confirm(
      `سيتم حذف منشور ${post.handle}. هل تريد المتابعة؟`,
    );
    if (!confirmed) return;

    onDeletePost(post.id);
    await appendAdminAuditLog({
      action: "delete_x_post",
      targetType: "x_post",
      targetId: String(post.id),
      details: `تم حذف منشور ${post.handle}`,
      actor: safeActorLabel,
    });
    await refreshAdminActivity();
    setFeedbackMessage(`تم حذف منشور ${post.handle}`);
  };

  const handleUpdateReport = (
    report: AdminReport,
    status: AdminReportStatus,
  ) => {
    void (async () => {
      setFeedbackMessage("");
      setErrorMessage("");

      try {
        const nextReports = await updateAdminReportStatus(report.id, status);
        setReports(nextReports);
        await appendAdminAuditLog({
          action: "update_report_status",
          targetType: report.targetType,
          targetId: report.targetId,
          details: `تم تحويل البلاغ إلى حالة ${reportStatusLabels[status]}`,
          actor: safeActorLabel,
        });
        const nextAuditLogs = await loadAdminAuditLogs();
        setAuditLogs(nextAuditLogs);
        setFeedbackMessage(`تم تحديث البلاغ إلى ${reportStatusLabels[status]}`);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "تعذر تحديث البلاغ",
        );
      }
    })();
  };

  const handleSetUserVerification = async (
    user: AdminUserRow,
    badge: VerificationBadgeVariant | null,
  ) => {
    const nextVerifiedState = Boolean(badge);
    const busyKey = `verify-${user.id}-${badge ?? "remove"}`;

    setActionBusyKey(busyKey);
    setFeedbackMessage("");
    setErrorMessage("");

    try {
      const result = await updateAdminUserVerification(
        user.id,
        nextVerifiedState,
        badge ?? undefined,
      );
      const nextVerifiedUsers = syncVerifiedUsersCache(result.verifiedUsers);

      setUsers((currentUsers) =>
        mergeUsersWithVerification(currentUsers, nextVerifiedUsers),
      );
      setAuditLogs(await loadAdminAuditLogs());
      setFeedbackMessage(
        badge
          ? `تم تعيين الشارة ${getVerificationBadgeAccentLabel(badge)} للمستخدم ${user.full_name || user.email || user.id}`
          : `تم سحب التوثيق من ${user.full_name || user.email || user.id}`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "تعذر تحديث حالة التوثيق لهذا المستخدم",
      );
    } finally {
      setActionBusyKey("");
    }
  };

  const overviewCards = [
    { label: "المستخدمون", value: users.length },
    { label: "القروبات", value: groups.length },
    { label: "منشورات X", value: safePosts.length },
    { label: "فيديوهات TikTok", value: videos.length },
    { label: "البلاغات", value: reports.length },
    { label: "سجل العمليات", value: auditLogs.length },
  ];

  const renderOverview = () => (
    <>
      <div className={styles.quickActionCard}>
        <div>
          <strong>التوثيق موجود داخل إدارة المستخدمين</strong>
          <p>
            افتح هذا القسم ثم اختر الشارة الصفراء أو الزرقاء للمستخدم المطلوب أو
            اسحب التوثيق عند الحاجة.
          </p>
        </div>
        <button
          type="button"
          className={styles.quickActionBtn}
          onClick={() => setActiveSection("users")}
        >
          إدارة التوثيق الآن
        </button>
      </div>

      <div className={styles.metricGrid}>
        {overviewCards.map((card) => (
          <article key={card.label} className={styles.metricCard}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <div className={styles.dualGrid}>
        <div className={styles.panelCard}>
          <h3>أحدث البلاغات</h3>
          {reports.slice(0, 4).map((report) => (
            <div key={report.id} className={styles.simpleRow}>
              <div>
                <strong>{report.summary || report.targetId}</strong>
                <small>{reportStatusLabels[report.status]}</small>
              </div>
              <span>{formatDateTime(report.createdAt)}</span>
            </div>
          ))}
          {!reports.length && (
            <p className={styles.emptyState}>لا توجد بلاغات بعد.</p>
          )}
        </div>

        <div className={styles.panelCard}>
          <h3>آخر عمليات الأدمن</h3>
          {auditLogs.slice(0, 4).map((log) => (
            <div key={log.id} className={styles.simpleRow}>
              <div>
                <strong>{log.action}</strong>
                <small>{log.details}</small>
              </div>
              <span>{formatDateTime(log.createdAt)}</span>
            </div>
          ))}
          {!auditLogs.length && (
            <p className={styles.emptyState}>لا يوجد سجل عمليات حتى الآن.</p>
          )}
        </div>
      </div>
    </>
  );

  const renderUsers = () => (
    <div className={styles.listCard}>
      <div className={styles.callout}>
        منح الشارة الصفراء أو الزرقاء يتم من الخادم الإداري فقط. أي مستخدم عادي
        لا يمكنه منحها لنفسه من الواجهة أو من التخزين المحلي.
      </div>
      {filteredUsers.map((user) => (
        <div key={user.id} className={styles.rowCard}>
          <div className={styles.userRowMain}>
            <div>
              <div className={styles.userNameRow}>
                <strong>{user.full_name || "بدون اسم"}</strong>
                {user.verified && user.verificationBadge && (
                  <VerificationBadge
                    size="sm"
                    variant={user.verificationBadge}
                  />
                )}
              </div>
              <small>{user.email || user.id}</small>
            </div>
            <div className={styles.userMetaRow}>
              <span
                className={`${styles.verifiedChip} ${
                  user.verified
                    ? user.verificationBadge === "blue"
                      ? styles.verifiedChipBlue
                      : styles.verifiedChipYellow
                    : styles.verifiedChipInactive
                }`}
              >
                {user.verified && user.verificationBadge
                  ? getVerificationBadgeStatusLabel(user.verificationBadge)
                  : "غير موثق"}
              </span>
              <span className={styles.idPill}>{user.id.slice(0, 8)}</span>
            </div>
          </div>
          <div className={styles.verifyActions}>
            {VERIFICATION_BADGE_OPTIONS.map((badge) => {
              const isCurrentBadge = user.verificationBadge === badge;
              const isUserBusy = actionBusyKey.startsWith(`verify-${user.id}-`);
              const isCurrentActionBusy =
                actionBusyKey === `verify-${user.id}-${badge}`;

              return (
                <button
                  key={badge}
                  type="button"
                  className={`${styles.verifyBtn} ${
                    badge === "blue"
                      ? styles.verifyBtnBlue
                      : styles.verifyBtnYellow
                  } ${isCurrentBadge ? styles.verifyBtnSelected : ""}`}
                  disabled={isUserBusy}
                  onClick={() => {
                    void handleSetUserVerification(user, badge);
                  }}
                >
                  {isCurrentActionBusy
                    ? "..."
                    : getVerificationBadgeButtonLabel(badge)}
                </button>
              );
            })}

            {user.verified && (
              <button
                type="button"
                className={`${styles.verifyBtn} ${styles.verifyBtnRemove}`}
                disabled={actionBusyKey.startsWith(`verify-${user.id}-`)}
                onClick={() => {
                  void handleSetUserVerification(user, null);
                }}
              >
                {actionBusyKey === `verify-${user.id}-remove`
                  ? "..."
                  : "سحب التوثيق"}
              </button>
            )}
          </div>
        </div>
      ))}
      {!filteredUsers.length && (
        <p className={styles.emptyState}>لا يوجد مستخدمون مطابقون.</p>
      )}
    </div>
  );

  const renderGroups = () => (
    <div className={styles.listCard}>
      {filteredGroups.map((group) => (
        <div key={group.id} className={styles.rowCard}>
          <div>
            <strong>{group.name}</strong>
            <small>
              {group.is_private ? "قروب خاص" : "قروب عام"} · {group.memberCount}{" "}
              عضو
            </small>
          </div>
          <button
            type="button"
            className={styles.deleteBtn}
            disabled={actionBusyKey === `group-${group.id}`}
            onClick={() => handleDeleteGroup(group)}
          >
            <Trash2 size={14} /> حذف
          </button>
        </div>
      ))}
      {!filteredGroups.length && (
        <p className={styles.emptyState}>لا توجد قروبات مطابقة.</p>
      )}
    </div>
  );

  const renderPosts = () => (
    <div className={styles.listCard}>
      {filteredPosts.map((post) => (
        <div key={post.id} className={styles.postCard}>
          <div className={styles.postHeader}>
            <div>
              <strong>{post.user}</strong>
              <small>{post.handle}</small>
            </div>
            <span className={styles.idPill}>#{post.id}</span>
          </div>
          <p>{post.content}</p>
          <div className={styles.postFooter}>
            <span>بلاغات: {reportCountByPostId.get(String(post.id)) ?? 0}</span>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => void handleDeletePost(post)}
            >
              <Trash2 size={14} /> حذف المنشور
            </button>
          </div>
        </div>
      ))}
      {!filteredPosts.length && (
        <p className={styles.emptyState}>لا توجد منشورات مطابقة.</p>
      )}
    </div>
  );

  const renderVideos = () => (
    <div className={styles.listCard}>
      {filteredVideos.map((video) => (
        <div key={video.id} className={styles.rowCard}>
          <div>
            <strong>فيديو #{video.id}</strong>
            <small>{video.caption || video.video_url}</small>
          </div>
          <button
            type="button"
            className={styles.deleteBtn}
            disabled={actionBusyKey === `video-${video.id}`}
            onClick={() => handleDeleteVideo(video)}
          >
            <Trash2 size={14} /> حذف
          </button>
        </div>
      ))}
      {!filteredVideos.length && (
        <p className={styles.emptyState}>لا توجد فيديوهات مطابقة.</p>
      )}
    </div>
  );

  const renderReports = () => (
    <div className={styles.listCard}>
      {filteredReports.map((report) => (
        <div key={report.id} className={styles.reportCard}>
          <div className={styles.reportHeader}>
            <div>
              <strong>{report.summary || report.targetId}</strong>
              <small>
                {report.targetType} · {report.reporterLabel || "مستخدم"}
              </small>
            </div>
            <span
              className={`${styles.statusBadge} ${styles[`status-${report.status}`]}`}
            >
              {reportStatusLabels[report.status]}
            </span>
          </div>
          <p>{report.reason}</p>
          <div className={styles.statusActions}>
            {reportStatusOrder.map((status) => (
              <button
                key={status}
                type="button"
                className={`${styles.statusBtn} ${report.status === status ? styles.statusBtnActive : ""}`}
                onClick={() => handleUpdateReport(report, status)}
              >
                {reportStatusLabels[status]}
              </button>
            ))}
          </div>
        </div>
      ))}
      {!filteredReports.length && (
        <p className={styles.emptyState}>لا توجد بلاغات مطابقة.</p>
      )}
    </div>
  );

  const renderAudit = () => (
    <div className={styles.listCard}>
      {filteredAuditLogs.map((log) => (
        <div key={log.id} className={styles.rowCard}>
          <div>
            <strong>{log.action}</strong>
            <small>{log.details}</small>
          </div>
          <span className={styles.auditTime}>
            {formatDateTime(log.createdAt)}
          </span>
        </div>
      ))}
      {!filteredAuditLogs.length && (
        <p className={styles.emptyState}>لا يوجد سجل عمليات مطابق.</p>
      )}
    </div>
  );

  const activeContent =
    activeSection === "overview"
      ? renderOverview()
      : activeSection === "users"
        ? renderUsers()
        : activeSection === "groups"
          ? renderGroups()
          : activeSection === "x-content"
            ? renderPosts()
            : activeSection === "videos"
              ? renderVideos()
              : activeSection === "reports"
                ? renderReports()
                : renderAudit();

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>WEBPLUS ADMIN</span>
          <h1 className={styles.title}>لوحة إدارة المنصة</h1>
          <p className={styles.subtitle}>
            مركز واحد لإدارة المستخدمين والقروبات والمحتوى والبلاغات وسجل
            العمليات.
          </p>
        </div>

        <div className={styles.heroActions}>
          <span className={styles.roleBadge}>{role}</span>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <ChevronRight size={16} /> رجوع
          </button>
        </div>
      </section>

      <section className={styles.grid}>
        <aside className={styles.sidebar}>
          {adminSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ""}`}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon size={18} />
                <span>
                  <strong>{section.label}</strong>
                  <small>{section.hint}</small>
                </span>
              </button>
            );
          })}
        </aside>

        <section className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <h2>
              {
                adminSections.find((section) => section.id === activeSection)
                  ?.label
              }
            </h2>
            <p>{sectionDescriptions[activeSection]}</p>
          </div>

          <div className={styles.toolbar}>
            <label className={styles.searchWrap}>
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className={styles.searchInput}
                placeholder="بحث داخل القسم الحالي"
              />
            </label>
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={() => void handleRefresh()}
              disabled={refreshing}
            >
              {refreshing ? (
                <LoaderCircle size={15} className={styles.spin} />
              ) : (
                <RefreshCcw size={15} />
              )}
              تحديث
            </button>
          </div>

          {feedbackMessage && (
            <p className={styles.feedback}>{feedbackMessage}</p>
          )}
          {errorMessage && (
            <p className={styles.errorBanner}>
              <AlertTriangle size={15} /> {errorMessage}
            </p>
          )}

          {loading ? (
            <p className={styles.emptyState}>جاري تحميل بيانات الأدمن...</p>
          ) : (
            activeContent
          )}
        </section>
      </section>
    </main>
  );
}
