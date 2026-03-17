import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CarCard } from "@/components/Car/car-card";
import { SearchBar } from "@/components/search-bar";
import type { Car } from "@/lib/types";

async function CarsList({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ location?: string; from?: string; to?: string }>;
}) {
  const { location, from, to } = await searchParamsPromise;
  const supabase = await createClient();

  let query = supabase
    .from("cars")
    .select("*, car_images(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (location) {
    query = query.ilike("location", `%${location}%`);
  }

  const { data: cars, error } = await query;

  if (error) {
    return (
      <div className="text-center py-16 text-destructive">
        <p className="font-medium">Failed to load cars</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  let filteredCars = (cars as Car[]) ?? [];

  if (from && to) {
    const supabase2 = await createClient();
    const { data: bookedCarIds } = await supabase2
      .from("bookings")
      .select("car_id")
      .neq("status", "cancelled")
      .lte("start_date", to)
      .gte("end_date", from);

    const bookedIds = new Set((bookedCarIds ?? []).map((b: { car_id: number }) => b.car_id));

    const fromDate = from.slice(0, 10);
    const toDate = to.slice(0, 10);

    filteredCars = filteredCars.filter((c) => {
      if (bookedIds.has(c.id)) return false;
      const blocked = c.blocked_dates ?? [];
      return !blocked.some((r) => fromDate <= r.end && toDate >= r.start);
    });
  }

  if (filteredCars.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">No cars found{location ? ` in "${location}"` : ""}.</p>
        {(location || from || to) && (
          <p className="text-sm mt-2">Try adjusting your search filters.</p>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        {filteredCars.length} {filteredCars.length === 1 ? "car" : "cars"} available
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>
    </>
  );
}

async function CarsHeader({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ location?: string; from?: string; to?: string }>;
}) {
  const { location, from, to } = await searchParamsPromise;
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold mb-4">
        {location ? `Cars in "${location}"` : "All Available Cars"}
      </h1>
      <SearchBar defaultLocation={location} defaultFrom={from} defaultTo={to} />
    </div>
  );
}

interface CarsPageProps {
  searchParams: Promise<{ location?: string; from?: string; to?: string }>;
}

export default function CarsPage({ searchParams }: CarsPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded-xl mb-8" />}>
        <CarsHeader searchParamsPromise={searchParams} />
      </Suspense>
      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse bg-muted rounded-xl" />
          ))}
        </div>
      }>
        <CarsList searchParamsPromise={searchParams} />
      </Suspense>
    </div>
  );
}
