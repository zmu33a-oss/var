import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import SealCheckIcon from "../../components/SealCheckIcon";
import type { FollowingProfileCard } from "../../app.types";

export function XFollowingDeck(props: {
  isLoggedIn: boolean;
  profiles: FollowingProfileCard[];
  onRequireAuth: () => void;
  onUnfollow: (authorVarId: string) => void;
}) {
  if (!props.isLoggedIn) {
    return (
      <View style={styles.xFollowingEmptyCard}>
        <Text style={styles.xFollowingTitle}>المتابعون</Text>
        <Text style={styles.xFollowingEmptyTitle}>سجل الدخول أولاً</Text>
        <Text style={styles.xFollowingEmptyText}>
          افتح هذا التبويب بعد تسجيل الدخول لتشاهد الحسابات التي تتابعها.
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

  if (!props.profiles.length) {
    return (
      <View style={styles.xFollowingEmptyCard}>
        <Text style={styles.xFollowingTitle}>المتابعون</Text>
        <Text style={styles.xFollowingEmptyTitle}>لا توجد حسابات بعد</Text>
        <Text style={styles.xFollowingEmptyText}>
          عندما تتابع أي مستخدم من التايم لاين سيظهر هنا على شكل بطاقات متسلسلة.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.xFollowingSection}>
      <View style={styles.xFollowingSectionHeader}>
        <Text style={styles.xFollowingTitle}>المتابعون</Text>
        <Text style={styles.xFollowingSubtitle}>
          الحسابات التي تتابعها مرتبة كبطاقات متسلسلة.
        </Text>
      </View>

      <View style={styles.xFollowingDeckWrap}>
        {props.profiles.map((profile, index) => {
          const isAdmin = profile.role === "admin";
          const topOffset = index === 0 ? 0 : -Math.min(60, 34 + index * 8);

          return (
            <View
              key={profile.varId}
              style={[
                styles.xFollowingCardWrap,
                {
                  marginTop: topOffset,
                  zIndex: props.profiles.length - index,
                  transform: [{ scale: Math.max(0.88, 1 - index * 0.035) }],
                },
              ]}
            >
              <LinearGradient
                colors={
                  isAdmin
                    ? ["#1D4ED8", "#081223", "#05080F"]
                    : ["#0F766E", "#0B1823", "#05080F"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.xFollowingCard}
              >
                <View style={styles.xFollowingCardGlow} />

                <View style={styles.xFollowingCardHeader}>
                  <View style={styles.xFollowingBadge}>
                    <Ionicons
                      name="card-outline"
                      size={14}
                      color="rgba(255,255,255,0.88)"
                    />
                    <Text style={styles.xFollowingBadgeText}>WEBPLUS PASS</Text>
                  </View>

                  <Pressable
                    style={styles.xFollowingRemoveButton}
                    onPress={() => props.onUnfollow(profile.varId)}
                  >
                    <Text style={styles.xFollowingRemoveButtonText}>إلغاء</Text>
                  </Pressable>
                </View>

                <View style={styles.xFollowingIdentityRow}>
                  <View style={styles.xFollowingAvatarWrap}>
                    {profile.avatarUri.trim() ? (
                      <Image
                        source={{ uri: profile.avatarUri }}
                        style={styles.xFollowingAvatarImage}
                      />
                    ) : (
                      <Text style={styles.xFollowingAvatarText}>
                        {profile.displayName.slice(0, 1) || "V"}
                      </Text>
                    )}
                  </View>

                  <View style={styles.xFollowingIdentityText}>
                    <View style={styles.xFollowingNameRow}>
                      <Text style={styles.xFollowingName}>
                        {profile.displayName}
                      </Text>
                      {isAdmin ? (
                        <SealCheckIcon
                          size={16}
                          style={styles.xFollowingVerifiedIcon}
                        />
                      ) : null}
                    </View>
                    <Text style={styles.xFollowingHandle}>
                      {profile.username
                        ? `@${profile.username}`
                        : profile.displayVarId}
                    </Text>
                  </View>
                </View>

                <View style={styles.xFollowingIdBlock}>
                  <Text style={styles.xFollowingIdLabel}>VAR ID</Text>
                  <Text style={styles.xFollowingIdValue}>
                    {profile.displayVarId}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  xFollowingSection: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
  },
  xFollowingSectionHeader: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  xFollowingTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "right",
  },
  xFollowingSubtitle: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    marginTop: 6,
  },
  xFollowingDeckWrap: {
    paddingTop: 18,
    paddingBottom: 18,
  },
  xFollowingCardWrap: {
    marginHorizontal: 4,
  },
  xFollowingCard: {
    minHeight: 208,
    borderRadius: 28,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "space-between",
  },
  xFollowingCardGlow: {
    position: "absolute",
    top: -24,
    left: -18,
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  xFollowingCardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  xFollowingBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  xFollowingBadgeText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    fontWeight: "900",
    marginRight: 6,
    letterSpacing: 0.6,
  },
  xFollowingRemoveButton: {
    minWidth: 66,
    height: 30,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  xFollowingRemoveButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  xFollowingIdentityRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 22,
  },
  xFollowingAvatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  xFollowingAvatarImage: {
    width: "100%",
    height: "100%",
  },
  xFollowingAvatarText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  xFollowingIdentityText: {
    flex: 1,
    marginRight: 14,
    alignItems: "flex-end",
  },
  xFollowingNameRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  xFollowingName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
  },
  xFollowingVerifiedIcon: {
    marginLeft: 6,
  },
  xFollowingHandle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 5,
  },
  xFollowingIdBlock: {
    alignSelf: "stretch",
    marginTop: 22,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "flex-end",
  },
  xFollowingIdLabel: {
    color: "rgba(255,255,255,0.54)",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
    letterSpacing: 0.6,
  },
  xFollowingIdValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 6,
  },
  xFollowingEmptyCard: {
    marginTop: 18,
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 18,
    paddingVertical: 22,
    alignItems: "flex-end",
  },
  xFollowingEmptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
    marginTop: 10,
  },
  xFollowingEmptyText: {
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
});
