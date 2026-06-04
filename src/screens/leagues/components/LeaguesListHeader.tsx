import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  I18nManager,
  Pressable,
  Text as RNText,
  View,
} from "react-native";
import { SHOULD_USE_NATIVE_DRIVER } from "../leagues.constants";
import { styles } from "../leagues.styles";

export function LeaguesListHeader(props: {
  headerFontFamily?: string;
  headerTitle: string;
  onToggleLeagueDrawer: () => void;
}) {
  const headerChevronBob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bobAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(headerChevronBob, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
        }),
        Animated.timing(headerChevronBob, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
        }),
      ]),
    );

    bobAnimation.start();
    return () => bobAnimation.stop();
  }, [headerChevronBob]);

  const headerChevronTranslateY = headerChevronBob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5],
  });

  return (
    <View style={styles.leaguesListHeader}>
      <View style={styles.leaguesListHeaderRow}>
        <Pressable
          onPress={props.onToggleLeagueDrawer}
          style={[
            styles.leaguesListHeaderCenterBlock,
            styles.leaguesListHeaderTitlePressable,
          ]}
        >
          <View style={styles.leaguesListHeaderTitleRow}>
            {I18nManager.isRTL ? (
              <Animated.View
                style={[
                  styles.leaguesListHeaderChevronWrap,
                  styles.leaguesListHeaderChevronWrapRtl,
                  { transform: [{ translateY: headerChevronTranslateY }] },
                ]}
              >
                <View style={styles.leaguesListHeaderChevron} />
              </Animated.View>
            ) : null}

            <RNText
              style={[
                styles.leaguesListTitle,
                styles.leaguesListTitleCentered,
                props.headerFontFamily
                  ? { fontFamily: props.headerFontFamily }
                  : null,
              ]}
            >
              {props.headerTitle}
            </RNText>

            {!I18nManager.isRTL ? (
              <Animated.View
                style={[
                  styles.leaguesListHeaderChevronWrap,
                  { transform: [{ translateY: headerChevronTranslateY }] },
                ]}
              >
                <View style={styles.leaguesListHeaderChevron} />
              </Animated.View>
            ) : null}
          </View>
        </Pressable>
      </View>
    </View>
  );
}
