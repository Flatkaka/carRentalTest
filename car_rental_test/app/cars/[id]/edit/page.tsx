import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CarForm } from "@/components/Car/car-form";
import { BlockedDatesEditor } from "@/components/Car/blocked-dates-editor";
import type { Car } from "@/lib/types";

async function EditCarContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");

  const { data: car } = await supabase
    .from("cars")
    .select("*, car_images(*)")
    .eq("id", id)
    .single();

  if (!car) notFound();

  const typedCar = car as Car;
  if (typedCar.owner_id !== claims.claims.sub) redirect("/dashboard");

  return (
    <>
      <p className="text-muted-foreground mt-1">
        {typedCar.year} {typedCar.make} {typedCar.model}
      </p>
      <div className="mt-6">
        <CarForm car={typedCar} />
      </div>

      <div className="mt-10 max-w-2xl">
        <h2 className="text-xl font-semibold mb-1">Blocked Dates</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Block specific date ranges to prevent bookings during those periods.
        </p>
        <BlockedDatesEditor
          carId={typedCar.id}
          initial={typedCar.blocked_dates ?? []}
        />
      </div>
    </>
  );
}

interface EditCarPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCarPage({ params }: EditCarPageProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold">Edit Listing</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-xl mt-6" />}>
        <EditCarContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}
