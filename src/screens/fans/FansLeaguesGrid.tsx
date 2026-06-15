import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { createCompatStyleSheet } from "../../lib/crossPlatformStyles";

export type LeagueInfo = {
  id: string;
  name: string;
  shortName: string;
  colors: [string, string];
  borderColor: string;
  glowColor: string;
};

const LEAGUES_DATA: LeagueInfo[] = [
  {
    id: "saudi",
    name: "الدوري السعودي",
    shortName: "RSL",
    colors: ["#FF6B35", "#F7931E"],
    borderColor: "#FF6B35",
    glowColor: "rgba(255, 107, 53, 0.3)",
  },
  {
    id: "premier",
    name: "الدوري الإنجليزي",
    shortName: "EPL",
    colors: ["#38003C", "#00FF85"],
    borderColor: "#00FF85",
    glowColor: "rgba(0, 255, 133, 0.3)",
  },
  {
    id: "laliga",
    name: "الدوري الإسباني",
    shortName: "La Liga",
    colors: ["#0F4C81", "#FDB912"],
    borderColor: "#FDB912",
    glowColor: "rgba(253, 185, 18, 0.3)",
  },
  {
    id: "ligue1",
    name: "الدوري الفرنسي",
    shortName: "Ligue 1",
    colors: ["#091C3E", "#E30613"],
    borderColor: "#E30613",
    glowColor: "rgba(227, 6, 19, 0.3)",
  },
  {
    id: "seriea",
    name: "الدوري الإيطالي",
    shortName: "Serie A",
    colors: ["#1A659E", "#008C45"],
    borderColor: "#008C45",
    glowColor: "rgba(0, 140, 69, 0.3)",
  },
];

interface LeagueCardProps {
  league: LeagueInfo;
  isFirst: boolean;
  onPress: () => void;
}

function LeagueCard({ league, isFirst, onPress }: LeagueCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isFirst && styles.firstCard,
        pressed && styles.cardPressed,
      ]}
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
        style={styles.cardGradient}
      >
        {/* Border glow effect */}
        <View
          style={[
            styles.borderGlow,
            { borderColor: league.borderColor, shadowColor: league.glowColor },
          ]}
        />
        
        {/* Logo - fallback to icon if no image */}
        <View style={[styles.logoContainer, { backgroundColor: league.colors[0] + "30" }]}>
          <LinearGradient
            colors={[league.colors[0] + "50", league.colors[1] + "30"]}
            style={styles.logoGradient}
          >
            <Ionicons name="trophy" size={24} color={league.borderColor} />
          </LinearGradient>
        </View>

        {/* Name */}
        <Text style={styles.leagueName} numberOfLines={1}>
          {league.name}
        </Text>

        {/* Short name badge */}
        <View
          style={[
            styles.badge,
            { backgroundColor: league.borderColor + "20" },
          ]}
        >
          <Text style={[styles.badgeText, { color: league.borderColor }]}>
            {league.shortName}
          </Text>
        </View>

        {/* Arrow */}
        <Ionicons
          name="chevron-back"
          size={18}
          color="rgba(255,255,255,0.4)"
          style={styles.arrow}
        />
      </LinearGradient>
    </Pressable>
  );
}

interface FansLeaguesGridProps {
  onLeaguePress?: (leagueId: string) => void;
}

export default function FansLeaguesGrid({ onLeaguePress }: FansLeaguesGridProps) {
  const handlePress = (leagueId: string) => {
    onLeaguePress?.(leagueId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {LEAGUES_DATA.map((league, index) => (
          <LeagueCard
            key={league.id}
            league={league}
            isFirst={index === 0}
            onPress={() => handlePress(league.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = createCompatStyleSheet({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#000000",
  },
  grid: {
    gap: 10,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  firstCard: {
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cardGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  borderGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: "hidden",
  },
  logoGradient: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  leagueName: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  arrow: {
    marginLeft: 4,
  },
});

export { LEAGUES_DATA };
