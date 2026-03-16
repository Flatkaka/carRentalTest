import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { ProfileForm } from "@/components/profile-form";
import type { UserProfile } from "@/lib/types";

async function ProfileContent() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", claims.claims.sub)
    .single();

  if (!profile) {
    redirect("/auth/login");
  }

  return <ProfileForm profile={profile as UserProfile} />;
}

export default function ProfilePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <DashboardTabs />
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-xl" />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
