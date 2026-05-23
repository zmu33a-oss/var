import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { SHOULD_USE_NATIVE_DRIVER } from "../leagues.constants";

export function useDrawerAnimation(isOpen: boolean) {
  const drawerProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(drawerProgress, {
      toValue: isOpen ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [isOpen, drawerProgress]);

  return drawerProgress;
}
