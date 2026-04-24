import {
  appendAdminAuditLogApi,
  createAdminReportApi,
  loadAdminAuditLogsApi,
  loadAdminReportsApi,
  shouldFallbackAdminApi,
  updateAdminReportStatusApi,
} from "./adminApi";
import { supabase } from "../pages/supabase";

export type AdminReportTargetType =
  | "x_post"
  | "video"
  | "group"
  | "user"
  | "comment"
  | "message";

export type AdminReportStatus = "new" | "reviewing" | "resolved" | "dismissed";

export interface AdminReport {
  id: string;
  targetType: AdminReportTargetType;
  targetId: string;
  source: string;
  summary: string;
  reason: string;
  status: AdminReportStatus;
  createdAt: string;
  reporterLabel?: string;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  actor: string;
  createdAt: string;
}

export const ADMIN_STORE_EVENT = "webplus:admin-store-updated";

const REPORTS_STORAGE_KEY = "webplus:admin-reports";
const AUDIT_STORAGE_KEY = "webplus:admin-audit";

function shouldUseLocalAdminFallback(error: unknown) {
  return import.meta.env.DEV || shouldFallbackAdminApi(error);
}

function createEntryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readArrayStorage<T>(storageKey: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function writeArrayStorage<T>(storageKey: string, value: T[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(storageKey, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(ADMIN_STORE_EVENT));
}

function writeArrayStorageSilently<T>(storageKey: string, value: T[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

function createLocalReport(
  input: Omit<AdminReport, "id" | "status" | "createdAt"> & {
    status?: AdminReportStatus;
  },
) {
  const nextReport: AdminReport = {
    id: createEntryId(),
    targetType: input.targetType,
    targetId: input.targetId,
    source: input.source,
    summary: input.summary,
    reason: input.reason,
    reporterLabel: input.reporterLabel,
    status: input.status ?? "new",
    createdAt: new Date().toISOString(),
  };

  const nextReports = [
    nextReport,
    ...readArrayStorage<AdminReport>(REPORTS_STORAGE_KEY),
  ];
  writeArrayStorage(REPORTS_STORAGE_KEY, nextReports);
  return nextReport;
}

async function createSupabaseReport(
  input: Omit<AdminReport, "id" | "status" | "createdAt"> & {
    status?: AdminReportStatus;
  },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("admin_reports")
    .insert({
      target_type: input.targetType,
      target_id: input.targetId,
      source: input.source,
      summary: input.summary,
      reason: input.reason,
      status: input.status ?? "new",
      reporter_label: input.reporterLabel ?? null,
      created_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    })
    .select(
      "id, target_type, target_id, source, summary, reason, status, reporter_label, created_at",
    )
    .single();

  if (error || !data) {
    throw error;
  }

  return {
    id: data.id,
    targetType: data.target_type,
    targetId: data.target_id,
    source: data.source,
    summary: data.summary,
    reason: data.reason,
    status: data.status,
    createdAt: data.created_at,
    reporterLabel: data.reporter_label ?? undefined,
  } satisfies AdminReport;
}

export async function loadAdminReports() {
  try {
    const nextReports = await loadAdminReportsApi();
    writeArrayStorageSilently(REPORTS_STORAGE_KEY, nextReports);
    return nextReports;
  } catch (error) {
    if (!shouldUseLocalAdminFallback(error)) {
      throw error;
    }

    return readArrayStorage<AdminReport>(REPORTS_STORAGE_KEY);
  }
}

export async function createAdminReport(
  input: Omit<AdminReport, "id" | "status" | "createdAt"> & {
    status?: AdminReportStatus;
  },
) {
  try {
    const nextReport = await createAdminReportApi(input);
    const cachedReports = readArrayStorage<AdminReport>(REPORTS_STORAGE_KEY);
    writeArrayStorage(REPORTS_STORAGE_KEY, [
      nextReport,
      ...cachedReports.filter((report) => report.id !== nextReport.id),
    ]);
    return nextReport;
  } catch {
    try {
      const nextReport = await createSupabaseReport(input);
      const cachedReports = readArrayStorage<AdminReport>(REPORTS_STORAGE_KEY);
      writeArrayStorage(REPORTS_STORAGE_KEY, [
        nextReport,
        ...cachedReports.filter((report) => report.id !== nextReport.id),
      ]);
      return nextReport;
    } catch {
      return createLocalReport(input);
    }
  }
}

export async function updateAdminReportStatus(
  reportId: string,
  status: AdminReportStatus,
) {
  try {
    const nextReports = await updateAdminReportStatusApi(reportId, status);
    writeArrayStorage(REPORTS_STORAGE_KEY, nextReports);
    return nextReports;
  } catch (error) {
    if (!shouldUseLocalAdminFallback(error)) {
      throw error;
    }

    const nextReports = readArrayStorage<AdminReport>(REPORTS_STORAGE_KEY).map(
      (report) => (report.id === reportId ? { ...report, status } : report),
    );

    writeArrayStorage(REPORTS_STORAGE_KEY, nextReports);
    return nextReports;
  }
}

export async function loadAdminAuditLogs() {
  try {
    const nextAuditLogs = await loadAdminAuditLogsApi();
    writeArrayStorageSilently(AUDIT_STORAGE_KEY, nextAuditLogs);
    return nextAuditLogs;
  } catch (error) {
    if (!shouldUseLocalAdminFallback(error)) {
      throw error;
    }

    return readArrayStorage<AdminAuditLog>(AUDIT_STORAGE_KEY);
  }
}

export async function appendAdminAuditLog(
  input: Omit<AdminAuditLog, "id" | "createdAt">,
) {
  try {
    const nextLog = await appendAdminAuditLogApi(input);
    const cachedLogs = readArrayStorage<AdminAuditLog>(AUDIT_STORAGE_KEY);
    writeArrayStorage(AUDIT_STORAGE_KEY, [
      nextLog,
      ...cachedLogs.filter((log) => log.id !== nextLog.id),
    ]);
    return nextLog;
  } catch (error) {
    if (!shouldUseLocalAdminFallback(error)) {
      throw error;
    }

    const nextLog: AdminAuditLog = {
      id: createEntryId(),
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      details: input.details,
      actor: input.actor,
      createdAt: new Date().toISOString(),
    };

    const nextLogs = [
      nextLog,
      ...readArrayStorage<AdminAuditLog>(AUDIT_STORAGE_KEY),
    ];
    writeArrayStorage(AUDIT_STORAGE_KEY, nextLogs);
    return nextLog;
  }
}
