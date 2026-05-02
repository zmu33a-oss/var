import SwiftUI

struct LoginSwiftView: View {
    let isRecovery: Bool
    let onSuccess: () -> Void
    let onRecoveryDone: () -> Void
    let onGoToSignup: () -> Void

    @StateObject private var viewModel = LoginSwiftViewModel()

    private let neonGreen = Color(red: 0, green: 1, blue: 0.16)

    var body: some View {
        ZStack(alignment: .topLeading) {
            Color.black
                .ignoresSafeArea()

            if isRecovery {
                recoveryView
            } else if viewModel.splash {
                splashView
            } else {
                loginView
            }
        }
        .preferredColorScheme(.dark)
        .environment(\.layoutDirection, .rightToLeft)
        .onAppear {
            viewModel.start()
        }
        .onDisappear {
            viewModel.stop()
        }
    }

    private var splashView: some View {
        VStack(spacing: 12) {
            Text("Welcome to Xtik")
                .font(.system(size: 34, weight: .bold, design: .monospaced))
                .foregroundStyle(neonGreen)
                .shadow(color: neonGreen.opacity(0.75), radius: 8)

            Text("Loading")
                .font(.system(size: 18, weight: .medium, design: .monospaced))
                .foregroundStyle(neonGreen.opacity(0.82))

            ZStack(alignment: .leading) {
                Capsule()
                    .fill(neonGreen.opacity(0.18))
                    .frame(width: 240, height: 4)

                Capsule()
                    .fill(neonGreen)
                    .frame(width: 240 * viewModel.splashProgress, height: 4)
                    .shadow(color: neonGreen.opacity(0.75), radius: 8)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var recoveryView: some View {
        ZStack {
            Color.black.opacity(0.42)
                .ignoresSafeArea()

            VStack(spacing: 12) {
                loginMessageView

                Text("أدخل كلمة مرور جديدة لحسابك")
                    .font(.system(size: 15, weight: .medium, design: .monospaced))
                    .foregroundStyle(neonGreen)
                    .frame(maxWidth: .infinity, alignment: .trailing)

                passwordField(
                    placeholder: "كلمة المرور الجديدة",
                    text: $viewModel.newPassword,
                    showPassword: $viewModel.showPassword
                )

                SecureField("تأكيد كلمة المرور", text: $viewModel.confirmPassword)
                    .submitLabel(.done)
                    .onSubmit {
                        viewModel.submitPasswordReset(onRecoveryDone: onRecoveryDone)
                    }
                    .loginNeonField(color: neonGreen)

                Button {
                    viewModel.submitPasswordReset(onRecoveryDone: onRecoveryDone)
                } label: {
                    Text(viewModel.isLoading ? "...جاري التحديث" : "تحديث كلمة المرور")
                        .loginPrimaryButtonLabel()
                }
                .buttonStyle(.plain)
                .disabled(viewModel.isLoading)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 18)
            .frame(maxWidth: 320)
        }
    }

    private var loginView: some View {
        ZStack(alignment: .topLeading) {
            Color.black.opacity(0.42)
                .ignoresSafeArea()

            Button {
                viewModel.toggleAudio()
            } label: {
                Image(systemName: viewModel.audioOn ? "headphones" : "headphones.circle")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(viewModel.audioOn ? neonGreen : Color.gray)
                    .frame(width: 36, height: 36)
                    .overlay(
                        Circle()
                            .stroke(viewModel.audioOn ? neonGreen : Color.gray.opacity(0.8), lineWidth: 1.5)
                    )
                    .shadow(color: viewModel.audioOn ? neonGreen.opacity(0.45) : .clear, radius: 8)
            }
            .buttonStyle(.plain)
            .padding(.top, 18)
            .padding(.leading, 18)
            .accessibilityLabel(viewModel.audioOn ? "إيقاف الصوت" : "تشغيل الصوت")

            VStack(spacing: 0) {
                VStack(spacing: 6) {
                    ForEach(Array(viewModel.displayedLines.enumerated()), id: \.offset) { index, line in
                        HStack(spacing: 6) {
                            if viewModel.currentLineIndex == index && !viewModel.isResetting {
                                Rectangle()
                                    .fill(neonGreen)
                                    .frame(width: 10, height: 22)
                                    .opacity(viewModel.cursorVisible ? 1 : 0)
                            }

                            Text(line)
                                .font(.system(size: 20, weight: .medium, design: .monospaced))
                                .foregroundStyle(neonGreen)
                                .shadow(color: neonGreen.opacity(0.5), radius: 6)
                                .frame(maxWidth: .infinity, alignment: .trailing)
                        }
                        .frame(minHeight: 34)
                    }
                }
                .padding(.top, 70)
                .padding(.bottom, 48)
                .frame(maxWidth: .infinity)

                VStack(spacing: 10) {
                    TextField("Email", text: $viewModel.email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled(true)
                        .loginNeonField(color: neonGreen)

                    passwordField(
                        placeholder: "Password",
                        text: $viewModel.password,
                        showPassword: $viewModel.showPassword
                    )

                    Button {
                        viewModel.submitLogin(onSuccess: onSuccess)
                    } label: {
                        Text(viewModel.isLoading ? "...جاري التنفيذ" : "Login")
                            .loginPrimaryButtonLabel()
                    }
                    .buttonStyle(.plain)
                    .disabled(viewModel.isLoading)

                    Button {
                        viewModel.signInWithGoogle()
                    } label: {
                        HStack(spacing: 8) {
                            Text("with Google")
                                .font(.system(size: 18, weight: .medium, design: .monospaced))
                            Text("G")
                                .font(.system(size: 14, weight: .bold, design: .rounded))
                                .frame(width: 18, height: 18)
                                .background(neonGreen.opacity(0.14))
                                .clipShape(Circle())
                        }
                        .foregroundStyle(neonGreen)
                        .frame(maxWidth: .infinity)
                        .frame(height: 38)
                        .overlay(
                            RoundedRectangle(cornerRadius: 0, style: .continuous)
                                .stroke(neonGreen.opacity(0.85), lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                    .disabled(viewModel.isLoading)

                    loginMessageView

                    HStack(spacing: 24) {
                        Button("نسيت كلمة المرور") {
                            viewModel.handleForgotPassword()
                        }
                        .buttonStyle(.plain)

                        Button("حساب جديد") {
                            onGoToSignup()
                        }
                        .buttonStyle(.plain)
                    }
                    .font(.system(size: 16, weight: .medium, design: .monospaced))
                    .foregroundStyle(neonGreen)
                    .padding(.top, 2)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
                .frame(maxWidth: 320)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        }
    }

    private var loginMessageView: some View {
        Text(viewModel.authMessage)
            .font(.system(size: 16, weight: .medium, design: .monospaced))
            .foregroundStyle(neonGreen)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
            .frame(minHeight: 24)
    }

    private func passwordField(
        placeholder: String,
        text: Binding<String>,
        showPassword: Binding<Bool>
    ) -> some View {
        HStack(spacing: 0) {
            Button {
                showPassword.wrappedValue.toggle()
            } label: {
                Image(systemName: showPassword.wrappedValue ? "eye.slash.fill" : "eye.fill")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(neonGreen)
                    .frame(width: 40)
            }
            .buttonStyle(.plain)

            Group {
                if showPassword.wrappedValue {
                    TextField(placeholder, text: text)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                } else {
                    SecureField(placeholder, text: text)
                }
            }
            .submitLabel(.done)
        }
        .loginNeonField(color: neonGreen)
    }
}

@MainActor
final class LoginSwiftViewModel: ObservableObject {
    let phrases = [
        "نهكر الكوره ونهكر الملاعب .",
        "اذا متعصب لاتقرب .",
        "ابعد بعيد ولاتخرب .",
        "التعصب آآفه",
        "غير كذا ححححياك مليون ."
    ]

    @Published var audioOn = true
    @Published var splash = true
    @Published var splashProgress: CGFloat = 0
    @Published var email = ""
    @Published var password = ""
    @Published var showPassword = false
    @Published var isLoading = false
    @Published var authMessage = ""
    @Published var displayedLines = Array(repeating: "", count: 5)
    @Published var currentLineIndex = 0
    @Published var isResetting = false
    @Published var cursorVisible = true
    @Published var newPassword = ""
    @Published var confirmPassword = ""

    private var hasStarted = false
    private var splashTask: Task<Void, Never>?
    private var terminalTask: Task<Void, Never>?
    private var cursorTask: Task<Void, Never>?

    deinit {
        splashTask?.cancel()
        terminalTask?.cancel()
        cursorTask?.cancel()
    }

    func start() {
        guard !hasStarted else { return }
        hasStarted = true

        withAnimation(.linear(duration: 3)) {
            splashProgress = 1
        }

        splashTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            guard !Task.isCancelled else { return }
            splash = false
        }

        terminalTask = Task { @MainActor in
            await animateTerminalLoop()
        }

        cursorTask = Task { @MainActor in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 400_000_000)
                cursorVisible.toggle()
            }
        }
    }

    func stop() {
        splashTask?.cancel()
        terminalTask?.cancel()
        cursorTask?.cancel()
    }

    func toggleAudio() {
        audioOn.toggle()
    }

    func submitLogin(onSuccess: @escaping () -> Void) {
        guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              !password.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            authMessage = "اكتب الإيميل وكلمة المرور أولاً"
            return
        }

        isLoading = true
        authMessage = ""

        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 800_000_000)
            guard !Task.isCancelled else { return }
            isLoading = false
            authMessage = "✅ تم تسجيل الدخول بنجاح"
            try? await Task.sleep(nanoseconds: 800_000_000)
            guard !Task.isCancelled else { return }
            onSuccess()
        }
    }

    func signInWithGoogle() {
        authMessage = "تجهيز ربط Google داخل نسخة Swift سيكون في طبقة المصادقة القادمة."
    }

    func handleForgotPassword() {
        guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            authMessage = "اكتب الإيميل أولاً لاستعادة كلمة المرور"
            return
        }

        authMessage = "تم إرسال رابط استعادة كلمة المرور إلى الإيميل"
    }

    func submitPasswordReset(onRecoveryDone: @escaping () -> Void) {
        if newPassword != confirmPassword {
            authMessage = "كلمات المرور غير متطابقة"
            return
        }

        if newPassword.count < 6 {
            authMessage = "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
            return
        }

        isLoading = true
        authMessage = ""

        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 900_000_000)
            guard !Task.isCancelled else { return }
            isLoading = false
            authMessage = "✅ تم تحديث كلمة المرور بنجاح"
            try? await Task.sleep(nanoseconds: 1_200_000_000)
            guard !Task.isCancelled else { return }
            onRecoveryDone()
        }
    }

    private func animateTerminalLoop() async {
        while !Task.isCancelled {
            displayedLines = Array(repeating: "", count: phrases.count)
            currentLineIndex = 0
            isResetting = false

            for (index, phrase) in phrases.enumerated() {
                guard !Task.isCancelled else { return }

                currentLineIndex = index

                for count in 1...phrase.count {
                    guard !Task.isCancelled else { return }
                    try? await Task.sleep(nanoseconds: 100_000_000)
                    displayedLines[index] = String(phrase.prefix(count))
                }

                try? await Task.sleep(nanoseconds: 500_000_000)
            }

            try? await Task.sleep(nanoseconds: 3_000_000_000)
            guard !Task.isCancelled else { return }
            isResetting = true
            try? await Task.sleep(nanoseconds: 1_000_000_000)
        }
    }
}

private struct LoginNeonFieldModifier: ViewModifier {
    let color: Color

    func body(content: Content) -> some View {
        content
            .font(.system(size: 22, weight: .medium, design: .monospaced))
            .foregroundStyle(color)
            .padding(.horizontal, 14)
            .frame(height: 44)
            .background(Color.black)
            .overlay(
                Rectangle()
                    .stroke(color, lineWidth: 1)
            )
            .shadow(color: color.opacity(0.2), radius: 4)
            .multilineTextAlignment(.center)
    }
}

private extension View {
    func loginNeonField(color: Color) -> some View {
        modifier(LoginNeonFieldModifier(color: color))
    }

    func loginPrimaryButtonLabel() -> some View {
        self
            .font(.system(size: 24, weight: .medium, design: .monospaced))
            .foregroundStyle(.black)
            .frame(maxWidth: .infinity)
            .frame(height: 44)
            .background(Color(red: 0, green: 1, blue: 0.16))
            .overlay(
                Rectangle()
                    .stroke(Color(red: 0, green: 1, blue: 0.16), lineWidth: 1)
            )
            .shadow(color: Color(red: 0, green: 1, blue: 0.16).opacity(0.25), radius: 10)
    }
}

struct LoginSwiftView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            LoginSwiftView(isRecovery: false, onSuccess: {}, onRecoveryDone: {}, onGoToSignup: {})
            LoginSwiftView(isRecovery: true, onSuccess: {}, onRecoveryDone: {}, onGoToSignup: {})
        }
        .environment(\.layoutDirection, .rightToLeft)
    }
}