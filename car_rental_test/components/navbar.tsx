import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { Car } from "lucide-react";

async function NavbarUserSection() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return (
    <div className="flex items-center gap-4">
      {user && (
        <>
          <Link href="/cars/new" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            List Your Car
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
        </>
      )}
      {user ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden lg:block">{user.email}</span>
          <LogoutButton />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/sign-up">Sign up</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  return (
    <nav className="w-full border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
              <Car className="h-6 w-6" />
              DriveShare
            </Link>
            <Link href="/cars" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Browse Cars
            </Link>
          </div>
          <Suspense fallback={<div className="h-9 w-40 rounded-md bg-muted animate-pulse" />}>
            <NavbarUserSection />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}
