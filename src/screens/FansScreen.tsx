import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import type { FanClubId, Post } from "../app.types";
import XFeedHeader from "../components/XFeedHeader";
import { XPostCard } from "./x-feed/XPostCard";
import type { FansCommunityPost } from "./fans/FansCommunityFeed";
import {
  createFansPost,
  listFansPostsByClub,
  subscribeToAppwriteCollection,
  APPWRITE_CONFIG,
} from "../lib/appwrite";
import { FAN_CLUBS, LEAGUES } from "../app.data";
import { PullToRefreshScrollView } from "../components/PullToRefreshScrollView";
import { createCompatStyleSheet } from "../lib/crossPlatformStyles";
import FansAssociationHero, { FansCheerSwipeButton } from "./fans/FansAssociationHero";
import FansCommunityFeed from "./fans/FansCommunityFeed";
import FansLeaguesGrid from "./fans/FansLeaguesGrid";
import { resolveLeadingFanClub } from "./fans/fans.leader";
import {
  FANS_FEED_TOP_PADDING,
  FANS_SCROLL_BOTTOM_PADDING,
  FANS_STICKY_HEADER_TOP,
  FANS_TONGUE_ENABLED,
  FANS_TONGUE_RESERVED_HEIGHT,
} from "./fans/fans.layout.constants";
import FansSupportTongue, {
  type FansSupportTongueHandle,
} from "./fans/FansSupportTongue";
type FansScreenProps = {
  isLoggedIn: boolean;
  supporters: Record<FanClubId, number>;
  supportedTeams: FanClubId[];
  userLeagueClub: string;
  userDisplayName?: string;
  userVarId?: string;
  userAvatarUri?: string;
  userIsVerified?: boolean;
  onRequireAuth: (message?: string) => void;
  onToggleSupport: (clubId: FanClubId) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  posts?: Post[];
  onTogglePostLike?: (postId: number) => void;
  onTogglePostRepost?: (postId: number) => void;
  onSharePost?: (postId: number) => Promise<boolean>;
  onSubmitPostReply?: (postId: number, text: string) => void;
  onCreatePost?: () => void;
  currentUserVarId?: string;
  currentUserDisplayName?: string;
  currentUserAvatarUri?: string;
};

/**
 * صفحة الرابطة:
 * 1) هيدر ثابت: اللسان + شعار/رابطة/شجع
 * 2) تعليقات تمرّر تحته وتختفي من الأسفل
 * 3) شريط الكتابة أسفل الشاشة
 */
export default function FansScreen(props: FansScreenProps) {
  const { width: windowWidth } = useWindowDimensions();
  const tongueRef = useRef<FansSupportTongueHandle>(null);
  const [isTongueExpanded, setIsTongueExpanded] = useState(false);
  const [showMyRooms, setShowMyRooms] = useState(false);
  const [showClubDropdown, setShowClubDropdown] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showAllClubsDropdown, setShowAllClubsDropdown] = useState(false);
  const allClubsAnim = useRef(new Animated.Value(0)).current;

  const openAllClubsDropdown = () => {
    setShowAllClubsDropdown(true);
    Animated.spring(allClubsAnim, { toValue: 1, damping: 20, stiffness: 280, useNativeDriver: true }).start();
  };

  const closeAllClubsDropdown = () => {
    Animated.timing(allClubsAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setShowAllClubsDropdown(false)
    );
  };
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [activeSheetTab, setActiveSheetTab] = useState<'posts'|'likes'|'reposts'>('posts');
  const [headerHeight, setHeaderHeight] = useState(0);
  const [avatarBottom, setAvatarBottom] = useState(0);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const menuItemAnims = useRef([0,1,2,3,4,5].map(() => new Animated.Value(0))).current;

  const openAvatarMenu = () => {
    setShowAvatarMenu(true);
    Animated.stagger(60, menuItemAnims.map((a) =>
      Animated.spring(a, { toValue: 1, damping: 18, stiffness: 260, useNativeDriver: true })
    )).start();
  };

  const closeAvatarMenu = () => {
    Animated.parallel(menuItemAnims.map((a) =>
      Animated.timing(a, { toValue: 0, duration: 150, useNativeDriver: true })
    )).start(() => setShowAvatarMenu(false));
  };

  const openProfileSheet = (tab: 'posts'|'likes'|'reposts' = 'posts') => {
    closeAvatarMenu();
    setActiveSheetTab(tab);
    setShowProfileSheet(true);
    Animated.spring(sheetAnim, { toValue: 1, damping: 22, stiffness: 300, useNativeDriver: true }).start();
  };

  const closeProfileSheet = () => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setShowProfileSheet(false)
    );
  };
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const openDropdown = () => {
    setShowClubDropdown(true);
    Animated.spring(dropdownAnim, {
      toValue: 1,
      damping: 20,
      stiffness: 280,
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowClubDropdown(false));
  };

  const defaultUserClub = useMemo(() => {
    if (!props.userLeagueClub?.trim()) return null;
    try {
      const parsed = JSON.parse(props.userLeagueClub) as Record<string, string>;
      const firstClubName = Object.values(parsed).find(Boolean);
      if (!firstClubName) return null;
      const club = FAN_CLUBS.find(
        (c) => c.title.trim() === firstClubName.trim() || c.id.trim() === firstClubName.trim()
      );
      return club || null;
    } catch {
      return null;
    }
  }, [props.userLeagueClub]);

  const [activeClubId, setActiveClubId] = useState<FanClubId | null>(defaultUserClub?.id ?? null);
  const [activeLeagueId, setActiveLeagueId] = useState<string>(defaultUserClub?.leagueId ?? "saudi");
  const [showLeagueMenu, setShowLeagueMenu] = useState(false);
  const [communityPosts, setCommunityPosts] = useState<FansCommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    if (activeClubId) {
      const club = FAN_CLUBS.find((c) => c.id === activeClubId);
      if (club?.leagueId && club.leagueId !== activeLeagueId) {
        setActiveLeagueId(club.leagueId);
      }
    }
  }, [activeClubId, activeLeagueId]);

  const activeRoomId = useMemo(() => {
    if (activeClubId) return activeClubId;
    return null;
  }, [activeClubId]);

  const formatTime = (iso: string) => {
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "الآن";
      if (mins < 60) return `قبل ${mins} دقيقة`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `قبل ${hrs} ساعة`;
      return `قبل ${Math.floor(hrs / 24)} يوم`;
    } catch {
      return "";
    }
  };

  const loadPosts = useCallback(async (clubId: string) => {
    setPostsLoading(true);
    try {
      const records = await listFansPostsByClub(clubId, 50);
      const posts: FansCommunityPost[] = records.map((r) => ({
        id: r.id,
        author: r.author,
        varId: r.varId,
        time: formatTime(r.createdAt),
        content: r.content,
        replyCount: 0,
        avatarUri: r.avatarUri || undefined,
        verified: r.verified,
      }));
      setCommunityPosts(posts);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeRoomId) {
      setCommunityPosts([]);
      return;
    }
    void loadPosts(activeRoomId);

    const unsubscribe = subscribeToAppwriteCollection(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.fansPostsCollectionId,
      (payload, events) => {
        const isCreate = events.some((e) => e.includes(".create"));
        if (!isCreate) return;
        const doc = payload as Record<string, unknown>;
        if (doc.clubId !== activeRoomId) return;
        const newPost: FansCommunityPost = {
          id: (doc.$id as string) || `rt-${Date.now()}`,
          author: (doc.author as string) || "",
          varId: (doc.varId as string) || "",
          time: "الآن",
          content: (doc.content as string) || "",
          replyCount: 0,
          avatarUri: (doc.avatarUri as string) || undefined,
          verified: Boolean(doc.verified),
        };
        setCommunityPosts((prev) => {
          if (prev.some((p) => p.id === newPost.id)) return prev;
          return [newPost, ...prev];
        });
      },
    );

    return () => { unsubscribe?.(); };
  }, [activeRoomId, loadPosts]);

  const handleSend = async (text: string) => {
    if (!activeRoomId) return;
    const optimistic: FansCommunityPost = {
      id: `opt-${Date.now()}`,
      author: props.userDisplayName || "مجهول",
      varId: props.userVarId || "",
      time: "الآن",
      content: text,
      replyCount: 0,
      avatarUri: props.userAvatarUri,
      verified: props.userIsVerified ?? false,
    };
    setCommunityPosts((prev) => [optimistic, ...prev]);
    const saved = await createFansPost({
      clubId: activeRoomId,
      varId: props.userVarId || "",
      author: props.userDisplayName || "مجهول",
      avatarUri: props.userAvatarUri || "",
      verified: props.userIsVerified ?? false,
      content: text,
    });
    if (saved) {
      setCommunityPosts((prev) =>
        prev.map((p) => p.id === optimistic.id ? { ...p, id: saved.id } : p)
      );
    }
  };

  const handleEnterClub = (clubId: FanClubId) => {
    tongueRef.current?.collapse();
    setActiveClubId(clubId);
  };

  const userFanClubs = useMemo<FanClubId[]>(() => {
    if (!props.userLeagueClub?.trim()) return [];
    try {
      const parsed = JSON.parse(props.userLeagueClub) as Record<string, string>;
      return Object.values(parsed).filter(Boolean) as FanClubId[];
    } catch {
      return [];
    }
  }, [props.userLeagueClub]);

  const myRoomClubs = useMemo(
    () => FAN_CLUBS.filter((c) =>
      userFanClubs.some(
        (name) => name.trim() === c.title.trim() || name.trim() === c.id.trim()
      )
    ),
    [userFanClubs],
  );

  const displayClubId = activeClubId ?? null;

  const canInteractInFeed = useMemo(() => {
    if (!props.isLoggedIn) return false;
    const targetId = displayClubId;
    if (!targetId) {
      const leader = resolveLeadingFanClub(props.supporters);
      if (!leader) return false;
      return userFanClubs.some(
        (name) =>
          name.trim() === leader.club.title.trim() ||
          name.trim() === leader.club.id.trim(),
      );
    }
    return userFanClubs.some(
      (name) => {
        const club = FAN_CLUBS.find((c) => c.id === targetId);
        return name.trim() === (club?.title.trim() ?? "") || name.trim() === targetId.trim();
      }
    );
  }, [props.isLoggedIn, displayClubId, props.supporters, userFanClubs]);

  const activeClubTitle = useMemo(() => {
    const clubName = displayClubId
      ? FAN_CLUBS.find((c) => c.id === displayClubId)?.title ?? ""
      : resolveLeadingFanClub(props.supporters)?.club.title ?? "";
    return clubName ? `رابطة ${clubName}` : "رابطتي";
  }, [displayClubId, props.supporters]);

  return (
    <View style={styles.root}>
      {/* هيدر FansFeed */}
      <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <XFeedHeader
          windowWidth={windowWidth}
          activeTab="timeline"
          onChangeTab={() => undefined}
          customTabLabel={activeClubTitle || "رابطتي"}
          showTabChevron
          onTabPress={() => showClubDropdown ? closeDropdown() : openDropdown()}
          avatarUri={props.userAvatarUri}
          onOpenAvatar={() => showAvatarMenu ? closeAvatarMenu() : openAvatarMenu()}
          onAvatarLayout={(y, h) => setAvatarBottom(y + h)}
          leftElement={
            displayClubId ? (
              <FansCheerSwipeButton
                clubId={displayClubId as FanClubId}
                isSupported={props.supportedTeams.includes(displayClubId as FanClubId)}
                alreadySupportingAnother={
                  !props.supportedTeams.includes(displayClubId as FanClubId) &&
                  props.supportedTeams.length > 0
                }
                isLoggedIn={props.isLoggedIn}
                onRequireAuth={props.onRequireAuth}
                onToggleSupport={props.onToggleSupport}
              />
            ) : null
          }
        />
      </View>

      {/* Backdrop يغلق الـ dropdown عند الضغط خارجه */}
      {showClubDropdown ? (
        <Pressable
          style={styles.clubDropdownBackdrop}
          onPress={closeDropdown}
        />
      ) : null}

      {/* Dropdown الأندية - فوق المحتوى */}
      {showClubDropdown ? (
        <Animated.View
          style={[
            styles.clubDropdown,
            {
              top: headerHeight,
              opacity: dropdownAnim,
              transform: [{
                translateY: dropdownAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 0],
                }),
              }],
            },
          ]}
        >
          {myRoomClubs.length === 0 ? (
            <Text style={styles.clubDropdownEmpty}>لم تشجّع أي نادٍ بعد</Text>
          ) : (
            myRoomClubs.map((club) => (
              <Pressable
                key={club.id}
                style={[
                  styles.clubDropdownItem,
                  activeClubId === club.id && styles.clubDropdownItemActive,
                ]}
                onPress={() => {
                  setActiveClubId(club.id as FanClubId);
                  closeDropdown();
                }}
              >
                <Text style={[
                  styles.clubDropdownItemText,
                  activeClubId === club.id && styles.clubDropdownItemTextActive,
                ]}>
                  {club.title}
                </Text>
                {activeClubId === club.id ? (
                  <Ionicons name="checkmark" size={15} color="#F4C565" />
                ) : null}
              </Pressable>
            ))
          )}
        </Animated.View>
      ) : null}

      {/* فيد المنشورات */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.screenContent}
      >
        {(props.posts ?? []).map((post) => (
          <XPostCard
            key={post.id}
            post={post}
            onOpen={() => undefined}
            onReply={() => undefined}
            onRepost={() => props.onTogglePostRepost?.(post.id)}
            onShare={() => props.onSharePost?.(post.id)}
            onLike={() => props.onTogglePostLike?.(post.id)}
            onOpenAuthor={() => undefined}
            onOpenActions={() => undefined}
          />
        ))}
        {(props.posts ?? []).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>لا توجد منشورات بعد</Text>
          </View>
        ) : null}
      </ScrollView>

      {isTongueExpanded ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="إغلاق قائمة الأندية"
          style={styles.tongueDismissBackdrop}
          onPress={() => tongueRef.current?.collapse()}
        />
      ) : null}

      {/* اللسان المنسدل - يظهر في الصفحة الرئيسية */}
      {FANS_TONGUE_ENABLED ? (
        <View style={styles.tongueHost} pointerEvents="box-none">
          <FansSupportTongue
            ref={tongueRef}
            supporters={props.supporters}
            supportedTeams={props.supportedTeams}
            isLoggedIn={props.isLoggedIn}
            onRequireAuth={props.onRequireAuth}
            onToggleSupport={props.onToggleSupport}
            activeLeagueId={activeLeagueId}
            onEnterClub={handleEnterClub}
            onExpandedChange={setIsTongueExpanded}
          />
        </View>
      ) : null}

      {/* الهيدر الثابت (رابطة الهلال + شجع + اللوقو) مخفي في الصفحة الرئيسية - يظهر في صفحة الرابطة فقط */}
      {false && (
        <View
          style={[
            styles.stickyHeaderHost,
            isTongueExpanded ? styles.stickyHeaderHostExpanded : null,
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.heroHost}>
            <FansAssociationHero
              supporters={props.supporters}
              supportedTeams={props.supportedTeams}
              isLoggedIn={props.isLoggedIn}
              onRequireAuth={props.onRequireAuth}
              onToggleSupport={props.onToggleSupport}
              overrideClubId={displayClubId ?? undefined}
              onTitlePress={myRoomClubs.length > 0 && props.isLoggedIn ? () => setShowMyRooms((v) => !v) : undefined}
              onDotsPress={() => setShowLeagueMenu((v) => !v)}
            />
            {isTongueExpanded ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="إغلاق قائمة الأندية"
                style={styles.heroDismissOverlay}
                onPress={() => tongueRef.current?.collapse()}
              />
            ) : null}
          </View>
        </View>
      )}

      {showLeagueMenu ? (
        <Pressable
          style={styles.leagueMenuBackdrop}
          onPress={() => setShowLeagueMenu(false)}
          accessibilityRole="button"
          accessibilityLabel="إغلاق"
        >
          <View style={styles.leagueMenuPanel}>
            {LEAGUES.map((league) => (
              <Pressable
                key={league.id}
                style={[styles.leagueMenuItem, activeLeagueId === league.id && styles.leagueMenuItemActive]}
                onPress={() => { setActiveLeagueId(league.id); setShowLeagueMenu(false); setActiveClubId(null); }}
              >
                <Text style={[styles.leagueMenuItemText, activeLeagueId === league.id && styles.leagueMenuItemTextActive]}>
                  {league.name}
                </Text>
                {activeLeagueId === league.id ? (
                  <Ionicons name="checkmark" size={16} color="#F4C565" />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      ) : null}

      {showMyRooms && myRoomClubs.length > 0 ? (
        <Pressable
          style={styles.myRoomsBackdrop}
          onPress={() => setShowMyRooms(false)}
          accessibilityRole="button"
          accessibilityLabel="إغلاق"
        >
          <View style={styles.myRoomsPanel}>
            {myRoomClubs.map((club) => (
              <Pressable
                key={club.id}
                style={[styles.myRoomItem, activeClubId === club.id && styles.myRoomItemActive]}
                onPress={() => { setActiveClubId(club.id); setShowMyRooms(false); }}
              >
                <Ionicons
                  name="football"
                  size={15}
                  color={activeClubId === club.id ? "#F4C565" : "rgba(255,255,255,0.75)"}
                />
                <Text style={[styles.myRoomItemText, activeClubId === club.id && styles.myRoomItemTextActive]}>
                  {club.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      ) : null}

      {/* مربع الدردشة المحذوف - سيعاد في صفحة الرابطة الداخلية */}

      {/* درج الأيقونات - ينزلق من خلف الأفاتار للداخل */}
      {showAvatarMenu ? (
        <>
          <Pressable style={styles.menuBackdrop} onPress={closeAvatarMenu} />
          {([
            { icon: 'trophy-outline',        label: 'الدوري',      action: () => { closeAvatarMenu(); openAllClubsDropdown(); } },
            { icon: 'notifications-outline', label: 'إشعارات',  action: () => closeAvatarMenu() },
            { icon: 'document-text-outline', label: 'منشوراتي', action: () => openProfileSheet('posts') },
            { icon: 'chatbubble-outline',    label: 'تعليقات',   action: () => openProfileSheet('posts') },
            { icon: 'heart-outline',         label: 'إعجاباتي', action: () => openProfileSheet('likes') },
            { icon: 'repeat-outline',        label: 'إعادة نشر',  action: () => openProfileSheet('reposts') },
          ]).map((item, i) => (
            <Animated.View
              key={i}
              style={[
                styles.menuItem,
                { top: avatarBottom + 6 + i * 44 },
                {
                  opacity: menuItemAnims[i],
                  transform: [{ translateY: menuItemAnims[i].interpolate({ inputRange: [0,1], outputRange: [-20, 0] }) }],
                },
              ]}
            >
              <Pressable style={styles.menuIconBtn} onPress={item.action}>
                <Ionicons name={item.icon as any} size={20} color="#FFFFFF" />
                <Text style={styles.menuIconLabel}>{item.label}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </>
      ) : null}

      {/* dropdown كل الأندية - يفتح من زر الدوري */}
      {showAllClubsDropdown ? (
        <>
          <Pressable style={styles.sheetBackdrop} onPress={closeAllClubsDropdown} />
          <Animated.View
            style={[
              styles.sheetPanel,
              {
                opacity: allClubsAnim,
                transform: [{ scale: allClubsAnim.interpolate({ inputRange: [0,1], outputRange: [0.94, 1] }) }],
              },
            ]}
          >
            <Pressable style={styles.sheetCloseBtn} onPress={closeAllClubsDropdown}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
            <Text style={styles.allClubsTitle}>اختر الدوري</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {FAN_CLUBS.map((club) => (
                <Pressable
                  key={club.id}
                  style={[
                    styles.allClubsItem,
                    activeClubId === club.id && styles.allClubsItemActive,
                  ]}
                  onPress={() => {
                    setActiveClubId(club.id as FanClubId);
                    closeAllClubsDropdown();
                  }}
                >
                  <Text style={[
                    styles.allClubsItemText,
                    activeClubId === club.id && styles.allClubsItemTextActive,
                  ]}>
                    {club.title}
                  </Text>
                  {activeClubId === club.id ? (
                    <Ionicons name="checkmark-circle" size={18} color="#F4C565" />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </>
      ) : null}

      {/* الصفحة المنبثقة */}
      {showProfileSheet ? (
        <>
          <Pressable style={styles.sheetBackdrop} onPress={closeProfileSheet} />
          <Animated.View
            style={[
              styles.sheetPanel,
              {
                opacity: sheetAnim,
                transform: [{ scale: sheetAnim.interpolate({ inputRange: [0,1], outputRange: [0.94, 1] }) }],
              },
            ]}
          >
            <Pressable style={styles.sheetCloseBtn} onPress={closeProfileSheet}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>

            <View style={styles.sheetHeader}>
              {props.userAvatarUri ? (
                <Image source={{ uri: props.userAvatarUri }} style={styles.sheetAvatar} resizeMode="cover" />
              ) : (
                <View style={[styles.sheetAvatar, styles.sheetAvatarPlaceholder]}>
                  <Ionicons name="person" size={28} color="rgba(255,255,255,0.5)" />
                </View>
              )}
              <Text style={styles.sheetDisplayName}>{props.userDisplayName || props.userVarId || "مستخدم"}</Text>
              {props.userVarId ? <Text style={styles.sheetVarId}>@{props.userVarId}</Text> : null}
            </View>

            {/* تابات */}
            <View style={styles.sheetTabs}>
              {(['posts','likes','reposts'] as const).map((tab) => (
                <Pressable key={tab} style={[styles.sheetTab, activeSheetTab === tab && styles.sheetTabActive]} onPress={() => setActiveSheetTab(tab)}>
                  <Text style={[styles.sheetTabText, activeSheetTab === tab && styles.sheetTabTextActive]}>
                    {tab === 'posts' ? 'منشوراتي' : tab === 'likes' ? 'إعجاباتي' : 'إعادة نشر'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ScrollView style={styles.sheetPostsScroll} showsVerticalScrollIndicator={false}>
              {(activeSheetTab === 'posts'
                ? (props.posts ?? []).filter((p) => p.authorId === props.userVarId)
                : activeSheetTab === 'likes'
                ? (props.posts ?? []).filter((p) => p.likedByMe)
                : (props.posts ?? []).filter((p) => p.repostedByMe)
              ).slice(0, 20).map((post) => (
                <View key={post.id} style={styles.sheetPostItem}>
                  <Text style={styles.sheetPostText} numberOfLines={2}>{post.content}</Text>
                  <View style={styles.sheetPostMeta}>
                    <Ionicons name="heart" size={12} color="rgba(255,255,255,0.35)" />
                    <Text style={styles.sheetPostMetaText}>{post.likes}</Text>
                    <Ionicons name="chatbubble-outline" size={12} color="rgba(255,255,255,0.35)" style={{ marginRight: 8 }} />
                    <Text style={styles.sheetPostMetaText}>{post.replies}</Text>
                  </View>
                </View>
              ))}
              {(activeSheetTab === 'posts'
                ? (props.posts ?? []).filter((p) => p.authorId === props.userVarId)
                : activeSheetTab === 'likes'
                ? (props.posts ?? []).filter((p) => p.likedByMe)
                : (props.posts ?? []).filter((p) => p.repostedByMe)
              ).length === 0 ? (
                <Text style={styles.sheetEmpty}>لا يوجد محتوى بعد</Text>
              ) : null}
            </ScrollView>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

const styles = createCompatStyleSheet({
  root: {
    flex: 1,
    backgroundColor: "#000000",
    position: "relative",
    overflow: "hidden",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#000000",
    zIndex: 1,
  },
  tongueDismissBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    backgroundColor: "transparent",
  },
  stickyHeaderHost: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 25,
    backgroundColor: "transparent",
    overflow: "visible",
  },
  stickyHeaderHostExpanded: {
    zIndex: 35,
  },
  heroHost: {
    position: "relative",
    zIndex: 1,
    backgroundColor: "#000000",
    paddingTop:
      FANS_STICKY_HEADER_TOP +
      (FANS_TONGUE_ENABLED ? FANS_TONGUE_RESERVED_HEIGHT : 0),
  },
  heroDismissOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: "transparent",
  },
  tongueHost: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingTop: FANS_STICKY_HEADER_TOP,
    alignItems: "center",
    overflow: "visible",
  },
  screenContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 40,
    backgroundColor: "#000000",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyStateText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 15,
    fontWeight: "500",
  },
  clubDropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 98,
  },
  clubDropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "rgba(10,10,14,0.97)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 6,
    paddingHorizontal: 8,
    zIndex: 99,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  clubDropdownEmpty: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 14,
  },
  clubDropdownItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 8,
  },
  clubDropdownItemActive: {
    backgroundColor: "rgba(244,197,101,0.10)",
  },
  clubDropdownItemText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  clubDropdownItemTextActive: {
    color: "#F4C565",
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 98,
  },
  menuItem: {
    position: "absolute",
    right: 10,
    zIndex: 99,
  },
  menuIconBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(18,18,24,0.97)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    paddingVertical: 9,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 140,
  },
  menuIconLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  allClubsTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    paddingTop: 10,
    paddingBottom: 16,
    marginTop: 8,
  },
  allClubsItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  allClubsItemActive: {
    backgroundColor: "rgba(244,197,101,0.07)",
    borderRadius: 8,
  },
  allClubsItemText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
  },
  allClubsItemTextActive: {
    color: "#F4C565",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 100,
  },
  sheetPanel: {
    position: "absolute",
    top: "5%",
    left: "5%",
    right: "5%",
    bottom: "5%",
    backgroundColor: "rgba(12,12,16,0.98)",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
    zIndex: 101,
    padding: 20,
    overflow: "hidden",
  },
  sheetCloseBtn: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  sheetHeader: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 16,
  },
  sheetAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.25)",
    marginBottom: 12,
  },
  sheetAvatarPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetDisplayName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  sheetVarId: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    marginTop: 3,
    textAlign: "center",
  },
  sheetStats: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 0,
  },
  sheetStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  sheetStatNum: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  sheetStatLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
  },
  sheetStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  sheetTabs: {
    flexDirection: "row-reverse",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 8,
  },
  sheetTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  sheetTabActive: {
    borderBottomWidth: 2,
    borderColor: "#F4C565",
  },
  sheetTabText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: "600",
  },
  sheetTabTextActive: {
    color: "#F4C565",
  },
  sheetSection: {
    flex: 1,
    marginTop: 16,
  },
  sheetSectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  sheetPostsScroll: {
    flex: 1,
  },
  sheetPostItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sheetPostText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    textAlign: "right",
    lineHeight: 19,
  },
  sheetPostMeta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  sheetPostMetaText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    marginLeft: 4,
  },
  sheetEmpty: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    textAlign: "center",
    paddingTop: 24,
  },
  leagueMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.60)",
  },
  leagueMenuPanel: {
    backgroundColor: "rgba(12,12,12,0.98)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 220,
    gap: 2,
  },
  leagueMenuItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
  },
  leagueMenuItemActive: {
    backgroundColor: "rgba(244,197,101,0.10)",
  },
  leagueMenuItemText: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
  },
  leagueMenuItemTextActive: {
    color: "#F4C565",
  },
  myRoomsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  myRoomsPanel: {
    backgroundColor: "rgba(12,12,12,0.97)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 180,
    gap: 4,
  },
  myRoomItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  myRoomItemActive: {
    backgroundColor: "rgba(244,197,101,0.12)",
  },
  myRoomItemText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
  },
  myRoomItemTextActive: {
    color: "#F4C565",
  },
});
