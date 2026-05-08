import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { HomeMode } from "../app.types";

type FloatingThemeSwitchProps = {
  selection: HomeMode;
  onChange: (mode: HomeMode) => void;
};

export default function FloatingThemeSwitch(props: FloatingThemeSwitchProps) {
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();
  const layoutWidth = Math.min(width, 430);
  const chromeScale = Math.max(0.84, Math.min(1, layoutWidth / 430));
  const chevronSize = Math.round(11 * chromeScale);
  const buttonPaddingHorizontal = Math.round(10 * chromeScale);
  const buttonPaddingVertical = Math.round(7 * chromeScale);
  const altPaddingHorizontal = Math.round(12 * chromeScale);
  const altPaddingVertical = Math.round(8 * chromeScale);
  const textSize = Math.round(13 * chromeScale);
  const textMargin = Math.round(5 * chromeScale);
  const alternateMode: HomeMode = props.selection === "x" ? "tiktok" : "x";

  return (
    <View style={styles.themeSwitchWrap}>
      <Pressable
        style={[
          styles.themeSwitchButton,
          {
            paddingHorizontal: buttonPaddingHorizontal,
            paddingVertical: buttonPaddingVertical,
          },
        ]}
        onPress={() => setOpen((value) => !value)}
      >
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={chevronSize}
          color="#FFFFFF"
        />
        <Text
          style={[
            styles.themeSwitchText,
            { fontSize: textSize, marginRight: textMargin },
          ]}
        >
          {props.selection === "x" ? "VAR X" : "VAR TIK"}
        </Text>
      </Pressable>

      {open ? (
        <Pressable
          style={[
            styles.themeSwitchAltButton,
            {
              paddingHorizontal: altPaddingHorizontal,
              paddingVertical: altPaddingVertical,
            },
          ]}
          onPress={() => {
            props.onChange(alternateMode);
            setOpen(false);
          }}
        >
          <Text
            style={[
              styles.themeSwitchText,
              { fontSize: textSize, marginRight: textMargin },
            ]}
          >
            {alternateMode === "x" ? "VAR X" : "VAR TIK"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  themeSwitchWrap: {
    alignItems: "center",
  },
  themeSwitchButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.86)",
    borderRadius: 999,
  },
  themeSwitchAltButton: {
    marginTop: 8,
    backgroundColor: "rgba(0,0,0,0.64)",
    borderRadius: 14,
  },
  themeSwitchText: {
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: 0.8,
  },
});
