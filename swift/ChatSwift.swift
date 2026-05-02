import SwiftUI

private struct ChatSwiftMember: Identifiable, Equatable {
    let id: String
    var displayName: String
    var email: String
    var isCreator: Bool
}

private struct ChatSwiftMessage: Identifiable, Equatable {
    let id: String
    let groupID: String
    let senderID: String
    var senderName: String
    var content: String
    var createdAt: Date
}

private struct ChatSwiftGroup: Identifiable, Equatable {
    let id: String
    var name: String
    var isPrivate: Bool
    var creatorID: String
    var avatarSymbol: String
    var lastMessage: String
    var lastMessageAt: Date
    var unread: Int
    var members: [ChatSwiftMember]

    static let samples: [ChatSwiftGroup] = [
        ChatSwiftGroup(
            id: "grp-hilal",
            name: "رابطة الهلال",
            isPrivate: false,
            creatorID: ChatSwiftSession.currentUserID,
            avatarSymbol: "moon.stars.fill",
            lastMessage: "ثبتوا جملة التشجيع الأساسية قبل البداية.",
            lastMessageAt: Date().addingTimeInterval(-240),
            unread: 1,
            members: [
                ChatSwiftSession.currentMember(isCreator: true),
                ChatSwiftMember(id: "member-1", displayName: "سلمان الزهراني", email: "hilalvoice@xtik.app", isCreator: false),
                ChatSwiftMember(id: "member-2", displayName: "جود", email: "bluecurve@xtik.app", isCreator: false)
            ]
        ),
        ChatSwiftGroup(
            id: "grp-dev",
            name: "عائلة البرمجة",
            isPrivate: false,
            creatorID: "member-3",
            avatarSymbol: "chevron.left.forwardslash.chevron.right",
            lastMessage: "تمت مزامنة صفحة Fans مع Supabase الآن.",
            lastMessageAt: Date().addingTimeInterval(-920),
            unread: 0,
            members: [
                ChatSwiftSession.currentMember(isCreator: false),
                ChatSwiftMember(id: "member-3", displayName: "WEBPLUS", email: "webplus@xtik.app", isCreator: true),
                ChatSwiftMember(id: "member-4", displayName: "Swift Build", email: "swift@xtik.app", isCreator: false)
            ]
        )
    ]
}

private enum ChatSwiftSession {
    static let currentUserID = "swift-varx-user"
    static let currentUserName = "VAR X"
    static let currentUserEmail = "varx@xtik.app"

    static func currentMember(isCreator: Bool) -> ChatSwiftMember {
        ChatSwiftMember(
            id: currentUserID,
            displayName: currentUserName,
            email: currentUserEmail,
            isCreator: isCreator
        )
    }
}

struct ChatSwiftView: View {
    let composer: AppSwiftComposer?
    let onConsumeComposer: () -> Void
    let onOpenPostComposer: () -> Void
    let onClose: () -> Void

    @State private var groups = ChatSwiftGroup.samples
    @State private var messagesByGroupID = ChatSwiftView.sampleMessages
    @State private var activeGroupID = ChatSwiftGroup.samples.first?.id
    @State private var messageDraft = ""
    @State private var groupSearch = ""
    @State private var showGroupDrawer = false
    @State private var showGroupDetails = false
    @State private var showNewGroup = false
    @State private var showNewDM = false
    @State private var newGroupName = ""
    @State private var dmTarget = ""
    @State private var dmDraft = ""
    @State private var feedbackMessage = ""

    private var filteredGroups: [ChatSwiftGroup] {
        let trimmedSearch = groupSearch.trimmingCharacters(in: .whitespacesAndNewlines)
        let baseGroups = groups.sorted { $0.lastMessageAt > $1.lastMessageAt }

        guard !trimmedSearch.isEmpty else {
            return baseGroups
        }

        return baseGroups.filter { group in
            group.name.localizedCaseInsensitiveContains(trimmedSearch) ||
                group.lastMessage.localizedCaseInsensitiveContains(trimmedSearch) ||
                group.members.contains {
                    $0.displayName.localizedCaseInsensitiveContains(trimmedSearch) ||
                        $0.email.localizedCaseInsensitiveContains(trimmedSearch)
                }
        }
    }

    private var activeGroupIndex: Int? {
        guard let activeGroupID else {
            return nil
        }

        return groups.firstIndex(where: { $0.id == activeGroupID })
    }

    private var activeGroup: ChatSwiftGroup? {
        guard let activeGroupIndex else {
            return nil
        }

        return groups[activeGroupIndex]
    }

    private var activeMessages: [ChatSwiftMessage] {
        guard let activeGroupID else {
            return []
        }

        return (messagesByGroupID[activeGroupID] ?? []).sorted { $0.createdAt < $1.createdAt }
    }

    private var canManageActiveGroup: Bool {
        activeGroup?.creatorID == ChatSwiftSession.currentUserID
    }

    var body: some View {
        ZStack {
            Color.clear

            HStack(spacing: 0) {
                sidebar
                    .frame(width: activeGroup == nil ? nil : 360)
                    .opacity(activeGroup != nil && showGroupDrawer ? 1 : (activeGroup != nil ? 0 : 1))
                    .offset(x: activeGroup != nil ? (showGroupDrawer ? 0 : 340) : 0)

                if let activeGroup {
                    chatThread(for: activeGroup)
                        .transition(.move(edge: .leading).combined(with: .opacity))
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(red: 0.04, green: 0.04, blue: 0.05))
            .clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )

            if !feedbackMessage.isEmpty {
                VStack {
                    Spacer()

                    Text(feedbackMessage)
                        .font(.system(size: 12, weight: .black))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(Color.black.opacity(0.82))
                        .overlay(
                            Capsule()
                                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                        )
                        .clipShape(Capsule())
                        .padding(.bottom, 18)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .allowsHitTesting(false)
            }
        }
        .frame(maxWidth: 430)
        .frame(maxHeight: UIScreen.main.bounds.height - 120)
        .onAppear {
            consumeComposerIfNeeded(composer)
        }
        .onChange(of: composer) { nextComposer in
            consumeComposerIfNeeded(nextComposer)
        }
        .onChange(of: feedbackMessage) { nextValue in
            guard !nextValue.isEmpty else {
                return
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                if feedbackMessage == nextValue {
                    feedbackMessage = ""
                }
            }
        }
        .overlay {
            if showGroupDetails, let activeGroup {
                ChatSwiftModalBackdrop {
                    showGroupDetails = false
                } content: {
                    groupDetailsModal(for: activeGroup)
                }
            }

            if showNewGroup {
                ChatSwiftModalBackdrop {
                    closeNewGroupModal()
                } content: {
                    newGroupModal
                }
            }

            if showNewDM {
                ChatSwiftModalBackdrop {
                    closeNewDMModal()
                } content: {
                    newDMModal
                }
            }
        }
    }

    private var sidebar: some View {
        VStack(spacing: 0) {
            HStack {
                if activeGroup == nil {
                    Button(action: onClose) {
                        Image(systemName: "xmark")
                            .font(.system(size: 15, weight: .black))
                            .foregroundStyle(.white)
                            .frame(width: 34, height: 34)
                            .background(Color.white.opacity(0.06))
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                }

                Spacer()

                Text("الدردشة")
                    .font(.system(size: 20, weight: .black))
                    .foregroundStyle(.white)

                Spacer()

                if activeGroup == nil {
                    Color.clear.frame(width: 34, height: 34)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 10)

            TextField("بحث", text: $groupSearch)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled(true)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(Color.white.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .padding(.horizontal, 16)
                .padding(.bottom, 12)

            if filteredGroups.isEmpty {
                VStack(spacing: 14) {
                    Text("لا توجد قروبات مطابقة")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.white.opacity(0.72))

                    sidebarActions
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.horizontal, 18)
            } else {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 10) {
                        sidebarActions

                        ForEach(filteredGroups) { group in
                            Button {
                                selectGroup(group.id)
                            } label: {
                                HStack(spacing: 12) {
                                    if group.unread > 0 {
                                        Text("\(group.unread)")
                                            .font(.system(size: 10, weight: .black))
                                            .foregroundStyle(.black)
                                            .frame(width: 22, height: 22)
                                            .background(Color.white)
                                            .clipShape(Circle())
                                    }

                                    Spacer(minLength: 0)

                                    VStack(alignment: .trailing, spacing: 4) {
                                        Text(group.lastMessage)
                                            .font(.system(size: 11, weight: .medium))
                                            .foregroundStyle(.white.opacity(0.58))
                                            .lineLimit(1)
                                        Text(group.name)
                                            .font(.system(size: 14, weight: .black))
                                            .foregroundStyle(.white)
                                            .frame(maxWidth: .infinity, alignment: .trailing)
                                    }

                                    ChatSwiftAvatar(symbol: group.avatarSymbol, highlighted: activeGroupID == group.id)
                                }
                                .padding(14)
                                .background(activeGroupID == group.id ? Color.white.opacity(0.09) : Color.white.opacity(0.04))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                                        .stroke(Color.white.opacity(activeGroupID == group.id ? 0.12 : 0.06), lineWidth: 1)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)
                }
            }

            if activeGroup == nil {
                Text("Xtik")
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.44))
                    .padding(.bottom, 12)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(red: 0.06, green: 0.06, blue: 0.07))
    }

    private var sidebarActions: some View {
        HStack(spacing: 10) {
            Button {
                onOpenPostComposer()
            } label: {
                ChatSwiftShortcut(title: "منشور", systemImage: "square.and.pencil")
            }
            .buttonStyle(.plain)

            Button {
                showNewDM = true
            } label: {
                ChatSwiftShortcut(title: "خاص", systemImage: "paperplane.fill")
            }
            .buttonStyle(.plain)

            Button {
                showNewGroup = true
            } label: {
                ChatSwiftShortcut(title: "قروب", systemImage: "person.3.fill")
            }
            .buttonStyle(.plain)
        }
    }

    private func chatThread(for group: ChatSwiftGroup) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        showGroupDrawer.toggle()
                    }
                } label: {
                    Image(systemName: "person.3.fill")
                        .font(.system(size: 15, weight: .black))
                        .foregroundStyle(.white)
                        .frame(width: 36, height: 36)
                        .background(Color.white.opacity(0.06))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)

                Button {
                    showGroupDetails = true
                } label: {
                    HStack(spacing: 10) {
                        VStack(alignment: .trailing, spacing: 3) {
                            Text("عرض الأعضاء والإدارة")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(.white.opacity(0.56))
                            Text(group.name)
                                .font(.system(size: 16, weight: .black))
                                .foregroundStyle(.white)
                        }

                        ChatSwiftAvatar(symbol: group.avatarSymbol, highlighted: true)
                    }
                }
                .buttonStyle(.plain)

                Spacer()

                Button {
                    feedbackMessage = "تم إرسال البلاغ على القروب"
                } label: {
                    Image(systemName: "flag.fill")
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(.white)
                        .frame(width: 34, height: 34)
                        .background(Color.white.opacity(0.06))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)

                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.system(size: 15, weight: .black))
                        .foregroundStyle(.white)
                        .frame(width: 34, height: 34)
                        .background(Color.white.opacity(0.06))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .overlay(alignment: .bottom) {
                Rectangle()
                    .fill(Color.white.opacity(0.06))
                    .frame(height: 1)
            }

            ZStack(alignment: .trailing) {
                ScrollViewReader { proxy in
                    ScrollView(showsIndicators: false) {
                        LazyVStack(alignment: .trailing, spacing: 10) {
                            ForEach(activeMessages) { message in
                                ChatSwiftMessageBubble(
                                    message: message,
                                    isMine: message.senderID == ChatSwiftSession.currentUserID,
                                    onReport: {
                                        feedbackMessage = "تم إرسال البلاغ على الرسالة"
                                    }
                                )
                            }

                            Color.clear
                                .frame(height: 1)
                                .id("chat-bottom")
                        }
                        .padding(16)
                    }
                    .onAppear {
                        proxy.scrollTo("chat-bottom", anchor: .bottom)
                    }
                    .onChange(of: activeMessages.count) { _ in
                        withAnimation(.easeOut(duration: 0.2)) {
                            proxy.scrollTo("chat-bottom", anchor: .bottom)
                        }
                    }
                    .onChange(of: group.id) { _ in
                        proxy.scrollTo("chat-bottom", anchor: .bottom)
                    }
                }

                if showGroupDrawer {
                    Color.black.opacity(0.28)
                        .ignoresSafeArea()
                        .onTapGesture {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                showGroupDrawer = false
                            }
                        }

                    VStack(spacing: 12) {
                        HStack {
                            Button {
                                withAnimation(.easeInOut(duration: 0.2)) {
                                    showGroupDrawer = false
                                }
                            } label: {
                                Image(systemName: "arrow.right")
                                    .font(.system(size: 14, weight: .black))
                                    .foregroundStyle(.white)
                                    .frame(width: 34, height: 34)
                                    .background(Color.white.opacity(0.06))
                                    .clipShape(Circle())
                            }
                            .buttonStyle(.plain)

                            Spacer()

                            Text("القروبات")
                                .font(.system(size: 16, weight: .black))
                                .foregroundStyle(.white)
                        }

                        ScrollView(showsIndicators: false) {
                            VStack(spacing: 10) {
                                ForEach(filteredGroups) { listedGroup in
                                    Button {
                                        selectGroup(listedGroup.id)
                                        withAnimation(.easeInOut(duration: 0.2)) {
                                            showGroupDrawer = false
                                        }
                                    } label: {
                                        HStack(spacing: 10) {
                                            Spacer(minLength: 0)

                                            VStack(alignment: .trailing, spacing: 4) {
                                                Text(listedGroup.lastMessage)
                                                    .font(.system(size: 10, weight: .medium))
                                                    .foregroundStyle(.white.opacity(0.56))
                                                    .lineLimit(1)
                                                Text(listedGroup.name)
                                                    .font(.system(size: 13, weight: .black))
                                                    .foregroundStyle(.white)
                                            }

                                            ChatSwiftAvatar(symbol: listedGroup.avatarSymbol, highlighted: listedGroup.id == group.id)
                                        }
                                        .padding(12)
                                        .background(Color.white.opacity(listedGroup.id == group.id ? 0.1 : 0.04))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                                        )
                                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                    .padding(16)
                    .frame(width: 286)
                    .frame(maxHeight: .infinity)
                    .background(Color(red: 0.06, green: 0.06, blue: 0.07))
                    .overlay(alignment: .leading) {
                        Rectangle()
                            .fill(Color.white.opacity(0.06))
                            .frame(width: 1)
                    }
                    .frame(maxWidth: .infinity, alignment: .trailing)
                }
            }

            HStack(spacing: 10) {
                Button(action: sendMessage) {
                    HStack(spacing: 4) {
                        Text("شوت")
                            .font(.system(size: 12, weight: .black))
                        Image(systemName: "camera.fill")
                            .font(.system(size: 14, weight: .black))
                    }
                    .foregroundStyle(.black)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(Color.white)
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .disabled(messageDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .opacity(messageDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.45 : 1)

                HStack(spacing: 8) {
                    Button(action: {}) {
                        Image(systemName: "plus")
                            .font(.system(size: 15, weight: .black))
                            .foregroundStyle(.white)
                    }
                    .buttonStyle(.plain)

                    TextField("اكتب رسالة...", text: $messageDraft)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.white)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(Color.white.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
            .padding(16)
            .overlay(alignment: .top) {
                Rectangle()
                    .fill(Color.white.opacity(0.06))
                    .frame(height: 1)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(red: 0.05, green: 0.05, blue: 0.06))
    }

    private func groupDetailsModal(for group: ChatSwiftGroup) -> some View {
        VStack(alignment: .trailing, spacing: 16) {
            HStack {
                Button {
                    showGroupDetails = false
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(.white)
                        .frame(width: 34, height: 34)
                        .background(Color.white.opacity(0.06))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)

                Spacer()

                Text(group.name)
                    .font(.system(size: 18, weight: .black))
                    .foregroundStyle(.white)
            }

            Text("اضغط على العضو لإدارته، ويمكن لمالك القروب حذف الأعضاء أو حذف القروب بالكامل.")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.white.opacity(0.66))
                .lineSpacing(2)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 10) {
                    ForEach(group.members) { member in
                        HStack(spacing: 10) {
                            if canManageActiveGroup && !member.isCreator {
                                Button {
                                    removeMember(member.id, from: group.id)
                                } label: {
                                    Image(systemName: "trash.fill")
                                        .font(.system(size: 13, weight: .black))
                                        .foregroundStyle(Color(red: 1, green: 0.52, blue: 0.48))
                                        .frame(width: 32, height: 32)
                                        .background(Color.white.opacity(0.04))
                                        .clipShape(Circle())
                                }
                                .buttonStyle(.plain)
                            }

                            Spacer()

                            VStack(alignment: .trailing, spacing: 3) {
                                Text(member.displayName)
                                    .font(.system(size: 13, weight: .black))
                                    .foregroundStyle(.white)
                                Text(member.email)
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(.white.opacity(0.58))
                            }

                            if member.isCreator {
                                Text("المالك")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundStyle(.black)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(Color.white)
                                    .clipShape(Capsule())
                            }
                        }
                        .padding(12)
                        .background(Color.white.opacity(0.04))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .stroke(Color.white.opacity(0.06), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                }
            }

            if canManageActiveGroup {
                Button {
                    deleteGroup(group.id)
                } label: {
                    HStack(spacing: 8) {
                        Text("حذف القروب")
                            .font(.system(size: 13, weight: .black))
                        Image(systemName: "trash.fill")
                            .font(.system(size: 14, weight: .black))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color(red: 0.62, green: 0.16, blue: 0.2))
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(18)
        .frame(maxWidth: 360)
        .frame(maxHeight: 520)
        .background(Color(red: 0.05, green: 0.06, blue: 0.08))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    private var newGroupModal: some View {
        VStack(alignment: .trailing, spacing: 16) {
            HStack {
                Button(action: closeNewGroupModal) {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(.white)
                        .frame(width: 34, height: 34)
                        .background(Color.white.opacity(0.06))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)

                Spacer()

                Text("إنشاء قروب جديد")
                    .font(.system(size: 18, weight: .black))
                    .foregroundStyle(.white)
            }

            TextField("اسم القروب", text: $newGroupName)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled(true)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(Color.white.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

            Button(action: createGroup) {
                Text("إنشاء")
                    .font(.system(size: 14, weight: .black))
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
            .buttonStyle(.plain)
            .disabled(newGroupName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            .opacity(newGroupName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.45 : 1)
        }
        .padding(18)
        .frame(maxWidth: 340)
        .background(Color(red: 0.05, green: 0.06, blue: 0.08))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    private var newDMModal: some View {
        VStack(alignment: .trailing, spacing: 16) {
            HStack {
                Button(action: closeNewDMModal) {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(.white)
                        .frame(width: 34, height: 34)
                        .background(Color.white.opacity(0.06))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)

                Spacer()

                Button(action: createDM) {
                    Text("ابدأ")
                        .font(.system(size: 13, weight: .black))
                        .foregroundStyle(.black)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Color.white)
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .disabled(dmTarget.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .opacity(dmTarget.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.45 : 1)
            }

            HStack(spacing: 12) {
                VStack(alignment: .trailing, spacing: 12) {
                    TextField("إيميل المستخدم", text: $dmTarget)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        .background(Color.white.opacity(0.05))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                    TextEditor(text: $dmDraft)
                        .scrollContentBackground(.hidden)
                        .frame(minHeight: 140)
                        .padding(12)
                        .background(Color.white.opacity(0.05))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                }

                Text(String(ChatSwiftSession.currentUserName.prefix(1)))
                    .font(.system(size: 22, weight: .black))
                    .foregroundStyle(.white)
                    .frame(width: 52, height: 52)
                    .background(Color.white.opacity(0.08))
                    .clipShape(Circle())
            }

            HStack(spacing: 10) {
                ChatSwiftToolbarIcon(symbol: "photo")
                ChatSwiftToolbarIcon(symbol: "camera")
                ChatSwiftToolbarIcon(symbol: "face.smiling")
                ChatSwiftToolbarIcon(symbol: "list.bullet")
                ChatSwiftToolbarIcon(symbol: "calendar")
                ChatSwiftToolbarIcon(symbol: "mappin.and.ellipse")
            }
        }
        .padding(18)
        .frame(maxWidth: 360)
        .background(Color(red: 0.05, green: 0.06, blue: 0.08))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    private func consumeComposerIfNeeded(_ composer: AppSwiftComposer?) {
        guard let composer else {
            return
        }

        switch composer {
        case .dm:
            showNewDM = true
            onConsumeComposer()
        case .group:
            showNewGroup = true
            onConsumeComposer()
        case .post:
            break
        }
    }

    private func selectGroup(_ groupID: String) {
        activeGroupID = groupID
        messageDraft = ""

        if let index = groups.firstIndex(where: { $0.id == groupID }) {
            groups[index].unread = 0
        }
    }

    private func sendMessage() {
        let trimmedDraft = messageDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedDraft.isEmpty, let activeGroupID else {
            return
        }

        let message = ChatSwiftMessage(
            id: UUID().uuidString,
            groupID: activeGroupID,
            senderID: ChatSwiftSession.currentUserID,
            senderName: ChatSwiftSession.currentUserName,
            content: trimmedDraft,
            createdAt: Date()
        )

        messagesByGroupID[activeGroupID, default: []].append(message)
        updateGroupPreview(groupID: activeGroupID, lastMessage: trimmedDraft, createdAt: message.createdAt, unread: 0)
        messageDraft = ""
    }

    private func createGroup() {
        let trimmedName = newGroupName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty else {
            return
        }

        let nextGroup = ChatSwiftGroup(
            id: UUID().uuidString,
            name: trimmedName,
            isPrivate: false,
            creatorID: ChatSwiftSession.currentUserID,
            avatarSymbol: "person.3.fill",
            lastMessage: "تم إنشاء القروب",
            lastMessageAt: Date(),
            unread: 0,
            members: [ChatSwiftSession.currentMember(isCreator: true)]
        )

        groups.append(nextGroup)
        messagesByGroupID[nextGroup.id] = [
            ChatSwiftMessage(
                id: UUID().uuidString,
                groupID: nextGroup.id,
                senderID: ChatSwiftSession.currentUserID,
                senderName: ChatSwiftSession.currentUserName,
                content: "مرحبًا بكم في \(trimmedName)",
                createdAt: Date()
            )
        ]
        activeGroupID = nextGroup.id
        newGroupName = ""
        showNewGroup = false
        feedbackMessage = "تم إنشاء القروب بنجاح"
    }

    private func createDM() {
        let trimmedTarget = dmTarget.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedTarget.isEmpty else {
            return
        }

        let displayName = trimmedTarget.components(separatedBy: "@").first?.trimmingCharacters(in: .whitespacesAndNewlines).nonEmpty ?? "مستخدم"
        let dmGroupID = "dm-\(trimmedTarget.lowercased())"

        if !groups.contains(where: { $0.id == dmGroupID }) {
            let nextGroup = ChatSwiftGroup(
                id: dmGroupID,
                name: displayName,
                isPrivate: true,
                creatorID: ChatSwiftSession.currentUserID,
                avatarSymbol: "paperplane.fill",
                lastMessage: dmDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "تم بدء الدردشة الخاصة" : dmDraft.trimmingCharacters(in: .whitespacesAndNewlines),
                lastMessageAt: Date(),
                unread: 0,
                members: [
                    ChatSwiftSession.currentMember(isCreator: true),
                    ChatSwiftMember(id: dmGroupID, displayName: displayName, email: trimmedTarget, isCreator: false)
                ]
            )
            groups.append(nextGroup)
        }

        if !dmDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            let draft = dmDraft.trimmingCharacters(in: .whitespacesAndNewlines)
            messagesByGroupID[dmGroupID, default: []].append(
                ChatSwiftMessage(
                    id: UUID().uuidString,
                    groupID: dmGroupID,
                    senderID: ChatSwiftSession.currentUserID,
                    senderName: ChatSwiftSession.currentUserName,
                    content: draft,
                    createdAt: Date()
                )
            )
            updateGroupPreview(groupID: dmGroupID, lastMessage: draft, createdAt: Date(), unread: 0)
        }

        activeGroupID = dmGroupID
        dmTarget = ""
        dmDraft = ""
        showNewDM = false
        feedbackMessage = "تم بدء الدردشة الخاصة"
    }

    private func removeMember(_ memberID: String, from groupID: String) {
        guard let index = groups.firstIndex(where: { $0.id == groupID }) else {
            return
        }

        groups[index].members.removeAll(where: { $0.id == memberID })
        feedbackMessage = "تم حذف العضو من القروب"
    }

    private func deleteGroup(_ groupID: String) {
        groups.removeAll(where: { $0.id == groupID })
        messagesByGroupID[groupID] = nil
        if activeGroupID == groupID {
            activeGroupID = groups.sorted { $0.lastMessageAt > $1.lastMessageAt }.first?.id
        }
        showGroupDetails = false
        showGroupDrawer = false
        feedbackMessage = "تم حذف القروب"
    }

    private func updateGroupPreview(groupID: String, lastMessage: String, createdAt: Date, unread: Int) {
        guard let index = groups.firstIndex(where: { $0.id == groupID }) else {
            return
        }

        groups[index].lastMessage = lastMessage
        groups[index].lastMessageAt = createdAt
        groups[index].unread = unread
    }

    private func closeNewGroupModal() {
        newGroupName = ""
        showNewGroup = false
    }

    private func closeNewDMModal() {
        dmTarget = ""
        dmDraft = ""
        showNewDM = false
    }

    private static let sampleMessages: [String: [ChatSwiftMessage]] = [
        "grp-hilal": [
            ChatSwiftMessage(id: "msg-1", groupID: "grp-hilal", senderID: "member-1", senderName: "سلمان الزهراني", content: "ثبتوا جملة التشجيع الأساسية قبل البداية.", createdAt: Date().addingTimeInterval(-2800)),
            ChatSwiftMessage(id: "msg-2", groupID: "grp-hilal", senderID: ChatSwiftSession.currentUserID, senderName: ChatSwiftSession.currentUserName, content: "تم، نحتاج أيضًا تقسيم المدرج إلى جهتين.", createdAt: Date().addingTimeInterval(-2100)),
        ],
        "grp-dev": [
            ChatSwiftMessage(id: "msg-3", groupID: "grp-dev", senderID: "member-4", senderName: "Swift Build", content: "تمت مزامنة صفحة Fans مع Supabase الآن.", createdAt: Date().addingTimeInterval(-5400)),
            ChatSwiftMessage(id: "msg-4", groupID: "grp-dev", senderID: ChatSwiftSession.currentUserID, senderName: ChatSwiftSession.currentUserName, content: "الخطوة التالية صفحة Chat نفسها.", createdAt: Date().addingTimeInterval(-4800)),
        ],
    ]
}

private struct ChatSwiftAvatar: View {
    let symbol: String
    let highlighted: Bool

    var body: some View {
        Circle()
            .fill(
                LinearGradient(
                    colors: highlighted
                        ? [Color(red: 0.36, green: 0.74, blue: 1), Color(red: 0.08, green: 0.22, blue: 0.42)]
                        : [Color.white.opacity(0.14), Color.white.opacity(0.05)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .frame(width: 42, height: 42)
            .overlay(
                Image(systemName: symbol)
                    .font(.system(size: 15, weight: .black))
                    .foregroundStyle(.white)
            )
    }
}

private struct ChatSwiftShortcut: View {
    let title: String
    let systemImage: String

    var body: some View {
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
}

private struct ChatSwiftMessageBubble: View {
    let message: ChatSwiftMessage
    let isMine: Bool
    let onReport: () -> Void

    var body: some View {
        VStack(alignment: isMine ? .trailing : .leading, spacing: 6) {
            if !isMine {
                Text(message.senderName)
                    .font(.system(size: 11, weight: .black))
                    .foregroundStyle(.white.opacity(0.68))
            }

            Text(message.content)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: isMine ? .trailing : .leading)

            HStack(spacing: 8) {
                if !isMine {
                    Button(action: onReport) {
                        HStack(spacing: 4) {
                            Text("بلاغ")
                                .font(.system(size: 10, weight: .black))
                            Image(systemName: "flag.fill")
                                .font(.system(size: 10, weight: .bold))
                        }
                        .foregroundStyle(.white.opacity(0.74))
                    }
                    .buttonStyle(.plain)
                }

                Spacer(minLength: 0)

                Text(message.createdAt.formatted(date: .omitted, time: .shortened))
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white.opacity(0.46))

                if isMine {
                    Image(systemName: "checkmark")
                        .font(.system(size: 10, weight: .black))
                        .foregroundStyle(Color(red: 0.46, green: 0.88, blue: 0.74))
                }
            }
        }
        .padding(12)
        .background(isMine ? Color(red: 0.14, green: 0.35, blue: 0.7) : Color.white.opacity(0.05))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.white.opacity(isMine ? 0.12 : 0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .frame(maxWidth: 290, alignment: isMine ? .trailing : .leading)
        .frame(maxWidth: .infinity, alignment: isMine ? .trailing : .leading)
    }
}

private struct ChatSwiftToolbarIcon: View {
    let symbol: String

    var body: some View {
        Image(systemName: symbol)
            .font(.system(size: 16, weight: .bold))
            .foregroundStyle(.white.opacity(0.78))
            .frame(width: 34, height: 34)
            .background(Color.white.opacity(0.04))
            .clipShape(Circle())
    }
}

private struct ChatSwiftModalBackdrop<Content: View>: View {
    let onDismiss: () -> Void
    @ViewBuilder let content: Content

    var body: some View {
        ZStack {
            Color.black.opacity(0.52)
                .ignoresSafeArea()
                .onTapGesture(perform: onDismiss)

            content
                .padding(.horizontal, 16)
        }
    }
}

private extension String {
    var nonEmpty: String? {
        trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

struct ChatSwiftView_Previews: PreviewProvider {
    static var previews: some View {
        ChatSwiftView(composer: nil, onConsumeComposer: {}, onOpenPostComposer: {}, onClose: {})
            .environment(\.layoutDirection, .rightToLeft)
    }
}