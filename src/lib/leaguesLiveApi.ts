export type LiveLeaguesEvent = {
  minute: string;
  title: string;
  detail: string;
};

export type LiveLeaguesLineupPlayer = {
  id: number | string | null;
  name: string;
  image: string | null;
  number: number | null;
  formationRow: number | null;
  formationColumn: number | null;
  formationPosition: number | null;
  role: "starter" | "bench";
};

export type LiveLeaguesTeamLineup = {
  formation: string | null;
  starters: LiveLeaguesLineupPlayer[];
  bench: LiveLeaguesLineupPlayer[];
};

export type LiveLeaguesLineup = {
  home: LiveLeaguesTeamLineup | null;
  away: LiveLeaguesTeamLineup | null;
};

export type LiveLeaguesTeam = {
  name: string;
  logo: string | null;
  score: number | null;
};

export type LiveLeaguesMatch = {
  fixtureId: number | string | null;
  leagueName: string;
  liveLabel: string;
  home: LiveLeaguesTeam;
  away: LiveLeaguesTeam;
  events: LiveLeaguesEvent[];
  lineup: LiveLeaguesLineup | null;
};

export type LiveLeaguesResponseStatus =
  | "live"
  | "empty"
  | "error"
  | "unconfigured";

export type LiveLeaguesResponse = {
  source: string;
  status: LiveLeaguesResponseStatus;
  fetchedAt: string;
  message?: string;
  match: LiveLeaguesMatch | null;
};

const LEAGUES_LIVE_API_BASE = (
  import.meta.env.VITE_LIVE_MATCH_API_URL?.trim() ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api/sportmonks"
    : "/api/sportmonks")
).replace(/\/+$/, "");

function buildFallbackResponse(message: string): LiveLeaguesResponse {
  return {
    source: "sportmonks",
    status: "error",
    fetchedAt: new Date().toISOString(),
    message,
    match: null,
  };
}

export async function fetchLeaguesLiveMatch(): Promise<LiveLeaguesResponse> {
  try {
    const response = await fetch(`${LEAGUES_LIVE_API_BASE}/inplay`);
    const body = (await response
      .json()
      .catch(() => null)) as LiveLeaguesResponse | null;

    if (body && typeof body === "object" && "status" in body) {
      return body;
    }

    return buildFallbackResponse(
      response.ok
        ? "استجابة غير متوقعة من خدمة المباريات الحية."
        : "تعذر تحميل بيانات المباريات الحية.",
    );
  } catch {
    return buildFallbackResponse("تعذر الاتصال بخدمة المباريات الحية.");
  }
}
