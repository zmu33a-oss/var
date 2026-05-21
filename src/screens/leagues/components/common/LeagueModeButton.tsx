import { Pressable, View } from "react-native";
import { styles } from "../../leagues.styles";
import { LeagueText } from "./LeagueText";

export function LeagueModeButton(props: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  showStatusDot?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.leagueTabButton,
        props.isActive ? styles.leagueTabButtonActive : null,
      ]}
      onPress={props.onPress}
    >
      <View style={styles.leagueTabButtonContent}>
        {props.showStatusDot ? (
          <View style={styles.leagueTabButtonLiveDot} />
        ) : null}
        <LeagueText
          style={[
            styles.leagueTabButtonText,
            props.isActive ? styles.leagueTabButtonTextActive : null,
          ]}
        >
          {props.label}
        </LeagueText>
      </View>
    </Pressable>
  );
}
