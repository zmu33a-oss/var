export const APPWRITE_ENDPOINT =
  import.meta.env.VITE_APPWRITE_ENDPOINT?.trim() ||
  "https://fra.cloud.appwrite.io/v1";

export const APPWRITE_PROJECT_ID =
  import.meta.env.VITE_APPWRITE_PROJECT_ID?.trim() || "";

export const VAR_ADMIN_EMAIL =
  import.meta.env.VITE_VAR_ADMIN_EMAIL?.trim().toLowerCase() || "";

export const SESSION_STORAGE_KEY = "var-admin-appwrite-session";
