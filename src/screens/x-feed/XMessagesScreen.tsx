import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SealCheckIcon from "../../components/SealCheckIcon";
import type { MessageThreadEntry, XNotificationEntry } from "./x-feed.types";

export function XMessagesScreen(props: {
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

export function XNotificationsScreen(props: {
  isLoggedIn: boolean;
  notifications: Array<XNotificationEntry & { unread: boolean }>;
  onClose: () => void;
  onOpenNotification: (notification: XNotificationEntry) => void;
  onRequireAuth: () => void;
}) {
  return (
    <View style={styles.xDetailScreen}>
      <View style={styles.xNotificationHeader}>
        <Pressable style={styles.xDetailCloseButton} onPress={props.onClose}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.xNotificationHeaderTextBlock}>
          <Text style={styles.xNotificationHeaderTitle}>الإشعارات</Text>
          <Text style={styles.xNotificationHeaderSubtitle}>
            {!props.isLoggedIn
              ? "سجل الدخول لعرض الإشعارات المرتبطة بالرسائل والردود والنشاط داخل X."
              : props.notifications.length
                ? `${props.notifications.length} تحديث داخل X بين الرسائل والردود والنشاط.`
                : "أي رسالة خاصة أو رد أو نشاط جديد داخل X سيظهر هنا تلقائيًا."}
          </Text>
        </View>

        <View style={styles.xNotificationHeaderBadge}>
          <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.xDetailScrollArea}
        contentContainerStyle={styles.xNotificationContent}
      >
        {!props.isLoggedIn ? (
          <View style={styles.xMessagesEmptyCard}>
            <Text style={styles.xMessagesEmptyTitle}>سجل الدخول أولاً</Text>
            <Text style={styles.xMessagesEmptyText}>
              افتح الإشعارات بعد تسجيل الدخول لتصلك الرسائل الخاصة والردود وكل
              نشاط جديد داخل صفحة X.
            </Text>
            <Pressable
              style={styles.xFollowingAuthButton}
              onPress={props.onRequireAuth}
            >
              <Text style={styles.xFollowingAuthButtonText}>تسجيل الدخول</Text>
            </Pressable>
          </View>
        ) : props.notifications.length ? (
          props.notifications.map((notification) => (
            <Pressable
              key={notification.id}
              style={[
                styles.xNotificationCard,
                notification.unread ? styles.xNotificationCardUnread : null,
              ]}
              onPress={() => props.onOpenNotification(notification)}
            >
              <View style={styles.xNotificationCardHeader}>
                {notification.avatarUri ? (
                  <View style={styles.xNotificationAvatarWrap}>
                    <Image
                      source={{ uri: notification.avatarUri }}
                      style={styles.xNotificationAvatarImage}
                    />
                  </View>
                ) : (
                  <View style={styles.xNotificationIconWrap}>
                    <Ionicons
                      name={notification.iconName}
                      size={18}
                      color={notification.accentColor}
                    />
                  </View>
                )}

                <View style={styles.xNotificationTextBlock}>
                  <View style={styles.xNotificationTitleRow}>
                    <Text style={styles.xNotificationTitle}>
                      {notification.title}
                    </Text>
                    {notification.verified ? (
                      <SealCheckIcon
                        size={13}
                        style={styles.xNotificationVerifiedIcon}
                      />
                    ) : null}
                    {notification.unread ? (
                      <View style={styles.xNotificationUnreadDot} />
                    ) : null}
                  </View>

                  <Text numberOfLines={2} style={styles.xNotificationBody}>
                    {notification.body}
                  </Text>

                  <View style={styles.xNotificationMetaRow}>
                    <Text
                      style={[
                        styles.xNotificationTime,
                        { color: notification.accentColor },
                      ]}
                    >
                      {notification.timeLabel}
                    </Text>
                    <Ionicons
                      name={notification.iconName}
                      size={12}
                      color={notification.accentColor}
                    />
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.xMessagesEmptyCard}>
            <Text style={styles.xMessagesEmptyTitle}>لا توجد إشعارات بعد</Text>
            <Text style={styles.xMessagesEmptyText}>
              عندما ترسل رسالة خاصة أو يصل رد جديد أو يظهر نشاط على منشوراتك
              ستجده هنا مباشرة.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  xDetailScreen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  xDetailCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  xDetailScrollArea: {
    flex: 1,
    backgroundColor: "#000000",
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
  xNotificationHeader: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#000000",
  },
  xNotificationHeaderBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  xNotificationHeaderTextBlock: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: "flex-end",
  },
  xNotificationHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "right",
  },
  xNotificationHeaderSubtitle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "right",
    marginTop: 6,
  },
  xNotificationContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  xNotificationCard: {
    backgroundColor: "#000000",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 15,
  },
  xNotificationCardUnread: {
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  xNotificationCardHeader: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
  },
  xNotificationAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  xNotificationAvatarImage: {
    width: "100%",
    height: "100%",
  },
  xNotificationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  xNotificationTextBlock: {
    flex: 1,
    marginRight: 12,
    alignItems: "flex-end",
  },
  xNotificationTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  xNotificationTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
  },
  xNotificationVerifiedIcon: {
    marginLeft: 6,
  },
  xNotificationUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#1D9BF0",
    marginLeft: 8,
  },
  xNotificationBody: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 21,
    textAlign: "right",
    marginTop: 8,
  },
  xNotificationMetaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 10,
  },
  xNotificationTime: {
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
    marginRight: 6,
  },
});
