import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CarCard } from "@/components/Car/car-card";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import type { Car } from "@/lib/types";

async function FeaturedCars() {
  const supabase = await createClient();

  const { data: cars } = await supabase
    .from("cars")
    .select("*, car_images(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);

  if (!cars || cars.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg mb-4">No cars listed yet.</p>
        <Button asChild>
          <Link href="/cars/new">List the first car</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {(cars as Car[]).map((car) => (
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground py-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
            Rent a car from real people
          </h1>
          <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto">
            Book unique cars from local hosts — or list your own car and start earning.
          </p>
          <div className="flex justify-center pt-2">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Featured cars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Featured Cars</h2>
          <Button asChild variant="outline">
            <Link href="/cars">View all</Link>
          </Button>
        </div>
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse bg-muted rounded-xl" />
            ))}
          </div>
        }>
          <FeaturedCars />
        </Suspense>
      </section>

      {/* CTA */}
      <section className="bg-muted py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold">Have a car sitting idle?</h2>
          <p className="text-muted-foreground">
            List it on DriveShare and earn money every time someone rents it.
          </p>
          <Button asChild size="lg">
            <Link href="/cars/new">List Your Car</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
