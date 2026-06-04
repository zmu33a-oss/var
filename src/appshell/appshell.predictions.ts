import type { Dispatch, SetStateAction } from "react";
import type { ProfileData } from "../app.types";
import { saveAppwriteLockedPrediction } from "../lib/appwrite/appwrite.predictions";
import {
  upsertProfileLockedPrediction,
  upsertStoredLockedPrediction,
} from "../lib/predictions/lockedPredictions.storage";
import {
  buildLockedPredictionSummary,
  mapAppwritePredictionToSummary,
  type MatchPredictionLockInput,
} from "../lib/predictions/matchPrediction.utils";

type LockMatchPredictionOptions = {
  varId: string;
  input: MatchPredictionLockInput;
  setProfile: Dispatch<SetStateAction<ProfileData>>;
  setNotice?: (message: string) => void;
};

export async function lockMatchPrediction(
  options: LockMatchPredictionOptions,
) {
  const normalizedVarId = options.varId.trim();

  if (!normalizedVarId) {
    options.setNotice?.("سجّل الدخول أولاً لحفظ التوقع في بروفايلك.");
    return null;
  }

  const summary = buildLockedPredictionSummary(options.input);

  upsertStoredLockedPrediction(normalizedVarId, summary);
  options.setProfile((currentProfile) => ({
    ...currentProfile,
    lockedPredictions: upsertProfileLockedPrediction(
      currentProfile.lockedPredictions,
      summary,
    ),
  }));

  try {
    const savedPrediction = await saveAppwriteLockedPrediction({
      varId: normalizedVarId,
      matchId: options.input.matchId,
      title: summary.title,
      choice: summary.choice,
      competition: summary.competition,
      lockedAt: summary.lockedAt,
    });

    if (!savedPrediction) {
      options.setNotice?.("تم حفظ التوقع في بروفايلك محلياً.");
      return summary;
    }

    const syncedSummary = mapAppwritePredictionToSummary(
      savedPrediction,
      options.input.matchId,
    );

    upsertStoredLockedPrediction(normalizedVarId, syncedSummary);
    options.setProfile((currentProfile) => ({
      ...currentProfile,
      lockedPredictions: upsertProfileLockedPrediction(
        currentProfile.lockedPredictions,
        syncedSummary,
      ),
    }));
    options.setNotice?.("تم حفظ التوقع وربطه ببروفايلك.");
    return syncedSummary;
  } catch (error) {
    options.setNotice?.(
      error instanceof Error
        ? `تم حفظ التوقع محلياً. Appwrite: ${error.message}`
        : "تم حفظ التوقع محلياً في بروفايلك.",
    );
    return summary;
  }
}
