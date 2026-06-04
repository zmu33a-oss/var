import { Platform } from "react-native";
import type { LockedPredictionSummary } from "../../app.types";
import {
  readWebStorageValue,
  writeWebStorageValue,
} from "../../appshell/appshell.helpers";

const STORAGE_PREFIX = "webplus.locked-predictions";

function getStorage() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
}

function getStorageKey(varId: string) {
  return `${STORAGE_PREFIX}.${varId.trim().toLowerCase()}`;
}

function isLockedPredictionSummary(
  value: unknown,
): value is LockedPredictionSummary {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LockedPredictionSummary>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.choice === "string" &&
    typeof candidate.competition === "string" &&
    typeof candidate.status === "string" &&
    typeof candidate.lockedAt === "string" &&
    typeof candidate.pointsAwarded === "number"
  );
}

export function extractMatchPredictionId(predictionId: string) {
  return predictionId.startsWith("match:")
    ? predictionId.slice("match:".length)
    : null;
}

export function buildMatchPredictionId(matchId: string) {
  return `match:${matchId.trim()}`;
}

export function readStoredLockedPredictions(
  varId: string,
): LockedPredictionSummary[] {
  const normalizedVarId = varId.trim().toLowerCase();

  if (!normalizedVarId) {
    return [];
  }

  const raw = readWebStorageValue(getStorage(), getStorageKey(normalizedVarId));

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isLockedPredictionSummary);
  } catch {
    return [];
  }
}

export function writeStoredLockedPredictions(
  varId: string,
  predictions: LockedPredictionSummary[],
) {
  const normalizedVarId = varId.trim().toLowerCase();

  if (!normalizedVarId) {
    return;
  }

  writeWebStorageValue(
    getStorage(),
    getStorageKey(normalizedVarId),
    JSON.stringify(predictions),
  );
}

export function upsertStoredLockedPrediction(
  varId: string,
  prediction: LockedPredictionSummary,
) {
  const existing = readStoredLockedPredictions(varId);
  const matchId = extractMatchPredictionId(prediction.id);
  const nextPredictions = [
    prediction,
    ...existing.filter((entry) => {
      if (entry.id === prediction.id) {
        return false;
      }

      if (!matchId) {
        return true;
      }

      return extractMatchPredictionId(entry.id) !== matchId;
    }),
  ];

  writeStoredLockedPredictions(varId, nextPredictions);
  return nextPredictions;
}

export function mergeLockedPredictions(
  remotePredictions: LockedPredictionSummary[],
  localPredictions: LockedPredictionSummary[],
) {
  const remoteMatchIds = new Set(
    remotePredictions
      .map((prediction) => extractMatchPredictionId(prediction.id))
      .filter(Boolean),
  );

  const localOnly = localPredictions.filter((prediction) => {
    const matchId = extractMatchPredictionId(prediction.id);

    if (!matchId) {
      return !remotePredictions.some((remote) => remote.id === prediction.id);
    }

    return !remoteMatchIds.has(matchId);
  });

  return [...remotePredictions, ...localOnly].sort(
    (left, right) => Date.parse(right.lockedAt) - Date.parse(left.lockedAt),
  );
}

export function upsertProfileLockedPrediction(
  predictions: LockedPredictionSummary[],
  prediction: LockedPredictionSummary,
) {
  const matchId = extractMatchPredictionId(prediction.id);

  return [
    prediction,
    ...predictions.filter((entry) => {
      if (entry.id === prediction.id) {
        return false;
      }

      if (!matchId) {
        return true;
      }

      return extractMatchPredictionId(entry.id) !== matchId;
    }),
  ];
}
