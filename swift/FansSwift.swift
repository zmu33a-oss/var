import SwiftUI

private enum FansSwiftTeamID: String, CaseIterable, Identifiable {
    case hilal
    case nassr
    case ittihad

    var id: String { rawValue }

    var title: String {
        switch self {
        case .hilal:
            return "الهلال"
        case .nassr:
            return "النصر"
        case .ittihad:
            return "الاتحاد"
        }
    }

    var crowdLabel: String {
        switch self {
        case .hilal:
            return "جمهور الهلال"
        case .nassr:
            return "جمهور النصر"
        case .ittihad:
            return "جمهور الاتحاد"
        }
    }

    var symbolName: String {
        switch self {
        case .hilal:
            return "moon.stars.fill"
        case .nassr:
            return "sun.max.fill"
        case .ittihad:
            return "shield.lefthalf.filled"
        }
    }

    var colors: [Color] {
        switch self {
        case .hilal:
            return [Color(red: 0.06, green: 0.26, blue: 0.7), Color(red: 0.02, green: 0.08, blue: 0.2)]
        case .nassr:
            return [Color(red: 0.55, green: 0.42, blue: 0.05), Color(red: 0.17, green: 0.12, blue: 0.02)]
        case .ittihad:
            return [Color(red: 0.58, green: 0.46, blue: 0.11), Color(red: 0.08, green: 0.07, blue: 0.03)]
        }
    }
}

private struct FansSwiftSupportStore: Codable, Equatable {
    var counts: [String: Int]
    var supportedTeams: [String]

    static let `default` = FansSwiftSupportStore(
        counts: [
            FansSwiftTeamID.hilal.rawValue: 1842,
            FansSwiftTeamID.nassr.rawValue: 1634,
            FansSwiftTeamID.ittihad.rawValue: 1278,
        ],
        supportedTeams: []
    )

    func count(for team: FansSwiftTeamID) -> Int {
        counts[team.rawValue] ?? 0
    }

    func supports(_ team: FansSwiftTeamID) -> Bool {
        supportedTeams.contains(team.rawValue)
    }

    mutating func toggle(_ team: FansSwiftTeamID) {
        let key = team.rawValue
        let wasSupported = supportedTeams.contains(key)

        if wasSupported {
            supportedTeams.removeAll(where: { $0 == key })
            counts[key] = max(0, (counts[key] ?? 0) - 1)
        } else {
            supportedTeams.append(key)
            counts[key] = (counts[key] ?? 0) + 1
        }
    }

    mutating func applyRemoteCounts(_ nextCounts: [String: Int]) {
        counts = nextCounts
    }

    mutating func applyRemoteSupportedTeams(_ nextSupportedTeams: [String]) {
        supportedTeams = nextSupportedTeams
    }
}

private enum FansSwiftStorage {
    static let supportKey = "webplus.swift.fans.support"
    static let supportUserKey = "webplus.swift.fans.user-id"

    static func load() -> FansSwiftSupportStore {
        guard let data = UserDefaults.standard.data(forKey: supportKey),
              let decoded = try? JSONDecoder().decode(FansSwiftSupportStore.self, from: data) else {
            return .default
        }

        return decoded
    }

    static func save(_ store: FansSwiftSupportStore) {
        guard let data = try? JSONEncoder().encode(store) else {
            return
        }

        UserDefaults.standard.set(data, forKey: supportKey)
    }

    static func supportUserID() -> String {
        if let existing = UserDefaults.standard.string(forKey: supportUserKey), !existing.isEmpty {
            return existing
        }

        let nextValue = "swift-\(UUID().uuidString.lowercased())"
        UserDefaults.standard.set(nextValue, forKey: supportUserKey)
        return nextValue
    }
}

private enum FansSwiftTrendTone {
    case gold
    case silver
    case bronze

    var rankTitle: String {
        switch self {
        case .gold:
            return "المركز الأول"
        case .silver:
            return "المركز الثاني"
        case .bronze:
            return "المركز الثالث"
        }
    }

    var spotlightLabel: String {
        switch self {
        case .gold:
            return "الأكثر تفاعلًا"
        case .silver:
            return "تفاعل قوي"
        case .bronze:
            return "ترند صاعد"
        }
    }

    var medalLabel: String {
        switch self {
        case .gold:
            return "ذهبي"
        case .silver:
            return "فضي"
        case .bronze:
            return "برونزي"
        }
    }

    var symbolName: String {
        switch self {
        case .gold:
            return "sparkles.tv.fill"
        case .silver:
            return "bolt.badge.clock.fill"
        case .bronze:
            return "figure.soccer"
        }
    }

    var colors: [Color] {
        switch self {
        case .gold:
            return [Color(red: 0.94, green: 0.66, blue: 0.21), Color(red: 0.22, green: 0.09, blue: 0.02)]
        case .silver:
            return [Color(red: 0.72, green: 0.75, blue: 0.82), Color(red: 0.15, green: 0.17, blue: 0.22)]
        case .bronze:
            return [Color(red: 0.8, green: 0.49, blue: 0.28), Color(red: 0.18, green: 0.08, blue: 0.05)]
        }
    }
}

private struct FansSwiftTrend: Identifiable {
    let id: Int
    let creatorName: String
    let creatorHandle: String
    let title: String
    let subtitle: String
    let videoURLString: String?
    let creatorAvatarURLString: String?
    let avatarFramed: Bool
    let comments: Int
    let likes: Int
    let saves: Int
    let shares: Int
    let tone: FansSwiftTrendTone

    var initial: String {
        String(creatorName.prefix(1)).uppercased()
    }

    static let fallbacks: [FansSwiftTrend] = [
        FansSwiftTrend(id: 1, creatorName: "x tik@", creatorHandle: "@xtik.top", title: "ترند المدرج الأزرق", subtitle: "تفاعل سريع وصعود ثابت في الفانس", videoURLString: nil, creatorAvatarURLString: nil, avatarFramed: false, comments: 190, likes: 76, saves: 28, shares: 34, tone: .gold),
        FansSwiftTrend(id: 2, creatorName: "xtik plus", creatorHandle: "@xtik.plus", title: "ترند المدرج الأصفر", subtitle: "ثبات في الاقتباس مع زيادة الحفظ", videoURLString: nil, creatorAvatarURLString: nil, avatarFramed: false, comments: 154, likes: 68, saves: 24, shares: 19, tone: .silver),
        FansSwiftTrend(id: 3, creatorName: "xtik live", creatorHandle: "@xtik.live", title: "ترند الرابطة السريعة", subtitle: "موجة تفاعل جديدة في آخر الأخبار", videoURLString: nil, creatorAvatarURLString: nil, avatarFramed: false, comments: 122, likes: 57, saves: 18, shares: 13, tone: .bronze),
    ]
}

private struct FansSwiftFeedPost: Identifiable {
    let id: Int
    let author: String
    let handle: String
    let time: String
    let text: String
    let likes: Int
    let replies: Int
    let reposts: Int
    let shares: Int
}

private struct FansSwiftFeedScreen: Identifiable {
    let id: String
    let title: String
    let headerLabel: String
    let browserLabel: String
    let footer: String
    let posts: [FansSwiftFeedPost]
}

struct FansSwiftView: View {
    let isLoggedIn: Bool
    let onRequireAuth: () -> Void

    @State private var isTopSheetOpen = false
    @State private var supportStore = FansSwiftStorage.load()
    @State private var trends = FansSwiftTrend.fallbacks
    @State private var activeTrendID = 1
    @State private var previewTrendID: Int?
    @State private var infoToast = ""
    @State private var isSyncingRemote = false
    @State private var usedRemoteSupport = false
    @State private var usedRemoteTrends = false

    private let feedScreens: [FansSwiftFeedScreen] = [
        FansSwiftFeedScreen(
            id: "hilal",
            title: "رابطة الهلال",
            headerLabel: "الهاشتاق المركز الأول",
            browserLabel: "#رابطة-الهلال",
            footer: "شاشة رابطة الهلال",
            posts: [
                FansSwiftFeedPost(id: 1, author: "سلمان الزهراني", handle: "@hilalvoice", time: "5m", text: "المدرج اليوم نار. نحتاج بداية ضغط عالية وأول ربع ساعة لازم يكون فيها حضور صوتي كامل.", likes: 284, replies: 46, reposts: 19, shares: 0),
                FansSwiftFeedPost(id: 2, author: "جود", handle: "@bluecurve", time: "20m", text: "خلوا بداية الهتاف موحدة وخلو الرد يطلع من يمين المدرج ثم يكمل من النص بدون انقطاع.", likes: 167, replies: 22, reposts: 13, shares: 0)
            ]
        ),
        FansSwiftFeedScreen(
            id: "nassr",
            title: "رابطة النصر",
            headerLabel: "شاشة رابطة النصر",
            browserLabel: "#رابطة-النصر",
            footer: "المدرج الأصفر",
            posts: [
                FansSwiftFeedPost(id: 3, author: "عبدالله", handle: "@nassrwave", time: "8m", text: "إذا بدأ الضغط من بدري لازم يبان الرد في المدرج كامل ونرفع الإيقاع مع أول فرصة خطرة.", likes: 231, replies: 29, reposts: 16, shares: 0),
                FansSwiftFeedPost(id: 4, author: "رهف", handle: "@sunstand", time: "12m", text: "ثبتوا جملة التشجيع الأساسية قبل النزول لأرضية الملعب بخمس دقائق عشان يدخل الصوت مرتب.", likes: 154, replies: 18, reposts: 9, shares: 0)
            ]
        )
    ]

    private var activeTrend: FansSwiftTrend {
        trends.first(where: { $0.id == activeTrendID }) ?? trends[0]
    }

    private var previewTrend: FansSwiftTrend? {
        guard let previewTrendID else {
            return nil
        }

        return trends.first(where: { $0.id == previewTrendID })
    }

    private var displayedTrend: FansSwiftTrend {
        previewTrend ?? activeTrend
    }

    private var triggerDigits: [String] {
        FansSwiftFormatter.digits(for: supportStore.count(for: .hilal))
    }

    var body: some View {
        ZStack(alignment: .top) {
            LinearGradient(
                colors: [Color.black, Color(red: 0.06, green: 0.07, blue: 0.12)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            Circle()
                .fill(Color.white.opacity(0.08))
                .blur(radius: 90)
                .frame(width: 220, height: 220)
                .offset(x: -110, y: -70)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 22) {
                    Color.clear
                        .frame(height: isTopSheetOpen ? 352 : 110)

                    trendStage

                    VStack(spacing: 16) {
                        ForEach(feedScreens) { screen in
                            FansSwiftFeedStage(screen: screen)
                        }
                    }
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 24)
            }

            if isTopSheetOpen {
                Color.black.opacity(0.32)
                    .ignoresSafeArea()
                    .onTapGesture {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.88)) {
                            isTopSheetOpen = false
                        }
                    }
            }

            FansSwiftTopSheet(
                isOpen: $isTopSheetOpen,
                triggerDigits: triggerDigits,
                supportStore: supportStore,
                isLoggedIn: isLoggedIn,
                onRequireAuth: onRequireAuth,
                onToggleSupport: toggleSupport
            )
            .padding(.top, 0)

            if !infoToast.isEmpty {
                VStack {
                    Spacer()

                    Text(infoToast)
                        .font(.system(size: 12, weight: .black))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(Color(red: 0.08, green: 0.1, blue: 0.14).opacity(0.96))
                        .overlay(
                            Capsule()
                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        )
                        .clipShape(Capsule())
                        .padding(.bottom, 18)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.horizontal, 24)
                .allowsHitTesting(false)
            }
        }
        .preferredColorScheme(.dark)
        .environment(\.layoutDirection, .rightToLeft)
        .task(id: isLoggedIn) {
            await loadRemoteContent()
        }
        .onChange(of: supportStore) { nextStore in
            FansSwiftStorage.save(nextStore)
        }
        .onChange(of: infoToast) { nextValue in
            guard !nextValue.isEmpty else {
                return
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                if infoToast == nextValue {
                    infoToast = ""
                }
            }
        }
    }

    private var trendStage: some View {
        VStack(alignment: .trailing, spacing: 16) {
            HStack(spacing: 8) {
                Image(systemName: "rosette")
                    .font(.system(size: 18, weight: .black))
                    .foregroundStyle(Color(red: 0.95, green: 0.72, blue: 0.3))

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("الأكثر تفاعلاً اليوم")
                        .font(.system(size: 20, weight: .black))
                        .foregroundStyle(.white)
                    Text(
                        isSyncingRemote
                            ? "جاري مزامنة البيانات الحقيقية من Supabase"
                            : usedRemoteTrends
                                ? "الترند مرتب من بيانات TikTok الحقيقية"
                                : "اقتباس ترند تيك توك مع بطاقات معاينة سريعة"
                    )
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white.opacity(0.58))
                }
            }

            VStack(spacing: 14) {
                HStack(alignment: .top, spacing: 14) {
                    VStack(spacing: 10) {
                        ForEach(Array(trends.enumerated()), id: \.element.id) { index, trend in
                            Button {
                                withAnimation(.easeInOut(duration: 0.18)) {
                                    activeTrendID = trend.id
                                }
                            } label: {
                                HStack(spacing: 8) {
                                    Text(previewTrendID == trend.id ? "معاينة" : "\(index + 1)")
                                        .font(.system(size: 11, weight: .black))
                                        .foregroundStyle((activeTrendID == trend.id || previewTrendID == trend.id) ? .black : .white)
                                        .frame(width: 48, height: 30)
                                        .background((activeTrendID == trend.id || previewTrendID == trend.id) ? Color.white : Color.white.opacity(0.06))
                                        .clipShape(Capsule())

                                    VStack(alignment: .trailing, spacing: 3) {
                                        Text(trend.tone.rankTitle)
                                            .font(.system(size: 12, weight: .black))
                                            .foregroundStyle(.white)
                                        Text(trend.creatorHandle)
                                            .font(.system(size: 10, weight: .bold))
                                            .foregroundStyle(.white.opacity(0.56))
                                    }

                                    Spacer(minLength: 0)
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 10)
                                .background((activeTrendID == trend.id || previewTrendID == trend.id) ? Color.white.opacity(0.12) : Color.white.opacity(0.04))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                                        .stroke(Color.white.opacity(activeTrendID == trend.id || previewTrendID == trend.id ? 0.14 : 0.06), lineWidth: 1)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                            }
                            .buttonStyle(.plain)
                            .simultaneousGesture(
                                DragGesture(minimumDistance: 0)
                                    .onChanged { _ in
                                        if previewTrendID != trend.id {
                                            withAnimation(.easeInOut(duration: 0.12)) {
                                                previewTrendID = trend.id
                                            }
                                        }
                                    }
                                    .onEnded { _ in
                                        withAnimation(.easeOut(duration: 0.18)) {
                                            previewTrendID = nil
                                        }
                                    }
                            )
                        }
                    }
                    .frame(width: 122)

                    FansSwiftTrendPoster(trend: displayedTrend)
                }

                if previewTrend != nil {
                    FansSwiftTrendPreviewDock(trend: displayedTrend)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                } else {
                    FansSwiftTrendMetricsRow(trend: activeTrend)
                }
            }
            .padding(14)
            .background(Color(red: 0.03, green: 0.04, blue: 0.06).opacity(0.98))
            .overlay(
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        }
    }

    private func toggleSupport(_ team: FansSwiftTeamID) {
        guard isLoggedIn else {
            onRequireAuth()
            return
        }

        let supporting = !supportStore.supports(team)
        supportStore.toggle(team)
        infoToast = supporting ? "تم تسجيل التشجيع لـ \(team.title)" : "تم إلغاء التشجيع لـ \(team.title)"

        Task {
            do {
                try await WEBPLUSSupabaseREST.setFanSupport(
                    teamID: team.rawValue,
                    userID: FansSwiftStorage.supportUserID(),
                    supported: supporting
                )

                let snapshot = try await WEBPLUSSupabaseREST.fetchFanSupportSnapshot(
                    currentUserID: FansSwiftStorage.supportUserID()
                )

                await MainActor.run {
                    supportStore.applyRemoteCounts(snapshot.counts)
                    supportStore.applyRemoteSupportedTeams(snapshot.supportedTeams)
                    usedRemoteSupport = true
                    infoToast = supporting ? "تمت مزامنة تشجيع \(team.title)" : "تمت مزامنة إلغاء تشجيع \(team.title)"
                }
            } catch {
                await MainActor.run {
                    infoToast = supporting ? "تم حفظ التشجيع محليًا فقط" : "تم حفظ الإلغاء محليًا فقط"
                }
            }
        }
    }

    private func loadRemoteContent() async {
        await MainActor.run {
            isSyncingRemote = true
        }

        let remoteUserID = isLoggedIn ? FansSwiftStorage.supportUserID() : nil

        do {
            let snapshot = try await WEBPLUSSupabaseREST.fetchFanSupportSnapshot(currentUserID: remoteUserID)
            await MainActor.run {
                supportStore.applyRemoteCounts(snapshot.counts)
                if isLoggedIn {
                    supportStore.applyRemoteSupportedTeams(snapshot.supportedTeams)
                }
                usedRemoteSupport = true
            }
        } catch {
            // Keep local fallback counts and support state.
        }

        do {
            let remoteTrends = try await WEBPLUSSupabaseREST.fetchTopTrendVideos(limit: 3)
            if !remoteTrends.isEmpty {
                let tones: [FansSwiftTrendTone] = [.gold, .silver, .bronze]
                let mappedTrends = remoteTrends.enumerated().map { index, item in
                    let tone = tones[min(index, tones.count - 1)]
                    return FansSwiftTrend(
                        id: item.id,
                        creatorName: item.creatorName,
                        creatorHandle: item.creatorHandle,
                        title: item.creatorName,
                        subtitle: item.caption.isEmpty ? tone.spotlightLabel : item.caption,
                        videoURLString: item.videoURLString,
                        creatorAvatarURLString: item.creatorAvatarURLString,
                        avatarFramed: item.creatorAvatarFrameEnabled,
                        comments: item.comments,
                        likes: item.likes,
                        saves: item.saves,
                        shares: item.shares,
                        tone: tone
                    )
                }

                await MainActor.run {
                    trends = mappedTrends
                    activeTrendID = mappedTrends.first?.id ?? activeTrendID
                    usedRemoteTrends = true
                }
            }
        } catch {
            // Keep local fallback trend cards.
        }

        await MainActor.run {
            isSyncingRemote = false
        }
    }
}

private struct FansSwiftTopSheet: View {
    @Binding var isOpen: Bool

    let triggerDigits: [String]
    let supportStore: FansSwiftSupportStore
    let isLoggedIn: Bool
    let onRequireAuth: () -> Void
    let onToggleSupport: (FansSwiftTeamID) -> Void

    var body: some View {
        VStack(spacing: 0) {
            if isOpen {
                VStack(alignment: .trailing, spacing: 12) {
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("لوحة التشجيع السريعة")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.62))
                        Text("اختر الفريق وابدأ التشجيع")
                            .font(.system(size: 14, weight: .black))
                            .foregroundStyle(.white)
                    }

                    VStack(spacing: 10) {
                        ForEach(FansSwiftTeamID.allCases) { team in
                            FansSwiftSupportTeamCard(
                                team: team,
                                count: supportStore.count(for: team),
                                isSupported: supportStore.supports(team),
                                isLoggedIn: isLoggedIn,
                                onRequireAuth: onRequireAuth,
                                onToggleSupport: {
                                    onToggleSupport(team)
                                }
                            )
                        }
                    }
                }
                .padding(.horizontal, 12)
                .padding(.top, 12)
                .padding(.bottom, 12)
                .frame(width: min(UIScreen.main.bounds.width - 126, 276))
                .background(Color(red: 0.02, green: 0.03, blue: 0.05).opacity(0.98))
                .overlay(
                    RoundedRectangle(cornerRadius: 0, style: .continuous)
                        .stroke(Color.white.opacity(0.84), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                .transition(.move(edge: .top).combined(with: .opacity))
            }

            Button {
                withAnimation(.spring(response: 0.35, dampingFraction: 0.88)) {
                    isOpen.toggle()
                }
            } label: {
                HStack(spacing: 8) {
                    Text("جمهور الهلال")
                        .font(.system(size: 11, weight: .black))
                        .foregroundStyle(.white)

                    Text("1")
                        .font(.system(size: 11, weight: .black))
                        .foregroundStyle(.black)
                        .frame(width: 20, height: 20)
                        .background(Color.white)
                        .clipShape(Circle())

                    Image(systemName: isOpen ? "chevron.up" : "chevron.down")
                        .font(.system(size: 12, weight: .black))
                        .foregroundStyle(.white)

                    Spacer(minLength: 0)

                    HStack(spacing: 3) {
                        ForEach(triggerDigits, id: \.self) { digit in
                            Text(digit)
                                .font(.system(size: 11, weight: .black, design: .monospaced))
                                .foregroundStyle(.white)
                                .frame(width: 16, height: 24)
                                .background(Color.white.opacity(0.08))
                                .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                        }
                    }

                    Text("شجع")
                        .font(.system(size: 11, weight: .black))
                        .foregroundStyle(.black)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color(red: 0.31, green: 0.72, blue: 1))
                        .clipShape(Capsule())
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .frame(width: min(UIScreen.main.bounds.width - 126, 276))
                .background(Color.black.opacity(0.94))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Color.white.opacity(0.9), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .buttonStyle(.plain)
        }
    }
}

private struct FansSwiftSupportTeamCard: View {
    let team: FansSwiftTeamID
    let count: Int
    let isSupported: Bool
    let isLoggedIn: Bool
    let onRequireAuth: () -> Void
    let onToggleSupport: () -> Void

    var body: some View {
        ZStack {
            LinearGradient(colors: team.colors, startPoint: .topLeading, endPoint: .bottomTrailing)

            RadialGradient(
                colors: [Color.white.opacity(0.16), .clear],
                center: .topTrailing,
                startRadius: 10,
                endRadius: 160
            )

            HStack(spacing: 10) {
                Button {
                    if isLoggedIn {
                        onToggleSupport()
                    } else {
                        onRequireAuth()
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: isSupported ? "checkmark" : "plus")
                            .font(.system(size: 11, weight: .black))
                        Text(isSupported ? "تم" : "شجع")
                            .font(.system(size: 10, weight: .black))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(isSupported ? Color(red: 0.12, green: 0.64, blue: 0.34) : Color(red: 0.17, green: 0.52, blue: 0.9))
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)

                HStack(spacing: 3) {
                    ForEach(FansSwiftFormatter.digits(for: count), id: \.self) { digit in
                        Text(digit)
                            .font(.system(size: 10, weight: .black, design: .monospaced))
                            .foregroundStyle(.white)
                            .frame(width: 15, height: 22)
                            .background(Color.black.opacity(0.22))
                            .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                    }
                }

                Spacer(minLength: 0)

                VStack(alignment: .trailing, spacing: 5) {
                    Text(team.title)
                        .font(.system(size: 15, weight: .black))
                        .foregroundStyle(.white)
                    Text(isLoggedIn ? "صوت المدرج محفوظ محليًا داخل النسخة Swift" : "سجل الدخول لتفعيل التشجيع")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.white.opacity(0.68))
                        .lineLimit(2)
                }

                Image(systemName: team.symbolName)
                    .font(.system(size: 18, weight: .black))
                    .foregroundStyle(.white)
                    .frame(width: 38, height: 38)
                    .background(Color.black.opacity(0.16))
                    .clipShape(Circle())
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 12)
        }
        .frame(height: 84)
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(Color.white.opacity(0.16), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

private struct FansSwiftTrendPoster: View {
    let trend: FansSwiftTrend

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("trend.tiktok.quote")
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.58))

                Spacer()

                HStack(spacing: 5) {
                    Circle().fill(Color.red).frame(width: 8, height: 8)
                    Circle().fill(Color.orange).frame(width: 8, height: 8)
                    Circle().fill(Color.green).frame(width: 8, height: 8)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(Color.black.opacity(0.28))

            ZStack(alignment: .topTrailing) {
                LinearGradient(colors: trend.tone.colors, startPoint: .topLeading, endPoint: .bottomTrailing)

                if let videoURLString = trend.videoURLString {
                    Text(videoURLString)
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundStyle(.white.opacity(0.12))
                        .lineLimit(3)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 18)
                }

                VStack(spacing: 12) {
                    Spacer()

                    Image(systemName: trend.tone.symbolName)
                        .font(.system(size: 42, weight: .black))
                        .foregroundStyle(.white.opacity(0.92))

                    VStack(spacing: 4) {
                        Text(trend.title)
                            .font(.system(size: 18, weight: .black))
                            .foregroundStyle(.white)
                        Text(trend.subtitle)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.72))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 22)
                    }

                    Spacer()
                }

                Text("Trending Now")
                    .font(.system(size: 11, weight: .black))
                    .foregroundStyle(.black)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 7)
                    .background(Color.white)
                    .clipShape(Capsule())
                    .padding(12)
            }
            .frame(height: 292)
        }
        .frame(maxWidth: .infinity)
        .overlay(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
    }
}

private struct FansSwiftTrendPreviewDock: View {
    let trend: FansSwiftTrend

    var body: some View {
        VStack(alignment: .trailing, spacing: 12) {
            HStack(spacing: 12) {
                VStack(alignment: .trailing, spacing: 4) {
                    Text(trend.tone.rankTitle)
                        .font(.system(size: 15, weight: .black))
                        .foregroundStyle(.white)
                    Text("في ترند الفانس الآن")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white.opacity(0.56))
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 3) {
                    Text(trend.creatorName)
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(.white)
                    Text(trend.creatorHandle)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white.opacity(0.58))
                }

                Group {
                    if let creatorAvatarURLString = trend.creatorAvatarURLString,
                       let creatorAvatarURL = URL(string: creatorAvatarURLString) {
                        AsyncImage(url: creatorAvatarURL) { image in
                            image
                                .resizable()
                                .scaledToFill()
                        } placeholder: {
                            Text(trend.initial)
                                .font(.system(size: 16, weight: .black))
                                .foregroundStyle(.white)
                        }
                        .frame(width: 42, height: 42)
                        .clipShape(Circle())
                        .overlay(
                            Circle()
                                .stroke(trend.avatarFramed ? Color.white.opacity(0.9) : .clear, lineWidth: 1.5)
                        )
                    } else {
                        Text(trend.initial)
                            .font(.system(size: 16, weight: .black))
                            .foregroundStyle(.white)
                            .frame(width: 42, height: 42)
                            .background(Color.white.opacity(0.08))
                            .clipShape(Circle())
                    }
                }
            }

            Text(trend.tone.spotlightLabel)
                .font(.system(size: 12, weight: .black))
                .foregroundStyle(Color(red: 0.98, green: 0.82, blue: 0.42))

            FansSwiftTrendMetricsRow(trend: trend)
        }
        .padding(14)
        .background(Color.white.opacity(0.05))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }
}

private struct FansSwiftTrendMetricsRow: View {
    let trend: FansSwiftTrend

    var body: some View {
        HStack(spacing: 10) {
            FansSwiftTrendMetric(title: "مشاركة", value: trend.shares)
            FansSwiftTrendMetric(title: "حفظ", value: trend.saves)
            FansSwiftTrendMetric(title: "إعجاب", value: trend.likes)
            FansSwiftTrendMetric(title: "تعليق", value: trend.comments)
        }
    }
}

private struct FansSwiftTrendMetric: View {
    let title: String
    let value: Int

    var body: some View {
        VStack(spacing: 5) {
            Text(FansSwiftFormatter.number(value))
                .font(.system(size: 14, weight: .black))
                .foregroundStyle(.white)
            Text(title)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.white.opacity(0.58))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color.white.opacity(0.04))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

private struct FansSwiftFeedStage: View {
    let screen: FansSwiftFeedScreen

    private var repeatedPosts: [FansSwiftFeedPost] {
        screen.posts + screen.posts
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                HStack(spacing: 5) {
                    Circle().fill(Color.red).frame(width: 8, height: 8)
                    Circle().fill(Color.orange).frame(width: 8, height: 8)
                    Circle().fill(Color.green).frame(width: 8, height: 8)
                }

                Spacer()

                Text(screen.browserLabel)
                    .font(.system(size: 10, weight: .black, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.72))

                Spacer()

                HStack(spacing: 6) {
                    Text("X")
                    Text("LIVE")
                }
                .font(.system(size: 10, weight: .black))
                .foregroundStyle(.white.opacity(0.7))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(Color.black.opacity(0.26))

            VStack(alignment: .trailing, spacing: 14) {
                HStack {
                    Text("ON")
                        .font(.system(size: 10, weight: .black))
                        .foregroundStyle(.black)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .background(Color(red: 0.46, green: 0.92, blue: 0.68))
                        .clipShape(Capsule())

                    Spacer()

                    Text(screen.headerLabel)
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(.white)
                }

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(repeatedPosts) { post in
                            FansSwiftFeedPostCard(post: post)
                                .frame(width: 252)
                        }
                    }
                }

                HStack {
                    Text(screen.footer)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white.opacity(0.68))
                    Spacer()
                    Circle()
                        .fill(Color(red: 0.46, green: 0.92, blue: 0.68))
                        .frame(width: 7, height: 7)
                }
            }
            .padding(14)
        }
        .background(Color(red: 0.03, green: 0.04, blue: 0.06).opacity(0.98))
        .overlay(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
    }
}

private struct FansSwiftFeedPostCard: View {
    let post: FansSwiftFeedPost

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .trailing, spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 13, weight: .black))
                        .foregroundStyle(.white.opacity(0.72))

                    Spacer(minLength: 0)

                    VStack(alignment: .trailing, spacing: 2) {
                        Text("• \(post.time)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(.white.opacity(0.5))
                        HStack(spacing: 6) {
                            Text(post.handle)
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(.white.opacity(0.62))
                            Text(post.author)
                                .font(.system(size: 13, weight: .black))
                                .foregroundStyle(.white)
                        }
                    }
                }

                Text(post.text)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.92))
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .lineSpacing(2)

                HStack(spacing: 10) {
                    FansSwiftFeedMetric(systemImage: "paperplane.fill", value: post.shares)
                    FansSwiftFeedMetric(systemImage: "heart.fill", value: post.likes)
                    FansSwiftFeedMetric(systemImage: "arrow.2.squarepath", value: post.reposts)
                    FansSwiftFeedMetric(systemImage: "message.fill", value: post.replies)
                }
            }

            Text(String(post.author.prefix(1)))
                .font(.system(size: 15, weight: .black))
                .foregroundStyle(.white)
                .frame(width: 38, height: 38)
                .background(Color.white.opacity(0.08))
                .clipShape(Circle())
        }
        .padding(12)
        .background(Color.white.opacity(0.04))
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

private struct FansSwiftFeedMetric: View {
    let systemImage: String
    let value: Int

    var body: some View {
        HStack(spacing: 4) {
            Text("\(value)")
                .font(.system(size: 10, weight: .black))
            Image(systemName: systemImage)
                .font(.system(size: 11, weight: .bold))
        }
        .foregroundStyle(.white.opacity(0.76))
    }
}

private enum FansSwiftFormatter {
    static func digits(for value: Int, minimum: Int = 4) -> [String] {
        let normalized = String(max(0, value)).padding(toLength: max(minimum, String(max(0, value)).count), withPad: "0", startingAt: 0)
        return normalized.map { String($0) }
    }

    static func number(_ value: Int) -> String {
        NumberFormatter.localizedString(from: NSNumber(value: value), number: .decimal)
    }
}

struct FansSwiftView_Previews: PreviewProvider {
    static var previews: some View {
        FansSwiftView(isLoggedIn: true, onRequireAuth: {})
            .environment(\.layoutDirection, .rightToLeft)
    }
}