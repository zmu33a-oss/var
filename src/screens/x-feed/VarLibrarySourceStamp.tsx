import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { VAR_LIBRARY_BRAND_MARK } from "./varPlayerLibrary.constants";

type VarLibrarySourceStampProps = {
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function VarLibrarySourceStamp({
  compact = false,
  style,
}: VarLibrarySourceStampProps) {
  const verifySize = compact ? 16 : 22;
  const checkSize = compact ? 10 : 13;

  return (
    <View
      style={[
        styles.stamp,
        compact ? styles.stampCompact : null,
        style,
      ]}
      accessibilityLabel="VAR verified library source"
    >
      <Text style={[styles.brand, compact ? styles.brandCompact : null]}>
        {VAR_LIBRARY_BRAND_MARK}
      </Text>
      <View
        style={[
          styles.verifyBadge,
          {
            width: verifySize,
            height: verifySize,
            borderRadius: verifySize / 2,
          },
        ]}
      >
        <Ionicons name="checkmark" size={checkSize} color="#0F172A" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    borderColor: "rgba(148, 163, 184, 0.35)",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  stampCompact: {
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  brandCompact: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  verifyBadge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FACC15",
  },
});
