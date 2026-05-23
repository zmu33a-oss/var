import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import { styles } from "../../leagues.styles";

export function GlassCard(props: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.glassCard, props.style]}>{props.children}</View>;
}
