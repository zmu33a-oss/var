const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://lkbuqgsdmxzzzuamjtrv.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrYnVxZ3NkbXh6enp1YW1qdHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjEyNTgsImV4cCI6MjA5MTQ5NzI1OH0.QH8yVOHFd0irocFXVK4urzknUi2aqXUTshugCL0HwWk";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PORT = Number(process.env.ADMIN_API_PORT || process.env.PORT || 5000);
const SPORTMONKS_BASE_URL = (
  process.env.SPORTMONKS_BASE_URL || "https://api.sportmonks.com/v3/football"
).replace(/\/+$/, "");
const SPORTMONKS_API_TOKEN = (process.env.SPORTMONKS_API_TOKEN || "").trim();
const SPORTMONKS_INPLAY_URL = (process.env.SPORTMONKS_INPLAY_URL || "").trim();
const ADMIN_EMAIL_ALLOWLIST = new Set(
  (process.env.ADMIN_EMAIL_ALLOWLIST || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);
const ENABLE_DEV_ADMIN_FALLBACK = process.env.NODE_ENV !== "production";
const ADMIN_STORE_PATH = path.join(__dirname, "..", "data", "admin-store.json");

const authClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const serviceClient = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

app.use(
  cors({
    origin: true,
  }),
);
app.use(express.json());

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toFiniteNumber(...candidates) {
  for (const candidate of candidates) {
    const value = Number(candidate);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function toNonEmptyString(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;

    const value = candidate.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

function resolveSportmonksApiToken() {
  if (SPORTMONKS_API_TOKEN) {
    return SPORTMONKS_API_TOKEN;
  }

  if (!SPORTMONKS_INPLAY_URL) {
    return "";
  }

  try {
    return new URL(SPORTMONKS_INPLAY_URL).searchParams.get("api_token") || "";
  } catch {
    return "";
  }
}

function buildSportmonksInplayUrl() {
  if (SPORTMONKS_INPLAY_URL) {
    return SPORTMONKS_INPLAY_URL;
  }

  const apiToken = resolveSportmonksApiToken();
  if (!apiToken) {
    return "";
  }

  const requestUrl = new URL(`${SPORTMONKS_BASE_URL}/livescores/inplay`);
  requestUrl.searchParams.set("api_token", apiToken);
  return requestUrl.toString();
}

function buildSportmonksFixtureDetailsUrl(fixtureId) {
  const apiToken = resolveSportmonksApiToken();
  if (!apiToken || !fixtureId) {
    return "";
  }

  const requestUrl = new URL(`${SPORTMONKS_BASE_URL}/fixtures/${fixtureId}`);
  requestUrl.searchParams.set("api_token", apiToken);
  requestUrl.searchParams.set(
    "include",
    "participants;league;state;scores;events.type;events.player;events.relatedplayer;lineups.player",
  );
  return requestUrl.toString();
}

async function fetchSportmonksJson(requestUrl) {
  const response = await fetch(requestUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      body?.message ||
        `SportMonks request failed with status ${response.status}`,
    );
    error.statusCode = response.status;
    throw error;
  }

  return body;
}

function normalizeSportmonksParticipant(participant, fallbackLocation = "") {
  const source =
    participant && typeof participant.participant === "object"
      ? participant.participant
      : participant;

  return {
    id: source?.id ?? participant?.participant_id ?? participant?.id ?? null,
    name: toNonEmptyString(
      source?.name,
      participant?.name,
      source?.short_name,
      participant?.short_name,
    ),
    logo: toNonEmptyString(
      source?.image_path,
      participant?.image_path,
      source?.logo,
      participant?.logo,
    ),
    location:
      toNonEmptyString(
        participant?.meta?.location,
        participant?.location,
        participant?.type,
        fallbackLocation,
      )?.toLowerCase() || "",
  };
}

function extractSportmonksTeams(fixture) {
  const participants = toArray(fixture?.participants)
    .map((participant) => normalizeSportmonksParticipant(participant))
    .filter((participant) => participant.name);

  if (participants.length >= 2) {
    const homeParticipant =
      participants.find((participant) =>
        participant.location.includes("home"),
      ) || participants[0];
    const awayParticipant =
      participants.find((participant) =>
        participant.location.includes("away"),
      ) ||
      participants.find((participant) => participant !== homeParticipant) ||
      participants[1];

    return {
      home: homeParticipant,
      away: awayParticipant,
    };
  }

  const homeParticipant = normalizeSportmonksParticipant(
    fixture?.homeTeam || fixture?.localteam || fixture?.home || null,
    "home",
  );
  const awayParticipant = normalizeSportmonksParticipant(
    fixture?.awayTeam || fixture?.visitorteam || fixture?.away || null,
    "away",
  );

  return {
    home: homeParticipant.name ? homeParticipant : null,
    away: awayParticipant.name ? awayParticipant : null,
  };
}

function extractGoalsFromScoreEntry(scoreEntry) {
  return toFiniteNumber(
    scoreEntry?.score?.goals,
    scoreEntry?.score?.goal,
    scoreEntry?.score?.current,
    scoreEntry?.goals,
    scoreEntry?.result,
    scoreEntry?.value,
  );
}

function isMatchingScoreEntry(scoreEntry, team, fallbackLocation) {
  if (!team) {
    return false;
  }

  const scoreLocation =
    toNonEmptyString(
      scoreEntry?.score?.participant,
      scoreEntry?.participant,
      scoreEntry?.participant_type,
      scoreEntry?.meta?.location,
    )?.toLowerCase() || "";

  if (scoreLocation && scoreLocation.includes(fallbackLocation)) {
    return true;
  }

  const participantId = toFiniteNumber(
    scoreEntry?.participant_id,
    scoreEntry?.score?.participant_id,
    scoreEntry?.participant?.id,
  );

  return (
    participantId !== null &&
    team.id !== null &&
    participantId === Number(team.id)
  );
}

function extractTeamGoals(fixture, team, fallbackLocation) {
  const scoreEntries = toArray(fixture?.scores);

  if (scoreEntries.length) {
    const matchingEntries = scoreEntries.filter((scoreEntry) =>
      isMatchingScoreEntry(scoreEntry, team, fallbackLocation),
    );
    const preferredEntry =
      matchingEntries.find((scoreEntry) =>
        /current|live|ft/i.test(
          toNonEmptyString(scoreEntry?.description, scoreEntry?.type?.name) ||
            "",
        ),
      ) || matchingEntries[matchingEntries.length - 1];

    const goals = extractGoalsFromScoreEntry(preferredEntry);
    if (goals !== null) {
      return goals;
    }
  }

  return toFiniteNumber(
    fixture?.scores?.[fallbackLocation],
    fixture?.score?.[fallbackLocation],
    fixture?.[`${fallbackLocation}_score`],
    fixture?.result?.[fallbackLocation],
  );
}

function extractSportmonksLiveLabel(fixture) {
  const minute = toFiniteNumber(
    fixture?.time?.minute,
    fixture?.minute,
    fixture?.state?.minute,
    fixture?.clock?.minute,
  );
  const addedTime = toFiniteNumber(
    fixture?.time?.added_time,
    fixture?.time?.injury_time,
    fixture?.extra_minute,
  );

  if (minute !== null) {
    return addedTime !== null ? `${minute}+${addedTime}'` : `${minute}'`;
  }

  return (
    toNonEmptyString(
      fixture?.state?.short_name,
      fixture?.state?.name,
      fixture?.status,
      fixture?.result_info,
    ) || "LIVE"
  );
}

function formatSportmonksEventMinute(event) {
  const minute = toFiniteNumber(
    event?.minute,
    event?.time?.minute,
    event?.clock?.minute,
  );
  const addedTime = toFiniteNumber(
    event?.extra_minute,
    event?.time?.extra_minute,
    event?.added_time,
  );

  if (minute !== null) {
    return addedTime !== null ? `${minute}+${addedTime}'` : `${minute}'`;
  }

  return "•";
}

function normalizeSportmonksEvent(event) {
  const typeName =
    toNonEmptyString(
      event?.type?.name,
      event?.type?.developer_name,
      event?.event,
      event?.result,
    ) || "حدث";
  const playerName =
    toNonEmptyString(
      event?.player_name,
      event?.player?.name,
      event?.player?.display_name,
      event?.player?.data?.display_name,
    ) || "";
  const relatedPlayerName =
    toNonEmptyString(
      event?.relatedplayer_name,
      event?.relatedplayer?.name,
      event?.relatedplayer?.display_name,
      event?.relatedplayer?.data?.display_name,
    ) || "";
  const note =
    toNonEmptyString(
      event?.comment,
      event?.detail,
      event?.reason,
      event?.info,
    ) || "";

  const detailParts = [playerName, relatedPlayerName, note].filter(Boolean);

  return {
    minute: formatSportmonksEventMinute(event),
    title: typeName,
    detail: detailParts.join(" · ") || "تفاصيل الحدث غير متوفرة",
  };
}

function parseSportmonksFormationField(value) {
  if (typeof value !== "string") {
    return {
      row: null,
      column: null,
    };
  }

  const [rowPart, columnPart] = value.split(":");

  return {
    row: toFiniteNumber(rowPart),
    column: toFiniteNumber(columnPart),
  };
}

function compareNullableNumbers(left, right) {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return left - right;
}

function normalizeSportmonksLineupPlayer(lineupEntry) {
  const name =
    toNonEmptyString(
      lineupEntry?.player_name,
      lineupEntry?.player?.name,
      lineupEntry?.player?.display_name,
    ) || "";

  if (!name) {
    return null;
  }

  const formation = parseSportmonksFormationField(lineupEntry?.formation_field);
  const formationPosition = toFiniteNumber(lineupEntry?.formation_position);
  const typeId = toFiniteNumber(lineupEntry?.type_id, lineupEntry?.type?.id);
  const isStarter =
    typeId === 11 ||
    (typeId !== 12 && (formation.row !== null || formationPosition !== null));

  return {
    id:
      lineupEntry?.player_id ??
      lineupEntry?.player?.id ??
      lineupEntry?.id ??
      null,
    name,
    image:
      toNonEmptyString(
        lineupEntry?.player?.image_path,
        lineupEntry?.player?.photo,
        lineupEntry?.image_path,
      ) || null,
    number: toFiniteNumber(
      lineupEntry?.jersey_number,
      lineupEntry?.shirt_number,
      lineupEntry?.number,
    ),
    formationRow: formation.row,
    formationColumn: formation.column,
    formationPosition,
    role: isStarter ? "starter" : "bench",
  };
}

function sortSportmonksLineupPlayers(left, right) {
  return (
    compareNullableNumbers(left.formationRow, right.formationRow) ||
    compareNullableNumbers(left.formationColumn, right.formationColumn) ||
    compareNullableNumbers(left.formationPosition, right.formationPosition) ||
    compareNullableNumbers(left.number, right.number) ||
    left.name.localeCompare(right.name)
  );
}

function deriveSportmonksFormation(starters) {
  const rowCounts = new Map();

  for (const player of starters) {
    if (player.formationRow === null) {
      continue;
    }

    rowCounts.set(
      player.formationRow,
      (rowCounts.get(player.formationRow) || 0) + 1,
    );
  }

  const orderedRows = [...rowCounts.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([, count]) => count);

  if (!orderedRows.length) {
    return null;
  }

  const outfieldRows =
    orderedRows[0] === 1 ? orderedRows.slice(1) : orderedRows;
  return outfieldRows.length ? outfieldRows.join("-") : null;
}

function normalizeSportmonksTeamLineup(lineupEntries, team) {
  if (!team?.id) {
    return null;
  }

  const teamId = Number(team.id);
  const normalizedPlayers = lineupEntries
    .filter((lineupEntry) => {
      const entryTeamId = toFiniteNumber(
        lineupEntry?.team_id,
        lineupEntry?.participant_id,
        lineupEntry?.team?.id,
      );

      return entryTeamId !== null && entryTeamId === teamId;
    })
    .map(normalizeSportmonksLineupPlayer)
    .filter(Boolean);

  if (!normalizedPlayers.length) {
    return null;
  }

  const starters = normalizedPlayers
    .filter((player) => player.role === "starter")
    .sort(sortSportmonksLineupPlayers);
  const bench = normalizedPlayers
    .filter((player) => player.role === "bench")
    .sort(sortSportmonksLineupPlayers);

  return {
    formation: deriveSportmonksFormation(starters),
    starters,
    bench,
  };
}

function normalizeSportmonksLineups(fixture, teams) {
  const lineupEntries = toArray(fixture?.lineups);

  if (!lineupEntries.length) {
    return null;
  }

  const home = normalizeSportmonksTeamLineup(lineupEntries, teams.home);
  const away = normalizeSportmonksTeamLineup(lineupEntries, teams.away);

  if (!home && !away) {
    return null;
  }

  return {
    home,
    away,
  };
}

function normalizeSportmonksFixture(fixture) {
  const teams = extractSportmonksTeams(fixture);
  if (!teams.home?.name || !teams.away?.name) {
    return null;
  }

  const lineup = normalizeSportmonksLineups(fixture, teams);

  return {
    fixtureId: fixture?.id ?? fixture?.fixture_id ?? null,
    leagueName:
      toNonEmptyString(
        fixture?.league?.name,
        fixture?.league_name,
        fixture?.competition?.name,
      ) || "Live Match",
    liveLabel: extractSportmonksLiveLabel(fixture),
    home: {
      name: teams.home.name,
      logo: teams.home.logo,
      score: extractTeamGoals(fixture, teams.home, "home"),
    },
    away: {
      name: teams.away.name,
      logo: teams.away.logo,
      score: extractTeamGoals(fixture, teams.away, "away"),
    },
    events: toArray(fixture?.events).map(normalizeSportmonksEvent),
    lineup,
  };
}

function normalizeRole(value) {
  if (typeof value !== "string") return null;

  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue === "content_admin") return "content_admin";
  if (normalizedValue === "super_admin") return "super_admin";
  return null;
}

function buildActorLabel(user) {
  return (
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.name?.trim() ||
    user?.email ||
    user?.id ||
    "admin"
  );
}

function resolveAdminRole(user) {
  if (!user) return null;

  const metadata = user.user_metadata || {};
  const explicitRole =
    normalizeRole(metadata.role) || normalizeRole(metadata.admin_role);

  if (explicitRole) {
    return explicitRole;
  }

  if (metadata.is_admin === true) {
    return "super_admin";
  }

  const normalizedEmail = user.email?.trim().toLowerCase();
  if (normalizedEmail && ADMIN_EMAIL_ALLOWLIST.has(normalizedEmail)) {
    return "super_admin";
  }

  if (ENABLE_DEV_ADMIN_FALLBACK) {
    return "super_admin";
  }

  return null;
}

function createEntryId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isSupportedVerificationBadge(value) {
  return value === "yellow" || value === "blue";
}

function normalizeVerificationBadge(value) {
  return value === "blue" ? "blue" : "yellow";
}

function getVerificationBadgeLabel(value) {
  return normalizeVerificationBadge(value) === "blue" ? "الزرقاء" : "الصفراء";
}

function normalizeVerifiedUsers(value) {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      typeof entry.userId === "string" &&
      entry.userId.trim(),
  );
}

function createAuditLogEntry({ action, targetType, targetId, details, actor }) {
  return {
    id: createEntryId(),
    action,
    targetType,
    targetId,
    details,
    actor,
    createdAt: new Date().toISOString(),
  };
}

function serializeVerificationEntry(entry) {
  return {
    userId: entry.userId,
    badge: normalizeVerificationBadge(entry.badge),
    updatedAt:
      typeof entry.updatedAt === "string"
        ? entry.updatedAt
        : new Date().toISOString(),
    updatedBy: typeof entry.updatedBy === "string" ? entry.updatedBy : "admin",
  };
}

function buildVerificationLookup(verifiedUsers) {
  return new Map(
    normalizeVerifiedUsers(verifiedUsers).map((entry) => [
      entry.userId,
      serializeVerificationEntry(entry),
    ]),
  );
}

async function ensureAdminStore() {
  await fs.mkdir(path.dirname(ADMIN_STORE_PATH), { recursive: true });

  try {
    await fs.access(ADMIN_STORE_PATH);
  } catch {
    await fs.writeFile(
      ADMIN_STORE_PATH,
      JSON.stringify(
        { reports: [], auditLogs: [], verifiedUsers: [] },
        null,
        2,
      ),
      "utf8",
    );
  }
}

async function readAdminStore() {
  await ensureAdminStore();

  try {
    const rawValue = await fs.readFile(ADMIN_STORE_PATH, "utf8");
    const parsedValue = JSON.parse(rawValue);

    return {
      reports: Array.isArray(parsedValue?.reports) ? parsedValue.reports : [],
      auditLogs: Array.isArray(parsedValue?.auditLogs)
        ? parsedValue.auditLogs
        : [],
      verifiedUsers: normalizeVerifiedUsers(parsedValue?.verifiedUsers).map(
        serializeVerificationEntry,
      ),
    };
  } catch {
    return {
      reports: [],
      auditLogs: [],
      verifiedUsers: [],
    };
  }
}

async function writeAdminStore(store) {
  await ensureAdminStore();
  await fs.writeFile(ADMIN_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function serializeAdminReportEntry(entry) {
  return {
    id: entry.id,
    targetType: entry.target_type,
    targetId: entry.target_id,
    source: entry.source,
    summary: entry.summary,
    reason: entry.reason,
    status: entry.status,
    createdAt: entry.created_at,
    reporterLabel: entry.reporter_label || undefined,
  };
}

function serializeAdminAuditLogEntry(entry) {
  return {
    id: entry.id,
    action: entry.action,
    targetType: entry.target_type,
    targetId: entry.target_id,
    details: entry.details,
    actor: entry.actor_label,
    createdAt: entry.created_at,
  };
}

async function loadAdminReportsFromDatabase() {
  if (!serviceClient) return null;

  const { data, error } = await serviceClient
    .from("admin_reports")
    .select(
      "id, target_type, target_id, source, summary, reason, status, reporter_label, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return null;
  }

  return (data || []).map(serializeAdminReportEntry);
}

async function insertAdminReportToDatabase(input) {
  if (!serviceClient) return null;

  const { data, error } = await serviceClient
    .from("admin_reports")
    .insert({
      target_type: input.targetType,
      target_id: input.targetId,
      source: input.source,
      summary: input.summary,
      reason: input.reason,
      status: input.status,
      reporter_label: input.reporterLabel || null,
      created_by: input.createdBy || null,
      updated_at: new Date().toISOString(),
    })
    .select(
      "id, target_type, target_id, source, summary, reason, status, reporter_label, created_at",
    )
    .single();

  if (error || !data) {
    return null;
  }

  return serializeAdminReportEntry(data);
}

async function updateAdminReportStatusInDatabase(reportId, status) {
  if (!serviceClient) return null;

  const { error } = await serviceClient
    .from("admin_reports")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    return null;
  }

  return loadAdminReportsFromDatabase();
}

async function loadAdminAuditLogsFromDatabase() {
  if (!serviceClient) return null;

  const { data, error } = await serviceClient
    .from("admin_audit_logs")
    .select(
      "id, action, target_type, target_id, details, actor_label, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return null;
  }

  return (data || []).map(serializeAdminAuditLogEntry);
}

async function appendAdminAuditLogToDatabase(input) {
  if (!serviceClient) return null;

  const { data, error } = await serviceClient
    .from("admin_audit_logs")
    .insert({
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId,
      details: input.details,
      actor_label: input.actor,
      actor_user_id: input.actorUserId || null,
    })
    .select(
      "id, action, target_type, target_id, details, actor_label, created_at",
    )
    .single();

  if (error || !data) {
    return null;
  }

  return serializeAdminAuditLogEntry(data);
}

async function loadVerifiedUsersFromDatabase() {
  if (!serviceClient) return null;

  const { data, error } = await serviceClient
    .from("user_verifications")
    .select("user_id, badge, updated_at, updated_by")
    .order("updated_at", { ascending: false });

  if (error) {
    return null;
  }

  return (data || []).map((entry) =>
    serializeVerificationEntry({
      userId: entry.user_id,
      badge: entry.badge,
      updatedAt: entry.updated_at,
      updatedBy: entry.updated_by,
    }),
  );
}

async function updateUserVerificationInDatabase({
  userId,
  verified,
  badge,
  actor,
}) {
  if (!serviceClient) return null;

  const currentVerifiedUsers = (await loadVerifiedUsersFromDatabase()) || [];

  if (verified) {
    const existingEntry = currentVerifiedUsers.find(
      (entry) => entry.userId === userId,
    );
    const nextBadge = isSupportedVerificationBadge(badge)
      ? badge
      : existingEntry?.badge || "yellow";

    const { error } = await serviceClient.from("user_verifications").upsert(
      {
        user_id: userId,
        badge: nextBadge,
        updated_at: new Date().toISOString(),
        updated_by: actor,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      return null;
    }
  } else {
    const { error } = await serviceClient
      .from("user_verifications")
      .delete()
      .eq("user_id", userId);

    if (error) {
      return null;
    }
  }

  return loadVerifiedUsersFromDatabase();
}

async function loadAdminPersistenceState() {
  const [reports, auditLogs, verifiedUsers] = await Promise.all([
    loadAdminReportsFromDatabase(),
    loadAdminAuditLogsFromDatabase(),
    loadVerifiedUsersFromDatabase(),
  ]);

  if (!reports || !auditLogs || !verifiedUsers) {
    return null;
  }

  return {
    reports,
    auditLogs,
    verifiedUsers,
  };
}

function getVideoStoragePath(videoUrl) {
  try {
    const parsedUrl = new URL(videoUrl);
    const marker = "/storage/v1/object/public/videos/";
    const markerIndex = parsedUrl.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(
      parsedUrl.pathname.slice(markerIndex + marker.length),
    );
  } catch {
    return null;
  }
}

function requireServiceClient(res) {
  if (serviceClient) {
    return true;
  }

  res.status(503).json({
    error: "ADMIN_SERVICE_ROLE_MISSING",
    message:
      "الخادم الإداري يحتاج SUPABASE_SERVICE_ROLE_KEY لتفعيل جلب البيانات الإدارية والحذف المحمي.",
  });
  return false;
}

function createUserScopedClient(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

async function authenticateRequest(req, res) {
  const authorizationHeader = req.headers.authorization || "";
  const accessToken = authorizationHeader.startsWith("Bearer ")
    ? authorizationHeader.slice(7).trim()
    : "";

  if (!accessToken) {
    res.status(401).json({
      error: "AUTH_REQUIRED",
      message: "يجب تسجيل الدخول أولًا.",
    });
    return null;
  }

  const { data, error } = await authClient.auth.getUser(accessToken);

  if (error || !data?.user) {
    res.status(401).json({
      error: "INVALID_SESSION",
      message: "تعذر التحقق من جلسة المستخدم.",
    });
    return null;
  }

  return {
    user: data.user,
    accessToken,
  };
}

async function requireAuthenticatedUser(req, res, next) {
  const authResult = await authenticateRequest(req, res);
  if (!authResult) return;

  req.authUser = authResult.user;
  req.authAccessToken = authResult.accessToken;
  next();
}

async function requireAdmin(req, res, next) {
  const authResult = await authenticateRequest(req, res);
  if (!authResult) return;

  const user = authResult.user;

  const role = resolveAdminRole(user);

  if (!role) {
    res.status(403).json({
      error: "ADMIN_FORBIDDEN",
      message: "هذا الحساب لا يملك صلاحية الأدمن.",
    });
    return;
  }

  req.authUser = user;
  req.authAccessToken = authResult.accessToken;
  req.adminRole = role;
  next();
}

app.get("/", (req, res) => {
  res.json({
    service: "WEBPLUS Admin API",
    status: "ok",
    serviceRoleConfigured: Boolean(serviceClient),
  });
});

app.get("/api/sportmonks/inplay", async (req, res) => {
  const inplayUrl = buildSportmonksInplayUrl();

  if (!inplayUrl) {
    res.status(503).json({
      source: "sportmonks",
      status: "unconfigured",
      message:
        "SportMonks غير مهيأ بعد. أضف SPORTMONKS_API_TOKEN أو SPORTMONKS_INPLAY_URL إلى البيئة.",
      fetchedAt: new Date().toISOString(),
      match: null,
    });
    return;
  }

  try {
    const inplayPayload = await fetchSportmonksJson(inplayUrl);
    const fixtures = toArray(inplayPayload?.data);

    if (!fixtures.length) {
      res.json({
        source: "sportmonks",
        status: "empty",
        message:
          typeof inplayPayload?.message === "string"
            ? inplayPayload.message
            : "لا توجد مباراة live متاحة الآن من SportMonks.",
        fetchedAt: new Date().toISOString(),
        match: null,
      });
      return;
    }

    const baseFixture = fixtures[0];
    const detailsUrl = buildSportmonksFixtureDetailsUrl(
      baseFixture?.id ?? baseFixture?.fixture_id,
    );

    let detailedFixture = null;
    if (detailsUrl) {
      try {
        const detailsPayload = await fetchSportmonksJson(detailsUrl);
        detailedFixture = detailsPayload?.data || null;
      } catch {
        detailedFixture = null;
      }
    }

    const normalizedMatch = normalizeSportmonksFixture(
      detailedFixture || baseFixture,
    );

    if (!normalizedMatch) {
      res.json({
        source: "sportmonks",
        status: "empty",
        message:
          "تم الاتصال بـ SportMonks لكن تعذر تحويل المباراة إلى الشكل المطلوب.",
        fetchedAt: new Date().toISOString(),
        match: null,
      });
      return;
    }

    res.json({
      source: "sportmonks",
      status: "live",
      fetchedAt: new Date().toISOString(),
      match: normalizedMatch,
    });
  } catch (error) {
    res.status(502).json({
      source: "sportmonks",
      status: "error",
      message:
        error instanceof Error && error.message
          ? error.message
          : "تعذر تحميل البيانات الحية من SportMonks.",
      fetchedAt: new Date().toISOString(),
      match: null,
    });
  }
});

app.get("/api/admin/session", requireAdmin, (req, res) => {
  res.json({
    role: req.adminRole,
    email: req.authUser?.email || null,
    userId: req.authUser?.id,
  });
});

app.get("/api/admin/public/verification", async (req, res) => {
  const verifiedUsersFromDatabase = await loadVerifiedUsersFromDatabase();

  if (verifiedUsersFromDatabase) {
    res.json({
      verifiedUsers: verifiedUsersFromDatabase,
    });
    return;
  }

  const store = await readAdminStore();
  res.json({
    verifiedUsers: normalizeVerifiedUsers(store.verifiedUsers).map(
      serializeVerificationEntry,
    ),
  });
});

app.get("/api/admin/reports", requireAdmin, async (req, res) => {
  const reportsFromDatabase = await loadAdminReportsFromDatabase();

  if (reportsFromDatabase) {
    res.json(reportsFromDatabase);
    return;
  }

  const store = await readAdminStore();
  res.json(store.reports);
});

app.get("/api/admin/verification", requireAdmin, async (req, res) => {
  const verifiedUsersFromDatabase = await loadVerifiedUsersFromDatabase();

  if (verifiedUsersFromDatabase) {
    res.json({
      verifiedUsers: verifiedUsersFromDatabase,
    });
    return;
  }

  const store = await readAdminStore();
  res.json({
    verifiedUsers: normalizeVerifiedUsers(store.verifiedUsers).map(
      serializeVerificationEntry,
    ),
  });
});

app.post("/api/admin/reports", requireAuthenticatedUser, async (req, res) => {
  const {
    targetType,
    targetId,
    source,
    summary,
    reason,
    reporterLabel,
    status,
  } = req.body || {};

  if (
    typeof targetType !== "string" ||
    typeof targetId !== "string" ||
    typeof source !== "string" ||
    typeof summary !== "string" ||
    typeof reason !== "string"
  ) {
    res.status(400).json({
      error: "INVALID_REPORT",
      message: "بيانات البلاغ غير مكتملة.",
    });
    return;
  }

  const nextReport = {
    id: createEntryId(),
    targetType,
    targetId,
    source,
    summary,
    reason,
    status:
      status === "reviewing" || status === "resolved" || status === "dismissed"
        ? status
        : "new",
    createdAt: new Date().toISOString(),
    reporterLabel: reporterLabel || buildActorLabel(req.authUser),
  };

  const createdDatabaseReport = await insertAdminReportToDatabase({
    targetType: nextReport.targetType,
    targetId: nextReport.targetId,
    source: nextReport.source,
    summary: nextReport.summary,
    reason: nextReport.reason,
    status: nextReport.status,
    reporterLabel: nextReport.reporterLabel,
    createdBy: req.authUser?.id || null,
  });

  if (createdDatabaseReport) {
    res.status(201).json(createdDatabaseReport);
    return;
  }

  const store = await readAdminStore();
  store.reports.unshift(nextReport);
  await writeAdminStore(store);

  res.status(201).json(nextReport);
});

app.patch("/api/admin/reports/:reportId", requireAdmin, async (req, res) => {
  const { reportId } = req.params;
  const { status } = req.body || {};

  if (
    status !== "new" &&
    status !== "reviewing" &&
    status !== "resolved" &&
    status !== "dismissed"
  ) {
    res.status(400).json({
      error: "INVALID_REPORT_STATUS",
      message: "حالة البلاغ غير صالحة.",
    });
    return;
  }

  const databaseReports = await updateAdminReportStatusInDatabase(
    reportId,
    status,
  );

  if (databaseReports) {
    res.json({
      reports: databaseReports,
    });
    return;
  }

  const store = await readAdminStore();
  const reportIndex = store.reports.findIndex(
    (report) => report.id === reportId,
  );

  if (reportIndex === -1) {
    res.status(404).json({
      error: "REPORT_NOT_FOUND",
      message: "البلاغ المطلوب غير موجود.",
    });
    return;
  }

  const updatedReport = {
    ...store.reports[reportIndex],
    status,
  };
  store.reports[reportIndex] = updatedReport;
  await writeAdminStore(store);

  res.json({
    reports: store.reports,
  });
});

app.get("/api/admin/audit", requireAdmin, async (req, res) => {
  const auditLogsFromDatabase = await loadAdminAuditLogsFromDatabase();

  if (auditLogsFromDatabase) {
    res.json(auditLogsFromDatabase);
    return;
  }

  const store = await readAdminStore();
  res.json(store.auditLogs);
});

app.post("/api/admin/audit", requireAdmin, async (req, res) => {
  const { action, targetType, targetId, details, actor } = req.body || {};

  if (
    typeof action !== "string" ||
    typeof targetType !== "string" ||
    typeof targetId !== "string" ||
    typeof details !== "string"
  ) {
    res.status(400).json({
      error: "INVALID_AUDIT_LOG",
      message: "بيانات سجل العملية غير مكتملة.",
    });
    return;
  }

  const nextLog = createAuditLogEntry({
    action,
    targetType,
    targetId,
    details,
    actor:
      typeof actor === "string" && actor.trim()
        ? actor
        : buildActorLabel(req.authUser),
  });

  const createdDatabaseLog = await appendAdminAuditLogToDatabase({
    action: nextLog.action,
    targetType: nextLog.targetType,
    targetId: nextLog.targetId,
    details: nextLog.details,
    actor: nextLog.actor,
    actorUserId: req.authUser?.id || null,
  });

  if (createdDatabaseLog) {
    res.status(201).json(createdDatabaseLog);
    return;
  }

  const store = await readAdminStore();
  store.auditLogs.unshift(nextLog);
  await writeAdminStore(store);

  res.status(201).json(nextLog);
});

app.patch(
  "/api/admin/users/:userId/verification",
  requireAdmin,
  async (req, res) => {
    const userId =
      typeof req.params.userId === "string" ? req.params.userId.trim() : "";
    const { verified, badge } = req.body || {};

    if (!userId) {
      res.status(400).json({
        error: "INVALID_USER_ID",
        message: "معرف المستخدم غير صالح.",
      });
      return;
    }

    if (typeof verified !== "boolean") {
      res.status(400).json({
        error: "INVALID_VERIFICATION_STATE",
        message: "حالة التوثيق يجب أن تكون true أو false.",
      });
      return;
    }

    if (
      verified &&
      typeof badge !== "undefined" &&
      !isSupportedVerificationBadge(badge)
    ) {
      res.status(400).json({
        error: "INVALID_VERIFICATION_BADGE",
        message: "لون الشارة يجب أن يكون yellow أو blue.",
      });
      return;
    }

    const actor = buildActorLabel(req.authUser);
    const nextVerifiedUsers = await updateUserVerificationInDatabase({
      userId,
      verified,
      badge,
      actor,
    });

    if (nextVerifiedUsers) {
      const nextVerification =
        nextVerifiedUsers.find((entry) => entry.userId === userId) ?? null;

      await appendAdminAuditLogToDatabase({
        action: verified ? "verify_user" : "remove_user_verification",
        targetType: "user",
        targetId: userId,
        details: verified
          ? `تم تعيين الشارة ${getVerificationBadgeLabel(nextVerification?.badge)} للمستخدم ${userId}`
          : `تم سحب التوثيق من المستخدم ${userId}`,
        actor,
        actorUserId: req.authUser?.id || null,
      });

      res.json({
        verified,
        verification: nextVerification,
        verifiedUsers: nextVerifiedUsers,
      });
      return;
    }

    const store = await readAdminStore();
    const lookup = buildVerificationLookup(store.verifiedUsers);

    if (verified) {
      const nextBadge = isSupportedVerificationBadge(badge)
        ? badge
        : lookup.get(userId)?.badge || "yellow";

      lookup.set(userId, {
        userId,
        badge: nextBadge,
        updatedAt: new Date().toISOString(),
        updatedBy: actor,
      });
    } else {
      lookup.delete(userId);
    }

    const nextVerification = lookup.get(userId) ?? null;

    store.verifiedUsers = Array.from(lookup.values());
    store.auditLogs.unshift(
      createAuditLogEntry({
        action: verified ? "verify_user" : "remove_user_verification",
        targetType: "user",
        targetId: userId,
        details: verified
          ? `تم تعيين الشارة ${getVerificationBadgeLabel(nextVerification?.badge)} للمستخدم ${userId}`
          : `تم سحب التوثيق من المستخدم ${userId}`,
        actor,
      }),
    );
    await writeAdminStore(store);

    res.json({
      verified,
      verification: nextVerification,
      verifiedUsers: store.verifiedUsers,
    });
  },
);

app.get("/api/admin/dashboard", requireAdmin, async (req, res) => {
  if (!requireServiceClient(res)) return;

  const [usersRes, groupsRes, membersRes, videosRes, persistedState] =
    await Promise.all([
      serviceClient.from("users").select("id, email, full_name"),
      serviceClient.from("groups").select("id, name, is_private, created_by"),
      serviceClient.from("group_members").select("group_id, user_id"),
      serviceClient
        .from("videos")
        .select("id, video_url, caption")
        .order("id", { ascending: false }),
      loadAdminPersistenceState(),
    ]);

  const firstError =
    usersRes.error ?? groupsRes.error ?? membersRes.error ?? videosRes.error;

  if (firstError) {
    res.status(500).json({
      error: "ADMIN_DASHBOARD_FAILED",
      message: firstError.message || "تعذر تحميل بيانات الأدمن.",
    });
    return;
  }

  const memberCountMap = new Map();
  (membersRes.data || []).forEach((member) => {
    const currentCount = memberCountMap.get(member.group_id) || 0;
    memberCountMap.set(member.group_id, currentCount + 1);
  });

  const groups = (groupsRes.data || []).map((group) => ({
    ...group,
    memberCount: memberCountMap.get(group.id) || 0,
  }));
  const fallbackStore = persistedState ? null : await readAdminStore();
  const adminState = persistedState || fallbackStore;
  const verificationLookup = buildVerificationLookup(adminState.verifiedUsers);
  const users = (usersRes.data || []).map((user) => ({
    ...user,
    verified: verificationLookup.has(user.id),
    verificationBadge: verificationLookup.get(user.id)?.badge || null,
  }));

  res.json({
    users,
    groups,
    videos: videosRes.data || [],
    reports: adminState.reports,
    auditLogs: adminState.auditLogs,
    verifiedUsers: adminState.verifiedUsers,
  });
});

app.delete("/api/admin/groups/:groupId", requireAdmin, async (req, res) => {
  if (!requireServiceClient(res)) return;

  const { groupId } = req.params;

  app.delete(
    "/api/admin/videos/:videoId/owner",
    requireAuthenticatedUser,
    async (req, res) => {
      const videoId = Number(req.params.videoId);

      if (!Number.isInteger(videoId) || videoId <= 0) {
        res.status(400).json({
          error: "INVALID_VIDEO_ID",
          message: "معرف الفيديو غير صالح.",
        });
        return;
      }

      const userClient = createUserScopedClient(req.authAccessToken);

      const { data: videoRow, error: videoError } = await userClient
        .from("videos")
        .select("id, user_id, video_url")
        .eq("id", videoId)
        .maybeSingle();

      if (videoError) {
        res.status(500).json({
          error: "VIDEO_LOOKUP_FAILED",
          message: "تعذر التحقق من ملكية الفيديو.",
        });
        return;
      }

      if (!videoRow) {
        res.status(404).json({
          error: "VIDEO_NOT_FOUND",
          message: "الفيديو غير موجود.",
        });
        return;
      }

      if (videoRow.user_id !== req.authUser.id) {
        res.status(403).json({
          error: "VIDEO_DELETE_FORBIDDEN",
          message: "لا يمكنك حذف إلا فيديوهاتك.",
        });
        return;
      }

      const { error: deleteError } = await userClient
        .from("videos")
        .delete()
        .eq("id", videoId)
        .eq("user_id", req.authUser.id);

      if (deleteError) {
        res.status(500).json({
          error: "VIDEO_DELETE_FAILED",
          message: "تعذر حذف الفيديو الآن.",
        });
        return;
      }

      if (serviceClient) {
        const storagePath = getVideoStoragePath(videoRow.video_url);
        if (storagePath) {
          await serviceClient.storage.from("videos").remove([storagePath]);
        }
      }

      res.json({
        success: true,
        deletedVideoId: videoId,
      });
    },
  );

  await serviceClient.from("group_members").delete().eq("group_id", groupId);
  await serviceClient.from("messages").delete().eq("group_id", groupId);

  const { error } = await serviceClient
    .from("groups")
    .delete()
    .eq("id", groupId);

  if (error) {
    res.status(500).json({
      error: "DELETE_GROUP_FAILED",
      message: error.message || "تعذر حذف القروب.",
    });
    return;
  }

  res.json({ success: true, deletedGroupId: groupId });
});

app.delete("/api/admin/videos/:videoId", requireAdmin, async (req, res) => {
  if (!requireServiceClient(res)) return;

  const videoId = Number(req.params.videoId);

  if (!Number.isFinite(videoId)) {
    res.status(400).json({
      error: "INVALID_VIDEO_ID",
      message: "معرف الفيديو غير صالح.",
    });
    return;
  }

  const { data: videoRow } = await serviceClient
    .from("videos")
    .select("id, video_url, caption")
    .eq("id", videoId)
    .maybeSingle();

  const { error } = await serviceClient
    .from("videos")
    .delete()
    .eq("id", videoId);

  if (error) {
    res.status(500).json({
      error: "DELETE_VIDEO_FAILED",
      message: error.message || "تعذر حذف الفيديو.",
    });
    return;
  }

  const storagePath = getVideoStoragePath(videoRow?.video_url || "");
  if (storagePath) {
    await serviceClient.storage
      .from("videos")
      .remove([storagePath])
      .catch(() => null);
  }

  res.json({ success: true, deletedVideoId: videoId });
});

http
  .createServer(
    {
      maxHeaderSize: 128 * 1024,
    },
    app,
  )
  .listen(PORT, () => {
    console.log(`WEBPLUS Admin API listening on http://localhost:${PORT}`);
    console.log(`Supabase service role configured: ${Boolean(serviceClient)}`);
  });
