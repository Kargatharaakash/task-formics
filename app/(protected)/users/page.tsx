import { PageHeader } from "@/components/PageHeader";
import { UserAdminPanel } from "@/components/UserAdminPanel";
import { isRole, Role } from "@/lib/constants";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";

export default async function UsersPage() {
  await requireAdmin();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="Admin-only user administration" />
      <UserAdminPanel
        initialUsers={users.map((user) => ({
          ...user,
          role: isRole(user.role) ? user.role : Role.USER,
          createdAt: user.createdAt.toISOString()
        }))}
      />
    </div>
  );
}
