import { LinearGradient } from "expo-linear-gradient";
import { Animated, PanResponder, Text as RNText, View } from "react-native";
import { useEffect, useMemo, useRef } from "react";
import type { ShowcaseBenchPlayer } from "../../leagues.types";
import { LeagueText as Text } from "../common/LeagueText";
import { styles } from "../../leagues.styles";

export function LineupBenchPlayerToken(props: {
  player: ShowcaseBenchPlayer;
  shortName: string;
  isInteractive: boolean;
  onDragStart?: () => void;
  onDropToField: (moveX: number, moveY: number) => boolean;
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
  }, [dragLift, dragOffset, props.player.id]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => props.isInteractive,
        onStartShouldSetPanResponderCapture: () => props.isInteractive,
        onMoveShouldSetPanResponder: () => props.isInteractive,
        onMoveShouldSetPanResponderCapture: () => props.isInteractive,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          props.onDragStart?.();
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
          const didDropIntoField = props.onDropToField(
            gestureState.moveX,
            gestureState.moveY,
          );

          Animated.spring(dragLift, {
            toValue: 0,
            speed: 18,
            bounciness: 0,
            useNativeDriver: true,
          }).start();

          if (didDropIntoField) {
            return;
          }

          Animated.spring(dragOffset, {
            toValue: { x: 0, y: 0 },
            speed: 20,
            bounciness: 0,
            useNativeDriver: false,
          }).start();
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
      props.isInteractive,
      props.onDragStart,
      props.onDropToField,
    ],
  );

  return (
    <Animated.View
      style={styles.lineupVarBenchToken}
      {...(props.isInteractive ? panResponder.panHandlers : {})}
    >
      <Animated.View
        style={{
          transform: [
            { translateX: dragOffset.x },
            { translateY: dragOffset.y },
            { scale: dragScale },
          ],
        }}
      >
        <View style={styles.lineupVarBenchAvatarShell}>
          <LinearGradient
            colors={props.player.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.lineupVarBenchAvatarCore}
          >
            <View style={styles.lineupVarBenchAvatarHead} />
            <View style={styles.lineupVarBenchAvatarBody} />
          </LinearGradient>
        </View>

        <View style={styles.lineupVarBenchNumberBadge}>
          <RNText style={styles.lineupVarBenchNumberText}>
            {props.player.number}
          </RNText>
        </View>

        <View style={styles.lineupVarBenchTeamBadge}>
          <RNText style={styles.lineupVarBenchTeamBadgeText}>
            {props.shortName}
          </RNText>
        </View>

        <Text numberOfLines={1} style={styles.lineupVarBenchName}>
          {props.player.name}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
