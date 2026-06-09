import { Ionicons } from "@expo/vector-icons";
import { Animated, Pressable, Text as RNText, View } from "react-native";
import { useRef } from "react";
import { Platform } from "react-native";
import { MATCH_DETAIL_TABS } from "../leagues.constants";
import type { IoniconName, MatchDetailTabKey } from "../leagues.types";
import { styles } from "../leagues.styles";

const SHOULD_USE_NATIVE_DRIVER = Platform.OS !== "web";

export function MatchDetailTabButton(props: {
  accentColor: string;
  accentSurface: string;
  iconName: IoniconName;
  label: string;
  isActive: boolean;
  onPress: () => void;
  compact?: boolean;
  showDivider?: boolean;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.96,
      useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      speed: 22,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      speed: 18,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.matchDetailTabButtonMotion,
        {
          transform: [
            { translateY: props.isActive ? -1 : 0 },
            { scale: pressScale },
          ],
        },
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.matchShowcaseFooterTabButton,
          styles.matchDetailTabButton,
          props.compact ? styles.matchDetailTabButtonCompact : null,
          props.isActive ? styles.matchShowcaseFooterTabButtonActive : null,
          props.isActive
            ? [
                styles.matchDetailTabButtonActive,
                { backgroundColor: props.accentSurface },
              ]
            : null,
          pressed ? styles.matchDetailTabButtonPressed : null,
        ]}
        onPress={props.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          style={[
            styles.matchShowcaseFooterTabIconWrap,
            styles.matchDetailTabIconWrap,
          ]}
        >
          <Ionicons
            color={props.isActive ? "#FFFFFF" : "rgba(255,255,255,0.82)"}
            name={props.iconName}
            size={18}
          />
        </View>

        <RNText
          style={[
            styles.matchShowcaseFooterTabText,
            styles.matchDetailTabButtonText,
            props.compact ? styles.matchDetailTabButtonTextCompact : null,
            props.isActive
              ? [
                  styles.matchDetailTabButtonTextActive,
                  { color: props.accentColor },
                ]
              : null,
          ]}
        >
          {props.label}
        </RNText>
      </Pressable>
    </Animated.View>
  );
}

export function MatchDetailStickyTabsCard(props: {
  activeTab: MatchDetailTabKey;
  onTabChange: (tab: MatchDetailTabKey) => void;
}) {
  return (
    <View style={styles.matchDetailStickyTabsWrap}>
      <View style={styles.matchDetailStickyTabsCard}>
        <View
          style={[
            styles.matchShowcaseFooterTabsRow,
            styles.matchDetailStickyTabsRow,
          ]}
        >
          {MATCH_DETAIL_TABS.map((tab, index) => (
            <MatchDetailTabButton
              compact
              accentColor={tab.accentColor}
              accentSurface={tab.accentSurface}
              iconName={tab.iconName}
              key={tab.key}
              isActive={props.activeTab === tab.key}
              label={tab.label}
              onPress={() => props.onTabChange(tab.key)}
              showDivider={index < MATCH_DETAIL_TABS.length - 1}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
