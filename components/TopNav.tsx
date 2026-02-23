import Link from "next/link";
import { Role } from "@/lib/constants";

import type { SessionUser } from "@/lib/auth/current-user";
import { LogoutButton } from "@/components/LogoutButton";

type TopNavProps = {
  user: SessionUser;
};

export function TopNav({ user }: TopNavProps) {
  return (
    <header className="card top-nav">
      <div>
        <div style={{ fontWeight: 700 }}>Event Management</div>
        <div className="small-text">
          {user.name} ({user.role === Role.ADMIN ? "Admin" : "User"})
        </div>
      </div>

      <nav className="nav-links" aria-label="Main navigation">
        <Link className="nav-link" href="/dashboard">
          Dashboard
        </Link>
        <Link className="nav-link" href="/events">
          Events
        </Link>
        <Link className="nav-link" href="/calendar">
          Calendar
        </Link>
        <Link className="nav-link" href="/profile">
          Profile
        </Link>
        {user.role === Role.ADMIN ? (
          <Link className="nav-link" href="/users">
            Users
          </Link>
        ) : null}
      </nav>

      <LogoutButton />
    </header>
  );
}
