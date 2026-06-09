import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { HomeMode } from "../app.types";

type FloatingThemeSwitchProps = {
  selection: HomeMode;
  onChange: (mode: HomeMode) => void;
};

const TRACK_WIDTH = 68;
const TRACK_HEIGHT = 26;
const TRACK_PADDING = 2;
const BORDER_WIDTH = 1;
const LABEL_KNOB_GAP = 3;

export default function FloatingThemeSwitch(props: FloatingThemeSwitchProps) {
  const isXMode = props.selection === "x";
  const knobAnim = useRef(new Animated.Value(isXMode ? 1 : 0)).current;
  const { width } = useWindowDimensions();
  const layoutWidth = Math.min(width, 430);
  const chromeScale = Math.max(0.84, Math.min(1, layoutWidth / 430));

  const metrics = useMemo(() => {
    const trackWidth = Math.round(TRACK_WIDTH * chromeScale);
    const trackHeight = Math.round(TRACK_HEIGHT * chromeScale);
    const trackPadding = Math.max(2, Math.round(TRACK_PADDING * chromeScale));
    const borderWidth = BORDER_WIDTH;
    const innerWidth = trackWidth - trackPadding * 2 - borderWidth * 2;
    const innerHeight = trackHeight - trackPadding * 2 - borderWidth * 2;
    const knobSize = Math.min(innerWidth, innerHeight);
    const knobTravel = Math.max(0, innerWidth - knobSize);
    const knobTop = Math.max(0, (innerHeight - knobSize) / 2);
    const labelSize = Math.round(8 * chromeScale);
    const labelKnobGap = Math.max(2, Math.round(LABEL_KNOB_GAP * chromeScale));

    return {
      trackWidth,
      trackHeight,
      trackPadding,
      knobSize,
      knobTravel,
      knobTop,
      labelSize,
      labelKnobGap,
    };
  }, [chromeScale]);

  useEffect(() => {
    Animated.timing(knobAnim, {
      toValue: isXMode ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isXMode, knobAnim]);

  const knobTranslateX = knobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, metrics.knobTravel],
  });

  const handleToggle = () => {
    props.onChange(isXMode ? "tiktok" : "x");
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isXMode }}
      onPress={handleToggle}
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      <View
        style={[
          styles.track,
          {
            width: metrics.trackWidth,
            height: metrics.trackHeight,
            padding: metrics.trackPadding,
            backgroundColor: isXMode ? "#1D9BF0" : "#000000",
          },
        ]}
      >
        <View style={styles.trackInner}>
          <Animated.View
            style={[
              styles.knob,
              {
                top: metrics.knobTop,
                width: metrics.knobSize,
                height: metrics.knobSize,
                borderRadius: metrics.knobSize / 2,
                transform: [{ translateX: knobTranslateX }],
              },
            ]}
          />

          <View
            pointerEvents="none"
            style={[
              styles.labelRow,
              isXMode
                ? {
                    justifyContent: "flex-start",
                    paddingLeft: metrics.labelKnobGap,
                    paddingRight: metrics.knobSize + metrics.labelKnobGap,
                  }
                : {
                    justifyContent: "flex-start",
                    paddingLeft: metrics.knobSize + metrics.labelKnobGap,
                    paddingRight: metrics.labelKnobGap,
                  },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, { fontSize: metrics.labelSize }]}
            >
              {isXMode ? "VAR X" : "VARtik"}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  track: {
    borderRadius: 999,
    borderWidth: BORDER_WIDTH,
    borderColor: "rgba(255,255,255,0.92)",
    direction: "ltr",
  },
  trackInner: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
  },
  knob: {
    position: "absolute",
    left: 0,
    backgroundColor: "#FFFFFF",
  },
  labelRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: 0,
    includeFontPadding: false,
    flexShrink: 0,
    ...Platform.select({
      android: {
        fontFamily: "sans-serif-black",
      },
      ios: {
        fontWeight: "900",
      },
      default: {
        fontWeight: "900",
      },
    }),
  },
});
