import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import type { TacticalPlayer } from "../../../../app.types";
import { LeagueText as Text } from "../common/LeagueText";
import { styles } from "../../leagues.styles";

export function Pitch(props: { players: TacticalPlayer[] }) {
  return (
    <View style={styles.pitchCard}>
      <View style={styles.pitchCenterLine} />
      <View style={styles.pitchCenterCircle} />
      <View style={styles.pitchTopBox} />
      <View style={styles.pitchBottomBox} />

      {props.players.map((player) => (
        <View
          key={player.id}
          style={[
            styles.pitchPlayerWrap,
            { left: `${player.x * 100}%`, top: `${player.y * 100}%` },
          ]}
        >
          <LinearGradient
            colors={player.gradient}
            style={styles.pitchPlayerCircle}
          >
            <Text style={styles.pitchPlayerNumber}>{player.number}</Text>
          </LinearGradient>
        </View>
      ))}
    </View>
  );
}
