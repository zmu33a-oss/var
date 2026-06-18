import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import type { ProfileData } from "../app.types";
import { PullToRefreshScrollView } from "../components/PullToRefreshScrollView";
import {
  APPWRITE_CONFIG,
  findAppwriteProfileIndexByDisplayVarId,
  getAppwriteVarProfile,
  getMissingAppwriteDataFields,
  getMissingAppwritePostsFields,
  getMissingAppwriteProjectFields,
  getMissingAppwriteVarProfileFields,
  hasAppwriteDataConfig,
  hasAppwritePostsConfig,
  hasAppwriteProjectConfig,
  hasAppwriteVarProfileConfig,
  listAppwritePostsByVarId,
  listAppwritePosts,
  type AppwriteAuthUser,
  type AppwriteProfileIndexRecord,
  type AppwritePostRecord,
  type AppwritePostsPage,
  type AppwriteSocialAction,
  type AppwriteSocialMode,
  type AppwriteVarProfile,
} from "../lib/appwrite";
import {
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "../lib/crossPlatformStyles";
import type { AdminUserSummary } from "../lib/admin/mobile-admin-api";
import {
  getMobileAdminApiHint,
  lookupMobileAdminUser,
  verifyMobileAdminSession,
} from "../lib/admin/mobile-admin-api";
import {
  AdminApiStatusBanner,
  AdminAuditPanel,
  AdminPanelTabs,
  AdminPostsPanel,
  AdminUserModerationBar,
  AdminUsersPanel,
  type AdminMobilePanel,
} from "./admin/AdminMobilePanels";

const SHELL_WIDTH = 430;

type AdminDashboardScreenProps = {
  adminUser: AppwriteAuthUser;
  profile: ProfileData;
  localPostsCount: number;
  onRefreshAppData?: () => void | Promise<void>;
  onClose: () => void;
};

type AdminDashboardSnapshot = {
  appwritePosts: AppwritePostRecord[];
  varProfile: AppwriteVarProfile | null;
  errors: string[];
};

type AdminLookupSnapshot = {
  profileIndex: AppwriteProfileIndexRecord | null;
  varProfile: AppwriteVarProfile | null;
  posts: AppwritePostRecord[];
  error: string;
  warning: string;
};

async function withAdminRefreshTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = 3500,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function readAdminDashboardSnapshot(
  adminVarId: string,
): Promise<AdminDashboardSnapshot> {
  const tasks: Array<
    Promise<
      AppwritePostsPage | AppwritePostRecord[] | AppwriteVarProfile | null
    >
  > = [];
  const taskLabels: string[] = [];

  if (hasAppwritePostsConfig()) {
    tasks.push(
      withAdminRefreshTimeout(listAppwritePosts(), { records: [], total: 0 }),
    );
    taskLabels.push("posts");
  }

  if (hasAppwriteVarProfileConfig() && adminVarId.trim()) {
    tasks.push(
      withAdminRefreshTimeout(getAppwriteVarProfile(adminVarId.trim()), null),
    );
    taskLabels.push("varProfile");
  }

  if (!tasks.length) {
    return {
      appwritePosts: [],
      varProfile: null,
      errors: [],
    };
  }

  const settledResults = await Promise.allSettled(tasks);
  const nextSnapshot: AdminDashboardSnapshot = {
    appwritePosts: [],
    varProfile: null,
    errors: [],
  };

  settledResults.forEach((result, index) => {
    const label = taskLabels[index];

    if (result.status !== "fulfilled") {
      nextSnapshot.errors.push(
        label === "posts"
          ? "تعذر تحميل منشورات Appwrite الحالية."
          : "تعذر تحميل ملف VAR الإداري الآن.",
      );
      return;
    }

    if (label === "posts") {
      nextSnapshot.appwritePosts = (result.value as AppwritePostsPage).records;
      return;
    }

    nextSnapshot.varProfile = result.value as AppwriteVarProfile | null;
  });

  return nextSnapshot;
}

async function readAdminLookupSnapshot(
  displayVarId: string,
): Promise<AdminLookupSnapshot> {
  if (
    !APPWRITE_CONFIG.databaseId.trim() ||
    !APPWRITE_CONFIG.profilesCollectionId.trim()
  ) {
    return {
      profileIndex: null,
      varProfile: null,
      posts: [],
      error: "فعّل profiles collection أولاً حتى يعمل البحث برقم VAR الظاهر.",
      warning: "",
    };
  }

  const profileIndex =
    await findAppwriteProfileIndexByDisplayVarId(displayVarId);

  if (!profileIndex) {
    return {
      profileIndex: null,
      varProfile: null,
      posts: [],
      error: "لم يتم العثور على حساب مطابق لهذا الرقم الظاهر.",
      warning: "",
    };
  }

  const warnings: string[] = [];
  const detailTasks = await Promise.allSettled([
    hasAppwritePostsConfig() && profileIndex.varId.trim()
      ? listAppwritePostsByVarId(profileIndex.varId)
      : Promise.resolve([] as AppwritePostRecord[]),
    hasAppwriteVarProfileConfig() && profileIndex.varId.trim()
      ? getAppwriteVarProfile(profileIndex.varId)
      : Promise.resolve(null),
  ]);

  const postsResult = detailTasks[0];
  const varProfileResult = detailTasks[1];
  const posts = postsResult.status === "fulfilled" ? postsResult.value : [];

  if (postsResult.status !== "fulfilled") {
    warnings.push("تعذر تحميل منشورات الحساب الآن.");
  }

  if (!hasAppwriteVarProfileConfig() || !profileIndex.varId.trim()) {
    warnings.push(
      "تم العثور على الحساب، لكن ملف VAR التفصيلي غير مفعّل في هذا التشغيل.",
    );

    return {
      profileIndex,
      varProfile: null,
      posts,
      error: "",
      warning: warnings.join(" "),
    };
  }

  if (varProfileResult.status === "fulfilled") {
    return {
      profileIndex,
      varProfile: varProfileResult.value,
      posts,
      error: "",
      warning: warnings.join(" "),
    };
  }

  warnings.push("تم العثور على الحساب لكن تعذر تحميل ملف VAR التفصيلي الآن.");

  return {
    profileIndex,
    varProfile: null,
    posts,
    error: "",
    warning: warnings.join(" "),
  };
}

function formatMissingFields(fields: readonly string[]) {
  return fields.length ? fields.join(" • ") : "جاهز";
}

function formatRelativeStamp(value: string) {
  const parsedValue = Date.parse(value);

  if (Number.isNaN(parsedValue)) {
    return "الآن";
  }

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - parsedValue) / 60000),
  );

  if (diffMinutes < 1) {
    return "الآن";
  }

  if (diffMinutes < 60) {
    return `قبل ${diffMinutes} دقيقة`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `قبل ${diffHours} ساعة`;
  }

  return `قبل ${Math.floor(diffHours / 24)} يوم`;
}

function formatRoleLabel(role: AppwriteProfileIndexRecord["role"]) {
  return role === "admin" ? "إداري" : "عضو";
}

function formatSocialModeLabel(mode: AppwriteSocialMode) {
  if (mode === "profile") {
    return "Profile";
  }

  return mode === "x" ? "X" : "TikTok";
}

function formatSocialActionLabel(action: AppwriteSocialAction) {
  switch (action) {
    case "post":
      return "منشور";
    case "reply":
      return "رد";
    case "comment":
      return "تعليق";
    case "like":
      return "إعجاب";
    case "repost":
      return "إعادة نشر";
    case "share":
      return "مشاركة";
    case "save":
      return "حفظ";
    case "follow":
      return "متابعة";
    default:
      return action;
  }
}

function summarizeTopAuthors(posts: AppwritePostRecord[]) {
  const counts = posts.reduce<Record<string, number>>((current, post) => {
    const nextVarId =
      (post.varId || post.authorId || "guest").trim() || "guest";
    current[nextVarId] = (current[nextVarId] || 0) + 1;
    return current;
  }, {});

  return Object.entries(counts)
    .map(([varId, totalPosts]) => ({ varId, totalPosts }))
    .sort((left, right) => right.totalPosts - left.totalPosts)
    .slice(0, 4);
}

async function copyTextIfAvailable(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return false;
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    await navigator.clipboard.writeText(normalizedValue);
    return true;
  }

  return false;
}

export default function AdminDashboardScreen(props: AdminDashboardScreenProps) {
  const { width } = useWindowDimensions();
  const layoutWidth = Math.min(width, SHELL_WIDTH);
  const chromeScale = Math.max(0.84, Math.min(1, layoutWidth / SHELL_WIDTH));
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [appwritePosts, setAppwritePosts] = useState<AppwritePostRecord[]>([]);
  const [adminVarProfile, setAdminVarProfile] =
    useState<AppwriteVarProfile | null>(null);
  const [lookupValue, setLookupValue] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupWarning, setLookupWarning] = useState("");
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupProfile, setLookupProfile] =
    useState<AppwriteProfileIndexRecord | null>(null);
  const [lookupVarProfile, setLookupVarProfile] =
    useState<AppwriteVarProfile | null>(null);
  const [lookupPosts, setLookupPosts] = useState<AppwritePostRecord[]>([]);
  const [supportActionMessage, setSupportActionMessage] = useState("");
  const [activePanel, setActivePanel] = useState<AdminMobilePanel>("overview");
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [apiMessage, setApiMessage] = useState("");
  const [apiModerationUser, setApiModerationUser] =
    useState<AdminUserSummary | null>(null);
  const canLookupProfiles = Boolean(
    APPWRITE_CONFIG.databaseId.trim() &&
    APPWRITE_CONFIG.profilesCollectionId.trim(),
  );
  const lookupRecentPosts = lookupPosts.slice(0, 5);
  const lookupRecentPredictions =
    lookupVarProfile?.lockedPredictions.slice(0, 5) ?? [];
  const lookupRecentInteractions =
    lookupVarProfile?.social.records
      .filter((record) => record.active)
      .slice(0, 5) ?? [];

  const metrics = {
    earnedPoints: adminVarProfile?.earnedPoints ?? props.profile.earnedPoints,
    lockedPredictions:
      adminVarProfile?.lockedPredictions.length ??
      props.profile.lockedPredictions.length,
    totalInteractions:
      adminVarProfile?.social.totalActiveInteractions ??
      props.profile.socialMetrics.totalInteractions,
  };
  const healthRows = [
    {
      id: "project",
      label: "إعداد المشروع",
      ready: hasAppwriteProjectConfig(),
      detail: formatMissingFields(getMissingAppwriteProjectFields()),
      icon: "planet-outline" as const,
    },
    {
      id: "data",
      label: "الـ Collections",
      ready: hasAppwriteDataConfig(),
      detail: formatMissingFields(getMissingAppwriteDataFields()),
      icon: "layers-outline" as const,
    },
    {
      id: "posts",
      label: "قناة المنشورات",
      ready: hasAppwritePostsConfig(),
      detail: formatMissingFields(getMissingAppwritePostsFields()),
      icon: "chatbox-ellipses-outline" as const,
    },
    {
      id: "var-profile",
      label: "ملف VAR",
      ready: hasAppwriteVarProfileConfig(),
      detail: formatMissingFields(getMissingAppwriteVarProfileFields()),
      icon: "shield-checkmark-outline" as const,
    },
  ];
  const recentPosts = appwritePosts.slice(0, 5);
  const topAuthors = summarizeTopAuthors(appwritePosts);

  useEffect(() => {
    let isActive = true;

    const verifyApi = async () => {
      setApiReady(null);

      try {
        await verifyMobileAdminSession();
        if (isActive) {
          setApiReady(true);
          setApiMessage("");
        }
      } catch (error) {
        if (isActive) {
          setApiReady(false);
          setApiMessage(getMobileAdminApiHint(error));
        }
      }
    };

    void verifyApi();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadDashboard = async () => {
      setIsRefreshing(true);

      try {
        const nextSnapshot = await readAdminDashboardSnapshot(
          props.adminUser.varId,
        );

        if (!isActive) {
          return;
        }

        setAppwritePosts(nextSnapshot.appwritePosts);
        setAdminVarProfile(nextSnapshot.varProfile);
        setLoadErrors(nextSnapshot.errors);
      } finally {
        if (isActive) {
          setIsRefreshing(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, [props.adminUser.varId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [nextSnapshot] = await Promise.all([
        readAdminDashboardSnapshot(props.adminUser.varId),
        Promise.resolve(props.onRefreshAppData?.()),
      ]);
      setAppwritePosts(nextSnapshot.appwritePosts);
      setAdminVarProfile(nextSnapshot.varProfile);
      setLoadErrors(nextSnapshot.errors);
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshApiModerationUser = async (query: string) => {
    if (!query.trim() || !apiReady) {
      setApiModerationUser(null);
      return;
    }

    try {
      setApiModerationUser(await lookupMobileAdminUser(query));
    } catch {
      setApiModerationUser(null);
    }
  };

  const handleLookup = async (forcedQuery?: string) => {
    const query = (forcedQuery ?? lookupValue).trim();

    if (!query) {
      setLookupProfile(null);
      setLookupVarProfile(null);
      setLookupPosts([]);
      setApiModerationUser(null);
      setSupportActionMessage("");
      setLookupWarning("");
      setLookupError("أدخل رقم VAR أو اسم المستخدم أولاً.");
      return;
    }

    if (forcedQuery) {
      setLookupValue(forcedQuery);
    }

    setIsLookupLoading(true);
    setLookupError("");
    setLookupWarning("");
    setLookupProfile(null);
    setLookupVarProfile(null);
    setLookupPosts([]);
    setApiModerationUser(null);
    setSupportActionMessage("");

    try {
      const snapshot = await readAdminLookupSnapshot(query);
      setLookupProfile(snapshot.profileIndex);
      setLookupVarProfile(snapshot.varProfile);
      setLookupPosts(snapshot.posts);
      setLookupError(snapshot.error);
      setLookupWarning(snapshot.warning);

      if (snapshot.profileIndex) {
        await refreshApiModerationUser(
          snapshot.profileIndex.displayVarId || query,
        );
      } else if (apiReady) {
        try {
          const apiUser = await lookupMobileAdminUser(query);
          setApiModerationUser(apiUser);
          setLookupError("");
        } catch (apiError) {
          if (!snapshot.error) {
            setLookupError(getMobileAdminApiHint(apiError));
          }
        }
      }
    } catch {
      setLookupError("تعذر تنفيذ البحث الآن. حاول مرة أخرى بعد قليل.");
    } finally {
      setIsLookupLoading(false);
    }
  };

  const handleSelectUserFromList = (user: AdminUserSummary) => {
    setActivePanel("overview");
    void handleLookup(user.displayVarId || user.varId);
  };

  const handleCopySupportField = async (label: string, value: string) => {
    try {
      const copied = await copyTextIfAvailable(value);

      if (copied) {
        setSupportActionMessage(`تم نسخ ${label}.`);
        return;
      }

      await Share.share({ message: `${label}: ${value.trim()}` });
      setSupportActionMessage(
        `النسخ غير مدعوم هنا، فتم فتح مشاركة ${label} بدلًا من ذلك.`,
      );
    } catch {
      setSupportActionMessage(`تعذر تجهيز ${label} الآن.`);
    }
  };

  const handleShareSupportSummary = async () => {
    if (!lookupProfile) {
      return;
    }

    const summaryLines = [
      `Display VAR: ${lookupProfile.displayVarId}`,
      `Internal VAR: ${lookupProfile.varId}`,
      `User ID: ${lookupProfile.userId}`,
      `Display Name: ${lookupProfile.displayName || "Unknown"}`,
      `Username: @${lookupProfile.username || "no-username"}`,
      `Role: ${lookupProfile.role}`,
      `Posts: ${lookupPosts.length}`,
      `Locked Predictions: ${lookupVarProfile?.lockedPredictions.length ?? 0}`,
      `Active Interactions: ${lookupVarProfile?.social.totalActiveInteractions ?? 0}`,
    ];

    try {
      await Share.share({
        title: "WEBPLUS Support Snapshot",
        message: summaryLines.join("\n"),
      });
      setSupportActionMessage("تم تجهيز ملخص الدعم للمشاركة.");
    } catch {
      setSupportActionMessage("تعذر مشاركة ملخص الدعم الآن.");
    }
  };

  return (
    <View style={styles.root}>
      <View
        {...getNativePointerEventsProps("none")}
        style={[styles.backgroundLayer, getWebPointerEventsStyle("none")]}
      >
        <LinearGradient
          colors={["#02040A", "#06101B", "#02040A"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.primaryGlow} />
        <View style={styles.secondaryGlow} />
      </View>

      <PullToRefreshScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: Math.round(18 * chromeScale),
            paddingTop: Math.round(62 * chromeScale),
            paddingBottom: Math.round(36 * chromeScale),
          },
        ]}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      >
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={props.onClose}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>VAR CONTROL</Text>
            <Text style={styles.headerTitle}>لوحة التحكم</Text>
            <Text style={styles.headerSubtitle}>
              أوامر إدارية حقيقية عبر API مع قراءة مباشرة من Appwrite
            </Text>
          </View>

          <Pressable
            style={styles.headerButton}
            onPress={() => void handleRefresh()}
          >
            {isRefreshing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
            )}
          </Pressable>
        </View>

        <LinearGradient
          colors={[
            "rgba(99,198,255,0.22)",
            "rgba(21,34,57,0.94)",
            "rgba(7,12,20,0.98)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroBadge}>
              <Ionicons name="shield-checkmark" size={15} color="#09111C" />
              <Text style={styles.heroBadgeText}>ADMIN</Text>
            </View>
            <Text style={styles.heroLabel}>
              {props.adminUser.adminLabel || "VAR"}
            </Text>
          </View>

          <Text style={styles.heroName}>{props.profile.displayName}</Text>
          <Text style={styles.heroMeta}>{props.adminUser.email}</Text>

          <View style={styles.heroStatsRow}>
            <HeroStat
              label="VAR ID"
              value={props.profile.displayVarId || props.profile.varId}
            />
            <HeroStat label="الدور" value={props.adminUser.role} />
            <HeroStat label="محليًا" value={String(props.localPostsCount)} />
          </View>
        </LinearGradient>

        {loadErrors.length ? (
          <View style={styles.noticeCard}>
            <Ionicons name="warning-outline" size={18} color="#FFB85C" />
            <Text style={styles.noticeText}>{loadErrors.join(" ")}</Text>
          </View>
        ) : null}

        <AdminApiStatusBanner ready={apiReady} message={apiMessage} />

        <AdminPanelTabs activePanel={activePanel} onChange={setActivePanel} />

        {activePanel === "users" ? (
          <AdminUsersPanel onSelectUser={handleSelectUserFromList} />
        ) : null}

        {activePanel === "posts" ? <AdminPostsPanel /> : null}

        {activePanel === "audit" ? <AdminAuditPanel /> : null}

        {activePanel === "overview" ? (
          <>
            <SectionCard title="بحث الدعم" eyebrow="DISPLAY VAR LOOKUP">
              <Text style={styles.lookupLead}>
                أدخل رقم VAR الظاهر للعميل، وسنحوّله داخليًا إلى الحساب المرتبط
                وVAR ID الفعلي.
              </Text>

              <View style={styles.lookupControlsRow}>
                <Pressable
                  disabled={isLookupLoading || !canLookupProfiles}
                  onPress={() => void handleLookup()}
                  style={[
                    styles.lookupButton,
                    isLookupLoading || !canLookupProfiles
                      ? styles.lookupButtonDisabled
                      : null,
                  ]}
                >
                  {isLookupLoading ? (
                    <ActivityIndicator color="#09111C" size="small" />
                  ) : (
                    <>
                      <Ionicons name="search" size={16} color="#09111C" />
                      <Text style={styles.lookupButtonText}>بحث</Text>
                    </>
                  )}
                </Pressable>

                <TextInput
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isLookupLoading}
                  onChangeText={(value) => {
                    setLookupValue(value);
                    if (lookupError) {
                      setLookupError("");
                    }
                    if (lookupWarning) {
                      setLookupWarning("");
                    }
                  }}
                  onSubmitEditing={() => void handleLookup()}
                  placeholder="VAR-12345678 أو @username"
                  placeholderTextColor="rgba(255,255,255,0.34)"
                  style={styles.lookupInput}
                  value={lookupValue}
                />
              </View>

              <Text style={styles.lookupHint}>
                يدعم البحث برقم VAR أو اسم المستخدم. الأوامر الإدارية تعمل عبر
                API.
              </Text>

              {!canLookupProfiles ? (
                <View
                  style={[
                    styles.lookupFeedbackCard,
                    styles.lookupFeedbackWarning,
                  ]}
                >
                  <Ionicons
                    name="construct-outline"
                    size={16}
                    color="#63C6FF"
                  />
                  <Text style={styles.lookupFeedbackText}>
                    profiles collection غير مفعلة في Appwrite لهذا التشغيل، لذلك
                    البحث الإداري معروض لكن غير جاهز بعد.
                  </Text>
                </View>
              ) : null}

              {lookupError ? (
                <View
                  style={[
                    styles.lookupFeedbackCard,
                    styles.lookupFeedbackError,
                  ]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color="#FFB85C"
                  />
                  <Text style={styles.lookupFeedbackText}>{lookupError}</Text>
                </View>
              ) : null}

              {lookupWarning ? (
                <View
                  style={[
                    styles.lookupFeedbackCard,
                    styles.lookupFeedbackWarning,
                  ]}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color="#63C6FF"
                  />
                  <Text style={styles.lookupFeedbackText}>{lookupWarning}</Text>
                </View>
              ) : null}

              {lookupProfile ? (
                <View style={styles.lookupResultCard}>
                  <View style={styles.lookupResultHeader}>
                    <View style={styles.lookupResultBadge}>
                      <Ionicons
                        name="person-circle-outline"
                        size={15}
                        color="#09111C"
                      />
                      <Text style={styles.lookupResultBadgeText}>MATCHED</Text>
                    </View>
                    <Text style={styles.lookupResultStamp}>
                      {formatRelativeStamp(lookupProfile.createdAt)}
                    </Text>
                  </View>

                  <Text style={styles.lookupResultName}>
                    {lookupProfile.displayName || "بدون اسم ظاهر"}
                  </Text>
                  <Text style={styles.lookupResultMeta}>
                    @{lookupProfile.username || "no-username"} •{" "}
                    {formatRoleLabel(lookupProfile.role)}
                  </Text>

                  <View style={styles.lookupMetricsRow}>
                    <View style={styles.lookupMetricPill}>
                      <Text style={styles.lookupMetricValue}>
                        {String(lookupVarProfile?.earnedPoints ?? 0)}
                      </Text>
                      <Text style={styles.lookupMetricLabel}>النقاط</Text>
                    </View>
                    <View style={styles.lookupMetricPill}>
                      <Text style={styles.lookupMetricValue}>
                        {String(
                          lookupVarProfile?.lockedPredictions.length ?? 0,
                        )}
                      </Text>
                      <Text style={styles.lookupMetricLabel}>المقفلة</Text>
                    </View>
                    <View style={styles.lookupMetricPill}>
                      <Text style={styles.lookupMetricValue}>
                        {String(
                          lookupVarProfile?.social.totalActiveInteractions ?? 0,
                        )}
                      </Text>
                      <Text style={styles.lookupMetricLabel}>التفاعل</Text>
                    </View>
                  </View>

                  <DetailRow
                    label="Display VAR"
                    value={lookupProfile.displayVarId}
                  />
                  <DetailRow label="Internal VAR" value={lookupProfile.varId} />
                  <DetailRow label="User ID" value={lookupProfile.userId} />

                  <View style={styles.supportActionsRow}>
                    <Pressable
                      onPress={() =>
                        void handleCopySupportField(
                          "الرقم الداخلي",
                          lookupProfile.varId,
                        )
                      }
                      style={styles.supportActionButton}
                    >
                      <Ionicons name="copy-outline" size={15} color="#09111C" />
                      <Text style={styles.supportActionButtonText}>
                        نسخ الداخلي
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        void handleCopySupportField(
                          "User ID",
                          lookupProfile.userId,
                        )
                      }
                      style={styles.supportActionButtonSecondary}
                    >
                      <Ionicons
                        name="id-card-outline"
                        size={15}
                        color="#FFFFFF"
                      />
                      <Text style={styles.supportActionButtonSecondaryText}>
                        نسخ User ID
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => void handleShareSupportSummary()}
                      style={styles.supportActionButtonSecondary}
                    >
                      <Ionicons
                        name="share-social-outline"
                        size={15}
                        color="#FFFFFF"
                      />
                      <Text style={styles.supportActionButtonSecondaryText}>
                        مشاركة الملخص
                      </Text>
                    </Pressable>
                  </View>

                  {supportActionMessage ? (
                    <Text style={styles.supportActionMessage}>
                      {supportActionMessage}
                    </Text>
                  ) : null}

                  {apiReady && apiModerationUser ? (
                    <AdminUserModerationBar
                      displayVarId={apiModerationUser.displayVarId}
                      verified={apiModerationUser.verified}
                      cardTier={apiModerationUser.cardTier || "classic"}
                      accountStatus={apiModerationUser.accountStatus}
                      role={apiModerationUser.role}
                      onUpdated={(message) => {
                        setSupportActionMessage(message);
                        void refreshApiModerationUser(
                          apiModerationUser.displayVarId || lookupValue,
                        );
                      }}
                    />
                  ) : null}
                </View>
              ) : null}

              {!lookupProfile && apiModerationUser ? (
                <View style={styles.lookupResultCard}>
                  <View style={styles.lookupResultHeader}>
                    <View style={styles.lookupResultBadge}>
                      <Ionicons
                        name="person-circle-outline"
                        size={15}
                        color="#09111C"
                      />
                      <Text style={styles.lookupResultBadgeText}>
                        API MATCH
                      </Text>
                    </View>
                    <Text style={styles.lookupResultStamp}>
                      {formatRelativeStamp(apiModerationUser.createdAt)}
                    </Text>
                  </View>

                  <Text style={styles.lookupResultName}>
                    {apiModerationUser.displayName || "بدون اسم ظاهر"}
                  </Text>
                  <Text style={styles.lookupResultMeta}>
                    @{apiModerationUser.username || "no-username"} •{" "}
                    {formatRoleLabel(
                      apiModerationUser.role === "admin" ? "admin" : "member",
                    )}
                  </Text>

                  <DetailRow
                    label="Display VAR"
                    value={apiModerationUser.displayVarId}
                  />
                  <DetailRow
                    label="Internal VAR"
                    value={apiModerationUser.varId}
                  />
                  <DetailRow label="User ID" value={apiModerationUser.userId} />

                  {apiReady ? (
                    <AdminUserModerationBar
                      displayVarId={apiModerationUser.displayVarId}
                      verified={apiModerationUser.verified}
                      cardTier={apiModerationUser.cardTier || "classic"}
                      accountStatus={apiModerationUser.accountStatus}
                      role={apiModerationUser.role}
                      onUpdated={(message) => {
                        setSupportActionMessage(message);
                        void refreshApiModerationUser(
                          apiModerationUser.displayVarId || lookupValue,
                        );
                      }}
                    />
                  ) : null}

                  {supportActionMessage ? (
                    <Text style={styles.supportActionMessage}>
                      {supportActionMessage}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </SectionCard>

            {lookupProfile ? (
              <SectionCard title="أحدث منشورات الحساب" eyebrow="MATCHED POSTS">
                {lookupRecentPosts.length ? (
                  lookupRecentPosts.map((post) => (
                    <LookupActivityRow
                      key={post.id}
                      badge={formatRelativeStamp(post.createdAt)}
                      summary={post.content}
                      title={post.title || "منشور بدون عنوان"}
                    />
                  ))
                ) : (
                  <EmptySectionCopy text="لا توجد منشورات لهذا الحساب داخل Appwrite حتى الآن، أو أن قناة المنشورات غير مفعلة." />
                )}
              </SectionCard>
            ) : null}

            {lookupProfile ? (
              <SectionCard
                title="أحدث التوقعات المقفلة"
                eyebrow="MATCHED PREDICTIONS"
              >
                {lookupRecentPredictions.length ? (
                  lookupRecentPredictions.map((prediction) => (
                    <LookupActivityRow
                      key={prediction.id}
                      badge={formatRelativeStamp(prediction.lockedAt)}
                      summary={`${prediction.competition || "بدون بطولة"} • ${prediction.choice || "بدون اختيار"} • ${prediction.pointsAwarded} نقطة`}
                      title={prediction.title || "توقع بدون عنوان"}
                    />
                  ))
                ) : (
                  <EmptySectionCopy text="لا توجد توقعات مقفلة لهذا الحساب حتى الآن، أو أن collection التوقعات غير مفعلة." />
                )}
              </SectionCard>
            ) : null}

            {lookupProfile ? (
              <SectionCard
                title="آخر التفاعلات النشطة"
                eyebrow="MATCHED INTERACTIONS"
              >
                {lookupRecentInteractions.length ? (
                  lookupRecentInteractions.map((interaction) => (
                    <LookupActivityRow
                      key={interaction.id}
                      badge={formatRelativeStamp(interaction.createdAt)}
                      summary={
                        interaction.value.trim()
                          ? interaction.value
                          : `الهدف: ${interaction.targetId}`
                      }
                      title={`${formatSocialModeLabel(interaction.mode)} • ${formatSocialActionLabel(interaction.action)}`}
                    />
                  ))
                ) : (
                  <EmptySectionCopy text="لا توجد تفاعلات نشطة مسجلة لهذا الحساب حتى الآن، أو أن collection التفاعل غير مفعلة." />
                )}
              </SectionCard>
            ) : null}

            <View style={styles.metricsGrid}>
              <MetricCard
                accent="#63C6FF"
                icon="chatbox-ellipses-outline"
                label="منشورات Appwrite"
                value={String(appwritePosts.length)}
              />
              <MetricCard
                accent="#41F17B"
                icon="sparkles-outline"
                label="النقاط الحالية"
                value={String(metrics.earnedPoints)}
              />
              <MetricCard
                accent="#F4C565"
                icon="lock-closed-outline"
                label="التوقعات المقفلة"
                value={String(metrics.lockedPredictions)}
              />
              <MetricCard
                accent="#F985FF"
                icon="pulse-outline"
                label="إجمالي التفاعل"
                value={String(metrics.totalInteractions)}
              />
            </View>

            <SectionCard title="جاهزية النظام" eyebrow="SYSTEM HEALTH">
              {healthRows.map((row) => (
                <View key={row.id} style={styles.healthRow}>
                  <View style={styles.healthCopy}>
                    <Text style={styles.healthTitle}>{row.label}</Text>
                    <Text style={styles.healthDetail}>{row.detail}</Text>
                  </View>
                  <View
                    style={[
                      styles.healthIconWrap,
                      row.ready
                        ? styles.healthIconWrapReady
                        : styles.healthIconWrapPending,
                    ]}
                  >
                    <Ionicons
                      name={row.icon}
                      size={16}
                      color={row.ready ? "#0B1A12" : "#FFF1D6"}
                    />
                  </View>
                </View>
              ))}
            </SectionCard>

            <SectionCard title="هوية المشروع" eyebrow="APPWRITE MAP">
              <DetailRow
                label="Project ID"
                value={APPWRITE_CONFIG.projectId || "غير محدد"}
              />
              <DetailRow
                label="Database ID"
                value={APPWRITE_CONFIG.databaseId || "غير محدد"}
              />
              <DetailRow
                label="Endpoint"
                value={APPWRITE_CONFIG.endpoint || "غير محدد"}
                multiline
              />
              <DetailRow
                label="Web Platform"
                value={APPWRITE_CONFIG.platform || "غير محدد"}
              />
            </SectionCard>

            <SectionCard title="أحدث المنشورات" eyebrow="CONTENT FEED">
              {recentPosts.length ? (
                recentPosts.map((post) => (
                  <View key={post.id} style={styles.postRow}>
                    <View style={styles.postMetaColumn}>
                      <Text style={styles.postMetaValue}>{post.varId}</Text>
                      <Text style={styles.postMetaTime}>
                        {formatRelativeStamp(post.createdAt)}
                      </Text>
                    </View>

                    <View style={styles.postCopyColumn}>
                      <Text numberOfLines={1} style={styles.postTitle}>
                        {post.title || "منشور بدون عنوان"}
                      </Text>
                      <Text numberOfLines={2} style={styles.postExcerpt}>
                        {post.content}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <EmptySectionCopy text="لا توجد منشورات Appwrite معروضة بعد، أو أن صلاحيات collection لم تُفعّل بعد." />
              )}
            </SectionCard>

            <SectionCard title="أكثر الحسابات نشاطًا" eyebrow="AUTHOR SIGNALS">
              {topAuthors.length ? (
                topAuthors.map((author, index) => (
                  <View key={author.varId} style={styles.authorRow}>
                    <View style={styles.authorCountWrap}>
                      <Text style={styles.authorCount}>
                        {author.totalPosts}
                      </Text>
                    </View>
                    <View style={styles.authorCopy}>
                      <Text style={styles.authorVarId}>{author.varId}</Text>
                      <Text style={styles.authorHint}>
                        عدد المنشورات المنشورة داخل Appwrite
                      </Text>
                    </View>
                    <View style={styles.authorRankWrap}>
                      <Text style={styles.authorRank}>#{index + 1}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <EmptySectionCopy text="سيظهر ترتيب الحسابات هنا بعد توفر منشورات كافية داخل collection الخاصة بالمنشورات." />
              )}
            </SectionCard>
          </>
        ) : null}
      </PullToRefreshScrollView>
    </View>
  );
}

function HeroStat(props: { label: string; value: string }) {
  return (
    <View style={styles.heroStatCard}>
      <Text numberOfLines={1} style={styles.heroStatValue}>
        {props.value}
      </Text>
      <Text style={styles.heroStatLabel}>{props.label}</Text>
    </View>
  );
}

function MetricCard(props: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View
        style={[
          styles.metricIconWrap,
          { backgroundColor: `${props.accent}22` },
        ]}
      >
        <Ionicons name={props.icon} size={16} color={props.accent} />
      </View>
      <Text style={styles.metricValue}>{props.value}</Text>
      <Text style={styles.metricLabel}>{props.label}</Text>
    </View>
  );
}

function SectionCard(props: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionEyebrow}>{props.eyebrow}</Text>
      <Text style={styles.sectionTitle}>{props.title}</Text>
      <View style={styles.sectionBody}>{props.children}</View>
    </View>
  );
}

function DetailRow(props: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text
        style={[
          styles.detailValue,
          props.multiline ? styles.detailValueMultiline : null,
        ]}
      >
        {props.value}
      </Text>
      <Text style={styles.detailLabel}>{props.label}</Text>
    </View>
  );
}

function EmptySectionCopy(props: { text: string }) {
  return <Text style={styles.emptyCopy}>{props.text}</Text>;
}

function LookupActivityRow(props: {
  title: string;
  summary: string;
  badge: string;
}) {
  return (
    <View style={styles.lookupActivityRow}>
      <View style={styles.lookupActivityBadge}>
        <Text style={styles.lookupActivityBadgeText}>{props.badge}</Text>
      </View>
      <View style={styles.lookupActivityCopy}>
        <Text numberOfLines={1} style={styles.lookupActivityTitle}>
          {props.title}
        </Text>
        <Text numberOfLines={2} style={styles.lookupActivitySummary}>
          {props.summary}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#02040A",
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  primaryGlow: {
    position: "absolute",
    top: 80,
    right: -36,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(99,198,255,0.16)",
  },
  secondaryGlow: {
    position: "absolute",
    bottom: 120,
    left: -44,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(244,197,101,0.12)",
  },
  content: {
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  headerCopy: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  headerEyebrow: {
    color: "rgba(99,198,255,0.82)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 4,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 6,
  },
  heroCard: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  heroHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#41F17B",
  },
  heroBadgeText: {
    color: "#09111C",
    fontSize: 11,
    fontWeight: "900",
    marginRight: 6,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 12,
    fontWeight: "800",
  },
  heroName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 18,
  },
  heroMeta: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
  },
  heroStatsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 10,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  heroStatValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 8,
  },
  noticeCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,184,92,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,184,92,0.22)",
    marginTop: 14,
  },
  noticeText: {
    flex: 1,
    color: "#FFE4B0",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 20,
    marginRight: 10,
  },
  lookupLead: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 20,
  },
  lookupControlsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  lookupInput: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
  },
  lookupButton: {
    minWidth: 96,
    height: 48,
    borderRadius: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#63C6FF",
    paddingHorizontal: 16,
  },
  lookupButtonDisabled: {
    opacity: 0.52,
  },
  lookupButtonText: {
    color: "#09111C",
    fontSize: 13,
    fontWeight: "900",
  },
  lookupHint: {
    color: "rgba(255,255,255,0.46)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 18,
    marginTop: 10,
  },
  lookupFeedbackCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
  },
  lookupFeedbackError: {
    backgroundColor: "rgba(255,184,92,0.10)",
    borderColor: "rgba(255,184,92,0.22)",
  },
  lookupFeedbackWarning: {
    backgroundColor: "rgba(99,198,255,0.10)",
    borderColor: "rgba(99,198,255,0.22)",
  },
  lookupFeedbackText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 19,
    marginRight: 10,
  },
  lookupResultCard: {
    marginTop: 14,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  lookupResultHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lookupResultBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#63C6FF",
  },
  lookupResultBadgeText: {
    color: "#09111C",
    fontSize: 10,
    fontWeight: "900",
    marginRight: 6,
    letterSpacing: 0.8,
  },
  lookupResultStamp: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
  },
  lookupResultName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 14,
  },
  lookupResultMeta: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
  },
  lookupMetricsRow: {
    flexDirection: "row-reverse",
    gap: 10,
    marginTop: 14,
  },
  lookupMetricPill: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  lookupMetricValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
  },
  lookupMetricLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
  },
  supportActionsRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  supportActionButton: {
    minHeight: 42,
    borderRadius: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    backgroundColor: "#63C6FF",
  },
  supportActionButtonSecondary: {
    minHeight: 42,
    borderRadius: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  supportActionButtonText: {
    color: "#09111C",
    fontSize: 12,
    fontWeight: "900",
  },
  supportActionButtonSecondaryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  supportActionMessage: {
    color: "rgba(99,198,255,0.86)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 18,
    marginTop: 12,
  },
  lookupActivityRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  lookupActivityBadge: {
    minWidth: 64,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,198,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(99,198,255,0.22)",
  },
  lookupActivityBadgeText: {
    color: "#63C6FF",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },
  lookupActivityCopy: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 12,
  },
  lookupActivityTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  lookupActivitySummary: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 20,
    marginTop: 6,
  },
  metricsGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  metricCard: {
    width: "48%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  metricValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 18,
  },
  metricLabel: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 8,
  },
  sectionCard: {
    marginTop: 16,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sectionEyebrow: {
    color: "rgba(99,198,255,0.82)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    textAlign: "right",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 6,
  },
  sectionBody: {
    marginTop: 14,
  },
  healthRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  healthCopy: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 12,
  },
  healthTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  healthDetail: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
  },
  healthIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  healthIconWrapReady: {
    backgroundColor: "#41F17B",
  },
  healthIconWrapPending: {
    backgroundColor: "rgba(255,184,92,0.22)",
  },
  detailRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  detailLabel: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
  detailValue: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "left",
    marginRight: 16,
  },
  detailValueMultiline: {
    lineHeight: 20,
  },
  postRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  postMetaColumn: {
    minWidth: 82,
    alignItems: "flex-start",
  },
  postMetaValue: {
    color: "#63C6FF",
    fontSize: 11,
    fontWeight: "900",
  },
  postMetaTime: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "left",
    marginTop: 6,
  },
  postCopyColumn: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 14,
  },
  postTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  postExcerpt: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 20,
    marginTop: 6,
  },
  authorRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  authorCountWrap: {
    minWidth: 52,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(65,241,123,0.14)",
    borderWidth: 1,
    borderColor: "rgba(65,241,123,0.26)",
  },
  authorCount: {
    color: "#41F17B",
    fontSize: 13,
    fontWeight: "900",
  },
  authorCopy: {
    flex: 1,
    alignItems: "flex-end",
    marginHorizontal: 12,
  },
  authorVarId: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  authorHint: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
  },
  authorRankWrap: {
    width: 32,
    alignItems: "center",
  },
  authorRank: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 11,
    fontWeight: "800",
  },
  emptyCopy: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 20,
    paddingVertical: 4,
  },
});
