import SwiftUI

struct TikTokSwiftComment: Identifiable, Equatable {
    let id: UUID
    var authorName: String
    var authorHandle: String
    var body: String
    var createdAt: Date

    static func sample(authorName: String, authorHandle: String, body: String, daysAgo: Int) -> TikTokSwiftComment {
        TikTokSwiftComment(
            id: UUID(),
            authorName: authorName,
            authorHandle: authorHandle,
            body: body,
            createdAt: Calendar.current.date(byAdding: .day, value: -daysAgo, to: Date()) ?? Date()
        )
    }
}

enum TikTokSwiftVideoTheme: String, CaseIterable, Identifiable {
    case ocean
    case ember
    case neon
    case night

    var id: String { rawValue }

    var title: String {
        switch self {
        case .ocean:
            return "Ocean"
        case .ember:
            return "Ember"
        case .neon:
            return "Neon"
        case .night:
            return "Night"
        }
    }

    var icon: String {
        switch self {
        case .ocean:
            return "bolt.horizontal.fill"
        case .ember:
            return "flame.fill"
        case .neon:
            return "sparkles"
        case .night:
            return "moon.stars.fill"
        }
    }

    var colors: [Color] {
        switch self {
        case .ocean:
            return [Color(red: 0.1, green: 0.4, blue: 0.82), Color(red: 0.01, green: 0.08, blue: 0.2)]
        case .ember:
            return [Color(red: 0.98, green: 0.34, blue: 0.28), Color(red: 0.34, green: 0.06, blue: 0.05)]
        case .neon:
            return [Color(red: 0.05, green: 0.86, blue: 0.56), Color(red: 0.01, green: 0.12, blue: 0.1)]
        case .night:
            return [Color(red: 0.33, green: 0.2, blue: 0.66), Color(red: 0.03, green: 0.03, blue: 0.09)]
        }
    }
}

struct TikTokSwiftVideo: Identifiable, Equatable {
    let id: UUID
    var creatorName: String
    var creatorHandle: String
    var caption: String
    var avatarFrameEnabled: Bool
    var isVerified: Bool
    var likes: Int
    var saves: Int
    var shares: Int
    var likedByMe: Bool
    var savedByMe: Bool
    var sharedByMe: Bool
    var isOwnVideo: Bool
    var theme: TikTokSwiftVideoTheme
    var comments: [TikTokSwiftComment]

    var creatorInitial: String {
        String(creatorName.trimmingCharacters(in: .whitespacesAndNewlines).prefix(1)).uppercased()
    }

    static let samples: [TikTokSwiftVideo] = [
        TikTokSwiftVideo(
            id: UUID(),
            creatorName: "Xtik",
            creatorHandle: "@xtik",
            caption: "لقطة سريعة من نبض المباراة مع ستايل أقرب لصفحة TikTok الحالية.",
            avatarFrameEnabled: true,
            isVerified: true,
            likes: 128,
            saves: 24,
            shares: 11,
            likedByMe: false,
            savedByMe: false,
            sharedByMe: false,
            isOwnVideo: true,
            theme: .ocean,
            comments: [
                .sample(authorName: "VAR User", authorHandle: "@varuser", body: "الزاوية ممتازة جدًا", daysAgo: 1),
                .sample(authorName: "Sports Lab", authorHandle: "@sportslab", body: "نحتاج نسخة ثانية من نفس اللقطة", daysAgo: 2)
            ]
        ),
        TikTokSwiftVideo(
            id: UUID(),
            creatorName: "WEBPLUS",
            creatorHandle: "@webplus",
            caption: "إيقاع سريع، شريط جانبي، وتعليقات من داخل نفس الصفحة مثل النسخة الحالية.",
            avatarFrameEnabled: false,
            isVerified: true,
            likes: 94,
            saves: 16,
            shares: 8,
            likedByMe: true,
            savedByMe: false,
            sharedByMe: false,
            isOwnVideo: false,
            theme: .ember,
            comments: [
                .sample(authorName: "Ali", authorHandle: "@ali", body: "التصميم هذا مناسب للنسخة iOS", daysAgo: 1)
            ]
        ),
        TikTokSwiftVideo(
            id: UUID(),
            creatorName: "Match Hub",
            creatorHandle: "@matchhub",
            caption: "بنية جاهزة لإضافة الفيديو الحقيقي لاحقًا بدل الخلفيات التجريبية.",
            avatarFrameEnabled: false,
            isVerified: false,
            likes: 67,
            saves: 13,
            shares: 4,
            likedByMe: false,
            savedByMe: true,
            sharedByMe: false,
            isOwnVideo: false,
            theme: .neon,
            comments: []
        ),
        TikTokSwiftVideo(
            id: UUID(),
            creatorName: "Night Build",
            creatorHandle: "@nightbuild",
            caption: "هذه نسخة SwiftUI أولى لواجهة TikTok مع رفع محلي وتعليقات وشريط أدوات جانبي.",
            avatarFrameEnabled: true,
            isVerified: false,
            likes: 41,
            saves: 7,
            shares: 3,
            likedByMe: false,
            savedByMe: false,
            sharedByMe: true,
            isOwnVideo: false,
            theme: .night,
            comments: [
                .sample(authorName: "Swift Team", authorHandle: "@swiftteam", body: "أكملوا صفحة X بعدها", daysAgo: 3)
            ]
        )
    ]
}

struct TikTokSwiftView: View {
    let cameraRequestKey: Int
    let isLoggedIn: Bool
    let onRequireAuth: () -> Void

    @State private var videos = TikTokSwiftVideo.samples
    @State private var commentSheetVideoID: UUID?
    @State private var commentDraft = ""
    @State private var showUploadComposer = false
    @State private var uploadCaption = ""
    @State private var uploadTheme: TikTokSwiftVideoTheme = .ocean
    @State private var lastHandledCameraRequestKey: Int
    @State private var statusMessage = ""

    init(
        cameraRequestKey: Int = 0,
        isLoggedIn: Bool,
        onRequireAuth: @escaping () -> Void
    ) {
        self.cameraRequestKey = cameraRequestKey
        self.isLoggedIn = isLoggedIn
        self.onRequireAuth = onRequireAuth
        _lastHandledCameraRequestKey = State(initialValue: cameraRequestKey)
    }

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .top) {
                Color.black
                    .ignoresSafeArea()

                if videos.isEmpty {
                    emptyState
                } else {
                    ScrollView(.vertical, showsIndicators: false) {
                        LazyVStack(spacing: 0) {
                            ForEach(videos.indices, id: \.self) { index in
                                TikTokSwiftVideoCardView(
                                    video: $videos[index],
                                    cardHeight: proxy.size.height,
                                    isLoggedIn: isLoggedIn,
                                    onRequireAuth: onRequireAuth,
                                    onOpenComments: {
                                        commentSheetVideoID = videos[index].id
                                        commentDraft = ""
                                    },
                                    onDelete: {
                                        deleteVideo(id: videos[index].id)
                                    },
                                    onStatus: { message in
                                        statusMessage = message
                                    }
                                )
                                .frame(height: proxy.size.height)
                            }
                        }
                    }
                    .background(Color.black)
                }

                if !statusMessage.isEmpty {
                    Text(statusMessage)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(Color.black.opacity(0.72))
                        .overlay(
                            Capsule()
                                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                        )
                        .clipShape(Capsule())
                        .padding(.top, 14)
                        .onTapGesture {
                            statusMessage = ""
                        }
                }

                if let activeCommentVideoBinding {
                    TikTokSwiftCommentSheet(
                        video: activeCommentVideoBinding,
                        draft: $commentDraft,
                        onClose: closeComments,
                        onSubmit: submitComment
                    )
                }
            }
        }
        .sheet(isPresented: $showUploadComposer) {
            TikTokSwiftUploadComposer(
                caption: $uploadCaption,
                selectedTheme: $uploadTheme,
                onCancel: {
                    showUploadComposer = false
                },
                onCreate: createLocalVideo
            )
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
        .preferredColorScheme(.dark)
        .environment(\.layoutDirection, .rightToLeft)
        .onChange(of: cameraRequestKey) { nextValue in
            guard nextValue != lastHandledCameraRequestKey else {
                return
            }

            lastHandledCameraRequestKey = nextValue

            guard isLoggedIn else {
                onRequireAuth()
                return
            }

            showUploadComposer = true
        }
    }

    private var emptyState: some View {
        VStack(spacing: 14) {
            Image(systemName: "play.square.stack.fill")
                .font(.system(size: 40, weight: .black))
                .foregroundStyle(.white)

            Text("لا يوجد فيديوهات حالياً")
                .font(.system(size: 16, weight: .black))
                .foregroundStyle(.white)

            Button {
                if isLoggedIn {
                    showUploadComposer = true
                } else {
                    onRequireAuth()
                }
            } label: {
                Text("إضافة فيديو")
                    .font(.system(size: 14, weight: .black))
                    .foregroundStyle(.black)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 12)
                    .background(Color.white)
                    .clipShape(Capsule())
            }
            .buttonStyle(.plain)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var activeCommentVideoBinding: Binding<TikTokSwiftVideo>? {
        guard let commentSheetVideoID,
              let index = videos.firstIndex(where: { $0.id == commentSheetVideoID }) else {
            return nil
        }

        return $videos[index]
    }

    private func createLocalVideo() {
        guard isLoggedIn else {
            onRequireAuth()
            return
        }

        let newVideo = TikTokSwiftVideo(
            id: UUID(),
            creatorName: "Xtik",
            creatorHandle: "@xtik",
            caption: uploadCaption.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "فيديو جديد من داخل نسخة SwiftUI" : uploadCaption.trimmingCharacters(in: .whitespacesAndNewlines),
            avatarFrameEnabled: true,
            isVerified: true,
            likes: 0,
            saves: 0,
            shares: 0,
            likedByMe: false,
            savedByMe: false,
            sharedByMe: false,
            isOwnVideo: true,
            theme: uploadTheme,
            comments: []
        )

        videos.insert(newVideo, at: 0)
        uploadCaption = ""
        uploadTheme = .ocean
        showUploadComposer = false
        statusMessage = "تم إنشاء فيديو جديد محليًا"
    }

    private func closeComments() {
        commentSheetVideoID = nil
        commentDraft = ""
    }

    private func submitComment() {
        guard isLoggedIn else {
            onRequireAuth()
            return
        }

        let trimmedComment = commentDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedComment.isEmpty,
              let commentSheetVideoID,
              let index = videos.firstIndex(where: { $0.id == commentSheetVideoID }) else {
            return
        }

        videos[index].comments.append(
            TikTokSwiftComment(
                id: UUID(),
                authorName: "Xtik",
                authorHandle: "@xtik",
                body: trimmedComment,
                createdAt: Date()
            )
        )
        commentDraft = ""
    }

    private func deleteVideo(id: UUID) {
        videos.removeAll(where: { $0.id == id })

        if commentSheetVideoID == id {
            closeComments()
        }

        statusMessage = "تم حذف الفيديو"
    }
}

struct TikTokSwiftVideoCardView: View {
    @Binding var video: TikTokSwiftVideo
    let cardHeight: CGFloat
    let isLoggedIn: Bool
    let onRequireAuth: () -> Void
    let onOpenComments: () -> Void
    let onDelete: () -> Void
    let onStatus: (String) -> Void

    @State private var isPaused = false
    @State private var isMuted = false
    @State private var isDockOpen = false
    @State private var isActionsMenuOpen = false
    @State private var showFullscreenPreview = false

    var body: some View {
        ZStack(alignment: .bottom) {
            TikTokSwiftPosterView(theme: video.theme, icon: video.theme.icon, caption: video.caption)
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            Button {
                isPaused.toggle()
            } label: {
                Color.clear
            }
            .buttonStyle(.plain)

            VStack {
                HStack {
                    Spacer()

                    Button {
                        isMuted.toggle()
                    } label: {
                        Image(systemName: isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 34, height: 34)
                            .background(Color.black.opacity(0.45))
                            .overlay(
                                Circle()
                                    .stroke(Color.white.opacity(0.35), lineWidth: 1)
                            )
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                }
                .padding(.top, 16)
                .padding(.horizontal, 16)

                Spacer()
            }

            if isPaused {
                Text("Paused")
                    .font(.system(size: 13, weight: .black))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.black.opacity(0.46))
                    .overlay(
                        Capsule()
                            .stroke(Color.white.opacity(0.35), lineWidth: 1)
                    )
                    .clipShape(Capsule())
            }

            VStack(spacing: 0) {
                Spacer(minLength: cardHeight * 0.34)

                HStack(alignment: .top, spacing: 0) {
                    HStack(spacing: 0) {
                        VStack(spacing: 7) {
                            TikTokSwiftDockButton(icon: "heart.fill", value: video.likes, isActive: video.likedByMe) {
                                guard isLoggedIn else {
                                    onRequireAuth()
                                    return
                                }

                                video.likedByMe.toggle()
                                video.likes = max(0, video.likes + (video.likedByMe ? 1 : -1))
                            }

                            TikTokSwiftDockButton(icon: "message.fill", value: video.comments.count, isActive: false) {
                                guard isLoggedIn else {
                                    onRequireAuth()
                                    return
                                }

                                onOpenComments()
                            }

                            TikTokSwiftDockButton(icon: "paperplane.fill", value: video.shares, isActive: video.sharedByMe) {
                                guard isLoggedIn else {
                                    onRequireAuth()
                                    return
                                }

                                if !video.sharedByMe {
                                    video.sharedByMe = true
                                    video.shares += 1
                                }
                                onStatus("تم تجهيز مشاركة الفيديو")
                            }

                            TikTokSwiftDockButton(icon: "bookmark.fill", value: video.saves, isActive: video.savedByMe) {
                                guard isLoggedIn else {
                                    onRequireAuth()
                                    return
                                }

                                video.savedByMe.toggle()
                                video.saves = max(0, video.saves + (video.savedByMe ? 1 : -1))
                            }

                            Button {
                                showFullscreenPreview = true
                            } label: {
                                Image(systemName: "arrow.up.left.and.arrow.down.right")
                                    .font(.system(size: 18, weight: .bold))
                                    .frame(width: 42, height: 32)
                            }
                            .buttonStyle(TikTokSwiftDockPlainButtonStyle())

                            Button {
                                withAnimation(.easeInOut(duration: 0.2)) {
                                    isActionsMenuOpen.toggle()
                                }
                            } label: {
                                Image(systemName: "ellipsis")
                                    .font(.system(size: 20, weight: .bold))
                                    .frame(width: 42, height: 32)
                            }
                            .buttonStyle(TikTokSwiftDockPlainButtonStyle(isActive: isActionsMenuOpen))

                            if isActionsMenuOpen {
                                VStack(spacing: 4) {
                                    Button {
                                        isActionsMenuOpen = false
                                        onStatus("تم إرسال البلاغ محليًا")
                                    } label: {
                                        TikTokSwiftOverflowItem(icon: "flag.fill", title: "بلاغ", isDanger: false)
                                    }
                                    .buttonStyle(.plain)

                                    if video.isOwnVideo {
                                        Button {
                                            isActionsMenuOpen = false
                                            onDelete()
                                        } label: {
                                            TikTokSwiftOverflowItem(icon: "trash.fill", title: "حذف الفيديو", isDanger: true)
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                                .padding(8)
                                .background(Color.black.opacity(0.82))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                                        .stroke(Color.white.opacity(0.12), lineWidth: 1)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                .offset(x: 36, y: -26)
                            }
                        }
                        .frame(width: 74, height: 368)
                        .background(Color.black.opacity(0.8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 6, style: .continuous)
                                .stroke(Color.white.opacity(0.14), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                        .opacity(isDockOpen ? 1 : 0)

                        Button {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                                isDockOpen.toggle()
                                isActionsMenuOpen = false
                            }
                        } label: {
                            Text("VAR")
                                .font(.system(size: 15, weight: .black, design: .rounded))
                                .foregroundStyle(.white)
                                .rotationEffect(.degrees(90))
                                .frame(width: 30, height: 104)
                                .background(Color.black.opacity(0.8))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 4, style: .continuous)
                                        .stroke(Color.white.opacity(0.92), lineWidth: 1)
                                )
                        }
                        .buttonStyle(.plain)
                    }
                    .offset(x: isDockOpen ? 0 : -74)

                    Spacer()
                }

                Spacer()
            }

            LinearGradient(
                colors: [
                    Color.black.opacity(0.46),
                    Color.black.opacity(0.14),
                    Color.black.opacity(0)
                ],
                startPoint: .bottom,
                endPoint: .top
            )
            .ignoresSafeArea()

            VStack {
                Spacer()

                HStack(alignment: .bottom) {
                    VStack(alignment: .trailing, spacing: 8) {
                        HStack(spacing: 10) {
                            VStack(alignment: .trailing, spacing: 2) {
                                HStack(spacing: 8) {
                                    if video.isVerified {
                                        Image(systemName: "checkmark.seal.fill")
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundStyle(Color(red: 0.46, green: 0.81, blue: 1))
                                    }

                                    Text(video.creatorHandle)
                                        .font(.system(size: 17, weight: .black))
                                        .foregroundStyle(.white)
                                }
                                Text(video.creatorName)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(.white.opacity(0.72))
                            }

                            TikTokSwiftAvatarView(initial: video.creatorInitial, frameEnabled: video.avatarFrameEnabled)
                        }

                        if !video.caption.isEmpty {
                            Text(video.caption)
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(.white.opacity(0.96))
                                .frame(maxWidth: .infinity, alignment: .trailing)
                                .lineSpacing(2)
                        }
                    }

                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 76)
            }
        }
        .clipped()
        .fullScreenCover(isPresented: $showFullscreenPreview) {
            ZStack(alignment: .topLeading) {
                Color.black.ignoresSafeArea()
                TikTokSwiftPosterView(theme: video.theme, icon: video.theme.icon, caption: video.caption)
                    .ignoresSafeArea()

                Button {
                    showFullscreenPreview = false
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 38, height: 38)
                        .background(Color.black.opacity(0.45))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .padding(.top, 20)
                .padding(.leading, 16)
            }
            .preferredColorScheme(.dark)
        }
    }
}

struct TikTokSwiftPosterView: View {
    let theme: TikTokSwiftVideoTheme
    let icon: String
    let caption: String

    var body: some View {
        ZStack {
            LinearGradient(colors: theme.colors, startPoint: .topLeading, endPoint: .bottomTrailing)

            RadialGradient(
                colors: [Color.white.opacity(0.14), .clear],
                center: .topTrailing,
                startRadius: 8,
                endRadius: 260
            )

            VStack(spacing: 18) {
                Image(systemName: icon)
                    .font(.system(size: 66, weight: .black))
                    .foregroundStyle(.white.opacity(0.94))

                if !caption.isEmpty {
                    Text(caption)
                        .font(.system(size: 16, weight: .black))
                        .foregroundStyle(.white.opacity(0.18))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 42)
                        .lineLimit(3)
                }
            }
        }
    }
}

struct TikTokSwiftAvatarView: View {
    let initial: String
    let frameEnabled: Bool

    var body: some View {
        ZStack {
            if frameEnabled {
                Circle()
                    .stroke(Color.white.opacity(0.86), lineWidth: 2)
                    .frame(width: 48, height: 48)
            }

            Circle()
                .fill(
                    LinearGradient(
                        colors: [Color(red: 0.31, green: 0.65, blue: 1), Color(red: 0.08, green: 0.26, blue: 0.54)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 44, height: 44)
                .overlay(
                    Text(initial)
                        .font(.system(size: 18, weight: .black))
                        .foregroundStyle(.white)
                )
        }
    }
}

struct TikTokSwiftDockButton: View {
    let icon: String
    let value: Int
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .bold))
                Text(TikTokSwiftFormatter.count(value))
                    .font(.system(size: 10, weight: .black))
            }
            .frame(width: 44, height: 46)
        }
        .buttonStyle(TikTokSwiftDockPlainButtonStyle(isActive: isActive))
    }
}

struct TikTokSwiftOverflowItem: View {
    let icon: String
    let title: String
    let isDanger: Bool

    var body: some View {
        HStack(spacing: 8) {
            Text(title)
                .font(.system(size: 12, weight: .black))
            Image(systemName: icon)
                .font(.system(size: 14, weight: .bold))
        }
        .foregroundStyle(isDanger ? Color(red: 1, green: 0.48, blue: 0.45) : .white)
        .frame(maxWidth: .infinity, alignment: .trailing)
        .padding(.horizontal, 10)
        .padding(.vertical, 10)
        .background((isDanger ? Color(red: 1, green: 0.36, blue: 0.34) : Color.white).opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

struct TikTokSwiftDockPlainButtonStyle: ButtonStyle {
    var isActive = false

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(isActive ? Color.white : Color.white.opacity(0.92))
            .opacity(configuration.isPressed ? 0.76 : 1)
    }
}

struct TikTokSwiftCommentSheet: View {
    @Binding var video: TikTokSwiftVideo
    @Binding var draft: String
    let onClose: () -> Void
    let onSubmit: () -> Void

    var body: some View {
        ZStack(alignment: .bottom) {
            Color(red: 0.02, green: 0.03, blue: 0.05)
                .opacity(0.86)
                .ignoresSafeArea()
                .onTapGesture(perform: onClose)

            VStack(spacing: 0) {
                ZStack(alignment: .topLeading) {
                    TikTokSwiftPosterView(theme: video.theme, icon: video.theme.icon, caption: video.caption)
                        .frame(height: 252)

                    LinearGradient(
                        colors: [Color.black.opacity(0.14), Color.black.opacity(0.06), Color.black.opacity(0.74)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: 252)

                    Button(action: onClose) {
                        Text("إغلاق")
                            .font(.system(size: 12, weight: .black))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.white.opacity(0.06))
                            .overlay(
                                Capsule()
                                    .stroke(Color.white.opacity(0.12), lineWidth: 1)
                            )
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .padding(.top, 12)
                    .padding(.leading, 12)

                    VStack(alignment: .trailing, spacing: 3) {
                        Text(video.creatorHandle)
                            .font(.system(size: 15, weight: .black))
                            .foregroundStyle(.white)
                        Text(video.creatorName)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.76))
                        if !video.caption.isEmpty {
                            Text(video.caption)
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(.white.opacity(0.94))
                                .lineLimit(2)
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.bottom, 14)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                }

                VStack(alignment: .trailing, spacing: 12) {
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("التعليقات")
                            .font(.system(size: 16, weight: .black))
                            .foregroundStyle(.white)
                        Text(video.comments.isEmpty ? "لا توجد تعليقات بعد" : "\(video.comments.count) تعليق")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.62))
                    }

                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 10) {
                            if video.comments.isEmpty {
                                Text("كن أول من يكتب تعليقًا على هذا الفيديو.")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(.white.opacity(0.66))
                                    .frame(maxWidth: .infinity)
                                    .padding(16)
                                    .background(Color.white.opacity(0.04))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            } else {
                                ForEach(Array(video.comments.reversed())) { comment in
                                    VStack(alignment: .trailing, spacing: 7) {
                                        HStack {
                                            Text(comment.createdAt.formatted(date: .abbreviated, time: .omitted))
                                                .font(.system(size: 10, weight: .bold))
                                                .foregroundStyle(.white.opacity(0.48))
                                            Spacer()
                                            Text(comment.authorHandle)
                                                .font(.system(size: 12, weight: .black))
                                                .foregroundStyle(Color(red: 0.56, green: 0.83, blue: 1))
                                        }
                                        Text(comment.body)
                                            .font(.system(size: 13, weight: .medium))
                                            .foregroundStyle(.white)
                                            .frame(maxWidth: .infinity, alignment: .trailing)
                                            .lineSpacing(2)
                                    }
                                    .padding(12)
                                    .background(Color.white.opacity(0.05))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                                }
                            }
                        }
                    }

                    HStack(spacing: 10) {
                        Button(action: onSubmit) {
                            Text("إرسال")
                                .font(.system(size: 12, weight: .black))
                                .foregroundStyle(Color(red: 0.02, green: 0.07, blue: 0.13))
                                .padding(.horizontal, 16)
                                .padding(.vertical, 11)
                                .background(
                                    LinearGradient(
                                        colors: [Color(red: 0.34, green: 0.76, blue: 1), Color(red: 0.18, green: 0.54, blue: 1)],
                                        startPoint: .top,
                                        endPoint: .bottom
                                    )
                                )
                                .clipShape(Capsule())
                        }
                        .buttonStyle(.plain)
                        .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                        .opacity(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.46 : 1)

                        TextField("اكتب تعليقك هنا", text: $draft)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled(true)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                            .background(Color.white.opacity(0.05))
                            .overlay(
                                RoundedRectangle(cornerRadius: 999, style: .continuous)
                                    .stroke(Color.white.opacity(0.12), lineWidth: 1)
                            )
                            .clipShape(Capsule())
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 18)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(red: 0.03, green: 0.04, blue: 0.06))
            }
            .frame(maxWidth: 430)
            .frame(height: UIScreen.main.bounds.height - 84)
        }
    }
}

struct TikTokSwiftUploadComposer: View {
    @Binding var caption: String
    @Binding var selectedTheme: TikTokSwiftVideoTheme
    let onCancel: () -> Void
    let onCreate: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .trailing, spacing: 18) {
                    TikTokSwiftPosterView(theme: selectedTheme, icon: selectedTheme.icon, caption: caption)
                        .frame(height: 220)
                        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))

                    VStack(alignment: .trailing, spacing: 10) {
                        Text("الوصف")
                            .font(.system(size: 14, weight: .black))
                            .foregroundStyle(.white)

                        TextField("اكتب وصف الفيديو", text: $caption, axis: .vertical)
                            .lineLimit(3, reservesSpace: true)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled(true)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(.white)
                            .padding(14)
                            .background(Color.white.opacity(0.06))
                            .overlay(
                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }

                    VStack(alignment: .trailing, spacing: 10) {
                        Text("الثيم")
                            .font(.system(size: 14, weight: .black))
                            .foregroundStyle(.white)

                        HStack(spacing: 10) {
                            ForEach(TikTokSwiftVideoTheme.allCases) { theme in
                                Button {
                                    selectedTheme = theme
                                } label: {
                                    VStack(spacing: 8) {
                                        Circle()
                                            .fill(LinearGradient(colors: theme.colors, startPoint: .topLeading, endPoint: .bottomTrailing))
                                            .frame(width: 42, height: 42)
                                            .overlay(
                                                Image(systemName: theme.icon)
                                                    .font(.system(size: 16, weight: .bold))
                                                    .foregroundStyle(.white)
                                            )

                                        Text(theme.title)
                                            .font(.system(size: 11, weight: .bold))
                                            .foregroundStyle(.white)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(selectedTheme == theme ? Color.white.opacity(0.1) : Color.white.opacity(0.04))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                                            .stroke(Color.white.opacity(selectedTheme == theme ? 0.16 : 0.06), lineWidth: 1)
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    Button(action: onCreate) {
                        Text("إنشاء فيديو محلي")
                            .font(.system(size: 14, weight: .black))
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
            .background(Color.black.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("إغلاق", action: onCancel)
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(.white)
                }

                ToolbarItem(placement: .principal) {
                    Text("إضافة فيديو")
                        .font(.system(size: 16, weight: .black))
                        .foregroundStyle(.white)
                }
            }
        }
        .preferredColorScheme(.dark)
        .environment(\.layoutDirection, .rightToLeft)
    }
}

enum TikTokSwiftFormatter {
    static func count(_ value: Int) -> String {
        if value >= 1_000_000 {
            return String(format: "%.1fm", Double(value) / 1_000_000)
        }

        if value >= 1_000 {
            return String(format: "%.1fk", Double(value) / 1_000)
        }

        return String(value)
    }
}

struct TikTokSwiftView_Previews: PreviewProvider {
    static var previews: some View {
        TikTokSwiftView(cameraRequestKey: 0, isLoggedIn: true, onRequireAuth: {})
            .environment(\.layoutDirection, .rightToLeft)
    }
}