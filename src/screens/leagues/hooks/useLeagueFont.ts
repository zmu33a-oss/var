import { createContext, useContext } from "react";
import { useFonts } from "expo-font";
import {
  LEAGUE_HEADER_ARABIC_FONT,
  LEAGUE_HEADER_ARABIC_FONT_FAMILY,
  LEAGUES_ARABIC_FONT,
  LEAGUES_ARABIC_FONT_FAMILY,
} from "../leagues.constants";

export const LeagueArabicFontContext = createContext<string | undefined>(
  undefined,
);

export function useLeagueFont() {
  const [areLeaguesFontsLoaded] = useFonts({
    [LEAGUES_ARABIC_FONT_FAMILY]: LEAGUES_ARABIC_FONT,
    [LEAGUE_HEADER_ARABIC_FONT_FAMILY]: LEAGUE_HEADER_ARABIC_FONT,
  });

  const leaguesArabicFontFamily = areLeaguesFontsLoaded
    ? LEAGUES_ARABIC_FONT_FAMILY
    : undefined;

  const leagueHeaderArabicFontFamily = areLeaguesFontsLoaded
    ? LEAGUE_HEADER_ARABIC_FONT_FAMILY
    : undefined;

  return { leaguesArabicFontFamily, leagueHeaderArabicFontFamily };
}

export function useLeagueArabicFont() {
  return useContext(LeagueArabicFontContext);
}
