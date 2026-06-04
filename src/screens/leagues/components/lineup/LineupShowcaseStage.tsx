import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  Easing,
  Image,
  type ImageStyle,
  Pressable,
  Text as RNText,
  View,
  useWindowDimensions,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  BenchPlayer,
  GradientPair,
  TacticalPlayer,
} from "../../../../app.types";
import { VAR_WORDMARK_ICON } from "../../leagues.constants";
import type {
  FieldLayerFrame,
  MatchShowcaseTeam,
  ShowcaseBenchPlayer,
  ShowcaseLineupPlayer,
} from "../../leagues.types";
import {
  buildBenchShowcasePlayers,
  buildFormationLabelFromDisplayPlayers,
  formatLineupKickoffDate,
  normalizeShowcaseLineupPlayers,
  resolveFieldDropPosition,
} from "../../leagues.utils";
import { LeagueText as Text } from "../common/LeagueText";
import { LineupBenchPlayerToken } from "./LineupBenchPlayerToken";
import { LineupShowcasePlayer } from "./LineupShowcasePlayer";
import { LineupTeamBadge } from "./LineupTeamBadge";
import { styles } from "../../leagues.styles";

export function LineupShowcaseStage(props: {
  homeTeam: MatchShowcaseTeam;
  awayTeam: MatchShowcaseTeam;
  kickoffAt: Date;
  players: TacticalPlayer[];
  benchPlayers: BenchPlayer[];
  selectedTeamLabel: string;
  selectedTeamShortName: string;
  selectedTeamGradient: GradientPair;
  onEditorModeChange?: (isActive: boolean) => void;
}) {
  const { width } = useWindowDimensions();
  const stageHeight = width < 390 ? 560 : 620;
  const normalizedPlayers = normalizeShowcaseLineupPlayers(props.players);
  const kickoffDateLabel = formatLineupKickoffDate(props.kickoffAt);
  const featurePulse = useRef(new Animated.Value(0)).current;
  const fieldLayerRef = useRef<View | null>(null);
  const [isVarEditorActive, setIsVarEditorActive] = useState(false);
  const [editorPlayers, setEditorPlayers] =
    useState<ShowcaseLineupPlayer[]>(normalizedPlayers);
  const [editorBenchPlayers, setEditorBenchPlayers] = useState<
    ShowcaseBenchPlayer[]
  >(() =>
    buildBenchShowcasePlayers(props.benchPlayers, props.selectedTeamGradient),
  );
  const [fieldLayerSize, setFieldLayerSize] = useState({
    width: 1,
    height: 1,
  });
  const [fieldLayerFrame, setFieldLayerFrame] = useState<FieldLayerFrame>({
    pageX: 0,
    pageY: 0,
    width: 1,
    height: 1,
  });

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(featurePulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(featurePulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [featurePulse]);

  useEffect(() => {
    setEditorPlayers(normalizeShowcaseLineupPlayers(props.players));
    setEditorBenchPlayers(
      buildBenchShowcasePlayers(props.benchPlayers, props.selectedTeamGradient),
    );
    setIsVarEditorActive(false);
    props.onEditorModeChange?.(false);
  }, [
    props.benchPlayers,
    props.onEditorModeChange,
    props.players,
    props.selectedTeamGradient,
  ]);

  const refreshFieldLayerFrame = useMemo(
    () => () => {
      requestAnimationFrame(() => {
        fieldLayerRef.current?.measureInWindow(
          (pageX, pageY, frameWidth, frameHeight) => {
            if (frameWidth > 0 && frameHeight > 0) {
              setFieldLayerFrame({
                pageX,
                pageY,
                width: frameWidth,
                height: frameHeight,
              });
            }
          },
        );
      });
    },
    [],
  );

  useEffect(() => {
    if (isVarEditorActive) {
      refreshFieldLayerFrame();
    }
  }, [isVarEditorActive, refreshFieldLayerFrame, width]);

  const featureIconScale = featurePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const featureGlowOpacity = featurePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.28],
  });
  const featureArrowShift = featurePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });
  const displayedPlayers = editorPlayers;
  const displayedBenchPlayers = editorBenchPlayers;
  const displayedFormationLabel =
    buildFormationLabelFromDisplayPlayers(editorPlayers);
  const varEditorHintText =
    "اسحب أي لاعب داخل الملعب بحرية، واسحب أي بديل من الدكة ثم أفلته فوق الملعب ليأخذ مكانه مباشرة.";

  function handleToggleVarEditor() {
    setIsVarEditorActive((currentValue) => {
      const nextValue = !currentValue;
      props.onEditorModeChange?.(nextValue);
      return nextValue;
    });
  }

  function handleResetVarEditor() {
    setEditorPlayers(normalizeShowcaseLineupPlayers(props.players));
    setEditorBenchPlayers(
      buildBenchShowcasePlayers(props.benchPlayers, props.selectedTeamGradient),
    );
    refreshFieldLayerFrame();
  }

  function handleConfirmVarEditor() {
    setIsVarEditorActive(false);
    props.onEditorModeChange?.(false);
  }

  function handleFieldPlayerDrag(
    playerId: string,
    nextX: number,
    nextDisplayY: number,
  ) {
    setEditorPlayers((currentPlayers) =>
      currentPlayers.map((player) =>
        player.id === playerId
          ? {
              ...player,
              x: nextX,
              y: nextDisplayY,
              displayY: nextDisplayY,
            }
          : player,
      ),
    );
  }

  function handleBenchPlayerDrop(
    player: ShowcaseBenchPlayer,
    moveX: number,
    moveY: number,
  ) {
    const dropPosition = resolveFieldDropPosition(
      moveX,
      moveY,
      fieldLayerFrame,
    );

    if (!dropPosition) {
      return false;
    }

    setEditorBenchPlayers((currentPlayers) =>
      currentPlayers.filter((currentPlayer) => currentPlayer.id !== player.id),
    );
    setEditorPlayers((currentPlayers) => [
      ...currentPlayers.filter(
        (currentPlayer) => currentPlayer.id !== player.id,
      ),
      {
        ...player,
        x: dropPosition.x,
        y: dropPosition.displayY,
        displayY: dropPosition.displayY,
      },
    ]);

    return true;
  }

  return (
    <View>
      <View style={styles.lineupStageShell}>
        <View style={styles.lineupStageHeader}>
          <View
            style={[
              styles.lineupStageHeaderGlow,
              styles.lineupStageHeaderGlowLeft,
              { backgroundColor: props.awayTeam.gradient[0] },
            ]}
          />
          <View
            style={[
              styles.lineupStageHeaderGlow,
              styles.lineupStageHeaderGlowRight,
              { backgroundColor: props.homeTeam.gradient[0] },
            ]}
          />

          <View style={styles.lineupStageBrandWrap}>
            <Image
              source={VAR_WORDMARK_ICON}
              resizeMode="contain"
              style={styles.lineupStageBrandImage as ImageStyle}
            />
          </View>

          <View style={styles.lineupStageHeaderRow}>
            <LineupTeamBadge
              gradient={props.awayTeam.gradient}
              iconSource={props.awayTeam.iconSource}
              shortName={props.awayTeam.shortName}
            />

            <View style={styles.lineupStageHeaderCenter}>
              <RNText style={styles.lineupStageKickoffText}>
                {kickoffDateLabel}
              </RNText>
              <Text style={styles.lineupStageHeadline}>
                {`تشكيلة ${props.selectedTeamLabel} المتوقعة`}
              </Text>
            </View>

            <LineupTeamBadge
              gradient={props.homeTeam.gradient}
              iconSource={props.homeTeam.iconSource}
              shortName={props.homeTeam.shortName}
            />
          </View>
        </View>

        <View style={[styles.lineupStageFieldWrap, { height: stageHeight }]}>
          <View style={styles.lineupStageFeatureTabWrap}>
            <Pressable
              onPress={handleToggleVarEditor}
              style={({ pressed }) => [
                styles.lineupStageFeatureTabPressable,
                pressed ? styles.lineupStageFeatureTabPressableActive : null,
              ]}
            >
              {({ pressed }) => {
                const isFeatureTabActive = pressed || isVarEditorActive;

                return (
                  <LinearGradient
                    colors={
                      isFeatureTabActive
                        ? ["rgba(245,251,255,1)", "rgba(133,208,255,0.98)"]
                        : ["rgba(255,255,255,0.84)", "rgba(127,168,255,0.78)"]
                    }
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[
                      styles.lineupStageFeatureTabBorder,
                      isFeatureTabActive
                        ? styles.lineupStageFeatureTabBorderActive
                        : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.lineupStageFeatureTabInner,
                        isFeatureTabActive
                          ? styles.lineupStageFeatureTabInnerActive
                          : null,
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.lineupStageFeatureTabIconHalo,
                          {
                            opacity: featureGlowOpacity,
                            transform: [{ scale: featureIconScale }],
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.lineupStageFeatureTabIconWrap,
                          isFeatureTabActive
                            ? styles.lineupStageFeatureTabIconWrapActive
                            : null,
                          { transform: [{ scale: featureIconScale }] },
                        ]}
                      >
                        <Ionicons
                          name={isVarEditorActive ? "scan-outline" : "sparkles"}
                          size={14}
                          color={isFeatureTabActive ? "#07151D" : "#EAF6FF"}
                        />
                      </Animated.View>
                      <RNText
                        style={[
                          styles.lineupStageFeatureTabText,
                          isFeatureTabActive
                            ? styles.lineupStageFeatureTabTextActive
                            : null,
                        ]}
                      >
                        تشكيل VAR
                      </RNText>
                      <Animated.View
                        style={{
                          transform: [{ translateX: featureArrowShift }],
                        }}
                      >
                        <Ionicons
                          name={
                            isVarEditorActive ? "close-outline" : "chevron-back"
                          }
                          size={16}
                          color={
                            isFeatureTabActive
                              ? "#FFFFFF"
                              : "rgba(255,255,255,0.9)"
                          }
                        />
                      </Animated.View>
                    </View>
                  </LinearGradient>
                );
              }}
            </Pressable>
          </View>

          <View style={styles.lineupStageFieldShadow} />

          <View style={styles.lineupStageFieldPlane}>
            <LinearGradient
              colors={["#3F9B56", "#318C48", "#256E39"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.lineupStageFieldSurface}
            >
              <View style={styles.lineupStageTouchline} />
              <View style={styles.lineupStageHalfwayLine} />
              <View style={styles.lineupStageCenterCircle} />
              <View style={styles.lineupStageCenterMark} />
              <View style={styles.lineupStageTopBox} />
              <View style={styles.lineupStageBottomBox} />
              <View style={styles.lineupStageTopGoalArea} />
              <View style={styles.lineupStageBottomGoalArea} />
            </LinearGradient>
          </View>

          <View
            ref={fieldLayerRef}
            style={styles.lineupStagePlayerLayer}
            onLayout={(event) => {
              setFieldLayerSize({
                width: event.nativeEvent.layout.width,
                height: event.nativeEvent.layout.height,
              });
              refreshFieldLayerFrame();
            }}
          >
            {displayedPlayers.map((player) => (
              <LineupShowcasePlayer
                key={player.id}
                player={player}
                shortName={props.selectedTeamShortName}
                isInteractive={isVarEditorActive}
                fieldSize={fieldLayerSize}
                onDragCommit={(nextX, nextDisplayY) =>
                  handleFieldPlayerDrag(player.id, nextX, nextDisplayY)
                }
              />
            ))}
          </View>

          <View style={styles.lineupStageFormationPill}>
            <RNText style={styles.lineupStageFormationText}>
              {displayedFormationLabel}
            </RNText>
          </View>

          <View style={styles.lineupStageWatermarkWrap}>
            <Image
              source={VAR_WORDMARK_ICON}
              resizeMode="contain"
              style={styles.lineupStageWatermarkImage as ImageStyle}
            />
          </View>
        </View>

        <View style={styles.lineupVarEditorPanel}>
          {isVarEditorActive ? (
            <View style={styles.lineupVarEditorTopRow}>
              <View style={styles.lineupVarEditorActionsRow}>
                <Pressable
                  onPress={handleResetVarEditor}
                  style={styles.lineupVarEditorActionButton}
                >
                  <Text style={styles.lineupVarEditorActionText}>
                    إعادة الضبط
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmVarEditor}
                  style={[
                    styles.lineupVarEditorActionButton,
                    styles.lineupVarEditorActionButtonPrimary,
                  ]}
                >
                  <Text
                    style={[
                      styles.lineupVarEditorActionText,
                      styles.lineupVarEditorActionTextPrimary,
                    ]}
                  >
                    تثبيت التعديل
                  </Text>
                </Pressable>
              </View>

              <View style={styles.lineupVarEditorCopyWrap}>
                <Text style={styles.lineupVarEditorTitle}>دكة بدلاء VAR</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.lineupVarBenchTitle}>دكة البدلاء</Text>
          )}

          {displayedBenchPlayers.length ? (
            <View style={styles.lineupVarBenchRow}>
              {displayedBenchPlayers.map((player) => (
                <LineupBenchPlayerToken
                  key={player.id}
                  player={player}
                  shortName={props.selectedTeamShortName}
                  isInteractive={isVarEditorActive}
                  onDragStart={refreshFieldLayerFrame}
                  onDropToField={(moveX, moveY) =>
                    handleBenchPlayerDrop(player, moveX, moveY)
                  }
                />
              ))}
            </View>
          ) : (
            <Text style={styles.lineupVarBenchEmpty}>
              كل البدلاء موجودون على أرضية الملعب الآن.
            </Text>
          )}

          {isVarEditorActive ? (
            <View style={styles.lineupVarEditorHintWrap}>
              <Text style={styles.lineupVarEditorHint}>
                {varEditorHintText}
              </Text>
              <Text style={styles.lineupVarEditorHintSecondary}>
                المس نفس الأيقونة واسحبها مباشرة، وتم تشديد حساسية اللمس ليلتقط
                السحب من أول لمسة.
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
