import type { ReactNode } from "react";
import { Pressable, Text as RNText, View } from "react-native";
import { styles } from "../../leagues.styles";

export function FooterTabButton(props: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  icon: ReactNode;
  accentColor: string;
  accentSurface: string;
  showDivider?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.matchShowcaseFooterTabButton,
        props.showDivider ? styles.matchShowcaseFooterTabButtonDivider : null,
        props.isActive ? styles.matchShowcaseFooterTabButtonActive : null,
      ]}
      onPress={props.onPress}
    >
      <View style={styles.matchShowcaseFooterTabIconWrap}>{props.icon}</View>

      <RNText
        style={[
          styles.matchShowcaseFooterTabText,
          props.isActive ? { color: props.accentColor } : null,
        ]}
      >
        {props.label}
      </RNText>
    </Pressable>
  );
}
