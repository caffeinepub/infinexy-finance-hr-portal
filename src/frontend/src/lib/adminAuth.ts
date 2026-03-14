import { createActorWithConfig } from "../config";

const AUTH_TOKEN_KEY = "infinexy_admin_auth";
const ADMIN_EXTRAS_KEY = "infinexy_admin_extras";

export interface EmployeeExtras {
  dateOfJoining?: string;
  dateOfLeaving?: string;
}

// Login verifies credentials against the backend canister only.
// No hardcoded fallback -- password changes take effect immediately on all devices.
export async function login(
  username: string,
  password: string,
): Promise<boolean> {
  const passwordHash = btoa(password);
  try {
    const actor = await createActorWithConfig();
    const valid = await actor.verifyAdminLogin(username, passwordHash);
    if (valid) {
      localStorage.setItem(AUTH_TOKEN_KEY, "true");
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_TOKEN_KEY) === "true";
}

// Change password updates credentials in the canister so all devices pick up the new password.
// Old password stops working immediately after this call.
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<boolean> {
  try {
    const actor = await createActorWithConfig();
    const oldHash = btoa(currentPassword);
    const newHash = btoa(newPassword);
    return await actor.changeAdminPassword(oldHash, newHash);
  } catch {
    return false;
  }
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
