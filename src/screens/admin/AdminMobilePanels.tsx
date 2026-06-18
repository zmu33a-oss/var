import { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type {
  AdminAuditEntry,
  AdminPostSummary,
  AdminUserSummary,
} from "../../lib/admin/mobile-admin-api";
import {
  deleteMobileAdminPost,
  getMobileAdminApiHint,
  listMobileAdminAuditLogs,
  listMobileAdminPosts,
  listMobileAdminUsers,
  setMobileAdminPostHidden,
  setMobileAdminUserCardTier,
  setMobileAdminUserDisplayVarId,
  setMobileAdminUserRole,
  setMobileAdminUserStatus,
  setMobileAdminUserVerification,
} from "../../lib/admin/mobile-admin-api";
import {
  getMembershipCardTierArabicLabel,
  type MembershipCardTier,
} from "../../lib/membershipCardTier";

export type AdminMobilePanel =
  | "overview"
  | "users"
  | "posts"
  | "audit";

const PANELS: Array<{ id: AdminMobilePanel; label: string }> = [
  { id: "overview", label: "نظرة عامة" },
  { id: "users", label: "المستخدمون" },
  { id: "posts", label: "المنشورات" },
  { id: "audit", label: "السجل" },
];

export function AdminPanelTabs(props: {
  activePanel: AdminMobilePanel;
  onChange: (panel: AdminMobilePanel) => void;
}) {
  return (
    <View style={styles.panelTabsRow}>
      {PANELS.map((panel) => (
        <Pressable
          key={panel.id}
          style={[
            styles.panelTab,
            props.activePanel === panel.id ? styles.panelTabActive : null,
          ]}
          onPress={() => props.onChange(panel.id)}
        >
          <Text
            style={[
              styles.panelTabText,
              props.activePanel === panel.id ? styles.panelTabTextActive : null,
            ]}
          >
            {panel.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function AdminApiStatusBanner(props: {
  ready: boolean | null;
  message: string;
}) {
  if (props.ready === null) {
    return (
      <View style={[styles.banner, styles.bannerPending]}>
        <ActivityIndicator color="#63C6FF" size="small" />
        <Text style={styles.bannerText}>جارٍ فحص اتصال API الإدارة...</Text>
      </View>
    );
  }

  if (props.ready) {
    return (
      <View style={[styles.banner, styles.bannerReady]}>
        <Ionicons name="checkmark-circle" size={16} color="#41F17B" />
        <Text style={styles.bannerText}>
          أوامر الإدارة متصلة بالـ API — الأزرار جاهزة للتنفيذ.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.banner, styles.bannerError]}>
      <Ionicons name="warning-outline" size={16} color="#FFB85C" />
      <Text style={styles.bannerText}>
        {props.message ||
          "API الإدارة غير متصل. شغّل npm run dev:api وأضف APPWRITE_API_KEY."}
      </Text>
    </View>
  );
}

export function AdminUsersPanel(props: {
  onSelectUser: (user: AdminUserSummary) => void;
}) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = useCallback(async (query = "") => {
    setIsLoading(true);
    setError("");

    try {
      const result = await listMobileAdminUsers({
        search: query,
        limit: 30,
        offset: 0,
      });
      setUsers(result.users);
      setTotal(result.total);
    } catch (loadError) {
      setUsers([]);
      setTotal(0);
      setError(getMobileAdminApiHint(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionEyebrow}>USERS</Text>
      <Text style={styles.sectionTitle}>المستخدمون ({total})</Text>

      <View style={styles.searchRow}>
        <Pressable
          style={styles.searchButton}
          onPress={() => void loadUsers(search)}
        >
          <Ionicons name="search" size={16} color="#09111C" />
        </Pressable>
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => void loadUsers(search)}
          placeholder="بحث بالاسم أو VAR ID أو @username"
          placeholderTextColor="rgba(255,255,255,0.34)"
          style={styles.searchInput}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color="#63C6FF" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : users.length ? (
        users.map((user) => (
          <Pressable
            key={user.id}
            style={styles.listRow}
            onPress={() => props.onSelectUser(user)}
          >
            <View style={styles.listRowCopy}>
              <Text style={styles.listRowTitle}>
                {user.displayName || "بدون اسم"}
              </Text>
              <Text style={styles.listRowMeta}>
                {user.displayVarId} • @{user.username || "user"} •{" "}
                {user.accountStatus === "suspended" ? "موقوف" : "نشط"}
              </Text>
            </View>
            <View style={styles.listRowBadge}>
              <Text style={styles.listRowBadgeText}>
                {user.role === "admin" ? "ADMIN" : "MEMBER"}
              </Text>
            </View>
          </Pressable>
        ))
      ) : (
        <Text style={styles.emptyCopy}>لا يوجد مستخدمون مطابقون.</Text>
      )}
    </View>
  );
}

export function AdminPostsPanel() {
  const [posts, setPosts] = useState<AdminPostSummary[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyPostId, setBusyPostId] = useState("");

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setPosts(await listMobileAdminPosts());
    } catch (loadError) {
      setPosts([]);
      setError(getMobileAdminApiHint(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const runPostAction = async (
    postId: string,
    action: "hide" | "unhide" | "delete",
  ) => {
    setBusyPostId(postId);
    setMessage("");

    try {
      if (action === "delete") {
        await deleteMobileAdminPost(postId);
        setMessage("تم حذف المنشور.");
      } else {
        await setMobileAdminPostHidden(postId, action === "hide");
        setMessage(action === "hide" ? "تم إخفاء المنشور." : "تم إظهار المنشور.");
      }

      await loadPosts();
    } catch (actionError) {
      setMessage(getMobileAdminApiHint(actionError));
    } finally {
      setBusyPostId("");
    }
  };

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <Pressable style={styles.refreshChip} onPress={() => void loadPosts()}>
          <Ionicons name="refresh" size={14} color="#FFFFFF" />
        </Pressable>
        <View style={styles.sectionHeaderCopy}>
          <Text style={styles.sectionEyebrow}>POSTS</Text>
          <Text style={styles.sectionTitle}>إدارة المنشورات</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#63C6FF" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : posts.length ? (
        posts.map((post) => (
          <View key={post.id} style={styles.postRow}>
            <View style={styles.postCopy}>
              <Text style={styles.postTitle} numberOfLines={1}>
                {post.hidden ? "[مخفي] " : ""}
                {post.title || "منشور بدون عنوان"}
              </Text>
              <Text style={styles.postMeta} numberOfLines={2}>
                {post.content}
              </Text>
              <Text style={styles.postVarId}>{post.varId || post.authorId}</Text>
            </View>

            <View style={styles.postActions}>
              <Pressable
                disabled={busyPostId === post.id}
                style={styles.actionChip}
                onPress={() =>
                  void runPostAction(post.id, post.hidden ? "unhide" : "hide")
                }
              >
                <Text style={styles.actionChipText}>
                  {post.hidden ? "إظهار" : "إخفاء"}
                </Text>
              </Pressable>
              <Pressable
                disabled={busyPostId === post.id}
                style={[styles.actionChip, styles.actionChipDanger]}
                onPress={() => void runPostAction(post.id, "delete")}
              >
                <Text style={styles.actionChipTextDanger}>حذف</Text>
              </Pressable>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyCopy}>لا توجد منشورات في Appwrite.</Text>
      )}

      {message ? <Text style={styles.messageText}>{message}</Text> : null}
    </View>
  );
}

export function AdminAuditPanel() {
  const [logs, setLogs] = useState<AdminAuditEntry[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setLogs(await listMobileAdminAuditLogs());
    } catch (loadError) {
      setLogs([]);
      setError(getMobileAdminApiHint(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <Pressable style={styles.refreshChip} onPress={() => void loadLogs()}>
          <Ionicons name="refresh" size={14} color="#FFFFFF" />
        </Pressable>
        <View style={styles.sectionHeaderCopy}>
          <Text style={styles.sectionEyebrow}>AUDIT</Text>
          <Text style={styles.sectionTitle}>سجل العمليات</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#63C6FF" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : logs.length ? (
        logs.map((log) => (
          <View key={log.id} style={styles.auditRow}>
            <Text style={styles.auditAction}>{log.action}</Text>
            <Text style={styles.auditDetails}>{log.details || log.targetId}</Text>
            <Text style={styles.auditMeta}>
              {log.adminEmail} • {log.createdAt}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyCopy}>لا توجد عمليات مسجلة بعد.</Text>
      )}
    </View>
  );
}

export function AdminUserModerationBar(props: {
  displayVarId: string;
  verified: boolean;
  cardTier: MembershipCardTier;
  accountStatus: "active" | "suspended";
  role: "admin" | "member" | string;
  onUpdated: (message: string) => void;
}) {
  const [isBusy, setIsBusy] = useState(false);
  const [newVarId, setNewVarId] = useState("");

  const runAction = async (task: () => Promise<unknown>, success: string) => {
    setIsBusy(true);

    try {
      await task();
      props.onUpdated(success);
    } catch (error) {
      props.onUpdated(getMobileAdminApiHint(error));
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpdateVarId = () => {
    const trimmed = newVarId.trim();
    if (!trimmed || trimmed === props.displayVarId) {
      props.onUpdated("لم يتم تغيير VAR ID.");
      return;
    }
    void runAction(
      () => setMobileAdminUserDisplayVarId(props.displayVarId, trimmed),
      `تم تغيير VAR ID إلى ${trimmed}.`,
    );
  };

  return (
    <View style={styles.moderationBar}>
      <Text style={styles.moderationTitle}>أوامر الإدارة</Text>

      <View style={styles.moderationActions}>
        {(["classic", "gold", "platinum"] as MembershipCardTier[]).map(
          (tier) => {
            const isActive = props.cardTier === tier;

            return (
              <Pressable
                key={tier}
                disabled={isBusy || isActive}
                style={[
                  styles.moderationButton,
                  isActive ? styles.moderationButtonActive : null,
                ]}
                onPress={() =>
                  void runAction(
                    () => setMobileAdminUserCardTier(props.displayVarId, tier),
                    `تم تعيين بطاقة ${getMembershipCardTierArabicLabel(tier)}.`,
                  )
                }
              >
                <Text style={styles.moderationButtonText}>
                  {getMembershipCardTierArabicLabel(tier)}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>

      <View style={styles.moderationActions}>
        <Pressable
          disabled={isBusy}
          style={styles.moderationButton}
          onPress={() =>
            void runAction(
              () =>
                setMobileAdminUserVerification(
                  props.displayVarId,
                  !props.verified,
                ),
              props.verified ? "تم إلغاء التوثيق." : "تم منح التوثيق.",
            )
          }
        >
          <Text style={styles.moderationButtonText}>
            {props.verified ? "إلغاء التوثيق" : "منح توثيق"}
          </Text>
        </Pressable>

        <Pressable
          disabled={isBusy}
          style={styles.moderationButton}
          onPress={() =>
            void runAction(
              () =>
                setMobileAdminUserStatus(
                  props.displayVarId,
                  props.accountStatus === "suspended" ? "active" : "suspended",
                ),
              props.accountStatus === "suspended"
                ? "تم تفعيل الحساب."
                : "تم إيقاف الحساب.",
            )
          }
        >
          <Text style={styles.moderationButtonText}>
            {props.accountStatus === "suspended" ? "تفعيل" : "إيقاف"}
          </Text>
        </Pressable>

        <Pressable
          disabled={isBusy}
          style={styles.moderationButton}
          onPress={() =>
            void runAction(
              () =>
                setMobileAdminUserRole(
                  props.displayVarId,
                  props.role === "admin" ? "member" : "admin",
                ),
              props.role === "admin" ? "تم تخفيض الرتبة." : "تم ترقية الأدمن.",
            )
          }
        >
          <Text style={styles.moderationButtonText}>
            {props.role === "admin" ? "تخفيض" : "ترقية"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.varIdEditRow}>
        <Text style={styles.varIdEditLabel}>VAR ID:</Text>
        <TextInput
          style={styles.varIdInput}
          value={newVarId}
          onChangeText={setNewVarId}
          placeholder={props.displayVarId}
          placeholderTextColor="rgba(255,255,255,0.35)"
          autoCapitalize="characters"
        />
        <Pressable
          disabled={isBusy || !newVarId.trim()}
          style={[styles.varIdButton, (!newVarId.trim() || newVarId.trim() === props.displayVarId) && styles.varIdButtonDisabled]}
          onPress={handleUpdateVarId}
        >
          <Text style={styles.varIdButtonText}>تحديث</Text>
        </Pressable>
      </View>

      {isBusy ? (
        <ActivityIndicator color="#63C6FF" size="small" style={styles.loader} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panelTabsRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  panelTab: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  panelTabActive: {
    backgroundColor: "rgba(99,198,255,0.16)",
    borderColor: "rgba(99,198,255,0.34)",
  },
  panelTabText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "800",
  },
  panelTabTextActive: {
    color: "#FFFFFF",
  },
  banner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  bannerPending: {
    backgroundColor: "rgba(99,198,255,0.08)",
    borderColor: "rgba(99,198,255,0.18)",
  },
  bannerReady: {
    backgroundColor: "rgba(65,241,123,0.08)",
    borderColor: "rgba(65,241,123,0.18)",
  },
  bannerError: {
    backgroundColor: "rgba(255,184,92,0.08)",
    borderColor: "rgba(255,184,92,0.18)",
  },
  bannerText: {
    flex: 1,
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 18,
  },
  sectionCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  sectionHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionHeaderCopy: {
    flex: 1,
    alignItems: "flex-end",
  },
  sectionEyebrow: {
    color: "rgba(99,198,255,0.82)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  searchRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    color: "#FFFFFF",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    textAlign: "right",
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#63C6FF",
  },
  refreshChip: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: 10,
  },
  listRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  listRowCopy: {
    flex: 1,
    alignItems: "flex-end",
  },
  listRowTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  listRowMeta: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  listRowBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(99,198,255,0.14)",
  },
  listRowBadgeText: {
    color: "#7DD3FC",
    fontSize: 10,
    fontWeight: "900",
  },
  postRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  postCopy: {
    alignItems: "flex-end",
  },
  postTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  postMeta: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "right",
  },
  postVarId: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  postActions: {
    flexDirection: "row-reverse",
    gap: 8,
    marginTop: 10,
  },
  actionChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(99,198,255,0.14)",
  },
  actionChipDanger: {
    backgroundColor: "rgba(239,68,68,0.14)",
  },
  actionChipText: {
    color: "#7DD3FC",
    fontSize: 12,
    fontWeight: "800",
  },
  actionChipTextDanger: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "800",
  },
  auditRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "flex-end",
  },
  auditAction: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  auditDetails: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  auditMeta: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  moderationBar: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
  },
  moderationTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 10,
  },
  moderationActions: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
  },
  moderationButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(99,198,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(99,198,255,0.24)",
  },
  moderationButtonActive: {
    backgroundColor: "rgba(255,184,92,0.18)",
    borderColor: "rgba(255,184,92,0.42)",
  },
  moderationButtonText: {
    color: "#7DD3FC",
    fontSize: 12,
    fontWeight: "800",
  },
  loader: {
    marginVertical: 16,
  },
  errorText: {
    color: "#FFB85C",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 20,
    marginTop: 8,
  },
  emptyCopy: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 20,
    marginTop: 8,
  },
  messageText: {
    color: "#7DD3FC",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 10,
  },
  varIdEditRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
  },
  varIdEditLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "800",
  },
  varIdInput: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "#FFFFFF",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
  },
  varIdButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F4C565",
  },
  varIdButtonDisabled: {
    backgroundColor: "rgba(244,197,101,0.35)",
  },
  varIdButtonText: {
    color: "#09111C",
    fontSize: 12,
    fontWeight: "900",
  },
});
