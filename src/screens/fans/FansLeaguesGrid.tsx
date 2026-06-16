import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFonts } from "expo-font";
import { createCompatStyleSheet } from "../../lib/crossPlatformStyles";
import {
  LEAGUE_HEADER_ARABIC_FONT,
  LEAGUE_HEADER_ARABIC_FONT_FAMILY,
} from "../leagues/leagues.constants";

export type LeagueInfo = {
  id: string;
  name: string;
  shortName: string;
  accentColor: string;
};

// خلفيات الدوريات - صور كرة قدم
const LEAGUES_DATA: LeagueInfo[] = [
  { id: "saudi",  name: "الدوري السعودي",   shortName: "RSL",     accentColor: "#165DFF" },
  { id: "premier", name: "الدوري الإنجليزي", shortName: "EPL",     accentColor: "#00FF85" },
  { id: "laliga",  name: "الدوري الإسباني",  shortName: "La Liga", accentColor: "#FDB912" },
  { id: "ligue1",  name: "الدوري الفرنسي",   shortName: "Ligue 1", accentColor: "#E30613" },
  { id: "seriea",  name: "الدوري الإيطالي",  shortName: "Serie A", accentColor: "#008C45" },
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
      <View style={styles.cardBackground}>
        {/* Content - Centered */}
        <View style={styles.cardContent}>
          <Text style={styles.leagueName}>
            {league.name}
          </Text>
          
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {league.shortName}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

interface FansLeaguesGridProps {
  onLeaguePress?: (leagueId: string) => void;
}

export default function FansLeaguesGrid({ onLeaguePress }: FansLeaguesGridProps) {
  const [fontsLoaded] = useFonts({
    [LEAGUE_HEADER_ARABIC_FONT_FAMILY]: LEAGUE_HEADER_ARABIC_FONT,
  });

  const handlePress = (leagueId: string) => {
    onLeaguePress?.(leagueId);
  };

  return (
    <View style={styles.container}>
      {/* Header Text */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>رابطة الأندية</Text>
      </View>

      {/* League Cards */}
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
    flex: 1,
    backgroundColor: "#000000",
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    fontFamily: "LeagueHeaderArabic",
    letterSpacing: 1,
  },
  grid: {
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    height: 140,
  },
  firstCard: {
    // بدون حواف مميزة
  },
  cardBackground: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  leagueName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
    textAlign: "right",
    fontFamily: "LeagueHeaderArabic",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000000",
    fontFamily: "LeagueHeaderArabic",
  },
});

export { LEAGUES_DATA };
