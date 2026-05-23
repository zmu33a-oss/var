import { LinearGradient } from "expo-linear-gradient";
import { Animated, PanResponder, Text as RNText, View } from "react-native";
import { useEffect, useMemo, useRef } from "react";
import type { ShowcaseLineupPlayer } from "../../leagues.types";
import { clampLineupCoordinate } from "../../leagues.utils";
import { LeagueText as Text } from "../common/LeagueText";
import { styles } from "../../leagues.styles";

export function LineupShowcasePlayer(props: {
  player: ShowcaseLineupPlayer;
  shortName: string;
  isInteractive?: boolean;
  fieldSize: { width: number; height: number };
  onDragCommit?: (nextX: number, nextDisplayY: number) => void;
}) {
  const dragOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragLift = useRef(new Animated.Value(0)).current;
  const dragScale = dragLift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  useEffect(() => {
    dragOffset.setValue({ x: 0, y: 0 });
    dragLift.setValue(0);
  }, [
    dragLift,
    dragOffset,
    props.player.displayY,
    props.player.id,
    props.player.x,
  ]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => Boolean(props.isInteractive),
        onStartShouldSetPanResponderCapture: () => Boolean(props.isInteractive),
        onMoveShouldSetPanResponder: () => Boolean(props.isInteractive),
        onMoveShouldSetPanResponderCapture: () => Boolean(props.isInteractive),
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          Animated.spring(dragLift, {
            toValue: 1,
            speed: 18,
            bounciness: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderMove: Animated.event(
          [null, { dx: dragOffset.x, dy: dragOffset.y }],
          { useNativeDriver: false },
        ),
        onPanResponderRelease: (_, gestureState) => {
          Animated.spring(dragLift, {
            toValue: 0,
            speed: 18,
            bounciness: 0,
            useNativeDriver: true,
          }).start();

          Animated.spring(dragOffset, {
            toValue: { x: 0, y: 0 },
            speed: 20,
            bounciness: 0,
            useNativeDriver: false,
          }).start();

          if (!props.isInteractive) {
            return;
          }

          props.onDragCommit?.(
            clampLineupCoordinate(
              props.player.x +
                gestureState.dx / Math.max(props.fieldSize.width, 1),
              0.08,
              0.92,
            ),
            clampLineupCoordinate(
              props.player.displayY +
                gestureState.dy / Math.max(props.fieldSize.height, 1),
              0.06,
              0.94,
            ),
          );
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragLift, {
            toValue: 0,
            speed: 18,
            bounciness: 0,
            useNativeDriver: true,
          }).start();

          Animated.spring(dragOffset, {
            toValue: { x: 0, y: 0 },
            speed: 20,
            bounciness: 0,
            useNativeDriver: false,
          }).start();
        },
      }),
    [
      dragLift,
      dragOffset,
      props.fieldSize.height,
      props.fieldSize.width,
      props.isInteractive,
      props.onDragCommit,
      props.player.displayY,
      props.player.x,
    ],
  );

  return (
    <Animated.View
      style={[
        styles.lineupPlayerMarker,
        {
          left: `${props.player.x * 100}%`,
          top: `${props.player.displayY * 100}%`,
          transform: [
            { translateX: -34 },
            { translateY: -28 },
            { translateX: dragOffset.x },
            { translateY: dragOffset.y },
            { scale: dragScale },
          ],
        },
      ]}
      {...(props.isInteractive ? panResponder.panHandlers : {})}
    >
      <View style={styles.lineupPlayerPressable}>
        <View style={styles.lineupPlayerAvatarShell}>
          <LinearGradient
            colors={props.player.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.lineupPlayerAvatarCore}
          >
            <View style={styles.lineupPlayerAvatarHead} />
            <View style={styles.lineupPlayerAvatarBody} />
          </LinearGradient>
        </View>

        <View style={styles.lineupPlayerNumberBadge}>
          <RNText style={styles.lineupPlayerNumberText}>
            {props.player.number}
          </RNText>
        </View>

        <View style={styles.lineupPlayerTeamBadge}>
          <RNText style={styles.lineupPlayerTeamBadgeText}>
            {props.shortName}
          </RNText>
        </View>

        <Text numberOfLines={1} style={styles.lineupPlayerName}>
          {props.player.name}
        </Text>
      </View>
    </Animated.View>
  );
}
