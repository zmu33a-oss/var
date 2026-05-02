import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

private struct XSwiftGroupChat: Identifiable {
    let id: Int
    let name: String
    let lastMessage: String
    let time: String
    let unread: Int
}

private enum XSwiftShareMode {
    case system
    case copyLink
    case copyPost
}

private struct XSwiftSharePayload: Identifiable {
    let id = UUID()
    let items: [Any]
}

struct XSwiftView: View {
    @Binding var posts: [AppSwiftPost]

    let isLoggedIn: Bool
    let onRequireAuth: () -> Void
    let onOpenComposer: () -> Void
    let onOpenChat: () -> Void

    @State private var isTopTabOpen = false
    @State private var isProfileOpen = false
    @State private var selectedPostID: Int?
    @State private var commentDrafts: [Int: String] = [:]
    @State private var editingCommentID: String?
    @State private var editCommentDrafts: [String: String] = [:]
    @State private var blockedHandles: [String] = []
    @State private var actionToast = ""
    @State private var menuPostID: Int?
    @State private var repostPanelPostID: Int?
    @State private var sharePanelPostID: Int?
    @State private var shareFeedbackPostID: Int?
    @State private var shareFeedbackLabel = ""
    @State private var sharePayload: XSwiftSharePayload?

    private let groupChats: [XSwiftGroupChat] = [
        XSwiftGroupChat(id: 1, name: "زميع :", lastMessage: "فوق الجميع ياو ياو", time: "2د", unread: 3),
        XSwiftGroupChat(id: 2, name: "عائلة البرمجة", lastMessage: "التنسيق صار ممتاز", time: "15د", unread: 1),
        XSwiftGroupChat(id: 3, name: "مشروع X-New", lastMessage: "ضيفوا صورة داخل التغريدة", time: "1س", unread: 5)
    ]

    private var visiblePosts: [AppSwiftPost] {
        posts.filter { !blockedHandles.contains($0.handle) }
    }

    private var selectedPost: AppSwiftPost? {
        visiblePosts.first(where: { $0.id == selectedPostID })
    }

    private var currentAuthorName: String {
        "VAR X"
    }

    private var currentAuthorHandle: String {
        "@varx"
    }

    private var totalLikes: Int {
        posts.reduce(0) { $0 + max(0, $1.likes) }
    }

    var body: some View {
        ZStack(alignment: .top) {
            Color.black
                .ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                LazyVStack(spacing: 0) {
                    Color.clear
                        .frame(height: isTopTabOpen ? 286 : 170)

                    if visiblePosts.isEmpty {
                        XSwiftEmptyState(
                            isLoggedIn: isLoggedIn,
                            onRequireAuth: onRequireAuth,
                            onOpenComposer: onOpenComposer
                        )
                        .padding(.horizontal, 16)
                        .padding(.top, 24)
                    } else {
                        ForEach(visiblePosts) { post in
                            XSwiftPostRow(
                                post: post,
                                isMenuOpen: menuPostID == post.id,
                                isRepostPanelOpen: repostPanelPostID == post.id,
                                isSharePanelOpen: sharePanelPostID == post.id,
                                shareFeedbackLabel: shareFeedbackPostID == post.id ? shareFeedbackLabel : nil,
                                onOpen: {
                                    openPostDetail(post.id)
                                },
                                onToggleMenu: {
                                    togglePostMenu(post.id)
                                },
                                onLike: {
                                    guardAuth {
                                        handleLike(post.id)
                                    }
                                },
                                onComment: {
                                    guardAuth {
                                        openPostDetail(post.id)
                                    }
                                },
                                onToggleRepostPanel: {
                                    guardAuth {
                                        sharePanelPostID = nil
                                        repostPanelPostID = repostPanelPostID == post.id ? nil : post.id
                                    }
                                },
                                onToggleSharePanel: {
                                    guardAuth {
                                        repostPanelPostID = nil
                                        sharePanelPostID = sharePanelPostID == post.id ? nil : post.id
                                    }
                                },
                                onRepost: {
                                    guardAuth {
                                        handleRepost(post.id)
                                    }
                                },
                                onShareAction: { mode in
                                    guardAuth {
                                        handleShareAction(post.id, mode: mode)
                                    }
                                },
                                onReport: {
                                    reportPost(post)
                                },
                                onBlock: {
                                    blockUser(post)
                                }
                            )
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                        }
                    }
                }
                .padding(.bottom, 18)
            }

            VStack(spacing: 8) {
                XSwiftTopDrawer(
                    isOpen: $isTopTabOpen,
                    chats: groupChats,
                    onOpenComposer: onOpenComposer,
                    onOpenChat: {
                        guardAuth {
                            onOpenChat()
                        }
                    }
                )

                XSwiftHeaderBar(
                    onOpenProfile: {
                        withAnimation(.spring(response: 0.32, dampingFraction: 0.86)) {
                            isProfileOpen = true
                        }
                    },
                    onOpenComposer: onOpenComposer
                )
            }
            .padding(.top, 60)
            .padding(.horizontal, 12)

            if isProfileOpen {
                Color.black.opacity(0.58)
                    .ignoresSafeArea()
                    .onTapGesture {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            isProfileOpen = false
                        }
                    }

                HStack(spacing: 0) {
                    XSwiftProfileDrawer(
                        displayName: currentAuthorName,
                        handle: currentAuthorHandle,
                        postsCount: posts.count,
                        totalLikes: totalLikes,
                        blockedCount: blockedHandles.count,
                        onClose: {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                isProfileOpen = false
                            }
                        },
                        onOpenComposer: onOpenComposer
                    )
                    .frame(width: min(UIScreen.main.bounds.width * 0.78, 330))

                    Spacer(minLength: 0)
                }
                .transition(.move(edge: .trailing).combined(with: .opacity))
            }

            if let selectedPost {
                XSwiftPostDetailOverlay(
                    post: selectedPost,
                    commentDraft: commentDraftBinding(for: selectedPost.id),
                    editingCommentID: $editingCommentID,
                    editCommentDrafts: $editCommentDrafts,
                    currentAuthorHandle: currentAuthorHandle,
                    onClose: closePostDetail,
                    onSubmitComment: {
                        guardAuth {
                            submitComment(postID: selectedPost.id)
                        }
                    },
                    onStartEditing: { comment in
                        editingCommentID = comment.id
                        editCommentDrafts[comment.id] = comment.text
                    },
                    onCancelEditing: { commentID in
                        if editingCommentID == commentID {
                            editingCommentID = nil
                        }
                    },
                    onSaveEditedComment: { commentID in
                        guardAuth {
                            saveEditedComment(postID: selectedPost.id, commentID: commentID)
                        }
                    },
                    onDeleteComment: { commentID in
                        guardAuth {
                            deleteComment(postID: selectedPost.id, commentID: commentID)
                        }
                    }
                )
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .zIndex(10)
            }

            if !actionToast.isEmpty {
                VStack {
                    Spacer()

                    Text(actionToast)
                        .font(.system(size: 12, weight: .black))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(Color(red: 0.08, green: 0.1, blue: 0.14).opacity(0.96))
                        .overlay(
                            Capsule()
                                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                        )
                        .clipShape(Capsule())
                        .padding(.bottom, 18)
                }
                .padding(.horizontal, 24)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .allowsHitTesting(false)
            }
        }
        .preferredColorScheme(.dark)
        .sheet(item: $sharePayload) { payload in
    #if canImport(UIKit)
            XSwiftShareSheet(activityItems: payload.items)
    #endif
        }
        .onChange(of: actionToast) { nextValue in
            guard !nextValue.isEmpty else {
                return
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) {
                if actionToast == nextValue {
                    actionToast = ""
                }
            }
        }
        .onChange(of: shareFeedbackPostID) { nextValue in
            guard let nextValue else {
                return
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                if shareFeedbackPostID == nextValue {
                    shareFeedbackPostID = nil
                    shareFeedbackLabel = ""
                }
            }
        }
    }

    private func guardAuth(_ action: () -> Void) {
        guard isLoggedIn else {
            onRequireAuth()
            return
        }

        action()
    }

    private func commentDraftBinding(for postID: Int) -> Binding<String> {
        Binding(
            get: { commentDrafts[postID] ?? "" },
            set: { commentDrafts[postID] = $0 }
        )
    }

    private func updatePost(_ postID: Int, mutation: (inout AppSwiftPost) -> Void) {
        guard let index = posts.firstIndex(where: { $0.id == postID }) else {
            return
        }

        mutation(&posts[index])
    }

    private func openPostDetail(_ postID: Int) {
        menuPostID = nil
        repostPanelPostID = nil
        sharePanelPostID = nil
        selectedPostID = postID
    }

    private func closePostDetail() {
        selectedPostID = nil
        editingCommentID = nil
    }

    private func handleLike(_ postID: Int) {
        updatePost(postID) { post in
            post.likedByMe.toggle()
            post.likes = max(0, post.likes + (post.likedByMe ? 1 : -1))
        }
    }

    private func handleRepost(_ postID: Int) {
        updatePost(postID) { post in
            post.repostedByMe.toggle()
            post.reposts = max(0, post.reposts + (post.repostedByMe ? 1 : -1))
        }

        repostPanelPostID = nil
        sharePanelPostID = nil
    }

    private func submitComment(postID: Int) {
        let trimmedComment = commentDrafts[postID]?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !trimmedComment.isEmpty else {
            return
        }

        updatePost(postID) { post in
            post.comments.append(
                AppSwiftPostComment(
                    id: "\(postID)-\(Date().timeIntervalSince1970)",
                    authorName: currentAuthorName,
                    authorHandle: currentAuthorHandle,
                    text: trimmedComment
                )
            )
            post.replies = post.comments.count
        }

        commentDrafts[postID] = ""
    }

    private func saveEditedComment(postID: Int, commentID: String) {
        let trimmedComment = editCommentDrafts[commentID]?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !trimmedComment.isEmpty else {
            return
        }

        updatePost(postID) { post in
            guard let commentIndex = post.comments.firstIndex(where: { $0.id == commentID }) else {
                return
            }

            post.comments[commentIndex].text = trimmedComment
        }

        editingCommentID = nil
    }

    private func deleteComment(postID: Int, commentID: String) {
        updatePost(postID) { post in
            post.comments.removeAll(where: { $0.id == commentID })
            post.replies = post.comments.count
        }

        if editingCommentID == commentID {
            editingCommentID = nil
        }
    }

    private func togglePostMenu(_ postID: Int) {
        repostPanelPostID = nil
        sharePanelPostID = nil
        menuPostID = menuPostID == postID ? nil : postID
    }

    private func reportPost(_ post: AppSwiftPost) {
        menuPostID = nil
        actionToast = "تم إرسال البلاغ على التغريدة"
        if selectedPostID == post.id {
            editingCommentID = nil
        }
    }

    private func blockUser(_ post: AppSwiftPost) {
        if !blockedHandles.contains(post.handle) {
            blockedHandles.append(post.handle)
        }

        menuPostID = nil
        actionToast = "تم حظر \(post.user)"

        if selectedPostID == post.id {
            closePostDetail()
        }
    }

    private func handleShareAction(_ postID: Int, mode: XSwiftShareMode) {
        guard let post = posts.first(where: { $0.id == postID }) else {
            return
        }

        let shareLink = "https://webplus.local/x/\(post.id)"
        let shareText: String
        switch mode {
        case .copyLink:
            shareText = shareLink
        case .copyPost, .system:
            shareText = "\(post.content)\n\(shareLink)"
        }

        switch mode {
        case .copyLink:
            copyText(shareText)
            shareFeedbackLabel = "تم نسخ الرابط"
            actionToast = "تم نسخ الرابط"
        case .copyPost:
            copyText(shareText)
            shareFeedbackLabel = "تم نسخ التغريدة"
            actionToast = "تم نسخ نص التغريدة"
        case .system:
#if canImport(UIKit)
            sharePayload = XSwiftSharePayload(items: [shareText])
            shareFeedbackLabel = "تم فتح المشاركة"
            actionToast = "تم فتح المشاركة"
#else
            copyText(shareText)
            shareFeedbackLabel = "تم نسخ التغريدة"
            actionToast = "تم نسخ نص التغريدة"
#endif
        }

        updatePost(postID) { currentPost in
            if !currentPost.sharedByMe {
                currentPost.sharedByMe = true
                currentPost.shares += 1
            }
        }

        sharePanelPostID = nil
        repostPanelPostID = nil
        shareFeedbackPostID = postID
    }

    private func copyText(_ value: String) {
#if canImport(UIKit)
        UIPasteboard.general.string = value
#endif
    }
}

private struct XSwiftTopDrawer: View {
    @Binding var isOpen: Bool

    let chats: [XSwiftGroupChat]
    let onOpenComposer: () -> Void
    let onOpenChat: () -> Void

    private var totalUnread: Int {
        chats.reduce(0) { $0 + $1.unread }
    }

    var body: some View {
        VStack(alignment: .trailing, spacing: 10) {
            Button {
                withAnimation(.spring(response: 0.36, dampingFraction: 0.86)) {
                    isOpen.toggle()
                }
            } label: {
                HStack(spacing: 10) {
                    Text(totalUnread > 0 ? "\(totalUnread)" : "0")
                        .font(.system(size: 11, weight: .black))
                        .foregroundStyle(.black)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.white)
                        .clipShape(Capsule())

                    Spacer()

                    VStack(alignment: .trailing, spacing: 3) {
                        Text(isOpen ? "إخفاء الدردشات" : "آخر الإشعارات والمجموعات")
                            .font(.system(size: 14, weight: .black))
                            .foregroundStyle(.white)
                        Text("شريط علوي شبيه بصفحة X الحالية")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.58))
                    }

                    Image(systemName: isOpen ? "chevron.up" : "chevron.down")
                        .font(.system(size: 13, weight: .black))
                        .foregroundStyle(.white)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(Color(red: 0.05, green: 0.07, blue: 0.1).opacity(0.96))
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            }
            .buttonStyle(.plain)

            if isOpen {
                VStack(alignment: .trailing, spacing: 12) {
                    HStack(spacing: 8) {
                        XSwiftQuickChip(title: "منشور جديد", systemImage: "square.and.pencil", action: onOpenComposer)
                        XSwiftQuickChip(title: "الدردشة", systemImage: "bubble.left.and.bubble.right.fill", action: onOpenChat)
                        XSwiftQuickChip(title: "بحث", systemImage: "magnifyingglass", action: {})
                    }

                    ForEach(chats) { chat in
                        HStack(spacing: 10) {
                            if chat.unread > 0 {
                                Text("\(chat.unread)")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundStyle(.black)
                                    .frame(width: 22, height: 22)
                                    .background(Color.white)
                                    .clipShape(Circle())
                            }

                            Spacer()

                            VStack(alignment: .trailing, spacing: 4) {
                                HStack(spacing: 6) {
                                    Text(chat.time)
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(.white.opacity(0.5))
                                    Text(chat.name)
                                        .font(.system(size: 13, weight: .black))
                                        .foregroundStyle(.white)
                                }

                                Text(chat.lastMessage)
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(.white.opacity(0.7))
                                    .lineLimit(1)
                            }

                            Circle()
                                .fill(Color(red: 0.24, green: 0.67, blue: 0.98).opacity(0.26))
                                .frame(width: 42, height: 42)
                                .overlay(
                                    Image(systemName: "bubble.left.and.bubble.right.fill")
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundStyle(Color(red: 0.56, green: 0.86, blue: 1))
                                )
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        .background(Color.white.opacity(0.04))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(Color.white.opacity(0.06), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }
                }
                .padding(14)
                .background(Color(red: 0.03, green: 0.05, blue: 0.08).opacity(0.98))
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
    }
}

private struct XSwiftHeaderBar: View {
    let onOpenProfile: () -> Void
    let onOpenComposer: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onOpenComposer) {
                Image(systemName: "square.and.pencil")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 38, height: 38)
                    .background(Color.white.opacity(0.06))
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text("VAR X")
                    .font(.system(size: 20, weight: .black, design: .monospaced))
                    .foregroundStyle(.white)
                    .tracking(2)

                Text("#الهلال × النصر — الأجواء حماسية قبل بداية المباراة")
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.72))
                    .lineLimit(1)
            }

            Spacer()

            Button(action: onOpenProfile) {
                ZStack(alignment: .bottomTrailing) {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color(red: 0.32, green: 0.72, blue: 1), Color(red: 0.13, green: 0.24, blue: 0.46)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 38, height: 38)
                        .overlay(
                            Text("V")
                                .font(.system(size: 15, weight: .black))
                                .foregroundStyle(.white)
                        )

                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color(red: 0.52, green: 0.84, blue: 1))
                        .background(Color.black.clipShape(Circle()))
                }
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Color.black.opacity(0.86))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }
}

private struct XSwiftPostRow: View {
    let post: AppSwiftPost
    let isMenuOpen: Bool
    let isRepostPanelOpen: Bool
    let isSharePanelOpen: Bool
    let shareFeedbackLabel: String?
    let onOpen: () -> Void
    let onToggleMenu: () -> Void
    let onLike: () -> Void
    let onComment: () -> Void
    let onToggleRepostPanel: () -> Void
    let onToggleSharePanel: () -> Void
    let onRepost: () -> Void
    let onShareAction: (XSwiftShareMode) -> Void
    let onReport: () -> Void
    let onBlock: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .trailing, spacing: 12) {
                HStack(alignment: .top, spacing: 8) {
                    Button(action: onToggleMenu) {
                        Image(systemName: "ellipsis")
                            .font(.system(size: 15, weight: .black))
                            .foregroundStyle(.white.opacity(0.8))
                            .padding(8)
                            .background(Color.white.opacity(0.04))
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)

                    Spacer(minLength: 0)

                    VStack(alignment: .trailing, spacing: 4) {
                        HStack(spacing: 6) {
                            Text("• \(post.time)")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(.white.opacity(0.5))

                            Text(post.handle)
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(.white.opacity(0.68))

                            if isVerified(post) {
                                Image(systemName: "checkmark.seal.fill")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(Color(red: 0.52, green: 0.84, blue: 1))
                            }

                            Text(post.user)
                                .font(.system(size: 15, weight: .black))
                                .foregroundStyle(.white)
                        }

                        VStack(alignment: .trailing, spacing: 10) {
                            Text(post.content)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(.white.opacity(0.94))
                                .frame(maxWidth: .infinity, alignment: .trailing)
                                .lineSpacing(2)

                            if shouldShowMedia(for: post) {
                                XSwiftMediaCard(post: post)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture(perform: onOpen)
                    }
                }

                if isMenuOpen {
                    HStack(spacing: 8) {
                        Button(action: onReport) {
                            XSwiftMenuButton(title: "تبليغ على التغريدة", systemImage: "flag.fill", tint: .white)
                        }
                        .buttonStyle(.plain)

                        Button(action: onBlock) {
                            XSwiftMenuButton(title: "حظر اليوزر", systemImage: "hand.raised.fill", tint: Color(red: 1, green: 0.54, blue: 0.5))
                        }
                        .buttonStyle(.plain)
                    }
                }

                HStack(spacing: 8) {
                    XSwiftActionPill(systemImage: "message.fill", value: post.replies, tint: post.replies > 0 ? Color(red: 0.43, green: 0.86, blue: 0.56) : .white.opacity(0.72), action: onComment)
                    XSwiftActionPill(systemImage: "arrow.2.squarepath", value: post.reposts, tint: post.repostedByMe ? Color(red: 0.46, green: 0.92, blue: 0.68) : .white.opacity(0.72), action: onToggleRepostPanel)
                    XSwiftActionPill(systemImage: "heart.fill", value: post.likes, tint: post.likedByMe ? Color(red: 1, green: 0.37, blue: 0.52) : .white.opacity(0.72), action: onLike)
                    XSwiftActionPill(systemImage: "paperplane.fill", value: post.shares, tint: post.sharedByMe ? Color(red: 0.45, green: 0.82, blue: 1) : .white.opacity(0.72), action: onToggleSharePanel)
                }

                if let shareFeedbackLabel {
                    Text(shareFeedbackLabel)
                        .font(.system(size: 11, weight: .black))
                        .foregroundStyle(Color(red: 0.46, green: 0.86, blue: 1))
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }

                if isRepostPanelOpen {
                    XSwiftInlinePanel(
                        title: post.repostedByMe ? "أنت أعدت نشر هذه التغريدة" : "إعادة نشر هذه التغريدة",
                        buttons: [
                            XSwiftInlinePanelButton(title: post.repostedByMe ? "إلغاء إعادة النشر" : "إعادة نشر", action: onRepost)
                        ]
                    )
                }

                if isSharePanelOpen {
                    XSwiftInlinePanel(
                        title: "اختر طريقة المشاركة",
                        buttons: [
                            XSwiftInlinePanelButton(title: "مشاركة النظام", action: { onShareAction(.system) }),
                            XSwiftInlinePanelButton(title: "نسخ الرابط", action: { onShareAction(.copyLink) }),
                            XSwiftInlinePanelButton(title: "نسخ نص التغريدة", action: { onShareAction(.copyPost) })
                        ]
                    )
                }
            }

            XSwiftAvatarView(initial: post.userInitial, highlighted: isOwnPost(post))
                .onTapGesture(perform: onOpen)
        }
        .padding(14)
        .background(Color.white.opacity(0.03))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    private func isVerified(_ post: AppSwiftPost) -> Bool {
        let handle = post.handle.lowercased()
        return handle.contains("var") || handle.contains("webplus")
    }

    private func isOwnPost(_ post: AppSwiftPost) -> Bool {
        ["@varx", "@xtik", "@xtik_user"].contains(post.handle.lowercased())
    }

    private func shouldShowMedia(for post: AppSwiftPost) -> Bool {
        post.id % 2 == 1 || post.content.count > 60
    }
}

private struct XSwiftPostDetailOverlay: View {
    let post: AppSwiftPost
    @Binding var commentDraft: String
    @Binding var editingCommentID: String?
    @Binding var editCommentDrafts: [String: String]
    let currentAuthorHandle: String
    let onClose: () -> Void
    let onSubmitComment: () -> Void
    let onStartEditing: (AppSwiftPostComment) -> Void
    let onCancelEditing: (String) -> Void
    let onSaveEditedComment: (String) -> Void
    let onDeleteComment: (String) -> Void

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.black.opacity(0.84)
                .ignoresSafeArea()
                .onTapGesture(perform: onClose)

            VStack(spacing: 0) {
                HStack {
                    Button(action: onClose) {
                        Text("إلغاء")
                            .font(.system(size: 12, weight: .black))
                            .foregroundStyle(.white)
                    }
                    .buttonStyle(.plain)

                    Spacer()

                    Button(action: onSubmitComment) {
                        Text("نشر")
                            .font(.system(size: 12, weight: .black))
                            .foregroundStyle(.black)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.white)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .disabled(commentDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .opacity(commentDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.45 : 1)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .overlay(alignment: .bottom) {
                    Rectangle()
                        .fill(Color.white.opacity(0.06))
                        .frame(height: 1)
                }

                ScrollView(showsIndicators: false) {
                    VStack(alignment: .trailing, spacing: 16) {
                        VStack(alignment: .trailing, spacing: 10) {
                            HStack(spacing: 8) {
                                Text(post.time)
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundStyle(.white.opacity(0.5))
                                Text(post.handle)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(.white.opacity(0.68))
                                Text(post.user)
                                    .font(.system(size: 16, weight: .black))
                                    .foregroundStyle(.white)
                            }

                            Text(post.content)
                                .font(.system(size: 16, weight: .medium))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity, alignment: .trailing)
                                .lineSpacing(3)

                            if post.id % 2 == 1 || post.content.count > 60 {
                                XSwiftMediaCard(post: post)
                            }

                            Text("ردًا على \(post.handle)")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(Color(red: 0.46, green: 0.82, blue: 1))
                        }
                        .padding(16)
                        .background(Color.white.opacity(0.04))
                        .overlay(
                            RoundedRectangle(cornerRadius: 22, style: .continuous)
                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))

                        VStack(alignment: .trailing, spacing: 12) {
                            Text(post.comments.isEmpty ? "لا توجد ردود بعد" : "الردود")
                                .font(.system(size: 15, weight: .black))
                                .foregroundStyle(.white)

                            if post.comments.isEmpty {
                                Text("اكتب أول رد على هذه التغريدة من الأسفل.")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(.white.opacity(0.62))
                                    .frame(maxWidth: .infinity, alignment: .trailing)
                                    .padding(16)
                                    .background(Color.white.opacity(0.04))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                                            .stroke(Color.white.opacity(0.06), lineWidth: 1)
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                            } else {
                                ForEach(post.comments) { comment in
                                    VStack(alignment: .trailing, spacing: 8) {
                                        HStack(spacing: 8) {
                                            if comment.authorHandle == currentAuthorHandle {
                                                Button(action: { onDeleteComment(comment.id) }) {
                                                    Text("حذف")
                                                        .font(.system(size: 11, weight: .black))
                                                        .foregroundStyle(Color(red: 1, green: 0.52, blue: 0.48))
                                                }
                                                .buttonStyle(.plain)

                                                Button(action: {
                                                    if editingCommentID == comment.id {
                                                        onCancelEditing(comment.id)
                                                    } else {
                                                        onStartEditing(comment)
                                                    }
                                                }) {
                                                    Text(editingCommentID == comment.id ? "إلغاء" : "تعديل")
                                                        .font(.system(size: 11, weight: .black))
                                                        .foregroundStyle(Color(red: 0.46, green: 0.82, blue: 1))
                                                }
                                                .buttonStyle(.plain)
                                            }

                                            Spacer()

                                            VStack(alignment: .trailing, spacing: 3) {
                                                Text(comment.authorHandle)
                                                    .font(.system(size: 11, weight: .bold))
                                                    .foregroundStyle(.white.opacity(0.58))
                                                Text(comment.authorName)
                                                    .font(.system(size: 13, weight: .black))
                                                    .foregroundStyle(.white)
                                            }
                                        }

                                        if editingCommentID == comment.id {
                                            TextField("تعديل التعليق", text: Binding(
                                                get: { editCommentDrafts[comment.id] ?? comment.text },
                                                set: { editCommentDrafts[comment.id] = $0 }
                                            ))
                                            .textInputAutocapitalization(.never)
                                            .autocorrectionDisabled(true)
                                            .font(.system(size: 13, weight: .medium))
                                            .foregroundStyle(.white)
                                            .padding(.horizontal, 14)
                                            .padding(.vertical, 12)
                                            .background(Color.white.opacity(0.04))
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 16, style: .continuous)
                                                    .stroke(Color.white.opacity(0.06), lineWidth: 1)
                                            )
                                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                                            Button(action: { onSaveEditedComment(comment.id) }) {
                                                Text("حفظ")
                                                    .font(.system(size: 11, weight: .black))
                                                    .foregroundStyle(.black)
                                                    .padding(.horizontal, 16)
                                                    .padding(.vertical, 10)
                                                    .background(Color.white)
                                                    .clipShape(Capsule())
                                            }
                                            .buttonStyle(.plain)
                                        } else {
                                            Text(comment.text)
                                                .font(.system(size: 13, weight: .medium))
                                                .foregroundStyle(.white.opacity(0.94))
                                                .frame(maxWidth: .infinity, alignment: .trailing)
                                        }
                                    }
                                    .padding(14)
                                    .background(Color.white.opacity(0.04))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                                            .stroke(Color.white.opacity(0.06), lineWidth: 1)
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                                }
                            }
                        }
                    }
                    .padding(16)
                }

                HStack(spacing: 10) {
                    Button(action: onSubmitComment) {
                        Text("رد")
                            .font(.system(size: 12, weight: .black))
                            .foregroundStyle(.black)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background(Color.white)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .disabled(commentDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .opacity(commentDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.45 : 1)

                    TextField("اكتب ردك هنا", text: $commentDraft)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        .background(Color.white.opacity(0.05))
                        .overlay(
                            RoundedRectangle(cornerRadius: 999, style: .continuous)
                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        )
                        .clipShape(Capsule())
                }
                .padding(16)
                .background(Color(red: 0.03, green: 0.04, blue: 0.06))
                .overlay(alignment: .top) {
                    Rectangle()
                        .fill(Color.white.opacity(0.06))
                        .frame(height: 1)
                }
            }
            .frame(maxWidth: 430)
            .frame(maxHeight: UIScreen.main.bounds.height - 86)
            .background(Color(red: 0.02, green: 0.03, blue: 0.05))
            .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        }
    }
}

private struct XSwiftProfileDrawer: View {
    let displayName: String
    let handle: String
    let postsCount: Int
    let totalLikes: Int
    let blockedCount: Int
    let onClose: () -> Void
    let onOpenComposer: () -> Void

    var body: some View {
        VStack(alignment: .trailing, spacing: 18) {
            HStack {
                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(.white)
                        .frame(width: 34, height: 34)
                        .background(Color.white.opacity(0.05))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)

                Spacer()
            }

            VStack(alignment: .trailing, spacing: 8) {
                XSwiftAvatarView(initial: String(displayName.prefix(1)), highlighted: true)
                Text(displayName)
                    .font(.system(size: 24, weight: .black))
                    .foregroundStyle(.white)
                Text(handle)
                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                    .foregroundStyle(Color(red: 0.52, green: 0.84, blue: 1))
                Text("نسخة SwiftUI أولى لواجهة X مع التغريدات والردود والقوائم الجانبية.")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.68))
                    .lineSpacing(2)
            }

            HStack(spacing: 10) {
                XSwiftDrawerStat(title: "محظور", value: "\(blockedCount)")
                XSwiftDrawerStat(title: "إعجاب", value: "\(totalLikes)")
                XSwiftDrawerStat(title: "منشور", value: "\(postsCount)")
            }

            Button(action: onOpenComposer) {
                Text("منشور جديد")
                    .font(.system(size: 14, weight: .black))
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
            .buttonStyle(.plain)

            VStack(alignment: .trailing, spacing: 10) {
                XSwiftDrawerLink(title: "الإشعارات", systemImage: "bell.fill")
                XSwiftDrawerLink(title: "الرسائل", systemImage: "envelope.fill")
                XSwiftDrawerLink(title: "المحفوظات", systemImage: "bookmark.fill")
                XSwiftDrawerLink(title: "الإعدادات", systemImage: "slider.horizontal.3")
            }

            Spacer()
        }
        .padding(20)
        .frame(maxHeight: .infinity)
        .background(Color(red: 0.03, green: 0.04, blue: 0.06))
        .overlay(alignment: .leading) {
            Rectangle()
                .fill(Color.white.opacity(0.06))
                .frame(width: 1)
        }
    }
}

private struct XSwiftEmptyState: View {
    let isLoggedIn: Bool
    let onRequireAuth: () -> Void
    let onOpenComposer: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "bubble.left.and.bubble.right.fill")
                .font(.system(size: 40, weight: .black))
                .foregroundStyle(.white)

            Text("لا توجد تغريدات مرئية الآن")
                .font(.system(size: 16, weight: .black))
                .foregroundStyle(.white)

            Button {
                if isLoggedIn {
                    onOpenComposer()
                } else {
                    onRequireAuth()
                }
            } label: {
                Text(isLoggedIn ? "إنشاء منشور" : "سجل الدخول أولاً")
                    .font(.system(size: 13, weight: .black))
                    .foregroundStyle(.black)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 12)
                    .background(Color.white)
                    .clipShape(Capsule())
            }
            .buttonStyle(.plain)
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(Color.white.opacity(0.04))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }
}

private struct XSwiftAvatarView: View {
    let initial: String
    let highlighted: Bool

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    LinearGradient(
                        colors: highlighted
                            ? [Color(red: 0.38, green: 0.78, blue: 1), Color(red: 0.13, green: 0.26, blue: 0.5)]
                            : [Color.white.opacity(0.16), Color.white.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 44, height: 44)
                .overlay(
                    Text(initial)
                        .font(.system(size: 16, weight: .black))
                        .foregroundStyle(.white)
                )

            if highlighted {
                Circle()
                    .stroke(Color.white.opacity(0.8), lineWidth: 1.5)
                    .frame(width: 48, height: 48)
            }
        }
    }
}

private struct XSwiftActionPill: View {
    let systemImage: String
    let value: Int
    let tint: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Text("\(value)")
                    .font(.system(size: 11, weight: .black))
                Image(systemName: systemImage)
                    .font(.system(size: 13, weight: .bold))
            }
            .foregroundStyle(tint)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(Color.white.opacity(0.04))
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

private struct XSwiftInlinePanelButton: Identifiable {
    let id = UUID()
    let title: String
    let action: () -> Void
}

private struct XSwiftInlinePanel: View {
    let title: String
    let buttons: [XSwiftInlinePanelButton]

    var body: some View {
        VStack(alignment: .trailing, spacing: 10) {
            Text(title)
                .font(.system(size: 12, weight: .black))
                .foregroundStyle(.white)

            ForEach(buttons) { button in
                Button(action: button.action) {
                    Text(button.title)
                        .font(.system(size: 12, weight: .black))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 11)
                        .background(Color.white.opacity(0.06))
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(12)
        .background(Color(red: 0.05, green: 0.06, blue: 0.09))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct XSwiftMenuButton: View {
    let title: String
    let systemImage: String
    let tint: Color

    var body: some View {
        HStack(spacing: 8) {
            Text(title)
                .font(.system(size: 12, weight: .black))
            Image(systemName: systemImage)
                .font(.system(size: 13, weight: .bold))
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.white.opacity(0.04))
        .clipShape(Capsule())
    }
}

private struct XSwiftMediaCard: View {
    let post: AppSwiftPost

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            LinearGradient(
                colors: [
                    Color(red: 0.12 + paletteSeed * 0.18, green: 0.2 + paletteSeed * 0.16, blue: 0.34 + paletteSeed * 0.2),
                    Color(red: 0.03, green: 0.06, blue: 0.12)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(spacing: 10) {
                Image(systemName: mediaSymbol)
                    .font(.system(size: 34, weight: .black))
                    .foregroundStyle(.white.opacity(0.9))
                Text(post.handle)
                    .font(.system(size: 12, weight: .black, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.2))
            }

            Text("Preview")
                .font(.system(size: 11, weight: .black))
                .foregroundStyle(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(Color.black.opacity(0.34))
                .clipShape(Capsule())
                .padding(12)
        }
        .frame(height: 180)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }

    private var paletteSeed: Double {
        Double(abs(post.id % 4)) / 5
    }

    private var mediaSymbol: String {
        switch post.id % 3 {
        case 0:
            return "sportscourt.fill"
        case 1:
            return "sparkles.tv.fill"
        default:
            return "figure.soccer"
        }
    }
}

private struct XSwiftDrawerStat: View {
    let title: String
    let value: String

    var body: some View {
        VStack(spacing: 6) {
            Text(value)
                .font(.system(size: 16, weight: .black))
                .foregroundStyle(.white)
            Text(title)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(.white.opacity(0.58))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color.white.opacity(0.04))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct XSwiftDrawerLink: View {
    let title: String
    let systemImage: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: systemImage)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(.white)
            Spacer()
            Text(title)
                .font(.system(size: 13, weight: .black))
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Color.white.opacity(0.04))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct XSwiftQuickChip: View {
    let title: String
    let systemImage: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: systemImage)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                Text(title)
                    .font(.system(size: 11, weight: .black))
                    .foregroundStyle(.white)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Color.white.opacity(0.04))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(Color.white.opacity(0.06), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private extension AppSwiftPost {
    var userInitial: String {
        let trimmed = user.trimmingCharacters(in: .whitespacesAndNewlines)
        return String(trimmed.prefix(1)).uppercased()
    }
}

struct XSwiftView_Previews: PreviewProvider {
    struct PreviewContainer: View {
        @State private var posts = AppSwiftPost.samples

        var body: some View {
            XSwiftView(posts: $posts, isLoggedIn: true, onRequireAuth: {}, onOpenComposer: {})
                .environment(\.layoutDirection, .rightToLeft)
        }
    }

    static var previews: some View {
        PreviewContainer()
    }
}

#if canImport(UIKit)
private struct XSwiftShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
#endif