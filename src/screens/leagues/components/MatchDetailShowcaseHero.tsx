import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  type ImageStyle,
  Pressable,
  Text as RNText,
  View,
} from "react-native";
import { ROSHN_ICON } from "../leagues.constants";
import type { MatchShowcaseCardConfig } from "../leagues.types";
import { TeamHeroPanel as MatchShowcaseHeroTeamPanel } from "./common/TeamHeroPanel";
import { styles } from "../leagues.styles";

export function MatchDetailShowcaseHero(props: {
  config: MatchShowcaseCardConfig;
  kickoffCountdownLabel: string;
  onBack: () => void;
  headerFontFamily?: string;
}) {
  return (
    <View style={styles.matchDetailShowcaseCard}>
      <View
        style={[
          styles.matchShowcaseShell,
          styles.matchDetailShowcaseShell,
          styles.matchDetailShowcaseShellSharp,
        ]}
      >
        <View
          style={[
            styles.matchShowcaseHeaderActionsRow,
            styles.matchDetailShowcaseHeaderRow,
          ]}
        >
          <View style={styles.matchShowcaseLiveBadge}>
            <View style={styles.matchShowcaseLiveDot} />
            <RNText style={styles.matchShowcaseLiveBadgeText}>DEMO LIVE</RNText>
          </View>

          <Pressable
            onPress={props.onBack}
            style={styles.matchDetailShowcaseBackButton}
          >
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            <RNText
              style={[
                styles.matchDetailShowcaseBackText,
                props.headerFontFamily
                  ? { fontFamily: props.headerFontFamily }
                  : null,
              ]}
            >
              رجوع
            </RNText>
          </Pressable>
        </View>

        <View
          style={[
            styles.matchShowcaseHeroPressable,
            styles.matchDetailShowcaseHero,
          ]}
        >
          <View style={styles.matchShowcaseContextBlock}>
            <View style={styles.matchShowcaseCompetitionLogoWrap}>
              <Image
                source={ROSHN_ICON}
                resizeMode="contain"
                style={styles.matchShowcaseCompetitionLogo as ImageStyle}
              />
            </View>

            <RNText
              style={[
                styles.matchShowcaseLeagueName,
                props.headerFontFamily
                  ? { fontFamily: props.headerFontFamily }
                  : null,
              ]}
            >
              {props.config.leagueName}
            </RNText>

            <RNText style={styles.matchDetailShowcaseMetaText}>
              نفس هوية كرت المباراة الرئيسية
            </RNText>
          </View>

          <View style={styles.matchShowcaseTeamsRow}>
            <MatchShowcaseHeroTeamPanel
              title={props.config.homeTeam.title}
              shortName={props.config.homeTeam.shortName}
              gradient={props.config.homeTeam.gradient}
              iconSource={props.config.homeTeam.iconSource}
              caption="المضيف"
            />

            <View style={styles.matchShowcaseScoreCenter}>
              <View style={styles.matchShowcaseScoreDigitsRow}>
                <RNText style={styles.matchShowcaseScoreDigit}>0</RNText>
                <RNText style={styles.matchShowcaseVersus}>VS</RNText>
                <RNText style={styles.matchShowcaseScoreDigit}>0</RNText>
              </View>

              <View style={styles.matchShowcaseCountdownBadge}>
                <RNText style={styles.matchShowcaseCountdownText}>
                  {props.kickoffCountdownLabel}
                </RNText>
              </View>

              <RNText style={styles.matchShowcaseCountdownCaption}>
                حتى بداية المباراة
              </RNText>
            </View>

            <MatchShowcaseHeroTeamPanel
              title={props.config.awayTeam.title}
              shortName={props.config.awayTeam.shortName}
              gradient={props.config.awayTeam.gradient}
              iconSource={props.config.awayTeam.iconSource}
              caption="الضيف"
            />
          </View>
        </View>

        <View style={styles.matchDetailShowcaseDivider} />
      </View>
    </View>
  );
}
