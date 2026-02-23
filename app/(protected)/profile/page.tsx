import { PageHeader } from "@/components/PageHeader";
import { ProfileForm } from "@/components/ProfileForm";
import { isRole, Role } from "@/lib/constants";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";

export default async function ProfilePage() {
  const user = await requireUser();

  const current = await db.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  if (!current) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My profile" subtitle="Update account details and password" />
      <ProfileForm
        user={{
          name: current.name,
          email: current.email,
          role: isRole(current.role) ? current.role : Role.USER
        }}
      />
      <p className="text-sm text-muted-foreground">
        Account created on {new Date(current.createdAt).toLocaleDateString()}.
      </p>
    </div>
  );
}
