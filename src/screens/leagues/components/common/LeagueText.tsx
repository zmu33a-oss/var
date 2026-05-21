import type { TextProps } from "react-native";
import { Text as RNText } from "react-native";
import { useLeagueArabicFont } from "../../hooks/useLeagueFont";

export function LeagueText(props: TextProps) {
  const leaguesArabicFontFamily = useLeagueArabicFont();

  return (
    <RNText
      {...props}
      style={[
        props.style,
        leaguesArabicFontFamily
          ? { fontFamily: leaguesArabicFontFamily }
          : null,
      ]}
    />
  );
}
