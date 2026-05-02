import SwiftUI

struct ProfileSwiftView: View {
    let canOpenAdmin: Bool
    let posts: [AppSwiftPost]
    let onOpenAdmin: () -> Void
    let onSignOut: () -> Void

    @StateObject private var viewModel = ProfileSwiftViewModel()
    @State private var showEdit = false
    @State private var signingOut = false

    private let shellWidth: CGFloat = 320

    var body: some View {
        ZStack {
            ProfileSwiftBackgroundLayer(imageURL: viewModel.pageBackground)
                .ignoresSafeArea()

            Color(red: 0.01, green: 0.03, blue: 0.08)
                .opacity(0.12)
                .ignoresSafeArea()

            VStack(spacing: 12) {
                VStack(spacing: 12) {
                    heroCard
                    tilesGrid
                }
                .frame(maxWidth: shellWidth)

                Spacer(minLength: 0)

                SlideToSignOutControl(
                    isLoading: signingOut,
                    onCompleted: triggerSignOut
                )
                .frame(maxWidth: shellWidth)
            }
            .padding(.horizontal, 16)
            .padding(.top, 20)
            .padding(.bottom, 32)
        }
        .sheet(isPresented: $showEdit) {
            ProfileSwiftEditSheet(
                draft: $viewModel.draft,
                pageBackground: $viewModel.pageBackground,
                canOpenAdmin: canOpenAdmin,
                saveMessage: viewModel.saveMessage,
                onClose: { showEdit = false },
                onOpenAdmin: onOpenAdmin,
                onSave: {
                    viewModel.commitDraft()
                    showEdit = false
                }
            )
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
            .presentationCornerRadius(28)
        }
        .preferredColorScheme(.dark)
        .environment(\.layoutDirection, .rightToLeft)
    }

    private var heroCard: some View {
        Button {
            viewModel.prepareDraft()
            showEdit = true
        } label: {
            HStack(spacing: 14) {
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [
                                        Color(red: 1, green: 0.81, blue: 0.45),
                                        Color(red: 0.95, green: 0.65, blue: 0.23),
                                        Color(red: 0.87, green: 0.48, blue: 0.06)
                                    ],
                                    center: .center,
                                    startRadius: 2,
                                    endRadius: 44
                                )
                            )
                            .frame(width: 66, height: 66)

                        if viewModel.profile.avatarFrameEnabled {
                            Circle()
                                .stroke(Color.white.opacity(0.85), lineWidth: 2)
                                .frame(width: 62, height: 62)
                        }

                        if let avatarURL = URL(string: viewModel.profile.avatarURL), !viewModel.profile.avatarURL.isEmpty {
                            AsyncImage(url: avatarURL) { phase in
                                switch phase {
                                case .success(let image):
                                    image
                                        .resizable()
                                        .scaledToFill()
                                default:
                                    ProfileSwiftAvatarFallback(initial: viewModel.profile.displayNameInitial)
                                }
                            }
                            .frame(width: 60, height: 60)
                            .clipShape(Circle())
                        } else {
                            ProfileSwiftAvatarFallback(initial: viewModel.profile.displayNameInitial)
                                .frame(width: 60, height: 60)
                                .clipShape(Circle())
                        }
                    }

                    Text(viewModel.profile.profileCode)
                        .font(.system(size: 15, weight: .black))
                        .foregroundStyle(.white)
                }
                .frame(width: 92)

                VStack(alignment: .trailing, spacing: 7) {
                    HStack(spacing: 8) {
                        if viewModel.profile.isVerified {
                            ProfileSwiftVerificationBadge()
                        }

                        Text("الملف الشخصي")
                            .font(.system(size: 17, weight: .black))
                            .foregroundStyle(.white)
                    }
                    .frame(maxWidth: .infinity, alignment: .trailing)

                    Text(viewModel.profile.heroSubtitle)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.white.opacity(0.78))
                        .frame(maxWidth: .infinity, alignment: .trailing)

                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(Color.white.opacity(0.06))
                        .frame(width: 56, height: 44)
                        .overlay(
                            Image(systemName: "lanyardcard.fill")
                                .font(.system(size: 24, weight: .medium))
                                .foregroundStyle(.white.opacity(0.84))
                        )
                        .frame(maxWidth: .infinity, alignment: .trailing)

                    Text(viewModel.profile.heroHint)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.white.opacity(0.54))
                        .lineLimit(1)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity, minHeight: 118)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.09),
                                Color(red: 0.08, green: 0.1, blue: 0.16).opacity(0.96)
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(Color.white.opacity(0.88), lineWidth: 2)
            )
            .shadow(color: .black.opacity(0.34), radius: 16, y: 8)
        }
        .buttonStyle(.plain)
    }

    private var tilesGrid: some View {
        let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 3)

        return LazyVGrid(columns: columns, spacing: 10) {
            ForEach(viewModel.metricTiles(posts: posts, canOpenAdmin: canOpenAdmin)) { tile in
                ProfileSwiftMetricTileView(tile: tile)
            }
        }
    }

    private func triggerSignOut() {
        guard !signingOut else { return }
        signingOut = true

        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 650_000_000)
            onSignOut()
            signingOut = false
        }
    }
}

@MainActor
final class ProfileSwiftViewModel: ObservableObject {
    @Published var profile = ProfileSwiftProfile.sample
    @Published var draft = ProfileSwiftProfile.sample
    @Published var saveMessage = ""

    func prepareDraft() {
        draft = profile
        saveMessage = ""
    }

    func commitDraft() {
        profile = draft
        saveMessage = "تم حفظ التعديلات محليًا داخل نسخة Swift"
    }

    func metricTiles(posts: [AppSwiftPost], canOpenAdmin: Bool) -> [ProfileSwiftMetricTile] {
        let likes = posts.reduce(0) { $0 + max(0, $1.likes) }
        let comments = max(posts.count * 2, 18)
        let shares = max(posts.count, 6)
        let reposts = max(posts.count / 2, 4)
        let tools = 5 + (canOpenAdmin ? 1 : 0)

        return [
            ProfileSwiftMetricTile(id: "followers", label: "المتابعون", value: "2,578", tone: .white, systemImage: "person.3.fill"),
            ProfileSwiftMetricTile(id: "following", label: "يتابع", value: "1,950", tone: .white, systemImage: "person.crop.circle.badge.plus"),
            ProfileSwiftMetricTile(id: "likes", label: "اعجاب", value: "\(likes)", tone: .blue, systemImage: "heart.fill"),
            ProfileSwiftMetricTile(id: "comments", label: "تعليق", value: "\(comments)", tone: .green, systemImage: "message.fill"),
            ProfileSwiftMetricTile(id: "shares", label: "مشاركة", value: "\(shares)", tone: .amber, systemImage: "paperplane.fill"),
            ProfileSwiftMetricTile(id: "reposts", label: "إعادة نشر", value: "\(reposts)", tone: .red, systemImage: "arrow.2.squarepath"),
            ProfileSwiftMetricTile(id: "tools", label: "الأدوات", value: "\(tools)", tone: .cyan, systemImage: "shield.fill")
        ]
    }
}

struct ProfileSwiftProfile: Equatable {
    var displayName: String
    var username: String
    var bio: String
    var phone: String
    var location: String
    var email: String
    var pageBackground: String
    var avatarURL: String
    var avatarFrameEnabled: Bool
    var isVerified: Bool
    var joinDate: String

    var profileCode: String {
        let source = username.replacingOccurrences(of: "@", with: "")
        return String(source.prefix(3)).uppercased()
    }

    var heroSubtitle: String {
        if isVerified {
            return "حساب موثق بالشارة الذهبية"
        }

        return "عضو منذ \(joinDate)"
    }

    var heroHint: String {
        if !bio.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return bio
        }

        if !location.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return location
        }

        return "تغيير الخلفية وتعديل الملف الشخصي"
    }

    var displayNameInitial: String {
        String(displayName.trimmingCharacters(in: .whitespacesAndNewlines).prefix(1)).uppercased()
    }

    static let sample = ProfileSwiftProfile(
        displayName: "Xtik User",
        username: "@xtik",
        bio: "تغيير الخلفية وتعديل الملف الشخصي",
        phone: "+966 5x xxx xxxx",
        location: "الرياض، السعودية",
        email: "user@webplus.app",
        pageBackground: "",
        avatarURL: "",
        avatarFrameEnabled: false,
        isVerified: true,
        joinDate: "مايو 2026"
    )
}

struct ProfileSwiftMetricTile: Identifiable {
    enum Tone {
        case white
        case green
        case amber
        case red
        case cyan
        case blue

        var color: Color {
            switch self {
            case .white:
                return .white
            case .green:
                return Color(red: 0.68, green: 0.97, blue: 0.29)
            case .amber:
                return Color(red: 1, green: 0.69, blue: 0.17)
            case .red:
                return Color(red: 1, green: 0.32, blue: 0.3)
            case .cyan:
                return Color(red: 0.36, green: 0.84, blue: 1)
            case .blue:
                return Color(red: 0.18, green: 0.61, blue: 1)
            }
        }
    }

    let id: String
    let label: String
    let value: String
    let tone: Tone
    let systemImage: String
}

struct ProfileSwiftMetricTileView: View {
    let tile: ProfileSwiftMetricTile

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: tile.systemImage)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(tile.tone.color)

            Text(tile.value)
                .font(.system(size: 12, weight: .black))
                .foregroundStyle(tile.tone.color)
                .lineLimit(1)

            Text(tile.label)
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 74)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0.08),
                            Color(red: 0.04, green: 0.05, blue: 0.08).opacity(0.94)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.white.opacity(0.88), lineWidth: 2)
        )
        .shadow(color: .black.opacity(0.26), radius: 10, y: 6)
    }
}

struct ProfileSwiftBackgroundLayer: View {
    let imageURL: String

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.02, green: 0.06, blue: 0.12),
                    Color(red: 0.01, green: 0.03, blue: 0.08),
                    Color(red: 0.01, green: 0.02, blue: 0.05)
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            RadialGradient(
                colors: [
                    Color(red: 0.1, green: 0.26, blue: 0.52).opacity(0.32),
                    .clear
                ],
                center: .init(x: 0.3, y: 0.12),
                startRadius: 8,
                endRadius: 260
            )

            if let url = URL(string: imageURL), !imageURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                AsyncImage(url: url) { phase in
                    if case let .success(image) = phase {
                        image
                            .resizable()
                            .scaledToFill()
                            .overlay(Color.black.opacity(0.52))
                    }
                }
            }
        }
    }
}

struct ProfileSwiftAvatarFallback: View {
    let initial: String

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [
                            Color(red: 0.22, green: 0.36, blue: 0.58),
                            Color(red: 0.06, green: 0.11, blue: 0.19)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            Text(initial)
                .font(.system(size: 24, weight: .black))
                .foregroundStyle(.white)
        }
    }
}

struct ProfileSwiftVerificationBadge: View {
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 11, weight: .bold))
            Text("موثق")
                .font(.system(size: 10, weight: .black))
        }
        .foregroundStyle(Color(red: 0.08, green: 0.12, blue: 0.2))
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(
            Capsule()
                .fill(Color(red: 1, green: 0.84, blue: 0.52))
        )
    }
}

struct SlideToSignOutControl: View {
    let isLoading: Bool
    let onCompleted: () -> Void

    @State private var progress: CGFloat = 0

    var body: some View {
        GeometryReader { geometry in
            let totalWidth = max(geometry.size.width - 64, 1)

            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0.03, green: 0.04, blue: 0.07).opacity(0.96),
                                Color(red: 0.01, green: 0.02, blue: 0.04).opacity(0.98)
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(Color.white.opacity(0.94), lineWidth: 2)
                    )

                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.08),
                                Color(red: 0.27, green: 0.54, blue: 1).opacity(0.18)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: 52 + totalWidth * progress)
                    .padding(6)

                Text(isLoading ? "جاري تسجيل الخروج..." : "اسحب الشريط")
                    .font(.system(size: 15, weight: .black))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)

                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0.05, green: 0.08, blue: 0.14),
                                Color(red: 0.02, green: 0.03, blue: 0.05)
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: 52, height: 40)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(Color.white.opacity(0.88), lineWidth: 1)
                    )
                    .overlay(
                        Image(systemName: "power")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundStyle(.white)
                    )
                    .offset(x: 6 + totalWidth * progress)
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { value in
                                guard !isLoading else { return }
                                let next = min(max(value.translation.width / totalWidth, 0), 1)
                                progress = next
                            }
                            .onEnded { _ in
                                guard !isLoading else { return }
                                if progress > 0.9 {
                                    progress = 1
                                    onCompleted()
                                } else {
                                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                                        progress = 0
                                    }
                                }
                            }
                    )
            }
        }
        .frame(height: 56)
    }
}

struct ProfileSwiftEditSheet: View {
    @Binding var draft: ProfileSwiftProfile
    @Binding var pageBackground: String
    let canOpenAdmin: Bool
    let saveMessage: String
    let onClose: () -> Void
    let onOpenAdmin: () -> Void
    let onSave: () -> Void

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [
                        Color(red: 0.04, green: 0.07, blue: 0.12),
                        Color(red: 0.02, green: 0.03, blue: 0.07)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 18) {
                        HStack(spacing: 10) {
                            avatarEditor

                            VStack(spacing: 10) {
                                Button {
                                    draft.avatarFrameEnabled.toggle()
                                } label: {
                                    Text("ايطار")
                                        .profileSheetChip(active: draft.avatarFrameEnabled)
                                }
                                .buttonStyle(.plain)

                                if canOpenAdmin {
                                    Button(action: onOpenAdmin) {
                                        HStack(spacing: 8) {
                                            Image(systemName: "shield.fill")
                                            Text("الأدمن")
                                        }
                                        .profileSheetChip(active: false)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }

                        Text("اضغط لتغيير الصورة")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.white.opacity(0.72))

                        if !saveMessage.isEmpty {
                            Text(saveMessage)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(Color(red: 0.62, green: 0.82, blue: 1))
                                .frame(maxWidth: .infinity)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 10)
                                .background(Color(red: 0.16, green: 0.52, blue: 1).opacity(0.12))
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }

                        backgroundSection
                        fieldsSection
                    }
                    .padding(16)
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(action: onClose) {
                        Image(systemName: "xmark")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 40, height: 40)
                            .background(Color.white.opacity(0.08))
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                }

                ToolbarItem(placement: .principal) {
                    Text("تعديل الملف الشخصي")
                        .font(.system(size: 17, weight: .black))
                        .foregroundStyle(.white)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: onSave) {
                        Text("حفظ")
                            .font(.system(size: 15, weight: .black))
                            .foregroundStyle(Color(red: 0.03, green: 0.07, blue: 0.13))
                            .padding(.horizontal, 18)
                            .padding(.vertical, 10)
                            .background(
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            colors: [Color.white, Color(red: 0.78, green: 0.87, blue: 1)],
                                            startPoint: .top,
                                            endPoint: .bottom
                                        )
                                    )
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var avatarEditor: some View {
        ZStack(alignment: .bottomTrailing) {
            ZStack {
                Circle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 112, height: 112)

                if let avatarURL = URL(string: draft.avatarURL), !draft.avatarURL.isEmpty {
                    AsyncImage(url: avatarURL) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                        default:
                            ProfileSwiftAvatarFallback(initial: draft.displayNameInitial)
                        }
                    }
                    .frame(width: 112, height: 112)
                    .clipShape(Circle())
                } else {
                    ProfileSwiftAvatarFallback(initial: draft.displayNameInitial)
                        .frame(width: 112, height: 112)
                        .clipShape(Circle())
                }

                if draft.avatarFrameEnabled {
                    Circle()
                        .stroke(Color.white.opacity(0.86), lineWidth: 3)
                        .frame(width: 108, height: 108)
                }
            }

            Circle()
                .fill(Color(red: 0.11, green: 0.52, blue: 1))
                .frame(width: 36, height: 36)
                .overlay(
                    Image(systemName: "camera.fill")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                )
        }
        .frame(maxWidth: .infinity, alignment: .center)
    }

    private var backgroundSection: some View {
        VStack(alignment: .trailing, spacing: 12) {
            VStack(alignment: .trailing, spacing: 3) {
                Text("خلفية الصفحة")
                    .font(.system(size: 15, weight: .black))
                    .foregroundStyle(.white)
                Text("الخلفية الافتراضية كحلي داكن ويمكن استبدالها برابط صورة.")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.64))
            }
            .frame(maxWidth: .infinity, alignment: .trailing)

            ZStack(alignment: .bottomTrailing) {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0.05, green: 0.09, blue: 0.19),
                                Color(red: 0.03, green: 0.06, blue: 0.12)
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(maxWidth: .infinity)
                    .frame(height: 180)
                    .overlay {
                        if let url = URL(string: draft.pageBackground), !draft.pageBackground.isEmpty {
                            AsyncImage(url: url) { phase in
                                if case let .success(image) = phase {
                                    image
                                        .resizable()
                                        .scaledToFill()
                                        .frame(maxWidth: .infinity)
                                        .frame(height: 180)
                                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                                        .overlay(Color.black.opacity(0.34))
                                }
                            }
                        }
                    }
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(Color.white.opacity(draft.pageBackground.isEmpty ? 0.12 : 0.24), lineWidth: 1)
                    )

                Text(draft.pageBackground.isEmpty ? "خلفية كحلية افتراضية" : "معاينة الخلفية الحالية")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(12)
            }

            HStack(spacing: 10) {
                Button {
                    draft.pageBackground = ""
                    pageBackground = ""
                } label: {
                    Text("الخلفية الافتراضية")
                        .profileSecondaryButton()
                }
                .buttonStyle(.plain)

                Button {
                    draft.pageBackground = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
                    pageBackground = draft.pageBackground
                } label: {
                    Text("تجربة صورة")
                        .profileSecondaryButton()
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var fieldsSection: some View {
        VStack(spacing: 0) {
            ProfileSwiftInputField(label: "الاسم", text: $draft.displayName, placeholder: "اسمك الكامل")
            ProfileSwiftInputField(label: "السيرة الذاتية", text: $draft.bio, placeholder: "اكتب شيئاً عن نفسك...", axis: .vertical)
            ProfileSwiftInputField(label: "الجوال", text: $draft.phone, placeholder: "+966 5x xxx xxxx")
            ProfileSwiftInputField(label: "الموقع", text: $draft.location, placeholder: "المدينة، الدولة")
            ProfileSwiftInputField(label: "رابط الخلفية", text: $draft.pageBackground, placeholder: "https://example.com/background.jpg", isLTR: true, onChanged: { pageBackground = $0 })
            ProfileSwiftReadOnlyField(label: "الإيميل", value: draft.email)
        }
        .background(Color.clear)
    }
}

struct ProfileSwiftInputField: View {
    let label: String
    @Binding var text: String
    let placeholder: String
    var axis: Axis = .horizontal
    var isLTR = false
    var onChanged: ((String) -> Void)? = nil

    var body: some View {
        VStack(alignment: .trailing, spacing: 6) {
            Text(label)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.white.opacity(0.68))
                .frame(maxWidth: .infinity, alignment: .trailing)

            if axis == .vertical {
                TextField(placeholder, text: $text, axis: .vertical)
                    .lineLimit(3, reservesSpace: true)
                    .onChange(of: text) { onChanged?($0) }
                    .profileSheetField(isLTR: isLTR)
            } else {
                TextField(placeholder, text: $text)
                    .onChange(of: text) { onChanged?($0) }
                    .profileSheetField(isLTR: isLTR)
            }
        }
        .padding(.vertical, 14)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(Color.white.opacity(0.08))
                .frame(height: 1)
        }
    }
}

struct ProfileSwiftReadOnlyField: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .trailing, spacing: 6) {
            Text(label)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.white.opacity(0.5))
                .frame(maxWidth: .infinity, alignment: .trailing)

            Text(value)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(.white.opacity(0.48))
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(.vertical, 14)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(Color.white.opacity(0.08))
                .frame(height: 1)
        }
    }
}

private extension View {
    func profileSheetChip(active: Bool) -> some View {
        self
            .font(.system(size: 14, weight: .bold))
            .foregroundStyle(active ? Color(red: 0.03, green: 0.07, blue: 0.13) : .white.opacity(0.92))
            .padding(.horizontal, 16)
            .frame(minHeight: 40)
            .background(
                Capsule()
                    .fill(active ? Color(red: 0.9, green: 0.96, blue: 1) : Color.white.opacity(0.08))
            )
            .overlay(
                Capsule()
                    .stroke(Color.white.opacity(active ? 0.24 : 0.14), lineWidth: 1)
            )
    }

    func profileSecondaryButton() -> some View {
        self
            .font(.system(size: 14, weight: .bold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 40)
            .background(Color.white.opacity(0.08))
            .overlay(
                RoundedRectangle(cornerRadius: 999, style: .continuous)
                    .stroke(Color.white.opacity(0.14), lineWidth: 1)
            )
            .clipShape(Capsule())
    }

    func profileSheetField(isLTR: Bool) -> some View {
        self
            .font(.system(size: 15, weight: .medium))
            .foregroundStyle(.white)
            .multilineTextAlignment(isLTR ? .leading : .trailing)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled(true)
    }
}

struct ProfileSwiftView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileSwiftView(canOpenAdmin: true, posts: AppSwiftPost.samples, onOpenAdmin: {}, onSignOut: {})
            .environment(\.layoutDirection, .rightToLeft)
    }
}