(function () {
  "use strict";

  const APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1";
  const APPWRITE_PROJECT_ID = "69ff62d9001bf7dcd933";
  const SESSION_STORAGE_KEY = "var-admin-session";

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
    update_user_account: "تحديث بيانات حساب",
    resolve_report: "حل بلاغ",
    dismiss_report: "تجاهل بلاغ",
    ai_flag_post: "وسم AI مشبوه",
    hide_comment: "إخفاء تعليق",
    unhide_comment: "إظهار تعليق",
    delete_comment: "حذف تعليق",
    create_admin_key: "إنشاء مفتاح أدمن",
    revoke_admin_key: "إلغاء مفتاح أدمن",
    activate_admin_key: "تفعيل مفتاح أدمن",
    delete_admin_key: "حذف مفتاح أدمن",
    update_app_settings: "تحديث إعدادات التطبيق",
  };

  let keysData = [];
  let usersData = [];
  let usersTotal = 0;
  let usersOffset = 0;
  const USERS_PAGE_SIZE = 25;
  const REPORTS_PAGE_SIZE = 15;

  const TAB_VIEWS = {
    dashboard: {
      viewId: "view-dashboard",
      title: "لوحة الإحصائيات",
      subtitle: "نظرة عامة على النظام والأعضاء",
    },
    "users-panel": {
      viewId: "view-users",
      title: "القسم 1 · الأعضاء",
      subtitle: "بحث · تعديل · توثيق · بطاقة · حظر",
    },
    "moderation-panel": {
      viewId: "view-moderation",
      title: "القسم 2 · الإشراف",
      subtitle: "بلاغات · محتوى مشبوه · مراجعة يدوية",
    },
    "keys-panel": {
      viewId: "view-keys",
      title: "القسم 4 · المفاتيح",
      subtitle: "توليد وإدارة مفاتيح الأدمن",
    },
    "mode-panel": {
      viewId: "view-mode",
      title: "القسم 4 · أوضاع التطبيق",
      subtitle: "X-Mode · TikTok-Mode · إعدادات الواجهة",
    },
  };

  let currentTab = "dashboard";
  let auditLogs = [];
  let postsCount = 0;
  let currentAdmin = null;
  let currentGlobalMode = "X-Mode";
  let appRuntimeSettings = {
    richIconsEnabled: true,
    gpuAccelerationEnabled: true,
    updatedAt: "",
  };
  let isBusy = false;
  let cardTierMigrationAttempted = false;
  let editingUserDisplayVarId = "";
  let editingUserVarId = "";
  let editingUserVerified = false;
  let editingUserPosts = [];
  let moderationReports = [];
  let moderationReportsTotal = 0;
  let moderationReportsOpenTotal = 0;
  let moderationReportsOffset = 0;
  let moderationReportsStatus = "open";
  let moderationFlaggedPosts = [];
  let moderationAllPosts = [];
  let moderationComments = [];
  let moderationCommentsSource = "none";
  let moderationReportsSource = "none";
  let activeReportDetail = null;

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

    let response;
    try {
      response = await fetch(`${resolveApiBase()}${path}`, {
        ...init,
        headers,
      });
    } catch {
      const hint =
        typeof window !== "undefined" &&
        window.location.port &&
        window.location.port !== "3000"
          ? "افتح http://localhost:3000/admin/ بعد تشغيل npm run admin:dev"
          : "شغّل السيرفر: npm run admin:dev (أو npm run dev:stack للتطبيق والأدمن معاً)";
      throw new Error(`تعذر الاتصال بخادم الأدمن. ${hint}`);
    }

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
        ? "text-[10px] text-emerald-400 flex items-center gap-1 shrink-0"
        : "text-[10px] text-red-400 flex items-center gap-1 shrink-0";
    }
    if (dot) {
      dot.className = connected
        ? "h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"
        : "h-1.5 w-1.5 rounded-full bg-red-500";
    }
  }

  function renderAppwriteHealth(health) {
    const grid = document.getElementById("appwrite-health-grid");
    const summary = document.getElementById("appwrite-health-summary");
    const collections = Array.isArray(health?.collections) ? health.collections : [];

    if (summary) {
      if (!health) {
        summary.textContent = "تعذر الفحص";
        summary.className =
          "text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300";
      } else if (health.ok) {
        summary.textContent = "جاهز للعمل";
        summary.className =
          "text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300";
      } else if (health.writesEnabled) {
        summary.textContent = "جزئي — راجع التفاصيل";
        summary.className =
          "text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300";
      } else {
        summary.textContent = "API Key أو Database ناقص";
        summary.className =
          "text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300";
      }
    }

    if (!grid) return;

    if (!collections.length) {
      grid.innerHTML =
        '<p class="text-xs text-zinc-500 col-span-full text-center py-4">تعذر قراءة حالة Appwrite.</p>';
      return;
    }

    const errorLabels = {
      MISSING_API_KEY: "API Key ناقص",
      MISSING_DATABASE: "Database ناقص",
      MISSING_COLLECTION_ID: "Collection ID ناقص",
      COLLECTION_NOT_FOUND: "Collection غير موجود",
      READ_FAILED: "تعذر القراءة",
    };

    grid.innerHTML = collections
      .map((item) => {
        const ok = Boolean(item.ok);
        const total =
          typeof item.total === "number" && Number.isFinite(item.total)
            ? item.total
            : 0;
        const errorKey =
          typeof item.error === "string" ? item.error : "READ_FAILED";
        const errorLabel = errorLabels[errorKey] || "خطأ";

        return `
          <div class="rounded-xl border ${ok ? "border-emerald-500/20 bg-emerald-950/10" : "border-red-500/20 bg-red-950/10"} p-4">
            <div class="flex items-center justify-between gap-2">
              <p class="text-xs font-bold text-white">${escapeHtml(item.label || item.key || "—")}</p>
              <span class="text-[10px] font-bold ${ok ? "text-emerald-300" : "text-red-300"}">${ok ? "✓" : "✕"}</span>
            </div>
            <p class="text-[10px] text-zinc-500 mt-1 font-mono truncate" dir="ltr">${escapeHtml(item.collectionId || "—")}</p>
            <p class="text-[11px] mt-2 ${ok ? "text-emerald-300" : "text-red-300"}">
              ${ok ? `${total} سجل` : errorLabel}
            </p>
          </div>
        `;
      })
      .join("");
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

    if (usersEl) usersEl.textContent = String(usersTotal || usersData.length);
    if (keysEl) {
      keysEl.textContent = String(
        keysData.filter((key) => isAdminKeyActive(key.status)).length,
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
    const nameEl =
      document.getElementById("admin-name") ||
      document.getElementById("drawer-admin-name");
    const roleEl =
      document.getElementById("admin-role") ||
      document.getElementById("drawer-admin-role");
    const avatarEl =
      document.getElementById("admin-avatar") ||
      document.getElementById("drawer-admin-avatar");
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

  function formatAdminKeyStatusLabel(status) {
    if (status === "revoked") return "ملغى";
    if (status === "expired") return "منتهي الصلاحية";
    return "نشط وفعال";
  }

  function isAdminKeyActive(status) {
    return status === "active";
  }

  async function refreshAdminKeys(showErrors) {
    try {
      const payload = await adminFetch("/api/admin/keys/list");
      keysData = Array.isArray(payload.keys) ? payload.keys : [];
      renderKeys();
    } catch (error) {
      keysData = [];
      renderKeys();
      if (showErrors) {
        showToast(
          error instanceof Error ? error.message : "تعذر تحميل مفاتيح الأدمن.",
          "warning",
        );
      }
    }
  }

  function renderKeys() {
    const tableBody = document.getElementById("keys-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (keysData.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="py-8 px-6 text-center text-xs text-zinc-500">
            لا توجد مفاتيح في Appwrite. أنشئ مفتاحاً جديداً من النموذج أعلاه.
          </td>
        </tr>
      `;
    } else {
      keysData.forEach((key) => {
        const status = key.status || "active";
        const isActive = isAdminKeyActive(status);
        const isExpired = status === "expired";
        const statusClass = isActive
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : isExpired
            ? "bg-red-500/10 text-red-400 border border-red-500/20"
            : "bg-zinc-800 text-zinc-400 border border-zinc-700";
        const dotClass = isActive
          ? "bg-emerald-500"
          : isExpired
            ? "bg-red-500"
            : "bg-zinc-500";
        const tr = document.createElement("tr");
        tr.className = "hover:bg-zinc-900/50 transition-colors";
        tr.innerHTML = `
          <td class="py-4 px-6 font-mono font-medium text-xs text-zinc-300">
            <div class="flex items-center gap-2">
              <span class="inline-block p-1 bg-zinc-950 border border-zinc-800 rounded">🔑</span>
              <span dir="ltr">${escapeHtml(key.keyPreview || "KEY-****")}</span>
            </div>
          </td>
          <td class="py-4 px-6 text-xs text-zinc-300 font-semibold">${escapeHtml(key.label || "—")}</td>
          <td class="py-4 px-6 text-xs text-indigo-400 font-medium">${escapeHtml(key.roleLabel || key.role || "—")}</td>
          <td class="py-4 px-6 text-xs text-zinc-400 font-mono">${escapeHtml(key.expiryLabel || "—")}</td>
          <td class="py-4 px-6 text-center">
            <span class="px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${statusClass}">
              <span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span>
              ${escapeHtml(formatAdminKeyStatusLabel(status))}
            </span>
          </td>
          <td class="py-4 px-6 text-center">
            <div class="flex items-center justify-center gap-2">
              <button type="button" data-copy-key="${escapeHtml(key.keyPreview || "")}" class="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all" title="نسخ المعاينة">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              </button>
              <button type="button" data-toggle-key="${escapeHtml(key.id)}" data-key-status="${escapeHtml(status)}" class="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all ${isExpired ? "opacity-40 pointer-events-none" : ""}" title="تفعيل / إلغاء">
                <i data-lucide="power" class="w-3.5 h-3.5"></i>
              </button>
              <button type="button" data-delete-key="${escapeHtml(key.id)}" data-key-preview="${escapeHtml(key.keyPreview || "")}" class="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-red-950 hover:text-red-400 text-zinc-400 rounded-lg transition-all" title="حذف">
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
      counter.textContent = `العدد الإجمالي: ${keysData.length} مفاتيح (Appwrite)`;
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

  function normalizeCardTier(cardTier) {
    if (cardTier === "gold" || cardTier === "platinum") {
      return cardTier;
    }

    return "classic";
  }

  function getCardTierSwatchStyle(cardTier) {
    switch (normalizeCardTier(cardTier)) {
      case "gold":
        return "background:linear-gradient(145deg,#EED8A7 0%,#D5B370 45%,#C29F5C 100%);box-shadow:0 0 10px rgba(213,179,112,0.45);";
      case "platinum":
        return "background:linear-gradient(145deg,#F4F6FA 0%,#D8DCE3 45%,#B8BEC8 100%);box-shadow:0 0 10px rgba(184,190,200,0.35);";
      default:
        return "background:linear-gradient(145deg,#151B3D 0%,#121A3A 55%,#0B0F2A 100%);box-shadow:0 0 10px rgba(18,26,58,0.55);";
    }
  }

  function updateCardTierSwatch(selectEl) {
    const swatch = selectEl
      ?.closest("[data-card-tier-cell]")
      ?.querySelector("[data-tier-swatch]");
    if (!(swatch instanceof HTMLElement) || !(selectEl instanceof HTMLSelectElement)) {
      return;
    }

    const tier = normalizeCardTier(selectEl.value);
    swatch.style.cssText = getCardTierSwatchStyle(tier);
    swatch.dataset.tier = tier;
    swatch.title = formatCardTierLabel(tier);
    swatch.setAttribute("aria-label", formatCardTierLabel(tier));
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
      const filters = getUserFilterState();
      const hasLocalFilter =
        filters.query ||
        filters.role !== "All" ||
        filters.status !== "all" ||
        filters.verified !== "all";
      const message =
        usersTotal === 0 && !hasLocalFilter
          ? "لا يوجد مستخدمون. تأكد من APPWRITE_API_KEY و collection profiles في Appwrite."
          : "لا يوجد مستخدمون مطابقون للبحث أو الفلتر الحالي.";
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="py-8 px-6 text-center text-xs text-zinc-500">
            ${message}
          </td>
        </tr>
      `;
      updateStats();
      updateUsersPanelMeta(0);
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
        <td class="py-4 px-6">
          <div class="flex items-center gap-2" dir="ltr">
            <span class="font-mono text-xs text-zinc-400">${escapeHtml(displayVarId || user.id)}</span>
            ${
              displayVarId || user.id
                ? `<button
                    type="button"
                    data-copy-var-id="${escapeHtml(displayVarId || user.id)}"
                    class="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all shrink-0"
                    title="نسخ VAR ID"
                  >
                    <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                  </button>`
                : ""
            }
          </div>
        </td>
        <td class="py-4 px-6 text-xs font-semibold text-zinc-300">${escapeHtml(formatRoleLabel(user.role))}</td>
        <td class="py-4 px-6">
          <div class="flex items-center gap-2" data-card-tier-cell>
            <select
              data-card-tier="${escapeHtml(displayVarId)}"
              class="min-w-[92px] flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200"
            >
              <option value="classic" ${user.cardTier === "classic" || !user.cardTier ? "selected" : ""}>كلاسيك</option>
              <option value="gold" ${user.cardTier === "gold" ? "selected" : ""}>ذهبية</option>
              <option value="platinum" ${user.cardTier === "platinum" ? "selected" : ""}>بلاتينيوم</option>
            </select>
            <span
              data-tier-swatch
              data-tier="${escapeHtml(normalizeCardTier(user.cardTier))}"
              title="${escapeHtml(formatCardTierLabel(user.cardTier))}"
              aria-label="${escapeHtml(formatCardTierLabel(user.cardTier))}"
              class="inline-block w-2.5 h-6 shrink-0 rounded-[3px] border border-white/15"
              style="${getCardTierSwatchStyle(user.cardTier)}"
            ></span>
          </div>
        </td>
        <td class="py-4 px-6 text-xs text-zinc-500">${escapeHtml(formatDateLabel(user.createdAt))}</td>
        <td class="py-4 px-6 text-center">
          <span class="px-2.5 py-1 rounded-md text-[10px] font-extrabold ${isBlocked ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}">
            ${escapeHtml(formatStatusLabel(user.accountStatus))}
          </span>
        </td>
        <td class="py-4 px-6 text-center">
          <button
            type="button"
            data-toggle-verification="${escapeHtml(displayVarId)}"
            data-verified="${user.verified ? "1" : "0"}"
            class="px-2.5 py-1 rounded-md text-[10px] font-extrabold transition-all ${user.verified ? "bg-sky-500/10 text-sky-300 border border-sky-500/20 hover:bg-sky-500/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-sky-300"}"
            title="${user.verified ? "إلغاء التوثيق" : "منح توثيق"}"
          >
            ${user.verified ? "✓ موثّق" : "غير موثّق"}
          </button>
        </td>
        <td class="py-4 px-6 text-center">
          <div class="flex items-center justify-center gap-2 flex-wrap">
            <button type="button" data-edit-user="${escapeHtml(displayVarId)}" class="text-xs text-indigo-400 hover:underline font-bold transition-all">
              تعديل
            </button>
            <span class="text-zinc-700">|</span>
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
    updateUsersPanelMeta(dataToRender.length);
    if (window.lucide) window.lucide.createIcons();
  }

  function getUserFilterState() {
    const roleSelect = document.getElementById("user-role-filter");
    const statusSelect = document.getElementById("user-status-filter");
    const verifiedSelect = document.getElementById("user-verified-filter");
    const query =
      document.getElementById("user-search-input")?.value.trim().toLowerCase() ||
      "";

    return {
      role: roleSelect instanceof HTMLSelectElement ? roleSelect.value : "All",
      status:
        statusSelect instanceof HTMLSelectElement ? statusSelect.value : "all",
      verified:
        verifiedSelect instanceof HTMLSelectElement
          ? verifiedSelect.value
          : "all",
      query,
    };
  }

  function applyUserFilters() {
    const { role, status, verified, query } = getUserFilterState();
    let filtered = usersData;

    if (role !== "All") {
      const mappedRole = role === "أدمن" ? "admin" : "member";
      filtered = filtered.filter((user) => user.role === mappedRole);
    }

    if (status === "active") {
      filtered = filtered.filter((user) => user.accountStatus !== "suspended");
    } else if (status === "suspended") {
      filtered = filtered.filter((user) => user.accountStatus === "suspended");
    }

    if (verified === "verified") {
      filtered = filtered.filter((user) => user.verified);
    } else if (verified === "unverified") {
      filtered = filtered.filter((user) => !user.verified);
    }

    if (query) {
      filtered = filtered.filter(
        (user) =>
          (user.displayName || "").toLowerCase().includes(query) ||
          (user.username || "").toLowerCase().includes(query) ||
          (user.displayVarId || "").toLowerCase().includes(query) ||
          (user.varId || "").toLowerCase().includes(query),
      );
    }

    renderUsers(filtered);
  }

  function updateUsersPanelMeta(filteredCount) {
    const meta = document.getElementById("users-panel-meta");
    const navCount = document.getElementById("users-nav-count");
    if (navCount) navCount.textContent = String(usersTotal);

    if (!meta) return;

    const pages = Math.max(1, Math.ceil(usersTotal / USERS_PAGE_SIZE));
    const page = Math.floor(usersOffset / USERS_PAGE_SIZE) + 1;
    const start = usersTotal === 0 ? 0 : usersOffset + 1;
    const end = Math.min(usersOffset + usersData.length, usersTotal);

    let text = `صفحة ${page}/${pages} · ${start}–${end} من ${usersTotal} حساب`;
    if (
      typeof filteredCount === "number" &&
      filteredCount !== usersData.length
    ) {
      text += ` · ${filteredCount} مطابق للفلتر`;
    }
    meta.textContent = text;
  }

  function updateUsersPaginationUi() {
    const prevBtn = document.getElementById("users-prev-page");
    const nextBtn = document.getElementById("users-next-page");
    if (prevBtn instanceof HTMLButtonElement) {
      prevBtn.disabled = usersOffset <= 0;
    }
    if (nextBtn instanceof HTMLButtonElement) {
      nextBtn.disabled = usersOffset + USERS_PAGE_SIZE >= usersTotal;
    }
  }

  async function fetchUsersPage(options = {}) {
    const offset =
      typeof options.offset === "number" ? options.offset : usersOffset;
    const searchInput = document.getElementById("user-search-input");
    const query =
      typeof options.search === "string"
        ? options.search.trim()
        : searchInput?.value.trim() || "";

    const payload = await adminFetch(
      `/api/admin/users/list?limit=${USERS_PAGE_SIZE}&offset=${offset}${query ? `&search=${encodeURIComponent(query)}` : ""}`,
    );
    usersData = Array.isArray(payload.users) ? payload.users : [];
    usersTotal = Number.isFinite(payload.total) ? payload.total : usersData.length;
    usersOffset = offset;
    updateUsersPaginationUi();
    return usersData;
  }

  async function changeUsersPage(delta) {
    if (isBusy) return;
    const nextOffset = usersOffset + delta * USERS_PAGE_SIZE;
    if (nextOffset < 0 || nextOffset >= usersTotal) return;

    isBusy = true;
    try {
      await fetchUsersPage({ offset: nextOffset });
      applyUserFilters();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر تحميل المستخدمين.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
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
    const [health, usersPayload, auditPayload, postsPayload, keysPayload] =
      await Promise.all([
        adminFetch("/api/admin/health").catch(() => null),
        adminFetch(
          `/api/admin/users/list?limit=${USERS_PAGE_SIZE}&offset=0`,
        ).catch(() => ({
          users: [],
          total: 0,
        })),
        adminFetch("/api/admin/audit/list").catch(() => ({ logs: [] })),
        adminFetch("/api/admin/posts/list").catch(() => ({ posts: [] })),
        adminFetch("/api/admin/keys/list").catch(() => ({ keys: [] })),
      ]);

    usersData = Array.isArray(usersPayload.users) ? usersPayload.users : [];
    usersTotal = Number.isFinite(usersPayload.total)
      ? usersPayload.total
      : usersData.length;
    usersOffset = 0;
    auditLogs = Array.isArray(auditPayload.logs) ? auditPayload.logs : [];
    keysData = Array.isArray(keysPayload.keys) ? keysPayload.keys : [];
    postsCount = Number.isFinite(postsPayload.total)
      ? postsPayload.total
      : Array.isArray(postsPayload.posts)
        ? postsPayload.posts.length
        : 0;

    await maybeMigrateCardTiers();

    const connected = Boolean(health?.writesEnabled);
    const profilesReady = Array.isArray(health?.collections)
      ? health.collections.some((item) => item.key === "profiles" && item.ok)
      : false;
    setServerStatus(
      connected && profilesReady,
      connected
        ? profilesReady
          ? "Appwrite متصل"
          : "Appwrite — profiles غير جاهز"
        : "API Key ناقص",
    );
    renderAppwriteHealth(health);
    setHealthBars(health);
    applyUserFilters();
    renderLogs();
    updateStats();
    updateUsersPaginationUi();
    void loadModerationCenter(false);
  }

  function formatReportReason(reason) {
    const key = String(reason || "").trim().toLowerCase();
    const labels = {
      user_report: "بلاغ مستخدم",
      user_report_legacy: "بلاغ قديم",
      spam: "سبام",
      harassment: "تحرش",
      hate: "خطاب كراهية",
      violence: "عنف",
      nudity: "محتوى غير لائق",
      other: "أخرى",
    };
    return labels[key] || reason || "بلاغ";
  }

  function formatReportStatus(status) {
    const key = String(status || "").trim().toLowerCase();
    if (key === "resolved") return "تم الحل";
    if (key === "dismissed") return "متجاهل";
    if (key === "open") return "مفتوح";
    return status || "—";
  }

  function reportStatusClass(status) {
    const key = String(status || "").trim().toLowerCase();
    if (key === "resolved") {
      return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";
    }
    if (key === "dismissed") {
      return "bg-zinc-800 text-zinc-400 border border-zinc-700";
    }
    return "bg-red-500/10 text-red-300 border border-red-500/20";
  }

  async function fetchModerationReportsPage(options = {}) {
    const offset =
      typeof options.offset === "number"
        ? options.offset
        : moderationReportsOffset;
    const status =
      typeof options.status === "string"
        ? options.status
        : moderationReportsStatus;

    const payload = await adminFetch(
      `/api/admin/moderation/reports?status=${encodeURIComponent(status)}&limit=${REPORTS_PAGE_SIZE}&offset=${offset}`,
    );

    moderationReports = Array.isArray(payload.reports) ? payload.reports : [];
    moderationReportsTotal = Number.isFinite(payload.total)
      ? payload.total
      : moderationReports.length;
    moderationReportsOffset = offset;
    moderationReportsStatus = status;
    moderationReportsSource =
      typeof payload.source === "string" ? payload.source : "none";

    updateReportsPaginationUi();
    return moderationReports;
  }

  function updateReportsPanelMeta() {
    const meta = document.getElementById("reports-panel-meta");
    if (!meta) return;

    const pages = Math.max(1, Math.ceil(moderationReportsTotal / REPORTS_PAGE_SIZE));
    const page = Math.floor(moderationReportsOffset / REPORTS_PAGE_SIZE) + 1;
    const start =
      moderationReportsTotal === 0 ? 0 : moderationReportsOffset + 1;
    const end = Math.min(
      moderationReportsOffset + moderationReports.length,
      moderationReportsTotal,
    );

    meta.textContent = `صفحة ${page}/${pages} · ${start}–${end} من ${moderationReportsTotal} بلاغ · ${formatReportStatus(moderationReportsStatus)}`;
  }

  function updateReportsPaginationUi() {
    const prevBtn = document.getElementById("reports-prev-page");
    const nextBtn = document.getElementById("reports-next-page");
    if (prevBtn instanceof HTMLButtonElement) {
      prevBtn.disabled = moderationReportsOffset <= 0;
    }
    if (nextBtn instanceof HTMLButtonElement) {
      nextBtn.disabled =
        moderationReportsOffset + REPORTS_PAGE_SIZE >= moderationReportsTotal;
    }
  }

  async function changeReportsPage(delta) {
    if (isBusy) return;
    const nextOffset = moderationReportsOffset + delta * REPORTS_PAGE_SIZE;
    if (nextOffset < 0 || nextOffset >= moderationReportsTotal) return;

    isBusy = true;
    try {
      await fetchModerationReportsPage({ offset: nextOffset });
      renderModerationCenter();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر تحميل البلاغات.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
  }

  async function loadModerationCenter(showErrors) {
    try {
      const statusSelect = document.getElementById("reports-status-filter");
      if (statusSelect instanceof HTMLSelectElement) {
        statusSelect.value = moderationReportsStatus;
      }

      const [flaggedPayload, allPostsPayload, commentsPayload] =
        await Promise.all([
          adminFetch("/api/admin/moderation/flagged-posts?limit=50").catch(
            () => ({ posts: [], total: 0 }),
          ),
          adminFetch("/api/admin/posts/list?limit=50").catch(() => ({
            posts: [],
            total: 0,
          })),
          adminFetch("/api/admin/moderation/comments?limit=50").catch(() => ({
            comments: [],
            total: 0,
            source: "none",
          })),
        ]);

      const [reportsResult, openReportsResult] = await Promise.all([
        fetchModerationReportsPage({
          offset: moderationReportsOffset,
          status: moderationReportsStatus,
        }).catch(() => {
          moderationReports = [];
          moderationReportsTotal = 0;
          moderationReportsSource = "none";
        }),
        adminFetch("/api/admin/moderation/reports?status=open&limit=1").catch(
          () => ({ total: 0 }),
        ),
      ]);

      moderationReportsOpenTotal = Number.isFinite(openReportsResult?.total)
        ? openReportsResult.total
        : moderationReportsStatus === "open"
          ? moderationReportsTotal
          : 0;

      void reportsResult;

      moderationFlaggedPosts = Array.isArray(flaggedPayload.posts)
        ? flaggedPayload.posts
        : [];
      moderationAllPosts = Array.isArray(allPostsPayload.posts)
        ? allPostsPayload.posts
        : [];
      moderationComments = Array.isArray(commentsPayload.comments)
        ? commentsPayload.comments
        : [];
      moderationCommentsSource =
        typeof commentsPayload.source === "string"
          ? commentsPayload.source
          : "none";

      renderModerationCenter();
      void loadAiModerationSettings();
    } catch (error) {
      if (showErrors) {
        showToast(
          error instanceof Error ? error.message : "تعذر تحميل مركز الإشراف.",
          "warning",
        );
      }
    }
  }

  async function loadAiModerationSettings() {
    try {
      const payload = await adminFetch("/api/admin/moderation/ai-settings");
      const settings = payload.settings || {};

      const enabledEl = document.getElementById("ai-settings-enabled");
      const thresholdEl = document.getElementById("ai-settings-threshold");
      const autoHideEl = document.getElementById("ai-settings-auto-hide");
      const webhookEl = document.getElementById("ai-settings-webhook");
      const webhookUrlEl = document.getElementById("ai-webhook-url");
      const keywordsEl = document.getElementById("ai-keywords-preview");

      if (enabledEl) {
        enabledEl.textContent = settings.enabled ? "مفعّل" : "معطّل";
        enabledEl.className = settings.enabled
          ? "text-sm font-bold text-emerald-300 mt-1"
          : "text-sm font-bold text-red-300 mt-1";
      }
      if (thresholdEl) {
        thresholdEl.textContent = `${settings.threshold ?? 70}%`;
      }
      if (autoHideEl) {
        autoHideEl.textContent = `${settings.autoHideThreshold ?? 92}%`;
      }
      if (webhookEl) {
        webhookEl.textContent = settings.webhookConfigured
          ? "مضبوط ✓"
          : "غير مضبوط";
      }
      if (webhookUrlEl) {
        webhookUrlEl.textContent = `${window.location.origin}/api/ai-moderation-webhook`;
      }
      if (keywordsEl) {
        const preview = Array.isArray(settings.keywordsPreview)
          ? settings.keywordsPreview.join(" · ")
          : "";
        keywordsEl.textContent = preview
          ? `كلمات مراقبة: ${preview}`
          : "كلمات مراقبة افتراضية مفعّلة.";
      }
    } catch {
      // ignore settings load errors
    }
  }

  function renderAiScanResults(payload) {
    const container = document.getElementById("ai-scan-results");
    if (!container) return;

    const results = Array.isArray(payload?.results) ? payload.results : [];
    const flagged = results.filter((item) => item.flagged);

    if (!results.length) {
      container.innerHTML =
        '<p class="text-xs text-zinc-500 text-center py-4">لا توجد نتائج فحص.</p>';
      return;
    }

    container.innerHTML = `
      <p class="text-xs text-violet-300 font-bold mb-2">
        تم فحص ${payload.scanned ?? results.length} · وُسم ${payload.flagged ?? flagged.length} · إخفاء تلقائي ${payload.autoHidden ?? 0}
      </p>
      ${flagged
        .map(
          (item) => `
        <div class="rounded-lg border border-violet-500/20 bg-violet-950/20 px-3 py-2 text-[11px] text-zinc-300">
          <span class="font-mono" dir="ltr">${escapeHtml(item.postId)}</span>
          · score ${escapeHtml(String(item.score))}
          ${item.autoHidden ? " · مخفي تلقائياً" : ""}
        </div>
      `,
        )
        .join("")}
    `;
  }

  async function runAiModerationScan() {
    if (isBusy) return;

    isBusy = true;
    const button = document.getElementById("run-ai-scan-btn");
    if (button instanceof HTMLButtonElement) {
      button.disabled = true;
      button.textContent = "جاري الفحص...";
    }

    try {
      const payload = await adminFetch("/api/admin/moderation/ai-scan", {
        method: "POST",
        body: JSON.stringify({ limit: 25, skipFlagged: true }),
      });
      renderAiScanResults(payload);
      showToast(
        `تم فحص ${payload.scanned ?? 0} منشور · وُسم ${payload.flagged ?? 0}.`,
        payload.flagged > 0 ? "warning" : "success",
      );
      await loadModerationCenter(false);
      await refreshAuditLogs();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر تشغيل فحص AI.",
        "warning",
      );
    } finally {
      isBusy = false;
      if (button instanceof HTMLButtonElement) {
        button.disabled = false;
        button.textContent = "فحص المنشورات الآن";
      }
    }
  }

  function showReportDetailOverlay(show) {
    const overlay = document.getElementById("report-detail-overlay");
    if (!overlay) return;
    overlay.classList.toggle("hidden", !show);
    overlay.classList.toggle("flex", show);
  }

  function renderReportDetailActions(report) {
    const actions = document.getElementById("report-detail-actions");
    if (!actions || !report) {
      return;
    }

    if (report.status === "open") {
      actions.innerHTML = `
        <button type="button" data-review-report="${escapeHtml(report.id)}" data-report-legacy="${report.legacy ? "1" : "0"}" data-report-action="dismissed" class="px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-all">تجاهل</button>
        <button type="button" data-review-report="${escapeHtml(report.id)}" data-report-legacy="${report.legacy ? "1" : "0"}" data-report-action="resolved" data-hide-post="0" class="px-4 py-2 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">تمت المراجعة</button>
        <button type="button" data-review-report="${escapeHtml(report.id)}" data-report-legacy="${report.legacy ? "1" : "0"}" data-report-action="resolved" data-hide-post="1" class="px-4 py-2 rounded-xl text-xs font-bold text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">حل + إخفاء</button>
      `;
    } else {
      actions.innerHTML =
        '<p class="text-xs text-zinc-500">تمت معالجة هذا البلاغ مسبقاً.</p>';
    }
  }

  async function openReportDetail(reportId, legacy) {
    if (!reportId || isBusy) return;

    isBusy = true;
    try {
      const payload = await adminFetch(
        `/api/admin/moderation/reports-detail?reportId=${encodeURIComponent(reportId)}&legacy=${legacy ? "1" : "0"}`,
      );
      const report = payload.report;
      const post = payload.post;
      activeReportDetail = report;

      const title = document.getElementById("report-detail-title");
      const date = document.getElementById("report-detail-date");
      const reporter = document.getElementById("report-detail-reporter");
      const postVar = document.getElementById("report-detail-post-var");
      const postId = document.getElementById("report-detail-post-id");
      const reason = document.getElementById("report-detail-reason");
      const preview = document.getElementById("report-detail-preview");
      const postBlock = document.getElementById("report-detail-post-block");
      const postTitle = document.getElementById("report-detail-post-title");
      const postContent = document.getElementById("report-detail-post-content");

      if (title) {
        title.textContent = formatReportStatus(report.status);
      }
      if (date) {
        date.textContent = formatDateLabel(report.createdAt);
      }
      if (reporter) reporter.textContent = report.reporterVarId || "—";
      if (postVar) postVar.textContent = report.postVarId || post?.varId || "—";
      if (postId) postId.textContent = report.postId || "—";
      if (reason) reason.textContent = formatReportReason(report.reason);
      if (preview) {
        preview.textContent = report.contentPreview || "—";
      }

      if (postBlock && postTitle && postContent) {
        if (post) {
          postBlock.classList.remove("hidden");
          postTitle.textContent = post.title || "منشور";
          postContent.textContent = post.content || "—";
        } else {
          postBlock.classList.add("hidden");
        }
      }

      renderReportDetailActions(report);
      showReportDetailOverlay(true);
      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر تحميل تفاصيل البلاغ.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
  }

  function closeReportDetail() {
    activeReportDetail = null;
    showReportDetailOverlay(false);
  }

  function renderModerationCenter() {
    const reportsList = document.getElementById("moderation-reports-list");
    const flaggedList = document.getElementById("moderation-flagged-list");
    const sourceEl = document.getElementById("moderation-reports-source");
    const openCountEl = document.getElementById("moderation-open-count");
    const statusSelect = document.getElementById("reports-status-filter");
    if (statusSelect instanceof HTMLSelectElement) {
      statusSelect.value = moderationReportsStatus;
    }
    const flaggedCountEl = document.getElementById("moderation-flagged-count");
    const allPostsList = document.getElementById("moderation-all-posts-list");
    const allPostsCountEl = document.getElementById("moderation-all-posts-count");
    const commentsList = document.getElementById("moderation-comments-list");
    const commentsCountEl = document.getElementById("moderation-comments-count");
    const commentsSourceEl = document.getElementById("moderation-comments-source");

    if (openCountEl) {
      openCountEl.textContent = String(
        moderationReportsOpenTotal + moderationFlaggedPosts.length,
      );
    }

    if (flaggedCountEl) {
      flaggedCountEl.textContent = String(moderationFlaggedPosts.length);
    }

    if (allPostsCountEl) {
      allPostsCountEl.textContent = String(moderationAllPosts.length);
    }

    if (commentsCountEl) {
      commentsCountEl.textContent = String(moderationComments.length);
    }

    if (commentsSourceEl) {
      commentsSourceEl.textContent =
        moderationCommentsSource === "socialinteractions"
          ? "مصدر: socialinteractions"
          : moderationCommentsSource === "comments"
            ? "مصدر: comments"
            : "لا يوجد مصدر";
    }

    if (sourceEl) {
      sourceEl.textContent =
        moderationReportsSource === "reports"
          ? "مصدر: reports"
          : moderationReportsSource === "legacy"
            ? "مصدر: بلاغات قديمة"
            : "لا يوجد مصدر بلاغات";
    }

    if (reportsList) {
      if (!moderationReports.length) {
        reportsList.innerHTML =
          '<p class="text-xs text-zinc-500 text-center py-8">لا توجد بلاغات في هذا الفلتر.</p>';
      } else {
        reportsList.innerHTML = moderationReports
          .map((report) => {
            const preview = truncatePostText(
              report.contentPreview || report.reason,
              120,
            );
            return `
              <article class="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${reportStatusClass(report.status)}">${escapeHtml(formatReportStatus(report.status))}</span>
                      <span class="text-[10px] text-zinc-500">${escapeHtml(formatDateLabel(report.createdAt))}</span>
                    </div>
                    <p class="text-[11px] text-zinc-500 mt-2">من <span class="font-mono text-zinc-300" dir="ltr">${escapeHtml(report.reporterVarId || "—")}</span></p>
                    <p class="text-xs text-white mt-1 leading-relaxed whitespace-pre-wrap break-words">${escapeHtml(preview)}</p>
                    <p class="text-[10px] text-zinc-500 mt-2">${escapeHtml(formatReportReason(report.reason))} · <span class="font-mono" dir="ltr">${escapeHtml(report.postVarId || report.postId || "—")}</span></p>
                  </div>
                </div>
                <div class="flex items-center justify-end gap-2 flex-wrap">
                  <button type="button" data-view-report="${escapeHtml(report.id)}" data-report-legacy="${report.legacy ? "1" : "0"}" class="text-[11px] font-bold text-sky-300 hover:underline">تفاصيل</button>
                  ${
                    report.status === "open"
                      ? `<button type="button" data-review-report="${escapeHtml(report.id)}" data-report-legacy="${report.legacy ? "1" : "0"}" data-report-action="dismissed" class="text-[11px] font-bold text-zinc-400 hover:underline">تجاهل</button>
                  <button type="button" data-review-report="${escapeHtml(report.id)}" data-report-legacy="${report.legacy ? "1" : "0"}" data-report-action="resolved" data-hide-post="0" class="text-[11px] font-bold text-emerald-400 hover:underline">حل</button>
                  <button type="button" data-review-report="${escapeHtml(report.id)}" data-report-legacy="${report.legacy ? "1" : "0"}" data-report-action="resolved" data-hide-post="1" class="text-[11px] font-bold text-red-400 hover:underline">حل + إخفاء</button>`
                      : ""
                  }
                </div>
              </article>
            `;
          })
          .join("");
      }
      updateReportsPanelMeta();
      updateReportsPaginationUi();
    }

    if (flaggedList) {
      if (!moderationFlaggedPosts.length) {
        flaggedList.innerHTML =
          '<p class="text-xs text-zinc-500 text-center py-8">لا يوجد محتوى مشبوه حالياً.</p>';
      } else {
        flaggedList.innerHTML = moderationFlaggedPosts
          .map((post) => {
            const preview = truncatePostText(post.content || post.title, 220);
            return `
              <article class="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-white">${escapeHtml(truncatePostText(post.title, 80))}</p>
                    <p class="text-[11px] text-zinc-300 mt-2 leading-relaxed whitespace-pre-wrap break-words">${escapeHtml(preview)}</p>
                    <p class="text-[10px] text-zinc-500 mt-2 font-mono" dir="ltr">${escapeHtml(post.varId || post.id)} · AI ${escapeHtml(String(post.aiScore || 0))}</p>
                    ${post.aiFlags ? `<p class="text-[10px] text-amber-300 mt-1">${escapeHtml(post.aiFlags)}</p>` : ""}
                  </div>
                  <span class="shrink-0 text-[10px] font-bold px-2 py-1 rounded-md ${post.hidden ? "bg-zinc-800 text-zinc-400" : "bg-amber-500/10 text-amber-300 border border-amber-500/20"}">${post.hidden ? "مخفي" : "مشبوه"}</span>
                </div>
                <div class="flex items-center justify-end gap-2 flex-wrap">
                  <button type="button" data-flagged-hide="${escapeHtml(post.id)}" data-flagged-hidden="${post.hidden ? "1" : "0"}" class="text-[11px] font-bold text-amber-300 hover:underline">${post.hidden ? "إظهار" : "إخفاء"}</button>
                  <button type="button" data-flagged-delete="${escapeHtml(post.id)}" class="text-[11px] font-bold text-red-400 hover:underline">حذف</button>
                </div>
              </article>
            `;
          })
          .join("");
      }
    }

    if (commentsList) {
      if (!moderationComments.length) {
        commentsList.innerHTML =
          '<p class="text-xs text-zinc-500 text-center py-8">لا توجد تعليقات أو المصدر غير مفعّل.</p>';
      } else {
        commentsList.innerHTML = moderationComments
          .map((comment) => {
            const preview = truncatePostText(comment.content, 220);
            return `
              <article class="rounded-xl border border-sky-500/20 bg-sky-950/10 p-4 space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-[11px] text-zinc-500">من <span class="font-mono text-zinc-300" dir="ltr">${escapeHtml(comment.varId || "—")}</span> · ${escapeHtml(comment.mode || "x")}</p>
                    <p class="text-xs text-white mt-2 leading-relaxed whitespace-pre-wrap break-words">${escapeHtml(preview || "—")}</p>
                    <p class="text-[10px] text-zinc-500 mt-2 font-mono" dir="ltr">على: ${escapeHtml(comment.targetId || "—")}</p>
                  </div>
                  <span class="shrink-0 text-[10px] font-bold px-2 py-1 rounded-md ${comment.active ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-zinc-800 text-zinc-400"}">${comment.active ? "ظاهر" : "مخفي"}</span>
                </div>
                <div class="flex items-center justify-end gap-2 flex-wrap">
                  <button type="button" data-comment-hide="${escapeHtml(comment.id)}" data-comment-source="${escapeHtml(comment.source)}" data-comment-hidden="${comment.active ? "0" : "1"}" class="text-[11px] font-bold text-amber-300 hover:underline">${comment.active ? "إخفاء" : "إظهار"}</button>
                  <button type="button" data-comment-delete="${escapeHtml(comment.id)}" data-comment-source="${escapeHtml(comment.source)}" class="text-[11px] font-bold text-red-400 hover:underline">حذف</button>
                </div>
              </article>
            `;
          })
          .join("");
      }
    }

    if (allPostsList) {
      if (!moderationAllPosts.length) {
        allPostsList.innerHTML =
          '<p class="text-xs text-zinc-500 text-center py-8">لا توجد منشورات أو collection posts غير جاهز.</p>';
      } else {
        allPostsList.innerHTML = moderationAllPosts
          .map((post) => {
            const preview = truncatePostText(post.content || post.title, 220);
            return `
              <article class="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-white">${escapeHtml(truncatePostText(post.title, 80) || "منشور")}</p>
                    <p class="text-[11px] text-zinc-300 mt-2 leading-relaxed whitespace-pre-wrap break-words">${escapeHtml(preview)}</p>
                    <p class="text-[10px] text-zinc-500 mt-2 font-mono" dir="ltr">${escapeHtml(post.varId || post.authorId || post.id)}</p>
                  </div>
                  <span class="shrink-0 text-[10px] font-bold px-2 py-1 rounded-md ${post.hidden ? "bg-zinc-800 text-zinc-400" : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"}">${post.hidden ? "مخفي" : "ظاهر"}</span>
                </div>
                <div class="flex items-center justify-end gap-2 flex-wrap">
                  <button type="button" data-all-post-hide="${escapeHtml(post.id)}" data-all-post-hidden="${post.hidden ? "1" : "0"}" class="text-[11px] font-bold text-amber-300 hover:underline">${post.hidden ? "إظهار" : "إخفاء"}</button>
                  <button type="button" data-all-post-delete="${escapeHtml(post.id)}" class="text-[11px] font-bold text-red-400 hover:underline">حذف</button>
                </div>
              </article>
            `;
          })
          .join("");
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  async function reviewModerationReport(reportId, legacy, status, hidePost) {
    if (!reportId || isBusy) return;

    isBusy = true;
    try {
      await adminFetch("/api/admin/moderation/review", {
        method: "POST",
        body: JSON.stringify({
          reportId,
          legacy,
          status,
          hidePost,
        }),
      });
      showToast(
        status === "resolved"
          ? hidePost
            ? "تم حل البلاغ وإخفاء المنشور."
            : "تمت مراجعة البلاغ."
          : "تم تجاهل البلاغ.",
        "success",
      );
      closeReportDetail();
      await loadModerationCenter(false);
      await refreshAuditLogs();
      await loadDashboardData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر مراجعة البلاغ.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
  }

  async function toggleFlaggedPostVisibility(postId, currentlyHidden) {
    if (!postId || isBusy) return;

    isBusy = true;
    try {
      await adminFetch("/api/admin/posts/hide", {
        method: "POST",
        body: JSON.stringify({ postId, hidden: !currentlyHidden }),
      });
      showToast(currentlyHidden ? "تم إظهار المنشور." : "تم إخفاء المنشور.", "success");
      await loadModerationCenter(false);
      await refreshAuditLogs();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر تحديث ظهور المنشور.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
  }

  async function deleteFlaggedPost(postId) {
    if (!postId || isBusy) return;
    if (!window.confirm("هل تريد حذف هذا المنشور نهائياً؟")) return;

    isBusy = true;
    try {
      await adminFetch("/api/admin/posts/delete", {
        method: "POST",
        body: JSON.stringify({ postId }),
      });
      showToast("تم حذف المنشور.", "success");
      await loadModerationCenter(false);
      await refreshAuditLogs();
      await loadDashboardData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر حذف المنشور.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
  }

  async function toggleModerationCommentVisibility(
    commentId,
    source,
    currentlyHidden,
  ) {
    if (!commentId || isBusy) return;

    isBusy = true;
    try {
      await adminFetch("/api/admin/moderation/comments-hide", {
        method: "POST",
        body: JSON.stringify({
          commentId,
          source,
          hidden: !currentlyHidden,
        }),
      });
      showToast(
        currentlyHidden ? "تم إظهار التعليق." : "تم إخفاء التعليق.",
        "success",
      );
      await loadModerationCenter(false);
      await refreshAuditLogs();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر تحديث التعليق.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
  }

  async function deleteModerationComment(commentId, source) {
    if (!commentId || isBusy) return;
    if (!window.confirm("هل تريد حذف هذا التعليق نهائياً؟")) return;

    isBusy = true;
    try {
      await adminFetch("/api/admin/moderation/comments-delete", {
        method: "POST",
        body: JSON.stringify({ commentId, source }),
      });
      showToast("تم حذف التعليق.", "success");
      await loadModerationCenter(false);
      await refreshAuditLogs();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر حذف التعليق.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
  }

  async function refreshUsers() {
    try {
      await fetchUsersPage({ offset: usersOffset });
      applyUserFilters();
      return usersData;
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر تحميل المستخدمين.",
        "warning",
      );
      return usersData;
    }
  }

  function syncUserSearchInputs(query) {
    const normalizedQuery = query.trim();
    const fields = [
      "user-search-input",
      "global-search-input",
      "quick-var-search-input",
    ];

    for (const id of fields) {
      const input = document.getElementById(id);
      if (input instanceof HTMLInputElement) {
        input.value = normalizedQuery;
      }
    }
  }

  function highlightNavTab(tabId) {
    document.querySelectorAll(".nav-item").forEach((item) => {
      const tab = item.getAttribute("data-tab") || "";
      const isActive = tab === tabId;
      const hasBadge = item.querySelector("[id$='-count']");

      if (isActive && hasBadge) {
        item.className =
          "nav-item active w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-800/80 text-white transition-all duration-200 text-right";
      } else if (isActive) {
        item.className =
          "nav-item active w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800/80 text-white transition-all duration-200 text-right";
      } else if (hasBadge) {
        item.className =
          "nav-item w-full flex items-center justify-between px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100 transition-all duration-200 text-right";
      } else {
        item.className =
          "nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100 transition-all duration-200 text-right";
      }
    });
  }

  function updatePageHeader(tabId) {
    const config = TAB_VIEWS[tabId] || TAB_VIEWS.dashboard;
    const title = document.getElementById("page-title");
    const subtitle = document.getElementById("page-subtitle");
    if (title) title.textContent = config.title;
    if (subtitle) subtitle.textContent = config.subtitle;
  }

  function openNavDrawer() {
    document.getElementById("nav-drawer")?.classList.add("open");
    document.getElementById("nav-drawer-overlay")?.classList.remove("hidden");
  }

  function closeNavDrawer() {
    document.getElementById("nav-drawer")?.classList.remove("open");
    document.getElementById("nav-drawer-overlay")?.classList.add("hidden");
  }

  async function runQuickUserSearch(rawQuery) {
    const query =
      typeof rawQuery === "string"
        ? rawQuery.trim()
        : rawQuery instanceof HTMLInputElement
          ? rawQuery.value.trim()
          : "";

    syncUserSearchInputs(query);
    usersOffset = 0;
    switchTab("users-panel", null, { skipLoad: true });

    try {
      await fetchUsersPage({ offset: 0, search: query });
      applyUserFilters();
      const results = usersData;

      if (query && results.length === 0) {
        showToast("لم يُعثر على مستخدم بهذا المعرف.", "warning");
      } else if (query && results.length === 1) {
        const user = results[0];
        showToast(
          `تم العثور على ${user.displayVarId || user.displayName || "المستخدم"}.`,
          "success",
        );
      } else if (query) {
        showToast(`تم العثور على ${results.length} مستخدم.`, "success");
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر البحث عن المستخدم.",
        "warning",
      );
    }
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
      switchTab("dashboard", null, { skipLoad: true });
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
      restoreUiMode();
      void refreshAdminKeys(false);
      switchTab("dashboard", null, { skipLoad: true });
      await loadDashboardData();
    } catch {
      setSessionSecret("");
      showLogin();
    }
  }

  function apiUiModeFromAdmin(modeName) {
    return modeName === "X-Mode" ? "x" : "tiktok";
  }

  function adminUiModeFromApi(uiMode) {
    return uiMode === "x" ? "X-Mode" : "TikTok-Mode";
  }

  function updateModeSyncStatus(settings) {
    const syncEl = document.getElementById("mode-sync-status");
    if (!syncEl) return;

    if (!settings?.updatedAt) {
      syncEl.textContent = "لم يُحفظ بعد على السيرفر";
      return;
    }

    syncEl.textContent = `آخر حفظ: ${formatDateLabel(settings.updatedAt)} · يطبّق على التطبيق`;
  }

  async function loadAppSettings(showErrors) {
    try {
      const payload = await adminFetch("/api/admin/settings/get");
      const settings = payload.settings || {};
      appRuntimeSettings = {
        richIconsEnabled: Boolean(settings.richIconsEnabled),
        gpuAccelerationEnabled: Boolean(settings.gpuAccelerationEnabled),
        updatedAt: settings.updatedAt || "",
      };

      const richIconsEl = document.getElementById("mode-rich-icons");
      const gpuEl = document.getElementById("mode-gpu-accel");
      if (richIconsEl instanceof HTMLInputElement) {
        richIconsEl.checked = appRuntimeSettings.richIconsEnabled;
      }
      if (gpuEl instanceof HTMLInputElement) {
        gpuEl.checked = appRuntimeSettings.gpuAccelerationEnabled;
      }

      setGlobalMode(adminUiModeFromApi(settings.uiMode || "tiktok"), false);
      updateModeSyncStatus(settings);
    } catch (error) {
      if (showErrors) {
        showToast(
          error instanceof Error
            ? error.message
            : "تعذر تحميل إعدادات التطبيق.",
          "warning",
        );
      }
    }
  }

  async function persistAppSettings(patch) {
    if (isBusy) return;

    isBusy = true;
    try {
      await adminFetch("/api/admin/settings/update", {
        method: "POST",
        body: JSON.stringify(patch),
      });
      await loadAppSettings(false);
      void refreshAuditLogs();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "تعذر حفظ إعدادات التطبيق.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
  }

  function restoreUiMode() {
    void loadAppSettings(false);
  }

  function setGlobalMode(modeName, persist) {
    currentGlobalMode = modeName;
    if (persist !== false) {
      void persistAppSettings({
        uiMode: apiUiModeFromAdmin(modeName),
        richIconsEnabled: appRuntimeSettings.richIconsEnabled,
        gpuAccelerationEnabled: appRuntimeSettings.gpuAccelerationEnabled,
      });
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
        showToast("تم تفعيل X-Mode لكل مستخدمي التطبيق.", "info");
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
        showToast("تم تفعيل TikTok-Mode لكل مستخدمي التطبيق.", "success");
      }
    }
  }

  async function updateModeFeatureSetting(feature, enabled) {
    const patch = {
      uiMode: apiUiModeFromAdmin(currentGlobalMode),
      richIconsEnabled: appRuntimeSettings.richIconsEnabled,
      gpuAccelerationEnabled: appRuntimeSettings.gpuAccelerationEnabled,
    };

    if (feature === "richIcons") {
      patch.richIconsEnabled = enabled;
    } else if (feature === "gpu") {
      patch.gpuAccelerationEnabled = enabled;
    }

    await persistAppSettings(patch);
    if (feature === "richIcons") {
      showToast(
        enabled
          ? "تم تفعيل أيقونات الواجهة في التطبيق."
          : "تم إيقاف أيقونات الواجهة في التطبيق.",
        "success",
      );
    } else {
      showToast(
        enabled
          ? "تم تفعيل تسريع الرسوميات في التطبيق."
          : "تم إيقاف تسريع الرسوميات في التطبيق.",
        "info",
      );
    }
  }

  function revealCreatedAdminKey(secret) {
    void copyToClipboard(secret);
    window.alert(
      `تم إنشاء المفتاح ونسخه للحافظة:\n\n${secret}\n\nاحفظه الآن — لن يظهر مرة أخرى.`,
    );
  }

  async function generateNewKey() {
    if (isBusy) return;

    const labelInput = document.getElementById("key-label");
    const roleSelect = document.getElementById("key-role");
    const expirySelect = document.getElementById("key-expiry");
    const label = labelInput?.value.trim() || "";
    const role = roleSelect?.value || "";
    const expiryOption = expirySelect?.value || "Never";
    const customDate =
      expiryOption === "Custom Date"
        ? document.getElementById("custom-date-picker")?.value || ""
        : "";

    if (!label) {
      showToast("أدخل اسم أو بادئة للمفتاح.", "warning");
      return;
    }

    if (expiryOption === "Custom Date" && !customDate) {
      showToast("حدد تاريخ انتهاء مخصص.", "warning");
      return;
    }

    isBusy = true;
    try {
      const payload = await adminFetch("/api/admin/keys/create", {
        method: "POST",
        body: JSON.stringify({
          label,
          role,
          expiryOption,
          customDate,
        }),
      });

      if (typeof payload.secret === "string" && payload.secret.trim()) {
        revealCreatedAdminKey(payload.secret.trim());
      }

      if (labelInput) labelInput.value = "";
      resetKeyForm(true);
      await refreshAdminKeys(false);
      void refreshAuditLogs();
      showToast("تم حفظ المفتاح في Appwrite.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر إنشاء المفتاح.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
  }

  async function toggleAdminKeyStatus(keyId, currentStatus) {
    if (!keyId || isBusy || currentStatus === "expired") return;

    isBusy = true;
    try {
      const nextStatus = currentStatus === "active" ? "revoked" : "active";
      await adminFetch("/api/admin/keys/revoke", {
        method: "POST",
        body: JSON.stringify({
          keyId,
          status: nextStatus,
        }),
      });
      await refreshAdminKeys(false);
      void refreshAuditLogs();
      showToast(
        nextStatus === "active"
          ? "تم تفعيل المفتاح."
          : "تم إلغاء تفعيل المفتاح.",
        "info",
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر تحديث المفتاح.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
  }

  async function deleteAdminKeyRecord(keyId, keyPreview) {
    if (!keyId || isBusy) return;
    if (
      !window.confirm(
        `حذف المفتاح ${keyPreview || keyId} نهائياً؟ لا يمكن التراجع.`,
      )
    ) {
      return;
    }

    isBusy = true;
    try {
      await adminFetch("/api/admin/keys/delete", {
        method: "POST",
        body: JSON.stringify({
          keyId,
          keyPreview,
        }),
      });
      await refreshAdminKeys(false);
      void refreshAuditLogs();
      showToast("تم حذف المفتاح.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر حذف المفتاح.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
  }

  function toggleCustomDatePicker() {
    const select = document.getElementById("key-expiry");
    const container = document.getElementById("custom-date-container");
    if (!select || !container) return;
    container.classList.toggle("hidden", select.value !== "Custom Date");
  }

  function resetKeyForm(silent) {
    const labelInput = document.getElementById("key-label");
    const roleSelect = document.getElementById("key-role");
    const expirySelect = document.getElementById("key-expiry");
    const customContainer = document.getElementById("custom-date-container");
    if (labelInput) labelInput.value = "";
    if (roleSelect) roleSelect.value = "مسؤول رئيسي (Super Admin)";
    if (expirySelect) expirySelect.value = "Never";
    customContainer?.classList.add("hidden");
    if (!silent) {
      showToast("تم تصفير نموذج المفاتيح.", "info");
    }
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`تم النسخ: ${text}`, "success");
    } catch {
      showToast("تعذر النسخ.", "warning");
    }
  }

  function truncatePostText(text, maxLength) {
    const normalized = typeof text === "string" ? text.trim() : "";
    if (!normalized) return "—";
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength)}...`;
  }

  function renderUserPosts(posts) {
    const container = document.getElementById("user-edit-posts-list");
    const counter = document.getElementById("user-edit-posts-count");
    if (counter) counter.textContent = String(posts.length);
    if (!container) return;

    if (!posts.length) {
      container.innerHTML =
        '<p class="text-xs text-zinc-500 text-center py-6">لا توجد منشورات لهذا المستخدم.</p>';
      return;
    }

    container.innerHTML = posts
      .map((post) => {
        const hidden = Boolean(post.hidden);
        const title = truncatePostText(post.title, 80);
        const content = truncatePostText(post.content, 220);
        const createdAt = formatDateLabel(post.createdAt);

        return `
          <article class="rounded-xl border ${hidden ? "border-amber-500/30 bg-amber-950/10" : "border-zinc-800 bg-zinc-900"} p-4 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-white">${escapeHtml(title)}</p>
                <p class="text-[11px] text-zinc-400 mt-2 leading-relaxed whitespace-pre-wrap break-words">${escapeHtml(content)}</p>
              </div>
              <span class="shrink-0 px-2 py-1 rounded-md text-[10px] font-bold ${hidden ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"}">
                ${hidden ? "مخفي" : "ظاهر"}
              </span>
            </div>
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <span class="text-[10px] text-zinc-500">${escapeHtml(createdAt)}</span>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  data-toggle-post-visibility="${escapeHtml(post.id)}"
                  data-post-hidden="${hidden ? "1" : "0"}"
                  class="text-[11px] font-bold ${hidden ? "text-emerald-400 hover:underline" : "text-amber-300 hover:underline"}"
                >
                  ${hidden ? "إظهار" : "إخفاء"}
                </button>
                <span class="text-zinc-700">|</span>
                <button
                  type="button"
                  data-delete-post="${escapeHtml(post.id)}"
                  class="text-[11px] font-bold text-red-400 hover:underline"
                >
                  حذف
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    if (window.lucide) window.lucide.createIcons();
  }

  async function loadUserPosts(varId) {
    const container = document.getElementById("user-edit-posts-list");
    if (container) {
      container.innerHTML =
        '<p class="text-xs text-zinc-500 text-center py-6">جاري تحميل المنشورات...</p>';
    }

    if (!varId) {
      editingUserPosts = [];
      renderUserPosts([]);
      return;
    }

    try {
      const payload = await adminFetch(
        `/api/admin/posts/list?varId=${encodeURIComponent(varId)}&limit=50`,
      );
      editingUserPosts = Array.isArray(payload.posts) ? payload.posts : [];
      renderUserPosts(editingUserPosts);
    } catch {
      editingUserPosts = [];
      renderUserPosts([]);
      showToast("تعذر تحميل منشورات المستخدم.", "warning");
    }
  }

  async function toggleUserPostVisibility(postId, currentlyHidden) {
    if (!postId || isBusy) return;

    isBusy = true;
    try {
      await adminFetch("/api/admin/posts/hide", {
        method: "POST",
        body: JSON.stringify({ postId, hidden: !currentlyHidden }),
      });
      showToast(currentlyHidden ? "تم إظهار المنشور." : "تم إخفاء المنشور.", "success");
      await loadUserPosts(editingUserVarId);
      await refreshAuditLogs();
      await loadDashboardData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر تحديث ظهور المنشور.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
  }

  async function deleteUserPost(postId) {
    if (!postId || isBusy) return;
    if (!window.confirm("هل تريد حذف هذا المنشور نهائياً؟")) return;

    isBusy = true;
    try {
      await adminFetch("/api/admin/posts/delete", {
        method: "POST",
        body: JSON.stringify({ postId }),
      });
      showToast("تم حذف المنشور.", "success");
      await loadUserPosts(editingUserVarId);
      await refreshAuditLogs();
      await loadDashboardData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر حذف المنشور.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
  }

  function setUserEditField(id, value) {
    const field = document.getElementById(id);
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      field.value = value || "";
    }
  }

  function readUserEditField(id) {
    const field = document.getElementById(id);
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      return field.value.trim();
    }
    return "";
  }

  function showUserEditOverlay(show) {
    const overlay = document.getElementById("user-edit-overlay");
    if (!overlay) return;
    overlay.classList.toggle("hidden", !show);
    overlay.classList.toggle("flex", show);
  }

  function updateUserEditVerificationUi(verified) {
    editingUserVerified = Boolean(verified);
    const label = document.getElementById("user-edit-verified-label");
    const button = document.getElementById("user-edit-verification-btn");

    if (label) {
      label.textContent = editingUserVerified
        ? "الحساب موثّق ويظهر علامة ✓ في التطبيق."
        : "الحساب غير موثّق حالياً.";
    }

    if (button instanceof HTMLButtonElement) {
      button.textContent = editingUserVerified ? "إلغاء التوثيق" : "منح توثيق";
      button.className = editingUserVerified
        ? "shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all"
        : "shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 transition-all";
    }
  }

  function populateUserEditorForm(user) {
    const label = document.getElementById("user-edit-var-label");
    if (label) {
      label.textContent = user.displayVarId || user.varId || user.id || "—";
    }

    setUserEditField("user-edit-email", user.email);
    setUserEditField("user-edit-password", "");
    setUserEditField("user-edit-display-name", user.displayName);
    setUserEditField("user-edit-username", user.username);
    setUserEditField("user-edit-display-var-id", user.displayVarId);
    setUserEditField("user-edit-avatar-url", user.avatarUrl);
    setUserEditField("user-edit-phone", user.phoneNumber);
    setUserEditField("user-edit-national-id", user.nationalId);
    setUserEditField("user-edit-birth-date", user.birthDate);
    setUserEditField("user-edit-nationality", user.nationality);
    setUserEditField("user-edit-location", user.location);
    setUserEditField("user-edit-profession", user.profession);
    setUserEditField("user-edit-association", user.association);
    setUserEditField("user-edit-bio", user.bio);
    updateUserEditVerificationUi(Boolean(user.verified));

    const errorEl = document.getElementById("user-edit-error");
    if (errorEl) errorEl.textContent = "";
  }

  async function openUserEditor(displayVarId) {
    if (!displayVarId || isBusy) return;

    isBusy = true;
    const errorEl = document.getElementById("user-edit-error");
    if (errorEl) errorEl.textContent = "";

    try {
      const payload = await adminFetch(
        `/api/admin/users/details?displayVarId=${encodeURIComponent(displayVarId)}`,
      );
      editingUserDisplayVarId = displayVarId;
      editingUserVarId = payload.user?.varId || "";
      populateUserEditorForm(payload.user || {});
      showUserEditOverlay(true);
      void loadUserPosts(editingUserVarId);
      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر فتح محرر المستخدم.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
  }

  function closeUserEditor() {
    editingUserDisplayVarId = "";
    editingUserVarId = "";
    editingUserVerified = false;
    editingUserPosts = [];
    showUserEditOverlay(false);
    const errorEl = document.getElementById("user-edit-error");
    if (errorEl) errorEl.textContent = "";
  }

  async function saveUserEditor(event) {
    event.preventDefault();
    if (!editingUserDisplayVarId || isBusy) return;

    isBusy = true;
    const errorEl = document.getElementById("user-edit-error");
    if (errorEl) errorEl.textContent = "";

    const body = {
      displayVarId: editingUserDisplayVarId,
      email: readUserEditField("user-edit-email"),
      displayName: readUserEditField("user-edit-display-name"),
      username: readUserEditField("user-edit-username"),
      displayVarIdNext: readUserEditField("user-edit-display-var-id"),
      phoneNumber: readUserEditField("user-edit-phone"),
      nationalId: readUserEditField("user-edit-national-id"),
      birthDate: readUserEditField("user-edit-birth-date"),
      nationality: readUserEditField("user-edit-nationality"),
      location: readUserEditField("user-edit-location"),
      profession: readUserEditField("user-edit-profession"),
      association: readUserEditField("user-edit-association"),
      bio: readUserEditField("user-edit-bio"),
      avatarUrl: readUserEditField("user-edit-avatar-url"),
    };

    const nextPassword = readUserEditField("user-edit-password");
    if (nextPassword) {
      body.password = nextPassword;
    }

    try {
      await adminFetch("/api/admin/users/update", {
        method: "POST",
        body: JSON.stringify(body),
      });
      showToast("تم حفظ بيانات المستخدم.", "success");
      closeUserEditor();
      await refreshUsers();
      await refreshAuditLogs();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "تعذر حفظ بيانات المستخدم.";
      if (errorEl) errorEl.textContent = message;
      showToast(message, "warning");
    } finally {
      isBusy = false;
    }
  }

  function filterUsers() {
    applyUserFilters();
  }

  function filterUsersByRole(role) {
    const select = document.getElementById("user-role-filter");
    if (select instanceof HTMLSelectElement) {
      select.value = role;
    }
    applyUserFilters();
  }

  async function toggleUserVerification(displayVarId, nextVerified) {
    if (!displayVarId || isBusy) return;

    isBusy = true;
    try {
      await adminFetch("/api/admin/users/verification", {
        method: "POST",
        body: JSON.stringify({
          displayVarId,
          verified: nextVerified,
        }),
      });
      showToast(nextVerified ? "تم منح التوثيق." : "تم إلغاء التوثيق.", "success");
      await refreshUsers();
      await refreshAuditLogs();

      if (
        editingUserDisplayVarId &&
        (displayVarId === editingUserDisplayVarId ||
          usersData.some(
            (user) =>
              (user.displayVarId === displayVarId ||
                user.varId === displayVarId) &&
              user.displayVarId === editingUserDisplayVarId,
          ))
      ) {
        updateUserEditVerificationUi(nextVerified);
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "تعذر تحديث التوثيق.",
        "warning",
      );
    } finally {
      isBusy = false;
    }
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

  function switchTab(tabId, event, options = {}) {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    const config = TAB_VIEWS[tabId] || TAB_VIEWS.dashboard;
    currentTab = tabId in TAB_VIEWS ? tabId : "dashboard";

    document.querySelectorAll(".admin-view").forEach((view) => {
      view.classList.add("hidden");
    });

    const activeView = document.getElementById(config.viewId);
    if (activeView) {
      activeView.classList.remove("hidden");
    }

    highlightNavTab(currentTab);
    updatePageHeader(currentTab);
    closeNavDrawer();

    document.getElementById("admin-views")?.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    if (window.lucide) window.lucide.createIcons();

    if (options.skipLoad) return;

    if (currentTab === "moderation-panel") {
      void loadModerationCenter(true);
    } else if (currentTab === "users-panel") {
      void refreshUsers();
    } else if (currentTab === "keys-panel") {
      void refreshAdminKeys(true);
    } else if (currentTab === "mode-panel") {
      void loadAppSettings(true);
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
      .getElementById("drawer-logout-btn")
      ?.addEventListener("click", handleLogout);
    document
      .getElementById("nav-menu-btn")
      ?.addEventListener("click", openNavDrawer);
    document
      .getElementById("nav-drawer-close-btn")
      ?.addEventListener("click", closeNavDrawer);
    document
      .getElementById("nav-drawer-overlay")
      ?.addEventListener("click", closeNavDrawer);
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
    document
      .getElementById("refresh-moderation-btn")
      ?.addEventListener("click", () => {
        void loadModerationCenter(true);
        showToast("تم تحديث مركز الإشراف.", "info");
      });
    document.getElementById("run-ai-scan-btn")?.addEventListener("click", () => {
      void runAiModerationScan();
    });
    document.getElementById("mode-rich-icons")?.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      void updateModeFeatureSetting("richIcons", target.checked);
    });
    document.getElementById("mode-gpu-accel")?.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      void updateModeFeatureSetting("gpu", target.checked);
    });
    document
      .getElementById("refresh-users-btn")
      ?.addEventListener("click", () => {
        void refreshUsers();
        showToast("تم تحديث قائمة الأعضاء.", "info");
      });
    document
      .getElementById("users-prev-page")
      ?.addEventListener("click", () => {
        void changeUsersPage(-1);
      });
    document
      .getElementById("users-next-page")
      ?.addEventListener("click", () => {
        void changeUsersPage(1);
      });

    document
      .getElementById("reports-status-filter")
      ?.addEventListener("change", (event) => {
        if (!(event.target instanceof HTMLSelectElement)) return;
        moderationReportsStatus = event.target.value;
        moderationReportsOffset = 0;
        void loadModerationCenter(false);
      });
    document
      .getElementById("reports-prev-page")
      ?.addEventListener("click", () => {
        void changeReportsPage(-1);
      });
    document
      .getElementById("reports-next-page")
      ?.addEventListener("click", () => {
        void changeReportsPage(1);
      });
    document
      .getElementById("report-detail-close-btn")
      ?.addEventListener("click", closeReportDetail);
    document
      .getElementById("report-detail-overlay")
      ?.addEventListener("click", (event) => {
        if (event.target?.id === "report-detail-overlay") {
          closeReportDetail();
        }
      });
    document
      .getElementById("report-detail-actions")
      ?.addEventListener("click", (event) => {
        const target = event.target.closest("[data-review-report]");
        if (!target) return;
        void reviewModerationReport(
          target.dataset.reviewReport,
          target.dataset.reportLegacy === "1",
          target.dataset.reportAction === "resolved" ? "resolved" : "dismissed",
          target.dataset.hidePost === "1",
        );
      });

    document.getElementById("moderation-reports-list")?.addEventListener("click", (event) => {
      const viewTarget = event.target.closest("[data-view-report]");
      if (viewTarget) {
        void openReportDetail(
          viewTarget.dataset.viewReport,
          viewTarget.dataset.reportLegacy === "1",
        );
        return;
      }
      const target = event.target.closest("[data-review-report]");
      if (!target) return;
      void reviewModerationReport(
        target.dataset.reviewReport,
        target.dataset.reportLegacy === "1",
        target.dataset.reportAction === "resolved" ? "resolved" : "dismissed",
        target.dataset.hidePost === "1",
      );
    });

    document.getElementById("moderation-flagged-list")?.addEventListener("click", (event) => {
      const target = event.target.closest("[data-flagged-hide], [data-flagged-delete]");
      if (!target) return;
      if (target.dataset.flaggedDelete) {
        void deleteFlaggedPost(target.dataset.flaggedDelete);
        return;
      }
      if (target.dataset.flaggedHide) {
        void toggleFlaggedPostVisibility(
          target.dataset.flaggedHide,
          target.dataset.flaggedHidden === "1",
        );
      }
    });

    document.getElementById("moderation-all-posts-list")?.addEventListener("click", (event) => {
      const target = event.target.closest("[data-all-post-hide], [data-all-post-delete]");
      if (!target) return;
      if (target.dataset.allPostDelete) {
        void deleteFlaggedPost(target.dataset.allPostDelete);
        return;
      }
      if (target.dataset.allPostHide) {
        void toggleFlaggedPostVisibility(
          target.dataset.allPostHide,
          target.dataset.allPostHidden === "1",
        );
      }
    });

    document.getElementById("moderation-comments-list")?.addEventListener("click", (event) => {
      const target = event.target.closest("[data-comment-hide], [data-comment-delete]");
      if (!target) return;
      if (target.dataset.commentDelete) {
        void deleteModerationComment(
          target.dataset.commentDelete,
          target.dataset.commentSource,
        );
        return;
      }
      if (target.dataset.commentHide) {
        void toggleModerationCommentVisibility(
          target.dataset.commentHide,
          target.dataset.commentSource,
          target.dataset.commentHidden === "1",
        );
      }
    });

    document.getElementById("keys-table-body")?.addEventListener("click", (event) => {
      const target = event.target.closest("[data-copy-key], [data-toggle-key], [data-delete-key]");
      if (!target) return;
      if (target.dataset.copyKey) {
        void copyToClipboard(target.dataset.copyKey);
        return;
      }
      if (target.dataset.toggleKey) {
        void toggleAdminKeyStatus(
          target.dataset.toggleKey,
          target.dataset.keyStatus || "active",
        );
        return;
      }
      if (target.dataset.deleteKey) {
        void deleteAdminKeyRecord(
          target.dataset.deleteKey,
          target.dataset.keyPreview || "",
        );
      }
    });

    document.getElementById("users-table-body")?.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      const displayVarId = target.dataset.cardTier;
      if (!displayVarId) return;
      updateCardTierSwatch(target);
      void changeUserCardTier(displayVarId, target.value);
    });

    document.getElementById("users-table-body")?.addEventListener("click", (event) => {
      const target = event.target.closest(
        "[data-toggle-status], [data-change-role], [data-delete-user], [data-copy-var-id], [data-edit-user], [data-toggle-verification]",
      );
      if (!target) return;
      if (target.dataset.copyVarId) {
        void copyToClipboard(target.dataset.copyVarId);
      } else if (target.dataset.editUser) {
        void openUserEditor(target.dataset.editUser);
      } else if (target.dataset.toggleVerification) {
        void toggleUserVerification(
          target.dataset.toggleVerification,
          target.dataset.verified !== "1",
        );
      } else if (target.dataset.toggleStatus) {
        void toggleUserStatus(target.dataset.toggleStatus);
      } else if (target.dataset.changeRole) {
        void changeUserRole(target.dataset.changeRole);
      } else if (target.dataset.deleteUser) {
        void deleteUser(target.dataset.deleteUser);
      }
    });

    document.getElementById("user-search-input")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void runQuickUserSearch(event.target.value);
      }
    });

    document.getElementById("user-search-btn")?.addEventListener("click", () => {
      const input = document.getElementById("user-search-input");
      void runQuickUserSearch(input instanceof HTMLInputElement ? input.value : "");
    });

    document.getElementById("quick-var-search-btn")?.addEventListener("click", () => {
      const input = document.getElementById("quick-var-search-input");
      void runQuickUserSearch(input instanceof HTMLInputElement ? input.value : "");
    });

    document.getElementById("quick-var-search-input")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void runQuickUserSearch(event.target.value);
      }
    });

    document.getElementById("global-search-input")?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      void runQuickUserSearch(event.target.value);
    });

    document
      .getElementById("user-edit-verification-btn")
      ?.addEventListener("click", () => {
        if (!editingUserDisplayVarId) return;
        void toggleUserVerification(
          editingUserDisplayVarId,
          !editingUserVerified,
        );
      });

    document
      .getElementById("user-edit-form")
      ?.addEventListener("submit", (event) => {
        void saveUserEditor(event);
      });
    document
      .getElementById("user-edit-close-btn")
      ?.addEventListener("click", closeUserEditor);
    document
      .getElementById("user-edit-cancel-btn")
      ?.addEventListener("click", closeUserEditor);
    document.getElementById("user-edit-overlay")?.addEventListener("click", (event) => {
      if (event.target?.id === "user-edit-overlay") {
        closeUserEditor();
      }
    });

    document.getElementById("user-edit-posts-list")?.addEventListener("click", (event) => {
      const target = event.target.closest(
        "[data-toggle-post-visibility], [data-delete-post]",
      );
      if (!target) return;

      if (target.dataset.deletePost) {
        void deleteUserPost(target.dataset.deletePost);
        return;
      }

      if (target.dataset.togglePostVisibility) {
        void toggleUserPostVisibility(
          target.dataset.togglePostVisibility,
          target.dataset.postHidden === "1",
        );
      }
    });
  }

  window.generateNewKey = () => {
    void generateNewKey();
  };
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
    bindEvents();
    void restoreSession();
  });
})();
