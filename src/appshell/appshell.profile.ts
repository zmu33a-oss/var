import { useCallback, useEffect } from "react";
import type { AppwriteAuthUser } from "../lib/appwrite";
import {
  getAppwriteVarProfile,
  saveAppwriteUserProfile,
  syncAppwriteSocialInteraction,
} from "../lib/appwrite";
import type { ProfileData } from "../app.types";
import {
  mergeProfileWithAuthUser,
  mergeProfileWithVarProfile,
  storeProfileAvatar,
  writeStoredAuthUser,
} from "./appshell.helpers";

// ─── refreshVarProfile ────────────────────────────────────────────────────────

export async function refreshVarProfile(
  varId: string,
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>,
  setNotice: (msg: string) => void,
  quiet = false,
) {
  if (!varId.trim()) {
    return;
  }

  try {
    const nextVarProfile = await getAppwriteVarProfile(varId);

    setProfile((currentProfile) =>
      mergeProfileWithVarProfile(currentProfile, nextVarProfile),
    );
  } catch (error) {
    if (quiet) {
      return;
    }

    setNotice(
      error instanceof Error
        ? `تعذر تحميل بيانات VAR ID: ${error.message}`
        : "تعذر تحميل بيانات VAR ID.",
    );
  }
}

// ─── useAppwriteVarProfile ────────────────────────────────────────────────────

type UseAppwriteVarProfileOptions = {
  isLoggedIn: boolean;
  appwriteUser: AppwriteAuthUser | null;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  setNotice: (msg: string) => void;
};

export function useAppwriteVarProfile(options: UseAppwriteVarProfileOptions) {
  const { isLoggedIn, appwriteUser, setProfile, setNotice } = options;

  const refresh = useCallback(
    (varId: string, quiet = false) =>
      refreshVarProfile(varId, setProfile, setNotice, quiet),
    [setProfile, setNotice],
  );

  useEffect(() => {
    if (!isLoggedIn || !appwriteUser?.varId) {
      return;
    }

    void refresh(appwriteUser.varId, true);
  }, [appwriteUser?.varId, isLoggedIn, refresh]);

  return { refreshVarProfile: refresh };
}

// ─── handleSaveProfile ────────────────────────────────────────────────────────

export async function handleSaveProfile(
  nextProfile: ProfileData,
  appwriteUser: AppwriteAuthUser | null,
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>,
  setNotice: (msg: string) => void,
  onSaved?: (savedUser: AppwriteAuthUser) => void,
  setAppwriteUser?: (user: AppwriteAuthUser) => void,
  setCanOpenAdmin?: (value: boolean) => void,
  setPostAuthorId?: (authorId: string) => void,
) {
  setProfile(nextProfile);
  storeProfileAvatar(
    nextProfile.varId || appwriteUser?.varId || "",
    nextProfile.avatarUri,
  );

  if (!appwriteUser) {
    return;
  }

  try {
    const savedUser = await saveAppwriteUserProfile({
      name: nextProfile.displayName,
      username: nextProfile.username,
      phoneNumber: nextProfile.phoneNumber,
      nationalId: nextProfile.nationalId,
      bio: nextProfile.bio,
      location: nextProfile.location,
      profession: nextProfile.profession,
      birthDate: nextProfile.birthDate,
      nationality: nextProfile.nationality,
      avatarUri: nextProfile.avatarUri,
    });

    writeStoredAuthUser(savedUser);
    setAppwriteUser?.(savedUser);
    setCanOpenAdmin?.(savedUser.role === "admin");
    setPostAuthorId?.(savedUser.varId);
    setProfile((currentProfile) =>
      mergeProfileWithAuthUser(currentProfile, savedUser),
    );
    setNotice("تم حفظ بيانات الحساب في Appwrite.");
    onSaved?.(savedUser);
  } catch (error) {
    setNotice(
      error instanceof Error
        ? `تعذر حفظ بيانات الحساب: ${error.message}`
        : "تعذر حفظ بيانات الحساب في Appwrite.",
    );
  }
}

// ─── trackVarInteraction ──────────────────────────────────────────────────────

type TrackVarInteractionInput = {
  mode: "x" | "tiktok";
  action: "post" | "reply" | "comment" | "like" | "repost" | "share" | "save";
  targetId: string;
  active?: boolean;
  value?: string;
};

export function makeTrackVarInteraction(
  appwriteUser: AppwriteAuthUser | null,
  refreshProfile: (varId: string, quiet: boolean) => Promise<void>,
) {
  return function trackVarInteraction(input: TrackVarInteractionInput) {
    const currentVarId = appwriteUser?.varId.trim();

    if (!currentVarId || !input.targetId.trim()) {
      return;
    }

    void (async () => {
      try {
        await syncAppwriteSocialInteraction({
          varId: currentVarId,
          mode: input.mode,
          action: input.action,
          targetId: input.targetId,
          active: input.active,
          value: input.value,
        });
        await refreshProfile(currentVarId, true);
      } catch {
        // Keep local interactions responsive even when Appwrite write-through is unavailable.
      }
    })();
  };
}
