import {
  Animated,
  Image,
  type ImageStyle,
  Pressable,
  ScrollView,
  Text as RNText,
  View,
  useWindowDimensions,
} from "react-native";
import {
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "../../../lib/crossPlatformStyles";
import { VAR_WORDMARK_ICON } from "../leagues.constants";
import { getLeagueOverviewIconSource } from "../leagues.utils";
import type { LeagueOverviewCard } from "../leagues.types";
import { LeagueText as Text } from "./common/LeagueText";
import { styles } from "../leagues.styles";

export function LeaguesListHeader(props: {
  headerFontFamily?: string;
  isLeagueDrawerOpen: boolean;
  leagueDrawerItems: LeagueOverviewCard[];
  selectedLeagueId: string | null;
  onToggleLeagueDrawer: () => void;
  onSelectLeague: (leagueId: string) => void;
  drawerProgress: Animated.Value;
}) {
  const { height: viewportHeight } = useWindowDimensions();
  const drawerMaxHeight = Math.min(
    props.leagueDrawerItems.length * 76 + 16,
    Math.max(520, viewportHeight - 138),
  );
  const drawerOpacity = props.drawerProgress.interpolate({
    inputRange: [0, 0.18, 1],
    outputRange: [0, 0.45, 1],
  });
  const drawerTranslateX = props.drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [96, 0],
  });
  const drawerTranslateY = props.drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 0],
  });
  const drawerScale = props.drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <View style={styles.leaguesListHeader}>
      <View style={styles.leaguesListHeaderRow}>
        <View style={styles.leaguesListHeaderCenterBlock}>
          <RNText
            style={[
              styles.leaguesListTitle,
              styles.leaguesListTitleCentered,
              props.headerFontFamily
                ? { fontFamily: props.headerFontFamily }
                : null,
            ]}
          >
            الدوريات
          </RNText>
        </View>
      </View>

      <View
        {...getNativePointerEventsProps("box-none")}
        style={[
          styles.leaguesListVarAnchor,
          getWebPointerEventsStyle("box-none"),
        ]}
      >
        <Pressable
          onPress={props.onToggleLeagueDrawer}
          style={({ pressed }) => [
            styles.leaguesListVarTrigger,
            props.isLeagueDrawerOpen
              ? styles.leaguesListVarTriggerActive
              : null,
            pressed ? styles.leaguesListVarTriggerPressed : null,
          ]}
        >
          <Image
            source={VAR_WORDMARK_ICON}
            resizeMode="contain"
            tintColor="#0B0D12"
            style={styles.leaguesListVarTriggerImage as ImageStyle}
          />
        </Pressable>

        <Animated.View
          {...getNativePointerEventsProps(
            props.isLeagueDrawerOpen ? "auto" : "none",
          )}
          style={[
            styles.leaguesListDrawerWrap,
            { maxHeight: drawerMaxHeight },
            {
              opacity: drawerOpacity,
              transform: [
                { translateX: drawerTranslateX },
                { translateY: drawerTranslateY },
                { scale: drawerScale },
              ],
            },
            getWebPointerEventsStyle(
              props.isLeagueDrawerOpen ? "auto" : "none",
            ),
          ]}
        >
          <ScrollView
            bounces={false}
            nestedScrollEnabled
            scrollEnabled={props.isLeagueDrawerOpen}
            showsVerticalScrollIndicator={false}
            style={styles.leaguesListDrawerScroll}
            contentContainerStyle={styles.leaguesListDrawerContent}
          >
            {props.leagueDrawerItems.map((card, index) => {
              const itemOpacity = props.drawerProgress.interpolate({
                inputRange: [0, Math.min(0.55 + index * 0.12, 0.9), 1],
                outputRange: [0, 0, 1],
                extrapolate: "clamp",
              });
              const itemTranslateX = props.drawerProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [44 + index * 10, 0],
              });
              const itemTranslateY = props.drawerProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [-(index + 1) * 3, 0],
              });

              return (
                <Animated.View
                  key={card.id}
                  style={[
                    styles.leaguesListDrawerItemWrap,
                    {
                      opacity: itemOpacity,
                      transform: [
                        { translateX: itemTranslateX },
                        { translateY: itemTranslateY },
                      ],
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => props.onSelectLeague(card.id)}
                    style={[
                      styles.leaguesListDrawerItem,
                      props.selectedLeagueId === card.id
                        ? styles.leaguesListDrawerItemActive
                        : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.leaguesListDrawerAccentLine,
                        { backgroundColor: card.accent },
                      ]}
                    />

                    <View style={styles.leaguesListDrawerTextBlock}>
                      <RNText style={styles.leaguesListDrawerTitle}>
                        {card.title}
                      </RNText>
                      <Text
                        numberOfLines={1}
                        style={styles.leaguesListDrawerSummary}
                      >
                        {card.summary}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.leaguesListDrawerIconWrap,
                        {
                          borderColor: `${card.accent}66`,
                          backgroundColor: `${card.accent}15`,
                        },
                      ]}
                    >
                      <Image
                        source={getLeagueOverviewIconSource(card.id)}
                        resizeMode="contain"
                        style={styles.leaguesListDrawerIconImage as ImageStyle}
                      />
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}
