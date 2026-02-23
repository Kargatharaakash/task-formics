"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Role } from "@/lib/constants";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

type UserAdminPanelProps = {
  initialUsers: UserRow[];
};

export function UserAdminPanel({ initialUsers }: UserAdminPanelProps) {
  const [users, setUsers] = useState(initialUsers);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>(Role.USER);

  function updateRow(id: string, field: "name" | "email" | "role", value: string) {
    setUsers((current) =>
      current.map((user) => {
        if (user.id !== id) return user;
        if (field === "role") {
          return { ...user, role: value as Role };
        }
        return { ...user, [field]: value };
      })
    );
  }

  async function saveUser(id: string) {
    const row = users.find((item) => item.id === id);
    if (!row) return;

    setSavingUserId(id);

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: row.name,
          email: row.email,
          role: row.role
        })
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string; user?: UserRow };

      if (!response.ok) {
        toast.error(data.error ?? "Failed to update user.");
        return;
      }

      if (data.user) {
        const updatedUser: UserRow = data.user;
        setUsers((current) => current.map((item) => (item.id === id ? { ...item, ...updatedUser } : item)));
      }
      toast.success("User updated.");
    } catch {
      toast.error("Failed to update user.");
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole
        })
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        user?: UserRow;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Failed to create user.");
        return;
      }

      if (data.user) {
        const createdUser: UserRow = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          createdAt: new Date(data.user.createdAt).toISOString()
        };

        setUsers((current) => [createdUser, ...current]);
      }

      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole(Role.USER);
      toast.success("User created.");
    } catch {
      toast.error("Failed to create user.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Create User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-user-name">Name</Label>
                <Input id="new-user-name" value={newName} onChange={(event) => setNewName(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-email">Email</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-user-password">Password</Label>
                <Input
                  id="new-user-password"
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-role">Role</Label>
                <select
                  id="new-user-role"
                  value={newRole}
                  onChange={(event) => setNewRole(event.target.value as Role)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={Role.USER}>USER</option>
                  <option value={Role.ADMIN}>ADMIN</option>
                </select>
              </div>
            </div>

            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create user"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="w-full overflow-hidden">
            <table className="w-full text-sm">
              <thead className="hidden sm:table-header-group">
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="hidden md:table-cell px-3 py-2 font-medium">Email</th>
                  <th className="hidden sm:table-cell px-3 py-2 font-medium">Role</th>
                  <th className="hidden lg:table-cell px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2 font-medium text-right sm:text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="flex flex-col sm:table-row border-b border-border/60 p-4 sm:p-0">
                    <td className="sm:px-3 sm:py-2 mb-2 sm:mb-0">
                      <Label className="sm:hidden mb-1 block text-xs text-muted-foreground">Name</Label>
                      <Input value={user.name} onChange={(event) => updateRow(user.id, "name", event.target.value)} />
                    </td>
                    <td className="sm:px-3 sm:py-2 mb-2 sm:mb-0 md:table-cell">
                      <Label className="sm:hidden mb-1 block text-xs text-muted-foreground">Email</Label>
                      <Input
                        type="email"
                        value={user.email}
                        onChange={(event) => updateRow(user.id, "email", event.target.value)}
                      />
                    </td>
                    <td className="sm:px-3 sm:py-2 mb-3 sm:mb-0 sm:table-cell">
                      <Label className="sm:hidden mb-1 block text-xs text-muted-foreground">Role</Label>
                      <select
                        value={user.role}
                        onChange={(event) => updateRow(user.id, "role", event.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value={Role.USER}>USER</option>
                        <option value={Role.ADMIN}>ADMIN</option>
                      </select>
                    </td>
                    <td className="hidden lg:table-cell px-3 py-2 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="sm:px-3 sm:py-2 flex justify-end">
                      <Button
                        type="button"
                        onClick={() => saveUser(user.id)}
                        disabled={savingUserId === user.id}
                        size="sm"
                        className="max-sm:w-full"
                      >
                        <Save className="h-4 w-4 mr-2 sm:hidden" />
                        {savingUserId === user.id ? "Saving..." : "Save User"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
