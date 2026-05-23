import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Text as RNText, View } from "react-native";
import { Pressable } from "react-native";
import type { LeaguePollTweet } from "../../leagues.types";
import { styles } from "../../leagues.styles";

export function PollTweetCard(props: {
  tweet: LeaguePollTweet;
  cardHeight: number;
}) {
  return (
    <View style={[styles.pollTweetCard, { height: props.cardHeight }]}>
      <View style={styles.pollTweetCardHeader}>
        <LinearGradient
          colors={props.tweet.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pollTweetAvatar}
        >
          <RNText style={styles.pollTweetAvatarText}>
            {props.tweet.avatarLabel}
          </RNText>
        </LinearGradient>

        <View style={styles.pollTweetMetaBlock}>
          <View style={styles.pollTweetIdentityRow}>
            <RNText style={styles.pollTweetAuthor}>{props.tweet.author}</RNText>
            <RNText style={styles.pollTweetHandle}>{props.tweet.handle}</RNText>
            <RNText style={styles.pollTweetTimeLabel}>
              {props.tweet.timeLabel}
            </RNText>
          </View>
          {props.tweet.replyTo ? (
            <RNText style={styles.pollTweetReplyLine}>
              ردًا على {props.tweet.replyTo}
            </RNText>
          ) : null}
        </View>

        <Ionicons
          name="ellipsis-horizontal"
          size={16}
          color="rgba(255,255,255,0.34)"
        />
      </View>

      <RNText style={styles.pollTweetQuote} numberOfLines={3}>
        {props.tweet.body}
      </RNText>

      <View style={styles.pollTweetActionsRow}>
        <View style={styles.pollTweetActionItem}>
          <Ionicons
            name="chatbubble-outline"
            size={17}
            color="rgba(255,255,255,0.44)"
          />
          <RNText style={styles.pollTweetActionCount}>
            {props.tweet.replies}
          </RNText>
        </View>

        <View style={styles.pollTweetActionItem}>
          <Ionicons
            name="repeat-outline"
            size={18}
            color="rgba(255,255,255,0.44)"
          />
          <RNText style={styles.pollTweetActionCount}>
            {props.tweet.reposts}
          </RNText>
        </View>

        <View style={styles.pollTweetActionItem}>
          <Ionicons
            name="heart-outline"
            size={17}
            color="rgba(255,255,255,0.44)"
          />
          <RNText style={styles.pollTweetActionCount}>
            {props.tweet.likes}
          </RNText>
        </View>

        <View style={styles.pollTweetActionItem}>
          <Ionicons
            name="stats-chart-outline"
            size={17}
            color="rgba(255,255,255,0.44)"
          />
          <RNText style={styles.pollTweetActionCount}>
            {props.tweet.views}
          </RNText>
        </View>

        <View style={styles.pollTweetActionIconOnly}>
          <Ionicons
            name="bookmark-outline"
            size={17}
            color="rgba(255,255,255,0.44)"
          />
        </View>

        <View style={styles.pollTweetActionIconOnly}>
          <Ionicons
            name="share-social-outline"
            size={17}
            color="rgba(255,255,255,0.44)"
          />
        </View>
      </View>
    </View>
  );
}
