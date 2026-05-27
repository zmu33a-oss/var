import { useFonts } from "expo-font";
import { Text, View } from "react-native";
import { createCompatStyleSheet } from "../../lib/crossPlatformStyles";
import FansMetricBar, {
  ActiveUserMetrics,
  FansVerifiedBadge,
  HashtagMetrics,
} from "./FansMetricBar";

const CARD_FONT_FAMILY = "FansCardBold";
const CARD_FONT = require("../../../assets/images/alfont_com_zainpcv2mob600-zainpcv2.ttf");
const HILAL_ICON = require("../../../assets/icons/alhilal.png.png");
const NASSR_ICON = require("../../../assets/icons/alnassr.png.png");

const PAGE_TITLE = "النادي الاكثر جماهيرية وتفاعل";
const ASSOCIATION_PREFIX = "الرابطة :";
const POSTS_HEADER = "اجمالي المشاركات الهاشتاق";
const POSTS_LABEL = "تغريده";
const ACTIVE_TITLE = "المستخدم الاكثر تفاعل";

const HASHTAG_SECTIONS = [
  {
    rankLabel: "المركز الأول",
    hashtag: "#النصر",
    clubSlug: "alnaser",
    clubVarId: "var-22000",
    emblem: NASSR_ICON,
    totalPosts: "1650",
    topUserName: "العالمي للالكترونيات",
    topUserVarId: "VAR 23543",
    topUserVerified: false,
  },
  {
    rankLabel: "المركز الثاني",
    hashtag: "#الهلal",
    clubSlug: "alhilal",
    clubVarId: "var-18000",
    emblem: HILAL_ICON,
    totalPosts: "1420",
    topUserName: "أزرق الرياض",
    topUserVarId: "VAR 19821",
    topUserVerified: true,
  },
] as const;

type FansAssociationCardProps = {
  supporters?: Record<string, number>;
};

function FansHashtagSection(props: {
  rankLabel: string;
  hashtag: string;
  clubSlug: string;
  clubVarId: string;
  emblem: number;
  totalPosts: string;
  topUserName: string;
  topUserVarId: string;
  topUserVerified: boolean;
  outsideText: (style: object) => object[];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.hashtagHeaderRow}>
        <Text style={props.outsideText(styles.rankBadge)}>
          {props.rankLabel}
        </Text>
        <Text style={props.outsideText(styles.associationOutside)}>
          <Text style={props.outsideText(styles.associationOrange)}>
            {ASSOCIATION_PREFIX}
          </Text>
          <Text style={props.outsideText(styles.associationWhite)}>
            {" "}
            {props.hashtag}
          </Text>
        </Text>
      </View>

      <FansMetricBar
        title={POSTS_HEADER}
        clubSlug={props.clubSlug}
        clubVarId={props.clubVarId}
        emblem={props.emblem}
        metrics={
          <HashtagMetrics total={props.totalPosts} unit={POSTS_LABEL} />
        }
      />

      <View style={styles.barSpacer} />

      <FansMetricBar
        title={ACTIVE_TITLE}
        clubSlug={props.clubSlug}
        clubVarId={props.clubVarId}
        emblem={props.emblem}
        trailing={<FansVerifiedBadge verified={props.topUserVerified} />}
        metrics={
          <ActiveUserMetrics
            name={props.topUserName}
            varId={props.topUserVarId}
          />
        }
      />
    </View>
  );
}

export default function FansAssociationCard(_props: FansAssociationCardProps) {
  const [fontsLoaded] = useFonts({
    [CARD_FONT_FAMILY]: CARD_FONT,
  });
  const fontFamily = fontsLoaded ? CARD_FONT_FAMILY : undefined;

  const outsideText = (style: object) => [
    style,
    styles.boldText,
    fontFamily ? { fontFamily } : null,
  ];

  return (
    <View style={styles.root}>
      <Text style={outsideText(styles.pageTitle)}>{PAGE_TITLE}</Text>

      {HASHTAG_SECTIONS.map((section, index) => (
        <View key={section.hashtag}>
          {index > 0 ? <View style={styles.sectionSpacer} /> : null}
          <FansHashtagSection
            {...section}
            outsideText={outsideText}
          />
        </View>
      ))}
    </View>
  );
}

const styles = createCompatStyleSheet({
  root: {
    marginTop: 4,
  },
  boldText: {
    fontWeight: "900",
  },
  pageTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 22,
  },
  section: {
    width: "100%",
  },
  sectionSpacer: {
    height: 18,
  },
  hashtagHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  rankBadge: {
    color: "#FF9800",
    fontSize: 13,
    lineHeight: 20,
  },
  associationOutside: {
    textAlign: "center",
    lineHeight: 20,
  },
  associationOrange: {
    color: "#FF9800",
    fontSize: 13,
  },
  associationWhite: {
    color: "#FFFFFF",
    fontSize: 13,
  },
  barSpacer: {
    height: 10,
  },
});
