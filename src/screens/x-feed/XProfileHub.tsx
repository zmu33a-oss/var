import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SealCheckIcon from "../../components/SealCheckIcon";
import type { FollowingProfileCard } from "../../app.types";
import type { MessageThreadEntry } from "./x-feed.types";
import { XMessagesScreen } from "./XMessagesScreen";

type XProfileHubProps = {
  isLoggedIn: boolean;
  displayName: string;
  displayVarId: string;
  avatarUri: string;
  isVerified?: boolean;
  role?: "admin" | "member";
  messageThreads: MessageThreadEntry[];
  unreadMessageCount: number;
  onRequireAuth: () => void;
  onOpenPublicProfile: () => void;
  onOpenThread: (thread: MessageThreadEntry) => void;
  onComposeLookup: (displayVarId: string) => Promise<FollowingProfileCard | null>;
  onOpenNewThread: (profile: FollowingProfileCard) => void;
};

export function XProfileHub(props: XProfileHubProps) {
  const [panel, setPanel] = useState<"hub" | "messages">("hub");

  if (panel === "messages") {
    return (
      <View style={styles.root}>
        <Pressable style={styles.backRow} onPress={() => setPanel("hub")}>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          <Text style={styles.backRowText}>ملفك</Text>
        </Pressable>

        <XMessagesScreen
          isLoggedIn={props.isLoggedIn}
          threads={props.messageThreads}
          onRequireAuth={props.onRequireAuth}
          onOpenThread={props.onOpenThread}
          onComposeLookup={props.onComposeLookup}
          onOpenNewThread={props.onOpenNewThread}
        />
      </View>
    );
  }

  if (!props.isLoggedIn) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>ملفك على X</Text>
        <Text style={styles.emptyText}>
          سجّل الدخول لعرض ملفك وإدارة الرسائل الخاصة من مكان واحد.
        </Text>
        <Pressable style={styles.authButton} onPress={props.onRequireAuth}>
          <Text style={styles.authButtonText}>تسجيل الدخول</Text>
        </Pressable>
      </View>
    );
  }

  const displayName = props.displayName.trim() || "VAR User";
  const displayVarId = props.displayVarId.trim() || "VAR ID";
  const avatarUri = props.avatarUri.trim();
  const roleLabel = props.role === "admin" ? "ADMIN" : "MEMBER";

  return (
    <View style={styles.root}>
      <View style={styles.identityCard}>
        <View style={styles.identityRow}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarFallbackText}>
                {displayName.slice(0, 1) || "V"}
              </Text>
            )}
          </View>

          <View style={styles.identityMeta}>
            <View style={styles.identityNameRow}>
              <Text style={styles.identityName}>{displayName}</Text>
              {props.isVerified ? (
                <SealCheckIcon size={16} style={styles.verifiedIcon} />
              ) : null}
            </View>
            <Text style={styles.identityVarId}>{displayVarId}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.publicProfileButton} onPress={props.onOpenPublicProfile}>
          <Text style={styles.publicProfileButtonText}>عرض ملفك العام</Text>
          <Ionicons name="open-outline" size={16} color="#7DD3FC" />
        </Pressable>
      </View>

      <View style={styles.linksSection}>
        <Text style={styles.linksSectionTitle}>خيارات ملفك</Text>

        <Pressable style={styles.linkRow} onPress={() => setPanel("messages")}>
          <View style={styles.linkRowLeading}>
            <View style={styles.linkIconWrap}>
              <Ionicons name="mail-outline" size={18} color="#7DD3FC" />
            </View>
            <View style={styles.linkCopy}>
              <Text style={styles.linkTitle}>الرسائل</Text>
              <Text style={styles.linkHint}>
                {props.messageThreads.length
                  ? `${props.messageThreads.length} محادثة`
                  : "ابدأ محادثة خاصة جديدة"}
              </Text>
            </View>
          </View>

          <View style={styles.linkRowTrailing}>
            {props.unreadMessageCount ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {props.unreadMessageCount > 9
                    ? "+9"
                    : props.unreadMessageCount}
                </Text>
              </View>
            ) : null}
            <Ionicons
              name="chevron-back"
              size={18}
              color="rgba(255,255,255,0.42)"
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#000000",
  },
  backRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  backRowText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 20,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
  },
  emptyText: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 21,
    textAlign: "right",
    marginTop: 8,
  },
  authButton: {
    alignSelf: "flex-end",
    marginTop: 14,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#1D9BF0",
  },
  authButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  identityCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 22,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  identityRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A8CD8",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallbackText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  identityMeta: {
    flex: 1,
    marginRight: 14,
    alignItems: "flex-end",
  },
  identityNameRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  identityName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  verifiedIcon: {
    marginRight: 6,
  },
  identityVarId: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(29,155,240,0.14)",
    borderWidth: 1,
    borderColor: "rgba(29,155,240,0.28)",
  },
  roleBadgeText: {
    color: "#7DD3FC",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  publicProfileButton: {
    marginTop: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(29,155,240,0.10)",
    borderWidth: 1,
    borderColor: "rgba(29,155,240,0.22)",
  },
  publicProfileButtonText: {
    color: "#7DD3FC",
    fontSize: 14,
    fontWeight: "800",
  },
  linksSection: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  linksSectionTitle: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  linkRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  linkRowLeading: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  linkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(29,155,240,0.12)",
  },
  linkCopy: {
    flex: 1,
    marginRight: 12,
    alignItems: "flex-end",
  },
  linkTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  linkHint: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  linkRowTrailing: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
});
