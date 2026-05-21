import { Pressable } from "react-native";
import { styles } from "../../leagues.styles";
import { LeagueText } from "./LeagueText";

export function ModeSwitchButton(props: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.modeSwitchButton,
        props.isActive ? styles.modeSwitchButtonActive : null,
      ]}
      onPress={props.onPress}
    >
      <LeagueText
        style={[
          styles.modeSwitchButtonText,
          props.isActive ? styles.modeSwitchButtonTextActive : null,
        ]}
      >
        {props.label}
      </LeagueText>
    </Pressable>
  );
}
