import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import {
  Animated,
  Image,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text as RNText,
  useWindowDimensions,
  type TextProps,
  type LayoutChangeEvent,
  View,
  ViewStyle,
} from "react-native";
import {
  AWAY_BENCH,
  AWAY_LINEUP,
  AWAY_SUPPORT,
  HOME_BENCH,
  HOME_LINEUP,
  HOME_SUPPORT,
  MATCH_EVENTS,
  PRESSURE_BARS,
} from "../app.data";
import type { GradientPair, LeagueTab, TacticalPlayer } from "../app.types";

type LeaguesScreenProps = {
  onShareVarXBoard: (content: string) => void;
};

type EditableTeam = "home" | "away";

type EditableLineups = Record<EditableTeam, TacticalPlayer[]>;

type PitchSize = {
  width: number;
  height: number;
};

type LeagueOverlayKey = "upcoming" | "standings" | "statistics";

const VAR_X_PLAYER_SIZE = 42;
const MONO_FONT = Platform.OS === "ios" ? "Courier" : "monospace";
const HILAL_ICON = require("../../assets/icons/alhilal.png.png");
const NASSR_ICON = require("../../assets/icons/alnassr.png.png");
const LEAGUES_ARABIC_FONT_FAMILY = "LeaguesArabic";
const LEAGUES_ARABIC_FONT = require("../../assets/images/alfont_com_KA-Hand-Naskh.ttf");

const UPCOMING_MATCHES = [
  {
    id: "upcoming-1",
    primary: "الهلال × الأهلي",
    secondary: "اليوم 08:30 · المملكة أرينا",
    detail: "مواجهة افتراضية جاهزة لعرض التفاصيل السريعة داخل اللوحة.",
  },
  {
    id: "upcoming-2",
    primary: "النصر × الاتحاد",
    secondary: "غدًا 09:00 · الأول بارك",
    detail: "قائمة تجربة لجدول المباريات القادمة في صفحة الدوريات.",
  },
  {
    id: "upcoming-3",
    primary: "الشباب × الفيحاء",
    secondary: "الجمعة 07:15 · الملز",
    detail: "بيانات افتراضية قابلة للاستبدال لاحقًا بمصدر حي.",
  },
];

const LEAGUE_STANDINGS = [
  {
    id: "standing-1",
    primary: "#1 الهلال",
    secondary: "68 نقطة · لعب 28",
    detail: "فارق +22 هدف",
  },
  {
    id: "standing-2",
    primary: "#2 النصر",
    secondary: "63 نقطة · لعب 28",
    detail: "فارق +19 هدف",
  },
  {
    id: "standing-3",
    primary: "#3 الأهلي",
    secondary: "58 نقطة · لعب 28",
    detail: "فارق +14 هدف",
  },
  {
    id: "standing-4",
    primary: "#4 الاتحاد",
    secondary: "55 نقطة · لعب 28",
    detail: "فارق +11 هدف",
  },
];

const LEAGUE_STATISTICS = [
  {
    id: "stat-1",
    primary: "أعلى استحواذ",
    secondary: "62%",
    detail: "الهلال",
  },
  {
    id: "stat-2",
    primary: "أكثر أهداف",
    secondary: "54",
    detail: "النصر",
  },
  {
    id: "stat-3",
    primary: "أقوى دفاع",
    secondary: "19 هدفًا مستقبلًا",
    detail: "الهلال",
  },
  {
    id: "stat-4",
    primary: "متوسط التسديدات",
    secondary: "14.8",
    detail: "لكل مباراة",
  },
];

const LEAGUE_OVERLAY_META: Record<
  LeagueOverlayKey,
  { title: string; kicker: string; side: "left" | "right" | "bottom" }
> = {
  upcoming: {
    title: "المباريات القادمة",
    kicker: "لوحة اليسار",
    side: "left",
  },
  standings: {
    title: "الترتيب",
    kicker: "لوحة اليمين",
    side: "right",
  },
  statistics: {
    title: "الإحصائيات",
    kicker: "لوحة الأسفل",
    side: "bottom",
  },
};

const LeagueArabicFontContext = createContext<string | undefined>(undefined);

function Text(props: TextProps) {
  const leaguesArabicFontFamily = useContext(LeagueArabicFontContext);

  return (
    <RNText
      {...props}
      style={[
        props.style,
        leaguesArabicFontFamily
          ? { fontFamily: leaguesArabicFontFamily }
          : null,
      ]}
    />
  );
}

function cloneLineup(players: TacticalPlayer[]) {
  return players.map((player) => ({ ...player }));
}

function createEditableLineups(): EditableLineups {
  return {
    home: cloneLineup(HOME_LINEUP),
    away: cloneLineup(AWAY_LINEUP),
  };
}

function getTeamLabel(team: EditableTeam) {
  return team === "home" ? "الهلال" : "النصر";
}

function getBaseLineup(team: EditableTeam) {
  return cloneLineup(team === "home" ? HOME_LINEUP : AWAY_LINEUP);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function LeaguesScreen(props: LeaguesScreenProps) {
  const [isLeaguesArabicFontLoaded] = useFonts({
    [LEAGUES_ARABIC_FONT_FAMILY]: LEAGUES_ARABIC_FONT,
  });
  const { width: viewportWidth, height: viewportHeight } =
    useWindowDimensions();
  const leaguesArabicFontFamily = isLeaguesArabicFontLoaded
    ? LEAGUES_ARABIC_FONT_FAMILY
    : undefined;
  const [leagueTab, setLeagueTab] = useState<LeagueTab>(null);
  const [lineupTeam, setLineupTeam] = useState<"home" | "away">("home");
  const [activeOverlay, setActiveOverlay] = useState<LeagueOverlayKey | null>(
    null,
  );
  const [varXTeam, setVarXTeam] = useState<EditableTeam>("home");
  const [editableLineups, setEditableLineups] = useState<EditableLineups>(() =>
    createEditableLineups(),
  );
  const overlayProgress = useRef(new Animated.Value(0)).current;
  const homeShare = HOME_SUPPORT / (HOME_SUPPORT + AWAY_SUPPORT);
  const selectedPlayers = lineupTeam === "home" ? HOME_LINEUP : AWAY_LINEUP;
  const selectedBench = lineupTeam === "home" ? HOME_BENCH : AWAY_BENCH;
  const selectedTeamLabel = lineupTeam === "home" ? "الهلال" : "النصر";
  const pressureAccentSplit = 7;
  const leadingPressureTotal = PRESSURE_BARS.slice(
    0,
    pressureAccentSplit,
  ).reduce((sum, bar) => sum + bar, 0);
  const trailingPressureTotal = PRESSURE_BARS.slice(pressureAccentSplit).reduce(
    (sum, bar) => sum + bar,
    0,
  );
  const pressureTotal = leadingPressureTotal + trailingPressureTotal;
  const leadingPressureShare =
    pressureTotal === 0 ? 0.5 : leadingPressureTotal / pressureTotal;
  const overlayPanelWidth = Math.round(viewportWidth * 0.84);
  const overlayPanelHeight = Math.round(viewportHeight * 0.8);
  const activeOverlayMeta = activeOverlay
    ? LEAGUE_OVERLAY_META[activeOverlay]
    : null;
  const overlayOpacity = overlayProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const overlayTranslateX = overlayProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      activeOverlayMeta?.side === "left"
        ? -(overlayPanelWidth + 48)
        : activeOverlayMeta?.side === "right"
          ? overlayPanelWidth + 48
          : 0,
      0,
    ],
  });
  const overlayTranslateY = overlayProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      activeOverlayMeta?.side === "bottom" ? overlayPanelHeight : 0,
      0,
    ],
  });

  useEffect(() => {
    if (!activeOverlay) {
      return;
    }

    Animated.timing(overlayProgress, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [activeOverlay, overlayProgress]);

  const toggleLeagueTab = (tab: Exclude<LeagueTab, null>) => {
    setLeagueTab((current) => (current === tab ? null : tab));
  };

  const openOverlayPanel = (panel: LeagueOverlayKey) => {
    if (activeOverlay === panel) {
      return closeOverlayPanel();
    }

    overlayProgress.stopAnimation();
    overlayProgress.setValue(0);
    setActiveOverlay(panel);
  };

  const closeOverlayPanel = () => {
    overlayProgress.stopAnimation();
    Animated.timing(overlayProgress, {
      toValue: 0,
      duration: 240,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setActiveOverlay(null);
      }
    });
  };

  const moveVarXPlayer = (playerId: string, nextX: number, nextY: number) => {
    setEditableLineups((current) => ({
      ...current,
      [varXTeam]: current[varXTeam].map((player) =>
        player.id === playerId ? { ...player, x: nextX, y: nextY } : player,
      ),
    }));
  };

  const resetVarXLineup = () => {
    setEditableLineups((current) => ({
      ...current,
      [varXTeam]: getBaseLineup(varXTeam),
    }));
  };

  const renderOverlayBody = () => {
    if (activeOverlay === "upcoming") {
      return UPCOMING_MATCHES.map((item) => (
        <View key={item.id} style={styles.overlayListCard}>
          <View style={styles.overlayListCardTop}>
            <Text style={styles.overlayListCardTitle}>{item.primary}</Text>
            <View style={styles.overlayBadge}>
              <Text style={styles.overlayBadgeText}>{item.secondary}</Text>
            </View>
          </View>
          <Text style={styles.overlayListCardDetail}>{item.detail}</Text>
        </View>
      ));
    }

    if (activeOverlay === "standings") {
      return LEAGUE_STANDINGS.map((item) => (
        <View key={item.id} style={styles.overlayStandingRow}>
          <View style={styles.overlayStandingMeta}>
            <Text style={styles.overlayStandingDetail}>{item.detail}</Text>
            <Text style={styles.overlayStandingSecondary}>
              {item.secondary}
            </Text>
          </View>
          <Text style={styles.overlayStandingPrimary}>{item.primary}</Text>
        </View>
      ));
    }

    if (activeOverlay === "statistics") {
      return LEAGUE_STATISTICS.map((item) => (
        <View key={item.id} style={styles.overlayStatCard}>
          <Text style={styles.overlayStatValue}>{item.secondary}</Text>
          <Text style={styles.overlayStatTitle}>{item.primary}</Text>
          <Text style={styles.overlayStatDetail}>{item.detail}</Text>
        </View>
      ));
    }

    return null;
  };

  return (
    <LeagueArabicFontContext.Provider value={leaguesArabicFontFamily}>
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.screenContent}
        >
          <GlassCard style={styles.leagueLaunchBar}>
            <View style={styles.leagueLaunchRow}>
              <OverlayLauncherChip
                title="الإحصائيات"
                icon="stats-chart-outline"
                onPress={() => openOverlayPanel("statistics")}
              />
              <OverlayLauncherChip
                title="الترتيب"
                icon="trophy-outline"
                onPress={() => openOverlayPanel("standings")}
              />
              <OverlayLauncherChip
                title="المباريات"
                icon="calendar-outline"
                onPress={() => openOverlayPanel("upcoming")}
              />
            </View>
          </GlassCard>

          <GlassCard style={styles.matchCard}>
            <LinearGradient
              colors={["#F6D37B", "#D79A2E", "#7A4B10"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.matchCardFrame}
            >
              <LinearGradient
                colors={["#0B1320", "#05070D", "#101827"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.matchCardInner}
              >
                <View style={styles.matchCardGlow} />
                <LinearGradient
                  colors={[
                    "rgba(255,255,255,0.16)",
                    "rgba(255,255,255,0.04)",
                    "rgba(255,255,255,0)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.matchCardSheen}
                />

                <View style={styles.matchHeader}>
                  <View style={styles.matchHeaderActionSlot}>
                    <Pressable
                      style={[styles.iconCircle, styles.matchHeaderCircle]}
                      onPress={() => openOverlayPanel("upcoming")}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#FFCC68"
                      />
                    </Pressable>
                  </View>

                  <Text style={styles.matchLeagueName}>الهلال VS النصر</Text>

                  <View style={styles.matchHeaderActionSlot}>
                    <View style={styles.matchHeaderActionsRow}>
                      <Pressable
                        style={[styles.iconCircle, styles.matchHeaderCircle]}
                        onPress={() => openOverlayPanel("standings")}
                      >
                        <Ionicons
                          name="trophy-outline"
                          size={14}
                          color="#FFCC68"
                        />
                      </Pressable>

                      <Pressable
                        style={[styles.iconCircle, styles.matchHeaderCircle]}
                        onPress={() => openOverlayPanel("statistics")}
                      >
                        <Ionicons
                          name="stats-chart-outline"
                          size={14}
                          color="#FFCC68"
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View style={styles.scoreRow}>
                  <TeamColumn
                    title="النصر"
                    shortName="ن"
                    gradient={["#FFD16A", "#9A4E1A"]}
                    iconSource={NASSR_ICON}
                  />

                  <View style={styles.scoreBlock}>
                    <View style={styles.livePill}>
                      <View style={styles.liveDot} />
                      <Text style={styles.livePillText}>DEMO</Text>
                    </View>
                    <View style={styles.scoreDigitsRow}>
                      <Text style={styles.scoreDigit}>2</Text>
                      <Text style={styles.scoreDash}>-</Text>
                      <Text style={styles.scoreDigit}>1</Text>
                    </View>
                  </View>

                  <TeamColumn
                    title="الهلال"
                    shortName="هـ"
                    gradient={["#67C7FF", "#1A48AF"]}
                    iconSource={HILAL_ICON}
                  />
                </View>

                <View style={styles.pressureSection}>
                  <View style={styles.pressureHeader}>
                    <Text style={styles.pressureLabel}>R L</Text>
                    <Text style={styles.pressureTitle}>Pressure Pulse</Text>
                  </View>

                  <View style={styles.pressureRail}>
                    <View style={styles.pressureMeterTrack}>
                      <View
                        style={[
                          styles.pressureMeterFill,
                          styles.pressureMeterFillLeading,
                          { flex: leadingPressureShare },
                        ]}
                      />
                      <View
                        style={[
                          styles.pressureMeterFill,
                          styles.pressureMeterFillTrailing,
                          { flex: 1 - leadingPressureShare },
                        ]}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.leagueTabsRow}>
                  <LeagueModeButton
                    label="الاحداث"
                    isActive={leagueTab === "events"}
                    onPress={() => toggleLeagueTab("events")}
                  />
                  <LeagueModeButton
                    label="التشكيله"
                    isActive={leagueTab === "lineup"}
                    onPress={() => toggleLeagueTab("lineup")}
                  />
                  <LeagueModeButton
                    label="التصويت"
                    isActive={leagueTab === "poll"}
                    onPress={() => toggleLeagueTab("poll")}
                  />
                </View>

                {leagueTab === "events" ? (
                  <View>
                    {MATCH_EVENTS.map((event) => (
                      <View key={event.id} style={styles.eventCard}>
                        <View style={styles.eventMinuteBadge}>
                          <Text style={styles.eventMinuteText}>
                            {event.minute}
                          </Text>
                        </View>
                        <View style={styles.eventTextBlock}>
                          <View style={styles.eventTextRow}>
                            <Text
                              style={styles.eventSummaryText}
                              numberOfLines={1}
                            >
                              {`${event.title} · ${event.detail}`}
                            </Text>
                            <Text style={styles.eventMoreText}>المزيد</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                {leagueTab === "lineup" ? (
                  <View>
                    <View style={styles.lineupSwitchRow}>
                      <ModeSwitchButton
                        label="الهلال"
                        isActive={lineupTeam === "home"}
                        onPress={() => setLineupTeam("home")}
                      />
                      <ModeSwitchButton
                        label="النصر"
                        isActive={lineupTeam === "away"}
                        onPress={() => setLineupTeam("away")}
                      />
                    </View>

                    <View style={styles.lineupSummaryCard}>
                      <Text style={styles.lineupSummaryTitle}>
                        {selectedTeamLabel}
                      </Text>
                      <Text style={styles.lineupSummaryText}>
                        التشكيلة الأساسية جاهزة · 11 لاعبًا ظاهرين على الملعب
                      </Text>
                    </View>

                    <Pitch players={selectedPlayers} />

                    <View style={styles.benchWrap}>
                      <Text style={styles.benchTitle}>دكة البدلاء</Text>
                      <View style={styles.benchGrid}>
                        {selectedBench.map((player) => (
                          <View key={player.id} style={styles.benchPill}>
                            <Text style={styles.benchPillNumber}>
                              #{player.number}
                            </Text>
                            <Text style={styles.benchPillName}>
                              {player.name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                ) : null}

                {leagueTab === "poll" ? (
                  <View>
                    <View style={styles.pollSummaryRow}>
                      <View style={styles.pollMetaBlock}>
                        <Text style={styles.pollMetaValue}>
                          {HOME_SUPPORT.toLocaleString("en-US")}
                        </Text>
                        <Text style={styles.pollMetaLabel}>الهلال</Text>
                      </View>
                      <View style={styles.pollMetaBlock}>
                        <Text style={styles.pollMetaValue}>
                          {AWAY_SUPPORT.toLocaleString("en-US")}
                        </Text>
                        <Text style={styles.pollMetaLabel}>النصر</Text>
                      </View>
                    </View>

                    <View style={styles.pollRail}>
                      <View
                        style={[
                          styles.pollFillHome,
                          { width: `${homeShare * 100}%` },
                        ]}
                      />
                      <View
                        style={[
                          styles.pollFillAway,
                          { width: `${(1 - homeShare) * 100}%` },
                        ]}
                      />
                    </View>

                    <View style={styles.pollLabelsRow}>
                      <Text style={styles.pollSideLabel}>
                        الهلال {Math.round(homeShare * 100)}%
                      </Text>
                      <Text style={styles.pollSideLabel}>
                        النصر {Math.round((1 - homeShare) * 100)}%
                      </Text>
                    </View>

                    <Pressable
                      style={styles.shareBoardButton}
                      onPress={() =>
                        props.onShareVarXBoard(
                          "تصويت الجمهور: الهلال 57% - النصر 43%، تم نشرها من شاشة الدوريات داخل Expo.",
                        )
                      }
                    >
                      <Text style={styles.shareBoardButtonText}>
                        مشاركة لوحة VAR X
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </LinearGradient>
            </LinearGradient>
          </GlassCard>
        </ScrollView>

        {activeOverlay && activeOverlayMeta ? (
          <>
            <Animated.View
              pointerEvents="auto"
              style={[styles.overlayScrim, { opacity: overlayOpacity }]}
            >
              <Pressable
                style={StyleSheet.absoluteFillObject}
                onPress={closeOverlayPanel}
              />
            </Animated.View>

            <View
              pointerEvents="box-none"
              style={[
                styles.overlayLayer,
                activeOverlayMeta.side === "left"
                  ? styles.overlayLayerLeft
                  : activeOverlayMeta.side === "right"
                    ? styles.overlayLayerRight
                    : styles.overlayLayerBottom,
              ]}
            >
              <Animated.View
                style={[
                  styles.overlayPanelShell,
                  {
                    width: overlayPanelWidth,
                    height: overlayPanelHeight,
                    opacity: overlayOpacity,
                    transform: [
                      { translateX: overlayTranslateX },
                      { translateY: overlayTranslateY },
                    ],
                  },
                ]}
              >
                <GlassCard style={styles.overlayPanelCard}>
                  <View style={styles.overlayPanelHeader}>
                    <Pressable
                      style={styles.closeCircle}
                      onPress={closeOverlayPanel}
                    >
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                    </Pressable>

                    <View style={styles.overlayPanelTitleBlock}>
                      <Text style={styles.overlayPanelKicker}>
                        {activeOverlayMeta.kicker}
                      </Text>
                      <Text style={styles.overlayPanelTitle}>
                        {activeOverlayMeta.title}
                      </Text>
                    </View>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.overlayPanelBody}
                  >
                    {renderOverlayBody()}
                  </ScrollView>
                </GlassCard>
              </Animated.View>
            </View>
          </>
        ) : null}
      </View>
    </LeagueArabicFontContext.Provider>
  );
}

function GlassCard(props: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.glassCard, props.style]}>{props.children}</View>;
}

function OverlayLauncherChip(props: {
  title: string;
  icon: any;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.leagueLaunchChip} onPress={props.onPress}>
      <Ionicons name={props.icon} size={16} color="#FFCC68" />
      <Text style={styles.leagueLaunchChipTitle}>{props.title}</Text>
    </Pressable>
  );
}

function ModeSwitchButton(props: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.modeSwitchButton,
        props.isActive ? styles.modeSwitchButtonActive : null,
      ]}
      onPress={props.onPress}
    >
      <Text
        style={[
          styles.modeSwitchButtonText,
          props.isActive ? styles.modeSwitchButtonTextActive : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

function TeamColumn(props: {
  title: string;
  shortName: string;
  gradient: GradientPair;
  iconSource?: number;
}) {
  return (
    <View style={styles.teamColumn}>
      {props.iconSource ? (
        <View style={styles.teamLogoWrap}>
          <Image
            source={props.iconSource}
            style={styles.teamCircleIcon}
            resizeMode="contain"
          />
        </View>
      ) : (
        <LinearGradient colors={props.gradient} style={styles.teamCircle}>
          <Text style={styles.teamCircleText}>{props.shortName}</Text>
        </LinearGradient>
      )}
      <Text style={styles.teamColumnTitle}>{props.title}</Text>
    </View>
  );
}

function LeagueModeButton(props: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.leagueTabButton,
        props.isActive ? styles.leagueTabButtonActive : null,
      ]}
      onPress={props.onPress}
    >
      <Text
        style={[
          styles.leagueTabButtonText,
          props.isActive ? styles.leagueTabButtonTextActive : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

function Pitch(props: { players: TacticalPlayer[] }) {
  return (
    <View style={styles.pitchCard}>
      <View style={styles.pitchCenterLine} />
      <View style={styles.pitchCenterCircle} />
      <View style={styles.pitchTopBox} />
      <View style={styles.pitchBottomBox} />

      {props.players.map((player) => (
        <View
          key={player.id}
          style={[
            styles.pitchPlayerWrap,
            { left: `${player.x * 100}%`, top: `${player.y * 100}%` },
          ]}
        >
          <LinearGradient
            colors={player.gradient}
            style={styles.pitchPlayerCircle}
          >
            <Text style={styles.pitchPlayerNumber}>{player.number}</Text>
          </LinearGradient>
        </View>
      ))}
    </View>
  );
}

function CoachBoardPitch(props: {
  players: TacticalPlayer[];
  onMovePlayer: (playerId: string, nextX: number, nextY: number) => void;
}) {
  const [pitchSize, setPitchSize] = useState<PitchSize>({
    width: 0,
    height: 0,
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPitchSize((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  };

  return (
    <View
      style={[styles.pitchCard, styles.varXPitchCard]}
      onLayout={handleLayout}
    >
      <View style={styles.pitchCenterLine} />
      <View style={styles.pitchCenterCircle} />
      <View style={styles.pitchTopBox} />
      <View style={styles.pitchBottomBox} />

      {props.players.map((player) => (
        <DraggablePitchPlayer
          key={player.id}
          player={player}
          pitchSize={pitchSize}
          onMovePlayer={props.onMovePlayer}
        />
      ))}
    </View>
  );
}

function DraggablePitchPlayer(props: {
  player: TacticalPlayer;
  pitchSize: PitchSize;
  onMovePlayer: (playerId: string, nextX: number, nextY: number) => void;
}) {
  const [draftPosition, setDraftPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const startPositionRef = useRef({ x: props.player.x, y: props.player.y });
  const draftPositionRef = useRef<{ x: number; y: number } | null>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          const initialPosition = { x: props.player.x, y: props.player.y };
          startPositionRef.current = initialPosition;
          draftPositionRef.current = initialPosition;
          setDraftPosition(initialPosition);
        },
        onPanResponderMove: (_event, gestureState) => {
          if (!props.pitchSize.width || !props.pitchSize.height) {
            return;
          }

          const halfX = VAR_X_PLAYER_SIZE / (props.pitchSize.width * 2);
          const halfY = VAR_X_PLAYER_SIZE / (props.pitchSize.height * 2);
          const nextPosition = {
            x: clamp(
              startPositionRef.current.x +
                gestureState.dx / props.pitchSize.width,
              halfX,
              1 - halfX,
            ),
            y: clamp(
              startPositionRef.current.y +
                gestureState.dy / props.pitchSize.height,
              halfY,
              1 - halfY,
            ),
          };

          draftPositionRef.current = nextPosition;
          setDraftPosition(nextPosition);
        },
        onPanResponderRelease: () => {
          const finalPosition =
            draftPositionRef.current ?? startPositionRef.current;
          props.onMovePlayer(props.player.id, finalPosition.x, finalPosition.y);
          draftPositionRef.current = null;
          setDraftPosition(null);
        },
        onPanResponderTerminate: () => {
          const finalPosition =
            draftPositionRef.current ?? startPositionRef.current;
          props.onMovePlayer(props.player.id, finalPosition.x, finalPosition.y);
          draftPositionRef.current = null;
          setDraftPosition(null);
        },
      }),
    [
      props.onMovePlayer,
      props.pitchSize.height,
      props.pitchSize.width,
      props.player.id,
      props.player.x,
      props.player.y,
    ],
  );

  const position = draftPosition ?? { x: props.player.x, y: props.player.y };

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.varXPlayerWrap,
        { left: `${position.x * 100}%`, top: `${position.y * 100}%` },
      ]}
    >
      <LinearGradient
        colors={props.player.gradient}
        style={styles.varXPlayerCircle}
      >
        <Text style={styles.varXPlayerNumber}>{props.player.number}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 128,
  },
  glassCard: {
    backgroundColor: "rgba(9, 14, 24, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 26,
    overflow: "hidden",
    marginBottom: 16,
  },
  leagueLaunchBar: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "rgba(9, 14, 24, 0.95)",
    borderColor: "rgba(245,189,88,0.18)",
  },
  leagueLaunchRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leagueLaunchChip: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.14)",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  leagueLaunchChipTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    marginRight: 8,
  },
  newsWrap: {
    marginBottom: 14,
    alignItems: "stretch",
  },
  newsExpandedCard: {
    padding: 16,
    backgroundColor: "rgba(10, 15, 24, 0.96)",
    borderColor: "rgba(245,189,88,0.22)",
  },
  newsExpandedTop: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  newsExpandedTitleBlock: {
    alignItems: "flex-end",
    flex: 1,
  },
  newsExpandedKicker: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "700",
  },
  newsExpandedTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  closeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
  },
  newsItem: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 14,
    marginTop: 14,
  },
  newsItemTop: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newsItemTime: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 12,
    fontWeight: "700",
  },
  newsBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  newsBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  newsItemTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 8,
  },
  newsItemSummary: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "right",
    marginTop: 8,
  },
  newsToggle: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(10, 15, 24, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.22)",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  newsToggleTitle: {
    color: "#FFDE97",
    fontSize: 14,
    fontWeight: "900",
  },
  newsLiveBadge: {
    backgroundColor: "rgba(255,214,126,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.22)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  newsLiveBadgeText: {
    color: "#FFCC68",
    fontSize: 11,
    fontWeight: "900",
  },
  varXBoardCard: {
    padding: 16,
  },
  varXBoardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  varXBoardTitleBlock: {
    flex: 1,
    alignItems: "flex-end",
    marginHorizontal: 12,
  },
  varXBoardKicker: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 11,
    fontWeight: "800",
  },
  varXBoardTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  varXBoardChip: {
    minWidth: 86,
    minHeight: 34,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  varXBoardChipText: {
    color: "#DCE8F4",
    fontSize: 11,
    fontWeight: "900",
  },
  varXSummaryCard: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 14,
  },
  varXSummaryTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
  },
  varXSummaryText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 19,
    marginTop: 6,
  },
  matchCard: {
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
    overflow: "visible",
    shadowColor: "#C88D1C",
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 14,
  },
  matchCardFrame: {
    borderRadius: 22,
    padding: 2,
  },
  matchCardInner: {
    borderRadius: 20,
    overflow: "hidden",
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,225,162,0.24)",
  },
  matchCardGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(245,189,88,0.16)",
    top: -70,
    left: -44,
  },
  matchCardSheen: {
    position: "absolute",
    top: -18,
    right: -22,
    width: 144,
    height: 96,
    transform: [{ rotate: "12deg" }],
  },
  matchHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matchHeaderActionSlot: {
    width: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  matchHeaderActionsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  matchLeagueName: {
    flex: 1,
    color: "#FFCC68",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  matchHeaderCircle: {
    backgroundColor: "rgba(255,214,126,0.08)",
    borderColor: "rgba(245,189,88,0.34)",
    marginLeft: 6,
  },
  varXButton: {
    minWidth: 62,
    minHeight: 30,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  varXButtonText: {
    color: "#DCE8F4",
    fontSize: 10,
    fontWeight: "900",
  },
  matchVarXButton: {
    backgroundColor: "rgba(255,214,126,0.08)",
    borderColor: "rgba(245,189,88,0.34)",
  },
  matchVarXButtonText: {
    color: "#FFCC68",
  },
  varXButtonActive: {
    backgroundColor: "#F5F9FF",
  },
  varXButtonTextActive: {
    color: "#08111B",
  },
  scoreRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },
  teamColumn: {
    alignItems: "center",
    width: 50,
    marginHorizontal: 8,
  },
  teamCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  teamCircleText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  teamLogoWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  teamCircleIcon: {
    width: 30,
    height: 30,
  },
  teamColumnTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 6,
  },
  scoreBlock: {
    alignItems: "center",
    marginHorizontal: 6,
  },
  scoreDigitsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  scoreDigitBox: {
    width: 34,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(255,214,126,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(245,189,88,0.44)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    shadowColor: "#F5BD58",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  scoreDashBox: {
    width: 16,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreDigit: {
    color: "#FFCC68",
    fontSize: 24,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  scoreDash: {
    color: "rgba(255,212,122,0.72)",
    fontSize: 22,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    marginHorizontal: 7,
  },
  livePill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(255,214,126,0.09)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.24)",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF4859",
    marginLeft: 5,
  },
  livePillText: {
    color: "#FFDE97",
    fontSize: 9,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  pressureSection: {
    marginTop: 12,
  },
  pressureHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pressureLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 9,
    fontWeight: "900",
  },
  pressureTitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 9,
    fontWeight: "900",
  },
  pressureRail: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.18)",
  },
  pressureMeterTrack: {
    height: 8,
    borderRadius: 999,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  pressureMeterFill: {
    height: "100%",
  },
  pressureMeterFillLeading: {
    backgroundColor: "rgba(212,167,79,0.92)",
  },
  pressureMeterFillTrailing: {
    backgroundColor: "rgba(24,45,95,0.9)",
  },
  leagueTabsRow: {
    flexDirection: "row-reverse",
    marginTop: 10,
  },
  overlayScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)",
    zIndex: 20,
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 21,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  overlayLayerLeft: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  overlayLayerRight: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  overlayLayerBottom: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
  overlayPanelShell: {
    shadowColor: "#C88D1C",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 18,
  },
  overlayPanelCard: {
    flex: 1,
    padding: 16,
    borderRadius: 30,
    borderColor: "rgba(245,189,88,0.24)",
    backgroundColor: "rgba(8, 12, 20, 0.98)",
    marginBottom: 0,
  },
  overlayPanelHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  overlayPanelTitleBlock: {
    flex: 1,
    alignItems: "flex-end",
    marginHorizontal: 12,
  },
  overlayPanelKicker: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 11,
    fontWeight: "800",
  },
  overlayPanelTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  overlayPanelBody: {
    paddingBottom: 12,
  },
  overlayListCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.14)",
    padding: 14,
    marginBottom: 10,
  },
  overlayListCardTop: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overlayListCardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
    flexShrink: 1,
  },
  overlayBadge: {
    borderRadius: 999,
    backgroundColor: "rgba(255,214,126,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
  },
  overlayBadgeText: {
    color: "#FFCC68",
    fontSize: 10,
    fontWeight: "900",
  },
  overlayListCardDetail: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 20,
    marginTop: 10,
  },
  overlayStandingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.14)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  overlayStandingMeta: {
    alignItems: "flex-start",
    marginLeft: 12,
  },
  overlayStandingPrimary: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
  },
  overlayStandingSecondary: {
    color: "#FFDE97",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "left",
  },
  overlayStandingDetail: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "left",
    marginBottom: 4,
  },
  overlayStatCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.14)",
    paddingHorizontal: 14,
    paddingVertical: 18,
    marginBottom: 10,
    alignItems: "flex-end",
  },
  overlayStatValue: {
    color: "#FFCC68",
    fontSize: 28,
    fontWeight: "900",
    fontFamily: MONO_FONT,
  },
  overlayStatTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "right",
  },
  overlayStatDetail: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "right",
  },
  leagueTabButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  leagueTabButtonActive: {
    backgroundColor: "rgba(255,214,126,0.14)",
    borderColor: "rgba(245,189,88,0.38)",
  },
  leagueTabButtonText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 10,
    fontWeight: "900",
  },
  leagueTabButtonTextActive: {
    color: "#FFDE97",
  },
  eventCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(245,189,88,0.18)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  eventMinuteBadge: {
    minWidth: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  eventMinuteText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  eventTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  eventTextRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  eventSummaryText: {
    flex: 1,
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  eventMoreText: {
    color: "#63C6FF",
    fontSize: 12,
    fontWeight: "900",
    marginRight: 10,
  },
  eventDetail: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
    marginTop: 6,
  },
  modeSwitchButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  modeSwitchButtonActive: {
    backgroundColor: "#F5F9FF",
  },
  modeSwitchButtonText: {
    color: "#8092A6",
    fontSize: 14,
    fontWeight: "800",
  },
  modeSwitchButtonTextActive: {
    color: "#08111B",
  },
  lineupSwitchRow: {
    flexDirection: "row-reverse",
    marginTop: 16,
    marginBottom: 14,
  },
  lineupSummaryCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  lineupSummaryTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
  },
  lineupSummaryText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
  },
  pitchCard: {
    height: 320,
    borderRadius: 24,
    backgroundColor: "#0C3A1F",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    position: "relative",
  },
  varXPitchCard: {
    marginTop: 16,
    height: 360,
  },
  pitchCenterLine: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  pitchCenterCircle: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.14)",
    transform: [{ translateX: -42 }, { translateY: -42 }],
  },
  pitchTopBox: {
    position: "absolute",
    left: "23%",
    right: "23%",
    top: 0,
    height: 64,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: "rgba(255,255,255,0.14)",
  },
  pitchBottomBox: {
    position: "absolute",
    left: "23%",
    right: "23%",
    bottom: 0,
    height: 64,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.14)",
  },
  pitchPlayerWrap: {
    position: "absolute",
    transform: [{ translateX: -18 }, { translateY: -18 }],
  },
  pitchPlayerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },
  pitchPlayerNumber: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  varXPlayerWrap: {
    position: "absolute",
    transform: [{ translateX: -21 }, { translateY: -21 }],
    zIndex: 4,
  },
  varXPlayerCircle: {
    width: VAR_X_PLAYER_SIZE,
    height: VAR_X_PLAYER_SIZE,
    borderRadius: VAR_X_PLAYER_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.46)",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  varXPlayerNumber: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  varXBoardActions: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 16,
    marginHorizontal: -4,
  },
  varXShareButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  varXShareButtonText: {
    color: "#07101A",
    fontSize: 14,
    fontWeight: "900",
  },
  varXResetButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  varXResetButtonText: {
    color: "#DCE8F4",
    fontSize: 14,
    fontWeight: "900",
  },
  benchWrap: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 14,
  },
  benchTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 12,
  },
  benchGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  benchPill: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginHorizontal: "1%",
    marginVertical: 4,
  },
  benchPillNumber: {
    color: "#63C6FF",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
  },
  benchPillName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 4,
  },
  pollSummaryRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 18,
  },
  pollMetaBlock: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 4,
    alignItems: "flex-end",
  },
  pollMetaValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  pollMetaLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  pollRail: {
    height: 18,
    borderRadius: 999,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 18,
  },
  pollFillHome: {
    backgroundColor: "#63C6FF",
  },
  pollFillAway: {
    backgroundColor: "#FFB85C",
  },
  pollLabelsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 10,
  },
  pollSideLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  shareBoardButton: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  shareBoardButtonText: {
    color: "#07101A",
    fontSize: 14,
    fontWeight: "900",
  },
});
