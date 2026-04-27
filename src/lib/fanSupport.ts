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

type FanSupportFallbackStore = {
  counts: Record<FanSupportTeamId, number>;
  supportedByUser: Record<string, FanSupportTeamId[]>;
};

const FAN_SUPPORT_TEAM_ID_SET = new Set<string>(FAN_SUPPORT_TEAM_IDS);
const FAN_SUPPORT_FALLBACK_KEY = "webplus:fan-support-fallback";

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

function createEmptyFallbackStore(): FanSupportFallbackStore {
  return {
    counts: {
      hilal: 0,
      nassr: 0,
      ittihad: 0,
    },
    supportedByUser: {},
  };
}

function readFallbackStore(): FanSupportFallbackStore {
  if (typeof window === "undefined") {
    return createEmptyFallbackStore();
  }

  try {
    const rawValue = window.localStorage.getItem(FAN_SUPPORT_FALLBACK_KEY);

    if (!rawValue) {
      return createEmptyFallbackStore();
    }

    const parsed = JSON.parse(rawValue) as Partial<FanSupportFallbackStore>;
    const store = createEmptyFallbackStore();

    FAN_SUPPORT_TEAM_IDS.forEach((teamId) => {
      const value = parsed.counts?.[teamId];
      store.counts[teamId] = Number.isFinite(value)
        ? Math.max(0, Math.floor(value as number))
        : 0;
    });

    Object.entries(parsed.supportedByUser ?? {}).forEach(
      ([userId, teamIds]) => {
        if (!Array.isArray(teamIds)) {
          return;
        }

        const normalizedTeamIds = teamIds.filter(
          (teamId): teamId is FanSupportTeamId =>
            FAN_SUPPORT_TEAM_ID_SET.has(teamId),
        );

        if (normalizedTeamIds.length > 0) {
          store.supportedByUser[userId] = normalizedTeamIds;
        }
      },
    );

    return store;
  } catch {
    return createEmptyFallbackStore();
  }
}

function writeFallbackStore(store: FanSupportFallbackStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FAN_SUPPORT_FALLBACK_KEY, JSON.stringify(store));
}

function createSnapshotFromFallbackStore(
  store: FanSupportFallbackStore,
  currentUserId?: string | null,
): FanSupportSnapshot {
  const snapshot = createEmptyFanSupportSnapshot();

  FAN_SUPPORT_TEAM_IDS.forEach((teamId) => {
    snapshot.counts[teamId] = store.counts[teamId] ?? 0;
  });

  if (currentUserId) {
    const supportedTeams = new Set(store.supportedByUser[currentUserId] ?? []);

    FAN_SUPPORT_TEAM_IDS.forEach((teamId) => {
      snapshot.supportedByMe[teamId] = supportedTeams.has(teamId);
    });
  }

  return snapshot;
}

export function readCachedFanSupportSnapshot(
  currentUserId?: string | null,
): FanSupportSnapshot {
  return createSnapshotFromFallbackStore(readFallbackStore(), currentUserId);
}

function syncFallbackStoreFromSnapshot(
  snapshot: FanSupportSnapshot,
  currentUserId?: string | null,
) {
  const store = readFallbackStore();

  FAN_SUPPORT_TEAM_IDS.forEach((teamId) => {
    store.counts[teamId] = snapshot.counts[teamId];
  });

  if (currentUserId) {
    const supportedTeams = FAN_SUPPORT_TEAM_IDS.filter(
      (teamId) => snapshot.supportedByMe[teamId],
    );

    if (supportedTeams.length > 0) {
      store.supportedByUser[currentUserId] = supportedTeams;
    } else {
      delete store.supportedByUser[currentUserId];
    }
  }

  writeFallbackStore(store);
}

function applyFallbackSupportChange(
  teamId: FanSupportTeamId,
  userId: string,
  supported: boolean,
) {
  const store = readFallbackStore();
  const supportedTeams = new Set(store.supportedByUser[userId] ?? []);
  const alreadySupported = supportedTeams.has(teamId);

  if (supported && !alreadySupported) {
    supportedTeams.add(teamId);
    store.counts[teamId] += 1;
  }

  if (!supported && alreadySupported) {
    supportedTeams.delete(teamId);
    store.counts[teamId] = Math.max(0, store.counts[teamId] - 1);
  }

  if (supportedTeams.size > 0) {
    store.supportedByUser[userId] = [...supportedTeams];
  } else {
    delete store.supportedByUser[userId];
  }

  writeFallbackStore(store);
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
      snapshot: createSnapshotFromFallbackStore(
        readFallbackStore(),
        currentUserId,
      ),
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

  syncFallbackStoreFromSnapshot(snapshot, currentUserId);

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
  try {
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
  } catch (error) {
    if (isFanSupportSchemaCacheMiss(error)) {
      throw error;
    }

    applyFallbackSupportChange(teamId, userId, supported);
  }
}
