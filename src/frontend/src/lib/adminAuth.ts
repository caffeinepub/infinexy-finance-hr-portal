const ADMIN_CREDS_KEY = "infinexy_admin_creds";
const AUTH_TOKEN_KEY = "infinexy_admin_auth";
const ADMIN_EXTRAS_KEY = "infinexy_admin_extras";

export interface AdminCredentials {
  username: string;
  passwordHash: string;
}

export interface EmployeeExtras {
  dateOfJoining?: string;
  dateOfLeaving?: string;
}

export function getAdminCredentials(): AdminCredentials {
  const stored = localStorage.getItem(ADMIN_CREDS_KEY);
  if (stored) return JSON.parse(stored) as AdminCredentials;
  return { username: "admin", passwordHash: btoa("admin123") };
}

export function login(username: string, password: string): boolean {
  const creds = getAdminCredentials();
  if (username === creds.username && btoa(password) === creds.passwordHash) {
    localStorage.setItem(AUTH_TOKEN_KEY, "true");
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_TOKEN_KEY) === "true";
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
): boolean {
  const creds = getAdminCredentials();
  if (btoa(currentPassword) !== creds.passwordHash) return false;
  localStorage.setItem(
    ADMIN_CREDS_KEY,
    JSON.stringify({
      username: creds.username,
      passwordHash: btoa(newPassword),
    }),
  );
  return true;
}

export function getEmployeeExtras(employeeId: string): EmployeeExtras {
  const stored = localStorage.getItem(ADMIN_EXTRAS_KEY);
  const all: Record<string, EmployeeExtras> = stored ? JSON.parse(stored) : {};
  return all[employeeId] || {};
}

export function saveEmployeeExtras(
  employeeId: string,
  extras: EmployeeExtras,
): void {
  const stored = localStorage.getItem(ADMIN_EXTRAS_KEY);
  const all: Record<string, EmployeeExtras> = stored ? JSON.parse(stored) : {};
  all[employeeId] = { ...all[employeeId], ...extras };
  localStorage.setItem(ADMIN_EXTRAS_KEY, JSON.stringify(all));
}
