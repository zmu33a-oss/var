export type AiModerationSettings = {
  enabled: boolean;
  threshold: number;
  autoHideThreshold: number;
  webhookConfigured: boolean;
  keywordCount: number;
  keywords: string[];
};

export type AiModerationResult = {
  score: number;
  flags: string[];
  shouldFlag: boolean;
  shouldAutoHide: boolean;
};

const DEFAULT_KEYWORDS = [
  "spam",
  "scam",
  "احتيال",
  "مجاني",
  "اربح",
  "ربح سريع",
  "click here",
  "free money",
  "bit.ly",
  "t.me/",
  "واتس",
  "رقمي",
  "تواصل خاص",
];

function readKeywordList() {
  const raw = process.env.AI_MODERATION_KEYWORDS?.trim();
  if (!raw) {
    return DEFAULT_KEYWORDS;
  }

  return raw
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function readAiModerationSettings(): AiModerationSettings {
  const threshold = Number.parseInt(
    process.env.AI_MODERATION_THRESHOLD?.trim() || "70",
    10,
  );
  const autoHideThreshold = Number.parseInt(
    process.env.AI_MODERATION_AUTO_HIDE_THRESHOLD?.trim() || "92",
    10,
  );
  const keywords = readKeywordList();

  return {
    enabled: process.env.AI_MODERATION_ENABLED?.trim() !== "false",
    threshold: Number.isFinite(threshold)
      ? Math.min(Math.max(threshold, 1), 100)
      : 70,
    autoHideThreshold: Number.isFinite(autoHideThreshold)
      ? Math.min(Math.max(autoHideThreshold, 1), 100)
      : 92,
    webhookConfigured: Boolean(
      process.env.AI_MODERATION_WEBHOOK_SECRET?.trim(),
    ),
    keywordCount: keywords.length,
    keywords: keywords.slice(0, 12),
  };
}

function countUrls(text: string) {
  const matches = text.match(/https?:\/\/|www\.|t\.me\/|bit\.ly/gi);
  return matches ? matches.length : 0;
}

function capsRatio(text: string) {
  const letters = text.replace(/[^a-zA-Z\u0600-\u06FF]/g, "");
  if (!letters.length) return 0;
  const caps = letters.replace(/[^A-Z\u0623-\u064A]/g, "").length;
  return caps / letters.length;
}

export function analyzeTextForModeration(
  text: string,
  settings = readAiModerationSettings(),
): AiModerationResult {
  const normalized = text.trim().toLowerCase();
  const flags: string[] = [];
  let score = 0;

  if (!normalized) {
    return {
      score: 0,
      flags: [],
      shouldFlag: false,
      shouldAutoHide: false,
    };
  }

  for (const keyword of readKeywordList()) {
    const needle = keyword.trim().toLowerCase();
    if (!needle) continue;
    if (normalized.includes(needle)) {
      flags.push(`keyword:${needle}`);
      score += 28;
    }
  }

  const urlCount = countUrls(normalized);
  if (urlCount >= 2) {
    flags.push("multi_link");
    score += 22;
  } else if (urlCount === 1) {
    flags.push("external_link");
    score += 12;
  }

  if (capsRatio(text) >= 0.65 && text.length >= 12) {
    flags.push("shouting");
    score += 14;
  }

  if (/(.)\1{5,}/.test(normalized)) {
    flags.push("repeated_chars");
    score += 10;
  }

  if (normalized.length >= 900) {
    flags.push("very_long");
    score += 8;
  }

  score = Math.min(100, score);

  return {
    score,
    flags: Array.from(new Set(flags)),
    shouldFlag: score >= settings.threshold,
    shouldAutoHide: score >= settings.autoHideThreshold,
  };
}

export function readAiWebhookSecret() {
  return process.env.AI_MODERATION_WEBHOOK_SECRET?.trim() || "";
}

export function verifyAiWebhookSecret(request: {
  headers?: Record<string, string | string[] | undefined>;
}) {
  const expected = readAiWebhookSecret();
  if (!expected) {
    return false;
  }

  const raw =
    request.headers?.["x-ai-webhook-secret"] ||
    request.headers?.["x-moderation-secret"] ||
    request.headers?.authorization;

  const provided = typeof raw === "string" ? raw.trim() : "";
  if (!provided) {
    return false;
  }

  if (provided === expected) {
    return true;
  }

  return provided === `Bearer ${expected}`;
}
