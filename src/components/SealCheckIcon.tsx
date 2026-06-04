import { Image, type ImageStyle, type StyleProp } from "react-native";

const SEAL_CHECK_ICON = require("../../assets/icons/seal-check-fill.svg");

type SealCheckIconProps = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export default function SealCheckIcon(props: SealCheckIconProps) {
  const size = props.size ?? 16;

  return (
    <Image
      source={SEAL_CHECK_ICON}
      resizeMode="contain"
      style={[{ width: size, height: size }, props.style]}
    />
  );
}
