import { roleMeetsMinimum } from "../lib/roles";
import { useAuth } from "../state/AuthContext";
import type { UserRole } from "../types";

export function RoleGuard({
  children,
  fallback = null,
  minRole,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minRole: UserRole;
}) {
  const { user } = useAuth();
  return roleMeetsMinimum(user?.role, minRole) ? children : fallback;
}
