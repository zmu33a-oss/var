import { Text, TextInput, View } from "react-native";
import { getArabicFontStyle } from "../profile.helpers";
import { styles } from "../profile.styles";

export function ProfileFieldInput(props: {
  arabicFontFamily?: string;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?:
    | "default"
    | "email-address"
    | "phone-pad"
    | "number-pad"
    | "numeric";
  placeholder?: string;
}) {
  const staticArabicTextStyle = getArabicFontStyle(props.arabicFontFamily);

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, staticArabicTextStyle]}>
        {props.label}
      </Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        multiline={props.multiline}
        autoCapitalize={props.autoCapitalize ?? "sentences"}
        keyboardType={props.keyboardType ?? "default"}
        placeholder={props.placeholder}
        placeholderTextColor="rgba(255,255,255,0.32)"
        style={[
          styles.fieldInput,
          props.multiline ? styles.fieldInputMultiline : null,
          getArabicFontStyle(props.arabicFontFamily, props.value),
        ]}
        textAlign="right"
      />
    </View>
  );
}
