import { Text, View } from "react-native";
import { getArabicFontStyle } from "../profile.helpers";
import { styles } from "../profile.styles";

export function PreviewDetailRow(props: {
  arabicFontFamily?: string;
  label: string;
  value: string;
}) {
  const staticArabicTextStyle = getArabicFontStyle(props.arabicFontFamily);

  return (
    <View style={styles.previewDetailRow}>
      <Text
        style={[
          styles.previewDetailValue,
          getArabicFontStyle(props.arabicFontFamily, props.value),
        ]}
      >
        {props.value}
      </Text>
      <Text style={[styles.previewDetailLabel, staticArabicTextStyle]}>
        {props.label}
      </Text>
    </View>
  );
}
