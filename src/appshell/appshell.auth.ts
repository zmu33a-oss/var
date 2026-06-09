import { useEffect, useRef, useState } from "react";
import type { AppwriteAuthUser } from "../lib/appwrite";
import {
  clearAppwriteGoogleOAuthChallenge,
  completeAppwriteGoogleOAuthSession,
  findAppwriteProfileIndexByDisplayVarId,
  getCurrentAppwriteUser,
  hasAppwriteRecoveryChallenge,
  hasStoredAppwriteSession,
  logoutAppwriteUser,
  normalizeAppwriteDisplayVarId,
  readAppwriteGoogleOAuthChallenge,
  saveAppwriteUserProfile,
} from "../lib/appwrite";
import type {
  AuthMode,
  MainTab,
  PendingAuthIntent,
  ProfileData,
} from "../app.types";
import { INITIAL_PROFILE } from "../app.data";
import {
  buildDefaultPostAuthorId,
  clearStoredGoogleAuthSnapshot,
  getSessionRestoreNotice,
  mergeProfileWithAuthUser,
  readStoredAuthUser,
  readStoredGoogleAuthSnapshot,
  storeProfileAvatar,
  waitForTimeout,
  writeStoredAuthUser,
  writeStoredGoogleAuthSnapshot,
} from "./appshell.helpers";

export type AppwriteAuthCallbacks = {
  pendingAuthIntent: PendingAuthIntent | null;
  pendingAuthReturnTab: MainTab | null;
  setPendingAuthIntent: (intent: PendingAuthIntent | null) => void;
  setPendingAuthReturnTab: (tab: MainTab | null) => void;
  setShouldResumePendingAuth: (value: boolean) => void;
  setCurrentTab: (tab: MainTab) => void;
  setAuthMode: (mode: AuthMode) => void;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  setPostAuthorId: (id: string) => void;
  setNotice: (msg: string) => void;
  onSignedOut: () => void;
};

export function useAppwriteAuth(callbacks: AppwriteAuthCallbacks) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appwriteUser, setAppwriteUser] = useState<AppwriteAuthUser | null>(
    null,
  );
  const [canOpenAdmin, setCanOpenAdmin] = useState(false);

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const completeAuthFlow = (authenticatedUser: AppwriteAuthUser) => {
    const {
      pendingAuthIntent,
      pendingAuthReturnTab,
      setPendingAuthReturnTab,
      setPendingAuthIntent,
      setShouldResumePendingAuth,
      setCurrentTab,
      setProfile,
      setPostAuthorId,
      setNotice,
    } = callbacksRef.current;

    const hasPendingIntent = Boolean(pendingAuthIntent && pendingAuthReturnTab);

    clearStoredGoogleAuthSnapshot();
    writeStoredAuthUser(authenticatedUser);
    setAppwriteUser(authenticatedUser);
    setIsLoggedIn(true);
    setCanOpenAdmin(authenticatedUser.role === "admin");
    setPostAuthorId(authenticatedUser.varId);
    setProfile((currentProfile) =>
      mergeProfileWithAuthUser(currentProfile, authenticatedUser),
    );
    setCurrentTab(hasPendingIntent ? pendingAuthReturnTab! : "account");
    setShouldResumePendingAuth(hasPendingIntent);
    setPendingAuthIntent(null);
    if (!hasPendingIntent) {
      setPendingAuthReturnTab(null);
    }
    setNotice(
      hasPendingIntent
        ? "تم تسجيل الدخول، ونكمل طلبك الآن."
        : authenticatedUser.role === "admin"
          ? "تم تسجيل الدخول إلى حساب VAR الإداري."
          : "تم تسجيل الدخول وربط حساب Appwrite.",
    );
  };

  const signOut = async (options?: { suppressNotice?: boolean }) => {
    const { setNotice, onSignedOut } = callbacksRef.current;
    let signOutNotice = "تم تسجيل الخروج من Appwrite.";

    try {
      await logoutAppwriteUser();
    } catch (error) {
      signOutNotice =
        error instanceof Error
          ? `تم تسجيل الخروج محليًا، لكن Appwrite أعاد: ${error.message}`
          : "تم تسجيل الخروج محليًا فقط.";
    }

    clearStoredGoogleAuthSnapshot();
    writeStoredAuthUser(null);
    setAppwriteUser(null);
    setIsLoggedIn(false);
    setCanOpenAdmin(false);
    onSignedOut();

    if (!options?.suppressNotice) {
      setNotice(signOutNotice);
    }
  };

  const handleSaveProfile = async (
    nextProfile: ProfileData,
    currentAppwriteUser: AppwriteAuthUser | null,
  ) => {
    const { setProfile, setNotice, setPostAuthorId } = callbacksRef.current;
    setProfile(nextProfile);
    storeProfileAvatar(
      nextProfile.varId || currentAppwriteUser?.varId || "",
      nextProfile.avatarUri,
    );

    if (!currentAppwriteUser) {
      return;
    }

    try {
      const normalizedDisplayVarId =
        normalizeAppwriteDisplayVarId(nextProfile.displayVarId) ||
        currentAppwriteUser.displayVarId;

      if (normalizedDisplayVarId !== currentAppwriteUser.displayVarId) {
        const existingProfile = await findAppwriteProfileIndexByDisplayVarId(
          normalizedDisplayVarId,
        );

        if (
          existingProfile &&
          existingProfile.userId !== currentAppwriteUser.id
        ) {
          setNotice("رقم VAR هذا مستخدم من حساب آخر.");
          return;
        }
      }

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
        association: nextProfile.association,
        displayVarId: normalizedDisplayVarId,
        avatarUri: nextProfile.avatarUri,
      });

      writeStoredAuthUser(savedUser);
      setAppwriteUser(savedUser);
      setCanOpenAdmin(savedUser.role === "admin");
      setPostAuthorId(savedUser.varId);
      setProfile((currentProfile) =>
        mergeProfileWithAuthUser(currentProfile, savedUser),
      );
      setNotice("تم حفظ بيانات الحساب في Appwrite.");

      return savedUser;
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `تعذر حفظ بيانات الحساب: ${error.message}`
          : "تعذر حفظ بيانات الحساب في Appwrite.",
      );
    }
  };

  // ─── Session restore on mount ───────────────────────────────────────────────

  useEffect(() => {
    let isActive = true;

    const {
      setCurrentTab,
      setAuthMode,
      setProfile,
      setPostAuthorId,
      setNotice,
    } = callbacksRef.current;

    const googleOAuthChallenge = readAppwriteGoogleOAuthChallenge();

    if (googleOAuthChallenge?.status === "failure") {
      clearStoredGoogleAuthSnapshot();
      clearAppwriteGoogleOAuthChallenge();
      setCurrentTab("account");
      setAuthMode("login");
      setNotice(
        "عاد Google بدون إنشاء جلسة قابلة للاستخدام من Appwrite. هذا يشير إلى فشل داخل مسار OAuth نفسه وليس إلى مشكلة في واجهة التطبيق.",
      );
      return;
    }

    if (hasAppwriteRecoveryChallenge()) {
      setCurrentTab("account");
      setAuthMode("login");
      return;
    }

    const storedAuthUser = readStoredAuthUser();
    const pendingGoogleAuthSnapshot = readStoredGoogleAuthSnapshot();

    if (storedAuthUser) {
      setAppwriteUser(storedAuthUser);
      setCanOpenAdmin(storedAuthUser.role === "admin");
      setPostAuthorId(storedAuthUser.varId);
      setProfile((currentProfile) =>
        mergeProfileWithAuthUser(currentProfile, storedAuthUser),
      );
    }

    const restoreAppwriteSession = async () => {
      if (googleOAuthChallenge?.status === "success") {
        try {
          const currentUser =
            await completeAppwriteGoogleOAuthSession(googleOAuthChallenge);

          if (!isActive) {
            return;
          }

          clearAppwriteGoogleOAuthChallenge();
          completeAuthFlow(currentUser!);
          return;
        } catch (error) {
          clearStoredGoogleAuthSnapshot();
          clearAppwriteGoogleOAuthChallenge();

          if (!isActive) {
            return;
          }

          setCurrentTab("account");
          setAuthMode("login");
          setNotice(
            error instanceof Error
              ? `اكتملت مصادقة Google لكن Appwrite لم يسلّم Session صالحة للتطبيق: ${error.message}`
              : "اكتملت مصادقة Google لكن Appwrite لم يسلّم Session صالحة للتطبيق.",
          );
          return;
        }
      }

      const restoreRetryDelays = pendingGoogleAuthSnapshot
        ? [0, 350, 900, 1600]
        : [0];
      let lastRestoreError: unknown = null;

      for (
        let attemptIndex = 0;
        attemptIndex < restoreRetryDelays.length;
        attemptIndex += 1
      ) {
        if (restoreRetryDelays[attemptIndex] > 0) {
          await waitForTimeout(restoreRetryDelays[attemptIndex]);
        }

        if (!isActive) {
          return;
        }

        const sessionMarkerVisible = hasStoredAppwriteSession();

        try {
          const currentUser = await getCurrentAppwriteUser();

          if (!isActive) {
            return;
          }

          if (!currentUser) {
            if (
              !pendingGoogleAuthSnapshot ||
              (!sessionMarkerVisible && attemptIndex > 0) ||
              attemptIndex === restoreRetryDelays.length - 1
            ) {
              break;
            }

            continue;
          }

          clearStoredGoogleAuthSnapshot();
          writeStoredAuthUser(currentUser);
          setAppwriteUser(currentUser);
          setIsLoggedIn(true);
          setCanOpenAdmin(currentUser.role === "admin");
          setPostAuthorId(currentUser.varId);
          setProfile((currentProfile) =>
            mergeProfileWithAuthUser(currentProfile, currentUser),
          );
          return;
        } catch (error) {
          lastRestoreError = error;

          if (
            !pendingGoogleAuthSnapshot ||
            attemptIndex === restoreRetryDelays.length - 1
          ) {
            break;
          }
        }
      }

      if (!isActive) {
        return;
      }

      if (storedAuthUser) {
        writeStoredAuthUser(null);
        setAppwriteUser(null);
        setIsLoggedIn(false);
        setCanOpenAdmin(false);
        setProfile(INITIAL_PROFILE);
        setPostAuthorId(buildDefaultPostAuthorId(INITIAL_PROFILE));
      }

      try {
        if (pendingGoogleAuthSnapshot) {
          clearStoredGoogleAuthSnapshot();

          if (lastRestoreError) {
            setNotice(getSessionRestoreNotice(lastRestoreError));
            return;
          }

          setNotice(
            "اكتملت العودة من Google لكن جلسة Appwrite لم تُستعد داخل التطبيق. هذا يحدث غالبًا عندما يتأخر المتصفح في تثبيت الجلسة بعد الرجوع من OAuth.",
          );
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        setNotice(getSessionRestoreNotice(error));
      }
    };

    void restoreAppwriteSession();

    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isLoggedIn,
    appwriteUser,
    canOpenAdmin,
    completeAuthFlow,
    signOut,
    handleSaveProfile,
    writeStoredGoogleAuthSnapshot,
  };
}
