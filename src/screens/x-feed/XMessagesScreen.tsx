import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import SealCheckIcon from "../../components/SealCheckIcon";
import type { MessageThreadEntry } from "./x-feed.types";

export default function XMessagesScreen(props: {
  isLoggedIn: boolean;
  threads: MessageThreadEntry[];
  onOpenThread: (thread: MessageThreadEntry) => void;
  onRequireAuth: () => void;
}) {
  if (!props.isLoggedIn) {
    return (
      <View style={styles.xMessagesEmptyCard}>
        <Text style={styles.xMessagesEmptyTitle}>الرسائل الخاصة</Text>
        <Text style={styles.xMessagesEmptyText}>
          سجل الدخول أولاً حتى تظهر لك محادثات المستخدمين الخاصة بعيدًا عن
          التايم لاين العام.
        </Text>
        <Pressable
          style={styles.xFollowingAuthButton}
          onPress={props.onRequireAuth}
        >
          <Text style={styles.xFollowingAuthButtonText}>تسجيل الدخول</Text>
        </Pressable>
      </View>
    );
  }

  if (!props.threads.length) {
    return (
      <View style={styles.xMessagesEmptyCard}>
        <Text style={styles.xMessagesEmptyTitle}>لا توجد محادثات خاصة بعد</Text>
        <Text style={styles.xMessagesEmptyText}>
          تابع أي مستخدم أولاً ثم افتح هذا التبويب لتبدأ محادثة خاصة بينك وبينه
          بعيدًا عن المنشورات العامة.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.xMessagesSection}>
      {props.threads.map((thread) => (
        <Pressable
          key={thread.id}
          style={styles.xMessageCard}
          onPress={() => props.onOpenThread(thread)}
        >
          <View style={styles.xMessageCardHeader}>
            <View style={styles.xAvatarTiny}>
              {thread.avatarUri ? (
                <Image
                  source={{ uri: thread.avatarUri }}
                  style={styles.xAvatarTinyImage}
                />
              ) : (
                <Text style={styles.xAvatarTinyText}>
                  {thread.displayName.slice(0, 1) || "V"}
                </Text>
              )}
            </View>

            <View style={styles.xMessageCardMetaBlock}>
              <View style={styles.xMessageCardStatusRow}>
                <Text style={styles.xMessageCardStatus}>
                  {thread.statusLabel}
                </Text>
                {thread.unread ? (
                  <View style={styles.xMessageUnreadDot} />
                ) : null}
              </View>

              <View style={styles.xPostMetaLine}>
                <Text style={styles.xPostAuthor}>{thread.displayName}</Text>
                {thread.verified ? (
                  <SealCheckIcon size={14} style={styles.xVerifiedIcon} />
                ) : null}
                <Text style={styles.xPostHandle}>{thread.displayVarId}</Text>
                <Text style={styles.xPostDot}>·</Text>
                <Text style={styles.xPostTime}>{thread.timeLabel}</Text>
              </View>
            </View>
          </View>

          <Text numberOfLines={2} style={styles.xMessageCardPreview}>
            {thread.preview}
          </Text>

          <View style={styles.xMessageCardMetricsRow}>
            <View style={styles.xMessageMetricPill}>
              <Ionicons
                name="lock-closed-outline"
                size={13}
                color="rgba(255,255,255,0.62)"
              />
              <Text style={styles.xMessageMetricText}>خاص</Text>
            </View>

            <View style={styles.xMessageMetricPill}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={13}
                color="rgba(255,255,255,0.62)"
              />
              <Text style={styles.xMessageMetricText}>
                {thread.messageCount} رسالة
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  xMessagesSection: {
    paddingTop: 6,
    paddingBottom: 10,
  },
  xMessageCard: {
    backgroundColor: "#000000",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  xMessageCardHeader: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
  },
  xMessageCardMetaBlock: {
    flex: 1,
    marginRight: 12,
    alignItems: "flex-end",
  },
  xMessageCardStatusRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 4,
  },
  xMessageCardStatus: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "right",
  },
  xMessageUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  xMessageCardPreview: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "right",
    marginTop: 10,
    marginRight: 54,
  },
  xMessageCardMetricsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 12,
    marginRight: 54,
  },
  xMessageMetricPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginLeft: 16,
  },
  xMessageMetricText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "700",
    marginRight: 5,
  },
  xMessagesEmptyCard: {
    marginTop: 18,
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: "flex-end",
  },
  xMessagesEmptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
  },
  xMessagesEmptyText: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "right",
    marginTop: 8,
  },
  xFollowingAuthButton: {
    minWidth: 110,
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: "#1D9BF0",
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  xFollowingAuthButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  xAvatarTiny: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A8CD8",
  },
  xAvatarTinyImage: {
    width: "100%",
    height: "100%",
  },
  xAvatarTinyText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  xVerifiedIcon: {
    marginLeft: 4,
    marginRight: 0,
  },
  xPostMetaLine: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flexWrap: "wrap",
  },
  xPostAuthor: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 3,
  },
  xPostHandle: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  xPostTime: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 13,
    fontWeight: "600",
  },
  xPostDot: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 14,
    marginLeft: 6,
  },
});
