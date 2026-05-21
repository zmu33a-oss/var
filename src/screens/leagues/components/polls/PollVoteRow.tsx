import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text as RNText, View } from "react-native";
import { ACTION_SUCCESS_FOREGROUND } from "../../leagues.constants";
import { styles } from "../../leagues.styles";

export function PollVoteRow(props: {
  teamLabel: string;
  votes: number;
  percentage: number;
  isSelected?: boolean;
  onPress?: () => void;
}) {
  return (
    <View style={styles.pollVoteRow}>
      <View style={styles.pollVoteTeamBlock}>
        <RNText style={styles.pollVoteTeamLabel}>{props.teamLabel}</RNText>
      </View>

      <View style={styles.pollVoteMetricsWrap}>
        <View style={styles.pollVoteMetricGroup}>
          <RNText style={styles.pollVoteMetricLabel}>نسبة</RNText>
          <RNText style={styles.pollVoteMetricValue}>
            {`${props.percentage} %`}
          </RNText>
        </View>

        <Pressable
          onPress={props.onPress}
          style={[
            styles.pollVoteButton,
            props.isSelected ? styles.actionButtonSuccess : null,
          ]}
        >
          <View style={styles.actionButtonContent}>
            <RNText
              style={[
                styles.pollVoteButtonText,
                props.isSelected ? styles.actionButtonSuccessText : null,
              ]}
            >
              صوّت
            </RNText>
            {props.isSelected ? (
              <Ionicons
                color={ACTION_SUCCESS_FOREGROUND}
                name="checkmark"
                size={14}
                style={styles.actionButtonSuccessIcon}
              />
            ) : null}
          </View>
        </Pressable>

        <View style={styles.pollVoteMetricGroup}>
          <RNText style={styles.pollVoteMetricLabel}>الجمهور</RNText>
          <RNText style={styles.pollVoteMetricValue}>
            {props.votes.toLocaleString("en-US")}
          </RNText>
        </View>
      </View>
    </View>
  );
}
