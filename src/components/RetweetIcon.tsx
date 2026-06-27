import Svg, { Path } from "react-native-svg";

/** أيقونة ريتويت بزوايا مربّعة — قريبة من شكل X/Twitter. */
const RETWEET_PATH =
  "M4.5 3.88l4.43 4.14-1.7 1.81L6 8.38v7.75c0 .97.79 1.75 1.75 1.75h5.25V20H8A3.5 3.5 0 014.5 16.13V8.38L3.25 9.5 1.56 7.7 4.5 3.88zm15 16.24l-4.43-4.14 1.7-1.81L18 15.62V7.88c0-.97-.79-1.75-1.75-1.75h-5.25V4.5H16A3.5 3.5 0 0119.5 7.87v7.75l1.25-1.12 1.69 1.8z";

type RetweetIconProps = {
  size?: number;
  color?: string;
  active?: boolean;
};

export default function RetweetIcon(props: RetweetIconProps) {
  const size = props.size ?? 18;
  const color = props.color ?? "rgba(255,255,255,0.56)";
  const active = props.active ?? false;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={RETWEET_PATH}
        fill={active ? color : "none"}
        stroke={color}
        strokeWidth={active ? 0 : 1.55}
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
    </Svg>
  );
}
