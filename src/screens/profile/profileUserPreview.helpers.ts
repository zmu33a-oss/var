import type { LockedPredictionSummary } from "../../app.types";

export type PredictionVisualTone = "won" | "pending" | "neutral";

export function resolvePredictionTone(
  prediction: LockedPredictionSummary,
): PredictionVisualTone {
  if (prediction.pointsAwarded > 0) {
    return "won";
  }

  const normalizedStatus = prediction.status.trim().toLowerCase();

  if (
    normalizedStatus.includes("pending") ||
    normalizedStatus.includes("معلق") ||
    normalizedStatus.includes("قيد") ||
    normalizedStatus.includes("انتظار")
  ) {
    return "pending";
  }

  return "neutral";
}

export function resolvePredictionStatusLabel(
  prediction: LockedPredictionSummary,
): string {
  if (prediction.pointsAwarded > 0) {
    return "توقع ناجح";
  }

  return prediction.status.trim() || "مقفل";
}

export function resolvePredictionPointsLabel(
  prediction: LockedPredictionSummary,
): string {
  if (prediction.pointsAwarded > 0) {
    return `+${prediction.pointsAwarded}`;
  }

  return "—";
}

export function resolvePredictionHeadline(
  prediction: LockedPredictionSummary,
): string {
  const choice = prediction.choice.trim();

  if (choice) {
    return choice;
  }

  return prediction.title.trim() || "توقع بدون تفاصيل";
}

export function sumAwardedPredictionPoints(
  predictions: LockedPredictionSummary[],
): number {
  return predictions.reduce(
    (total, prediction) => total + Math.max(0, prediction.pointsAwarded),
    0,
  );
}
