import { Image, type ImageStyle, View } from "react-native";
import { Text as RNText } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { GradientPair } from "../../../../app.types";
import { styles } from "../../leagues.styles";
import { LeagueText } from "./LeagueText";

export function TeamHeroPanel(props: {
  title: string;
  shortName: string;
  gradient: GradientPair;
  iconSource?: number;
  caption: string;
}) {
  return (
    <View style={styles.matchShowcaseTeamPanel}>
      <RNText style={styles.matchShowcaseTeamName}>{props.title}</RNText>

      <View style={styles.matchShowcaseTeamArtWrap}>
        <View
          style={[
            styles.matchShowcaseTeamGlow,
            { backgroundColor: props.gradient[0] },
          ]}
        />

        <LinearGradient
          colors={[`${props.gradient[0]}24`, "rgba(8,14,26,0.96)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.matchShowcaseTeamBadge}
        >
          {props.iconSource ? (
            <Image
              source={props.iconSource}
              resizeMode="contain"
              style={styles.matchShowcaseTeamLogo as ImageStyle}
            />
          ) : (
            <LinearGradient
              colors={props.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.matchShowcaseTeamBadgeFallback}
            >
              <LeagueText style={styles.matchShowcaseTeamBadgeFallbackText}>
                {props.shortName}
              </LeagueText>
            </LinearGradient>
          )}
        </LinearGradient>
      </View>
    </View>
  );
}
