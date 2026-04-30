import type { UserRole } from "../types";

const ROLE_ORDER: Record<UserRole, number> = {
  customer: 0,
  operator: 1,
  admin: 2,
};

export function roleMeetsMinimum(role: UserRole | undefined | null, minimumRole: UserRole) {
  if (!role) {
    return false;
  }
  return ROLE_ORDER[role] >= ROLE_ORDER[minimumRole];
}
