import { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  Text as RNText,
  View,
} from "react-native";
import {
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "../../../lib/crossPlatformStyles";
import { LEAGUE_OVERVIEW_CARDS } from "../leagues.constants";
import {
  findLeagueStandingRow,
  getAveragePressureValue,
  getRelatedTopScorers,
} from "../leagues.utils";
import type {
  LeagueStandingRow,
  MatchDetailTabKey,
  MatchShowcaseCardConfig,
} from "../leagues.types";
import { LeagueText as Text } from "./common/LeagueText";
import { GlassCard } from "./common/GlassCard";
import { ModeSwitchButton } from "./common/ModeSwitchButton";
import { LineupShowcaseStage } from "./lineup/LineupShowcaseStage";
import { MatchDetailShowcaseHero } from "./MatchDetailShowcaseHero";
import { MatchDetailStickyTabsCard } from "./MatchDetailTabs";
import { styles } from "../leagues.styles";

const SHOULD_USE_NATIVE_DRIVER = Platform.OS !== "web";

export function MatchDetailPage(props: {
  config: MatchShowcaseCardConfig;
  kickoffAt: Date;
  kickoffCountdownLabel: string;
  onBack: () => void;
  headerFontFamily?: string;
}) {
  const [activeTab, setActiveTab] = useState<MatchDetailTabKey>("lineup");
  const [lineupTeam, setLineupTeam] = useState<"home" | "away">("home");
  const [isVarEditorActive, setIsVarEditorActive] = useState(false);
  const borderSpinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIsVarEditorActive(false);
  }, [activeTab, lineupTeam]);

  useEffect(() => {
    borderSpinValue.setValue(0);

    const animation = Animated.loop(
      Animated.timing(borderSpinValue, {
        toValue: 1,
        duration: 16000,
        easing: Easing.linear,
        useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      }),
      { resetBeforeIteration: true },
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [borderSpinValue]);

  const selectedPlayers =
    lineupTeam === "home"
      ? props.config.homeTeam.lineup
      : props.config.awayTeam.lineup;
  const selectedBench =
    lineupTeam === "home"
      ? props.config.homeTeam.bench
      : props.config.awayTeam.bench;
  const selectedTeamLabel =
    lineupTeam === "home"
      ? props.config.homeTeam.title
      : props.config.awayTeam.title;
  const supportTotal =
    props.config.homeTeam.support + props.config.awayTeam.support;
  const homeSupportShare =
    supportTotal === 0
      ? 50
      : Math.round((props.config.homeTeam.support / supportTotal) * 100);
  const awaySupportShare = 100 - homeSupportShare;
  const pressureAverage = getAveragePressureValue(props.config.pressureBars);
  const pressurePeak = Math.max(...props.config.pressureBars, 0);
  const homeStanding = findLeagueStandingRow(props.config.homeTeam.title);
  const awayStanding = findLeagueStandingRow(props.config.awayTeam.title);
  const relatedTopScorers = getRelatedTopScorers([
    props.config.homeTeam.title,
    props.config.awayTeam.title,
  ]);
  const rotatingBorderSpin = borderSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient
      colors={[
        "rgba(255,255,255,0.38)",
        "rgba(255,255,255,0.14)",
        "rgba(255,255,255,0.05)",
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.matchDetailPageBorderRing}
    >
      <Animated.View
        {...getNativePointerEventsProps("none")}
        style={[
          styles.matchDetailPageBorderSpinner,
          { transform: [{ rotate: rotatingBorderSpin }] },
          getWebPointerEventsStyle("none"),
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0)",
            "rgba(255,255,255,0.96)",
            "rgba(255,255,255,0.96)",
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0)",
          ]}
          locations={[0, 0.34, 0.45, 0.52, 0.58, 0.68, 1]}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 0.92, y: 1 }}
          style={styles.matchDetailPageBorderSpinnerGradient}
        />
      </Animated.View>

      <View style={styles.matchDetailShell}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.matchDetailContent}
          stickyHeaderIndices={[1]}
        >
          <MatchDetailShowcaseHero
            config={props.config}
            kickoffCountdownLabel={props.kickoffCountdownLabel}
            onBack={props.onBack}
            headerFontFamily={props.headerFontFamily}
          />

          <MatchDetailStickyTabsCard
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <View>
            {activeTab === "lineup" ? (
              <View>
                <View style={styles.lineupSwitchRow}>
                  <ModeSwitchButton
                    label={props.config.homeTeam.title}
                    isActive={lineupTeam === "home"}
                    onPress={() => setLineupTeam("home")}
                  />
                  <ModeSwitchButton
                    label={props.config.awayTeam.title}
                    isActive={lineupTeam === "away"}
                    onPress={() => setLineupTeam("away")}
                  />
                </View>

                <LineupShowcaseStage
                  homeTeam={props.config.homeTeam}
                  awayTeam={props.config.awayTeam}
                  kickoffAt={props.kickoffAt}
                  players={selectedPlayers}
                  benchPlayers={selectedBench}
                  selectedTeamLabel={selectedTeamLabel}
                  selectedTeamShortName={
                    lineupTeam === "home"
                      ? props.config.homeTeam.shortName
                      : props.config.awayTeam.shortName
                  }
                  selectedTeamGradient={
                    lineupTeam === "home"
                      ? props.config.homeTeam.gradient
                      : props.config.awayTeam.gradient
                  }
                  onEditorModeChange={setIsVarEditorActive}
                />
              </View>
            ) : null}

            {activeTab === "statistics" ? (
              <View>
                <View style={styles.detailStatsGrid}>
                  <GlassCard style={styles.detailMetricCard}>
                    <RNText style={styles.detailMetricValue}>
                      {pressureAverage}
                    </RNText>
                    <Text style={styles.detailMetricLabel}>متوسط الضغط</Text>
                  </GlassCard>
                  <GlassCard style={styles.detailMetricCard}>
                    <RNText style={styles.detailMetricValue}>
                      {props.config.events.length}
                    </RNText>
                    <Text style={styles.detailMetricLabel}>عدد الأحداث</Text>
                  </GlassCard>
                  <GlassCard style={styles.detailMetricCard}>
                    <RNText style={styles.detailMetricValue}>
                      {pressurePeak}
                    </RNText>
                    <Text style={styles.detailMetricLabel}>ذروة الإيقاع</Text>
                  </GlassCard>
                </View>

                <GlassCard style={styles.detailPressureCard}>
                  <View style={styles.detailSectionHeader}>
                    <Text style={styles.detailSectionTitle}>
                      مؤشر ضغط المباراة
                    </Text>
                    <Text style={styles.detailSectionHint}>
                      {props.config.hashtag}
                    </Text>
                  </View>
                  <View style={styles.detailPressureBarsRow}>
                    {props.config.pressureBars.map((barValue, index) => (
                      <View
                        key={`${props.config.id}-bar-${index}`}
                        style={styles.detailPressureBarTrack}
                      >
                        <View
                          style={[
                            styles.detailPressureBarFill,
                            {
                              height: `${Math.max(14, Math.round((barValue / Math.max(pressurePeak, 1)) * 100))}%`,
                              backgroundColor:
                                index % 2 === 0
                                  ? props.config.homeTeam.gradient[0]
                                  : props.config.awayTeam.gradient[0],
                            },
                          ]}
                        />
                      </View>
                    ))}
                  </View>
                </GlassCard>

                <Text style={styles.detailSectionTitleStandalone}>
                  مؤشرات الدوري
                </Text>
                {LEAGUE_OVERVIEW_CARDS.map((card) => (
                  <GlassCard key={card.id} style={styles.headerOverviewCard}>
                    <View style={styles.headerOverviewRow}>
                      <View style={styles.headerOverviewTextBlock}>
                        <Text style={styles.headerOverviewTitle}>
                          {card.title}
                        </Text>
                        <Text style={styles.headerOverviewSummary}>
                          {card.summary}
                        </Text>
                      </View>

                      <View style={styles.headerOverviewMetricBlock}>
                        <RNText style={styles.headerOverviewMetricValue}>
                          {card.metricValue}
                        </RNText>
                        <Text style={styles.headerOverviewMetricLabel}>
                          {card.metricLabel}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.headerOverviewAccent,
                          { backgroundColor: card.accent },
                        ]}
                      />
                    </View>
                  </GlassCard>
                ))}
              </View>
            ) : null}

            {activeTab === "headToHead" ? (
              <View>
                <GlassCard style={styles.detailHeadToHeadHero}>
                  <View style={styles.detailHeadToHeadRow}>
                    <View style={styles.detailHeadToHeadTeamBlock}>
                      <Text
                        style={styles.detailHeadToHeadPercentage}
                      >{`${awaySupportShare}%`}</Text>
                      <Text style={styles.detailHeadToHeadTeamName}>
                        {props.config.awayTeam.title}
                      </Text>
                    </View>

                    <View style={styles.detailHeadToHeadCenter}>
                      <Text style={styles.detailHeadToHeadLabel}>
                        وجهاً لوجه
                      </Text>
                      <Text style={styles.detailHeadToHeadSubLabel}>
                        تصويت الجمهور الحالي
                      </Text>
                    </View>

                    <View style={styles.detailHeadToHeadTeamBlock}>
                      <Text
                        style={styles.detailHeadToHeadPercentage}
                      >{`${homeSupportShare}%`}</Text>
                      <Text style={styles.detailHeadToHeadTeamName}>
                        {props.config.homeTeam.title}
                      </Text>
                    </View>
                  </View>
                </GlassCard>

                {homeStanding || awayStanding ? (
                  <GlassCard style={styles.headerTableCard}>
                    <View style={styles.headerTableHeaderRow}>
                      <Text
                        style={[
                          styles.headerTableHeaderText,
                          styles.headerTeamHeader,
                        ]}
                      >
                        الفريق
                      </Text>
                      <Text style={styles.headerTableHeaderText}>لعب</Text>
                      <Text style={styles.headerTableHeaderText}>+/-</Text>
                      <Text style={styles.headerTableHeaderAccent}>نقاط</Text>
                    </View>

                    {[homeStanding, awayStanding]
                      .filter((team): team is LeagueStandingRow =>
                        Boolean(team),
                      )
                      .map((team) => (
                        <View key={team.position} style={styles.headerTableRow}>
                          <View style={styles.headerTeamBlock}>
                            <View
                              style={[
                                styles.headerRankBadge,
                                { backgroundColor: team.accent },
                              ]}
                            >
                              <RNText style={styles.headerRankBadgeText}>
                                {team.position}
                              </RNText>
                            </View>
                            <Text style={styles.headerTeamName}>
                              {team.team}
                            </Text>
                          </View>
                          <RNText style={styles.headerTableValue}>
                            {team.played}
                          </RNText>
                          <RNText style={styles.headerTableValue}>
                            {team.goalDifference}
                          </RNText>
                          <RNText style={styles.headerTableValueAccent}>
                            {team.points}
                          </RNText>
                        </View>
                      ))}
                  </GlassCard>
                ) : null}

                {relatedTopScorers.length ? (
                  <GlassCard style={styles.headerTableCard}>
                    <View style={styles.headerTableHeaderRow}>
                      <Text
                        style={[
                          styles.headerTableHeaderText,
                          styles.headerTeamHeader,
                        ]}
                      >
                        اللاعب
                      </Text>
                      <Text style={styles.headerTableHeaderText}>النادي</Text>
                      <Text style={styles.headerTableHeaderText}>تسديدات</Text>
                      <Text style={styles.headerTableHeaderAccent}>أهداف</Text>
                    </View>

                    {relatedTopScorers.map((player) => (
                      <View key={player.rank} style={styles.headerTableRow}>
                        <View style={styles.headerTeamBlock}>
                          <View
                            style={[
                              styles.headerRankBadge,
                              { backgroundColor: player.accent },
                            ]}
                          >
                            <RNText style={styles.headerRankBadgeText}>
                              {player.rank}
                            </RNText>
                          </View>
                          <Text style={styles.headerTeamName}>
                            {player.player}
                          </Text>
                        </View>
                        <Text style={styles.headerClubName}>{player.club}</Text>
                        <RNText style={styles.headerTableValue}>
                          {player.shotsOnTarget}
                        </RNText>
                        <RNText style={styles.headerTableValueAccent}>
                          {player.goals}
                        </RNText>
                      </View>
                    ))}
                  </GlassCard>
                ) : null}

                <GlassCard style={styles.headerTableCard}>
                  <View style={styles.detailSectionHeader}>
                    <Text style={styles.detailSectionTitle}>
                      أبرز لقطات المواجهة
                    </Text>
                    <Text style={styles.detailSectionHint}>
                      {props.config.hashtag}
                    </Text>
                  </View>

                  {props.config.events.map((event) => (
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
                            numberOfLines={2}
                          >
                            {`${event.title} · ${event.detail}`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </GlassCard>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}
