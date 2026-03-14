# Infinexy Finance HR Portal

## Current State
Admin credentials (username + password hash) are stored in localStorage. This means changing the password on one device does not affect other devices, and each device maintains its own credential store.

## Requested Changes (Diff)

### Add
- Backend functions: `verifyAdminLogin(username, passwordHash)` and `changeAdminPassword(oldHash, newHash)` that store credentials in the canister.
- Default admin credentials seeded in the canister (`admin` / `admin123`).

### Modify
- `adminAuth.ts`: `login()` calls backend `verifyAdminLogin`; `changePassword()` calls backend `changeAdminPassword`. Session flag (logged in/out) stays in localStorage.
- Remove localStorage credential storage -- credentials now live in the canister.

### Remove
- localStorage-based credential read/write (`ADMIN_CREDS_KEY`, `getAdminCredentials`, local `changePassword` logic).

## Implementation Plan
1. Add `adminUsername`, `adminPasswordHash` stable vars to `main.mo` with default values.
2. Add `verifyAdminLogin` (query) and `changeAdminPassword` (shared) functions.
3. Regenerate `backend.d.ts` bindings.
4. Update `adminAuth.ts` to call backend for login and password change.
