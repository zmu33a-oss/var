import { useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

type FloatingProfileArrowProps = {
  onOpen: () => void;
};

export default function FloatingProfileArrow(props: FloatingProfileArrowProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -3,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 3,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 4,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          dragY.setValue(Math.min(gs.dy, 40));
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 20) {
          props.onOpen();
        }
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const translateY = Animated.add(floatAnim, dragY);

  return (
    <Pressable style={styles.container} onPress={props.onOpen} {...panResponder.panHandlers}>
      <Animated.View style={[styles.arrow, { transform: [{ translateY }] }]}>
        <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.75)" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
  },
  arrow: {
    alignItems: "center",
    justifyContent: "center",
  },
});
