import type { ImageSourcePropType, ImageStyle } from "react-native";
import { Image, Pressable, Text as RNText, View } from "react-native";
import { styles } from "../../leagues.styles";

export function FooterTabButton(props: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  iconSource: ImageSourcePropType;
  iconStyle?: ImageStyle | ImageStyle[];
  accentColor: string;
  accentSurface: string;
  showDivider?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.matchShowcaseFooterTabButton,
        props.showDivider ? styles.matchShowcaseFooterTabButtonDivider : null,
        props.isActive ? styles.matchShowcaseFooterTabButtonActive : null,
      ]}
      onPress={props.onPress}
    >
      <View style={styles.matchShowcaseFooterTabIconWrap}>
        <Image
          resizeMode="contain"
          source={props.iconSource}
          style={[
            styles.matchShowcaseFooterAssetIcon,
            props.iconStyle,
            {
              tintColor: "#FFFFFF",
            },
          ]}
        />
      </View>

      <RNText
        style={[
          styles.matchShowcaseFooterTabText,
          props.isActive ? { color: props.accentColor } : null,
        ]}
      >
        {props.label}
      </RNText>
    </Pressable>
  );
}
