import { Image, type ImageStyle, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { GradientPair } from "../../../../app.types";
import { styles } from "../../leagues.styles";
import { LeagueText } from "./LeagueText";

export function TeamColumn(props: {
  title: string;
  shortName: string;
  gradient: GradientPair;
  iconSource?: number;
}) {
  return (
    <View style={styles.teamColumn}>
      {props.iconSource ? (
        <View style={styles.teamLogoWrap}>
          <Image
            source={props.iconSource}
            style={styles.teamCircleIcon as ImageStyle}
            resizeMode="contain"
          />
        </View>
      ) : (
        <LinearGradient colors={props.gradient} style={styles.teamCircle}>
          <LeagueText style={styles.teamCircleText}>
            {props.shortName}
          </LeagueText>
        </LinearGradient>
      )}
      <LeagueText style={styles.teamColumnTitle}>{props.title}</LeagueText>
    </View>
  );
}
