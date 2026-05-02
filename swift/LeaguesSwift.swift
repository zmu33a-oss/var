import SwiftUI

enum LeaguesSwiftSheetTab {
    case lineup
    case events
    case poll

    var title: String {
        switch self {
        case .lineup:
            return "التشكيلة الأساسية"
        case .events:
            return "أحداث المباراة"
        case .poll:
            return "تصويت الجمهور"
        }
    }

    var subtitle: String {
        switch self {
        case .lineup:
            return "التشكيلة الأساسية جاهزة"
        case .events:
            return "أحداث تجريبية جاهزة"
        case .poll:
            return "ضغط مباشر بين الفريقين"
        }
    }
}

enum LeaguesSwiftTeamSide {
    case home
    case away
}

struct LeaguesSwiftNewsItem: Identifiable {
    let id: String
    let badge: String
    let title: String
    let summary: String
    let time: String
    let accent: Color
}

struct LeaguesSwiftEvent: Identifiable {
    let id: String
    let minute: String
    let title: String
    let detail: String
}

struct LeaguesSwiftBenchPlayer: Identifiable {
    let id: String
    let name: String
    let number: Int
}

struct LeaguesSwiftTacticalPlayer: Identifiable, Equatable {
    let id: String
    let name: String
    let number: Int
    var x: CGFloat
    var y: CGFloat
    let primary: Color
    let secondary: Color
}

struct LeaguesSwiftTeamLineup {
    let formation: String
    let starters: [LeaguesSwiftTacticalPlayer]
    let bench: [LeaguesSwiftBenchPlayer]
}

struct LeaguesSwiftTeam {
    let side: LeaguesSwiftTeamSide
    let name: String
    let shortName: String
    let score: Int
    let colors: [Color]
    let lineup: LeaguesSwiftTeamLineup
}

struct LeaguesSwiftMatch {
    let leagueName: String
    let liveLabel: String
    let home: LeaguesSwiftTeam
    let away: LeaguesSwiftTeam
    let events: [LeaguesSwiftEvent]
    let pressureBars: [CGFloat]
    let homeSupport: Int
    let awaySupport: Int
    let news: [LeaguesSwiftNewsItem]
    let demoMessage: String

    var homeSupportShare: CGFloat {
        let total = max(homeSupport + awaySupport, 1)
        return CGFloat(homeSupport) / CGFloat(total)
    }

    static let demo: LeaguesSwiftMatch = {
        let homePlayers = [
            LeaguesSwiftTacticalPlayer(id: "h1", name: "حارس الهلال", number: 37, x: 0.5, y: 0.12, primary: Color(red: 0.41, green: 0.78, blue: 1), secondary: Color(red: 0.14, green: 0.28, blue: 0.66)),
            LeaguesSwiftTacticalPlayer(id: "h2", name: "ظهير أيمن الهلال", number: 66, x: 0.18, y: 0.28, primary: Color(red: 0.41, green: 0.78, blue: 1), secondary: Color(red: 0.14, green: 0.28, blue: 0.66)),
            LeaguesSwiftTacticalPlayer(id: "h3", name: "قلب دفاع الهلال 1", number: 3, x: 0.4, y: 0.28, primary: Color(red: 0.41, green: 0.78, blue: 1), secondary: Color(red: 0.14, green: 0.28, blue: 0.66)),
            LeaguesSwiftTacticalPlayer(id: "h4", name: "قلب دفاع الهلال 2", number: 5, x: 0.6, y: 0.28, primary: Color(red: 0.41, green: 0.78, blue: 1), secondary: Color(red: 0.14, green: 0.28, blue: 0.66)),
            LeaguesSwiftTacticalPlayer(id: "h5", name: "ظهير أيسر الهلال", number: 12, x: 0.82, y: 0.28, primary: Color(red: 0.41, green: 0.78, blue: 1), secondary: Color(red: 0.14, green: 0.28, blue: 0.66)),
            LeaguesSwiftTacticalPlayer(id: "h6", name: "محور الهلال", number: 8, x: 0.28, y: 0.49, primary: Color(red: 0.41, green: 0.78, blue: 1), secondary: Color(red: 0.14, green: 0.28, blue: 0.66)),
            LeaguesSwiftTacticalPlayer(id: "h7", name: "وسط الهلال", number: 16, x: 0.5, y: 0.49, primary: Color(red: 0.41, green: 0.78, blue: 1), secondary: Color(red: 0.14, green: 0.28, blue: 0.66)),
            LeaguesSwiftTacticalPlayer(id: "h8", name: "صانع لعب الهلال", number: 10, x: 0.72, y: 0.49, primary: Color(red: 0.41, green: 0.78, blue: 1), secondary: Color(red: 0.14, green: 0.28, blue: 0.66)),
            LeaguesSwiftTacticalPlayer(id: "h9", name: "جناح أيمن الهلال", number: 77, x: 0.18, y: 0.73, primary: Color(red: 0.41, green: 0.78, blue: 1), secondary: Color(red: 0.14, green: 0.28, blue: 0.66)),
            LeaguesSwiftTacticalPlayer(id: "h10", name: "مهاجم الهلال", number: 9, x: 0.5, y: 0.78, primary: Color(red: 0.41, green: 0.78, blue: 1), secondary: Color(red: 0.14, green: 0.28, blue: 0.66)),
            LeaguesSwiftTacticalPlayer(id: "h11", name: "جناح أيسر الهلال", number: 29, x: 0.82, y: 0.73, primary: Color(red: 0.41, green: 0.78, blue: 1), secondary: Color(red: 0.14, green: 0.28, blue: 0.66))
        ]

        let awayPlayers = [
            LeaguesSwiftTacticalPlayer(id: "a1", name: "حارس النصر", number: 44, x: 0.5, y: 0.88, primary: Color(red: 1, green: 0.76, blue: 0.45), secondary: Color(red: 0.64, green: 0.31, blue: 0.1)),
            LeaguesSwiftTacticalPlayer(id: "a2", name: "ظهير أيمن النصر", number: 2, x: 0.18, y: 0.72, primary: Color(red: 1, green: 0.76, blue: 0.45), secondary: Color(red: 0.64, green: 0.31, blue: 0.1)),
            LeaguesSwiftTacticalPlayer(id: "a3", name: "قلب دفاع النصر 1", number: 4, x: 0.4, y: 0.72, primary: Color(red: 1, green: 0.76, blue: 0.45), secondary: Color(red: 0.64, green: 0.31, blue: 0.1)),
            LeaguesSwiftTacticalPlayer(id: "a4", name: "قلب دفاع النصر 2", number: 17, x: 0.6, y: 0.72, primary: Color(red: 1, green: 0.76, blue: 0.45), secondary: Color(red: 0.64, green: 0.31, blue: 0.1)),
            LeaguesSwiftTacticalPlayer(id: "a5", name: "ظهير أيسر النصر", number: 13, x: 0.82, y: 0.72, primary: Color(red: 1, green: 0.76, blue: 0.45), secondary: Color(red: 0.64, green: 0.31, blue: 0.1)),
            LeaguesSwiftTacticalPlayer(id: "a6", name: "محور النصر 1", number: 6, x: 0.33, y: 0.54, primary: Color(red: 1, green: 0.76, blue: 0.45), secondary: Color(red: 0.64, green: 0.31, blue: 0.1)),
            LeaguesSwiftTacticalPlayer(id: "a7", name: "محور النصر 2", number: 14, x: 0.67, y: 0.54, primary: Color(red: 1, green: 0.76, blue: 0.45), secondary: Color(red: 0.64, green: 0.31, blue: 0.1)),
            LeaguesSwiftTacticalPlayer(id: "a8", name: "جناح أيمن النصر", number: 11, x: 0.18, y: 0.34, primary: Color(red: 1, green: 0.76, blue: 0.45), secondary: Color(red: 0.64, green: 0.31, blue: 0.1)),
            LeaguesSwiftTacticalPlayer(id: "a9", name: "صانع لعب النصر", number: 25, x: 0.5, y: 0.38, primary: Color(red: 1, green: 0.76, blue: 0.45), secondary: Color(red: 0.64, green: 0.31, blue: 0.1)),
            LeaguesSwiftTacticalPlayer(id: "a10", name: "جناح أيسر النصر", number: 7, x: 0.82, y: 0.34, primary: Color(red: 1, green: 0.76, blue: 0.45), secondary: Color(red: 0.64, green: 0.31, blue: 0.1)),
            LeaguesSwiftTacticalPlayer(id: "a11", name: "مهاجم النصر", number: 9, x: 0.5, y: 0.18, primary: Color(red: 1, green: 0.76, blue: 0.45), secondary: Color(red: 0.64, green: 0.31, blue: 0.1))
        ]

        return LeaguesSwiftMatch(
            leagueName: "وضع تجريبي VAR X",
            liveLabel: "DEMO",
            home: LeaguesSwiftTeam(
                side: .home,
                name: "الهلال",
                shortName: "هـ",
                score: 2,
                colors: [Color(red: 0.41, green: 0.78, blue: 1), Color(red: 0.14, green: 0.28, blue: 0.66)],
                lineup: LeaguesSwiftTeamLineup(
                    formation: "4-3-3",
                    starters: homePlayers,
                    bench: [
                        LeaguesSwiftBenchPlayer(id: "hb1", name: "بديل الهلال 1", number: 18),
                        LeaguesSwiftBenchPlayer(id: "hb2", name: "بديل الهلال 2", number: 24),
                        LeaguesSwiftBenchPlayer(id: "hb3", name: "بديل الهلال 3", number: 31),
                        LeaguesSwiftBenchPlayer(id: "hb4", name: "بديل الهلال 4", number: 70),
                        LeaguesSwiftBenchPlayer(id: "hb5", name: "بديل الهلال 5", number: 88)
                    ]
                )
            ),
            away: LeaguesSwiftTeam(
                side: .away,
                name: "النصر",
                shortName: "ن",
                score: 1,
                colors: [Color(red: 1, green: 0.76, blue: 0.45), Color(red: 0.64, green: 0.31, blue: 0.1)],
                lineup: LeaguesSwiftTeamLineup(
                    formation: "4-2-3-1",
                    starters: awayPlayers,
                    bench: [
                        LeaguesSwiftBenchPlayer(id: "ab1", name: "بديل النصر 1", number: 19),
                        LeaguesSwiftBenchPlayer(id: "ab2", name: "بديل النصر 2", number: 21),
                        LeaguesSwiftBenchPlayer(id: "ab3", name: "بديل النصر 3", number: 27),
                        LeaguesSwiftBenchPlayer(id: "ab4", name: "بديل النصر 4", number: 30),
                        LeaguesSwiftBenchPlayer(id: "ab5", name: "بديل النصر 5", number: 80)
                    ]
                )
            ),
            events: [
                LeaguesSwiftEvent(id: "e1", minute: "12'", title: "ضغط عالٍ", detail: "الهلال يغلق العمق ويستعيد الكرة بسرعة في الثلث الأوسط."),
                LeaguesSwiftEvent(id: "e2", minute: "29'", title: "فرصة خطرة", detail: "النصر يصل خلف الظهير الأيسر بتبادل سريع على الطرف."),
                LeaguesSwiftEvent(id: "e3", minute: "53'", title: "تعديل تكتيكي", detail: "تحويل الجناح إلى العمق لخلق زيادة عددية أمام منطقة الجزاء."),
                LeaguesSwiftEvent(id: "e4", minute: "77'", title: "تبديل تجريبي", detail: "دخول جناح سريع لزيادة العرضيات والضغط على خط الدفاع.")
            ],
            pressureBars: [20, 20, 21, 22, 24, 25, 27, 29, 31, 29, 24, 20],
            homeSupport: 2578,
            awaySupport: 1950,
            news: [
                LeaguesSwiftNewsItem(id: "n1", badge: "عاجل", title: "الهلال يراجع شكل الضغط قبل المواجهة القادمة", summary: "الطاقم الفني ركّز في الحصة الأخيرة على الضغط العكسي وسرعة التحول بعد افتكاك الكرة.", time: "قبل 8 دقائق", accent: Color(red: 0.41, green: 0.78, blue: 1)),
                LeaguesSwiftNewsItem(id: "n2", badge: "متابعة", title: "النصر يجهّز خطة بديلة في الثلث الأخير", summary: "التركيز الحالي على زيادة الكثافة حول الصندوق وخلق حل ثالث خلف المهاجم الصريح.", time: "قبل 14 دقيقة", accent: Color(red: 1, green: 0.69, blue: 0.29)),
                LeaguesSwiftNewsItem(id: "n3", badge: "سوق", title: "أندية الدوري تراقب نافذة الانتقالات الصيفية مبكرًا", summary: "العمل مستمر على تدعيم المراكز الحساسة مع أولوية واضحة للمحور وقلب الدفاع والظهير الأيسر.", time: "قبل 31 دقيقة", accent: Color(red: 0.84, green: 0.55, blue: 1)),
                LeaguesSwiftNewsItem(id: "n4", badge: "تقارير", title: "الاتحاد يرفع نسق التحضير البدني في بداية الأسبوع", summary: "الجهاز الفني يريد استعادة الشراسة في الالتحامات القصيرة وتقليل المسافات بين الخطوط.", time: "قبل 52 دقيقة", accent: Color(red: 1, green: 0.84, blue: 0.43)),
                LeaguesSwiftNewsItem(id: "n5", badge: "المنتخب", title: "قراءة أولية لقائمة المنتخب ترفع أسهم بعض الأسماء المحلية", summary: "الاستقرار على العناصر الأساسية قائم، لكن المنافسة اشتعلت على مركز الجناح والظهير.", time: "قبل ساعة", accent: Color(red: 0.49, green: 0.89, blue: 0.69))
            ],
            demoMessage: "وضع تجريبي واضح لتجربة التشكيلة وVAR X والمشاركة على X. هذه البيانات ليست مباراة مباشرة."
        )
    }()
}

struct LeaguesSwiftView: View {
    let onShareVarXBoard: (String) -> Void

    @State private var match = LeaguesSwiftMatch.demo
    @State private var isBreakingNewsOpen = false
    @State private var isSheetOpen = false
    @State private var activeSheetTab: LeaguesSwiftSheetTab = .lineup
    @State private var isVarXOpen = false
    @State private var lineupTeam: LeaguesSwiftTeamSide = .home
    @State private var varXTeam: LeaguesSwiftTeamSide = .home
    @State private var homeVarXPlayers = LeaguesSwiftMatch.demo.home.lineup.starters
    @State private var awayVarXPlayers = LeaguesSwiftMatch.demo.away.lineup.starters
    @State private var varXNotes = ""
    @State private var shareFeedback = ""

    var body: some View {
        ZStack(alignment: .top) {
            LeaguesSwiftBackground()
                .ignoresSafeArea()

            VStack(spacing: 12) {
                breakingNewsSection
                    .frame(maxWidth: 430)

                matchCard
                    .frame(maxWidth: 430)

                Spacer(minLength: 0)
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            .padding(.bottom, 24)

            if isSheetOpen {
                sheetOverlay
            }

            if isVarXOpen {
                varXOverlay
            }
        }
        .preferredColorScheme(.dark)
        .environment(\.layoutDirection, .rightToLeft)
    }

    private var breakingNewsSection: some View {
        VStack(spacing: 0) {
            if isBreakingNewsOpen {
                VStack(spacing: 16) {
                    HStack(alignment: .top) {
                        Button {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                                isBreakingNewsOpen = false
                            }
                        } label: {
                            Image(systemName: "xmark")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(width: 32, height: 32)
                                .background(Color.white.opacity(0.08))
                                .clipShape(Circle())
                        }
                        .buttonStyle(.plain)

                        Spacer()

                        VStack(alignment: .trailing, spacing: 4) {
                            Text("آخر الأخبار الرياضية")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(.white.opacity(0.68))
                            Text("موجز الأخبار السريعة")
                                .font(.system(size: 20, weight: .black))
                                .foregroundStyle(.white)
                        }
                    }

                    VStack(spacing: 10) {
                        ForEach(match.news) { item in
                            VStack(alignment: .trailing, spacing: 8) {
                                HStack {
                                    Text(item.time)
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundStyle(.white.opacity(0.62))
                                    Spacer()
                                    Text(item.badge)
                                        .font(.system(size: 10, weight: .black))
                                        .foregroundStyle(.white)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 5)
                                        .background(item.accent)
                                        .clipShape(Capsule())
                                }

                                Text(item.title)
                                    .font(.system(size: 15, weight: .black))
                                    .foregroundStyle(.white)
                                    .frame(maxWidth: .infinity, alignment: .trailing)

                                Text(item.summary)
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(.white.opacity(0.72))
                                    .frame(maxWidth: .infinity, alignment: .trailing)
                                    .lineSpacing(2)
                            }
                            .padding(14)
                            .background(Color.white.opacity(0.06))
                            .overlay(
                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                    .stroke(item.accent.opacity(0.42), lineWidth: 1)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        }
                    }
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 28, style: .continuous)
                        .fill(Color(red: 0.05, green: 0.07, blue: 0.11).opacity(0.98))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 28, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
                .transition(.move(edge: .top).combined(with: .opacity))
            }

            HStack(spacing: 0) {
                Button {
                    withAnimation(.spring(response: 0.38, dampingFraction: 0.84)) {
                        isBreakingNewsOpen.toggle()
                    }
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: isBreakingNewsOpen ? "chevron.up" : "chevron.down")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(.white)
                            .rotationEffect(.degrees(isBreakingNewsOpen ? 180 : 0))

                        Text("آخر الأخبار الرياضية")
                            .font(.system(size: 13, weight: .black))
                            .foregroundStyle(.white)

                        Text("عاجل")
                            .font(.system(size: 11, weight: .black))
                            .foregroundStyle(.black)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 6)
                            .background(Color(red: 1, green: 0.38, blue: 0.35))
                            .clipShape(Capsule())
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .padding(.horizontal, 14)
                    .background(Color.black.opacity(0.62))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                }
                .buttonStyle(.plain)
            }
            .padding(.top, isBreakingNewsOpen ? 10 : 0)
        }
    }

    private var matchCard: some View {
        VStack(spacing: 18) {
            HStack {
                iconButton(systemName: "bell.fill", label: "Match notifications")

                Spacer()

                Text(match.leagueName)
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(.white)

                Spacer()

                Button {
                    withAnimation(.spring(response: 0.36, dampingFraction: 0.86)) {
                        isVarXOpen = true
                    }
                } label: {
                    Text("VAR X")
                        .font(.system(size: 14, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 18)
                        .padding(.vertical, 10)
                        .background(Color.black.opacity(0.58))
                        .overlay(
                            Capsule()
                                .stroke(Color.white.opacity(0.12), lineWidth: 1)
                        )
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }

            HStack {
                teamColumn(team: match.away)
                Spacer(minLength: 8)
                scoreBlock
                Spacer(minLength: 8)
                teamColumn(team: match.home)
            }

            pressureSection

            Text(match.demoMessage)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(.white.opacity(0.9))
                .frame(maxWidth: .infinity, alignment: .trailing)
                .padding(12)
                .background(Color(red: 0.41, green: 0.78, blue: 1).opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color(red: 0.41, green: 0.78, blue: 1).opacity(0.14), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

            HStack(spacing: 10) {
                sheetTabButton(tab: .events, systemName: "square.grid.2x2.fill", title: "الاحداث")
                sheetTabButton(tab: .lineup, systemName: "flag.fill", title: "التشكيله")
                sheetTabButton(tab: .poll, systemName: "chart.bar.fill", title: "التصويت")
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            Color(red: 0.07, green: 0.1, blue: 0.18).opacity(0.98),
                            Color(red: 0.03, green: 0.04, blue: 0.08).opacity(0.99)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .stroke(Color.white.opacity(0.07), lineWidth: 1)
        )
    }

    private var scoreBlock: some View {
        VStack(spacing: 8) {
            HStack(spacing: 8) {
                Text("\(match.home.score)")
                Text("-")
                    .foregroundStyle(.white.opacity(0.54))
                Text("\(match.away.score)")
            }
            .font(.system(size: 34, weight: .black, design: .rounded))
            .foregroundStyle(.white)

            HStack(spacing: 6) {
                Circle()
                    .fill(Color(red: 1, green: 0.29, blue: 0.35))
                    .frame(width: 8, height: 8)
                Text(match.liveLabel)
                    .font(.system(size: 12, weight: .black))
                    .foregroundStyle(.white.opacity(0.9))
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color.white.opacity(0.08))
            .clipShape(Capsule())
        }
    }

    private var pressureSection: some View {
        VStack(spacing: 10) {
            HStack {
                Text("R   L")
                    .font(.system(size: 12, weight: .black))
                    .foregroundStyle(.white.opacity(0.64))
                Spacer()
                Text("Pressure Bar")
                    .font(.system(size: 12, weight: .black))
                    .foregroundStyle(.white.opacity(0.78))
            }

            ZStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(Color.white.opacity(0.05))
                    .frame(height: 76)

                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [Color(red: 1, green: 0.36, blue: 0.35).opacity(0.26), Color(red: 0.38, green: 0.7, blue: 1).opacity(0.18)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(height: 52)

                HStack(alignment: .bottom, spacing: 7) {
                    ForEach(Array(match.pressureBars.enumerated()), id: \.offset) { index, value in
                        Capsule()
                            .fill(index < 7 ? Color(red: 1, green: 0.46, blue: 0.34) : Color(red: 0.42, green: 0.76, blue: 1))
                            .frame(width: 10, height: value)
                    }
                }
            }
        }
    }

    private var sheetOverlay: some View {
        ZStack(alignment: .bottom) {
            Color.black.opacity(0.42)
                .ignoresSafeArea()
                .onTapGesture {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                        isSheetOpen = false
                    }
                }

            VStack(spacing: 0) {
                HStack {
                    Button {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                            isSheetOpen = false
                        }
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 36, height: 36)
                            .background(Color.white.opacity(0.08))
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        Text(activeSheetTab.title)
                            .font(.system(size: 17, weight: .black))
                            .foregroundStyle(.white)
                        Text(activeSheetTab.subtitle)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.white.opacity(0.68))
                    }
                }
                .padding(16)

                Group {
                    switch activeSheetTab {
                    case .lineup:
                        lineupSheetBody
                    case .events:
                        eventsSheetBody
                    case .poll:
                        pollSheetBody
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 18)
            }
            .frame(maxWidth: 430)
            .background(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .fill(Color(red: 0.04, green: 0.06, blue: 0.1).opacity(0.98))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
            .padding(.horizontal, 12)
            .padding(.bottom, 18)
            .transition(.move(edge: .bottom).combined(with: .opacity))
        }
    }

    private var lineupSheetBody: some View {
        VStack(spacing: 14) {
            LeaguesSwiftTeamSwitch(
                selected: $lineupTeam,
                homeTeam: match.home,
                awayTeam: match.away
            )

            LeaguesSwiftLineupSummaryCard(team: selectedLineupTeam, summary: "\(selectedLineupTeam.lineup.formation) · \(selectedLineupTeam.lineup.starters.count) لاعب أساسي")

            LeaguesSwiftStaticPitch(players: selectedLineupTeam.lineup.starters, watermark: nil)
                .frame(height: 320)

            VStack(spacing: 10) {
                HStack {
                    Text("\(selectedLineupTeam.name)")
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(.white)
                    Spacer()
                    Text("الفريق المعروض")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white.opacity(0.62))
                }
                .padding(12)
                .background(Color.white.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))

                VStack(alignment: .trailing, spacing: 10) {
                    HStack {
                        Text("دكة البدلاء")
                            .font(.system(size: 14, weight: .black))
                            .foregroundStyle(.white)
                        Spacer()
                        Text("البدلاء")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.62))
                    }

                    FlexibleBenchGrid(players: selectedLineupTeam.lineup.bench)
                }
                .padding(12)
                .background(Color.white.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
        }
    }

    private var eventsSheetBody: some View {
        VStack(alignment: .trailing, spacing: 12) {
            HStack {
                Text("الاحداث")
                    .font(.system(size: 14, weight: .black))
                    .foregroundStyle(.white)
                Spacer()
                Text("ضغط وتبديلات")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.white.opacity(0.62))
            }

            VStack(spacing: 10) {
                ForEach(Array(match.events.enumerated()), id: \.element.id) { index, event in
                    HStack(alignment: .top, spacing: 10) {
                        VStack(spacing: 0) {
                            Circle()
                                .fill(Color(red: 0.42, green: 0.76, blue: 1))
                                .frame(width: 10, height: 10)

                            if index < match.events.count - 1 {
                                Rectangle()
                                    .fill(Color.white.opacity(0.12))
                                    .frame(width: 2)
                                    .frame(maxHeight: .infinity)
                            }
                        }
                        .frame(width: 12)

                        VStack(alignment: .trailing, spacing: 6) {
                            Text("\(event.title) · \(event.detail)")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity, alignment: .trailing)
                            Text(event.minute)
                                .font(.system(size: 12, weight: .black))
                                .foregroundStyle(.white.opacity(0.68))
                                .frame(maxWidth: .infinity, alignment: .trailing)
                        }
                        .padding(12)
                        .background(Color.white.opacity(0.06))
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }
                }
            }
        }
    }

    private var pollSheetBody: some View {
        LeaguesSwiftPollCard(match: match)
    }

    private var varXOverlay: some View {
        ZStack(alignment: .bottom) {
            Color.black.opacity(0.5)
                .ignoresSafeArea()
                .onTapGesture {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                        isVarXOpen = false
                    }
                }

            VStack(spacing: 16) {
                HStack {
                    Button {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                            isVarXOpen = false
                        }
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 36, height: 36)
                            .background(Color.white.opacity(0.08))
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)

                    Spacer()

                    VStack(alignment: .trailing, spacing: 3) {
                        Text("VAR X سبورة المدرب")
                            .font(.system(size: 18, weight: .black))
                            .foregroundStyle(.white)
                        Text(match.demoMessage)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.white.opacity(0.72))
                            .multilineTextAlignment(.trailing)
                    }
                }

                LeaguesSwiftTeamSwitch(
                    selected: $varXTeam,
                    homeTeam: match.home,
                    awayTeam: match.away
                )

                LeaguesSwiftLineupSummaryCard(team: selectedVarXTeam, summary: "\(selectedVarXTeam.lineup.formation) · حرّك اللاعبين كما تريد")

                Group {
                    if varXTeam == .home {
                        LeaguesSwiftInteractivePitch(players: $homeVarXPlayers, watermark: "VAR X")
                    } else {
                        LeaguesSwiftInteractivePitch(players: $awayVarXPlayers, watermark: "VAR X")
                    }
                }
                .frame(height: 340)

                Text("اسحب أي لاعب على أرضية الملعب لصناعة الرسم التكتيكي الخاص بك.")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.white.opacity(0.72))
                    .frame(maxWidth: .infinity, alignment: .trailing)

                VStack(alignment: .trailing, spacing: 10) {
                    HStack {
                        Text("ملاحظات المدرب")
                            .font(.system(size: 15, weight: .black))
                            .foregroundStyle(.white)
                        Spacer()
                        Text("ملاحظات قابلة للمشاركة")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.62))
                    }

                    TextEditor(text: $varXNotes)
                        .scrollContentBackground(.hidden)
                        .frame(height: 110)
                        .padding(10)
                        .background(Color.white.opacity(0.06))
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        )
                }
                .padding(14)
                .background(Color.white.opacity(0.05))
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))

                if !shareFeedback.isEmpty {
                    Text(shareFeedback)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color(red: 0.62, green: 0.82, blue: 1))
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }

                HStack(spacing: 10) {
                    Button {
                        resetVarXBoard()
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "arrow.counterclockwise")
                            Text("إعادة الضبط")
                        }
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(Color.white.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }
                    .buttonStyle(.plain)

                    Button {
                        shareVarXBoard()
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "square.and.arrow.up")
                            Text("مشاركة على X")
                        }
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(.black)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(16)
            .frame(maxWidth: 430)
            .background(
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .fill(Color(red: 0.04, green: 0.06, blue: 0.1).opacity(0.98))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
            .padding(.horizontal, 12)
            .padding(.bottom, 18)
            .transition(.move(edge: .bottom).combined(with: .opacity))
        }
    }

    private var selectedLineupTeam: LeaguesSwiftTeam {
        lineupTeam == .home ? match.home : match.away
    }

    private var selectedVarXTeam: LeaguesSwiftTeam {
        varXTeam == .home ? match.home : match.away
    }

    private func iconButton(systemName: String, label: String) -> some View {
        Image(systemName: systemName)
            .font(.system(size: 14, weight: .bold))
            .foregroundStyle(.white)
            .frame(width: 34, height: 34)
            .background(Color.white.opacity(0.08))
            .clipShape(Circle())
            .accessibilityLabel(label)
    }

    private func teamColumn(team: LeaguesSwiftTeam) -> some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: team.colors,
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 62, height: 62)

                Text(team.shortName)
                    .font(.system(size: 26, weight: .black))
                    .foregroundStyle(.white)
            }

            Text(team.name)
                .font(.system(size: 18, weight: .black))
                .foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity)
    }

    private func sheetTabButton(tab: LeaguesSwiftSheetTab, systemName: String, title: String) -> some View {
        Button {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.86)) {
                activeSheetTab = tab
                isSheetOpen = true
            }
        } label: {
            HStack(spacing: 8) {
                Image(systemName: systemName)
                    .font(.system(size: 12, weight: .bold))
                Text(title)
                    .font(.system(size: 12, weight: .black))
            }
            .foregroundStyle(activeSheetTab == tab && isSheetOpen ? Color.black : .white)
            .frame(maxWidth: .infinity)
            .frame(height: 42)
            .background(activeSheetTab == tab && isSheetOpen ? Color.white : Color.white.opacity(0.06))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color.white.opacity(activeSheetTab == tab && isSheetOpen ? 0 : 0.08), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func resetVarXBoard() {
        homeVarXPlayers = match.home.lineup.starters
        awayVarXPlayers = match.away.lineup.starters
        shareFeedback = "تمت إعادة ضبط السبورة"
    }

    private func shareVarXBoard() {
        let teamName = selectedVarXTeam.name
        let note = varXNotes.trimmingCharacters(in: .whitespacesAndNewlines)
        let summary = note.isEmpty ? "رسم تكتيكي قابل للتحريك من داخل VAR X." : note
        let content = "سبورة VAR X | \(teamName)\n\(match.leagueName)\n\(summary)"
        onShareVarXBoard(content)
        shareFeedback = "تم تجهيز المشاركة على X"
        withAnimation(.spring(response: 0.35, dampingFraction: 0.86)) {
            isVarXOpen = false
        }
    }
}

struct LeaguesSwiftBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.02, green: 0.05, blue: 0.11),
                    Color(red: 0.01, green: 0.03, blue: 0.08),
                    Color.black
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            RadialGradient(
                colors: [
                    Color(red: 0.1, green: 0.26, blue: 0.52).opacity(0.34),
                    .clear
                ],
                center: .init(x: 0.3, y: 0.12),
                startRadius: 6,
                endRadius: 280
            )
        }
    }
}

struct LeaguesSwiftTeamSwitch: View {
    @Binding var selected: LeaguesSwiftTeamSide
    let homeTeam: LeaguesSwiftTeam
    let awayTeam: LeaguesSwiftTeam

    var body: some View {
        HStack(spacing: 10) {
            switchButton(team: awayTeam, side: .away)
            switchButton(team: homeTeam, side: .home)
        }
    }

    private func switchButton(team: LeaguesSwiftTeam, side: LeaguesSwiftTeamSide) -> some View {
        Button {
            selected = side
        } label: {
            HStack(spacing: 8) {
                Text(team.shortName)
                    .font(.system(size: 12, weight: .black))
                    .foregroundStyle(.white)
                    .frame(width: 22, height: 22)
                    .background(
                        Circle()
                            .fill(LinearGradient(colors: team.colors, startPoint: .topLeading, endPoint: .bottomTrailing))
                    )

                Text(team.name)
                    .font(.system(size: 13, weight: .black))
            }
            .foregroundStyle(selected == side ? Color.black : .white)
            .frame(maxWidth: .infinity)
            .frame(height: 42)
            .background(selected == side ? Color.white : Color.white.opacity(0.06))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

struct LeaguesSwiftLineupSummaryCard: View {
    let team: LeaguesSwiftTeam
    let summary: String

    var body: some View {
        HStack {
            Text(summary)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(.white.opacity(0.68))

            Spacer()

            HStack(spacing: 10) {
                VStack(alignment: .trailing, spacing: 2) {
                    Text(team.name)
                        .font(.system(size: 13, weight: .black))
                        .foregroundStyle(.white)
                    Text(team.lineup.formation)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.68))
                }

                Circle()
                    .fill(LinearGradient(colors: team.colors, startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 30, height: 30)
                    .overlay(
                        Text(team.shortName)
                            .font(.system(size: 12, weight: .black))
                            .foregroundStyle(.white)
                    )
            }
        }
        .padding(12)
        .background(Color.white.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

struct LeaguesSwiftPitchBase: View {
    let watermark: String?

    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let height = geometry.size.height

            ZStack {
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0.05, green: 0.24, blue: 0.14),
                                Color(red: 0.02, green: 0.16, blue: 0.09)
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )

                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .stroke(Color.white.opacity(0.14), lineWidth: 1)

                Rectangle()
                    .fill(Color.white.opacity(0.18))
                    .frame(width: 2, height: height * 0.78)

                Circle()
                    .stroke(Color.white.opacity(0.18), lineWidth: 2)
                    .frame(width: 72, height: 72)

                groupBox(width: width * 0.36, height: height * 0.16)
                    .offset(y: -(height * 0.36))

                groupBox(width: width * 0.36, height: height * 0.16)
                    .offset(y: height * 0.36)

                groupBox(width: width * 0.18, height: height * 0.08)
                    .offset(y: -(height * 0.45))

                groupBox(width: width * 0.18, height: height * 0.08)
                    .offset(y: height * 0.45)

                if let watermark {
                    Text(watermark)
                        .font(.system(size: 34, weight: .black, design: .rounded))
                        .foregroundStyle(.white.opacity(0.08))
                        .rotationEffect(.degrees(-18))
                }
            }
        }
    }

    private func groupBox(width: CGFloat, height: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: 0)
            .stroke(Color.white.opacity(0.18), lineWidth: 2)
            .frame(width: width, height: height)
    }
}

struct LeaguesSwiftStaticPitch: View {
    let players: [LeaguesSwiftTacticalPlayer]
    let watermark: String?

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                LeaguesSwiftPitchBase(watermark: watermark)

                ForEach(players) { player in
                    LeaguesSwiftPitchPlayerView(player: player)
                        .position(x: player.x * geometry.size.width, y: player.y * geometry.size.height)
                }
            }
        }
    }
}

struct LeaguesSwiftInteractivePitch: View {
    @Binding var players: [LeaguesSwiftTacticalPlayer]
    let watermark: String?

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                LeaguesSwiftPitchBase(watermark: watermark)

                ForEach(players) { player in
                    LeaguesSwiftPitchPlayerView(player: player)
                        .position(x: player.x * geometry.size.width, y: player.y * geometry.size.height)
                        .gesture(
                            DragGesture(minimumDistance: 0)
                                .onChanged { value in
                                    updatePlayer(id: player.id, location: value.location, boardSize: geometry.size)
                                }
                        )
                }
            }
        }
    }

    private func updatePlayer(id: String, location: CGPoint, boardSize: CGSize) {
        guard let index = players.firstIndex(where: { $0.id == id }) else { return }

        let clampedX = min(max(location.x / max(boardSize.width, 1), 0.08), 0.92)
        let clampedY = min(max(location.y / max(boardSize.height, 1), 0.08), 0.92)
        players[index].x = clampedX
        players[index].y = clampedY
    }
}

struct LeaguesSwiftPitchPlayerView: View {
    let player: LeaguesSwiftTacticalPlayer

    var body: some View {
        VStack(spacing: 4) {
            ZStack {
                Circle()
                    .fill(LinearGradient(colors: [player.primary, player.secondary], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 36, height: 36)
                Text("\(player.number)")
                    .font(.system(size: 11, weight: .black))
                    .foregroundStyle(.white)
            }

            Text(player.name)
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(.white)
                .lineLimit(1)
                .frame(width: 72)
        }
    }
}

struct LeaguesSwiftPollCard: View {
    let match: LeaguesSwiftMatch

    var body: some View {
        VStack(spacing: 18) {
            HStack(spacing: 10) {
                Text(match.away.name)
                    .pollTeamPillStyle()
                Text(match.home.name)
                    .pollTeamPillStyle()
            }

            HStack {
                Text("\(match.awaySupport)")
                    .font(.system(size: 34, weight: .black))
                    .foregroundStyle(.white)
                Spacer()
                Text("pressure bar")
                    .font(.system(size: 14, weight: .black))
                    .foregroundStyle(.white.opacity(0.72))
                Spacer()
                Text("\(match.homeSupport)")
                    .font(.system(size: 34, weight: .black))
                    .foregroundStyle(.white)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 999, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.99, green: 0.31, blue: 0.34),
                                    Color(red: 1, green: 0.55, blue: 0.26)
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )

                    Circle()
                        .fill(Color.white)
                        .frame(width: 18, height: 18)
                        .shadow(color: .white.opacity(0.45), radius: 10)
                        .offset(x: (geometry.size.width - 18) * match.homeSupportShare)
                }
            }
            .frame(height: 30)

            HStack {
                Image(systemName: "heart.fill")
                    .font(.system(size: 56, weight: .black))
                    .foregroundStyle(Color(red: 1, green: 0.82, blue: 0.31))
                Spacer()
                Text("ادعم بالضغط")
                    .font(.system(size: 22, weight: .black))
                    .foregroundStyle(.white)
                Spacer()
                Image(systemName: "heart.fill")
                    .font(.system(size: 56, weight: .black))
                    .foregroundStyle(Color(red: 0.35, green: 0.72, blue: 1))
            }
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            Color(red: 0.06, green: 0.08, blue: 0.13),
                            Color(red: 0.03, green: 0.04, blue: 0.08)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}

struct FlexibleBenchGrid: View {
    let players: [LeaguesSwiftBenchPlayer]

    var body: some View {
        let columns = [GridItem(.adaptive(minimum: 110), spacing: 8)]

        LazyVGrid(columns: columns, alignment: .trailing, spacing: 8) {
            ForEach(players) { player in
                Text("\(player.number) \(player.name)")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .background(Color.white.opacity(0.06))
                    .clipShape(Capsule())
            }
        }
    }
}

private extension View {
    func pollTeamPillStyle() -> some View {
        self
            .font(.system(size: 13, weight: .black))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(Color(red: 0.06, green: 0.12, blue: 0.22))
            .clipShape(Capsule())
    }
}

struct LeaguesSwiftView_Previews: PreviewProvider {
    static var previews: some View {
        LeaguesSwiftView(onShareVarXBoard: { _ in })
            .environment(\.layoutDirection, .rightToLeft)
    }
}