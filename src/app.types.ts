import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export type GradientPair = [string, string];
export type MainTab = "home" | "fans" | "leagues" | "account";
export type Tab = MainTab | "chat";
export type HomeMode = "tiktok" | "x";
export type AuthMode = "login" | "signup";
export type LeagueTab = "events" | "lineup" | "poll" | null;
export type FanClubId = "hilal" | "nassr" | "ittihad";
export type IconName = ComponentProps<typeof Ionicons>["name"];

export type Palette = {
  accent: string;
  panel: string;
  gradient: GradientPair;
  label: string;
};

export type Video = {
  id: number;
  creatorName: string;
  creatorHandle: string;
  caption: string;
  mediaUri?: string;
  likes: number;
  saves: number;
  shares: number;
  comments: number;
  likedByMe: boolean;
  savedByMe: boolean;
  sharedByMe: boolean;
  theme: GradientPair;
  tag: string;
};

export type Post = {
  id: number;
  author: string;
  handle: string;
  time: string;
  content: string;
  likes: number;
  replies: number;
  reposts: number;
  shares: number;
  likedByMe: boolean;
};

export type FanClub = {
  id: FanClubId;
  title: string;
  crowdLabel: string;
  summary: string;
  trendLabel: string;
  gradient: GradientPair;
  icon: IconName;
};

export type TacticalPlayer = {
  id: string;
  name: string;
  number: number;
  x: number;
  y: number;
  gradient: GradientPair;
};

export type BenchPlayer = {
  id: string;
  name: string;
  number: number;
};

export type NewsItem = {
  id: string;
  badge: string;
  title: string;
  summary: string;
  time: string;
  accent: string;
};

export type MatchEvent = {
  id: string;
  minute: string;
  title: string;
  detail: string;
};

export type ProfileData = {
  displayName: string;
  username: string;
  bio: string;
  location: string;
  email: string;
  phoneNumber: string;
  profession: string;
  nationalId: string;
  birthDate: string;
  nationality: string;
  joinDate: string;
  avatarFrameEnabled: boolean;
  isVerified: boolean;
  walletPassAdded: boolean;
  walletPassUrl?: string;
};

export type MetricTile = {
  id: string;
  label: string;
  value: string;
  color: string;
  icon: IconName;
};

export type ChatGroup = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  icon: IconName;
};

export type ChatMessage = {
  id: string;
  sender: string;
  content: string;
  time: string;
  mine: boolean;
};
