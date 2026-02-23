import { Role } from "@/lib/constants";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const isSelf = currentUser.id === id;
  const isAdmin = currentUser.role === Role.ADMIN;

  if (!isSelf && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetUser = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true
    }
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const password = typeof body.password === "string" ? body.password : undefined;

    let role: Role | undefined;
    if (body.role !== undefined) {
      if (!isAdmin) {
        return NextResponse.json({ error: "Only admins can change roles." }, { status: 403 });
      }

      if (body.role !== Role.ADMIN && body.role !== Role.USER) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }

      role = body.role;
    }

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
          NOT: { id }
        }
      });
      if (existing) {
        return NextResponse.json({ error: "Email is already in use." }, { status: 409 });
      }
    }

    if (isAdmin && role === Role.USER && targetUser.role === Role.ADMIN) {
      const adminCount = await db.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "At least one admin must remain." }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password && password.length > 0) updateData.passwordHash = hashPassword(password);
    if (role !== undefined) updateData.role = role;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id },
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
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}
