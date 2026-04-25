import { supabase } from "../pages/supabase";

export const FAN_SUPPORT_TEAM_IDS = ["hilal", "nassr", "ittihad"] as const;

export type FanSupportTeamId = (typeof FAN_SUPPORT_TEAM_IDS)[number];

export type FanSupportSnapshot = {
  counts: Record<FanSupportTeamId, number>;
  supportedByMe: Record<FanSupportTeamId, boolean>;
};

export type FanSupportSnapshotResult = {
  snapshot: FanSupportSnapshot;
  tableReady: boolean;
};

type FanSupportRow = {
  team_id: string;
  user_id: string;
};

const FAN_SUPPORT_TEAM_ID_SET = new Set<string>(FAN_SUPPORT_TEAM_IDS);

export function createEmptyFanSupportSnapshot(): FanSupportSnapshot {
  return {
    counts: {
      hilal: 0,
      nassr: 0,
      ittihad: 0,
    },
    supportedByMe: {
      hilal: false,
      nassr: false,
      ittihad: false,
    },
  };
}

export function toCounterDigits(value: number, minimumDigits = 4) {
  const normalizedValue = Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
  return String(normalizedValue).padStart(minimumDigits, "0").split("");
}

export function isFanSupportSchemaCacheMiss(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "code" in error && error.code === "PGRST205";
}

export async function fetchFanSupportSnapshot(
  currentUserId?: string | null,
): Promise<FanSupportSnapshotResult> {
  const { data, error } = await supabase
    .from("fan_team_supports")
    .select("team_id, user_id");

  if (error) {
    console.warn("Failed to load fan support snapshot", error);
    return {
      snapshot: createEmptyFanSupportSnapshot(),
      tableReady: !isFanSupportSchemaCacheMiss(error),
    };
  }

  const snapshot = createEmptyFanSupportSnapshot();

  (data as FanSupportRow[] | null)?.forEach((row) => {
    if (!FAN_SUPPORT_TEAM_ID_SET.has(row.team_id)) {
      return;
    }

    const teamId = row.team_id as FanSupportTeamId;
    snapshot.counts[teamId] += 1;

    if (currentUserId && row.user_id === currentUserId) {
      snapshot.supportedByMe[teamId] = true;
    }
  });

  return {
    snapshot,
    tableReady: true,
  };
}

export async function setFanTeamSupport(
  teamId: FanSupportTeamId,
  userId: string,
  supported: boolean,
) {
  if (supported) {
    const { error } = await supabase.from("fan_team_supports").upsert(
      {
        team_id: teamId,
        user_id: userId,
      },
      { onConflict: "team_id,user_id" },
    );

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from("fan_team_supports")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
