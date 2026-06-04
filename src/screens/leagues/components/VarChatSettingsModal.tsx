import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  type ImageStyle,
  Modal,
  Pressable,
  Switch,
  Text as RNText,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VAR_CHAT_ICON } from "../leagues.constants";
import { styles } from "../leagues.styles";

const COLLAPSED_PANEL_HEIGHT = 112;
const EXPANDED_PANEL_HEIGHT = 224;

type VarChatSettingsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function VarChatSettingsModal(props: VarChatSettingsModalProps) {
  const [receiveMessages, setReceiveMessages] = useState(false);
  const [backgroundWithSound, setBackgroundWithSound] = useState(false);
  const [backgroundWithoutSound, setBackgroundWithoutSound] = useState(false);
  const panelProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(panelProgress, {
      toValue: receiveMessages ? 1 : 0,
      duration: receiveMessages ? 300 : 240,
      easing: receiveMessages ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [receiveMessages, panelProgress]);

  const panelHeight = panelProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [COLLAPSED_PANEL_HEIGHT, EXPANDED_PANEL_HEIGHT],
  });
  const expandedOpacity = panelProgress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.5, 1],
  });

  const handleReceiveMessagesChange = (nextValue: boolean) => {
    setReceiveMessages(nextValue);

    if (!nextValue) {
      setBackgroundWithSound(false);
      setBackgroundWithoutSound(false);
    }
  };

  return (
    <Modal
      transparent
      visible={props.visible}
      animationType="fade"
      onRequestClose={props.onClose}
    >
      <Pressable style={styles.varChatSettingsBackdrop} onPress={props.onClose}>
        <Animated.View
          style={[styles.varChatSettingsPanel, { height: panelHeight }]}
        >
          <Pressable onPress={(event) => event.stopPropagation()}>
            <View style={styles.varChatSettingsHeader}>
              <Pressable
                onPress={props.onClose}
                style={styles.varChatSettingsCloseButton}
              >
                <Ionicons
                  name="close"
                  size={16}
                  color="rgba(255,255,255,0.88)"
                />
              </Pressable>

              <View style={styles.varChatSettingsHeaderCopy}>
                <Image
                  source={VAR_CHAT_ICON}
                  resizeMode="contain"
                  style={styles.varChatSettingsHeaderIcon as ImageStyle}
                />
                <RNText style={styles.varChatSettingsTitle}>شات VAR</RNText>
              </View>
            </View>

            <View style={styles.varChatSettingsBody}>
              <View style={styles.varChatSettingsSwitchRow}>
                <Switch
                  value={receiveMessages}
                  onValueChange={handleReceiveMessagesChange}
                  trackColor={{
                    false: "rgba(255,255,255,0.14)",
                    true: "rgba(255,152,0,0.55)",
                  }}
                  thumbColor={receiveMessages ? "#FF9800" : "#94A3B8"}
                  ios_backgroundColor="rgba(255,255,255,0.14)"
                />
                <RNText style={styles.varChatSettingsSwitchLabel}>
                  استقبال الرسائل
                </RNText>
              </View>

              <Animated.View
                style={[
                  styles.varChatSettingsExpandedWrap,
                  { opacity: expandedOpacity },
                ]}
              >
                <View style={styles.varChatSettingsExpandedInner}>
                  <View style={styles.varChatSettingsSwitchRow}>
                    <Switch
                      value={backgroundWithSound}
                      onValueChange={setBackgroundWithSound}
                      disabled={!receiveMessages}
                      trackColor={{
                        false: "rgba(255,255,255,0.14)",
                        true: "rgba(255,152,0,0.55)",
                      }}
                      thumbColor={backgroundWithSound ? "#FF9800" : "#94A3B8"}
                      ios_backgroundColor="rgba(255,255,255,0.14)"
                    />
                    <RNText style={styles.varChatSettingsSwitchLabel}>
                      إرسال الرسائل في الخلفية مع الصوت
                    </RNText>
                  </View>

                  <View
                    style={[
                      styles.varChatSettingsSwitchRow,
                      styles.varChatSettingsSwitchRowLast,
                    ]}
                  >
                    <Switch
                      value={backgroundWithoutSound}
                      onValueChange={setBackgroundWithoutSound}
                      disabled={!receiveMessages}
                      trackColor={{
                        false: "rgba(255,255,255,0.14)",
                        true: "rgba(255,152,0,0.55)",
                      }}
                      thumbColor={
                        backgroundWithoutSound ? "#FF9800" : "#94A3B8"
                      }
                      ios_backgroundColor="rgba(255,255,255,0.14)"
                    />
                    <RNText style={styles.varChatSettingsSwitchLabel}>
                      إرسال الرسائل في الخلفية بدون صوت
                    </RNText>
                  </View>
                </View>
              </Animated.View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
