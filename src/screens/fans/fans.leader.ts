import { FAN_CLUBS } from "../../app.data";
import type { FanClub, FanClubId } from "../../app.types";

const HILAL_ICON = require("../../../assets/icons/alhilal.png.png");
const NASSR_ICON = require("../../../assets/icons/alnassr.png.png");

const CLUB_EMBLEMS: Partial<Record<FanClubId, number>> = {
  hilal: HILAL_ICON,
  nassr: NASSR_ICON,
};

export const CLUB_ASSOCIATION_VAR_IDS: Record<FanClubId, string> = {
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
      emblem: CLUB_EMBLEMS[club.id],
    }))
    .sort((left, right) => right.count - left.count);

  return ranked[0] ?? null;
}
