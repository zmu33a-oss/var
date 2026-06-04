import { Text, View } from "react-native";
import { getArabicFontStyle } from "../profile.helpers";
import { styles } from "../profile.styles";

export function PreviewStatCard(props: {
  arabicFontFamily?: string;
  label: string;
  value: string;
}) {
  const staticArabicTextStyle = getArabicFontStyle(props.arabicFontFamily);

  return (
    <View style={styles.previewStatCard}>
      <Text
        style={[
          styles.previewStatValue,
          getArabicFontStyle(props.arabicFontFamily, props.value),
        ]}
      >
        {props.value}
      </Text>
      <Text style={[styles.previewStatLabel, staticArabicTextStyle]}>
        {props.label}
      </Text>
    </View>
  );
}
