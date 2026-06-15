import { FAN_CLUBS } from "../../app.data";
import type { FanClub, FanClubId } from "../../app.types";
import { getSaudiClubEmblem } from "./clubEmblems";

export const CLUB_ASSOCIATION_VAR_IDS: Partial<Record<FanClubId, string>> = {
  hilal: "VAR-44441",
  nassr: "VAR-33820",
  ittihad: "VAR-29106",
  ahli: "VAR-22817",
  shabab: "VAR-19054",
};

export type FanClubLeader = {
  club: FanClub;
  count: number;
  digits: string[];
  emblem?: number;
};

export function digitsForSupporterCount(count: number) {
  return Math.max(0, Math.floor(count))
    .toLocaleString("en-US", { useGrouping: false })
    .padStart(4, "0")
    .slice(-4)
    .split("");
}

export function resolveLeadingFanClub(
  supporters: Record<FanClubId, number>,
): FanClubLeader | null {
  const ranked = [...FAN_CLUBS]
    .map((club) => ({
      club,
      count: supporters[club.id] ?? 0,
      digits: digitsForSupporterCount(supporters[club.id] ?? 0),
      emblem: getSaudiClubEmblem(club.id),
    }))
    .sort((left, right) => right.count - left.count);

  return ranked[0] ?? null;
}
