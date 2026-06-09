import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { listAppwriteVarLibraryItems } from "../../lib/appwrite";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  VAR_LIBRARY_WATERMARK,
  VAR_PLAYER_LIBRARY,
  VAR_PLAYER_LIBRARY_CLUBS,
  type VarLibraryPublishInput,
  type VarPlayerLibraryEntry,
} from "./varPlayerLibrary.constants";
import {
  mapAppwriteRecordToLibraryEntry,
  resolveVarLibraryEntryImageUri,
} from "./varPlayerLibrary.utils";
import { VarLibrarySourceStamp } from "./VarLibrarySourceStamp";
import { VarLibraryUploadPanel } from "./VarLibraryUploadPanel";

type VarPlayerLibraryProps = {
  isLoggedIn: boolean;
  isPublishing?: boolean;
  canPublishWithImage: boolean;
  canManageLibrary?: boolean;
  managerVarId?: string;
  imagePublishSetupMessage?: string | null;
  onRequireAuth: (message: string) => void;
  onPublishLibraryPost: (input: VarLibraryPublishInput) => Promise<boolean>;
  onShowNotice: (message: string) => void;
};

export function VarPlayerLibrary({
  isLoggedIn,
  isPublishing = false,
  canPublishWithImage,
  canManageLibrary = false,
  managerVarId = "",
  imagePublishSetupMessage,
  onRequireAuth,
  onPublishLibraryPost,
  onShowNotice,
}: VarPlayerLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeClub, setActiveClub] = useState<string>("الكل");
  const [selectedPlayer, setSelectedPlayer] =
    useState<VarPlayerLibraryEntry | null>(null);
  const [caption, setCaption] = useState("");
  const [uploadedLibrary, setUploadedLibrary] = useState<VarPlayerLibraryEntry[]>(
    [],
  );
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

  const loadUploadedLibrary = useCallback(async () => {
    setIsLoadingLibrary(true);

    try {
      const records = await listAppwriteVarLibraryItems();
      setUploadedLibrary(records.map(mapAppwriteRecordToLibraryEntry));
    } catch {
      setUploadedLibrary([]);
    } finally {
      setIsLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    void loadUploadedLibrary();
  }, [loadUploadedLibrary]);

  const allPlayers = useMemo(() => {
    const uploadedIds = new Set(uploadedLibrary.map((entry) => entry.id));

    return [
      ...uploadedLibrary,
      ...VAR_PLAYER_LIBRARY.filter((entry) => !uploadedIds.has(entry.id)),
    ];
  }, [uploadedLibrary]);

  const filteredPlayers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return allPlayers.filter((player) => {
      const matchesClub = activeClub === "الكل" || player.club === activeClub;
      if (!matchesClub) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = `${player.name} ${player.club} ${player.position}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [activeClub, allPlayers, searchQuery]);

  const selectedPortraitUri = selectedPlayer
    ? resolveVarLibraryEntryImageUri(selectedPlayer)
    : "";

  const handleSelectPlayer = (player: VarPlayerLibraryEntry) => {
    setSelectedPlayer(player);
    setCaption("");
  };

  const handleBackToLibrary = () => {
    setSelectedPlayer(null);
    setCaption("");
  };

  const handlePublish = async () => {
    if (!selectedPlayer) {
      onShowNotice("اختر صورة لاعب أولاً.");
      return;
    }

    if (!isLoggedIn) {
      onRequireAuth("سجّل الدخول لنشر من مكتبة فار على حسابك.");
      return;
    }

    const trimmedCaption = caption.trim();
    if (!trimmedCaption) {
      onShowNotice("اكتب الكلام الذي تريد إضافته على الصورة.");
      return;
    }

    const published = await onPublishLibraryPost({
      imageUri: selectedPortraitUri,
      caption: trimmedCaption,
      playerName: selectedPlayer.name,
      club: selectedPlayer.club,
    });

    if (published) {
      setCaption("");
      setSelectedPlayer(null);
      onShowNotice("تم نشر المنشور على حسابك.");
    }
  };

  if (selectedPlayer) {
    return (
      <View style={styles.composerScreen}>
        <View style={styles.composerTopBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="رجوع إلى مكتبة فار"
            onPress={handleBackToLibrary}
            style={styles.composerBackButton}
          >
            <Ionicons name="arrow-forward" size={20} color="#E0F2FE" />
            <Text style={styles.composerBackText}>رجوع للمكتبة</Text>
          </Pressable>
          <Text style={styles.composerTopTitle}>تحرير المنشور</Text>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.composerContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.composerCard}>
          <View style={styles.previewShell}>
            <Image
              source={{ uri: selectedPortraitUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.45)", "rgba(0,0,0,0.88)"]}
              locations={[0.35, 0.62, 1]}
              style={styles.previewGradient}
            />
            <VarLibrarySourceStamp style={styles.cornerStamp} />
            <View style={styles.previewTextBlock}>
              <Text style={styles.previewPlayerMeta}>
                {selectedPlayer.name} · {selectedPlayer.club}
              </Text>
              <Text style={styles.previewCaption}>
                {caption.trim() || "اكتب كلامك هنا — يظهر على الصورة"}
              </Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>كلامك على الصورة</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="مثال: اليوم كان أداءً رائعاً، استمر يا بطل!"
            placeholderTextColor="rgba(148, 163, 184, 0.9)"
            multiline
            maxLength={220}
            style={styles.captionInput}
            textAlign="right"
          />
          <Text style={styles.charCount}>{caption.trim().length}/220</Text>

          <View style={styles.attributionNote}>
            <Text style={styles.attributionNoteText}>
              الصورة من {VAR_LIBRARY_WATERMARK} — تُنشر مع ختم VAR الموثّق في الزاوية.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isPublishing || !canPublishWithImage}
            onPress={() => {
              void handlePublish();
            }}
            style={({ pressed }) => [
              styles.publishButton,
              pressed && styles.publishButtonPressed,
              isPublishing && styles.publishButtonDisabled,
            ]}
          >
            {isPublishing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.publishButtonText}>نشر على حسابي</Text>
            )}
          </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>مكتبة فار</Text>
        <Text style={styles.heroSubtitle}>
          اختر صورة من المكتبة، اكتب كلامك، وينشر تلقائياً على حسابك — الصورة
          من مكتبة فار والكلام منك.
        </Text>
      </View>

      {!canPublishWithImage && imagePublishSetupMessage ? (
        <View style={styles.setupWarning}>
          <Text style={styles.setupWarningText}>{imagePublishSetupMessage}</Text>
        </View>
      ) : null}

      {canManageLibrary ? (
        <VarLibraryUploadPanel
          compact
          managerVarId={managerVarId}
          onUploaded={() => {
            void loadUploadedLibrary();
          }}
          onShowNotice={onShowNotice}
        />
      ) : null}

      <>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ابحث عن لاعب أو نادي..."
            placeholderTextColor="rgba(148, 163, 184, 0.9)"
            style={styles.searchInput}
            textAlign="right"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.clubRow}
          >
            {VAR_PLAYER_LIBRARY_CLUBS.map((club) => {
              const isActive = club === activeClub;
              return (
                <Pressable
                  key={club}
                  accessibilityRole="button"
                  onPress={() => setActiveClub(club)}
                  style={[styles.clubChip, isActive && styles.clubChipActive]}
                >
                  <Text
                    style={[
                      styles.clubChipText,
                      isActive && styles.clubChipTextActive,
                    ]}
                  >
                    {club}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {isLoadingLibrary ? (
            <ActivityIndicator color="#7DD3FC" style={styles.libraryLoader} />
          ) : null}

          <View style={styles.grid}>
            {filteredPlayers.map((player) => (
              <Pressable
                key={player.id}
                accessibilityRole="button"
                onPress={() => handleSelectPlayer(player)}
                style={({ pressed }) => [
                  styles.playerCard,
                  pressed && styles.playerCardPressed,
                ]}
              >
                <Image
                  source={{
                    uri: resolveVarLibraryEntryImageUri(player),
                  }}
                  style={styles.playerPortrait}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.82)"]}
                  style={styles.playerGradient}
                />
                <VarLibrarySourceStamp compact style={styles.playerCornerStamp} />
                <View style={styles.playerMeta}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerClub}>
                    {player.club} · {player.position}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {filteredPlayers.length === 0 ? (
            <Text style={styles.emptyState}>لا توجد نتائج لهذا البحث.</Text>
          ) : null}
      </>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 14,
  },
  hero: {
    gap: 8,
    paddingTop: 4,
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "right",
  },
  heroSubtitle: {
    color: "rgba(203, 213, 225, 0.92)",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right",
  },
  setupWarning: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(248, 113, 113, 0.45)",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  setupWarningText: {
    color: "#FECACA",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "right",
  },
  searchInput: {
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderColor: "rgba(51, 65, 85, 0.9)",
    borderRadius: 14,
    borderWidth: 1,
    color: "#F8FAFC",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  clubRow: {
    gap: 8,
    paddingVertical: 2,
  },
  libraryLoader: {
    marginVertical: 8,
  },
  clubChip: {
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderColor: "rgba(51, 65, 85, 0.9)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  clubChipActive: {
    backgroundColor: "rgba(14, 165, 233, 0.18)",
    borderColor: "rgba(56, 189, 248, 0.75)",
  },
  clubChipText: {
    color: "rgba(203, 213, 225, 0.9)",
    fontSize: 13,
    fontWeight: "600",
  },
  clubChipTextActive: {
    color: "#E0F2FE",
  },
  grid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  playerCard: {
    width: "48%",
    aspectRatio: 0.82,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.85)",
  },
  playerCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  playerPortrait: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  playerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  playerCornerStamp: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  playerMeta: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    gap: 2,
  },
  playerName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
  },
  playerClub: {
    color: "rgba(226, 232, 240, 0.82)",
    fontSize: 11,
    textAlign: "right",
  },
  emptyState: {
    color: "rgba(148, 163, 184, 0.95)",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  composerScreen: {
    flex: 1,
  },
  composerTopBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(51, 65, 85, 0.85)",
    backgroundColor: "rgba(15, 23, 42, 0.92)",
  },
  composerBackButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  composerBackText: {
    color: "#E0F2FE",
    fontSize: 14,
    fontWeight: "700",
  },
  composerTopTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
  },
  composerContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 14,
  },
  composerCard: {
    gap: 12,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    borderColor: "rgba(51, 65, 85, 0.85)",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
  },
  previewShell: {
    aspectRatio: 0.8,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.85)",
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  previewGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cornerStamp: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  previewTextBlock: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    gap: 8,
  },
  previewPlayerMeta: {
    color: "rgba(226, 232, 240, 0.82)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  previewCaption: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 32,
    textAlign: "right",
  },
  fieldLabel: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  captionInput: {
    minHeight: 110,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
    borderColor: "rgba(51, 65, 85, 0.9)",
    borderRadius: 14,
    borderWidth: 1,
    color: "#F8FAFC",
    fontSize: 16,
    lineHeight: 26,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  charCount: {
    color: "rgba(148, 163, 184, 0.9)",
    fontSize: 12,
    textAlign: "left",
  },
  attributionNote: {
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    borderColor: "rgba(56, 189, 248, 0.35)",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attributionNoteText: {
    color: "rgba(186, 230, 253, 0.95)",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "right",
  },
  publishButton: {
    alignItems: "center",
    backgroundColor: "#0EA5E9",
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 50,
    marginTop: 4,
  },
  publishButtonPressed: {
    opacity: 0.9,
  },
  publishButtonDisabled: {
    opacity: 0.7,
  },
  publishButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
