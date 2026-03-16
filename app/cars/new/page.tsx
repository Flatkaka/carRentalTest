import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CarForm } from "@/components/Car/car-form";

async function NewCarContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/auth/login");

  return <CarForm />;
}

export default function NewCarPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">List Your Car</h1>
        <p className="text-muted-foreground mt-1">
          Share your car with the community and earn money.
        </p>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-xl" />}>
        <NewCarContent />
      </Suspense>
    </div>
  );
}
