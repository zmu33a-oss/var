import SwiftUI

struct BottomNavSwiftView: View {
    let current: AppSwiftTab
    let homeMode: AppSwiftHomeMode
    let onHomeAction: () -> Void
    let onSelect: (AppSwiftTab) -> Void

    var body: some View {
        HStack(spacing: 0) {
            BottomNavSwiftItem(
                title: "الحساب",
                symbolName: "person.fill",
                isActive: current == .account
            ) {
                onSelect(.account)
            }

            BottomNavSwiftItem(
                title: "الدوريات",
                symbolName: "trophy.fill",
                isActive: current == .leagues
            ) {
                onSelect(.leagues)
            }

            Button(action: onHomeAction) {
                ZStack {
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: homeMode == .tiktok
                                    ? [Color(red: 0.97, green: 0.27, blue: 0.48), Color(red: 1, green: 0.6, blue: 0.35)]
                                    : [Color(red: 0.3, green: 0.75, blue: 0.98), Color(red: 0.62, green: 0.9, blue: 1)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: 92, height: 36)

                    Text("VAR")
                        .font(.system(size: 15, weight: .black, design: .rounded))
                        .foregroundStyle(.black)
                }
            }
            .buttonStyle(.plain)
            .accessibilityLabel(homeMode == .x ? "رسالة جديدة" : "إضافة فيديو")

            BottomNavSwiftItem(
                title: "الرابطة",
                symbolName: "person.3.fill",
                isActive: current == .fans
            ) {
                onSelect(.fans)
            }

            BottomNavSwiftItem(
                title: "الرئيسية",
                symbolName: "house.fill",
                isActive: current == .home
            ) {
                onSelect(.home)
            }
        }
        .padding(.horizontal, 8)
        .padding(.top, 8)
        .padding(.bottom, 10)
        .background(Color.black)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(Color.white.opacity(0.06))
                .frame(height: 1)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct BottomNavSwiftItem: View {
    let title: String
    let symbolName: String
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: symbolName)
                    .font(.system(size: 18, weight: .semibold))

                Text(title)
                    .font(.system(size: 10, weight: .medium))
            }
            .foregroundStyle(isActive ? Color.white : Color.white.opacity(0.68))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
    }
}

struct BottomNavSwiftView_Previews: PreviewProvider {
    static var previews: some View {
        BottomNavSwiftView(current: .home, homeMode: .tiktok, onHomeAction: {}, onSelect: { _ in })
            .preferredColorScheme(.dark)
            .environment(\.layoutDirection, .rightToLeft)
            .background(Color.black)
    }
}