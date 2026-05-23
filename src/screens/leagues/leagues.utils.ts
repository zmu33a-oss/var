import type {
  BenchPlayer,
  MatchEvent,
  Post,
  TacticalPlayer,
} from "../../app.types";
import type {
  FieldLayerFrame,
  LeaguePollTweet,
  ShowcaseBenchPlayer,
  ShowcaseLineupPlayer,
} from "./leagues.types";
import {
  HILAL_ICON,
  KSA_ICON,
  LEAGUE_POLL_AVATAR_GRADIENTS,
  LEAGUE_STANDINGS,
  LEAGUE_TOP_SCORERS,
  NASSR_ICON,
} from "./leagues.constants";

export function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function sanitizePredictionValue(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 2);
}

export function parsePredictionGoalCount(value: string) {
  const parsedValue = Number.parseInt(value || "0", 10);

  if (Number.isNaN(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return parsedValue;
}

export function resizePredictionSelections(
  playerIds: string[],
  expectedCount: number,
) {
  if (expectedCount <= 0) {
    return [];
  }

  const nextSelections = playerIds.slice(0, expectedCount);

  while (nextSelections.length < expectedCount) {
    nextSelections.push("");
  }

  return nextSelections;
}

export function createLeaguePollAvatarLabel(author: string) {
  const compactAuthor = author.replace(/\s+/g, "").trim();

  return compactAuthor.slice(0, 2) || "VX";
}

export function estimateLeaguePollViews(post: Post) {
  return Math.max(
    220,
    post.likes * 6 + post.replies * 14 + post.reposts * 18 + post.shares * 22,
  );
}

export function mapPostToLeaguePollTweet(
  post: Post,
  index: number,
): LeaguePollTweet {
  return {
    id: String(post.id),
    author: post.author,
    handle: post.handle,
    body: post.content,
    timeLabel: post.time,
    replies: post.replies,
    reposts: post.reposts,
    likes: post.likes,
    views: estimateLeaguePollViews(post),
    avatarLabel: createLeaguePollAvatarLabel(post.author),
    gradient:
      LEAGUE_POLL_AVATAR_GRADIENTS[index % LEAGUE_POLL_AVATAR_GRADIENTS.length],
  };
}

export function applyTeamNameReplacements(
  value: string,
  replacements: Array<[string, string]>,
) {
  return replacements.reduce(
    (currentValue, [from, to]) => currentValue.split(from).join(to),
    value,
  );
}

export function remapMatchEvents(
  events: MatchEvent[],
  replacements: Array<[string, string]>,
) {
  return events.map((event) => ({
    ...event,
    title: applyTeamNameReplacements(event.title, replacements),
    detail: applyTeamNameReplacements(event.detail, replacements),
  }));
}

export function remapLeaguePollTweets(
  tweets: LeaguePollTweet[],
  replacements: Array<[string, string]>,
) {
  return tweets.map((tweet) => ({
    ...tweet,
    body: applyTeamNameReplacements(tweet.body, replacements),
  }));
}

export function remapTacticalPlayers(
  players: TacticalPlayer[],
  replacements: Array<[string, string]>,
) {
  return players.map((player) => ({
    ...player,
    name: applyTeamNameReplacements(player.name, replacements),
  }));
}

export function remapBenchPlayers(
  players: BenchPlayer[],
  replacements: Array<[string, string]>,
) {
  return players.map((player) => ({
    ...player,
    name: applyTeamNameReplacements(player.name, replacements),
  }));
}

export function getAveragePressureValue(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const total = values.reduce(
    (runningTotal, currentValue) => runningTotal + currentValue,
    0,
  );

  return Math.round(total / values.length);
}

export function findLeagueStandingRow(teamTitle: string) {
  return LEAGUE_STANDINGS.find((row) => row.team === teamTitle) ?? null;
}

export function getRelatedTopScorers(teamTitles: string[]) {
  return LEAGUE_TOP_SCORERS.filter((player) =>
    teamTitles.includes(player.club),
  );
}

export function clampLineupCoordinate(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function resolveFieldDropPosition(
  moveX: number,
  moveY: number,
  frame: FieldLayerFrame,
) {
  const isInsideX = moveX >= frame.pageX && moveX <= frame.pageX + frame.width;
  const isInsideY = moveY >= frame.pageY && moveY <= frame.pageY + frame.height;

  if (!isInsideX || !isInsideY) {
    return null;
  }

  return {
    x: clampLineupCoordinate(
      (moveX - frame.pageX) / Math.max(frame.width, 1),
      0.08,
      0.92,
    ),
    displayY: clampLineupCoordinate(
      (moveY - frame.pageY) / Math.max(frame.height, 1),
      0.06,
      0.94,
    ),
  };
}

export function buildBenchShowcasePlayers(
  players: BenchPlayer[],
  gradient: ShowcaseBenchPlayer["gradient"],
): ShowcaseBenchPlayer[] {
  return players.map((player) => ({
    ...player,
    gradient,
  }));
}

export function formatLineupKickoffDate(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const meridiem = hours24 >= 12 ? "م" : "ص";
  const hours12 = hours24 % 12 || 12;

  return `${year}/${month}/${day} ، ${hours12}:${minutes} ${meridiem}`;
}

export function normalizeShowcaseLineupPlayers(
  players: TacticalPlayer[],
): ShowcaseLineupPlayer[] {
  const hasTopGoalkeeper =
    players.filter((player) => player.y <= 0.2).length === 1;

  return players.map((player) => ({
    ...player,
    displayY: hasTopGoalkeeper ? 1 - player.y : player.y,
  }));
}

export function buildFormationLabel(players: TacticalPlayer[]) {
  const normalizedPlayers = normalizeShowcaseLineupPlayers(players)
    .slice()
    .sort((left, right) => left.displayY - right.displayY);

  if (normalizedPlayers.length <= 1) {
    return "-";
  }

  const outfieldPlayers = normalizedPlayers.slice(0, -1);

  if (!outfieldPlayers.length) {
    return "-";
  }

  const lines: number[] = [];
  let currentAnchor = outfieldPlayers[0].displayY;
  let currentCount = 0;

  outfieldPlayers.forEach((player) => {
    if (Math.abs(player.displayY - currentAnchor) > 0.11 && currentCount > 0) {
      lines.push(currentCount);
      currentAnchor = player.displayY;
      currentCount = 1;
      return;
    }

    currentCount += 1;
  });

  if (currentCount > 0) {
    lines.push(currentCount);
  }

  return lines.join("-");
}

export function buildFormationLabelFromDisplayPlayers(
  players: ShowcaseLineupPlayer[],
) {
  const orderedPlayers = players
    .slice()
    .sort((left, right) => left.displayY - right.displayY);

  if (orderedPlayers.length <= 1) {
    return "-";
  }

  const outfieldPlayers = orderedPlayers.slice(0, -1);

  if (!outfieldPlayers.length) {
    return "-";
  }

  const lines: number[] = [];
  let currentAnchor = outfieldPlayers[0].displayY;
  let currentCount = 0;

  outfieldPlayers.forEach((player) => {
    if (Math.abs(player.displayY - currentAnchor) > 0.11 && currentCount > 0) {
      lines.push(currentCount);
      currentAnchor = player.displayY;
      currentCount = 1;
      return;
    }

    currentCount += 1;
  });

  if (currentCount > 0) {
    lines.push(currentCount);
  }

  return lines.join("-");
}

export function getLeagueOverviewIconSource(leagueId: string) {
  switch (leagueId) {
    case "spl":
      return HILAL_ICON;
    case "king-cup":
      return NASSR_ICON;
    default:
      return KSA_ICON;
  }
}
