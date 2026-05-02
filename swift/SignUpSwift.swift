import SwiftUI

struct SignUpSwiftView: View {
    let onGoToLogin: () -> Void
    let onSuccess: () -> Void

    @StateObject private var viewModel = SignUpSwiftViewModel()

    private let neonGreen = Color(red: 0, green: 1, blue: 0.16)
    private let neonRed = Color(red: 1, green: 0.33, blue: 0.33)

    var body: some View {
        ZStack {
            Color.black
                .ignoresSafeArea()

            ScanlineOverlay(color: neonGreen)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                statusBar
                    .padding(.top, 14)

                Spacer(minLength: 0)

                terminalHeader
                    .padding(.bottom, 32)

                formView
                    .padding(.bottom, 40)

                Spacer(minLength: 0)
            }
            .frame(maxWidth: 430)
            .padding(.horizontal, 20)
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

    private var statusBar: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(neonGreen)
                .frame(width: 7, height: 7)
                .scaleEffect(viewModel.statusPulse ? 1 : 0.72)
                .shadow(color: neonGreen.opacity(0.75), radius: viewModel.statusPulse ? 8 : 2)

            Text("SECURE CONNECTION ACTIVE")
                .font(.system(size: 13, weight: .medium, design: .monospaced))
                .foregroundStyle(neonGreen.opacity(0.65))
                .tracking(2)
        }
        .frame(maxWidth: .infinity)
    }

    private var terminalHeader: some View {
        VStack(spacing: 4) {
            Text("[ REGISTER ]")
                .font(.system(size: 31, weight: .bold, design: .monospaced))
                .foregroundStyle(neonGreen)
                .shadow(color: neonGreen.opacity(0.75), radius: 8)
                .overlay {
                    Text("[ REGISTER ]")
                        .font(.system(size: 31, weight: .bold, design: .monospaced))
                        .foregroundStyle(viewModel.glitchOffset ? neonRed.opacity(0.55) : .clear)
                        .offset(x: viewModel.glitchOffset ? -2 : 0)
                }

            HStack(spacing: 4) {
                Rectangle()
                    .fill(neonGreen)
                    .frame(width: 9, height: 18)
                    .opacity(viewModel.cursorVisible ? 1 : 0)

                Text(viewModel.displayed)
                    .font(.system(size: 18, weight: .medium, design: .monospaced))
                    .foregroundStyle(neonGreen.opacity(0.78))
                    .frame(height: 22)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var formView: some View {
        VStack(spacing: 10) {
            TextField("Full Name", text: $viewModel.fullName)
                .textInputAutocapitalization(.words)
                .autocorrectionDisabled(true)
                .signupNeonField(color: neonGreen)

            TextField("Email", text: $viewModel.email)
                .textInputAutocapitalization(.never)
                .keyboardType(.emailAddress)
                .autocorrectionDisabled(true)
                .signupNeonField(color: neonGreen)

            passwordField(
                placeholder: "Password",
                text: $viewModel.password,
                isVisible: $viewModel.showPass
            )

            passwordField(
                placeholder: "Confirm Password",
                text: $viewModel.confirmPassword,
                isVisible: $viewModel.showConfirm
            )

            Button {
                viewModel.handleSignUp(onSuccess: onSuccess)
            } label: {
                Text(viewModel.loading ? "...جاري التسجيل" : "Create Account")
                    .signupPrimaryButtonLabel(color: neonGreen)
            }
            .buttonStyle(.plain)
            .disabled(viewModel.loading)

            Button {
                viewModel.handleGoogle()
            } label: {
                HStack(spacing: 8) {
                    Text("with Google")
                    Text("G")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .frame(width: 18, height: 18)
                        .background(neonGreen.opacity(0.16))
                        .clipShape(Circle())
                }
                .font(.system(size: 20, weight: .medium, design: .monospaced))
                .foregroundStyle(neonGreen)
                .frame(maxWidth: .infinity)
                .frame(height: 38)
            }
            .buttonStyle(.plain)
            .disabled(viewModel.loading)

            if !viewModel.message.isEmpty {
                Text(viewModel.message)
                    .font(.system(size: 16, weight: .medium, design: .monospaced))
                    .foregroundStyle(viewModel.isError ? neonRed : neonGreen)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 4)

                if viewModel.done {
                    SignUpSuccessBar(progress: viewModel.successProgress, color: neonGreen)
                        .frame(height: 3)
                        .padding(.top, 4)
                }
            }

            HStack(spacing: 28) {
                Button("عندي حساب بالفعل") {
                    onGoToLogin()
                }
                .buttonStyle(.plain)
            }
            .font(.system(size: 18, weight: .medium, design: .monospaced))
            .foregroundStyle(neonGreen)
            .padding(.top, 14)
        }
        .frame(maxWidth: 300)
        .onSubmit {
            viewModel.handleSignUp(onSuccess: onSuccess)
        }
    }

    private func passwordField(
        placeholder: String,
        text: Binding<String>,
        isVisible: Binding<Bool>
    ) -> some View {
        HStack(spacing: 0) {
            Button {
                isVisible.wrappedValue.toggle()
            } label: {
                Image(systemName: isVisible.wrappedValue ? "eye.slash.fill" : "eye.fill")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(neonGreen)
                    .frame(width: 40)
            }
            .buttonStyle(.plain)

            Group {
                if isVisible.wrappedValue {
                    TextField(placeholder, text: text)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                } else {
                    SecureField(placeholder, text: text)
                }
            }
        }
        .signupNeonField(color: neonGreen)
    }
}

@MainActor
final class SignUpSwiftViewModel: ObservableObject {
    let phrases = [
        "إنشاء هوية جديدة...",
        "البيانات مشفرة بالكامل ✓",
        "اختر كلمة سر قوية",
        "مرحبًا بالهكر الجديد !",
        "النظام جاهز للتسجيل ▌"
    ]

    @Published var displayed = ""
    @Published var fullName = ""
    @Published var email = ""
    @Published var password = ""
    @Published var confirmPassword = ""
    @Published var showPass = false
    @Published var showConfirm = false
    @Published var loading = false
    @Published var message = ""
    @Published var isError = false
    @Published var done = false
    @Published var successProgress: CGFloat = 0
    @Published var cursorVisible = true
    @Published var statusPulse = false
    @Published var glitchOffset = false

    private var hasStarted = false
    private var typingTask: Task<Void, Never>?
    private var cursorTask: Task<Void, Never>?
    private var pulseTask: Task<Void, Never>?
    private var glitchTask: Task<Void, Never>?

    deinit {
        stop()
    }

    func start() {
        guard !hasStarted else { return }
        hasStarted = true

        typingTask = Task { @MainActor in
            await animatePhrases()
        }

        cursorTask = Task { @MainActor in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 400_000_000)
                cursorVisible.toggle()
            }
        }

        pulseTask = Task { @MainActor in
            while !Task.isCancelled {
                withAnimation(.easeInOut(duration: 0.7)) {
                    statusPulse.toggle()
                }
                try? await Task.sleep(nanoseconds: 700_000_000)
            }
        }

        glitchTask = Task { @MainActor in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 4_000_000_000)
                glitchOffset = true
                try? await Task.sleep(nanoseconds: 160_000_000)
                glitchOffset = false
            }
        }
    }

    func stop() {
        typingTask?.cancel()
        cursorTask?.cancel()
        pulseTask?.cancel()
        glitchTask?.cancel()
    }

    func handleSignUp(onSuccess: @escaping () -> Void) {
        setMessage("", error: false)

        if fullName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            setMessage("أدخل الاسم الكامل", error: true)
            return
        }

        if email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            setMessage("أدخل الإيميل", error: true)
            return
        }

        if password.count < 6 {
            setMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل", error: true)
            return
        }

        if password != confirmPassword {
            setMessage("كلمة المرور غير متطابقة", error: true)
            return
        }

        loading = true
        done = false
        successProgress = 0

        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 900_000_000)
            guard !Task.isCancelled else { return }
            loading = false
            done = true
            setMessage("✅ تم إنشاء الحساب! تحقق من بريدك لتفعيل الحساب.", error: false)

            withAnimation(.linear(duration: 2)) {
                successProgress = 1
            }

            try? await Task.sleep(nanoseconds: 2_500_000_000)
            guard !Task.isCancelled else { return }
            onSuccess()
        }
    }

    func handleGoogle() {
        setMessage("تجهيز ربط Google داخل نسخة Swift سيكون في طبقة المصادقة القادمة.", error: false)
    }

    private func setMessage(_ text: String, error: Bool) {
        message = text
        isError = error

        if error {
            done = false
            successProgress = 0
        }
    }

    private func animatePhrases() async {
        var phraseIndex = 0

        while !Task.isCancelled {
            let phrase = phrases[phraseIndex]

            for characterCount in 1...phrase.count {
                guard !Task.isCancelled else { return }
                try? await Task.sleep(nanoseconds: 65_000_000)
                displayed = String(phrase.prefix(characterCount))
            }

            try? await Task.sleep(nanoseconds: 1_800_000_000)
            guard !Task.isCancelled else { return }

            while !displayed.isEmpty {
                try? await Task.sleep(nanoseconds: 35_000_000)
                displayed.removeLast()
            }

            phraseIndex = (phraseIndex + 1) % phrases.count
        }
    }
}

private struct ScanlineOverlay: View {
    let color: Color

    var body: some View {
        GeometryReader { geometry in
            Canvas { context, size in
                let stripeHeight: CGFloat = 4
                let visibleHeight: CGFloat = 1
                var currentY: CGFloat = 0

                while currentY < size.height {
                    let rect = CGRect(x: 0, y: currentY + 3, width: size.width, height: visibleHeight)
                    context.fill(Path(rect), with: .color(color.opacity(0.03)))
                    currentY += stripeHeight
                }
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
            .allowsHitTesting(false)
        }
    }
}

private struct SignUpSuccessBar: View {
    let progress: CGFloat
    let color: Color

    var body: some View {
        GeometryReader { geometry in
            Rectangle()
                .fill(color)
                .frame(width: geometry.size.width * progress, alignment: .leading)
                .shadow(color: color.opacity(0.7), radius: 8)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

private struct SignUpNeonFieldModifier: ViewModifier {
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
    func signupNeonField(color: Color) -> some View {
        modifier(SignUpNeonFieldModifier(color: color))
    }

    func signupPrimaryButtonLabel(color: Color) -> some View {
        self
            .font(.system(size: 24, weight: .medium, design: .monospaced))
            .foregroundStyle(.black)
            .frame(maxWidth: .infinity)
            .frame(height: 46)
            .background(color)
            .overlay(
                Rectangle()
                    .stroke(color, lineWidth: 1)
            )
            .shadow(color: color.opacity(0.3), radius: 10)
    }
}

struct SignUpSwiftView_Previews: PreviewProvider {
    static var previews: some View {
        SignUpSwiftView(onGoToLogin: {}, onSuccess: {})
            .environment(\.layoutDirection, .rightToLeft)
    }
}