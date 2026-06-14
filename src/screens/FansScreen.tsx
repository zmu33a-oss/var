import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { FanClubId } from "../app.types";
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
import FansAssociationHero from "./fans/FansAssociationHero";
import FansCommunityComposer from "./fans/FansCommunityComposer";
import FansCommunityFeed from "./fans/FansCommunityFeed";
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
};

/**
 * صفحة الرابطة:
 * 1) هيدر ثابت: اللسان + شعار/رابطة/شجع
 * 2) تعليقات تمرّر تحته وتختفي من الأسفل
 * 3) شريط الكتابة أسفل الشاشة
 */
export default function FansScreen(props: FansScreenProps) {
  const tongueRef = useRef<FansSupportTongueHandle>(null);
  const [isTongueExpanded, setIsTongueExpanded] = useState(false);
  const [showMyRooms, setShowMyRooms] = useState(false);

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
    if (displayClubId) {
      return FAN_CLUBS.find((c) => c.id === displayClubId)?.title ?? "";
    }
    return resolveLeadingFanClub(props.supporters)?.club.title ?? "";
  }, [displayClubId, props.supporters]);

  return (
    <View style={styles.root}>
      <PullToRefreshScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.screenContent}
        refreshing={props.isRefreshing}
        onRefresh={props.onRefresh}
      >
        <FansCommunityFeed
          canInteract={canInteractInFeed}
          clubId={displayClubId}
          posts={communityPosts}
        />
      </PullToRefreshScrollView>

      {isTongueExpanded ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="إغلاق قائمة الأندية"
          style={styles.tongueDismissBackdrop}
          onPress={() => tongueRef.current?.collapse()}
        />
      ) : null}

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
      </View>

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

      <FansCommunityComposer
        isLoggedIn={props.isLoggedIn}
        canPost={canInteractInFeed}
        activeClubTitle={activeClubTitle}
        onRequireAuth={props.onRequireAuth}
        onSend={handleSend}
      />
    </View>
  );
}

const styles = createCompatStyleSheet({
  root: {
    flex: 1,
    backgroundColor: "#000000",
    position: "relative",
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
    zIndex: 2,
    paddingTop: FANS_STICKY_HEADER_TOP,
    alignItems: "center",
    overflow: "visible",
  },
  screenContent: {
    paddingHorizontal: 0,
    paddingTop: FANS_FEED_TOP_PADDING,
    paddingBottom: FANS_SCROLL_BOTTOM_PADDING,
    backgroundColor: "#000000",
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
