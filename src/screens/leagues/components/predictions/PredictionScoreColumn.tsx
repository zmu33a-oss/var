import { Text as RNText, TextInput, View } from "react-native";
import { styles } from "../../leagues.styles";

export function PredictionScoreColumn(props: {
  side: "left" | "right";
  teamLabel: string;
  scoreValue: string;
  onChangeScore: (value: string) => void;
}) {
  const isLeftSide = props.side === "left";

  return (
    <View style={styles.predictionsScoreColumn}>
      <View
        style={[
          styles.predictionsScoreInlineRow,
          isLeftSide
            ? styles.predictionsScoreInlineRowLeft
            : styles.predictionsScoreInlineRowRight,
        ]}
      >
        {isLeftSide ? (
          <>
            <RNText style={styles.predictionsTeamSideText}>
              {props.teamLabel}
            </RNText>
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
          </>
        ) : (
          <>
            <RNText style={styles.predictionsResultText}>النتيجة</RNText>
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
            <RNText style={styles.predictionsTeamSideText}>
              {props.teamLabel}
            </RNText>
          </>
        )}
      </View>
    </View>
  );
}
