import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { createCompatStyleSheet } from "../../lib/crossPlatformStyles";

type FansCommunityGearButtonProps = {
  isLoggedIn: boolean;
  onRequireAuth: (message?: string) => void;
  iconSize?: number;
};

/** أيقونة الترس — بدون خلفية أو حدود. */
export default function FansCommunityGearButton(
  props: FansCommunityGearButtonProps,
) {
  const iconSize = props.iconSize ?? 22;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="إعدادات ملتقى الرابطة"
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={() => {
        if (!props.isLoggedIn) {
          props.onRequireAuth("سجّل الدخول لإعدادات ملتقى الرابطة.");
        }
      }}
    >
      <Ionicons name="settings-sharp" size={iconSize} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = createCompatStyleSheet({
  button: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
