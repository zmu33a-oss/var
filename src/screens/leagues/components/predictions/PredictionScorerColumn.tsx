import { Text as RNText, View } from "react-native";
import type { GradientPair, TacticalPlayer } from "../../../../app.types";
import { styles } from "../../leagues.styles";
import { PredictionScorerPicker } from "./PredictionScorerPicker";

export function PredictionScorerColumn(props: {
  side: "left" | "right";
  teamLabel: string;
  teamShortName: string;
  teamGradient: GradientPair;
  players: TacticalPlayer[];
  scorerIds: string[];
  iconSource?: number;
  onTogglePicker: (slotIndex: number) => void;
  onSelectScorer: (slotIndex: number, playerId: string) => void;
  isMenuOpen: (slotIndex: number) => boolean;
}) {
  const isLeftSide = props.side === "left";

  if (props.scorerIds.length === 0) {
    return <View style={styles.predictionsScorerColumnHidden} />;
  }

  return (
    <View style={styles.predictionsScorerColumn}>
      <View
        style={[
          styles.predictionsScorerMetaRow,
          isLeftSide
            ? styles.predictionsScorerMetaRowLeft
            : styles.predictionsScorerMetaRowRight,
        ]}
      >
        <RNText style={styles.predictionsScorerMetaLabel}>الهداف</RNText>
      </View>

      <View style={styles.predictionsScorersCell}>
        {props.scorerIds.map((_, slotIndex) => (
          <View
            key={`${props.teamLabel}-${slotIndex}`}
            style={styles.predictionsScorerSlotWrap}
          >
            <PredictionScorerPicker
              iconSource={props.iconSource}
              isOpen={props.isMenuOpen(slotIndex)}
              onSelect={(selectedPlayerId) =>
                props.onSelectScorer(slotIndex, selectedPlayerId)
              }
              onToggle={() => props.onTogglePicker(slotIndex)}
              placeholderText="اختر الهداف"
              playerId={props.scorerIds[slotIndex] ?? ""}
              players={props.players}
              slotIndex={slotIndex}
              teamGradient={props.teamGradient}
              teamShortName={props.teamShortName}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
