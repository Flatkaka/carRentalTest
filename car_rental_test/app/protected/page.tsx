import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
      {JSON.stringify(data.claims, null, 2)}
    </pre>
  );
}

export default function ProtectedPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-bold text-2xl">Your user details</h2>
      <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded" />}>
        <UserDetails />
      </Suspense>
    </div>
  );
}
