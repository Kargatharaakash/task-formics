import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fetchCurrent = () => db.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
  });
  const current = await fetchCurrent();

  return NextResponse.json({ user: current });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const password = typeof body.password === "string" ? body.password : undefined;

    if (name !== undefined && !name) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }

    if (email !== undefined && !email) {
      return NextResponse.json({ error: "Email cannot be empty." }, { status: 400 });
    }

    if (password !== undefined && password.length > 0 && password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    if (email) {
      const existing = await db.user.findFirst({
        where: {
          email,
          NOT: { id: user.id }
        }
      });
      if (existing) {
        return NextResponse.json({ error: "Email is already in use." }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password && password.length > 0) updateData.passwordHash = hashPassword(password);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
