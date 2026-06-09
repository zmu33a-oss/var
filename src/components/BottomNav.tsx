import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { HomeMode, IconName, MainTab } from "../app.types";

const SHELL_WIDTH = 430;
const VAR_ICON = require("../../assets/icons/var.png");

type BottomNavProps = {
  current: MainTab;
  homeMode: HomeMode;
  richIconsEnabled?: boolean;
  onHomeAction: () => void;
  onSelect: (tab: MainTab) => void;
};

function resolveNavIcon(
  filled: IconName,
  outline: IconName,
  active: boolean,
  richIconsEnabled: boolean,
): IconName {
  if (!richIconsEnabled) {
    return outline;
  }

  return active ? filled : outline;
}

export default function BottomNav(props: BottomNavProps) {
  const richIconsEnabled = props.richIconsEnabled !== false;
  const { width } = useWindowDimensions();
  const layoutWidth = Math.min(width, SHELL_WIDTH);
  const chromeScale = Math.max(0.84, Math.min(1, layoutWidth / SHELL_WIDTH));
  const bottomItemMinHeight = Math.round(50 * chromeScale);
  const bottomLabelFontSize = Math.max(9, Math.round(10 * chromeScale));
  const bottomIconSize = Math.round(20.33 * chromeScale);
  const bottomIconFrameSize = Math.round(25.68 * chromeScale);
  const bottomBarRadius = Math.round(24 * chromeScale);
  const bottomBarPaddingHorizontal = Math.round(6 * chromeScale);
  const bottomBarPaddingVertical = Math.round(6 * chromeScale);
  const centerActionWidth = Math.round(88 * chromeScale);
  const centerActionHeight = Math.round(44 * chromeScale);
  const centerActionIconWidth = Math.round(109.14 * chromeScale);
  const centerActionIconHeight = Math.round(64.2 * chromeScale);

  return (
    <View
      style={[
        styles.bottomBar,
        {
          borderRadius: bottomBarRadius,
          paddingHorizontal: bottomBarPaddingHorizontal,
          paddingVertical: bottomBarPaddingVertical,
        },
      ]}
    >
      <BottomItem
        label="الحساب"
        icon={resolveNavIcon(
          "person",
          "person-outline",
          props.current === "account",
          richIconsEnabled,
        )}
        active={props.current === "account"}
        onPress={() => props.onSelect("account")}
        iconSize={bottomIconSize}
        iconFrameSize={bottomIconFrameSize}
        labelSize={bottomLabelFontSize}
        minHeight={bottomItemMinHeight}
      />
      <BottomItem
        label="الدوريات"
        icon={resolveNavIcon(
          "trophy",
          "trophy-outline",
          props.current === "leagues",
          richIconsEnabled,
        )}
        active={props.current === "leagues"}
        onPress={() => props.onSelect("leagues")}
        iconSize={bottomIconSize}
        iconFrameSize={bottomIconFrameSize}
        labelSize={bottomLabelFontSize}
        minHeight={bottomItemMinHeight}
      />

      <Pressable
        style={styles.bottomCenterActionWrap}
        onPress={props.onHomeAction}
      >
        <View
          style={[
            styles.bottomCenterAction,
            { width: centerActionWidth, height: centerActionHeight },
          ]}
        >
          <Image
            source={VAR_ICON}
            resizeMode="contain"
            style={[
              styles.bottomCenterActionIcon,
              {
                width: centerActionIconWidth,
                height: centerActionIconHeight,
              },
            ]}
          />
        </View>
      </Pressable>

      <BottomItem
        label="الرابطة"
        icon={resolveNavIcon(
          "people",
          "people-outline",
          props.current === "fans",
          richIconsEnabled,
        )}
        active={props.current === "fans"}
        onPress={() => props.onSelect("fans")}
        iconSize={bottomIconSize}
        iconFrameSize={bottomIconFrameSize}
        labelSize={bottomLabelFontSize}
        minHeight={bottomItemMinHeight}
      />
      <BottomItem
        label="الرئيسية"
        icon={resolveNavIcon(
          "home",
          "home-outline",
          props.current === "home",
          richIconsEnabled,
        )}
        active={props.current === "home"}
        onPress={() => props.onSelect("home")}
        iconSize={bottomIconSize}
        iconFrameSize={bottomIconFrameSize}
        labelSize={bottomLabelFontSize}
        minHeight={bottomItemMinHeight}
      />
    </View>
  );
}

function BottomItem(props: {
  label: string;
  active: boolean;
  onPress: () => void;
  iconSize: number;
  iconFrameSize: number;
  labelSize: number;
  minHeight: number;
  icon?: IconName;
}) {
  const iconColor = props.active ? "#FFFFFF" : "rgba(255,255,255,0.64)";

  return (
    <Pressable
      style={[styles.bottomItem, { minHeight: props.minHeight }]}
      onPress={props.onPress}
    >
      <View
        style={[
          styles.bottomItemIconFrame,
          { width: props.iconFrameSize, height: props.iconFrameSize },
        ]}
      >
        <Ionicons
          name={props.icon ?? "ellipse-outline"}
          size={props.iconSize}
          color={iconColor}
        />
      </View>
      <Text
        style={[
          styles.bottomItemLabel,
          { fontSize: props.labelSize },
          props.active ? styles.bottomItemLabelActive : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    width: "100%",
    maxWidth: SHELL_WIDTH,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(5,8,15,0.98)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  bottomItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomItemIconFrame: {
    alignItems: "center",
    justifyContent: "center",
  },
  bottomItemLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },
  bottomItemLabelActive: {
    color: "#FFFFFF",
  },
  bottomCenterActionWrap: {
    marginHorizontal: 2,
  },
  bottomCenterAction: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  bottomCenterActionIcon: {},
});
