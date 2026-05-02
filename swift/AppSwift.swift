import SwiftUI

private enum AppSwiftXPostStorage {
    static let postsKey = "webplus.swift.x-posts"

    static func load() -> [AppSwiftPost] {
        guard let data = UserDefaults.standard.data(forKey: postsKey),
              let decoded = try? JSONDecoder().decode([AppSwiftPost].self, from: data) else {
            return AppSwiftPost.samples
        }

        return decoded
    }

    static func save(_ posts: [AppSwiftPost]) {
        guard let data = try? JSONEncoder().encode(posts) else {
            return
        }

        UserDefaults.standard.set(data, forKey: postsKey)
    }
}

enum AppSwiftTab: Hashable {
    case home
    case fans
    case leagues
    case profile
    case account
    case chat
    case admin
}

enum AppSwiftHomeMode: String, CaseIterable {
    case tiktok = "TikTok"
    case x = "X"
}

enum AppSwiftComposer {
    case dm
    case group
    case post

    var title: String {
        switch self {
        case .dm:
            return "رسالة خاصة"
        case .group:
            return "محادثة جماعية"
        case .post:
            return "منشور X جديد"
        }
    }
}

enum AppSwiftAuthMode {
    case login
    case signup
}

struct AppSwiftPostComment: Identifiable, Codable, Equatable {
    let id: String
    var authorName: String
    var authorHandle: String
    var text: String
}

struct AppSwiftPost: Identifiable, Codable, Equatable {
    let id: Int
    var user: String
    var handle: String
    var time: String
    var content: String
    var likes: Int
    var replies: Int
    var reposts: Int
    var shares: Int
    var comments: [AppSwiftPostComment]
    var likedByMe: Bool
    var repostedByMe: Bool
    var sharedByMe: Bool

    static let samples: [AppSwiftPost] = [
        AppSwiftPost(
            id: 1,
            user: "VAR X",
            handle: "@varx",
            time: "الآن",
            content: "نسخة Swift الأولى بدأت من App.tsx مع الحفاظ على التنقل والوضعين TikTok و X.",
            likes: 18,
            replies: 2,
            reposts: 5,
            shares: 1,
            comments: [
                AppSwiftPostComment(id: "1-1", authorName: "WEBPLUS", authorHandle: "@webplus", text: "الخطوة التالية كانت TikTok ثم X بشكل مستقل."),
                AppSwiftPostComment(id: "1-2", authorName: "VAR Team", authorHandle: "@varteam", text: "النسخة الحالية محافظة على التنقل الأساسي."),
            ],
            likedByMe: false,
            repostedByMe: false,
            sharedByMe: false
        ),
        AppSwiftPost(
            id: 2,
            user: "WEBPLUS",
            handle: "@webplus",
            time: "قبل 5 دقائق",
            content: "كل صفحة لاحقًا ستتحول من TSX و CSS إلى ملف Swift واحد مستقل.",
            likes: 9,
            replies: 1,
            reposts: 2,
            shares: 0,
            comments: [
                AppSwiftPostComment(id: "2-1", authorName: "VAR X", authorHandle: "@varx", text: "تم البدء بالتحويل التدريجي بالفعل.")
            ],
            likedByMe: true,
            repostedByMe: false,
            sharedByMe: false
        ),
        AppSwiftPost(
            id: 3,
            user: "Swift Build",
            handle: "@swift_build",
            time: "قبل 12 دقيقة",
            content: "واجهة X الجديدة في SwiftUI جاهزة للتوسعة لاحقًا نحو مشاركة النظام وبيانات حقيقية.",
            likes: 6,
            replies: 0,
            reposts: 1,
            shares: 0,
            comments: [],
            likedByMe: false,
            repostedByMe: false,
            sharedByMe: false
        )
    ]
}

@main
struct WEBPLUSApp: App {
    var body: some Scene {
        WindowGroup {
            AppSwiftView()
                .environment(\.layoutDirection, .rightToLeft)
        }
    }
}

struct AppSwiftView: View {
    @State private var currentTab: AppSwiftTab = .home
    @State private var chatBaseTab: AppSwiftTab = .home
    @State private var homeMode: AppSwiftHomeMode = .tiktok
    @State private var chatComposer: AppSwiftComposer?
    @State private var authMode: AppSwiftAuthMode = .login
    @State private var tiktokCameraRequestKey = 0
    @State private var pendingTikTokOpen = false
    @State private var posts = AppSwiftXPostStorage.load()
    @State private var isLoading = false
    @State private var isLoggedIn = false
    @State private var isRecovery = false
    @State private var isAdminAllowed = false
    @State private var adminRole: String?

    private var visibleTab: AppSwiftTab {
        currentTab == .chat ? chatBaseTab : currentTab
    }

    private var bottomNavSelection: AppSwiftTab {
        switch visibleTab {
        case .profile, .admin:
            return .account
        default:
            return visibleTab
        }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.black
                .ignoresSafeArea()

            if isLoading {
                LoadingPlaceholder()
            } else {
                VStack(spacing: 0) {
                    currentContent
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                .padding(.bottom, 90)
                .frame(maxWidth: 430)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }

            if visibleTab == .home {
                ThemeSwitchSwiftView(selection: $homeMode)
                    .frame(maxWidth: 430)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            }

            BottomNavSwiftView(
                current: bottomNavSelection,
                homeMode: homeMode,
                onHomeAction: handleBottomNavHomeAction,
                onSelect: handleTabSelection
            )
            .frame(maxWidth: 430)

            if currentTab == .chat {
                Color.black.opacity(0.52)
                    .ignoresSafeArea()

                ChatSwiftView(
                    composer: chatComposer,
                    onConsumeComposer: {
                        if chatComposer != .post {
                            chatComposer = nil
                        }
                    },
                    onOpenPostComposer: {
                        chatComposer = .post
                    },
                    onClose: {
                        chatComposer = nil
                        currentTab = chatBaseTab
                    }
                )
                .padding(.horizontal, 16)
                .padding(.bottom, 88)
                .frame(maxWidth: 430)
            }

            if chatComposer == .post {
                Color.black.opacity(currentTab == .chat ? 0.28 : 0.52)
                    .ignoresSafeArea()

                ChatComposerOverlay(
                    composer: chatComposer,
                    onCreatePost: { content in
                        appendXPost(content: content)
                        chatComposer = nil
                        if currentTab != .chat {
                            currentTab = chatBaseTab
                        }
                    },
                    onClose: {
                        chatComposer = nil
                        if currentTab != .chat {
                            currentTab = chatBaseTab
                        }
                    }
                )
                .padding(.horizontal, 16)
                .padding(.bottom, 88)
                .frame(maxWidth: 430)
            }
        }
        .preferredColorScheme(.dark)
        .font(.system(.body, design: .rounded))
        .onChange(of: posts) { nextPosts in
            AppSwiftXPostStorage.save(nextPosts)
        }
        .onChange(of: pendingTikTokOpen) { shouldOpen in
            guard shouldOpen, homeMode == .tiktok, visibleTab == .home else {
                return
            }

            pendingTikTokOpen = false
            tiktokCameraRequestKey += 1
        }
    }

    @ViewBuilder
    private var currentContent: some View {
        switch visibleTab {
        case .home:
            if homeMode == .tiktok {
                TikTokSwiftView(
                    cameraRequestKey: tiktokCameraRequestKey,
                    isLoggedIn: isLoggedIn,
                    onRequireAuth: {
                        authMode = .login
                        currentTab = .account
                    }
                )
            } else {
                XSwiftView(
                    posts: $posts,
                    isLoggedIn: isLoggedIn,
                    onRequireAuth: {
                        authMode = .login
                        currentTab = .account
                    },
                    onOpenComposer: {
                        openChat(.post)
                    },
                    onOpenChat: {
                        openChat()
                    }
                )
            }

        case .fans:
            FansSwiftView(
                isLoggedIn: isLoggedIn,
                onRequireAuth: {
                    authMode = .login
                    currentTab = .account
                }
            )

        case .leagues:
            LeaguesSwiftView { content in
                createSharedXPost(content: content)
            }

        case .profile:
            ProfileSwiftView(
                canOpenAdmin: isAdminAllowed,
                posts: posts,
                onOpenAdmin: {
                    currentTab = .admin
                },
                onSignOut: {
                    isLoggedIn = false
                    isAdminAllowed = false
                    adminRole = nil
                    currentTab = .home
                }
            )

        case .account:
            if authMode == .login {
                LoginSwiftView(
                    isRecovery: isRecovery,
                    onSuccess: completeAuthFlow,
                    onRecoveryDone: {
                        isRecovery = false
                        authMode = .login
                    },
                    onGoToSignup: {
                        isRecovery = false
                        authMode = .signup
                    }
                )
            } else {
                SignUpSwiftView(
                    onGoToLogin: {
                        authMode = .login
                    },
                    onSuccess: completeAuthFlow
                )
            }

        case .chat:
            Color.clear

        case .admin:
            AdminSwiftView(
                role: adminRole ?? "owner",
                posts: $posts,
                onClose: {
                    currentTab = .profile
                }
            )
        }
    }

    private func completeAuthFlow() {
        isLoggedIn = true
        isRecovery = false
        isAdminAllowed = true
        adminRole = adminRole ?? "owner"
        currentTab = .profile
    }

    private func openChat(_ composer: AppSwiftComposer? = nil) {
        if !isLoggedIn {
            currentTab = .account
            return
        }

        chatBaseTab = currentTab == .chat ? chatBaseTab : currentTab
        chatComposer = composer

        if composer == .post {
            return
        }

        currentTab = .chat
    }

    private func handleBottomNavHomeAction() {
        if homeMode == .x {
            openChat(.post)
            return
        }

        if !isLoggedIn {
            currentTab = .account
            return
        }

        if visibleTab != .home || currentTab == .chat || chatComposer == .post {
            pendingTikTokOpen = true
            chatComposer = nil
            chatBaseTab = .home
            currentTab = .home
            return
        }

        tiktokCameraRequestKey += 1
    }

    private func handleTabSelection(_ nextTab: AppSwiftTab) {
        if nextTab == .account && isLoggedIn {
            currentTab = .profile
            return
        }

        if (nextTab == .chat || nextTab == .profile) && !isLoggedIn {
            authMode = .login
            currentTab = .account
            return
        }

        if nextTab != .chat {
            chatComposer = nil
            chatBaseTab = nextTab
        }

        currentTab = nextTab
    }

    private func appendXPost(content: String) {
        let cleanContent = content.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanContent.isEmpty else {
            return
        }

        posts.insert(
            AppSwiftPost(
                id: Int(Date().timeIntervalSince1970),
                user: "VAR X",
                handle: "@varx",
                time: "الآن",
                content: cleanContent,
                likes: 0,
                replies: 0,
                reposts: 0,
                shares: 0,
                comments: [],
                likedByMe: false,
                repostedByMe: false,
                sharedByMe: false
            ),
            at: 0
        )
    }

    private func createSharedXPost(content: String) {
        appendXPost(content: content)
        chatComposer = nil
        chatBaseTab = .home
        homeMode = .x
        currentTab = .home
    }
}

struct LoadingPlaceholder: View {
    var body: some View {
        VStack(spacing: 14) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .white))

            Text("جاري تحميل التطبيق...")
                .foregroundStyle(.white)
                .font(.system(size: 15, weight: .bold))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct ChatComposerOverlay: View {
    let composer: AppSwiftComposer?
    let onCreatePost: (String) -> Void
    let onClose: () -> Void

    @State private var draft = ""

    var body: some View {
        VStack(alignment: .trailing, spacing: 16) {
            HStack {
                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(10)
                        .background(Color.white.opacity(0.08))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)

                Spacer()

                Text((composer ?? .dm).title)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
            }

            TextEditor(text: $draft)
                .scrollContentBackground(.hidden)
                .frame(minHeight: 160)
                .padding(12)
                .background(Color.white.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )

            Button {
                onCreatePost(draft)
                draft = ""
            } label: {
                Text(composer == .post ? "نشر على X" : "إرسال")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
            .buttonStyle(.plain)
        }
        .padding(18)
        .background(Color(red: 0.06, green: 0.07, blue: 0.1))
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}

struct PlaceholderScreen: View {
    let title: String
    let subtitle: String
    let symbolName: String
    let accent: Color
    let primaryActionTitle: String
    let onPrimaryAction: () -> Void

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 16) {
                PlaceholderHeroCard(
                    title: title,
                    subtitle: subtitle,
                    symbolName: symbolName,
                    accent: accent
                )

                Button(action: onPrimaryAction) {
                    Text(primaryActionTitle)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.black)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                }
                .buttonStyle(.plain)
            }
            .padding(16)
        }
    }
}

struct PlaceholderHeroCard: View {
    let title: String
    let subtitle: String
    let symbolName: String
    let accent: Color

    var body: some View {
        VStack(alignment: .trailing, spacing: 14) {
            HStack {
                ZStack {
                    Circle()
                        .fill(accent.opacity(0.2))
                        .frame(width: 56, height: 56)

                    Image(systemName: symbolName)
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(accent)
                }

                Spacer()
            }

            Text(title)
                .font(.system(size: 24, weight: .heavy))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: .trailing)

            Text(subtitle)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white.opacity(0.72))
                .frame(maxWidth: .infinity, alignment: .trailing)
                .lineSpacing(3)
        }
        .padding(20)
        .background(
            LinearGradient(
                colors: [
                    Color.white.opacity(0.08),
                    accent.opacity(0.16),
                    Color.white.opacity(0.04)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}

struct InfoPill: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(value)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(.white)

            Spacer()

            Text(title)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(.white.opacity(0.62))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Color.white.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}

struct AppSwiftView_Previews: PreviewProvider {
    static var previews: some View {
        AppSwiftView()
            .environment(\.layoutDirection, .rightToLeft)
    }
}