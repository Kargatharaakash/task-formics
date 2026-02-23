import { isRole, Role } from "@/lib/constants";
import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = verifySessionToken(token);
  if (!session) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  if (!user) {
    return null;
  }

  if (!isRole(user.role)) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export function isAdmin(user: SessionUser): boolean {
  return user.role === Role.ADMIN;
}
