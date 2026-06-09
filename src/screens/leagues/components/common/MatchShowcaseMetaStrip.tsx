import { Ionicons } from "@expo/vector-icons";
import { Text as RNText, View } from "react-native";
import { formatMatchAttendance } from "../../leagues.utils";
import { styles } from "../../leagues.styles";

export function MatchShowcaseMetaStrip(props: {
  stadium: string;
  attendance: number;
}) {
  return (
    <View style={styles.matchShowcaseMetaStrip}>
      <View style={styles.matchShowcaseMetaItem}>
        <Ionicons
          color="rgba(255,255,255,0.58)"
          name="location-outline"
          size={12}
        />
        <RNText numberOfLines={1} style={styles.matchShowcaseMetaItemText}>
          {props.stadium}
        </RNText>
      </View>

      <RNText style={styles.matchShowcaseMetaDivider}>·</RNText>

      <View style={styles.matchShowcaseMetaItem}>
        <Ionicons
          color="rgba(255,255,255,0.58)"
          name="people-outline"
          size={12}
        />
        <RNText style={styles.matchShowcaseMetaItemText}>
          {formatMatchAttendance(props.attendance)} جماهير
        </RNText>
      </View>
    </View>
  );
}
