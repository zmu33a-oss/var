import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Camera,
  Heart,
  IdCardLanyard,
  MessageCircleMore,
  Power,
  Repeat2,
  Send,
  Shield,
  UserRound,
  Users,
  X,
} from "lucide-react";
import styles from "../pages-css/ProfilePage.module.css";
import { useAuth } from "../lib/AuthContext";
import {
  fetchXPostsFromDatabase,
  loadFollowCountsFromDatabase,
  loadProfilePrefsFromDatabase,
  replaceUserAliasesInDatabase,
  saveProfilePrefsToDatabase,
  updateXIdentityInDatabase,
} from "../lib/socialTables";
import { updateTikTokIdentityInDatabase } from "../lib/tiktokTables";
import { buildXHandle, normalizeXPosts, type XPost } from "../lib/xPosts";
import VerificationBadge from "../components/VerificationBadge";
import { useVerificationRegistry } from "../lib/verification";
import { getVerificationBadgeAccentLabel } from "../lib/verificationBadges";
import { supabase } from "./supabase";

interface Props {
  onSignOut?: () => void;
  onOpenAdmin?: () => void;
  canOpenAdmin?: boolean;
  xPosts?: XPost[];
}

type TileId =
  | "comments-outline"
  | "likes-follow"
  | "likes-blue"
  | "comments-green"
  | "share-amber"
  | "likes-red"
  | "repost-cyan";

type LayoutItemId = "hero" | TileId;

type ProfilePagePrefs = {
  backgroundImage?: string;
  layoutOrder?: LayoutItemId[];
  tileOrder?: TileId[];
};

type ProfileMetricTile = {
  id: TileId;
  label: string;
  value: string;
  tone: "white" | "green" | "amber" | "red" | "cyan" | "blue";
  icon?: React.ReactNode;
  sticker?: string;
};

const PROFILE_PAGE_PREFS_KEY = "webplus:profile-page-prefs";
const DEFAULT_TILE_ORDER: TileId[] = [
  "comments-outline",
  "likes-follow",
  "likes-blue",
  "comments-green",
  "share-amber",
  "likes-red",
  "repost-cyan",
];
const DEFAULT_LAYOUT_ORDER: LayoutItemId[] = ["hero", ...DEFAULT_TILE_ORDER];
const LAYOUT_DRAG_START_DISTANCE = 12;

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

function formatMetricValue(value: number) {
  return value.toLocaleString("ar");
}

function resolveCountValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.trunc(parsed));
    }
  }

  if (Array.isArray(value)) {
    return value.length;
  }

  return null;
}

function resolveMetadataCount(
  metadata: Record<string, unknown> | undefined,
  keys: string[],
) {
  for (const key of keys) {
    const resolved = resolveCountValue(metadata?.[key]);
    if (resolved !== null) {
      return resolved;
    }
  }

  return 0;
}

function isTileId(value: unknown): value is TileId {
  return DEFAULT_TILE_ORDER.includes(value as TileId);
}

function isLayoutItemId(value: unknown): value is LayoutItemId {
  return DEFAULT_LAYOUT_ORDER.includes(value as LayoutItemId);
}

function normalizeTileOrder(order: unknown): TileId[] {
  if (!Array.isArray(order)) return DEFAULT_TILE_ORDER;

  const unique = order.filter(
    (value, index): value is TileId =>
      isTileId(value) && order.indexOf(value) === index,
  );

  return unique.concat(
    DEFAULT_TILE_ORDER.filter((tileId) => !unique.includes(tileId)),
  );
}

function normalizeLayoutOrder(order: unknown): LayoutItemId[] {
  if (!Array.isArray(order)) return DEFAULT_LAYOUT_ORDER;

  const unique = order.filter(
    (value, index): value is LayoutItemId =>
      isLayoutItemId(value) && order.indexOf(value) === index,
  );

  return unique.concat(
    DEFAULT_LAYOUT_ORDER.filter((itemId) => !unique.includes(itemId)),
  );
}

function getProfilePagePrefsStorageKey(userId: string) {
  return `${PROFILE_PAGE_PREFS_KEY}:${userId}`;
}

function loadProfilePagePrefs(userId?: string): ProfilePagePrefs {
  if (typeof window === "undefined" || !userId) return {};

  try {
    const raw = window.localStorage.getItem(
      getProfilePagePrefsStorageKey(userId),
    );
    if (!raw) return {};

    const parsed = JSON.parse(raw) as ProfilePagePrefs;
    const fallbackLayoutOrder: LayoutItemId[] = [
      "hero",
      ...normalizeTileOrder(parsed.tileOrder),
    ];

    return {
      backgroundImage:
        typeof parsed.backgroundImage === "string"
          ? parsed.backgroundImage
          : undefined,
      layoutOrder: normalizeLayoutOrder(
        parsed.layoutOrder ?? fallbackLayoutOrder,
      ),
    };
  } catch {
    return {};
  }
}

function saveProfilePagePrefs(userId: string, prefs: ProfilePagePrefs) {
  if (typeof window === "undefined") return;

  try {
    const normalizedLayoutOrder = normalizeLayoutOrder(
      prefs.layoutOrder ?? ["hero", ...normalizeTileOrder(prefs.tileOrder)],
    );

    window.localStorage.setItem(
      getProfilePagePrefsStorageKey(userId),
      JSON.stringify({
        backgroundImage: prefs.backgroundImage || "",
        layoutOrder: normalizedLayoutOrder,
        tileOrder: normalizedLayoutOrder.filter(
          (itemId): itemId is TileId => itemId !== "hero",
        ),
      }),
    );
  } catch {
    // Ignore storage failures so profile editing keeps working.
  }
}

function buildProfileCode(displayName: string, username: string) {
  const rawCode = username.replace(/^@/, "") || displayName || "usr";
  return rawCode.slice(0, 3).toUpperCase();
}

function moveOrder<T>(order: T[], fromIndex: number, toIndex: number) {
  const nextOrder = [...order];
  const [movedItem] = nextOrder.splice(fromIndex, 1);

  nextOrder.splice(toIndex, 0, movedItem);
  return nextOrder;
}

type MetricTileProps = {
  tile: ProfileMetricTile;
  isDragging: boolean;
  registerNode: (itemId: LayoutItemId, node: HTMLElement | null) => void;
  dragStyle?: CSSProperties;
  onPointerDown: (
    itemId: LayoutItemId,
    event: React.PointerEvent<HTMLElement>,
  ) => void;
};

function SortableMetricTile({
  tile,
  isDragging,
  registerNode,
  dragStyle,
  onPointerDown,
}: MetricTileProps) {
  return (
    <article
      ref={(node) => registerNode(tile.id, node)}
      data-tile-id={tile.id}
      data-layout-id={tile.id}
      style={dragStyle}
      className={[
        styles.metricTile,
        styles[`tone-${tile.tone}`],
        isDragging ? styles.metricTileDragging : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`بلاطة ${tile.label}`}
      onPointerDown={(event) => onPointerDown(tile.id, event)}
    >
      <div className={styles.metricFace}>
        {tile.sticker ? (
          <span
            className={`${styles.metricSticker} ${tile.id === "likes-blue" ? styles.metricStickerBlue : ""}`}
          >
            {tile.sticker}
          </span>
        ) : (
          <span className={styles.metricIconWrap}>{tile.icon}</span>
        )}
        <strong className={styles.metricValue}>{tile.value}</strong>
        <span className={styles.metricLabel}>{tile.label}</span>
      </div>
    </article>
  );
}

export default function ProfilePage({
  onSignOut,
  onOpenAdmin,
  canOpenAdmin = false,
  xPosts = [],
}: Props) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { getVerification } = useVerificationRegistry();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const sliderGrabOffsetRef = useRef(26);
  const layoutOrderRef = useRef<LayoutItemId[]>(DEFAULT_LAYOUT_ORDER);
  const suppressHeroClickRef = useRef(false);
  const activeLayoutItemIdRef = useRef<LayoutItemId | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragStartedRef = useRef(false);
  const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const tileDragCleanupRef = useRef<(() => void) | null>(null);
  const layoutNodeMapRef = useRef<
    Partial<Record<LayoutItemId, HTMLElement | null>>
  >({});

  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [msg, setMsg] = useState("");

  const [pageBackground, setPageBackground] = useState("");
  const [layoutOrder, setLayoutOrder] =
    useState<LayoutItemId[]>(DEFAULT_LAYOUT_ORDER);
  const [currentUserPosts, setCurrentUserPosts] = useState<XPost[]>([]);
  const [followCounts, setFollowCounts] = useState<{
    followers: number;
    following: number;
  } | null>(null);
  const [editBackground, setEditBackground] = useState("");

  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAvatarFrameEnabled, setEditAvatarFrameEnabled] = useState(false);
  const [sliderProgress, setSliderProgress] = useState(0);
  const [sliderDragging, setSliderDragging] = useState(false);
  const [draggingLayoutItemId, setDraggingLayoutItemId] =
    useState<LayoutItemId | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const rawEmail = profile?.email ?? user?.email ?? "";
  const displayName =
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    rawEmail.split("@")[0] ??
    "مستخدم";
  const username =
    normalizeHandle(profile?.username ?? user?.user_metadata?.username) ??
    buildXHandle(displayName);
  const bio = profile?.bio ?? user?.user_metadata?.bio ?? "";
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
  const currentUserVerification = getVerification(user?.id);
  const currentUserVerificationBadge = currentUserVerification?.badge ?? null;
  const profileCode = buildProfileCode(displayName, username);
  const userMetadata = user?.user_metadata as
    | Record<string, unknown>
    | undefined;
  const legacyCurrentUserPosts = useMemo(
    () => normalizeXPosts(user?.user_metadata?.x_posts) ?? [],
    [user?.user_metadata?.x_posts],
  );
  const currentEmailName = rawEmail.split("@")[0]?.trim() || null;
  const currentEmailHandle = currentEmailName ? `@${currentEmailName}` : null;
  const currentEmailGeneratedHandle = currentEmailName
    ? buildXHandle(currentEmailName)
    : null;
  const existingDisplayNameAliases = useMemo(
    () =>
      Array.isArray(user?.user_metadata?.x_display_name_aliases)
        ? user.user_metadata.x_display_name_aliases.filter(
            (value: unknown): value is string => typeof value === "string",
          )
        : [],
    [user?.user_metadata?.x_display_name_aliases],
  );
  const existingHandleAliases = useMemo(
    () =>
      Array.isArray(user?.user_metadata?.x_handle_aliases)
        ? user.user_metadata.x_handle_aliases.filter(
            (value: unknown): value is string => typeof value === "string",
          )
        : [],
    [user?.user_metadata?.x_handle_aliases],
  );
  const metricDisplayNameAliases = useMemo(
    () => uniqueNonEmptyStrings([displayName, ...existingDisplayNameAliases]),
    [displayName, existingDisplayNameAliases],
  );
  const metricHandleAliases = useMemo(
    () =>
      uniqueNonEmptyStrings([
        username,
        currentEmailHandle,
        currentEmailGeneratedHandle,
        ...existingHandleAliases,
      ]),
    [
      currentEmailGeneratedHandle,
      currentEmailHandle,
      existingHandleAliases,
      username,
    ],
  );
  const liveCurrentUserPosts = useMemo(
    () =>
      xPosts.filter((post) => {
        const trimmedUser = post.user.trim();
        const trimmedHandle = post.handle.trim();

        return (
          post.authorId === user?.id ||
          metricDisplayNameAliases.includes(trimmedUser) ||
          metricHandleAliases.includes(trimmedHandle)
        );
      }),
    [metricDisplayNameAliases, metricHandleAliases, user?.id, xPosts],
  );
  const metricPosts = liveCurrentUserPosts.length
    ? liveCurrentUserPosts
    : currentUserPosts.length
      ? currentUserPosts
      : legacyCurrentUserPosts;

  const profileMetrics = useMemo(() => {
    const totals = {
      followers:
        followCounts?.followers ??
        resolveMetadataCount(userMetadata, [
          "followers_count",
          "followersCount",
          "followers",
          "follower_count",
          "followerCount",
        ]),
      following:
        followCounts?.following ??
        resolveMetadataCount(userMetadata, [
          "following_count",
          "followingCount",
          "following",
          "follows_count",
          "followsCount",
        ]),
      likes: 0,
      shares: 0,
      reposts: 0,
      comments: 0,
      tools: 5 + (canOpenAdmin && onOpenAdmin ? 1 : 0),
    };

    metricPosts.forEach((post) => {
      totals.likes += post.stats.likes;
      totals.reposts += post.stats.retweets;
      totals.shares += post.stats.shares ?? 0;
      totals.comments += Math.max(
        post.stats.replies,
        post.comments?.length ?? 0,
      );
    });

    return totals;
  }, [canOpenAdmin, followCounts, metricPosts, onOpenAdmin, userMetadata]);

  const profileTiles = useMemo<Record<TileId, ProfileMetricTile>>(
    () => ({
      "comments-outline": {
        id: "comments-outline",
        label: "المتابعون",
        value: formatMetricValue(profileMetrics.followers),
        tone: "white",
        icon: <Users size={18} strokeWidth={1.8} />,
      },
      "likes-follow": {
        id: "likes-follow",
        label: "يتابع",
        value: formatMetricValue(profileMetrics.following),
        tone: "white",
        icon: <UserRound size={18} strokeWidth={1.9} />,
      },
      "likes-blue": {
        id: "likes-blue",
        label: "اعجاب",
        value: formatMetricValue(profileMetrics.likes),
        tone: "blue",
        icon: <Heart size={18} fill="currentColor" strokeWidth={1.8} />,
      },
      "comments-green": {
        id: "comments-green",
        label: "تعليق",
        value: formatMetricValue(profileMetrics.comments),
        tone: "green",
        icon: <MessageCircleMore size={18} strokeWidth={1.9} />,
      },
      "share-amber": {
        id: "share-amber",
        label: "مشاركة",
        value: formatMetricValue(profileMetrics.shares),
        tone: "amber",
        icon: <Send size={18} strokeWidth={1.8} />,
      },
      "likes-red": {
        id: "likes-red",
        label: "إعادة نشر",
        value: formatMetricValue(profileMetrics.reposts),
        tone: "red",
        icon: <Repeat2 size={18} strokeWidth={2} />,
      },
      "repost-cyan": {
        id: "repost-cyan",
        label: "الأدوات",
        value: formatMetricValue(profileMetrics.tools),
        tone: "cyan",
        icon: <Shield size={18} strokeWidth={2} />,
      },
    }),
    [
      profileMetrics.comments,
      profileMetrics.followers,
      profileMetrics.following,
      profileMetrics.likes,
      profileMetrics.reposts,
      profileMetrics.shares,
      profileMetrics.tools,
    ],
  );

  const heroSubtitle = currentUserVerificationBadge
    ? `حساب موثق بالشارة ${getVerificationBadgeAccentLabel(currentUserVerificationBadge)}`
    : joinDate
      ? `عضو منذ ${joinDate}`
      : "اضغط لتعديل الملف الشخصي";

  const heroText = bio || location || "تغيير الخلفية وتعديل الملف الشخصي";

  const phoneShellStyle: CSSProperties | undefined = pageBackground
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(1, 5, 15, 0.44), rgba(1, 5, 15, 0.84)), url("${pageBackground}")`,
      }
    : undefined;

  const sliderStyle = {
    "--slider-progress": sliderProgress.toString(),
  } as CSSProperties;

  useEffect(() => {
    const prefs = loadProfilePagePrefs(user?.id);
    setPageBackground(prefs.backgroundImage ?? "");
    setLayoutOrder(normalizeLayoutOrder(prefs.layoutOrder));

    if (!user?.id) {
      setCurrentUserPosts([]);
      setFollowCounts(null);
      return;
    }

    let cancelled = false;

    void loadProfilePrefsFromDatabase(user.id)
      .then((databasePrefs) => {
        if (!databasePrefs || cancelled) return;

        setPageBackground(databasePrefs.backgroundImage ?? "");
        setLayoutOrder(normalizeLayoutOrder(databasePrefs.layoutOrder));
        saveProfilePagePrefs(user.id, {
          backgroundImage: databasePrefs.backgroundImage,
          layoutOrder: normalizeLayoutOrder(databasePrefs.layoutOrder),
        });
      })
      .catch(() => {
        // Keep local fallback when table data is unavailable.
      });

    void fetchXPostsFromDatabase(user.id)
      .then((databasePosts) => {
        if (cancelled) return;

        setCurrentUserPosts(
          databasePosts.filter((post) => post.authorId === user.id),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setCurrentUserPosts([]);
      });

    void loadFollowCountsFromDatabase(user.id)
      .then((counts) => {
        if (cancelled) return;
        setFollowCounts(counts);
      })
      .catch(() => {
        if (cancelled) return;
        setFollowCounts(null);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    layoutOrderRef.current = layoutOrder;
  }, [layoutOrder]);

  useEffect(
    () => () => {
      tileDragCleanupRef.current?.();
    },
    [],
  );

  const applyLayoutOrder = (nextOrder: LayoutItemId[]) => {
    const normalizedOrder = normalizeLayoutOrder(nextOrder);
    layoutOrderRef.current = normalizedOrder;
    setLayoutOrder(normalizedOrder);

    if (!user?.id) return;

    saveProfilePagePrefs(user.id, {
      backgroundImage: pageBackground,
      layoutOrder: normalizedOrder,
    });
    void saveProfilePrefsToDatabase(user.id, {
      backgroundImage: pageBackground,
      layoutOrder: normalizedOrder,
    }).catch(() => {
      // Keep local fallback when table writes fail.
    });
  };

  const registerLayoutNode = (
    itemId: LayoutItemId,
    node: HTMLElement | null,
  ) => {
    layoutNodeMapRef.current[itemId] = node;
  };

  const findLayoutItemAtPoint = (
    clientX: number,
    clientY: number,
    excludeItemId?: LayoutItemId,
  ) => {
    if (typeof document === "undefined") return null;

    const directLayoutItemId = document
      .elementsFromPoint(clientX, clientY)
      .map(
        (element) =>
          element.closest<HTMLElement>("[data-layout-id]")?.dataset.layoutId,
      )
      .find(
        (itemId): itemId is LayoutItemId =>
          isLayoutItemId(itemId) && itemId !== excludeItemId,
      );

    if (directLayoutItemId) {
      return directLayoutItemId;
    }

    return null;
  };

  const stopLayoutDrag = () => {
    activeLayoutItemIdRef.current = null;
    dragPointerIdRef.current = null;
    dragStartedRef.current = false;
    dragStartPointRef.current = null;
    tileDragCleanupRef.current?.();
    tileDragCleanupRef.current = null;
    setDraggingLayoutItemId(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleWindowPointerMove = (event: PointerEvent) => {
    if (dragPointerIdRef.current !== event.pointerId) return;

    const activeLayoutItemId = activeLayoutItemIdRef.current;
    const dragStartPoint = dragStartPointRef.current;
    if (!activeLayoutItemId || !dragStartPoint) return;

    const nextDragOffset = {
      x: event.clientX - dragStartPoint.x,
      y: event.clientY - dragStartPoint.y,
    };

    if (!dragStartedRef.current) {
      if (
        Math.hypot(nextDragOffset.x, nextDragOffset.y) <
        LAYOUT_DRAG_START_DISTANCE
      ) {
        return;
      }

      dragStartedRef.current = true;
      if (activeLayoutItemId === "hero") {
        suppressHeroClickRef.current = true;
      }
      setDraggingLayoutItemId(activeLayoutItemId);
    }

    setDragOffset(nextDragOffset);

    const overLayoutItemId = findLayoutItemAtPoint(
      event.clientX,
      event.clientY,
      activeLayoutItemId,
    );
    if (!overLayoutItemId) return;

    const currentOrder = layoutOrderRef.current;
    const activeIndex = currentOrder.indexOf(activeLayoutItemId);
    const overIndex = currentOrder.indexOf(overLayoutItemId);

    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
      return;
    }

    applyLayoutOrder(moveOrder(currentOrder, activeIndex, overIndex));
  };

  const handleWindowPointerEnd = (event: PointerEvent) => {
    if (dragPointerIdRef.current !== event.pointerId) return;
    if (activeLayoutItemIdRef.current === "hero" && !dragStartedRef.current) {
      suppressHeroClickRef.current = false;
    }
    stopLayoutDrag();
  };

  const handleLayoutPointerDown = (
    itemId: LayoutItemId,
    event: React.PointerEvent<HTMLElement>,
  ) => {
    if (event.button !== 0) return;

    if (itemId !== "hero") {
      event.preventDefault();
    }

    tileDragCleanupRef.current?.();
    activeLayoutItemIdRef.current = itemId;
    dragPointerIdRef.current = event.pointerId;
    dragStartedRef.current = false;
    dragStartPointRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
    if (itemId === "hero") {
      suppressHeroClickRef.current = false;
    }
    setDraggingLayoutItemId(null);
    setDragOffset({ x: 0, y: 0 });

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);

    tileDragCleanupRef.current = () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  };

  const openEdit = () => {
    setEditName(displayName);
    setEditBio(bio);
    setEditPhone(profile?.phone ?? "");
    setEditLocation(location);
    setEditAvatarFrameEnabled(avatarFrameEnabled);
    setEditBackground(pageBackground);
    setMsg("");
    setShowEdit(true);
  };

  const handleHeroClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressHeroClickRef.current) {
      suppressHeroClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    openEdit();
  };

  const saveEdit = async () => {
    if (!user) return;

    const nextDisplayName = editName.trim() || displayName;
    const currentProfileHandle =
      normalizeHandle(profile?.username ?? user.user_metadata?.username) ??
      buildXHandle(displayName);
    const nextProfileHandle =
      normalizeHandle(profile?.username ?? user.user_metadata?.username) ??
      buildXHandle(nextDisplayName);
    const nextDisplayNameAliases = uniqueNonEmptyStrings([
      displayName,
      nextDisplayName,
      ...existingDisplayNameAliases,
    ]);
    const nextHandleAliases = uniqueNonEmptyStrings([
      currentProfileHandle,
      nextProfileHandle,
      currentEmailHandle,
      currentEmailGeneratedHandle,
      ...existingHandleAliases,
    ]);

    const nextBackground = editBackground.trim();

    saveProfilePagePrefs(user.id, {
      backgroundImage: nextBackground,
      layoutOrder,
    });
    void saveProfilePrefsToDatabase(user.id, {
      backgroundImage: nextBackground,
      layoutOrder,
    }).catch(() => {
      // Keep local fallback when table writes fail.
    });
    setPageBackground(nextBackground);

    setSaving(true);
    const { error: profileSaveError } = await saveUserProfileFields(user.id, {
      full_name: nextDisplayName || null,
      bio: editBio.trim() || null,
      phone: editPhone.trim() || null,
      location: editLocation.trim() || null,
      username: nextProfileHandle,
      avatar_frame_enabled: editAvatarFrameEnabled,
    });

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        full_name: nextDisplayName,
        name: nextDisplayName,
        username: nextProfileHandle,
        handle: nextProfileHandle,
        bio: editBio.trim() || null,
        phone: editPhone.trim() || null,
        location: editLocation.trim() || null,
        avatar_frame_enabled: editAvatarFrameEnabled,
        x_display_name_aliases: nextDisplayNameAliases,
        x_handle_aliases: nextHandleAliases,
      },
    });

    setSaving(false);
    if (authError) {
      setMsg("خطأ: " + authError.message);
      return;
    }

    await Promise.allSettled([
      replaceUserAliasesInDatabase(
        user.id,
        nextDisplayNameAliases,
        nextHandleAliases,
      ),
      updateXIdentityInDatabase({
        userId: user.id,
        displayName: nextDisplayName,
        handle: nextProfileHandle,
      }),
      updateTikTokIdentityInDatabase({
        userId: user.id,
        creatorName: nextDisplayName,
        creatorHandle: nextProfileHandle,
        creatorAvatarUrl: avatarUrl,
        creatorAvatarFrameEnabled: editAvatarFrameEnabled,
      }),
    ]);

    if (profileSaveError) {
      console.warn(
        "Profile DB save failed; auth metadata save succeeded",
        profileSaveError,
      );
    }

    try {
      const [databasePosts, counts] = await Promise.all([
        fetchXPostsFromDatabase(user.id),
        loadFollowCountsFromDatabase(user.id),
      ]);
      setCurrentUserPosts(
        databasePosts.filter((post) => post.authorId === user.id),
      );
      setFollowCounts(counts);
    } catch {
      // Ignore linked data refresh failures after save.
    }

    await refreshProfile();
    setShowEdit(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 15 * 1024 * 1024) {
      setMsg("الصورة أكبر من 15MB");
      return;
    }

    setUploadingAvatar(true);
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
        await saveUserProfileFields(user.id, {
          avatar_url: dataUrl,
        }).catch(() => {
          // Keep auth metadata as fallback if the profile row update fails.
        });
        await updateTikTokIdentityInDatabase({
          userId: user.id,
          creatorName: displayName,
          creatorHandle: username,
          creatorAvatarUrl: dataUrl,
          creatorAvatarFrameEnabled: avatarFrameEnabled,
        }).catch(() => {
          // Ignore TikTok identity refresh failures and keep profile updates.
        });
        await refreshProfile();
        setMsg("تم تحديث الصورة ✅");
        setTimeout(() => setMsg(""), 3000);
      }
    } catch {
      setMsg("فشل معالجة الصورة");
    }

    setUploadingAvatar(false);
    e.target.value = "";
  };

  const handleBackgroundChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setMsg("الخلفية أكبر من 15MB");
      return;
    }

    setUploadingBackground(true);
    setMsg("جاري تجهيز الخلفية...");

    try {
      const dataUrl = await resizeImage(file, 1100, 0.78);
      setEditBackground(dataUrl);
      setMsg("تم تحديث الخلفية ✅");
    } catch {
      setMsg("فشل تجهيز الخلفية");
    }

    setUploadingBackground(false);
    e.target.value = "";
  };

  const updateSliderProgress = (clientX: number) => {
    const track = sliderTrackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const handleWidth = 52;
    const padding = 6;
    const maxOffset = rect.width - handleWidth - padding * 2;
    const nextOffset = Math.max(
      0,
      Math.min(
        maxOffset,
        clientX - rect.left - padding - sliderGrabOffsetRef.current,
      ),
    );

    setSliderProgress(maxOffset > 0 ? nextOffset / maxOffset : 0);
  };

  const handleSliderPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (signingOut) return;

    const thumbRect = e.currentTarget.getBoundingClientRect();
    sliderGrabOffsetRef.current = Math.max(
      0,
      Math.min(thumbRect.width, e.clientX - thumbRect.left),
    );
    e.currentTarget.setPointerCapture(e.pointerId);
    setSliderDragging(true);
    updateSliderProgress(e.clientX);
  };

  const handleSliderPointerMove = (
    e: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (!sliderDragging || signingOut) return;
    updateSliderProgress(e.clientX);
  };

  const handleSignOut = async () => {
    await signOut();
    onSignOut?.();
  };

  const handleSliderPointerUp = async (
    e: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (!sliderDragging) return;

    e.currentTarget.releasePointerCapture(e.pointerId);
    setSliderDragging(false);

    if (sliderProgress >= 0.82) {
      setSliderProgress(1);
      setSigningOut(true);

      try {
        await handleSignOut();
      } finally {
        setSigningOut(false);
        setSliderProgress(0);
      }

      return;
    }

    setSliderProgress(0);
  };

  const handleSliderPointerCancel = () => {
    setSliderDragging(false);
    setSliderProgress(0);
  };

  return (
    <main className={styles.page}>
      <div className={styles.pageOverlay} aria-hidden="true" />

      <section
        className={`${styles.phoneShell} ${pageBackground ? styles.phoneShellWithImage : ""}`}
        style={phoneShellStyle}
      >
        <section className={styles.tilesGrid}>
          {layoutOrder.map((itemId) => {
            const dragStyle =
              draggingLayoutItemId === itemId
                ? {
                    transform:
                      itemId === "hero"
                        ? `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.02)`
                        : `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.05)`,
                    zIndex: 6,
                  }
                : undefined;

            if (itemId === "hero") {
              return (
                <button
                  key="hero"
                  ref={(node) => registerLayoutNode("hero", node)}
                  data-layout-id="hero"
                  type="button"
                  className={`${styles.profileHero} ${styles.profileHeroTile} ${draggingLayoutItemId === "hero" ? styles.profileHeroDragging : ""}`}
                  style={dragStyle}
                  onClick={handleHeroClick}
                  onPointerDown={(event) =>
                    handleLayoutPointerDown("hero", event)
                  }
                >
                  <div className={styles.heroCopy}>
                    <div className={styles.heroHeader}>
                      <h2 className={styles.heroTitle}>الملف الشخصي</h2>
                      {currentUserVerificationBadge && (
                        <VerificationBadge
                          size="sm"
                          variant={currentUserVerificationBadge}
                        />
                      )}
                    </div>
                    <p className={styles.heroSubtitle}>{heroSubtitle}</p>
                    <div className={styles.heroDocIcon}>
                      <IdCardLanyard size={34} strokeWidth={1.8} />
                    </div>
                    <p className={styles.heroHint}>{heroText}</p>
                  </div>

                  <div className={styles.heroBadgeSide}>
                    <div className={styles.heroBadgeOrb}>
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="avatar"
                          className={styles.heroAvatar}
                        />
                      ) : (
                        <UserRound size={34} strokeWidth={1.9} />
                      )}
                    </div>
                    <div className={styles.heroCodeRow}>
                      <span className={styles.heroCode}>{profileCode}</span>
                    </div>
                  </div>
                </button>
              );
            }

            return (
              <SortableMetricTile
                key={itemId}
                tile={profileTiles[itemId]}
                isDragging={draggingLayoutItemId === itemId}
                registerNode={registerLayoutNode}
                dragStyle={dragStyle}
                onPointerDown={handleLayoutPointerDown}
              />
            );
          })}
        </section>

        <div className={styles.sliderSection}>
          <div
            className={styles.sliderTrack}
            ref={sliderTrackRef}
            style={sliderStyle}
          >
            <div className={styles.sliderGlow} aria-hidden="true" />
            <span className={styles.sliderLabel}>
              {signingOut ? "جاري تسجيل الخروج..." : "اسحب الشريط"}
            </span>
            <button
              type="button"
              className={styles.sliderThumb}
              onPointerDown={handleSliderPointerDown}
              onPointerMove={handleSliderPointerMove}
              onPointerUp={handleSliderPointerUp}
              onPointerCancel={handleSliderPointerCancel}
              disabled={signingOut}
            >
              <Power size={22} strokeWidth={2.1} />
            </button>
          </div>
        </div>
      </section>

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

            <div className={styles.modalAvatarWrap}>
              <div className={styles.modalAvatarRow}>
                <button
                  type="button"
                  className={styles.modalAvatarBtn}
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
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
                      {uploadingAvatar ? (
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
                {canOpenAdmin && onOpenAdmin && (
                  <button
                    type="button"
                    className={styles.adminQuickBtn}
                    onClick={onOpenAdmin}
                  >
                    <Shield size={16} />
                    الأدمن
                  </button>
                )}
              </div>
              <p className={styles.changePhotoHint}>اضغط لتغيير الصورة</p>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleBackgroundChange}
            />

            {msg && <p className={styles.modalMsg}>{msg}</p>}

            <div className={styles.backgroundSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h4>خلفية الصفحة</h4>
                  <p>الخلفية الافتراضية كحلي داكن ويمكن استبدالها بصورة.</p>
                </div>
              </div>
              <div
                className={`${styles.backgroundPreview} ${editBackground ? styles.backgroundPreviewImage : ""}`}
                style={
                  editBackground
                    ? {
                        backgroundImage: `linear-gradient(180deg, rgba(1, 5, 15, 0.34), rgba(1, 5, 15, 0.74)), url("${editBackground}")`,
                      }
                    : undefined
                }
              >
                <span>
                  {editBackground
                    ? "معاينة الخلفية الحالية"
                    : "خلفية كحلية افتراضية"}
                </span>
              </div>
              <div className={styles.backgroundActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => backgroundInputRef.current?.click()}
                  disabled={uploadingBackground}
                >
                  {uploadingBackground ? "..." : "رفع صورة"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setEditBackground("")}
                >
                  الخلفية الافتراضية
                </button>
              </div>
            </div>

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
              <label className={styles.fieldWrap}>
                <span className={styles.fieldLabel}>رابط الخلفية</span>
                <input
                  className={styles.fieldInput}
                  value={editBackground}
                  onChange={(e) => setEditBackground(e.target.value)}
                  placeholder="https://example.com/background.jpg"
                  dir="ltr"
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
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > maxSize) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          }
        } else if (h > maxSize) {
          w = Math.round((w * maxSize) / h);
          h = maxSize;
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
