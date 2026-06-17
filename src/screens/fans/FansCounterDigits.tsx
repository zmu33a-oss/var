import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { useFonts } from "expo-font";
import { Platform, Text, View } from "react-native";
import { createCompatStyleSheet, createShadowStyle } from "../../lib/crossPlatformStyles";

const COUNTER_FONT_FAMILY = "BebasNeue_400Regular";
const COUNTER_FONT_FALLBACK =
  Platform.OS === "ios"
    ? "Helvetica Neue"
    : Platform.OS === "android"
      ? "sans-serif-condensed"
      : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

type FansCounterDigitsProps = {
  digits: string[];
  compact?: boolean;
};

/** أرقام العداد — خلفية بيضاء وأرقام سوداء. */
export default function FansCounterDigits(props: FansCounterDigitsProps) {
  const [areFontsLoaded] = useFonts({
    [COUNTER_FONT_FAMILY]: BebasNeue_400Regular,
  });
  const counterFontFamily = areFontsLoaded
    ? COUNTER_FONT_FAMILY
    : COUNTER_FONT_FALLBACK;

  return (
    <View style={styles.digitsRow}>
      {props.digits.map((digit, index) => (
        <View
          key={`${digit}-${index}`}
          style={[
            styles.digitBox,
            props.compact ? styles.digitBoxCompact : null,
          ]}
        >
          <Text
            style={[
              counterFontFamily ? { fontFamily: counterFontFamily } : null,
              styles.digitText,
              props.compact ? styles.digitTextCompact : null,
            ]}
          >
            {digit}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = createCompatStyleSheet({
  digitsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  digitBox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    ...createShadowStyle({
      color: "#FFFFFF",
      x: 0,
      y: 2,
      blur: 8,
      spread: 0,
      opacity: 0.28,
      elevation: 6,
    }),
  },
  digitBoxCompact: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  digitText: {
    color: "#000000",
    fontSize: 16,
    letterSpacing: 0,
    includeFontPadding: false,
    marginTop: Platform.OS === "android" ? -1 : 0,
  },
  digitTextCompact: {
    fontSize: 14,
    letterSpacing: 0,
    marginTop: Platform.OS === "android" ? -1 : 0,
  },
});
