import {
  Image,
  type ImageStyle,
  ScrollView,
  Text as RNText,
  View,
} from "react-native";
import { Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { GradientPair, TacticalPlayer } from "../../../../app.types";
import { styles } from "../../leagues.styles";

function PredictionPlayerAvatar(props: {
  shortName: string;
  gradient: GradientPair;
  iconSource?: number;
}) {
  if (props.iconSource) {
    return (
      <View style={styles.predictionsAvatarFrame}>
        <Image
          source={props.iconSource}
          resizeMode="contain"
          style={styles.predictionsAvatarImage as ImageStyle}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={props.gradient}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.predictionsAvatarFallback}
    >
      <RNText style={styles.predictionsAvatarFallbackText}>
        {props.shortName}
      </RNText>
    </LinearGradient>
  );
}

export function PredictionScorerPicker(props: {
  placeholderText: string;
  teamShortName: string;
  teamGradient: GradientPair;
  players: TacticalPlayer[];
  playerId: string;
  slotIndex: number;
  isOpen: boolean;
  iconSource?: number;
  onToggle: () => void;
  onSelect: (playerId: string) => void;
}) {
  const selectedPlayer = props.players.find(
    (player) => player.id === props.playerId,
  );

  return (
    <View
      style={[
        styles.predictionsPickerWrap,
        props.isOpen ? styles.predictionsPickerWrapOpen : null,
      ]}
    >
      {props.isOpen ? (
        <View style={styles.predictionsPickerMenu}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={styles.predictionsPickerMenuScroll}
          >
            {props.players.map((player) => (
              <Pressable
                key={player.id}
                onPress={() => props.onSelect(player.id)}
                style={styles.predictionsPickerOption}
              >
                <PredictionPlayerAvatar
                  gradient={props.teamGradient}
                  iconSource={props.iconSource}
                  shortName={props.teamShortName}
                />
                <RNText style={styles.predictionsPickerOptionText}>
                  {player.name}
                </RNText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Pressable
        onPress={props.onToggle}
        style={styles.predictionsPickerTrigger}
      >
        <PredictionPlayerAvatar
          gradient={props.teamGradient}
          iconSource={props.iconSource}
          shortName={props.teamShortName}
        />
        <RNText
          numberOfLines={1}
          style={[
            styles.predictionsPickerValueText,
            !selectedPlayer ? styles.predictionsPickerValuePlaceholder : null,
          ]}
        >
          {selectedPlayer ? selectedPlayer.name : props.placeholderText}
        </RNText>
      </Pressable>
    </View>
  );
}
