import React from "react";
import {
  Image,
  ImageBackground,
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
  backgroundImage: any;
  accentColor: string;
};

// خلفيات الدوريات - صور اللاعبين/الأندية
const LEAGUES_DATA: LeagueInfo[] = [
  {
    id: "saudi",
    name: "الدوري السعودي",
    shortName: "RSL",
    backgroundImage: require("../../../assets/images/leagues/saudi-bg.png"),
    accentColor: "#FF6B35",
  },
  {
    id: "premier",
    name: "الدوري الإنجليزي",
    shortName: "EPL",
    backgroundImage: require("../../../assets/images/leagues/premier-bg.png"),
    accentColor: "#00FF85",
  },
  {
    id: "laliga",
    name: "الدوري الإسباني",
    shortName: "La Liga",
    backgroundImage: require("../../../assets/images/leagues/laliga-bg.png"),
    accentColor: "#FDB912",
  },
  {
    id: "ligue1",
    name: "الدوري الفرنسي",
    shortName: "Ligue 1",
    backgroundImage: require("../../../assets/images/leagues/ligue1-bg.png"),
    accentColor: "#E30613",
  },
  {
    id: "seriea",
    name: "الدوري الإيطالي",
    shortName: "Serie A",
    backgroundImage: require("../../../assets/images/leagues/seriea-bg.png"),
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
        source={league.backgroundImage}
        style={styles.cardBackground}
        resizeMode="cover"
      >
        {/* Gradient overlay for text readability */}
        <LinearGradient
          colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)"]}
          style={styles.cardOverlay}
        >
          {/* Border */}
          <View style={styles.borderOverlay} />
          
          {/* Content */}
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

          {/* Arrow */}
          <View style={styles.arrowContainer}>
            <Ionicons
              name="chevron-back"
              size={28}
              color="#FFFFFF"
            />
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
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
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
    borderRadius: 20,
    overflow: "hidden",
    height: 140,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  firstCard: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  leagueName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
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
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export { LEAGUES_DATA };
