import React from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
  imageUrl: string;
  accentColor: string;
};

// خلفيات الدوريات - صور كرة قدم
const LEAGUES_DATA: LeagueInfo[] = [
  {
    id: "saudi",
    name: "الدوري السعودي",
    shortName: "RSL",
    imageUrl: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&auto=format&fit=crop&q=80",
    accentColor: "#165DFF",
  },
  {
    id: "premier",
    name: "الدوري الإنجليزي",
    shortName: "EPL",
    imageUrl: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&auto=format&fit=crop",
    accentColor: "#00FF85",
  },
  {
    id: "laliga",
    name: "الدوري الإسباني",
    shortName: "La Liga",
    imageUrl: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&auto=format&fit=crop",
    accentColor: "#FDB912",
  },
  {
    id: "ligue1",
    name: "الدوري الفرنسي",
    shortName: "Ligue 1",
    imageUrl: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&auto=format&fit=crop",
    accentColor: "#E30613",
  },
  {
    id: "seriea",
    name: "الدوري الإيطالي",
    shortName: "Serie A",
    imageUrl: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&auto=format&fit=crop",
    accentColor: "#008C45",
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
      <ImageBackground
        source={{ uri: league.imageUrl }}
        style={styles.cardBackground}
        resizeMode="cover"
      >
        {/* Overlay gradient for text readability */}
        <LinearGradient
          colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.6)"]}
          style={styles.cardOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Border */}
          <View style={styles.borderOverlay} />
          
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
        </LinearGradient>
      </ImageBackground>
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
        <Text style={styles.headerSubtitle}>
          للمهتمين في شأن الكرة الرياضية وملتقى لمحبين الرياضة
        </Text>
        <Text style={styles.headerDescription}>
          شارك مقترحاتك مع مشجعين من نفس الرابطة لسماع صوتكم وتحسين مستوى النادي
        </Text>
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
    paddingTop: 80,
    paddingBottom: 24,
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "LeagueHeaderArabic",
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 6,
  },
  headerDescription: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 20,
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
  },
  cardOverlay: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  borderOverlay: {
    // تم حذف الحواف
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  leagueName: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 12,
    textAlign: "center",
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
