import { useEffect, useMemo, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import {
  AWAY_BENCH,
  AWAY_LINEUP,
  AWAY_SUPPORT,
  HOME_BENCH,
  HOME_LINEUP,
  HOME_SUPPORT,
  MATCH_EVENTS,
  PRESSURE_BARS,
} from "../../app.data";
import type { Post } from "../../app.types";
import type { MatchPredictionLockInput } from "../../lib/predictions/matchPrediction.utils";
import { PullToRefreshScrollView } from "../../components/PullToRefreshScrollView";
import {
  AHLI_ITTIHAD_REPLACEMENTS,
  COMPACT_POLL_TWEET_CARD_HEIGHT,
  HILAL_ICON,
  LEAGUE_OVERVIEW_CARDS,
  LEAGUE_POLL_TWEETS,
  NASSR_ICON,
  POLL_TWEET_COMPACT_BREAKPOINT,
  POLL_TWEET_MACHINE_STEPS,
  REGULAR_POLL_TWEET_CARD_HEIGHT,
} from "./leagues.constants";
import {
  getLeaguePageHeaderTitle,
  getSelectedLeagueOverview,
  mapPostToLeaguePollTweet,
  remapBenchPlayers,
  remapLeaguePollTweets,
  remapMatchEvents,
  remapTacticalPlayers,
} from "./leagues.utils";
import type { MatchShowcaseCardConfig } from "./leagues.types";
import { LeagueArabicFontContext } from "./hooks/useLeagueFont";
import { useLeagueFont } from "./hooks/useLeagueFont";
import { useCountdown } from "./hooks/useCountdown";
import { useDrawerAnimation } from "./hooks/useDrawerAnimation";
import { LeaguesListHeader } from "./components/LeaguesListHeader";
import { LeaguesSideDrawer } from "./components/LeaguesSideDrawer";
import { MatchShowcaseCard } from "./components/MatchShowcaseCard";
import { MatchDetailPage } from "./components/MatchDetailPage";
import { styles } from "./leagues.styles";

type LeaguesScreenProps = {
  posts: Post[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onLockMatchPrediction?: (input: MatchPredictionLockInput) => void;
};

export default function LeaguesScreen(props: LeaguesScreenProps) {
  const { leaguesArabicFontFamily, leagueHeaderArabicFontFamily } =
    useLeagueFont();
  const { width: viewportWidth } = useWindowDimensions();
  const layoutWidth = Math.min(viewportWidth, 430);
  const pollTweetCardHeight =
    layoutWidth < POLL_TWEET_COMPACT_BREAKPOINT
      ? COMPACT_POLL_TWEET_CARD_HEIGHT
      : REGULAR_POLL_TWEET_CARD_HEIGHT;
  const pollTweetViewportHeight = pollTweetCardHeight * 3;
  const pollTweetMachineStepDistance =
    pollTweetCardHeight / POLL_TWEET_MACHINE_STEPS;

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isLeagueDrawerOpen, setIsLeagueDrawerOpen] = useState(false);
  const [selectedLeagueOverviewId, setSelectedLeagueOverviewId] = useState(
    LEAGUE_OVERVIEW_CARDS[0]?.id ?? null,
  );

  const { kickoffCountdownLabel, kickoffAt } = useCountdown();
  const drawerProgress = useDrawerAnimation(isLeagueDrawerOpen);

  const primaryLeaguePollTweets = useMemo(() => {
    if (!props.posts.length) {
      return LEAGUE_POLL_TWEETS;
    }

    return props.posts.slice(0, 3).map(mapPostToLeaguePollTweet);
  }, [props.posts]);

  const matchShowcaseCards = useMemo<MatchShowcaseCardConfig[]>(
    () => [
      {
        id: "hilal-nassr",
        leagueName: "الهلال VS النصر",
        homeTeam: {
          title: "الهلال",
          shortName: "هـ",
          gradient: ["#67C7FF", "#1A48AF"],
          support: HOME_SUPPORT,
          lineup: HOME_LINEUP,
          bench: HOME_BENCH,
          iconSource: HILAL_ICON,
        },
        awayTeam: {
          title: "النصر",
          shortName: "ن",
          gradient: ["#FFD16A", "#9A4E1A"],
          support: AWAY_SUPPORT,
          lineup: AWAY_LINEUP,
          bench: AWAY_BENCH,
          iconSource: NASSR_ICON,
        },
        events: MATCH_EVENTS,
        pollTweets: primaryLeaguePollTweets,
        hashtag: "#الهلال-النصر",
        pressureBars: PRESSURE_BARS,
      },
      {
        id: "ahli-ittihad",
        leagueName: "الأهلي VS الاتحاد",
        homeTeam: {
          title: "الأهلي",
          shortName: "أ",
          gradient: ["#41F17B", "#0F5F31"],
          support: HOME_SUPPORT,
          lineup: remapTacticalPlayers(HOME_LINEUP, AHLI_ITTIHAD_REPLACEMENTS),
          bench: remapBenchPlayers(HOME_BENCH, AHLI_ITTIHAD_REPLACEMENTS),
        },
        awayTeam: {
          title: "الاتحاد",
          shortName: "ا",
          gradient: ["#FFD16A", "#9A4E1A"],
          support: AWAY_SUPPORT,
          lineup: remapTacticalPlayers(AWAY_LINEUP, AHLI_ITTIHAD_REPLACEMENTS),
          bench: remapBenchPlayers(AWAY_BENCH, AHLI_ITTIHAD_REPLACEMENTS),
        },
        events: remapMatchEvents(MATCH_EVENTS, AHLI_ITTIHAD_REPLACEMENTS),
        pollTweets: remapLeaguePollTweets(
          primaryLeaguePollTweets,
          AHLI_ITTIHAD_REPLACEMENTS,
        ),
        hashtag: "#الأهلي-الاتحاد",
        pressureBars: PRESSURE_BARS,
      },
    ],
    [primaryLeaguePollTweets],
  );

  useEffect(() => {
    if (selectedMatchId) {
      setIsLeagueDrawerOpen(false);
    }
  }, [selectedMatchId]);

  const selectedMatch =
    matchShowcaseCards.find((matchCard) => matchCard.id === selectedMatchId) ??
    null;
  const selectedLeagueOverview = getSelectedLeagueOverview(
    selectedLeagueOverviewId,
    LEAGUE_OVERVIEW_CARDS,
  );
  const leaguePageHeaderTitle = getLeaguePageHeaderTitle(
    selectedLeagueOverview,
  );

  return (
    <LeagueArabicFontContext.Provider value={leaguesArabicFontFamily}>
      <View style={styles.root}>
        {!selectedMatch ? (
          <>
            <LeaguesListHeader
              headerFontFamily={leagueHeaderArabicFontFamily}
              headerTitle={leaguePageHeaderTitle}
              onToggleLeagueDrawer={() =>
                setIsLeagueDrawerOpen((currentState) => !currentState)
              }
            />
            <LeaguesSideDrawer
              drawerProgress={drawerProgress}
              isOpen={isLeagueDrawerOpen}
              leagueDrawerItems={LEAGUE_OVERVIEW_CARDS}
              onSelectLeague={(leagueId) => {
                setSelectedLeagueOverviewId(leagueId);
                setIsLeagueDrawerOpen(false);
              }}
              selectedLeagueId={selectedLeagueOverviewId}
            />
          </>
        ) : null}

        <PullToRefreshScrollView
          style={styles.leaguesListScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.screenContent}
          refreshing={props.isRefreshing}
          onRefresh={props.onRefresh}
        >
          {matchShowcaseCards.map((matchCard) => (
            <MatchShowcaseCard
              key={matchCard.id}
              config={matchCard}
              kickoffCountdownLabel={kickoffCountdownLabel}
              onOpenDetails={() => setSelectedMatchId(matchCard.id)}
              onLockMatchPrediction={props.onLockMatchPrediction}
              pollTweetCardHeight={pollTweetCardHeight}
              pollTweetViewportHeight={pollTweetViewportHeight}
              pollTweetMachineStepDistance={pollTweetMachineStepDistance}
            />
          ))}
        </PullToRefreshScrollView>

        {selectedMatch ? (
          <View style={styles.matchDetailOverlay}>
            <MatchDetailPage
              config={selectedMatch}
              kickoffAt={kickoffAt}
              kickoffCountdownLabel={kickoffCountdownLabel}
              onBack={() => setSelectedMatchId(null)}
              headerFontFamily={leagueHeaderArabicFontFamily}
              onRefresh={props.onRefresh}
              isRefreshing={props.isRefreshing}
            />
          </View>
        ) : null}
      </View>
    </LeagueArabicFontContext.Provider>
  );
}
