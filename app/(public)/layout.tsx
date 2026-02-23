import { redirectIfAuthenticated } from "@/lib/auth/guards";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  await redirectIfAuthenticated();

  return (
    <main className="min-h-screen px-4 py-10 md:px-6">
      <div className="fixed right-4 top-4 z-20 md:right-6 md:top-6">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">{children}</div>
    </main>
  );
}
