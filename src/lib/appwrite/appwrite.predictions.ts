import { APPWRITE_CONFIG } from "./appwrite.config";
import { normalizeAppwriteVarId } from "./appwrite.helpers";
import type { AppwriteLockedPrediction, AppwritePredictionDocument } from "./appwrite.types";
import {
  AppwriteID,
  getDatabasesBridge,
  hasConfiguredCollection,
} from "./appwrite.client";
import { isPermissionDeniedAppwriteError } from "./appwrite.helpers";

export type AppwritePredictionLockInput = {
  varId: string;
  matchId: string;
  title: string;
  choice: string;
  competition: string;
  lockedAt: string;
};

export async function saveAppwriteLockedPrediction(
  input: AppwritePredictionLockInput,
): Promise<AppwriteLockedPrediction | null> {
  if (!hasConfiguredCollection(APPWRITE_CONFIG.predictionsCollectionId)) {
    return null;
  }

  const normalizedVarId = normalizeAppwriteVarId(input.varId);

  if (!normalizedVarId) {
    return null;
  }

  const databases = getDatabasesBridge();

  try {
    const document = (await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.predictionsCollectionId,
      AppwriteID.unique(),
      {
        varId: normalizedVarId,
        matchId: input.matchId.trim(),
        title: input.title.trim(),
        choice: input.choice.trim(),
        competition: input.competition.trim(),
        status: "locked",
        lockedAt: input.lockedAt,
        isLocked: true,
        locked: true,
        pointsAwarded: 0,
        points: 0,
      },
    )) as unknown as AppwritePredictionDocument;

    return {
      id: document.$id,
      varId: normalizedVarId,
      title: input.title.trim(),
      choice: input.choice.trim(),
      competition: input.competition.trim(),
      status: "locked",
      lockedAt: input.lockedAt,
      pointsAwarded: 0,
    };
  } catch (error) {
    if (isPermissionDeniedAppwriteError(error)) {
      return null;
    }

    throw error;
  }
}
