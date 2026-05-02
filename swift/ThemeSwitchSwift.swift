import SwiftUI

struct ThemeSwitchSwiftView: View {
    @Binding var selection: AppSwiftHomeMode

    @State private var open = false
    @State private var position = CGPoint(x: 165, y: 44)
    @State private var didSetInitialPosition = false

    var body: some View {
        GeometryReader { geometry in
            VStack(alignment: .trailing, spacing: 8) {
                Button {
                    withAnimation(.easeInOut(duration: 0.25)) {
                        open.toggle()
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: open ? "chevron.up" : "chevron.down")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(.white)

                        themeWordmark(for: selection)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 7)
                    .background(Color.black.opacity(0.7))
                    .overlay(
                        Capsule()
                            .stroke(Color.white.opacity(0.92), lineWidth: 1)
                    )
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(selection == .x ? "X Mode" : "TikTok Mode")

                if open {
                    Button {
                        withAnimation(.easeInOut(duration: 0.25)) {
                            selection = selection == .x ? .tiktok : .x
                            open = false
                        }
                    } label: {
                        themeWordmark(for: selection == .x ? .tiktok : .x)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 9)
                            .background(Color.black.opacity(0.5))
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(selection == .x ? "TikTok Mode" : "X Mode")
                    .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
            .position(position)
            .gesture(
                DragGesture()
                    .onChanged { value in
                        let clampedX = min(max(value.location.x, 60), max(60, geometry.size.width - 60))
                        let clampedY = min(max(value.location.y, 30), max(30, geometry.size.height - 120))
                        position = CGPoint(x: clampedX, y: clampedY)
                    }
            )
            .onAppear {
                guard !didSetInitialPosition else { return }
                didSetInitialPosition = true
                position = CGPoint(x: geometry.size.width / 2, y: 38)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .allowsHitTesting(true)
    }

    @ViewBuilder
    private func themeWordmark(for mode: AppSwiftHomeMode) -> some View {
        Text(mode == .x ? "VAR X" : "VAR TIK")
            .font(.system(size: 14, weight: .black, design: .rounded))
            .foregroundStyle(.white)
            .tracking(0.8)
    }
}

struct ThemeSwitchSwiftView_Previews: PreviewProvider {
    static var previews: some View {
        ThemeSwitchSwiftView(selection: .constant(.tiktok))
            .preferredColorScheme(.dark)
            .environment(\.layoutDirection, .rightToLeft)
            .background(Color.black)
    }
}