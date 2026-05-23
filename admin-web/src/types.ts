export type AdminSectionId =
  | "overview"
  | "users"
  | "content"
  | "predictions"
  | "audit"
  | "settings";

export type AdminNavItem = {
  id: AdminSectionId;
  label: string;
  hint: string;
  icon: string;
};

export type MockAdminUser = {
  displayName: string;
  email: string;
  roleLabel: string;
  varId: string;
};
