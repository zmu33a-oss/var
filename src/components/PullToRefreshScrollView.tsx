import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from "react-native";

const PULL_TRIGGER_DISTANCE = 76;
const PULL_MAX_DISTANCE = 112;

type PullToRefreshScrollViewProps = Omit<ScrollViewProps, "refreshControl"> & {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  webPullLabel?: string;
  webRefreshingLabel?: string;
};

function readTouchPageY(event: GestureResponderEvent) {
  const nativeEvent = event.nativeEvent as unknown as {
    touches?: Array<{ pageY?: number; locationY?: number }>;
  };
  const touch = nativeEvent.touches?.[0];

  if (typeof touch?.pageY === "number") {
    return touch.pageY;
  }

  return typeof touch?.locationY === "number" ? touch.locationY : null;
}

export function PullToRefreshScrollView(props: PullToRefreshScrollViewProps) {
  const {
    refreshing,
    onRefresh,
    webPullLabel = "اسحب للتحديث",
    webRefreshingLabel = "جارٍ التحديث",
    onScroll,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    scrollEventThrottle,
    style,
    ...scrollViewProps
  } = props;
  const scrollOffsetYRef = useRef(0);
  const pullStartYRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const refreshRequestInFlightRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);

  const updatePullDistance = (distance: number) => {
    pullDistanceRef.current = distance;
    setPullDistance(distance);
  };

  const requestRefresh = async () => {
    if (refreshing || refreshRequestInFlightRef.current) {
      return;
    }

    refreshRequestInFlightRef.current = true;

    try {
      await Promise.resolve(onRefresh());
    } finally {
      refreshRequestInFlightRef.current = false;
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
    onScroll?.(event);
  };

  const handleTouchStart = (event: GestureResponderEvent) => {
    onTouchStart?.(event);

    if (
      Platform.OS !== "web" ||
      refreshing ||
      refreshRequestInFlightRef.current
    ) {
      return;
    }

    if (scrollOffsetYRef.current > 1) {
      pullStartYRef.current = null;
      return;
    }

    pullStartYRef.current = readTouchPageY(event);
  };

  const handleTouchMove = (event: GestureResponderEvent) => {
    onTouchMove?.(event);

    if (
      Platform.OS !== "web" ||
      refreshing ||
      refreshRequestInFlightRef.current
    ) {
      return;
    }

    const startY = pullStartYRef.current;
    const currentY = readTouchPageY(event);

    if (startY === null || currentY === null) {
      return;
    }

    if (scrollOffsetYRef.current > 1) {
      updatePullDistance(0);
      pullStartYRef.current = null;
      return;
    }

    updatePullDistance(
      Math.min(Math.max(0, currentY - startY), PULL_MAX_DISTANCE),
    );
  };

  const finishWebPull = (event: GestureResponderEvent) => {
    const shouldRefresh =
      Platform.OS === "web" &&
      pullDistanceRef.current >= PULL_TRIGGER_DISTANCE &&
      !refreshing &&
      !refreshRequestInFlightRef.current;

    pullStartYRef.current = null;
    updatePullDistance(0);

    if (shouldRefresh) {
      void requestRefresh();
    }

    return event;
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    onTouchEnd?.(event);
    finishWebPull(event);
  };

  const handleTouchCancel = (event: GestureResponderEvent) => {
    onTouchCancel?.(event);
    finishWebPull(event);
  };

  return (
    <View style={styles.host}>
      {Platform.OS === "web" && (pullDistance > 0 || refreshing) ? (
        <View
          pointerEvents="none"
          style={[
            styles.webRefreshIndicator,
            {
              opacity: refreshing
                ? 1
                : Math.min(1, pullDistance / PULL_TRIGGER_DISTANCE),
              transform: [
                {
                  translateY: refreshing ? 8 : Math.max(-42, pullDistance - 62),
                },
              ],
            },
          ]}
        >
          <Ionicons
            name={refreshing ? "sync" : "arrow-down"}
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.webRefreshText}>
            {refreshing ? webRefreshingLabel : webPullLabel}
          </Text>
        </View>
      ) : null}

      <ScrollView
        {...scrollViewProps}
        style={[styles.scrollView, style]}
        scrollEventThrottle={scrollEventThrottle ?? 16}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void requestRefresh();
            }}
            tintColor="#FFFFFF"
            colors={["#1D9BF0"]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  webRefreshIndicator: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    zIndex: 60,
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(29,155,240,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  webRefreshText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
});
