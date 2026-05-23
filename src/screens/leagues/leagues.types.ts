import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import type {
  BenchPlayer,
  GradientPair,
  MatchEvent,
  Post,
  TacticalPlayer,
} from "../../app.types";

export type LeaguesScreenProps = {
  posts: Post[];
};

export type LeaguePollTweet = {
  id: string;
  author: string;
  handle: string;
  replyTo?: string;
  body: string;
  timeLabel: string;
  replies: number;
  reposts: number;
  likes: number;
  views: number;
  avatarLabel: string;
  gradient: GradientPair;
};

export type MatchDetailTabKey = "lineup" | "statistics" | "headToHead";
export type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type MatchShowcaseTeam = {
  title: string;
  shortName: string;
  gradient: GradientPair;
  support: number;
  lineup: TacticalPlayer[];
  bench: BenchPlayer[];
  iconSource?: number;
};

export type LeagueOverviewCard = {
  id: string;
  title: string;
  summary: string;
  metricLabel: string;
  metricValue: string;
  accent: string;
};

export type LeagueStandingRow = {
  position: number;
  team: string;
  played: number;
  goalDifference: string;
  points: number;
  accent: string;
};

export type LeagueTopScorerRow = {
  rank: number;
  player: string;
  club: string;
  goals: number;
  shotsOnTarget: number;
  accent: string;
};

export type MatchShowcaseCardConfig = {
  id: string;
  leagueName: string;
  homeTeam: MatchShowcaseTeam;
  awayTeam: MatchShowcaseTeam;
  events: MatchEvent[];
  pollTweets: LeaguePollTweet[];
  hashtag: string;
  pressureBars: number[];
};

export type WebAudioInstance = {
  currentTime: number;
  preload?: string;
  play?: () => Promise<void> | void;
  pause?: () => void;
};

export type WebAudioConstructor = new (src?: string) => WebAudioInstance;

export type ShowcaseLineupPlayer = TacticalPlayer & {
  displayY: number;
};

export type ShowcaseBenchPlayer = BenchPlayer & {
  gradient: GradientPair;
};

export type FieldLayerFrame = {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
};
