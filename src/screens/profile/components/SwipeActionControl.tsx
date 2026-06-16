import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  PanResponder,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import {
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "../../../lib/crossPlatformStyles";
import { getArabicFontStyle } from "../profile.helpers";
import {
  SLIDE_HORIZONTAL_PADDING,
  SLIDE_THUMB_SIZE,
  SLIDE_THRESHOLD,
} from "../profile.constants";
import type { SwipeActionControlProps } from "../profile.constants";
import { styles } from "../profile.styles";

export function SwipeActionControl(props: SwipeActionControlProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [localCompleted, setLocalCompleted] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCompleted = props.completed || localCompleted;
  const activeLabel =
    isCompleted || props.busy ? props.completedLabel : props.label;
  const iconName = isCompleted ? "checkmark" : (props.iconName ?? "logo-apple");
  const iconColor = isCompleted ? "#09111C" : (props.iconColor ?? "rgba(255,255,255,0.96)");
  const maxOffset = Math.max(
    0,
    trackWidth - SLIDE_THUMB_SIZE - SLIDE_HORIZONTAL_PADDING * 2,
  );
  const sliderTextArabicStyle = getArabicFontStyle(
    props.arabicFontFamily,
    activeLabel,
  );

  useEffect(() => {
    if (props.completed) {
      translateX.setValue(maxOffset);
      return;
    }

    if (!localCompleted) {
      translateX.setValue(0);
    }
  }, [localCompleted, maxOffset, props.completed, translateX]);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const resetThumb = () => {
    setLocalCompleted(false);
    Animated.spring(translateX, {
      toValue: 0,
      bounciness: 0,
      speed: 20,
      useNativeDriver: false,
    }).start();
  };

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const completeSlide = async () => {
    setLocalCompleted(true);
    await props.onReachedEnd?.();
    await props.onComplete();

    if (props.resetAfterComplete && !props.completed) {
      resetTimeoutRef.current = setTimeout(() => {
        resetThumb();
      }, props.resetDelayMs ?? 900);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponderCapture: () =>
      !props.busy && !isCompleted && maxOffset > 0,
    onStartShouldSetPanResponder: () =>
      !props.busy && !isCompleted && maxOffset > 0,
    onMoveShouldSetPanResponderCapture: (_event, gestureState) =>
      !props.busy &&
      !isCompleted &&
      maxOffset > 0 &&
      gestureState.dx > 3 &&
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onMoveShouldSetPanResponder: (_event, gestureState) =>
      !props.busy &&
      !isCompleted &&
      maxOffset > 0 &&
      gestureState.dx > 3 &&
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderMove: (_event, gestureState) => {
      const nextOffset = Math.max(0, Math.min(maxOffset, gestureState.dx));
      translateX.setValue(nextOffset);
    },
    onPanResponderRelease: (_event, gestureState) => {
      const nextOffset = Math.max(0, Math.min(maxOffset, gestureState.dx));

      if (nextOffset >= maxOffset * SLIDE_THRESHOLD) {
        void completeSlide();

        Animated.timing(translateX, {
          toValue: maxOffset,
          duration: 170,
          useNativeDriver: false,
        }).start();
        return;
      }

      resetThumb();
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderTerminate: resetThumb,
  });

  return (
    <View style={styles.sliderTrack} onLayout={handleTrackLayout}>
      <View style={styles.sliderTextRow}>
        <Ionicons name={iconName} size={15} color={iconColor} />
        <Text style={[styles.sliderText, sliderTextArabicStyle]}>
          {activeLabel}
        </Text>
      </View>

      <View
        {...getNativePointerEventsProps("none")}
        style={[styles.sliderTrailIcons, getWebPointerEventsStyle("none")]}
      >
        <Ionicons
          name="chevron-forward"
          size={14}
          color="rgba(255,255,255,0.28)"
        />
        <Ionicons
          name="chevron-forward"
          size={14}
          color="rgba(255,255,255,0.44)"
          style={styles.sliderTrailIconSpacing}
        />
        <Ionicons
          name="chevron-forward"
          size={14}
          color="rgba(255,255,255,0.62)"
          style={styles.sliderTrailIconSpacing}
        />
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.sliderThumb,
          isCompleted ? styles.sliderThumbCompleted : null,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <Ionicons name={isCompleted ? "checkmark" : "chevron-forward"} size={22} color="#09111C" />
      </Animated.View>
    </View>
  );
}
