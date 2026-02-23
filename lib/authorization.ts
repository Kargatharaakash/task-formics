import { Role } from "@/lib/constants";

import type { SessionUser } from "@/lib/auth/current-user";

export function canManageEvent(user: SessionUser, eventOwnerId: string): boolean {
  return user.role === Role.ADMIN || user.id === eventOwnerId;
}

export function canViewEvent(user: SessionUser, eventOwnerId: string): boolean {
  return user.role === Role.ADMIN || user.id === eventOwnerId;
}
