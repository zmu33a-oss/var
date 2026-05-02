import SwiftUI

private enum AdminSwiftSection: CaseIterable, Identifiable {
    case overview
    case users
    case groups
    case xContent
    case videos
    case reports
    case audit

    var id: Self { self }

    var title: String {
        switch self {
        case .overview:
            return "اللوحة"
        case .users:
            return "المستخدمون"
        case .groups:
            return "القروبات"
        case .xContent:
            return "محتوى X"
        case .videos:
            return "الفيديوهات"
        case .reports:
            return "البلاغات"
        case .audit:
            return "السجل"
        }
    }

    var subtitle: String {
        switch self {
        case .overview:
            return "ملخص حي لإيقاع المنصة"
        case .users:
            return "تعديل التوثيق ومراقبة النشاط"
        case .groups:
            return "تنظيف المساحات الحساسة سريعًا"
        case .xContent:
            return "مراجعة التغريدات والمنشورات"
        case .videos:
            return "ترتيب قائمة الفيديوهات"
        case .reports:
            return "متابعة البلاغات حتى الإغلاق"
        case .audit:
            return "آخر إجراءات الإدارة محليًا"
        }
    }

    var systemImage: String {
        switch self {
        case .overview:
            return "rectangle.grid.2x2.fill"
        case .users:
            return "person.2.fill"
        case .groups:
            return "bubble.left.and.bubble.right.fill"
        case .xContent:
            return "text.bubble.fill"
        case .videos:
            return "play.rectangle.fill"
        case .reports:
            return "flag.fill"
        case .audit:
            return "clock.arrow.circlepath"
        }
    }
}

private enum AdminSwiftBadge: String {
    case none
    case gold
    case blue

    var title: String {
        switch self {
        case .none:
            return "بدون توثيق"
        case .gold:
            return "شارة ذهبية"
        case .blue:
            return "شارة زرقاء"
        }
    }

    var accent: Color {
        switch self {
        case .none:
            return Color.white.opacity(0.42)
        case .gold:
            return Color(red: 0.98, green: 0.82, blue: 0.34)
        case .blue:
            return Color(red: 0.35, green: 0.67, blue: 1)
        }
    }

    var next: AdminSwiftBadge {
        switch self {
        case .none:
            return .gold
        case .gold:
            return .blue
        case .blue:
            return .none
        }
    }
}

private enum AdminSwiftReportStatus: String {
    case new
    case reviewing
    case resolved
    case dismissed

    var title: String {
        switch self {
        case .new:
            return "جديد"
        case .reviewing:
            return "قيد المراجعة"
        case .resolved:
            return "تم الإجراء"
        case .dismissed:
            return "مرفوض"
        }
    }

    var accent: Color {
        switch self {
        case .new:
            return Color(red: 1, green: 0.57, blue: 0.2)
        case .reviewing:
            return Color(red: 0.35, green: 0.67, blue: 1)
        case .resolved:
            return Color(red: 0.26, green: 0.88, blue: 0.54)
        case .dismissed:
            return Color.white.opacity(0.42)
        }
    }
}

private struct AdminSwiftMetric: Identifiable {
    let id: String
    let title: String
    let value: String
    let accent: Color
    let icon: String
}

private struct AdminSwiftUser: Identifiable {
    let id: String
    var name: String
    var handle: String
    var badge: AdminSwiftBadge
    var strikes: Int

    static let samples: [AdminSwiftUser] = [
        AdminSwiftUser(id: "u-1", name: "فهد العتيبي", handle: "@fahadx", badge: .gold, strikes: 0),
        AdminSwiftUser(id: "u-2", name: "مشاعل سالم", handle: "@mshael", badge: .blue, strikes: 1),
        AdminSwiftUser(id: "u-3", name: "سلمان VAR", handle: "@varsalman", badge: .none, strikes: 2)
    ]
}

private struct AdminSwiftGroup: Identifiable {
    let id: String
    var name: String
    var members: Int
    var isPrivate: Bool

    static let samples: [AdminSwiftGroup] = [
        AdminSwiftGroup(id: "g-1", name: "تحليل الجولة", members: 124, isPrivate: false),
        AdminSwiftGroup(id: "g-2", name: "نقاش VAR", members: 48, isPrivate: true),
        AdminSwiftGroup(id: "g-3", name: "غرفة المشجعين", members: 219, isPrivate: false)
    ]
}

private struct AdminSwiftVideo: Identifiable {
    let id: String
    var caption: String
    var owner: String
    var plays: Int

    static let samples: [AdminSwiftVideo] = [
        AdminSwiftVideo(id: "v-1", caption: "ملخص الجولة الأخيرة", owner: "@xtiklive", plays: 14800),
        AdminSwiftVideo(id: "v-2", caption: "ردة فعل الهدف", owner: "@fanspulse", plays: 9900),
        AdminSwiftVideo(id: "v-3", caption: "زاوية التحكيم", owner: "@varroom", plays: 7600)
    ]
}

private struct AdminSwiftReport: Identifiable {
    let id: String
    var subject: String
    var reason: String
    var status: AdminSwiftReportStatus

    static let samples: [AdminSwiftReport] = [
        AdminSwiftReport(id: "r-1", subject: "منشور هجومي في X", reason: "إساءة متكررة", status: .new),
        AdminSwiftReport(id: "r-2", subject: "فيديو مخالف", reason: "موسيقى محمية", status: .reviewing),
        AdminSwiftReport(id: "r-3", subject: "تبليغ على قروب", reason: "محتوى مزعج", status: .resolved)
    ]
}

private struct AdminSwiftAuditEntry: Identifiable {
    let id: String
    let title: String
    let details: String
    let timestamp: String

    static let bootstrap: [AdminSwiftAuditEntry] = [
        AdminSwiftAuditEntry(id: "a-1", title: "تجهيز لوحة الإدارة", details: "تم تحميل نسخة Swift المحلية للأدمن.", timestamp: "الآن"),
        AdminSwiftAuditEntry(id: "a-2", title: "فحص التقارير", details: "تمت مزامنة البلاغات المعروضة داخل الواجهة.", timestamp: "قبل دقيقة")
    ]
}

struct AdminSwiftView: View {
    let role: String
    @Binding var posts: [AppSwiftPost]
    let onClose: () -> Void

    @State private var selectedSection: AdminSwiftSection = .overview
    @State private var searchValue = ""
    @State private var users = AdminSwiftUser.samples
    @State private var groups = AdminSwiftGroup.samples
    @State private var videos = AdminSwiftVideo.samples
    @State private var reports = AdminSwiftReport.samples
    @State private var auditEntries = AdminSwiftAuditEntry.bootstrap

    private let shellWidth: CGFloat = 430

    private var filteredUsers: [AdminSwiftUser] {
        let query = searchValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else {
            return users
        }

        return users.filter {
            $0.name.localizedCaseInsensitiveContains(query) ||
            $0.handle.localizedCaseInsensitiveContains(query)
        }
    }

    private var metrics: [AdminSwiftMetric] {
        [
            AdminSwiftMetric(id: "users", title: "المستخدمون", value: "\(users.count)", accent: .white, icon: "person.3.fill"),
            AdminSwiftMetric(id: "posts", title: "منشورات X", value: "\(posts.count)", accent: Color(red: 0.32, green: 0.71, blue: 1), icon: "text.bubble.fill"),
            AdminSwiftMetric(id: "reports", title: "بلاغات مفتوحة", value: "\(reports.filter { $0.status == .new || $0.status == .reviewing }.count)", accent: Color(red: 1, green: 0.57, blue: 0.2), icon: "flag.fill"),
            AdminSwiftMetric(id: "videos", title: "الفيديوهات", value: "\(videos.count)", accent: Color(red: 0.25, green: 0.9, blue: 0.53), icon: "play.rectangle.fill")
        ]
    }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.03, green: 0.04, blue: 0.09),
                    Color(red: 0.08, green: 0.03, blue: 0.06),
                    Color.black
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {
                    heroCard
                    sectionsRail
                    sectionBody
                }
                .padding(.horizontal, 16)
                .padding(.top, 18)
                .padding(.bottom, 120)
                .frame(maxWidth: shellWidth)
                .frame(maxWidth: .infinity)
            }
        }
        .preferredColorScheme(.dark)
        .environment(\.layoutDirection, .rightToLeft)
    }

    private var heroCard: some View {
        VStack(alignment: .trailing, spacing: 14) {
            HStack(spacing: 12) {
                Button(action: onClose) {
                    Image(systemName: "arrow.backward")
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(.white)
                        .frame(width: 42, height: 42)
                        .background(Color.white.opacity(0.08))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)

                Spacer(minLength: 0)

                ZStack {
                    Circle()
                        .fill(Color(red: 0.94, green: 0.31, blue: 0.33).opacity(0.18))
                        .frame(width: 56, height: 56)

                    Image(systemName: "shield.lefthalf.filled")
                        .font(.system(size: 24, weight: .black))
                        .foregroundStyle(Color(red: 1, green: 0.62, blue: 0.42))
                }
            }

            Text("لوحة الإدارة")
                .font(.system(size: 28, weight: .black))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: .trailing)

            Text("الدور الحالي: \(role.uppercased()) • نسخة iOS المحلية جاهزة للتجربة على المحاكي مع إجراءات moderation مباشرة داخل الواجهة.")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white.opacity(0.76))
                .frame(maxWidth: .infinity, alignment: .trailing)
                .lineSpacing(4)

            Text("هذه الواجهة تعمل محليًا داخل مشروع Swift الحالي لتغطية كامل المسارات الأساسية حتى قبل ربط backend الإداري الحقيقي.")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.white.opacity(0.54))
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(20)
        .background(
            LinearGradient(
                colors: [
                    Color.white.opacity(0.1),
                    Color(red: 0.95, green: 0.28, blue: 0.32).opacity(0.18),
                    Color(red: 0.25, green: 0.08, blue: 0.11).opacity(0.9)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }

    private var sectionsRail: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(AdminSwiftSection.allCases) { section in
                    Button {
                        selectedSection = section
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: section.systemImage)
                                .font(.system(size: 12, weight: .bold))

                            Text(section.title)
                                .font(.system(size: 12, weight: .bold))
                        }
                        .foregroundStyle(selectedSection == section ? .black : .white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        .background(selectedSection == section ? Color.white : Color.white.opacity(0.06))
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    @ViewBuilder
    private var sectionBody: some View {
        switch selectedSection {
        case .overview:
            overviewSection
        case .users:
            usersSection
        case .groups:
            groupsSection
        case .xContent:
            xContentSection
        case .videos:
            videosSection
        case .reports:
            reportsSection
        case .audit:
            auditSection
        }
    }

    private var overviewSection: some View {
        VStack(spacing: 14) {
            sectionLead(for: .overview)

            LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                ForEach(metrics) { metric in
                    VStack(alignment: .trailing, spacing: 8) {
                        HStack {
                            Image(systemName: metric.icon)
                                .font(.system(size: 16, weight: .black))
                                .foregroundStyle(metric.accent)

                            Spacer(minLength: 0)
                        }

                        Text(metric.value)
                            .font(.system(size: 28, weight: .black))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity, alignment: .trailing)

                        Text(metric.title)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.62))
                            .frame(maxWidth: .infinity, alignment: .trailing)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, minHeight: 118)
                    .background(Color.white.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                    )
                }
            }

            adminPanel(title: "مؤشرات سريعة", icon: "sparkles") {
                VStack(spacing: 10) {
                    InfoPill(title: "القروبات الخاصة", value: "\(groups.filter(\\.isPrivate).count)")
                    InfoPill(title: "الحسابات الموثقة", value: "\(users.filter { $0.badge != .none }.count)")
                    InfoPill(title: "آخر تقرير", value: reports.first?.status.title ?? "لا يوجد")
                }
            }
        }
    }

    private var usersSection: some View {
        VStack(spacing: 14) {
            sectionLead(for: .users)

            TextField("ابحث باسم المستخدم أو المعرف", text: $searchValue)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled(true)
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(Color.white.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )

            VStack(spacing: 12) {
                ForEach(filteredUsers) { user in
                    adminPanel(title: user.name, icon: "person.crop.circle.fill") {
                        VStack(spacing: 12) {
                            HStack {
                                verificationChip(for: user.badge)

                                Spacer(minLength: 0)

                                VStack(alignment: .trailing, spacing: 4) {
                                    Text(user.handle)
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(.white)

                                    Text("إنذارات: \(user.strikes)")
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundStyle(.white.opacity(0.6))
                                }
                            }

                            Button {
                                cycleBadge(for: user.id)
                            } label: {
                                Text("تبديل حالة التوثيق")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(.black)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(user.badge.accent)
                                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
    }

    private var groupsSection: some View {
        VStack(spacing: 14) {
            sectionLead(for: .groups)

            ForEach(groups) { group in
                adminPanel(title: group.name, icon: group.isPrivate ? "lock.fill" : "bubble.left.and.bubble.right.fill") {
                    VStack(spacing: 12) {
                        InfoPill(title: "عدد الأعضاء", value: "\(group.members)")
                        InfoPill(title: "نوع القروب", value: group.isPrivate ? "خاص" : "عام")

                        Button {
                            removeGroup(group.id)
                        } label: {
                            Text("حذف القروب")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(Color.red.opacity(0.75))
                                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private var xContentSection: some View {
        VStack(spacing: 14) {
            sectionLead(for: .xContent)

            ForEach(posts) { post in
                adminPanel(title: post.user, icon: "text.bubble.fill") {
                    VStack(alignment: .trailing, spacing: 12) {
                        Text(post.content)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(.white.opacity(0.84))
                            .frame(maxWidth: .infinity, alignment: .trailing)

                        HStack(spacing: 10) {
                            InfoPill(title: "الاعجابات", value: "\(post.likes)")
                            InfoPill(title: "التعليقات", value: "\(post.comments.count)")
                        }

                        Button {
                            removePost(post.id)
                        } label: {
                            Text("حذف المنشور")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(Color(red: 0.86, green: 0.22, blue: 0.3))
                                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private var videosSection: some View {
        VStack(spacing: 14) {
            sectionLead(for: .videos)

            ForEach(videos) { video in
                adminPanel(title: video.caption, icon: "play.rectangle.fill") {
                    VStack(spacing: 12) {
                        InfoPill(title: "المالك", value: video.owner)
                        InfoPill(title: "المشاهدات", value: "\(video.plays)")

                        Button {
                            removeVideo(video.id)
                        } label: {
                            Text("حذف الفيديو")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(Color.red.opacity(0.75))
                                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private var reportsSection: some View {
        VStack(spacing: 14) {
            sectionLead(for: .reports)

            ForEach(reports) { report in
                adminPanel(title: report.subject, icon: "flag.fill") {
                    VStack(alignment: .trailing, spacing: 12) {
                        HStack {
                            statusChip(for: report.status)

                            Spacer(minLength: 0)

                            Text(report.reason)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(.white.opacity(0.72))
                        }

                        HStack(spacing: 8) {
                            actionButton(title: "مراجعة", accent: Color(red: 0.35, green: 0.67, blue: 1)) {
                                setReportStatus(report.id, status: .reviewing)
                            }

                            actionButton(title: "إغلاق", accent: Color(red: 0.26, green: 0.88, blue: 0.54)) {
                                setReportStatus(report.id, status: .resolved)
                            }

                            actionButton(title: "رفض", accent: Color.white.opacity(0.16)) {
                                setReportStatus(report.id, status: .dismissed)
                            }
                        }
                    }
                }
            }
        }
    }

    private var auditSection: some View {
        VStack(spacing: 14) {
            sectionLead(for: .audit)

            ForEach(auditEntries) { entry in
                adminPanel(title: entry.title, icon: "clock.arrow.circlepath") {
                    VStack(alignment: .trailing, spacing: 8) {
                        Text(entry.details)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(.white.opacity(0.82))
                            .frame(maxWidth: .infinity, alignment: .trailing)

                        Text(entry.timestamp)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.52))
                            .frame(maxWidth: .infinity, alignment: .trailing)
                    }
                }
            }
        }
    }

    private func sectionLead(for section: AdminSwiftSection) -> some View {
        VStack(alignment: .trailing, spacing: 6) {
            Text(section.title)
                .font(.system(size: 24, weight: .black))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: .trailing)

            Text(section.subtitle)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.white.opacity(0.62))
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
    }

    private func adminPanel<Content: View>(title: String, icon: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .trailing, spacing: 14) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .black))
                    .foregroundStyle(.white.opacity(0.84))

                Spacer(minLength: 0)

                Text(title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
            }

            content()
        }
        .padding(16)
        .background(Color.white.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }

    private func verificationChip(for badge: AdminSwiftBadge) -> some View {
        Text(badge.title)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(badge == .none ? .white.opacity(0.8) : .black)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(badge.accent)
            .clipShape(Capsule())
    }

    private func statusChip(for status: AdminSwiftReportStatus) -> some View {
        Text(status.title)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(status == .dismissed ? .white : .black)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(status.accent)
            .clipShape(Capsule())
    }

    private func actionButton(title: String, accent: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(accent == Color.white.opacity(0.16) ? .white : .black)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 11)
                .background(accent)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func cycleBadge(for userID: String) {
        guard let index = users.firstIndex(where: { $0.id == userID }) else {
            return
        }

        users[index].badge = users[index].badge.next
        appendAudit(title: "تحديث التوثيق", details: "تم تعديل حالة \(users[index].name) إلى \(users[index].badge.title).")
    }

    private func removeGroup(_ groupID: String) {
        guard let group = groups.first(where: { $0.id == groupID }) else {
            return
        }

        groups.removeAll { $0.id == groupID }
        appendAudit(title: "حذف قروب", details: "تم حذف قروب \(group.name) من نسخة الإدارة المحلية.")
    }

    private func removeVideo(_ videoID: String) {
        guard let video = videos.first(where: { $0.id == videoID }) else {
            return
        }

        videos.removeAll { $0.id == videoID }
        appendAudit(title: "حذف فيديو", details: "تم حذف فيديو \(video.caption) التابع لـ \(video.owner).")
    }

    private func removePost(_ postID: Int) {
        guard let post = posts.first(where: { $0.id == postID }) else {
            return
        }

        posts.removeAll { $0.id == postID }
        appendAudit(title: "حذف منشور X", details: "تم حذف منشور \(post.user): \(String(post.content.prefix(42)))")
    }

    private func setReportStatus(_ reportID: String, status: AdminSwiftReportStatus) {
        guard let index = reports.firstIndex(where: { $0.id == reportID }) else {
            return
        }

        reports[index].status = status
        appendAudit(title: "تحديث بلاغ", details: "تم تحديث \(reports[index].subject) إلى الحالة \(status.title).")
    }

    private func appendAudit(title: String, details: String) {
        auditEntries.insert(
            AdminSwiftAuditEntry(
                id: UUID().uuidString,
                title: title,
                details: details,
                timestamp: "الآن"
            ),
            at: 0
        )
    }
}

struct AdminSwiftView_Previews: PreviewProvider {
    static var previews: some View {
        AdminSwiftView(role: "owner", posts: .constant(AppSwiftPost.samples), onClose: {})
    }
}