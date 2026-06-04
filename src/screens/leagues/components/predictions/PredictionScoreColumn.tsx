import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  type ImageStyle,
  Text as RNText,
  TextInput,
  View,
} from "react-native";
import type { GradientPair } from "../../../../app.types";
import { styles } from "../../leagues.styles";

function PredictionScoreTeamMark(props: {
  shortName: string;
  gradient: GradientPair;
  iconSource?: number;
}) {
  if (props.iconSource) {
    return (
      <View style={styles.predictionsScoreTeamBadge}>
        <Image
          source={props.iconSource}
          resizeMode="contain"
          style={styles.predictionsScoreTeamIcon as ImageStyle}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={props.gradient}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.predictionsScoreTeamBadge}
    >
      <RNText style={styles.predictionsScoreTeamInitial}>
        {props.shortName}
      </RNText>
    </LinearGradient>
  );
}

export function PredictionScoreColumn(props: {
  side: "left" | "right";
  teamLabel: string;
  teamShortName: string;
  teamGradient: GradientPair;
  iconSource?: number;
  scoreValue: string;
  onChangeScore: (value: string) => void;
}) {
  const isLeftSide = props.side === "left";

  return (
    <View
      style={[
        styles.predictionsScoreColumn,
        isLeftSide
          ? styles.predictionsScoreColumnLeft
          : styles.predictionsScoreColumnRight,
      ]}
    >
      <View style={styles.predictionsScoreTeamHeader}>
        <PredictionScoreTeamMark
          gradient={props.teamGradient}
          iconSource={props.iconSource}
          shortName={props.teamShortName}
        />
        <RNText numberOfLines={1} style={styles.predictionsTeamSideText}>
          {props.teamLabel}
        </RNText>
      </View>

      <View style={styles.predictionsScoreFieldWrap}>
        <TextInput
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={props.onChangeScore}
          placeholder=""
          placeholderTextColor="rgba(255,255,255,0.45)"
          style={styles.predictionsScoreInput}
          value={props.scoreValue}
        />
      </View>

      <RNText style={styles.predictionsResultText}>النتيجة</RNText>
    </View>
  );
}
