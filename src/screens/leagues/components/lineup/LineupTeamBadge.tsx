import { LinearGradient } from "expo-linear-gradient";
import { Image, type ImageStyle, Text as RNText, View } from "react-native";
import type { GradientPair } from "../../../../app.types";
import { styles } from "../../leagues.styles";

export function LineupTeamBadge(props: {
  gradient: GradientPair;
  iconSource?: number;
  shortName: string;
}) {
  if (props.iconSource) {
    return (
      <View style={styles.lineupStageTeamBadgeWrap}>
        <Image
          source={props.iconSource}
          resizeMode="contain"
          style={styles.lineupStageTeamBadgeImage as ImageStyle}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={props.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.lineupStageTeamFallback}
    >
      <RNText style={styles.lineupStageTeamFallbackText}>
        {props.shortName}
      </RNText>
    </LinearGradient>
  );
}
