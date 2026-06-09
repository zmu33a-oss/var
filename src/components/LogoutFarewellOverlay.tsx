import { StyleSheet, Text, View } from "react-native";

type LogoutFarewellOverlayProps = {
  visible: boolean;
};

export default function LogoutFarewellOverlay(props: LogoutFarewellOverlayProps) {
  if (!props.visible) {
    return null;
  }

  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <View style={styles.panel}>
        <Text style={styles.eyebrow}>LOGOUT COMPLETE</Text>
        <Text style={styles.title}>إلى اللقاء</Text>
        <Text style={styles.subtitle}>شكرًا لوجودك معنا على VAR</Text>
        <Text style={styles.footer}>نراك قريبًا...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 120,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  panel: {
    flex: 1,
    alignSelf: "stretch",
    margin: 14,
    borderRadius: 32,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  eyebrow: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.4,
    marginBottom: 18,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
  },
  footer: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 22,
  },
});
