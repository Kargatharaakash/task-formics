import { Role } from "@/lib/constants";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { SESSION_COOKIE_NAME, createSessionToken, getSessionMaxAgeSeconds } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    const totalUsers = await db.user.count();
    const role = totalUsers === 0 ? Role.ADMIN : Role.USER;

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    const session = createSessionToken(user.id);
    const cookieStore = await cookies();
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: session.token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionMaxAgeSeconds(),
      expires: session.expiresAt
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to register user." }, { status: 500 });
  }
}
