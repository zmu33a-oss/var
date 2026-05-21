import React, { type ComponentProps, useEffect, useRef } from "react";
import { FlatList, Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const ITEM_SIZE = 55;
const VISIBLE_ITEMS = 3;
const HEIGHT = ITEM_SIZE * VISIBLE_ITEMS;

export interface WheelItem {
  id: string;
  label: string;
  emoji: string;
  count?: number;
  iconName?: ComponentProps<typeof Ionicons>["name"];
  isVisible?: boolean;
  canToggleVisibility?: boolean;
}

interface IOSWheelPickerProps {
  items: WheelItem[];
  selectedId?: string;
  onValueChange: (item: WheelItem) => void;
  onToggleVisibility?: (item: WheelItem) => void;
}

export default function IOSWheelPicker(props: IOSWheelPickerProps) {
  const { items, onValueChange, onToggleVisibility, selectedId } = props;
  const scrollY = useSharedValue(0);
  const snappedIndex = useSharedValue(0);
  const listRef = useRef<FlatList<WheelItem>>(null);
  const lastIndex = useRef(0);
  const lastHapticIndex = useRef(0);

  useEffect(() => {
    if (!items.length) {
      return;
    }

    const index = Math.max(
      0,
      items.findIndex((item) => item.id === selectedId),
    );

    if (index === lastIndex.current) {
      return;
    }

    lastIndex.current = index;
    lastHapticIndex.current = index;
    snappedIndex.value = index;
    listRef.current?.scrollToOffset({
      offset: index * ITEM_SIZE,
      animated: false,
    });
  }, [items, selectedId, snappedIndex]);

  const syncSelection = (index: number) => {
    if (index < 0 || index >= items.length) {
      return;
    }

    if (index !== lastIndex.current) {
      lastIndex.current = index;
      if (items[index]) {
        onValueChange(items[index]);
      }
    }
  };

  const triggerHaptic = (index: number) => {
    if (index !== lastHapticIndex.current) {
      lastHapticIndex.current = index;
      void Haptics.selectionAsync();
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;

      const index = Math.round(event.contentOffset.y / ITEM_SIZE);
      if (index >= 0 && index < items.length && index !== snappedIndex.value) {
        snappedIndex.value = index;
        runOnJS(syncSelection)(index);
      }
    },
  });

  const handleSettle = (offsetY: number) => {
    const index = Math.min(
      items.length - 1,
      Math.max(0, Math.round(offsetY / ITEM_SIZE)),
    );
    const targetOffset = index * ITEM_SIZE;

    if (Math.abs(offsetY - targetOffset) > 0.5) {
      listRef.current?.scrollToOffset({
        offset: targetOffset,
        animated: true,
      });
    }

    snappedIndex.value = index;
    syncSelection(index);
    triggerHaptic(index);
  };

  return (
    <View style={styles.container}>
      <View style={styles.pickerBox}>
        <View
          style={[styles.gradientOverlay, styles.topOverlay]}
          pointerEvents="none"
        />
        <View
          style={[styles.gradientOverlay, styles.bottomOverlay]}
          pointerEvents="none"
        />

        <View style={styles.activeIndicator} pointerEvents="none" />

        <Animated.FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item) => item.id}
          snapToInterval={ITEM_SIZE}
          snapToAlignment="start"
          snapToOffsets={items.map((_, index) => index * ITEM_SIZE)}
          decelerationRate={0.996}
          bounces={false}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onScrollEndDrag={(event) => {
            const velocity = Math.abs(event.nativeEvent.velocity?.y ?? 0);

            if (velocity < 0.12) {
              handleSettle(event.nativeEvent.contentOffset.y);
            }
          }}
          onMomentumScrollEnd={(event) =>
            handleSettle(event.nativeEvent.contentOffset.y)
          }
          getItemLayout={(_, index) => ({
            length: ITEM_SIZE,
            offset: ITEM_SIZE * index,
            index,
          })}
          contentContainerStyle={{
            paddingVertical: ITEM_SIZE,
          }}
          renderItem={({ item, index }) => (
            <WheelRow
              item={item}
              index={index}
              onToggleVisibility={onToggleVisibility}
              scrollY={scrollY}
              selectedId={selectedId}
            />
          )}
        />
      </View>
    </View>
  );
}

function WheelRow(props: {
  item: WheelItem;
  index: number;
  onToggleVisibility?: (item: WheelItem) => void;
  scrollY: SharedValue<number>;
  selectedId?: string;
}) {
  const { item, index, onToggleVisibility, scrollY, selectedId } = props;
  const isActive = item.id === selectedId;
  const canToggleVisibility = Boolean(item.canToggleVisibility);

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * ITEM_SIZE,
      index * ITEM_SIZE,
      (index + 1) * ITEM_SIZE,
    ];

    const rotateX = interpolate(
      scrollY.value,
      inputRange,
      [18, 0, -18],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      scrollY.value,
      inputRange,
      [0.25, 1, 0.25],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      scrollY.value,
      inputRange,
      [0.92, 1, 0.92],
      Extrapolation.CLAMP,
    );

    const translateY = interpolate(
      scrollY.value,
      inputRange,
      [3, 0, -3],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [
        { perspective: 350 },
        { rotateX: `${rotateX}deg` },
        { translateY },
        { scale },
      ],
    };
  });

  return (
    <Animated.View style={[styles.row, animatedStyle]}>
      {canToggleVisibility ? (
        <Pressable
          disabled={!onToggleVisibility}
          hitSlop={10}
          style={[
            styles.visibilitySwitch,
            item.isVisible ? styles.visibilitySwitchOn : null,
            !isActive ? styles.visibilitySwitchInactive : null,
          ]}
          onPressIn={() => {
            if (!isActive) {
              return;
            }

            onToggleVisibility?.(item);
          }}
        >
          <Text style={styles.visibilitySwitchLabel}>
            {item.isVisible ? "ON" : "OFF"}
          </Text>
          <View
            style={[
              styles.visibilitySwitchThumb,
              item.isVisible ? styles.visibilitySwitchThumbOn : null,
            ]}
          />
        </Pressable>
      ) : (
        <View
          style={[
            styles.visibilityStatePill,
            item.isVisible ? styles.visibilityStatePillOn : null,
          ]}
        >
          <Text style={styles.visibilityStateText}>
            {item.isVisible ? "ON" : "OFF"}
          </Text>
        </View>
      )}

      <View style={styles.contentGroup}>
        <View style={styles.titleWrap}>
          <Text style={styles.label}>{item.label}</Text>
        </View>

        <View style={styles.metricWrap}>
          <Ionicons
            name={item.iconName ?? "ellipse"}
            size={18}
            color="#F2FFFE"
          />
          <Text style={styles.metricValue}>{item.count ?? 0}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerBox: {
    width: "100%",
    height: HEIGHT,
    borderRadius: 24,
    backgroundColor: "rgba(10, 42, 46, 0.64)",
    borderWidth: 1,
    borderColor: "rgba(141, 239, 218, 0.16)",
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
  },
  activeIndicator: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 55,
    top: 55,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(188, 255, 240, 0.18)",
    backgroundColor: "rgba(25, 118, 109, 0.18)",
    borderRadius: 8,
  },
  row: {
    height: 55,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 18,
  },
  visibilitySwitch: {
    width: 68,
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    position: "relative",
    overflow: "hidden",
  },
  visibilitySwitchOn: {
    backgroundColor: "#10D411",
  },
  visibilitySwitchInactive: {
    opacity: 0.72,
  },
  visibilitySwitchLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "left",
  },
  visibilitySwitchThumb: {
    position: "absolute",
    left: 4,
    top: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  visibilitySwitchThumbOn: {
    left: 40,
  },
  visibilityStatePill: {
    minWidth: 60,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  visibilityStatePillOn: {
    backgroundColor: "rgba(16,212,17,0.9)",
  },
  visibilityStateText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  contentGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 12,
  },
  titleWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 17,
    color: "#F2FFFE",
    fontWeight: "900",
    textAlign: "center",
  },
  metricWrap: {
    minWidth: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  metricValue: {
    color: "#F2FFFE",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "right",
    marginLeft: 8,
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 55,
    zIndex: 10,
  },
  topOverlay: {
    top: 0,
    backgroundColor: "rgba(6, 18, 24, 0.84)",
  },
  bottomOverlay: {
    bottom: 0,
    backgroundColor: "rgba(6, 18, 24, 0.84)",
  },
});
