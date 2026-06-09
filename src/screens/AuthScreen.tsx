import { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import {
  Animated,
  Easing,
  Image,
  type GestureResponderEvent,
  type TextInputProps,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import type { AuthMode, IconName } from "../app.types";
import { PullToRefreshScrollView } from "../components/PullToRefreshScrollView";
import {
  APPWRITE_CONFIG,
  clearAppwriteRecoveryChallenge,
  completeAppwritePasswordRecovery,
  getAppwriteConfigurationError,
  loginAppwriteWithGoogle,
  loginAppwriteUser,
  readAppwriteRecoveryChallenge,
  requestAppwritePasswordRecovery,
  signupAppwriteUser,
  type AppwriteAuthUser,
} from "../lib/appwrite";
import {
  createCompatStyleSheet,
  getNativePointerEventsProps,
  getWebPointerEventsStyle,
} from "../lib/crossPlatformStyles";

const MONO_FONT = Platform.OS === "ios" ? "Courier" : "monospace";
const LOGIN_SOUND = require("../../assets/audio/login.mp3");
const LOGIN_SOUND_VOLUME = 0.04;
const FULL_NAME_PATTERN = /^[A-Za-z\u0600-\u06FF\s'-]+$/;
const USERNAME_PATTERN = /^[a-z0-9._]{3,20}$/;
const LOGIN_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;
const VAR_ADMIN_USERNAME = "var";

type ApplePayConfirmState = "idle" | "armed" | "processing";
type PasswordRecoveryView = "request" | "reset";
type WebAudioInstance = {
  preload?: string;
  currentTime?: number;
  volume?: number;
  play?: () => Promise<void>;
  pause?: () => void;
};
type WebAudioConstructor = new (src?: string) => WebAudioInstance;
type LoginSoundEngine = {
  play: () => Promise<void>;
  stop: () => void;
  setVolume: (volume: number) => void;
};

function createLoginSoundEngine(uri: string): LoginSoundEngine | null {
  if (Platform.OS !== "web") {
    return null;
  }

  const audioConstructor = (
    globalThis as typeof globalThis & { Audio?: WebAudioConstructor }
  ).Audio;

  if (!audioConstructor) {
    return null;
  }

  const audio = new audioConstructor(uri);
  audio.preload = "auto";

  const audioContextConstructor = (
    globalThis as typeof globalThis & {
      AudioContext?: new () => {
        createMediaElementSource: (element: HTMLMediaElement) => {
          connect: (destination: unknown) => void;
        };
        createGain: () => {
          gain: { value: number };
          connect: (destination: unknown) => void;
        };
        destination: unknown;
        state: string;
        resume: () => Promise<void>;
      };
      webkitAudioContext?: new () => {
        createMediaElementSource: (element: HTMLMediaElement) => {
          connect: (destination: unknown) => void;
        };
        createGain: () => {
          gain: { value: number };
          connect: (destination: unknown) => void;
        };
        destination: unknown;
        state: string;
        resume: () => Promise<void>;
      };
    }
  ).AudioContext;

  const webkitAudioContextConstructor = (
    globalThis as typeof globalThis & {
      webkitAudioContext?: new () => {
        createMediaElementSource: (element: HTMLMediaElement) => {
          connect: (destination: unknown) => void;
        };
        createGain: () => {
          gain: { value: number };
          connect: (destination: unknown) => void;
        };
        destination: unknown;
        state: string;
        resume: () => Promise<void>;
      };
    }
  ).webkitAudioContext;

  const contextConstructor =
    audioContextConstructor ?? webkitAudioContextConstructor;

  if (!contextConstructor) {
    return {
      play: async () => {
        audio.volume = LOGIN_SOUND_VOLUME;
        if (typeof audio.currentTime === "number") {
          audio.currentTime = 0;
        }
        await audio.play?.();
      },
      stop: () => {
        audio.pause?.();
        if (typeof audio.currentTime === "number") {
          audio.currentTime = 0;
        }
      },
      setVolume: (volume) => {
        audio.volume = volume;
      },
    };
  }

  const context = new contextConstructor();
  const mediaElement = audio as unknown as HTMLMediaElement;
  const source = context.createMediaElementSource(mediaElement);
  const gainNode = context.createGain();
  gainNode.gain.value = LOGIN_SOUND_VOLUME;
  source.connect(gainNode);
  gainNode.connect(context.destination);
  audio.volume = 1;

  return {
    play: async () => {
      gainNode.gain.value = LOGIN_SOUND_VOLUME;
      if (typeof audio.currentTime === "number") {
        audio.currentTime = 0;
      }

      if (context.state === "suspended") {
        await context.resume();
      }

      await audio.play?.();
    },
    stop: () => {
      audio.pause?.();
      if (typeof audio.currentTime === "number") {
        audio.currentTime = 0;
      }
    },
    setVolume: (volume) => {
      gainNode.gain.value = volume;
    },
  };
}
type AuthErrorCandidate = {
  code?: unknown;
  type?: unknown;
  message?: unknown;
  name?: unknown;
  response?: unknown;
};

type AuthScreenProps = {
  authMode: AuthMode;
  onChangeMode: (mode: AuthMode) => void;
  onStartGoogleLogin?: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onSuccess: (user: AppwriteAuthUser) => void;
};

function readAuthErrorSourceLabel(
  candidate: AuthErrorCandidate,
  rawMessage: string,
) {
  const normalizedMessage = rawMessage.toLowerCase();
  const errorType =
    typeof candidate.type === "string" ? candidate.type.trim() : "";

  if (
    normalizedMessage.includes("origin") ||
    normalizedMessage.includes("hostname") ||
    normalizedMessage.includes("domain") ||
    normalizedMessage.includes("platform") ||
    normalizedMessage.includes("whitelist")
  ) {
    return "Appwrite Platforms > Web";
  }

  if (
    normalizedMessage.includes("load failed") ||
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("network request failed")
  ) {
    return "المتصفح أو الشبكة";
  }

  if (
    normalizedMessage.includes("redirect") &&
    normalizedMessage.includes("url")
  ) {
    return "Appwrite redirect URL";
  }

  if (
    normalizedMessage.includes("session") &&
    normalizedMessage.includes("active")
  ) {
    return "جلسة Appwrite الحالية";
  }

  if (errorType.startsWith("user_")) {
    return "Appwrite Account";
  }

  if (
    typeof candidate.type === "string" ||
    typeof candidate.code === "number" ||
    typeof candidate.code === "string"
  ) {
    return "Appwrite";
  }

  return "";
}

function readAuthErrorResponseLines(response: unknown) {
  if (!response || typeof response !== "object") {
    return [] as string[];
  }

  const candidate = response as {
    status?: unknown;
    statusText?: unknown;
    url?: unknown;
    message?: unknown;
  };
  const lines: string[] = [];
  const statusValue =
    typeof candidate.status === "number" || typeof candidate.status === "string"
      ? String(candidate.status)
      : "";
  const statusText =
    typeof candidate.statusText === "string" ? candidate.statusText.trim() : "";

  if (statusValue) {
    lines.push(
      `HTTP status: ${statusText ? `${statusValue} ${statusText}` : statusValue}`,
    );
  }

  if (typeof candidate.url === "string" && candidate.url.trim()) {
    lines.push(`URL: ${candidate.url.trim()}`);
  }

  if (typeof candidate.message === "string" && candidate.message.trim()) {
    lines.push(`تفاصيل الاستجابة: ${candidate.message.trim()}`);
  }

  return lines;
}

function isNetworkLikeAuthError(
  candidate: AuthErrorCandidate,
  rawMessage: string,
) {
  const normalizedMessage = rawMessage.toLowerCase();
  const errorName =
    typeof candidate.name === "string" ? candidate.name.trim() : "";

  return (
    normalizedMessage.includes("load failed") ||
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("network request failed") ||
    (errorName === "TypeError" && !candidate.response)
  );
}

function readWebRuntimeContextLines() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return [] as string[];
  }

  const lines: string[] = [];

  if (window.location.origin) {
    lines.push(`الصفحة الحالية: ${window.location.origin}`);
  }

  return lines;
}

function readWebPlatformOriginHintLines(
  candidate: AuthErrorCandidate,
  rawMessage: string,
  sourceLabel: string,
) {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return [] as string[];
  }

  if (
    !(
      sourceLabel === "المتصفح أو الشبكة" ||
      sourceLabel === "Appwrite Platforms > Web" ||
      isNetworkLikeAuthError(candidate, rawMessage)
    )
  ) {
    return [] as string[];
  }

  const hostname = window.location.hostname?.trim();

  if (!hostname) {
    return [] as string[];
  }

  return [
    `Hostname المطلوب في Appwrite Platforms > Web: ${hostname}`,
    "أدخله بدون http:// وبدون رقم المنفذ.",
  ];
}

function readAuthErrorContextLines(
  candidate: AuthErrorCandidate,
  rawMessage: string,
  sourceLabel: string,
) {
  const lines: string[] = [];

  if (
    sourceLabel === "المتصفح أو الشبكة" ||
    sourceLabel === "Appwrite Platforms > Web" ||
    sourceLabel === "Appwrite redirect URL" ||
    isNetworkLikeAuthError(candidate, rawMessage)
  ) {
    lines.push(...readWebRuntimeContextLines());

    if (APPWRITE_CONFIG.endpoint) {
      lines.push(`Appwrite endpoint: ${APPWRITE_CONFIG.endpoint}`);
    }

    if (APPWRITE_CONFIG.projectId) {
      lines.push(`Appwrite project: ${APPWRITE_CONFIG.projectId}`);
    }
  }

  lines.push(
    ...readWebPlatformOriginHintLines(candidate, rawMessage, sourceLabel),
  );

  return lines;
}

function readInvalidCredentialsHintLines(candidate: AuthErrorCandidate) {
  const errorType =
    typeof candidate.type === "string" ? candidate.type.trim() : "";

  if (errorType !== "user_invalid_credentials") {
    return [] as string[];
  }

  return [
    "تأكد أنك تستخدم البريد الإلكتروني المسجل في Appwrite، وليس اسم المستخدم أو VAR ID.",
    'إذا نسيت كلمة المرور فاستخدم "نسيت كلمة المرور".',
  ];
}

function getAppwriteAuthErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "string") {
    const rawMessage = error.trim();
    return rawMessage
      ? `${fallback}\nالرسالة الفعلية: ${rawMessage}`
      : fallback;
  }

  if (!error || typeof error !== "object") {
    return fallback;
  }

  const candidate = error as AuthErrorCandidate;
  const rawMessage =
    typeof candidate.message === "string" ? candidate.message.trim() : "";
  const lines = [fallback];
  const sourceLabel = readAuthErrorSourceLabel(candidate, rawMessage);

  if (sourceLabel) {
    lines.push(`المصدر: ${sourceLabel}`);
  }

  if (
    typeof candidate.code === "number" ||
    typeof candidate.code === "string"
  ) {
    lines.push(`الكود: ${String(candidate.code)}`);
  }

  if (typeof candidate.type === "string" && candidate.type.trim()) {
    lines.push(`النوع: ${candidate.type.trim()}`);
  }

  if (typeof candidate.name === "string" && candidate.name.trim()) {
    lines.push(`الفئة: ${candidate.name.trim()}`);
  }

  if (rawMessage) {
    lines.push(`الرسالة الفعلية: ${rawMessage}`);
  }

  if (
    candidate.type === "project_not_found" ||
    rawMessage
      .toLowerCase()
      .includes("project with the requested id could not be found")
  ) {
    lines.push(
      "الحل: افتح Appwrite Console → Project Settings → General وانسخ Project ID الحقيقي إلى EXPO_PUBLIC_APPWRITE_PROJECT_ID داخل ملف .env ثم أعد تشغيل npm run web.",
    );
  }

  lines.push(...readInvalidCredentialsHintLines(candidate));
  lines.push(...readAuthErrorResponseLines(candidate.response));
  lines.push(...readAuthErrorContextLines(candidate, rawMessage, sourceLabel));

  return lines.join("\n");
}

function normalizeSignupUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._]/g, "");
}

function isValidLoginEmail(value: string) {
  return LOGIN_EMAIL_PATTERN.test(value.trim().toLowerCase());
}

function hasValidDisplayName(value: string) {
  const trimmedValue = value.trim();

  if (!FULL_NAME_PATTERN.test(trimmedValue)) {
    return false;
  }

  return trimmedValue.replace(/\s+/g, "").length >= 2;
}

function hasStrongPassword(value: string) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value);
}

function getApplePayAccountLabel(email: string) {
  const trimmedEmail = email.trim();
  return trimmedEmail || "varpass@xtik.app";
}

function getBiometricLabel(
  supportedTypes: LocalAuthentication.AuthenticationType[],
) {
  if (
    supportedTypes.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    )
  ) {
    return "Face ID";
  }

  if (
    supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
  ) {
    return "Touch ID";
  }

  return "التحقق الحيوي";
}

export default function AuthScreen(props: AuthScreenProps) {
  const { authMode, onChangeMode, onStartGoogleLogin, onSuccess } = props;
  const { height: windowHeight } = useWindowDimensions();
  const [audioOn, setAudioOn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryView, setRecoveryView] =
    useState<PasswordRecoveryView>("request");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState("");
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [showRecoveryConfirm, setShowRecoveryConfirm] = useState(false);
  const [recoveryUserId, setRecoveryUserId] = useState("");
  const [recoverySecret, setRecoverySecret] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [isRecoveryBusy, setIsRecoveryBusy] = useState(false);
  const [isVarPassActionBusy, setIsVarPassActionBusy] = useState(false);
  const [isVarPassStepOpen, setIsVarPassStepOpen] = useState(false);
  const [isVarPassStepArmed, setIsVarPassStepArmed] = useState(false);
  const [applePayConfirmState, setApplePayConfirmState] =
    useState<ApplePayConfirmState>("idle");
  const [showLoginIntro, setShowLoginIntro] = useState(authMode === "login");
  const loginIntroPlayed = useRef(false);
  const loginSoundEngineRef = useRef<LoginSoundEngine | null>(null);
  const loginSoundStartedRef = useRef(false);
  const varPassStepArmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const applePayConfirmTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const introOverlayOpacity = useRef(new Animated.Value(1)).current;
  const introTitleOpacity = useRef(new Animated.Value(0)).current;
  const introTitleTranslateY = useRef(new Animated.Value(18)).current;
  const introSubtitleOpacity = useRef(new Animated.Value(0)).current;
  const introSubtitleTranslateY = useRef(new Animated.Value(14)).current;
  const introProgressWidth = useRef(new Animated.Value(0)).current;
  const applePayPulse = useRef(new Animated.Value(0)).current;
  const applePayAccountLabel = getApplePayAccountLabel(email);
  const applePayBiometricHint =
    Platform.OS === "ios"
      ? "إذا كانت بطاقة Apple Pay مضافة على الجهاز فسيطلب النظام Face ID أو رمز الجهاز."
      : "داخل الويب هذه معاينة بنفس تدفق Apple Pay ثم يتم إدخالك إلى التطبيق.";
  const applePayPrimaryLabel =
    applePayConfirmState === "processing"
      ? Platform.OS === "ios"
        ? "بانتظار Face ID..."
        : "جاري فحص الهوية..."
      : applePayConfirmState === "armed"
        ? "اضغط مرة ثانية لتأكيد Apple Pay"
        : "ابدأ Apple Pay";
  const applePayPrimarySubtext =
    applePayConfirmState === "processing"
      ? Platform.OS === "ios"
        ? "Authenticate with Face ID"
        : "WEBPLUS Web Preview"
      : applePayConfirmState === "armed"
        ? "Double Click to Confirm"
        : "يشبه الضغط مرتين على الزر الجانبي";
  const applePayGuidanceTitle =
    applePayConfirmState === "processing"
      ? Platform.OS === "ios"
        ? "أكمل Face ID الآن"
        : "تتم الآن معاينة Face ID"
      : applePayConfirmState === "armed"
        ? "الخطوة الأخيرة جاهزة"
        : "سلوك Apple Pay على خطوتين";
  const applePayGuidanceSubtitle =
    applePayConfirmState === "processing"
      ? Platform.OS === "ios"
        ? "بعد نجاح التحقق الحيوي سيتم فتح حسابك مباشرة."
        : "سيتم إدخالك مباشرة بعد انتهاء المعاينة الحالية."
      : applePayConfirmState === "armed"
        ? "اضغط مرة ثانية الآن ليبدأ طلب Face ID أو المعاينة على الويب."
        : "الضغطة الأولى تجهز العملية، والثانية تحاكي تأكيد Apple Pay الحقيقي.";
  const normalizedAdminCandidate = normalizeSignupUsername(username);
  const loginSoundUri = useMemo(() => {
    try {
      const resolvedSource = Image.resolveAssetSource(LOGIN_SOUND);

      if (resolvedSource?.uri) {
        return resolvedSource.uri;
      }
    } catch {
      // Ignore asset resolution failures on unsupported platforms.
    }

    return typeof LOGIN_SOUND === "string" ? LOGIN_SOUND : null;
  }, []);

  const stopLoginSound = () => {
    loginSoundEngineRef.current?.stop();
  };

  const playLoginSound = async () => {
    if (!audioOn || authMode !== "login") {
      return;
    }

    const engine = loginSoundEngineRef.current;

    if (!engine) {
      return;
    }

    try {
      engine.setVolume(LOGIN_SOUND_VOLUME);
      await engine.play();
      loginSoundStartedRef.current = true;
    } catch {
      // Browsers may block autoplay until the user interacts with the page.
    }
  };

  const loginWithEnteredCredentials = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password.trim()) {
      throw new Error("أدخل بريد الحساب وكلمة المرور أولاً.");
    }

    if (!isValidLoginEmail(trimmedEmail)) {
      throw new Error(
        "تسجيل الدخول هنا يتم بالبريد الإلكتروني المسجل في Appwrite، وليس باسم المستخدم أو VAR ID. إذا كان اسم المستخدم لديك var فادخل البريد الذي أنشأت به الحساب.",
      );
    }

    return loginAppwriteUser(trimmedEmail, password);
  };
  const applePayStatusLabel =
    applePayConfirmState === "processing"
      ? "VERIFYING"
      : applePayConfirmState === "armed"
        ? "DOUBLE CLICK"
        : "READY";
  const applePayPulseScale = applePayPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const applePayPulseOpacity = applePayPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0],
  });
  const applePayPulseScaleSecondary = applePayPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.32],
  });
  const applePayPulseOpacitySecondary = applePayPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0],
  });
  const isCompactAuthLayout = windowHeight < 860;

  useEffect(() => {
    return () => {
      if (varPassStepArmTimeoutRef.current) {
        clearTimeout(varPassStepArmTimeoutRef.current);
      }

      if (applePayConfirmTimeoutRef.current) {
        clearTimeout(applePayConfirmTimeoutRef.current);
      }

      stopLoginSound();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || !loginSoundUri) {
      loginSoundEngineRef.current = null;
      return;
    }

    const engine = createLoginSoundEngine(loginSoundUri);
    loginSoundEngineRef.current = engine;

    return () => {
      engine?.stop();
      loginSoundEngineRef.current = null;
      loginSoundStartedRef.current = false;
    };
  }, [loginSoundUri]);

  useEffect(() => {
    if (authMode !== "login") {
      stopLoginSound();
      loginSoundStartedRef.current = false;
      return;
    }

    if (audioOn) {
      void playLoginSound();
      return;
    }

    stopLoginSound();
    loginSoundStartedRef.current = false;
  }, [authMode, audioOn, loginSoundUri]);

  useEffect(() => {
    const recoveryChallenge = readAppwriteRecoveryChallenge();

    if (!recoveryChallenge) {
      return;
    }

    onChangeMode("login");
    setRecoveryView("reset");
    setRecoveryUserId(recoveryChallenge.userId);
    setRecoverySecret(recoveryChallenge.secret);
    setRecoveryEmail(recoveryChallenge.email);
    setRecoveryMessage("");
    setRecoveryPassword("");
    setRecoveryConfirmPassword("");
    setShowRecoveryPassword(false);
    setShowRecoveryConfirm(false);
    setIsRecoveryModalOpen(true);
  }, [onChangeMode]);

  useEffect(() => {
    if (!isVarPassStepOpen) {
      applePayPulse.stopAnimation();
      applePayPulse.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(applePayPulse, {
          toValue: 1,
          duration: 1450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(applePayPulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
      applePayPulse.stopAnimation();
      applePayPulse.setValue(0);
    };
  }, [applePayPulse, isVarPassStepOpen]);

  useEffect(() => {
    if (authMode !== "login") {
      setShowLoginIntro(false);
      return;
    }

    if (loginIntroPlayed.current) {
      return;
    }

    loginIntroPlayed.current = true;
    setShowLoginIntro(true);
    introOverlayOpacity.setValue(1);
    introTitleOpacity.setValue(0);
    introTitleTranslateY.setValue(18);
    introSubtitleOpacity.setValue(0);
    introSubtitleTranslateY.setValue(14);
    introProgressWidth.setValue(0);

    const introAnimation = Animated.sequence([
      Animated.parallel([
        Animated.timing(introTitleOpacity, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(introTitleTranslateY, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.timing(introSubtitleOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(introSubtitleTranslateY, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(introProgressWidth, {
          toValue: 240,
          duration: 1100,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(320),
      Animated.timing(introOverlayOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.in(Easing.quad),
        useNativeDriver: false,
      }),
    ]);

    introAnimation.start(({ finished }) => {
      if (finished) {
        setShowLoginIntro(false);
      }
    });

    return () => {
      introAnimation.stop();
    };
  }, [
    authMode,
    introOverlayOpacity,
    introProgressWidth,
    introSubtitleOpacity,
    introSubtitleTranslateY,
    introTitleOpacity,
    introTitleTranslateY,
  ]);

  const handleGoogleLogin = async (_event: GestureResponderEvent) => {
    setMessage("");
    const configurationError = getAppwriteConfigurationError();

    if (configurationError) {
      setMessage(configurationError);
      return;
    }

    setIsAuthBusy(true);

    try {
      onStartGoogleLogin?.();
      await loginAppwriteWithGoogle();
      setIsAuthBusy(false);
    } catch (error) {
      setMessage(
        getAppwriteAuthErrorMessage(error, "تعذر بدء تسجيل الدخول عبر Google."),
      );
      setIsAuthBusy(false);
    }
  };

  const handleEmailLogin = async () => {
    setMessage("");
    const configurationError = getAppwriteConfigurationError();

    if (configurationError) {
      setMessage(configurationError);
      return;
    }

    setIsAuthBusy(true);

    try {
      const user = await loginWithEnteredCredentials();
      onSuccess(user);
    } catch (error) {
      setMessage(getAppwriteAuthErrorMessage(error, "فشل تسجيل الدخول."));
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleSignup = async () => {
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const normalizedUsername = normalizeSignupUsername(username);

    if (
      !trimmedFullName ||
      !trimmedEmail ||
      !normalizedUsername ||
      !password.trim()
    ) {
      setMessage("أكمل البيانات أولاً.");
      return;
    }

    if (!hasValidDisplayName(trimmedFullName)) {
      setMessage("اكتب اسمًا صالحًا بدون أرقام أو رموز غريبة.");
      return;
    }

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setMessage(
        "اسم المستخدم يجب أن يكون 3-20 حرفًا إنجليزيًا أو أرقامًا أو نقطة أو _.",
      );
      return;
    }

    if (!hasStrongPassword(password)) {
      setMessage(
        "كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف ورقم.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    setMessage("");
    setIsAuthBusy(true);

    try {
      const user = await signupAppwriteUser({
        name: trimmedFullName,
        email: trimmedEmail,
        password,
        username: normalizedUsername,
      });
      onSuccess(user);
    } catch (error) {
      setMessage(getAppwriteAuthErrorMessage(error, "فشل إنشاء الحساب."));
    } finally {
      setIsAuthBusy(false);
    }
  };

  const openPasswordRecovery = () => {
    const recoveryChallenge = readAppwriteRecoveryChallenge();

    setRecoveryMessage("");
    setShowRecoveryPassword(false);
    setShowRecoveryConfirm(false);
    setRecoveryPassword("");
    setRecoveryConfirmPassword("");

    if (recoveryChallenge) {
      setRecoveryView("reset");
      setRecoveryUserId(recoveryChallenge.userId);
      setRecoverySecret(recoveryChallenge.secret);
      setRecoveryEmail(recoveryChallenge.email || email.trim().toLowerCase());
    } else {
      setRecoveryView("request");
      setRecoveryUserId("");
      setRecoverySecret("");
      setRecoveryEmail(email.trim().toLowerCase());
    }

    setIsRecoveryModalOpen(true);
  };

  const closePasswordRecovery = () => {
    if (isRecoveryBusy) {
      return;
    }

    setRecoveryMessage("");
    setShowRecoveryPassword(false);
    setShowRecoveryConfirm(false);
    setRecoveryPassword("");
    setRecoveryConfirmPassword("");
    setIsRecoveryModalOpen(false);
  };

  const handleSendRecoveryLink = async () => {
    const trimmedRecoveryEmail = recoveryEmail.trim().toLowerCase();

    if (!trimmedRecoveryEmail) {
      setRecoveryMessage("اكتب بريد الحساب أولاً.");
      return;
    }

    setRecoveryMessage("");
    setIsRecoveryBusy(true);

    try {
      await requestAppwritePasswordRecovery(trimmedRecoveryEmail);
      setEmail(trimmedRecoveryEmail);
      setRecoveryMessage(
        "تم إرسال رابط استعادة كلمة المرور إلى بريدك. افتح الرسالة ثم عد عبر الرابط لتعيين كلمة مرور جديدة.",
      );
    } catch (error) {
      setRecoveryMessage(
        getAppwriteAuthErrorMessage(error, "فشل إرسال رابط الاستعادة."),
      );
    } finally {
      setIsRecoveryBusy(false);
    }
  };

  const handleCompleteRecovery = async () => {
    if (!recoveryUserId || !recoverySecret) {
      setRecoveryMessage(
        "رابط الاستعادة الحالي غير مكتمل. اطلب رابطًا جديدًا.",
      );
      return;
    }

    if (!hasStrongPassword(recoveryPassword)) {
      setRecoveryMessage(
        "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف ورقم.",
      );
      return;
    }

    if (recoveryPassword !== recoveryConfirmPassword) {
      setRecoveryMessage("كلمتا المرور الجديدتان غير متطابقتين.");
      return;
    }

    setRecoveryMessage("");
    setIsRecoveryBusy(true);

    try {
      await completeAppwritePasswordRecovery(
        recoveryUserId,
        recoverySecret,
        recoveryPassword,
      );

      clearAppwriteRecoveryChallenge();
      setPassword("");
      setRecoveryPassword("");
      setRecoveryConfirmPassword("");
      setRecoveryUserId("");
      setRecoverySecret("");
      setIsRecoveryModalOpen(false);
      onChangeMode("login");
      setMessage("تم تحديث كلمة المرور. سجل دخولك الآن بكلمة المرور الجديدة.");
    } catch (error) {
      setRecoveryMessage(
        getAppwriteAuthErrorMessage(error, "فشل تحديث كلمة المرور."),
      );
    } finally {
      setIsRecoveryBusy(false);
    }
  };

  const clearApplePayConfirmTimeout = () => {
    if (applePayConfirmTimeoutRef.current) {
      clearTimeout(applePayConfirmTimeoutRef.current);
      applePayConfirmTimeoutRef.current = null;
    }
  };

  const triggerHaptic = async (type: "selection" | "impact" | "success") => {
    try {
      if (type === "selection") {
        await Haptics.selectionAsync();
        return;
      }

      if (type === "impact") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore unsupported haptic environments on web.
    }
  };

  const armApplePayConfirm = () => {
    clearApplePayConfirmTimeout();
    setApplePayConfirmState("armed");
    void triggerHaptic("selection");

    applePayConfirmTimeoutRef.current = setTimeout(() => {
      setApplePayConfirmState("idle");
      applePayConfirmTimeoutRef.current = null;
    }, 2600);
  };

  const closeVarPassStep = () => {
    if (varPassStepArmTimeoutRef.current) {
      clearTimeout(varPassStepArmTimeoutRef.current);
      varPassStepArmTimeoutRef.current = null;
    }

    clearApplePayConfirmTimeout();
    setApplePayConfirmState("idle");
    setIsVarPassStepArmed(false);
    setIsVarPassStepOpen(false);
  };

  const handleDigitalIdLogin = () => {
    if (isVarPassActionBusy) {
      return;
    }

    closeVarPassStep();
    setMessage("");
    setApplePayConfirmState("idle");
    setIsVarPassStepOpen(true);

    varPassStepArmTimeoutRef.current = setTimeout(() => {
      setIsVarPassStepArmed(true);
      varPassStepArmTimeoutRef.current = null;
    }, 220);
  };

  const handleConfirmApplePay = async () => {
    if (isVarPassActionBusy || !isVarPassStepArmed) {
      return;
    }

    if (applePayConfirmState !== "armed") {
      armApplePayConfirm();
      return;
    }

    clearApplePayConfirmTimeout();
    setApplePayConfirmState("processing");

    setMessage("");
    setIsVarPassActionBusy(true);

    try {
      const appwriteUserPromise = loginWithEnteredCredentials();

      await triggerHaptic("impact");

      if (Platform.OS === "ios") {
        const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          LocalAuthentication.supportedAuthenticationTypesAsync(),
        ]);
        const biometricLabel = getBiometricLabel(supportedTypes);

        if (!hasHardware || supportedTypes.length === 0) {
          closeVarPassStep();
          setMessage("Apple Pay يحتاج جهازًا يدعم التحقق الحيوي.");
          return;
        }

        if (!isEnrolled) {
          closeVarPassStep();
          setMessage(
            `فعّل ${biometricLabel} أو رمز الجهاز أولًا ثم أعد المحاولة.`,
          );
          return;
        }

        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: "Apple Pay",
          cancelLabel: "إلغاء",
          fallbackLabel: "استخدام رمز الجهاز",
        });

        if (!authResult.success) {
          const wasCancelled =
            authResult.error === "user_cancel" ||
            authResult.error === "system_cancel" ||
            authResult.error === "app_cancel";

          closeVarPassStep();
          setMessage(
            wasCancelled
              ? "تم إلغاء تأكيد Apple Pay."
              : `لم تكتمل المصادقة عبر ${biometricLabel}.`,
          );
          return;
        }

        closeVarPassStep();
        const user = await appwriteUserPromise;
        await triggerHaptic("success");
        onSuccess(user);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 950));
      closeVarPassStep();
      const user = await appwriteUserPromise;
      await triggerHaptic("success");
      onSuccess(user);
    } catch (error) {
      closeVarPassStep();
      setMessage(
        getAppwriteAuthErrorMessage(error, "فشل إكمال تأكيد Apple Pay."),
      );
    } finally {
      setApplePayConfirmState("idle");
      setIsVarPassActionBusy(false);
    }
  };

  return (
    <PullToRefreshScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.authScreenContent,
        isCompactAuthLayout ? styles.authScreenContentCompact : null,
      ]}
      refreshing={props.isRefreshing}
      onRefresh={props.onRefresh}
    >
      <ScanlineOverlay />

      {authMode === "login" ? (
        <View
          style={[
            styles.authSurface,
            isCompactAuthLayout ? styles.authSurfaceCompact : null,
          ]}
        >
          {showLoginIntro ? (
            <Animated.View
              style={[
                styles.loginIntroOverlay,
                { opacity: introOverlayOpacity },
              ]}
            >
              <View style={styles.loginIntroGlow} />

              <Animated.Text
                style={[
                  styles.loginSplashTitle,
                  {
                    opacity: introTitleOpacity,
                    transform: [{ translateY: introTitleTranslateY }],
                  },
                ]}
              >
                Welcome to VAR
              </Animated.Text>

              <Animated.Text
                style={[
                  styles.loginSplashSubtitle,
                  {
                    opacity: introSubtitleOpacity,
                    transform: [{ translateY: introSubtitleTranslateY }],
                  },
                ]}
              >
                Initializing login portal
              </Animated.Text>

              <View style={styles.loginProgressTrack}>
                <Animated.View
                  style={[
                    styles.loginProgressFill,
                    { width: introProgressWidth },
                  ]}
                />
              </View>
            </Animated.View>
          ) : null}

          <View style={styles.loginAudioRow}>
            <Pressable
              style={styles.audioButton}
              accessibilityRole="button"
              accessibilityLabel={audioOn ? "كتم صوت الدخول" : "تشغيل صوت الدخول"}
              onPress={() => {
                setAudioOn((value) => {
                  const nextValue = !value;

                  if (!nextValue) {
                    stopLoginSound();
                    loginSoundStartedRef.current = false;
                  } else if (authMode === "login") {
                    void playLoginSound();
                  }

                  return nextValue;
                });
              }}
            >
              <Ionicons
                name={audioOn ? "headset" : "headset-outline"}
                size={22}
                color={audioOn ? "#00FF6B" : "#5F7E69"}
              />
            </Pressable>
          </View>

          <View
            pointerEvents="none"
            style={styles.terminalLinesBlock}
          >
            <TerminalLine
              text="Route /auth/login initialized"
              startDelay={0}
            />
            <TerminalLine text="Neon gateway ready" startDelay={260} />
            <TerminalLine text="VAR PASS Apple Pay armed" startDelay={520} />
          </View>

          <View style={styles.loginFormBody}>
          <NeonField
            placeholder="Appwrite Email"
            value={email}
            onChangeText={(value) => setEmail(value.trim().toLowerCase())}
            keyboardType="email-address"
          />
          <NeonField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            icon={showPassword ? "eye-off-outline" : "eye-outline"}
            onIconPress={() => setShowPassword((value) => !value)}
          />

          <Pressable
            style={[
              styles.neonPrimaryButton,
              isAuthBusy ? styles.neonButtonDisabled : null,
            ]}
            onPress={handleEmailLogin}
            disabled={isAuthBusy}
          >
            <Text style={styles.neonPrimaryButtonText}>
              {isAuthBusy ? "Connecting..." : "Login"}
            </Text>
          </Pressable>

          <Pressable style={styles.neonGhostButton} onPress={handleGoogleLogin}>
            <View style={styles.googleAuthButtonRow}>
              <Ionicons
                name="logo-google"
                size={22}
                color="#00FF6B"
              />
              <Text style={styles.neonGhostButtonText}>with Google</Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.neonGhostButton,
              isVarPassActionBusy || isAuthBusy
                ? styles.neonGhostButtonDisabled
                : null,
            ]}
            onPress={handleDigitalIdLogin}
            disabled={isVarPassActionBusy || isAuthBusy}
          >
            <View style={styles.neonGhostButtonRow}>
              <Ionicons
                name={
                  isVarPassActionBusy ? "scan-circle-outline" : "logo-apple"
                }
                size={18}
                color="#00FF6B"
                style={styles.neonGhostButtonIcon}
              />
              <Text style={styles.neonGhostButtonText}>
                {isVarPassActionBusy ? "VAR PASS جاري الفتح..." : "VAR PASS"}
              </Text>
            </View>
          </Pressable>

          {message ? <Text style={styles.authMessage}>{message}</Text> : null}

          <View style={styles.authLinksRow}>
            <Pressable onPress={openPasswordRecovery}>
              <Text style={styles.authLinkText}>نسيت كلمة المرور</Text>
            </Pressable>
            <Pressable onPress={() => onChangeMode("signup")}>
              <Text style={styles.authLinkText}>حساب جديد</Text>
            </Pressable>
          </View>
          </View>

          <Modal
            visible={isVarPassStepOpen}
            transparent
            animationType="slide"
            onRequestClose={closeVarPassStep}
          >
            <View style={styles.varPassStepOverlay}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.varPassStepOverlayContent}
              >
                <View style={styles.varPassStepPanel}>
                  <View style={styles.applePaySheetGrabber} />

                  <View style={styles.varPassStepHeader}>
                    <Pressable
                      style={styles.applePayCancelButton}
                      onPress={closeVarPassStep}
                    >
                      <Text style={styles.applePayCancelButtonText}>إلغاء</Text>
                    </Pressable>

                    <View style={styles.varPassStepHeaderCopy}>
                      <View style={styles.applePayBrandRow}>
                        <Ionicons name="logo-apple" size={18} color="#0C0C0D" />
                        <Text style={styles.applePayBrandText}>Pay</Text>
                      </View>
                      <Text style={styles.varPassStepTitle}>
                        تأكيد الدخول إلى WEBPLUS
                      </Text>
                      <Text style={styles.applePaySheetSubtitle}>
                        نافذة دخول سريعة تحاكي Apple Pay قبل فتح حسابك.
                      </Text>

                      <View style={styles.applePayStatusPill}>
                        <View
                          style={[
                            styles.applePayStatusDot,
                            applePayConfirmState === "processing"
                              ? styles.applePayStatusDotBusy
                              : applePayConfirmState === "armed"
                                ? styles.applePayStatusDotArmed
                                : null,
                          ]}
                        />
                        <Text style={styles.applePayStatusText}>
                          {applePayStatusLabel}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.applePayAmountCard}>
                    <Text style={styles.applePayAmountLabel}>WEBPLUS</Text>
                    <Text style={styles.applePayAmountValue}>SAR 0.00</Text>
                    <Text style={styles.applePayAmountMeta}>
                      تفويض دخول آمن إلى الحساب
                    </Text>
                  </View>

                  <View style={styles.applePaySummaryCard}>
                    <View style={styles.applePaySummaryRow}>
                      <Text style={styles.applePaySummaryValue}>WEBPLUS</Text>
                      <Text style={styles.applePaySummaryLabel}>التاجر</Text>
                    </View>
                    <View style={styles.applePaySummaryDivider} />
                    <View style={styles.applePaySummaryRow}>
                      <Text style={styles.applePaySummaryValue}>VAR PASS</Text>
                      <Text style={styles.applePaySummaryLabel}>المحفظة</Text>
                    </View>
                    <View style={styles.applePaySummaryDivider} />
                    <View style={styles.applePaySummaryRow}>
                      <Text style={styles.applePaySummaryValue}>
                        {applePayAccountLabel}
                      </Text>
                      <Text style={styles.applePaySummaryLabel}>الحساب</Text>
                    </View>
                  </View>

                  <View style={styles.applePayMethodRow}>
                    <View style={styles.applePayMethodBrandPill}>
                      <Text style={styles.applePayMethodBrandText}>VISA</Text>
                    </View>

                    <View style={styles.applePayMethodCopy}>
                      <Text style={styles.applePayMethodTitle}>
                        البطاقة الافتراضية
                      </Text>
                      <Text style={styles.applePayMethodSubtitle}>
                        •••• 4242
                      </Text>
                    </View>

                    <Ionicons name="chevron-back" size={16} color="#7C7C80" />
                  </View>

                  <View style={styles.applePayFaceIdRow}>
                    <View style={styles.applePayFaceIdVisual}>
                      <Animated.View
                        {...getNativePointerEventsProps("none")}
                        style={[
                          styles.applePayFaceIdPulseRing,
                          {
                            opacity: applePayPulseOpacity,
                            transform: [{ scale: applePayPulseScale }],
                          },
                          getWebPointerEventsStyle("none"),
                        ]}
                      />
                      <Animated.View
                        {...getNativePointerEventsProps("none")}
                        style={[
                          styles.applePayFaceIdPulseRingSecondary,
                          {
                            opacity: applePayPulseOpacitySecondary,
                            transform: [{ scale: applePayPulseScaleSecondary }],
                          },
                          getWebPointerEventsStyle("none"),
                        ]}
                      />

                      <View style={styles.applePayFaceIdIconWrap}>
                        <Ionicons
                          name={
                            Platform.OS === "ios"
                              ? "scan-circle-outline"
                              : "globe-outline"
                          }
                          size={22}
                          color="#111111"
                        />
                      </View>
                    </View>

                    <View style={styles.applePayFaceIdCopy}>
                      <Text style={styles.applePayFaceIdTitle}>
                        {Platform.OS === "ios"
                          ? "Face ID"
                          : "Apple Pay Preview"}
                      </Text>
                      <Text style={styles.applePayFaceIdSubtitle}>
                        {Platform.OS === "ios"
                          ? "بعد التأكيد سيظهر التحقق الحيوي لإكمال الدخول."
                          : "في الويب سيتم تنفيذ معاينة مرئية لنفس التدفق."}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.varPassStepNote}>
                    {applePayBiometricHint}
                  </Text>

                  <View style={styles.applePayGuidanceCard}>
                    <Ionicons
                      name={
                        applePayConfirmState === "processing"
                          ? "scan-circle-outline"
                          : applePayConfirmState === "armed"
                            ? "checkmark-circle-outline"
                            : "phone-portrait-outline"
                      }
                      size={20}
                      color="#111111"
                    />

                    <View style={styles.applePayGuidanceCopy}>
                      <Text style={styles.applePayGuidanceTitle}>
                        {applePayGuidanceTitle}
                      </Text>
                      <Text style={styles.applePayGuidanceSubtitle}>
                        {applePayGuidanceSubtitle}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={[
                      styles.varPassStepPrimaryButton,
                      isVarPassActionBusy || !isVarPassStepArmed
                        ? styles.applePayPrimaryButtonDisabled
                        : null,
                    ]}
                    onPress={handleConfirmApplePay}
                    disabled={isVarPassActionBusy || !isVarPassStepArmed}
                  >
                    <View style={styles.applePayPrimaryButtonContent}>
                      <Ionicons
                        name={
                          Platform.OS === "ios"
                            ? "logo-apple"
                            : "wallet-outline"
                        }
                        size={20}
                        color="#FFFFFF"
                      />

                      <View style={styles.applePayPrimaryButtonCopy}>
                        <Text style={styles.varPassStepPrimaryButtonText}>
                          {applePayPrimaryLabel}
                        </Text>
                        <Text style={styles.applePayPrimaryButtonSubtext}>
                          {applePayPrimarySubtext}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </Modal>
        </View>
      ) : (
        <View
          style={[
            styles.authSurface,
            isCompactAuthLayout ? styles.authSurfaceCompact : null,
          ]}
        >
          <View style={styles.signupStatusBar}>
            <View style={styles.signupStatusDot} />
            <Text style={styles.signupStatusText}>
              SECURE CONNECTION ACTIVE
            </Text>
          </View>

          <View style={styles.signupHeader}>
            <Text style={styles.signupHeaderTitle}>[ REGISTER ]</Text>
            <View style={styles.signupHeaderSubRow}>
              <View style={styles.signupCursor} />
              <Text style={styles.signupHeaderSubtitle}>
                إنشاء هوية جديدة... النظام جاهز للتسجيل
              </Text>
            </View>
          </View>

          <NeonField
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <NeonField
            placeholder="Username"
            value={username}
            onChangeText={(value) =>
              setUsername(normalizeSignupUsername(value))
            }
            autoCapitalize="none"
            maxLength={20}
          />
          <NeonField
            placeholder="Email"
            value={email}
            onChangeText={(value) => setEmail(value.trim().toLowerCase())}
            keyboardType="email-address"
          />
          <NeonField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            icon={showPassword ? "eye-off-outline" : "eye-outline"}
            onIconPress={() => setShowPassword((value) => !value)}
          />
          <NeonField
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            icon={showConfirm ? "eye-off-outline" : "eye-outline"}
            onIconPress={() => setShowConfirm((value) => !value)}
          />

          <Text style={styles.signupHintText}>
            التسجيل هنا بالإيميل وكلمة المرور، أو عبر Google عند ربطه. وإذا كان
            هذا أول حساب إداري لك فاستخدم اسم المستخدم var.
          </Text>

          {normalizedAdminCandidate === VAR_ADMIN_USERNAME ? (
            <Text style={styles.adminBootstrapHintText}>
              هذا الحساب سيُعامل كحساب VAR الإداري داخل التطبيق.
            </Text>
          ) : null}

          <Pressable
            style={[
              styles.neonPrimaryButton,
              isAuthBusy ? styles.neonButtonDisabled : null,
            ]}
            onPress={handleSignup}
            disabled={isAuthBusy}
          >
            <Text style={styles.neonPrimaryButtonText}>
              {isAuthBusy ? "Creating..." : "Create Account"}
            </Text>
          </Pressable>

          <Pressable style={styles.neonGhostButton} onPress={handleGoogleLogin}>
            <View style={styles.googleAuthButtonRow}>
              <Ionicons
                name="logo-google"
                size={22}
                color="#00FF6B"
              />
              <Text style={styles.neonGhostButtonText}>with Google</Text>
            </View>
          </Pressable>

          {message ? <Text style={styles.authMessage}>{message}</Text> : null}

          <View style={styles.authLinksRowSingle}>
            <Pressable onPress={() => onChangeMode("login")}>
              <Text style={styles.authLinkText}>عندي حساب بالفعل</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Modal
        visible={isRecoveryModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closePasswordRecovery}
      >
        <View style={styles.recoveryOverlay}>
          <View style={styles.recoveryPanel}>
            <Text style={styles.recoveryEyebrow}>
              {recoveryView === "reset"
                ? "[ RESET PASSWORD ]"
                : "[ PASSWORD RECOVERY ]"}
            </Text>
            <Text style={styles.recoveryTitle}>
              {recoveryView === "reset"
                ? "تعيين كلمة مرور جديدة"
                : "استعادة كلمة المرور"}
            </Text>
            <Text style={styles.recoverySubtitle}>
              {recoveryView === "reset"
                ? "أدخل كلمة مرور جديدة ثم أكمل الاستعادة من نفس هذا الرابط."
                : "أدخل بريد حسابك وسنرسل لك رابط استعادة صالحًا لمدة ساعة."}
            </Text>

            {recoveryView === "reset" ? (
              <>
                {recoveryEmail ? (
                  <Text style={styles.recoveryTargetText}>{recoveryEmail}</Text>
                ) : null}

                <NeonField
                  placeholder="New Password"
                  value={recoveryPassword}
                  onChangeText={setRecoveryPassword}
                  secureTextEntry={!showRecoveryPassword}
                  icon={
                    showRecoveryPassword ? "eye-off-outline" : "eye-outline"
                  }
                  onIconPress={() => setShowRecoveryPassword((value) => !value)}
                />
                <NeonField
                  placeholder="Confirm New Password"
                  value={recoveryConfirmPassword}
                  onChangeText={setRecoveryConfirmPassword}
                  secureTextEntry={!showRecoveryConfirm}
                  icon={showRecoveryConfirm ? "eye-off-outline" : "eye-outline"}
                  onIconPress={() => setShowRecoveryConfirm((value) => !value)}
                />

                <Text style={styles.recoveryMetaText}>
                  استخدم كلمة مرور قوية تحتوي على حرف ورقم على الأقل.
                </Text>

                <Pressable
                  style={[
                    styles.neonPrimaryButton,
                    isRecoveryBusy ? styles.neonButtonDisabled : null,
                  ]}
                  onPress={handleCompleteRecovery}
                  disabled={isRecoveryBusy}
                >
                  <Text style={styles.neonPrimaryButtonText}>
                    {isRecoveryBusy ? "Updating..." : "Update Password"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <NeonField
                  placeholder="Email"
                  value={recoveryEmail}
                  onChangeText={(value) =>
                    setRecoveryEmail(value.trim().toLowerCase())
                  }
                  keyboardType="email-address"
                />

                <Text style={styles.recoveryMetaText}>
                  سيصلك رابط إلى نفس واجهة التطبيق حتى تكمل تغيير كلمة المرور.
                </Text>

                <Pressable
                  style={[
                    styles.neonPrimaryButton,
                    isRecoveryBusy ? styles.neonButtonDisabled : null,
                  ]}
                  onPress={handleSendRecoveryLink}
                  disabled={isRecoveryBusy}
                >
                  <Text style={styles.neonPrimaryButtonText}>
                    {isRecoveryBusy ? "Sending..." : "Send Recovery Link"}
                  </Text>
                </Pressable>
              </>
            )}

            {recoveryMessage ? (
              <Text style={styles.recoveryMessage}>{recoveryMessage}</Text>
            ) : null}

            <Pressable
              style={styles.neonGhostButton}
              onPress={closePasswordRecovery}
              disabled={isRecoveryBusy}
            >
              <Text style={styles.neonGhostButtonText}>إغلاق</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </PullToRefreshScrollView>
  );
}

function NeonField(props: {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  icon?: IconName;
  onIconPress?: () => void;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  maxLength?: number;
}) {
  return (
    <View style={styles.neonFieldWrap}>
      {props.icon ? (
        <Pressable
          style={styles.neonFieldIconButton}
          onPress={props.onIconPress}
        >
          <Ionicons name={props.icon} size={18} color="#00FF6B" />
        </Pressable>
      ) : null}
      <TextInput
        placeholder={props.placeholder}
        placeholderTextColor="rgba(0,255,107,0.5)"
        style={styles.neonFieldInput}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize={props.autoCapitalize ?? "none"}
        autoCorrect={false}
        keyboardType={props.keyboardType}
        maxLength={props.maxLength}
        value={props.value}
        onChangeText={props.onChangeText}
      />
    </View>
  );
}

function TerminalLine(props: { text: string; startDelay?: number }) {
  const [visibleText, setVisibleText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    setVisibleText("");
    setCursorVisible(true);

    const typingStep = 34;
    const holdDuration = 900;
    const clearDuration = 220;
    const typingDuration = props.text.length * typingStep;
    const cycleDuration = typingDuration + holdDuration + clearDuration;
    const startAt = Date.now() + (props.startDelay ?? 0);

    const blinkInterval = setInterval(() => {
      setCursorVisible((current) => !current);
    }, 380);

    const syncVisibleText = () => {
      const elapsed = Date.now() - startAt;

      if (elapsed < 0) {
        setVisibleText("");
        return;
      }

      const cycleElapsed = elapsed % cycleDuration;

      if (cycleElapsed < typingDuration) {
        const characterCount = Math.min(
          props.text.length,
          Math.floor(cycleElapsed / typingStep) + 1,
        );
        setVisibleText(props.text.slice(0, characterCount));
        return;
      }

      if (cycleElapsed < typingDuration + holdDuration) {
        setVisibleText(props.text);
        return;
      }

      setVisibleText("");
    };

    syncVisibleText();
    const typingLoopInterval = setInterval(syncVisibleText, 48);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(typingLoopInterval);
    };
  }, [props.startDelay, props.text]);

  return (
    <View style={styles.terminalLine}>
      <View
        style={[
          styles.terminalCursor,
          !cursorVisible ? styles.terminalCursorHidden : null,
        ]}
      />
      <Text style={styles.terminalLineText}>{visibleText}</Text>
    </View>
  );
}

function ScanlineOverlay() {
  return (
    <View
      {...getNativePointerEventsProps("none")}
      style={[styles.scanlineOverlay, getWebPointerEventsStyle("none")]}
    >
      {Array.from({ length: 22 }).map((_, index) => (
        <View key={index} style={[styles.scanline, { top: index * 28 }]} />
      ))}
    </View>
  );
}

const styles = createCompatStyleSheet({
  authScreenContent: {
    minHeight: "100%",
    paddingHorizontal: 20,
    paddingTop: 82,
    paddingBottom: 130,
    justifyContent: "center",
  },
  authScreenContentCompact: {
    paddingTop: 56,
    paddingBottom: 220,
    justifyContent: "flex-start",
  },
  authSurface: {
    position: "relative",
    minHeight: 580,
    backgroundColor: "rgba(0,0,0,0.88)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(0,255,107,0.18)",
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  authSurfaceCompact: {
    minHeight: 0,
    paddingBottom: 34,
  },
  loginIntroOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.96)",
    zIndex: 2,
  },
  varPassStepOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
    zIndex: 3,
    paddingTop: 56,
  },
  varPassStepOverlayContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  varPassStepPanel: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "#F5F5F7",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  applePaySheetGrabber: {
    width: 42,
    height: 5,
    borderRadius: 999,
    alignSelf: "center",
    backgroundColor: "rgba(17,17,17,0.16)",
    marginBottom: 18,
  },
  varPassStepHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  applePayCancelButton: {
    minWidth: 48,
    paddingTop: 2,
  },
  applePayCancelButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  varPassStepCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  varPassStepHeaderCopy: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 16,
  },
  applePayBrandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  applePayBrandText: {
    color: "#0C0C0D",
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 4,
    fontFamily: MONO_FONT,
  },
  varPassStepEyebrow: {
    color: "rgba(0,255,107,0.7)",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: MONO_FONT,
  },
  varPassStepTitle: {
    color: "#111111",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "right",
  },
  applePaySheetSubtitle: {
    color: "#636366",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "right",
  },
  applePayStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    borderRadius: 999,
    backgroundColor: "rgba(17,17,17,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 12,
  },
  applePayStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#2FB344",
  },
  applePayStatusDotArmed: {
    backgroundColor: "#F59F00",
  },
  applePayStatusDotBusy: {
    backgroundColor: "#007AFF",
  },
  applePayStatusText: {
    color: "#111111",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: MONO_FONT,
    marginLeft: 8,
  },
  applePayAmountCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.06)",
    backgroundColor: "#FFFFFF",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 6,
  },
  applePayAmountLabel: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "700",
  },
  applePayAmountValue: {
    color: "#111111",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
  },
  applePayAmountMeta: {
    color: "#636366",
    fontSize: 13,
    marginTop: 6,
  },
  applePaySummaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.06)",
    backgroundColor: "rgba(255,255,255,0.78)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  applePaySummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  applePaySummaryLabel: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "700",
  },
  applePaySummaryValue: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },
  applePaySummaryDivider: {
    height: 1,
    backgroundColor: "rgba(17,17,17,0.08)",
    marginVertical: 10,
  },
  applePayMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.06)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 14,
  },
  applePayMethodBrandPill: {
    minWidth: 58,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
  },
  applePayMethodBrandText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    fontFamily: MONO_FONT,
  },
  applePayMethodCopy: {
    flex: 1,
    alignItems: "flex-end",
    marginHorizontal: 12,
  },
  applePayMethodTitle: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
  },
  applePayMethodSubtitle: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  applePayFaceIdRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(17,17,17,0.05)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 14,
  },
  applePayFaceIdVisual: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  applePayFaceIdPulseRing: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: "rgba(17,17,17,0.18)",
  },
  applePayFaceIdPulseRingSecondary: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.10)",
  },
  applePayFaceIdIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  applePayFaceIdCopy: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 12,
  },
  applePayFaceIdTitle: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  applePayFaceIdSubtitle: {
    color: "#636366",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    textAlign: "right",
  },
  varPassStepNote: {
    color: "#636366",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
    marginTop: 14,
  },
  applePayGuidanceCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 18,
    backgroundColor: "rgba(17,17,17,0.05)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  applePayGuidanceCopy: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 12,
  },
  applePayGuidanceTitle: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
  },
  applePayGuidanceSubtitle: {
    color: "#636366",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    textAlign: "right",
  },
  varPassStepPrimaryButton: {
    minHeight: 64,
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#111111",
    marginTop: 18,
    paddingHorizontal: 16,
  },
  applePayPrimaryButtonDisabled: {
    opacity: 0.62,
  },
  applePayPrimaryButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  applePayPrimaryButtonCopy: {
    alignItems: "flex-start",
    marginLeft: 12,
  },
  varPassStepPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    fontFamily: MONO_FONT,
  },
  applePayPrimaryButtonSubtext: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    marginTop: 2,
    fontFamily: MONO_FONT,
  },
  varPassStepSecondaryButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    marginTop: 10,
  },
  varPassStepSecondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: MONO_FONT,
  },
  recoveryOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  recoveryPanel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,255,107,0.22)",
    backgroundColor: "rgba(0,0,0,0.94)",
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  recoveryEyebrow: {
    color: "rgba(0,255,107,0.78)",
    fontSize: 12,
    fontWeight: "800",
    fontFamily: MONO_FONT,
    textAlign: "center",
  },
  recoveryTitle: {
    color: "#00FF6B",
    fontSize: 24,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    textAlign: "center",
    marginTop: 12,
  },
  recoverySubtitle: {
    color: "rgba(0,255,107,0.74)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: MONO_FONT,
    marginTop: 10,
    marginBottom: 16,
  },
  recoveryTargetText: {
    color: "#F4C565",
    fontSize: 13,
    textAlign: "center",
    fontFamily: MONO_FONT,
    marginBottom: 12,
  },
  recoveryMetaText: {
    color: "rgba(0,255,107,0.62)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    fontFamily: MONO_FONT,
    marginTop: 10,
  },
  recoveryMessage: {
    color: "#00FF6B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    fontFamily: MONO_FONT,
    marginTop: 14,
  },
  loginIntroGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(0,255,107,0.08)",
  },
  scanlineOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scanline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,255,107,0.06)",
  },
  loginAudioRow: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 4,
  },
  audioButton: {
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  loginSplashTitle: {
    color: "#00FF6B",
    fontSize: 34,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    textAlign: "center",
    textShadowColor: "rgba(0,255,107,0.72)",
    textShadowRadius: 12,
  },
  loginSplashSubtitle: {
    color: "rgba(0,255,107,0.82)",
    fontSize: 16,
    fontFamily: MONO_FONT,
    marginTop: 8,
    textAlign: "center",
  },
  loginProgressTrack: {
    width: 240,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,255,107,0.16)",
    overflow: "hidden",
    marginTop: 14,
  },
  loginProgressFill: {
    width: 0,
    height: "100%",
    backgroundColor: "#00FF6B",
  },
  terminalLinesBlock: {
    position: "absolute",
    top: 54,
    left: 20,
    right: 20,
    minHeight: 96,
    zIndex: 1,
  },
  loginFormBody: {
    paddingTop: 204,
  },
  terminalLine: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 32,
  },
  terminalCursor: {
    width: 10,
    height: 18,
    backgroundColor: "#00FF6B",
    marginLeft: 8,
  },
  terminalCursorHidden: {
    opacity: 0.2,
  },
  terminalLineText: {
    color: "#00FF6B",
    fontSize: 18,
    fontFamily: MONO_FONT,
  },
  neonFieldWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,107,0.78)",
    backgroundColor: "rgba(0,0,0,0.5)",
    marginBottom: 10,
  },
  neonFieldIconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  neonFieldInput: {
    flex: 1,
    height: 42,
    color: "#00FF6B",
    textAlign: "right",
    fontSize: 16,
    fontFamily: MONO_FONT,
    paddingHorizontal: 12,
  },
  neonPrimaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,107,0.92)",
    backgroundColor: "rgba(0,255,107,0.12)",
    marginTop: 14,
  },
  neonButtonDisabled: {
    opacity: 0.6,
  },
  neonPrimaryButtonText: {
    color: "#00FF6B",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: MONO_FONT,
  },
  neonGhostButton: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,107,0.84)",
    marginTop: 16,
  },
  neonGhostButtonDisabled: {
    opacity: 0.7,
  },
  neonGhostButtonRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
  },
  googleAuthButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    direction: "ltr",
  },
  neonGhostButtonIcon: {
    marginLeft: 8,
  },
  neonGhostButtonText: {
    color: "#00FF6B",
    fontSize: 18,
    fontFamily: MONO_FONT,
  },
  signupHintText: {
    color: "rgba(0,255,107,0.72)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: MONO_FONT,
    marginTop: 12,
  },
  adminBootstrapHintText: {
    color: "#F4C565",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: MONO_FONT,
    marginTop: 8,
  },
  authMessage: {
    color: "#00FF6B",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: MONO_FONT,
    marginTop: 14,
  },
  authLinksRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    marginTop: 16,
  },
  authLinksRowSingle: {
    alignItems: "center",
    marginTop: 16,
  },
  authLinkText: {
    color: "#00FF6B",
    fontSize: 16,
    fontFamily: MONO_FONT,
    marginHorizontal: 12,
  },
  signupStatusBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  signupStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#00FF6B",
    marginLeft: 8,
  },
  signupStatusText: {
    color: "rgba(0,255,107,0.68)",
    fontSize: 13,
    fontFamily: MONO_FONT,
    letterSpacing: 1.5,
  },
  signupHeader: {
    alignItems: "center",
    marginTop: 64,
    marginBottom: 28,
  },
  signupHeaderTitle: {
    color: "#00FF6B",
    fontSize: 30,
    fontWeight: "900",
    fontFamily: MONO_FONT,
    textShadowColor: "rgba(0,255,107,0.72)",
    textShadowRadius: 8,
  },
  signupHeaderSubRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 10,
  },
  signupCursor: {
    width: 9,
    height: 18,
    backgroundColor: "#00FF6B",
    marginLeft: 6,
  },
  signupHeaderSubtitle: {
    color: "rgba(0,255,107,0.82)",
    fontSize: 16,
    fontFamily: MONO_FONT,
  },
});
