import { Pressable, StyleSheet, Text, View } from "react-native";
import type { HashtagTrendEntry } from "./x-feed.types";

export function XHashtagTrendCard(props: {
  trend: HashtagTrendEntry;
  index: number;
  onPress: () => void;
}) {
  const isTopTrend = props.index === 0;

  return (
    <Pressable
      style={[
        styles.xHashtagTrendCard,
        isTopTrend ? styles.xHashtagTrendCardTop : null,
      ]}
      onPress={props.onPress}
    >
      <View style={styles.xHashtagTrendRankBadge}>
        <Text style={styles.xHashtagTrendRankText}>#{props.index + 1}</Text>
      </View>

      <View style={styles.xHashtagTrendTextBlock}>
        <View style={styles.xHashtagTrendTitleRow}>
          <Text style={styles.xHashtagTrendLabel}>{props.trend.label}</Text>
          <Text style={styles.xHashtagTrendCount}>
            {props.trend.itemCount} تداول
          </Text>
        </View>

        <Text style={styles.xHashtagTrendMeta}>
          {props.trend.mentionsTotal} ذكر · {props.trend.latestContextLabel}
        </Text>

        <Text numberOfLines={2} style={styles.xHashtagTrendSample}>
          {props.trend.latestSnippet}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  xHashtagTrendCard: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  xHashtagTrendCardTop: {
    borderColor: "rgba(29,155,240,0.22)",
    backgroundColor: "rgba(8,20,31,0.96)",
  },
  xHashtagTrendRankBadge: {
    minWidth: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(29,155,240,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  xHashtagTrendRankText: {
    color: "#8CD3FF",
    fontSize: 12,
    fontWeight: "900",
  },
  xHashtagTrendTextBlock: {
    flex: 1,
    marginRight: 12,
    alignItems: "flex-end",
  },
  xHashtagTrendTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  xHashtagTrendLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
  },
  xHashtagTrendCount: {
    color: "#77C8FF",
    fontSize: 12,
    fontWeight: "900",
    marginRight: 8,
  },
  xHashtagTrendMeta: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 4,
  },
  xHashtagTrendSample: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
    marginTop: 8,
    alignSelf: "stretch",
  },
});
