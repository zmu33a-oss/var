import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, View } from "react-native";
import type { MatchShowcaseCardConfig } from "../leagues.types";
import { LeagueText as Text } from "./common/LeagueText";
import { TeamColumn } from "./common/TeamColumn";
import { GlassCard } from "./common/GlassCard";
import { styles } from "../leagues.styles";

export function MatchPreviewCard(props: {
  config: MatchShowcaseCardConfig;
  kickoffCountdownLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={props.onPress} style={styles.matchPreviewPressable}>
      <GlassCard style={styles.matchCard}>
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0)"]}
          end={{ x: 1, y: 1 }}
          style={styles.matchCardFrame}
        >
          <LinearGradient
            colors={[
              "rgba(34,52,84,0.20)",
              "rgba(20,31,50,0.20)",
              "rgba(10,16,28,0.20)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.matchCardInner}
          >
            <View style={styles.matchCardGlow} />
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.matchCardSheen}
            />

            <View style={styles.matchDemoPillWrap}>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>MATCH</Text>
              </View>
            </View>

            <View style={styles.matchHeader}>
              <Text style={styles.matchLeagueName}>
                {props.config.leagueName}
              </Text>
            </View>

            <View style={styles.scoreRow}>
              <TeamColumn
                title={props.config.awayTeam.title}
                shortName={props.config.awayTeam.shortName}
                gradient={props.config.awayTeam.gradient}
                iconSource={props.config.awayTeam.iconSource}
              />

              <View style={styles.scoreBlock}>
                <View style={styles.scoreDigitsRow}>
                  <Text style={styles.scoreDigit}>0</Text>
                  <Text style={styles.scoreDash}>-</Text>
                  <Text style={styles.scoreDigit}>0</Text>
                </View>
                <Text style={styles.kickoffCountdownText}>
                  {props.kickoffCountdownLabel}
                </Text>
                <Text style={styles.kickoffCountdownCaption}>
                  اضغط لفتح التفاصيل
                </Text>
              </View>

              <TeamColumn
                title={props.config.homeTeam.title}
                shortName={props.config.homeTeam.shortName}
                gradient={props.config.homeTeam.gradient}
                iconSource={props.config.homeTeam.iconSource}
              />
            </View>

            <View style={styles.matchPreviewFooter}>
              <View style={styles.matchPreviewHintPill}>
                <Ionicons name="arrow-back" size={14} color="#FFDE97" />
                <Text style={styles.matchPreviewHintText}>
                  عرض التشكيلة والإحصائيات
                </Text>
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>
      </GlassCard>
    </Pressable>
  );
}
