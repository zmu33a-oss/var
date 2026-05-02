import Foundation

struct WEBPLUSRemoteTrendVideo: Identifiable, Equatable {
    let id: Int
    let videoURLString: String
    let caption: String
    let creatorName: String
    let creatorHandle: String
    let creatorAvatarURLString: String?
    let creatorAvatarFrameEnabled: Bool
    let createdAt: String?
    let likes: Int
    let comments: Int
    let saves: Int
    let shares: Int

    var score: Int {
        likes + comments + saves + shares
    }
}

struct WEBPLUSRemoteFanSupportSnapshot: Equatable {
    let counts: [String: Int]
    let supportedTeams: [String]
}

enum WEBPLUSSupabaseREST {
    static let baseURL = URL(string: "https://lkbuqgsdmxzzzuamjtrv.supabase.co/rest/v1")!
    static let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrYnVxZ3NkbXh6enp1YW1qdHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjEyNTgsImV4cCI6MjA5MTQ5NzI1OH0.QH8yVOHFd0irocFXVK4urzknUi2aqXUTshugCL0HwWk"

    static func fetchFanSupportSnapshot(currentUserID: String?) async throws -> WEBPLUSRemoteFanSupportSnapshot {
        let rows: [FanSupportRow] = try await decodeRows(
            path: "fan_team_supports",
            queryItems: [URLQueryItem(name: "select", value: "team_id,user_id")]
        )

        var counts: [String: Int] = [
            "hilal": 0,
            "nassr": 0,
            "ittihad": 0,
        ]
        var supportedTeams = Set<String>()

        rows.forEach { row in
            counts[row.teamID, default: 0] += 1
            if let currentUserID, row.userID == currentUserID {
                supportedTeams.insert(row.teamID)
            }
        }

        return WEBPLUSRemoteFanSupportSnapshot(
            counts: counts,
            supportedTeams: Array(supportedTeams)
        )
    }

    static func setFanSupport(teamID: String, userID: String, supported: Bool) async throws {
        if supported {
            let payload = [["team_id": teamID, "user_id": userID]]
            _ = try await request(
                path: "fan_team_supports",
                method: "POST",
                queryItems: [URLQueryItem(name: "on_conflict", value: "team_id,user_id")],
                body: try JSONSerialization.data(withJSONObject: payload),
                additionalHeaders: [
                    "Prefer": "resolution=merge-duplicates,return=minimal",
                ]
            )
            return
        }

        _ = try await request(
            path: "fan_team_supports",
            method: "DELETE",
            queryItems: [
                URLQueryItem(name: "team_id", value: "eq.\(teamID)"),
                URLQueryItem(name: "user_id", value: "eq.\(userID)"),
            ]
        )
    }

    static func fetchTopTrendVideos(limit: Int = 3) async throws -> [WEBPLUSRemoteTrendVideo] {
        let videoRows = try await fetchVideoRows()
        let validVideoRows = videoRows.filter { normalizeVideoURL($0.videoURL) != nil }
        let ids = validVideoRows.map(\ .id)

        let comments = (try? await fetchCountRows(table: "video_comments", videoIDs: ids)) ?? []
        let likes = (try? await fetchCountRows(table: "video_likes", videoIDs: ids)) ?? []
        let saves = (try? await fetchCountRows(table: "video_saves", videoIDs: ids)) ?? []
        let shares = (try? await fetchCountRows(table: "video_shares", videoIDs: ids)) ?? []

        let commentCounts = groupCountRows(comments)
        let likeCounts = groupCountRows(likes)
        let saveCounts = groupCountRows(saves)
        let shareCounts = groupCountRows(shares)

        return validVideoRows
            .map { row in
                WEBPLUSRemoteTrendVideo(
                    id: row.id,
                    videoURLString: normalizeVideoURL(row.videoURL) ?? row.videoURL,
                    caption: row.caption?.trimmingCharacters(in: .whitespacesAndNewlines) ?? "",
                    creatorName: row.creatorName?.trimmingCharacters(in: .whitespacesAndNewlines).nonEmpty ?? "صانع الترند",
                    creatorHandle: normalizedHandle(row.creatorHandle),
                    creatorAvatarURLString: row.creatorAvatarURL,
                    creatorAvatarFrameEnabled: row.creatorAvatarFrameEnabled ?? false,
                    createdAt: row.createdAt,
                    likes: likeCounts[row.id] ?? 0,
                    comments: commentCounts[row.id] ?? 0,
                    saves: saveCounts[row.id] ?? 0,
                    shares: shareCounts[row.id] ?? 0
                )
            }
            .sorted { left, right in
                if left.score == right.score {
                    return left.id > right.id
                }

                return left.score > right.score
            }
            .prefix(limit)
            .map { $0 }
    }

    private static func fetchVideoRows() async throws -> [VideoRow] {
        do {
            return try await decodeRows(
                path: "videos",
                queryItems: [
                    URLQueryItem(name: "select", value: "id,video_url,caption,creator_name,creator_handle,creator_avatar_url,creator_avatar_frame_enabled,created_at"),
                    URLQueryItem(name: "order", value: "created_at.desc"),
                ]
            )
        } catch {
            return try await decodeRows(
                path: "videos",
                queryItems: [
                    URLQueryItem(name: "select", value: "id,video_url,caption"),
                    URLQueryItem(name: "order", value: "id.desc"),
                ]
            )
        }
    }

    private static func fetchCountRows(table: String, videoIDs: [Int]) async throws -> [VideoCountRow] {
        guard !videoIDs.isEmpty else {
            return []
        }

        let idValue = videoIDs.map(String.init).joined(separator: ",")
        return try await decodeRows(
            path: table,
            queryItems: [
                URLQueryItem(name: "select", value: "video_id"),
                URLQueryItem(name: "video_id", value: "in.(\(idValue))"),
            ]
        )
    }

    private static func groupCountRows(_ rows: [VideoCountRow]) -> [Int: Int] {
        rows.reduce(into: [Int: Int]()) { result, row in
            result[row.videoID, default: 0] += 1
        }
    }

    private static func decodeRows<T: Decodable>(path: String, queryItems: [URLQueryItem]) async throws -> [T] {
        let data = try await request(path: path, queryItems: queryItems)
        return try JSONDecoder.webplus.decode([T].self, from: data)
    }

    private static func request(
        path: String,
        method: String = "GET",
        queryItems: [URLQueryItem] = [],
        body: Data? = nil,
        additionalHeaders: [String: String] = [:]
    ) async throws -> Data {
        guard var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false) else {
            throw WEBPLUSSupabaseRESTError.invalidURL
        }

        if !queryItems.isEmpty {
            components.queryItems = queryItems
        }

        guard let url = components.url else {
            throw WEBPLUSSupabaseRESTError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body
        request.timeoutInterval = 20
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if body != nil {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        additionalHeaders.forEach { key, value in
            request.setValue(value, forHTTPHeaderField: key)
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw WEBPLUSSupabaseRESTError.invalidResponse
        }

        guard (200 ... 299).contains(httpResponse.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Unknown Supabase error"
            throw WEBPLUSSupabaseRESTError.httpError(statusCode: httpResponse.statusCode, message: message)
        }

        return data
    }

    private static func normalizeVideoURL(_ rawValue: String?) -> String? {
        let cleaned = (rawValue ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "^[^a-zA-Z]+", with: "", options: .regularExpression)

        guard !cleaned.isEmpty else {
            return nil
        }

        let withScheme: String
        if cleaned.lowercased().hasPrefix("http://") || cleaned.lowercased().hasPrefix("https://") {
            withScheme = cleaned
        } else if cleaned.hasPrefix("//") {
            withScheme = "https:\(cleaned)"
        } else {
            withScheme = "https://\(cleaned)"
        }

        guard let url = URL(string: withScheme),
              let host = url.host,
              host.contains(".") else {
            return nil
        }

        return url.absoluteString
    }

    private static func normalizedHandle(_ rawValue: String?) -> String {
        let trimmed = rawValue?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !trimmed.isEmpty else {
            return "@xtik"
        }

        return trimmed.hasPrefix("@") ? trimmed : "@\(trimmed)"
    }
}

enum WEBPLUSSupabaseRESTError: Error {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int, message: String)
}

private struct FanSupportRow: Decodable {
    let teamID: String
    let userID: String?

    enum CodingKeys: String, CodingKey {
        case teamID = "team_id"
        case userID = "user_id"
    }
}

private struct VideoCountRow: Decodable {
    let videoID: Int

    enum CodingKeys: String, CodingKey {
        case videoID = "video_id"
    }
}

private struct VideoRow: Decodable {
    let id: Int
    let videoURL: String
    let caption: String?
    let creatorName: String?
    let creatorHandle: String?
    let creatorAvatarURL: String?
    let creatorAvatarFrameEnabled: Bool?
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case videoURL = "video_url"
        case caption
        case creatorName = "creator_name"
        case creatorHandle = "creator_handle"
        case creatorAvatarURL = "creator_avatar_url"
        case creatorAvatarFrameEnabled = "creator_avatar_frame_enabled"
        case createdAt = "created_at"
    }
}

private extension JSONDecoder {
    static let webplus: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .useDefaultKeys
        return decoder
    }()
}

private extension String {
    var nonEmpty: String? {
        isEmpty ? nil : self
    }
}