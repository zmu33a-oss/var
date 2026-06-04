import type { TacticalPlayer } from "../../app.types";
import type { LockedPredictionSummary } from "../../app.types";
import { buildMatchPredictionId } from "./lockedPredictions.storage";

export type MatchPredictionLockInput = {
  matchId: string;
  leagueName: string;
  homeTeamTitle: string;
  awayTeamTitle: string;
  homeScore: string;
  awayScore: string;
  homeScorerIds: string[];
  awayScorerIds: string[];
  homePlayers: TacticalPlayer[];
  awayPlayers: TacticalPlayer[];
  selectedVoteTeam: "home" | "away" | null;
};

function resolvePlayerNames(
  playerIds: string[],
  players: TacticalPlayer[],
) {
  return playerIds
    .map((playerId) => players.find((player) => player.id === playerId)?.name)
    .filter(Boolean) as string[];
}

function formatPredictionLockedAt(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function buildLockedPredictionSummary(
  input: MatchPredictionLockInput,
  lockedAt = new Date(),
): LockedPredictionSummary {
  const homeScore = input.homeScore.trim();
  const awayScore = input.awayScore.trim();
  const homeScorers = resolvePlayerNames(
    input.homeScorerIds,
    input.homePlayers,
  );
  const awayScorers = resolvePlayerNames(
    input.awayScorerIds,
    input.awayPlayers,
  );
  const scorerSegments = [
    homeScorers.length
      ? `${input.homeTeamTitle}: ${homeScorers.join("، ")}`
      : "",
    awayScorers.length
      ? `${input.awayTeamTitle}: ${awayScorers.join("، ")}`
      : "",
  ].filter(Boolean);
  const scoreLine = `${homeScore} - ${awayScore}`;
  const choice = scorerSegments.length
    ? `${scoreLine} | ${scorerSegments.join(" • ")}`
    : scoreLine;
  const voteHint =
    input.selectedVoteTeam === "home"
      ? input.homeTeamTitle
      : input.selectedVoteTeam === "away"
        ? input.awayTeamTitle
        : "";

  return {
    id: buildMatchPredictionId(input.matchId),
    title: voteHint
      ? `${input.homeTeamTitle} × ${input.awayTeamTitle} | ${voteHint}`
      : `${input.homeTeamTitle} × ${input.awayTeamTitle}`,
    choice,
    competition: input.leagueName.trim() || "دوري روشن السعودي",
    status: "مقفل",
    lockedAt: formatPredictionLockedAt(lockedAt),
    pointsAwarded: 0,
  };
}

export function mapAppwritePredictionToSummary(
  prediction: {
    id: string;
    title: string;
    choice: string;
    competition: string;
    status: string;
    lockedAt: string;
    pointsAwarded: number;
  },
  matchId?: string,
): LockedPredictionSummary {
  return {
    id: matchId ? buildMatchPredictionId(matchId) : prediction.id,
    title: prediction.title,
    choice: prediction.choice,
    competition: prediction.competition,
    status: prediction.status,
    lockedAt: prediction.lockedAt,
    pointsAwarded: prediction.pointsAwarded,
  };
}
