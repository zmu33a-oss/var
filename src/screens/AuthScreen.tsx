import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import {
  Animated,
  Easing,
  type GestureResponderEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { AuthMode, IconName } from "../app.types";

const MONO_FONT = Platform.OS === "ios" ? "Courier" : "monospace";

type ApplePayConfirmState = "idle" | "armed" | "processing";

type AuthScreenProps = {
  authMode: AuthMode;
  onChangeMode: (mode: AuthMode) => void;
  onSuccess: () => void;
};

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
  const { authMode, onChangeMode, onSuccess } = props;
  const [audioOn, setAudioOn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [isVarPassActionBusy, setIsVarPassActionBusy] = useState(false);
  const [isVarPassStepOpen, setIsVarPassStepOpen] = useState(false);
  const [isVarPassStepArmed, setIsVarPassStepArmed] = useState(false);
  const [applePayConfirmState, setApplePayConfirmState] =
    useState<ApplePayConfirmState>("idle");
  const [showLoginIntro, setShowLoginIntro] = useState(authMode === "login");
  const loginIntroPlayed = useRef(false);
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

  useEffect(() => {
    return () => {
      if (varPassStepArmTimeoutRef.current) {
        clearTimeout(varPassStepArmTimeoutRef.current);
      }

      if (applePayConfirmTimeoutRef.current) {
        clearTimeout(applePayConfirmTimeoutRef.current);
      }
    };
  }, []);

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

  const handleGoogleLogin = (_event: GestureResponderEvent) => {
    setMessage("تم تجهيز تسجيل Google بصريًا داخل نسخة Expo.");
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
        await triggerHaptic("success");
        setMessage(`تم تأكيد Apple Pay عبر ${biometricLabel}.`);
        onSuccess();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 950));
      closeVarPassStep();
      await triggerHaptic("success");
      setMessage("تمت محاكاة Apple Pay داخل الويب، وتم تسجيل الدخول.");
      onSuccess();
    } catch {
      closeVarPassStep();
      setMessage("تعذر إكمال تأكيد Apple Pay الآن.");
    } finally {
      setApplePayConfirmState("idle");
      setIsVarPassActionBusy(false);
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.authScreenContent}
    >
      <ScanlineOverlay />

      {authMode === "login" ? (
        <View style={styles.authSurface}>
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
              onPress={() => setAudioOn((value) => !value)}
            >
              <Ionicons
                name={audioOn ? "headset" : "headset-outline"}
                size={18}
                color={audioOn ? "#00FF6B" : "#5F7E69"}
              />
            </Pressable>
          </View>

          <View style={styles.terminalLinesBlock}>
            {!showLoginIntro ? (
              <>
                <TerminalLine
                  text="Route /auth/login initialized"
                  startDelay={0}
                />
                <TerminalLine text="Neon gateway ready" startDelay={260} />
                <TerminalLine
                  text="VAR PASS Apple Pay armed"
                  startDelay={520}
                />
              </>
            ) : null}
          </View>

          <View style={styles.authDivider}>
            <View style={styles.authDividerLine} />
            <Text style={styles.authDividerText}>أو أكمل يدويًا</Text>
            <View style={styles.authDividerLine} />
          </View>

          <NeonField
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
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
            style={styles.neonPrimaryButton}
            onPress={() => {
              setMessage("تمت المصادقة محليًا داخل نسخة Expo.");
              onSuccess();
            }}
          >
            <Text style={styles.neonPrimaryButtonText}>Login</Text>
          </Pressable>

          <Pressable style={styles.neonGhostButton} onPress={handleGoogleLogin}>
            <View style={styles.neonGhostButtonRow}>
              <Ionicons
                name="logo-google"
                size={18}
                color="#00FF6B"
                style={styles.neonGhostButtonIcon}
              />
              <Text style={styles.neonGhostButtonText}>G with Google</Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.neonGhostButton,
              isVarPassActionBusy ? styles.neonGhostButtonDisabled : null,
            ]}
            onPress={handleDigitalIdLogin}
            disabled={isVarPassActionBusy}
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
            <Pressable
              onPress={() =>
                setMessage("تم تجهيز مسار استعادة محلي بشكل بصري فقط.")
              }
            >
              <Text style={styles.authLinkText}>نسيت كلمة المرور</Text>
            </Pressable>
            <Pressable onPress={() => onChangeMode("signup")}>
              <Text style={styles.authLinkText}>حساب جديد</Text>
            </Pressable>
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
                        pointerEvents="none"
                        style={[
                          styles.applePayFaceIdPulseRing,
                          {
                            opacity: applePayPulseOpacity,
                            transform: [{ scale: applePayPulseScale }],
                          },
                        ]}
                      />
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.applePayFaceIdPulseRingSecondary,
                          {
                            opacity: applePayPulseOpacitySecondary,
                            transform: [{ scale: applePayPulseScaleSecondary }],
                          },
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
        <View style={styles.authSurface}>
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
          />
          <NeonField
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
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

          <Pressable
            style={styles.neonPrimaryButton}
            onPress={() => {
              if (!fullName.trim() || !email.trim() || !password.trim()) {
                setMessage("أكمل البيانات أولاً.");
                return;
              }

              if (password !== confirmPassword) {
                setMessage("كلمتا المرور غير متطابقتين.");
                return;
              }

              setMessage("تم إنشاء الحساب محليًا داخل نسخة Expo.");
              onSuccess();
            }}
          >
            <Text style={styles.neonPrimaryButtonText}>Create Account</Text>
          </Pressable>

          <Pressable style={styles.neonGhostButton}>
            <Text style={styles.neonGhostButtonText}>G with Google</Text>
          </Pressable>

          {message ? <Text style={styles.authMessage}>{message}</Text> : null}

          <View style={styles.authLinksRowSingle}>
            <Pressable onPress={() => onChangeMode("login")}>
              <Text style={styles.authLinkText}>عندي حساب بالفعل</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function NeonField(props: {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  icon?: IconName;
  onIconPress?: () => void;
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
        autoCapitalize="none"
        autoCorrect={false}
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
    <View pointerEvents="none" style={styles.scanlineOverlay}>
      {Array.from({ length: 22 }).map((_, index) => (
        <View key={index} style={[styles.scanline, { top: index * 28 }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  authScreenContent: {
    minHeight: "100%",
    paddingHorizontal: 20,
    paddingTop: 82,
    paddingBottom: 130,
    justifyContent: "center",
  },
  authSurface: {
    minHeight: 640,
    backgroundColor: "rgba(0,0,0,0.88)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(0,255,107,0.18)",
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 24,
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
    alignItems: "flex-start",
  },
  audioButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0,255,107,0.54)",
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
    marginTop: 28,
    marginBottom: 26,
    minHeight: 96,
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
  authDivider: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 14,
  },
  authDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  authDividerText: {
    color: "rgba(255,255,255,0.46)",
    fontSize: 11,
    fontWeight: "700",
    marginHorizontal: 12,
    letterSpacing: 0.6,
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
    marginTop: 10,
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
    marginTop: 10,
  },
  neonGhostButtonDisabled: {
    opacity: 0.7,
  },
  neonGhostButtonRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
  },
  neonGhostButtonIcon: {
    marginLeft: 8,
  },
  neonGhostButtonText: {
    color: "#00FF6B",
    fontSize: 18,
    fontFamily: MONO_FONT,
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
