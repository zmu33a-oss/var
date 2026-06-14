import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FAN_CLUBS, LEAGUES } from "../../../app.data";
import type { ProfileData } from "../../../app.types";
import {
  getArabicFontStyle,
  resolveProfileAvatarUri,
} from "../profile.helpers";
import type { ProfileFieldKey } from "../profile.constants";
import { styles } from "../profile.styles";
import { ProfileFieldInput } from "./ProfileFieldInput";

type EditTab = "info" | "league";

export function ProfileEditModal(props: {
  arabicFontFamily?: string;
  draftProfile: ProfileData;
  onChangeField: (field: ProfileFieldKey, value: string) => void;
  onPickAvatar: () => void;
  isPickingAvatar: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const staticArabicTextStyle = getArabicFontStyle(props.arabicFontFamily);
  const [activeTab, setActiveTab] = useState<EditTab>("info");
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);

  const parseLeagueClubs = (raw: string): Record<string, string> => {
    if (!raw?.trim()) return {};
    try { return JSON.parse(raw) as Record<string, string>; } catch { return {}; }
  };

  const leagueClubs = parseLeagueClubs(props.draftProfile.leagueClub);
  const totalSelected = Object.values(leagueClubs).filter(Boolean).length;

  const handleSelectClub = (leagueId: string, club: string) => {
    const current = { ...leagueClubs };
    if (current[leagueId] === club) {
      delete current[leagueId];
    } else {
      current[leagueId] = club;
    }
    props.onChangeField("leagueClub", JSON.stringify(current));
  };

  const handleClearLeague = (leagueId: string) => {
    const current = { ...leagueClubs };
    delete current[leagueId];
    props.onChangeField("leagueClub", JSON.stringify(current));
  };

  const toggleLeague = (leagueId: string) => {
    setExpandedLeague((prev) => (prev === leagueId ? null : leagueId));
  };

  return (
    <View style={styles.modalRoot}>
      <LinearGradient
        colors={["#03060E", "#050A14", "#02040A"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.modalHeader}>
          <Pressable style={styles.modalIconButton} onPress={props.onClose}>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.modalHeaderCopy}>
            <Text style={styles.modalEyebrow}>EDIT PROFILE</Text>
            <Text style={[styles.modalTitle, staticArabicTextStyle]}>
              تعديل الملف الشخصي
            </Text>
          </View>

          <Pressable style={styles.modalPrimaryButton} onPress={props.onSave}>
            <Text style={[styles.modalPrimaryButtonText, staticArabicTextStyle]}>
              حفظ
            </Text>
          </Pressable>
        </View>

        <View style={editModalStyles.tabRow}>
          <Pressable
            style={[editModalStyles.tabBtn, activeTab === "info" && editModalStyles.tabBtnActive]}
            onPress={() => setActiveTab("info")}
          >
            <Text style={[editModalStyles.tabBtnText, activeTab === "info" && editModalStyles.tabBtnTextActive, staticArabicTextStyle]}>
              المعلومات
            </Text>
          </Pressable>
          <Pressable
            style={[editModalStyles.tabBtn, activeTab === "league" && editModalStyles.tabBtnActive]}
            onPress={() => setActiveTab("league")}
          >
            <Text style={[editModalStyles.tabBtnText, activeTab === "league" && editModalStyles.tabBtnTextActive, staticArabicTextStyle]}>
              الرابطة
            </Text>
          </Pressable>
        </View>

        {activeTab === "info" ? (
          <View style={styles.editPanel}>
            <View style={styles.editAvatarSection}>
              <Text style={[styles.fieldLabel, staticArabicTextStyle]}>
                الصورة الشخصية
              </Text>

              <View style={styles.editAvatarCard}>
                <View style={styles.editAvatarPreviewWrap}>
                  <Image
                    source={{ uri: resolveProfileAvatarUri(props.draftProfile.avatarUri) }}
                    style={styles.editAvatarPreview}
                  />
                </View>

                <View style={styles.editAvatarCopy}>
                  <Text style={[styles.editAvatarTitle, staticArabicTextStyle]}>
                    واجهة البطاقة
                  </Text>
                  <Text style={[styles.editAvatarHint, staticArabicTextStyle]}>
                    الصورة تنعكس مباشرة على وجه البطاقة بعد اختيارها.
                  </Text>
                </View>

                <Pressable
                  style={styles.editAvatarButton}
                  onPress={props.onPickAvatar}
                  disabled={props.isPickingAvatar}
                >
                  <Ionicons name="image-outline" size={18} color="#09111C" />
                  <Text style={styles.editAvatarButtonText}>
                    {props.isPickingAvatar ? "جارٍ التحميل" : "تحميل صورة"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <ProfileFieldInput
              arabicFontFamily={props.arabicFontFamily}
              label="الاسم الشخصي"
              value={props.draftProfile.displayName}
              onChangeText={(value) => props.onChangeField("displayName", value)}
            />

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, staticArabicTextStyle]}>VAR ID</Text>
              <View style={[styles.fieldInput, editModalStyles.readonlyField]}>
                <Ionicons name="lock-closed-outline" size={14} color="rgba(255,255,255,0.35)" />
                <Text style={[editModalStyles.readonlyText, staticArabicTextStyle]}>
                  {props.draftProfile.displayVarId || props.draftProfile.varId || "—"}
                </Text>
              </View>
              <Text style={[{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 6, textAlign: "right" }, staticArabicTextStyle]}>
                VAR ID يُحدد من قبل الإدارة فقط.
              </Text>
            </View>

            <ProfileFieldInput
              arabicFontFamily={props.arabicFontFamily}
              label="الجنسية"
              value={props.draftProfile.nationality}
              onChangeText={(value) => props.onChangeField("nationality", value)}
            />

            <ProfileFieldInput
              arabicFontFamily={props.arabicFontFamily}
              label="البريد الإلكتروني"
              value={props.draftProfile.email}
              onChangeText={(value) => props.onChangeField("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <ProfileFieldInput
              arabicFontFamily={props.arabicFontFamily}
              label="رقم الجوال"
              value={props.draftProfile.phoneNumber}
              onChangeText={(value) => props.onChangeField("phoneNumber", value)}
              keyboardType="phone-pad"
            />

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, staticArabicTextStyle]}>
                الرابطة
              </Text>
              <View style={styles.associationOptionsRow}>
                {FAN_CLUBS.map((club) => {
                  const isActive = props.draftProfile.association.trim() === club.title;
                  return (
                    <Pressable
                      key={club.id}
                      style={[styles.associationOption, isActive ? styles.associationOptionActive : null]}
                      onPress={() => props.onChangeField("association", club.title)}
                    >
                      <Text style={[styles.associationOptionText, staticArabicTextStyle, isActive ? styles.associationOptionTextActive : null]}>
                        {club.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Text style={[styles.editInfoNote, staticArabicTextStyle]}>
              VAR ID يُعيَّن تلقائياً من النظام ولا يمكن تغييره.
            </Text>
          </View>
        ) : (
          <View style={styles.editPanel}>
            <Text style={[editModalStyles.leagueHint, staticArabicTextStyle]}>
              {totalSelected > 0
                ? `اخترت ${totalSelected} ${totalSelected === 1 ? "نادي" : "أندية"} — يمكنك اختيار نادٍ واحد من كل دوري`
                : "اختر نادياً واحداً من كل دوري"}
            </Text>

            {LEAGUES.map((league) => {
              const isExpanded = expandedLeague === league.id;
              const selectedInLeague = leagueClubs[league.id] || "";

              return (
                <View key={league.id} style={editModalStyles.leagueBlock}>
                  <Pressable
                    style={[editModalStyles.leagueHeader, !!selectedInLeague && editModalStyles.leagueHeaderActive]}
                    onPress={() => toggleLeague(league.id)}
                  >
                    <Text style={[editModalStyles.leagueName, staticArabicTextStyle]}>
                      {league.name}
                    </Text>
                    <View style={editModalStyles.leagueHeaderRight}>
                      {selectedInLeague ? (
                        <>
                          <Text style={[editModalStyles.leagueSelectedBadge, staticArabicTextStyle]}>
                            {selectedInLeague}
                          </Text>
                          <Pressable onPress={() => handleClearLeague(league.id)}>
                            <Ionicons name="close-circle" size={16} color="#888" />
                          </Pressable>
                        </>
                      ) : null}
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#888"
                      />
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View style={editModalStyles.clubsGrid}>
                      {league.clubs.map((club) => {
                        const isActive = selectedInLeague === club;
                        return (
                          <Pressable
                            key={club}
                            style={[editModalStyles.clubChip, isActive && editModalStyles.clubChipActive]}
                            onPress={() => handleSelectClub(league.id, club)}
                          >
                            <Text style={[editModalStyles.clubChipText, staticArabicTextStyle, isActive && editModalStyles.clubChipTextActive]}>
                              {club}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const editModalStyles = StyleSheet.create({
  readonlyField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    opacity: 0.6,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  readonlyText: {
    flex: 1,
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#0D1525",
    borderWidth: 1,
    borderColor: "#1C2A3A",
    overflow: "hidden",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "#1A2E48",
    borderRadius: 10,
  },
  tabBtnText: {
    fontSize: 13,
    color: "#6B7A90",
    fontWeight: "600",
  },
  tabBtnTextActive: {
    color: "#F4C565",
  },
  selectedClubBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1C2510",
    borderWidth: 1,
    borderColor: "#F4C56530",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  selectedClubText: {
    flex: 1,
    fontSize: 13,
    color: "#F4C565",
    fontWeight: "700",
  },
  leagueHint: {
    fontSize: 12,
    color: "#6B7A90",
    textAlign: "center",
    marginBottom: 16,
  },
  leagueBlock: {
    marginBottom: 10,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1C2A3A",
  },
  leagueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0D1525",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  leagueHeaderActive: {
    backgroundColor: "#0F1E2E",
    borderBottomWidth: 1,
    borderBottomColor: "#F4C56520",
  },
  leagueName: {
    fontSize: 14,
    color: "#D7E6FF",
    fontWeight: "700",
  },
  leagueHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  leagueSelectedBadge: {
    fontSize: 11,
    color: "#F4C565",
    fontWeight: "600",
    backgroundColor: "#F4C56515",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  clubsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 12,
    backgroundColor: "#080E18",
  },
  clubChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#0D1525",
    borderWidth: 1,
    borderColor: "#1C2A3A",
  },
  clubChipActive: {
    backgroundColor: "#1C2E10",
    borderColor: "#F4C565",
  },
  clubChipText: {
    fontSize: 12,
    color: "#8A9BB0",
    fontWeight: "500",
  },
  clubChipTextActive: {
    color: "#F4C565",
    fontWeight: "700",
  },
});
