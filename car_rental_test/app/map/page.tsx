import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CarsMap } from "@/components/cars-map";
import type { Car } from "@/lib/types";

async function MapContent() {
  const supabase = await createClient();
  const { data: cars } = await supabase
    .from("cars")
    .select("*, car_images(url, order)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return <CarsMap cars={(cars ?? []) as Car[]} />;
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-[calc(100vh-64px)] animate-pulse bg-muted" />
      }
    >
      <MapContent />
    </Suspense>
  );
}
