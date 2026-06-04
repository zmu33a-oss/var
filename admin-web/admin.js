(function () {
  "use strict";

  const APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1";
  const APPWRITE_PROJECT_ID = "69ff62d9001bf7dcd933";
  const SESSION_STORAGE_KEY = "var-admin-session";
  const KEYS_STORAGE_KEY = "var-admin-keys";
  const MODE_STORAGE_KEY = "var-admin-ui-mode";

  const AUDIT_LABELS = {
    grant_verification: "منح توثيق",
    revoke_verification: "إلغاء توثيق",
    suspend_account: "إيقاف حساب",
    activate_account: "إعادة تفعيل",
    hide_post: "إخفاء منشور",
    unhide_post: "إظهار منشور",
    delete_post: "حذف منشور",
    delete_account: "حذف حساب",
    set_card_tier: "تعيين بطاقة",
    migrate_card_tiers: "ترحيل بطاقات كلاسيك",
  };

  let keysData = [];
  let usersData = [];
  let auditLogs = [];
  let postsCount = 0;
  let currentAdmin = null;
  let currentGlobalMode = "X-Mode";
  let isBusy = false;
  let cardTierMigrationAttempted = false;

  function resolveApiBase() {
    if (typeof window === "undefined") return "";
    const { protocol, hostname, port } = window.location;
    const expoDevPorts = new Set(["8081", "5174", "19006", "8082"]);

    if (expoDevPorts.has(port)) {
      return `${protocol}//${hostname}:3000`;
    }

    return "";
  }

  function getSessionSecret() {
    return localStorage.getItem(SESSION_STORAGE_KEY) || "";
  }

  function setSessionSecret(secret) {
    if (secret) {
      localStorage.setItem(SESSION_STORAGE_KEY, secret);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  function isJwtToken(token) {
    return typeof token === "string" && token.startsWith("eyJ");
  }

  function applyAuthHeader(headers, token) {
    if (!token) {
      return;
    }

    if (isJwtToken(token)) {
      headers.set("X-Appwrite-JWT", token);
      return;
    }

    headers.set("X-Appwrite-Session", token);
  }

  function consumeSessionFromUrl() {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const session = params.get("session")?.trim() || "";

    if (!session) {
      return;
    }

    setSessionSecret(session);

    params.delete("session");
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash || ""}`;
    window.history.replaceState({}, "", nextUrl);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatRoleLabel(role) {
    return role === "admin" ? "أدمن" : "عضو";
  }

  function formatStatusLabel(accountStatus) {
    return accountStatus === "suspended" ? "موقوف" : "نشط";
  }

  function formatDateLabel(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatAuditTime(value) {
    if (!value) return "--:--:--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--:--:--";
    return date.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  function auditTone(action) {
    if (
      action.includes("delete") ||
      action.includes("suspend") ||
      action.includes("revoke")
    ) {
      return "danger";
    }
    if (
      action.includes("grant") ||
      action.includes("activate") ||
      action.includes("unhide")
    ) {
      return "success";
    }
    if (action.includes("hide") || action.includes("change")) {
      return "warning";
    }
    return "info";
  }

  function createAppwriteClient() {
    const client = new Appwrite.Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID);
    const token = getSessionSecret();
    if (token) {
      if (isJwtToken(token)) {
        client.setJWT(token);
      } else {
        client.setSession(token);
      }
    }
    return client;
  }

  async function adminFetch(path, init) {
    const headers = new Headers(init?.headers || {});
    if (!headers.has("Content-Type") && init?.body) {
      headers.set("Content-Type", "application/json");
    }
    applyAuthHeader(headers, getSessionSecret());

    const response = await fetch(`${resolveApiBase()}${path}`, {
      ...init,
      headers,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error =
        typeof payload.error === "string"
          ? payload.error
          : "تعذر تنفيذ الطلب.";
      throw new Error(error);
    }
    return payload;
  }

  function showToast(message, type) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    let icon = "check-circle";
    let colorClasses =
      "bg-emerald-950/90 border-emerald-500/30 text-emerald-200";

    if (type === "warning") {
      icon = "alert-triangle";
      colorClasses = "bg-amber-950/90 border-amber-500/30 text-amber-200";
    } else if (type === "info") {
      icon = "info";
      colorClasses = "bg-blue-950/90 border-blue-500/30 text-blue-200";
    } else if (type === "danger") {
      icon = "shield-alert";
      colorClasses = "bg-red-950/90 border-red-500/30 text-red-200";
    }

    const toast = document.createElement("div");
    toast.className = `flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 translate-x-12 opacity-0 pointer-events-auto ${colorClasses}`;
    toast.innerHTML = `
      <i data-lucide="${icon}" class="w-5 h-5 shrink-0"></i>
      <span class="text-xs font-bold leading-relaxed">${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => toast.classList.remove("translate-x-12", "opacity-0"), 10);
    setTimeout(() => {
      toast.classList.add("translate-x-12", "opacity-0");
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function setServerStatus(connected, message) {
    const label = document.getElementById("server-status-label");
    const dot = document.getElementById("server-status-dot");
    if (label) {
      label.textContent = message;
      label.className = connected
        ? "text-xs text-emerald-400 flex items-center gap-1"
        : "text-xs text-red-400 flex items-center gap-1";
    }
    if (dot) {
      dot.className = connected
        ? "h-2 w-2 rounded-full bg-emerald-500 animate-ping"
        : "h-2 w-2 rounded-full bg-red-500";
    }
  }

  function setHealthBars(health) {
    const powerText = document.getElementById("server-power");
    const powerBar = document.getElementById("server-power-bar");
    const ramText = document.getElementById("server-ram");
    const ramBar = document.getElementById("server-ram-bar");

    const missingCount = Array.isArray(health?.missing)
      ? health.missing.length
      : 0;
    const apiReady = Boolean(health?.writesEnabled);
    const powerValue = apiReady ? Math.max(12, 100 - missingCount * 25) : 18;
    const ramValue = apiReady ? 42 : 78;

    if (powerText && powerBar) {
      powerText.textContent = apiReady ? "جاهز" : "ناقص";
      powerText.className = apiReady
        ? "font-bold text-emerald-400"
        : "font-bold text-amber-400";
      powerBar.style.width = `${powerValue}%`;
      powerBar.className = apiReady
        ? "bg-emerald-500 h-full transition-all duration-1000"
        : "bg-amber-500 h-full transition-all duration-1000";
    }

    if (ramText && ramBar) {
      ramText.textContent = `${ramValue}%`;
      ramBar.style.width = `${ramValue}%`;
    }
  }

  function updateStats() {
    const usersEl = document.getElementById("stat-users");
    const keysEl = document.getElementById("stat-keys");
    const postsEl = document.getElementById("stat-posts");
    const auditEl = document.getElementById("stat-audit");

    if (usersEl) usersEl.textContent = String(usersData.length);
    if (keysEl) {
      keysEl.textContent = String(
        keysData.filter((key) => key.status === "Active").length,
      );
    }
    if (postsEl) postsEl.textContent = String(postsCount);
    if (auditEl) auditEl.textContent = String(auditLogs.length);
  }

  function showLogin() {
    document.getElementById("login-overlay")?.classList.remove("hidden");
    document.getElementById("admin-shell")?.classList.add("hidden");
  }

  function showDashboard() {
    document.getElementById("login-overlay")?.classList.add("hidden");
    document.getElementById("admin-shell")?.classList.remove("hidden");
  }

  function updateAdminProfile() {
    if (!currentAdmin) return;
    const nameEl = document.getElementById("admin-name");
    const roleEl = document.getElementById("admin-role");
    const avatarEl = document.getElementById("admin-avatar");
    if (nameEl) nameEl.textContent = currentAdmin.name || currentAdmin.email;
    if (roleEl) {
      roleEl.textContent =
        currentAdmin.role === "admin" ? "المطور الأساسي (أدمن)" : "مشرف";
    }
    if (avatarEl) {
      const initial = (currentAdmin.name || currentAdmin.email || "A")
        .trim()
        .charAt(0)
        .toUpperCase();
      avatarEl.textContent = initial;
      avatarEl.className =
        "w-11 h-11 rounded-full object-cover border border-zinc-700 bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-200";
    }
  }

  function loadKeysFromStorage() {
    try {
      const raw = localStorage.getItem(KEYS_STORAGE_KEY);
      keysData = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(keysData)) keysData = [];
    } catch {
      keysData = [];
    }
  }

  function saveKeysToStorage() {
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keysData));
  }

  function renderKeys() {
    const tableBody = document.getElementById("keys-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (keysData.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="py-8 px-6 text-center text-xs text-zinc-500">
            لا توجد مفاتيح محفوظة محلياً. أنشئ مفتاحاً جديداً من النموذج أعلاه.
          </td>
        </tr>
      `;
    } else {
      keysData.forEach((key, index) => {
        const isExpired = key.status === "Expired";
        const tr = document.createElement("tr");
        tr.className = "hover:bg-zinc-900/50 transition-colors";
        tr.innerHTML = `
          <td class="py-4 px-6 font-mono font-medium text-xs text-zinc-300">
            <div class="flex items-center gap-2">
              <span class="inline-block p-1 bg-zinc-950 border border-zinc-800 rounded">🔑</span>
              <span>${escapeHtml(key.id)}</span>
            </div>
          </td>
          <td class="py-4 px-6 text-xs text-zinc-300 font-semibold">${escapeHtml(key.label)}</td>
          <td class="py-4 px-6 text-xs text-indigo-400 font-medium">${escapeHtml(key.role)}</td>
          <td class="py-4 px-6 text-xs text-zinc-400 font-mono">${escapeHtml(key.expiry)}</td>
          <td class="py-4 px-6 text-center">
            <span class="px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${isExpired ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}">
              <span class="w-1.5 h-1.5 rounded-full ${isExpired ? "bg-red-500" : "bg-emerald-500"}"></span>
              ${isExpired ? "منتهي الصلاحية" : "نشط وفعال"}
            </span>
          </td>
          <td class="py-4 px-6 text-center">
            <div class="flex items-center justify-center gap-2">
              <button type="button" data-copy-key="${escapeHtml(key.id)}" class="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all" title="نسخ المفتاح">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              </button>
              <button type="button" data-toggle-key="${index}" class="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all" title="تغيير الحالة">
                <i data-lucide="power" class="w-3.5 h-3.5"></i>
              </button>
              <button type="button" data-delete-key="${index}" class="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-red-950 hover:text-red-400 text-zinc-400 rounded-lg transition-all" title="حذف">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }

    const counter = document.getElementById("keys-counter");
    if (counter) {
      counter.textContent = `العدد الإجمالي: ${keysData.length} مفاتيح (محلي)`;
    }
    updateStats();
    if (window.lucide) window.lucide.createIcons();
  }

  function formatCardTierLabel(cardTier) {
    switch (cardTier) {
      case "gold":
        return "ذهبية";
      case "platinum":
        return "بلاتينيوم";
      default:
        return "كلاسيك";
    }
  }

  async function maybeMigrateCardTiers() {
    if (cardTierMigrationAttempted) {
      return;
    }

    cardTierMigrationAttempted = true;

    try {
      const payload = await adminFetch("/api/admin/users/migrate-card-tiers", {
        method: "POST",
      });
      if (payload?.migrated > 0) {
        showToast(
          `تم تطبيق بطاقة كلاسيك على ${payload.migrated} حساب.`,
          "success",
        );
      }
    } catch {
      // ignore migration failures on first load
    }
  }

  function renderUsers(filteredData) {
    const tableBody = document.getElementById("users-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    const dataToRender = filteredData || usersData;

    if (dataToRender.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 px-6 text-center text-xs text-zinc-500">
            لا يوجد مستخدمون مطابقون للبحث الحالي.
          </td>
        </tr>
      `;
      updateStats();
      return;
    }

    dataToRender.forEach((user) => {
      const isBlocked = user.accountStatus === "suspended";
      const displayVarId = user.displayVarId || user.varId || "";
      const tr = document.createElement("tr");
      tr.className = "hover:bg-zinc-900/50 transition-colors";
      tr.innerHTML = `
        <td class="py-4 px-6">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-750 flex items-center justify-center font-bold text-zinc-300 overflow-hidden">
              ${
                user.avatarUrl
                  ? `<img src="${escapeHtml(user.avatarUrl)}" alt="" class="w-full h-full object-cover" />`
                  : escapeHtml((user.displayName || "V").charAt(0))
              }
            </div>
            <div>
              <h5 class="text-xs font-bold text-white flex items-center gap-1">
                ${escapeHtml(user.displayName || "بدون اسم")}
                ${user.verified ? '<span class="text-[9px] text-emerald-400">✓</span>' : ""}
              </h5>
              <span class="text-[10px] text-zinc-500">@${escapeHtml(user.username || "—")}</span>
            </div>
          </div>
        </td>
        <td class="py-4 px-6 font-mono text-xs text-zinc-400" dir="ltr">${escapeHtml(displayVarId || user.id)}</td>
        <td class="py-4 px-6 text-xs font-semibold text-zinc-300">${escapeHtml(formatRoleLabel(user.role))}</td>
        <td class="py-4 px-6">
          <select
            data-card-tier="${escapeHtml(displayVarId)}"
            class="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200"
          >
            <option value="classic" ${user.cardTier === "classic" || !user.cardTier ? "selected" : ""}>كلاسيك</option>
            <option value="gold" ${user.cardTier === "gold" ? "selected" : ""}>ذهبية</option>
            <option value="platinum" ${user.cardTier === "platinum" ? "selected" : ""}>بلاتينيوم</option>
          </select>
        </td>
        <td class="py-4 px-6 text-xs text-zinc-500">${escapeHtml(formatDateLabel(user.createdAt))}</td>
        <td class="py-4 px-6 text-center">
          <span class="px-2.5 py-1 rounded-md text-[10px] font-extrabold ${isBlocked ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}">
            ${escapeHtml(formatStatusLabel(user.accountStatus))}
          </span>
        </td>
        <td class="py-4 px-6 text-center">
          <div class="flex items-center justify-center gap-2 flex-wrap">
            <button type="button" data-toggle-status="${escapeHtml(displayVarId)}" class="text-xs ${isBlocked ? "text-emerald-400 hover:underline" : "text-red-400 hover:underline"} font-bold transition-all">
              ${isBlocked ? "إلغاء الحظر" : "حظر"}
            </button>
            <span class="text-zinc-700">|</span>
            <button type="button" data-change-role="${escapeHtml(displayVarId)}" class="text-xs text-zinc-400 hover:text-white transition-all">
              ${user.role === "admin" ? "تخفيض" : "ترقية"}
            </button>
            <span class="text-zinc-700">|</span>
            <button type="button" data-delete-user="${escapeHtml(displayVarId)}" class="text-xs text-red-400 hover:underline font-bold transition-all">
              حذف
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    updateStats();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderLogs() {
    const feed = document.getElementById("log-feed");
    if (!feed) return;
    feed.innerHTML = "";

    if (auditLogs.length === 0) {
      feed.innerHTML = `
        <div class="p-4 text-center text-xs text-zinc-500">
          لا توجد سجلات عمليات بعد.
        </div>
      `;
      return;
    }

    auditLogs.forEach((log) => {
      const tone = auditTone(log.action);
      let badgeClass = "bg-zinc-800 text-zinc-400";
      if (tone === "success") {
        badgeClass =
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      } else if (tone === "warning") {
        badgeClass =
          "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      } else if (tone === "danger") {
        badgeClass = "bg-red-500/10 text-red-400 border border-red-500/20";
      }

      const label = AUDIT_LABELS[log.action] || log.action;
      const text = log.details
        ? `${label}: ${log.details} (${log.targetId || "—"})`
        : `${label} (${log.targetId || "—"})`;

      const div = document.createElement("div");
      div.className =
        "p-3 bg-zinc-950 rounded-xl border border-zinc-900 flex items-start justify-between gap-3 text-xs";
      div.innerHTML = `
        <div class="flex items-start gap-2.5">
          <span class="px-2 py-0.5 rounded text-[9px] font-bold font-mono ${badgeClass}">${escapeHtml(formatAuditTime(log.createdAt))}</span>
          <div>
            <p class="text-zinc-300 text-right leading-normal">${escapeHtml(text)}</p>
            <p class="text-[10px] text-zinc-500 mt-1">${escapeHtml(log.adminEmail || "—")}</p>
          </div>
        </div>
      `;
      feed.appendChild(div);
    });
  }

  async function loadDashboardData() {
    const [health, usersPayload, auditPayload, postsPayload] =
      await Promise.all([
        adminFetch("/api/admin/health").catch(() => null),
        adminFetch("/api/admin/users/list?limit=100").catch(() => ({
          users: [],
          total: 0,
        })),
        adminFetch("/api/admin/audit/list").catch(() => ({ logs: [] })),
        adminFetch("/api/admin/posts/list").catch(() => ({ posts: [] })),
      ]);

    usersData = Array.isArray(usersPayload.users) ? usersPayload.users : [];
    auditLogs = Array.isArray(auditPayload.logs) ? auditPayload.logs : [];
    postsCount = Array.isArray(postsPayload.posts)
      ? postsPayload.posts.length
      : 0;

    await maybeMigrateCardTiers();

    const connected = Boolean(health?.writesEnabled);
    setServerStatus(
      connected,
      connected ? "الخادم متصل ونشط" : "الخادم متصل — API Key ناقص",
    );
    setHealthBars(health);
    renderUsers();
    renderLogs();
    updateStats();
  }

  async function refreshUsers() {
    const searchInput = document.getElementById("user-search-input");
    const query = searchInput?.value.trim() || "";
    const payload = await adminFetch(
      `/api/admin/users/list?limit=100${query ? `&search=${encodeURIComponent(query)}` : ""}`,
    );
    usersData = Array.isArray(payload.users) ? payload.users : [];
    renderUsers();
  }

  async function refreshAuditLogs() {
    const payload = await adminFetch("/api/admin/audit/list");
    auditLogs = Array.isArray(payload.logs) ? payload.logs : [];
    renderLogs();
    updateStats();
  }

  function appwriteRestHeaders(includeSession) {
    const headers = {
      "Content-Type": "application/json",
      "X-Appwrite-Project": APPWRITE_PROJECT_ID,
    };

    if (includeSession) {
      const token = getSessionSecret();
      if (token) {
        if (isJwtToken(token)) {
          headers["X-Appwrite-JWT"] = token;
        } else {
          headers["X-Appwrite-Session"] = token;
        }
      }
    }

    return headers;
  }

  async function readAppwriteError(response) {
    const payload = await response.json().catch(() => ({}));
    const message =
      typeof payload.message === "string" && payload.message.trim()
        ? payload.message.trim()
        : "تعذر تنفيذ طلب Appwrite.";
    const error = new Error(message);
    error.type = payload.type;
    return error;
  }

  function isActiveSessionError(error) {
    if (!error || typeof error !== "object") return false;
    const message =
      typeof error.message === "string" ? error.message.toLowerCase() : "";
    return (
      error.type === "user_session_already_exists" ||
      message.includes("session is active") ||
      message.includes("creation of a session is prohibited")
    );
  }

  async function clearAppwriteSessionsViaRest() {
    const headers = appwriteRestHeaders(true);

    await fetch(`${APPWRITE_ENDPOINT}/account/sessions/current`, {
      method: "DELETE",
      headers,
      credentials: "include",
    }).catch(() => undefined);

    await fetch(`${APPWRITE_ENDPOINT}/account/sessions`, {
      method: "DELETE",
      headers,
      credentials: "include",
    }).catch(() => undefined);
  }

  async function createAdminSessionViaRest(email, password) {
    const headers = appwriteRestHeaders(false);

    await fetch(`${APPWRITE_ENDPOINT}/account/sessions`, {
      method: "DELETE",
      headers,
      credentials: "include",
    }).catch(() => undefined);

    const requestSession = () =>
      fetch(`${APPWRITE_ENDPOINT}/account/sessions/email`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

    let response = await requestSession();

    if (!response.ok) {
      const firstError = await readAppwriteError(response);

      if (isActiveSessionError(firstError)) {
        await clearAppwriteSessionsViaRest();
        response = await requestSession();
      } else {
        throw firstError;
      }
    }

    if (!response.ok) {
      throw await readAppwriteError(response);
    }

    return response.json();
  }

  function readSessionSecret(session) {
    return typeof session?.secret === "string" ? session.secret.trim() : "";
  }

  async function createAdminJwtViaRest(sessionSecret) {
    const headers = appwriteRestHeaders(false);
    if (sessionSecret) {
      headers["X-Appwrite-Session"] = sessionSecret;
    }

    const response = await fetch(`${APPWRITE_ENDPOINT}/account/jwt`, {
      method: "POST",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      throw await readAppwriteError(response);
    }

    const payload = await response.json();
    return typeof payload.jwt === "string" ? payload.jwt.trim() : "";
  }

  async function resolveAdminAuthToken(session) {
    const sessionSecret = readSessionSecret(session);
    if (sessionSecret) {
      return sessionSecret;
    }

    return createAdminJwtViaRest("");
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    if (isBusy) return;

    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const errorEl = document.getElementById("login-error");
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";

    if (!email || !password) {
      if (errorEl) errorEl.textContent = "أدخل البريد وكلمة المرور.";
      return;
    }

    isBusy = true;
    if (errorEl) errorEl.textContent = "";

    try {
      const loginPayload = await adminFetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const authToken =
        (typeof loginPayload.token === "string" ? loginPayload.token.trim() : "") ||
        (typeof loginPayload.jwt === "string" ? loginPayload.jwt.trim() : "");

      if (!authToken) {
        throw new Error(
          "تعذر إنشاء جلسة Appwrite. حدّث الصفحة وحاول مرة أخرى.",
        );
      }

      setSessionSecret(authToken);
      currentAdmin = loginPayload.admin || null;
      showDashboard();
      updateAdminProfile();
      await loadDashboardData();
      showToast("تم تسجيل الدخول بنجاح.", "success");
    } catch (error) {
      setSessionSecret("");
      if (errorEl) {
        errorEl.textContent =
          error instanceof Error ? error.message : "تعذر تسجيل الدخول.";
      }
    } finally {
      isBusy = false;
    }
  }

  async function handleLogout() {
    try {
      await clearAppwriteSessionsViaRest();
    } catch {
      // ignore
    }
    setSessionSecret("");
    currentAdmin = null;
    usersData = [];
    auditLogs = [];
    showLogin();
    showToast("تم تسجيل الخروج.", "info");
  }

  async function restoreSession() {
    const secret = getSessionSecret();
    if (!secret) {
      showLogin();
      return;
    }

    try {
      const mePayload = await adminFetch("/api/admin/me");
      currentAdmin = mePayload.admin;
      showDashboard();
      updateAdminProfile();
      loadKeysFromStorage();
      renderKeys();
      restoreUiMode();
      await loadDashboardData();
    } catch {
      setSessionSecret("");
      showLogin();
    }
  }

  function restoreUiMode() {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    if (saved === "TikTok-Mode" || saved === "X-Mode") {
      setGlobalMode(saved, false);
    }
  }

  function setGlobalMode(modeName, persist) {
    currentGlobalMode = modeName;
    if (persist !== false) {
      localStorage.setItem(MODE_STORAGE_KEY, modeName);
    }

    const btnX = document.getElementById("btn-xmode");
    const btnTT = document.getElementById("btn-ttmode");
    const headline = document.getElementById("current-mode-headline");
    const desc = document.getElementById("current-mode-desc");
    const glowDecor = document.getElementById("mode-glow-decor");

    if (modeName === "X-Mode") {
      if (btnX) {
        btnX.className =
          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 bg-blue-600 text-white shadow-lg shadow-blue-500/20 glow-xmode";
      }
      if (btnTT) {
        btnTT.className =
          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 text-zinc-400 hover:text-zinc-200";
      }
      if (headline) {
        headline.textContent = "X-MODE ACTIVE";
        headline.className =
          "text-2xl font-black mt-2 text-blue-400 transition-colors";
      }
      if (desc) {
        desc.textContent =
          "مخصصة للمطورين والتجارب السريعة مع وصول غير محدود للتحكم بالواجهة الرسومية.";
      }
      if (glowDecor) {
        glowDecor.className =
          "absolute -right-24 -top-24 w-48 h-48 rounded-full blur-3xl transition-all duration-500 opacity-20 bg-blue-500";
      }
      if (persist !== false) {
        showToast("تم تحويل الواجهة إلى X-Mode", "info");
      }
    } else {
      if (btnTT) {
        btnTT.className =
          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 bg-pink-600 text-white shadow-lg shadow-pink-500/20 glow-tiktok";
      }
      if (btnX) {
        btnX.className =
          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 text-zinc-400 hover:text-zinc-200";
      }
      if (headline) {
        headline.textContent = "TIKTOK-MODE ACTIVE";
        headline.className =
          "text-2xl font-black mt-2 text-pink-500 transition-colors";
      }
      if (desc) {
        desc.textContent =
          "وضع تفاعلي اجتماعي يحسن معالجة مقاطع الفيديو والرسوم المتحركة القصيرة بكفاءة.";
      }
      if (glowDecor) {
        glowDecor.className =
          "absolute -right-24 -top-24 w-48 h-48 rounded-full blur-3xl transition-all duration-500 opacity-20 bg-pink-500";
      }
      if (persist !== false) {
        showToast("تم تحويل الواجهة إلى TikTok-Mode", "success");
      }
    }
  }

  function generateNewKey() {
    const labelInput = document.getElementById("key-label");
    const roleSelect = document.getElementById("key-role");
    const expirySelect = document.getElementById("key-expiry");
    const label = labelInput?.value.trim() || "";
    const role = roleSelect?.value || "";
    const expiry = expirySelect?.value || "Never";

    if (!label) {
      showToast("أدخل اسم أو بادئة للمفتاح.", "warning");
      return;
    }

    let finalExpiry = expiry;
    if (expiry === "Custom Date") {
      const customDate = document.getElementById("custom-date-picker")?.value;
      if (!customDate) {
        showToast("حدد تاريخ انتهاء مخصص.", "warning");
        return;
      }
      finalExpiry = `مخصص: ${customDate}`;
    }

    const characters = "ABCDEF0123456789";
    const makeSegment = (length) => {
      let result = "";
      for (let i = 0; i < length; i += 1) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length),
        );
      }
      return result;
    };

    keysData.unshift({
      id: `KEY-${makeSegment(4)}-${makeSegment(4)}-${makeSegment(4)}`,
      label,
      role,
      expiry: finalExpiry,
      status: "Active",
      created: new Date().toISOString().split("T")[0],
    });
    saveKeysToStorage();
    renderKeys();
    if (labelInput) labelInput.value = "";
    showToast("تم حفظ المفتاح محلياً.", "success");
  }

  function toggleCustomDatePicker() {
    const select = document.getElementById("key-expiry");
    const container = document.getElementById("custom-date-container");
    if (!select || !container) return;
    container.classList.toggle("hidden", select.value !== "Custom Date");
  }

  function resetKeyForm() {
    const labelInput = document.getElementById("key-label");
    const roleSelect = document.getElementById("key-role");
    const expirySelect = document.getElementById("key-expiry");
    const customContainer = document.getElementById("custom-date-container");
    if (labelInput) labelInput.value = "";
    if (roleSelect) roleSelect.value = "مسؤول رئيسي (Super Admin)";
    if (expirySelect) expirySelect.value = "Never";
    customContainer?.classList.add("hidden");
    showToast("تم تصفير نموذج المفاتيح.", "info");
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`تم النسخ: ${text}`, "success");
    } catch {
      showToast("تعذر النسخ.", "warning");
    }
  }

  function filterUsers() {
    const query = document
      .getElementById("user-search-input")
      ?.value.trim()
      .toLowerCase();
    if (!query) {
      renderUsers();
      return;
    }
    const filtered = usersData.filter(
      (user) =>
        (user.displayName || "").toLowerCase().includes(query) ||
        (user.username || "").toLowerCase().includes(query) ||
        (user.displayVarId || "").toLowerCase().includes(query) ||
        (user.varId || "").toLowerCase().includes(query),
    );
    renderUsers(filtered);
  }

  function filterUsersByRole(role) {
    if (role === "All") {
      renderUsers();
      return;
    }
    const mappedRole = role === "أدمن" ? "admin" : "member";
    renderUsers(usersData.filter((user) => user.role === mappedRole));
  }

  async function changeUserCardTier(displayVarId, cardTier) {
    if (!displayVarId || !cardTier || isBusy) return;

    isBusy = true;
    try {
      await adminFetch("/api/admin/users/card-tier", {
        method: "POST",
        body: JSON.stringify({ displayVarId, cardTier }),
      });
      showToast(`تم تعيين بطاقة ${formatCardTierLabel(cardTier)}.`, "success");
      await refreshUsers();
      await refreshAuditLogs();
    } catch (error) {
      showToast(error?.message || "تعذر تعيين البطاقة.", "warning");
    } finally {
      isBusy = false;
    }
  }

  async function toggleUserStatus(displayVarId) {
    if (!displayVarId || isBusy) return;
    const user = usersData.find(
      (item) => item.displayVarId === displayVarId || item.varId === displayVarId,
    );
    if (!user) return;

    const nextStatus =
      user.accountStatus === "suspended" ? "active" : "suspended";
    isBusy = true;
    try {
      await adminFetch("/api/admin/users/status", {
        method: "POST",
        body: JSON.stringify({
          displayVarId: user.displayVarId || displayVarId,
          status: nextStatus,
        }),
      });
      showToast(
        nextStatus === "suspended" ? "تم إيقاف الحساب." : "تم تفعيل الحساب.",
        nextStatus === "suspended" ? "warning" : "success",
      );
      await refreshUsers();
      await refreshAuditLogs();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر تحديث الحالة.",
        "danger",
      );
    } finally {
      isBusy = false;
    }
  }

  async function changeUserRole(displayVarId) {
    if (!displayVarId || isBusy) return;
    const user = usersData.find(
      (item) => item.displayVarId === displayVarId || item.varId === displayVarId,
    );
    if (!user) return;

    const nextRole = user.role === "admin" ? "member" : "admin";
    isBusy = true;
    try {
      await adminFetch("/api/admin/users/role", {
        method: "POST",
        body: JSON.stringify({
          displayVarId: user.displayVarId || displayVarId,
          role: nextRole,
        }),
      });
      showToast(
        nextRole === "admin" ? "تمت الترقية إلى أدمن." : "تم التخفيض إلى عضو.",
        "success",
      );
      await refreshUsers();
      await refreshAuditLogs();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر تغيير الرتبة.",
        "danger",
      );
    } finally {
      isBusy = false;
    }
  }

  async function deleteUser(displayVarId) {
    if (!displayVarId || isBusy) return;
    const user = usersData.find(
      (item) => item.displayVarId === displayVarId || item.varId === displayVarId,
    );
    if (!user) return;

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف حساب ${user.displayName || displayVarId}؟ لا يمكن التراجع.`,
    );
    if (!confirmed) return;

    isBusy = true;
    try {
      await adminFetch("/api/admin/users/delete", {
        method: "POST",
        body: JSON.stringify({
          displayVarId: user.displayVarId || displayVarId,
        }),
      });
      showToast("تم حذف الحساب.", "success");
      await refreshUsers();
      await refreshAuditLogs();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر حذف الحساب.",
        "danger",
      );
    } finally {
      isBusy = false;
    }
  }

  function switchTab(tabId, event) {
    const targetId =
      tabId === "dashboard"
        ? "dashboard-section"
        : tabId === "keys-panel"
          ? "keys-panel"
          : tabId === "users-panel"
            ? "users-panel"
            : "mode-panel";
    document.getElementById(targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.className =
        "nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100 transition-all duration-200";
    });

    if (event?.currentTarget) {
      event.currentTarget.className =
        "nav-item active flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-800/80 text-white transition-all duration-200";
    }
  }

  function bindEvents() {
    document
      .getElementById("login-form")
      ?.addEventListener("submit", handleLoginSubmit);
    document
      .getElementById("logout-btn")
      ?.addEventListener("click", handleLogout);
    document
      .getElementById("refresh-logs-btn")
      ?.addEventListener("click", () => {
        void refreshAuditLogs();
        showToast("تم تحديث سجل العمليات.", "info");
      });
    document
      .getElementById("refresh-dashboard-btn")
      ?.addEventListener("click", () => {
        void loadDashboardData();
        showToast("تم تحديث البيانات.", "info");
      });

    document.getElementById("keys-table-body")?.addEventListener("click", (event) => {
      const target = event.target.closest("[data-copy-key], [data-toggle-key], [data-delete-key]");
      if (!target) return;
      if (target.dataset.copyKey) {
        void copyToClipboard(target.dataset.copyKey);
        return;
      }
      if (target.dataset.toggleKey !== undefined) {
        const index = Number.parseInt(target.dataset.toggleKey, 10);
        if (!Number.isNaN(index) && keysData[index]) {
          keysData[index].status =
            keysData[index].status === "Active" ? "Expired" : "Active";
          saveKeysToStorage();
          renderKeys();
          showToast("تم تحديث حالة المفتاح المحلي.", "info");
        }
        return;
      }
      if (target.dataset.deleteKey !== undefined) {
        const index = Number.parseInt(target.dataset.deleteKey, 10);
        if (!Number.isNaN(index)) {
          keysData.splice(index, 1);
          saveKeysToStorage();
          renderKeys();
          showToast("تم حذف المفتاح المحلي.", "info");
        }
      }
    });

    document.getElementById("users-table-body")?.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      const displayVarId = target.dataset.cardTier;
      if (!displayVarId) return;
      void changeUserCardTier(displayVarId, target.value);
    });

    document.getElementById("users-table-body")?.addEventListener("click", (event) => {
      const target = event.target.closest(
        "[data-toggle-status], [data-change-role], [data-delete-user]",
      );
      if (!target) return;
      if (target.dataset.toggleStatus) {
        void toggleUserStatus(target.dataset.toggleStatus);
      } else if (target.dataset.changeRole) {
        void changeUserRole(target.dataset.changeRole);
      } else if (target.dataset.deleteUser) {
        void deleteUser(target.dataset.deleteUser);
      }
    });

    document.getElementById("user-search-input")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        void refreshUsers();
      }
    });

    document.getElementById("global-search-input")?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const query = event.target.value.trim();
      const userSearch = document.getElementById("user-search-input");
      if (userSearch) userSearch.value = query;
      void refreshUsers();
      document.getElementById("users-panel")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  window.generateNewKey = generateNewKey;
  window.toggleCustomDatePicker = toggleCustomDatePicker;
  window.resetKeyForm = resetKeyForm;
  window.filterUsers = filterUsers;
  window.filterUsersByRole = filterUsersByRole;
  window.setGlobalMode = (mode) => setGlobalMode(mode, true);
  window.switchTab = (tabId, event) => switchTab(tabId, event || window.event);
  window.showToast = showToast;
  window.handleLogout = handleLogout;
  window.clearLogs = () => {
    void refreshAuditLogs();
    showToast("تم تحديث السجل من الخادم.", "info");
  };

  window.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) window.lucide.createIcons();
    consumeSessionFromUrl();
    loadKeysFromStorage();
    bindEvents();
    void restoreSession();
  });
})();
