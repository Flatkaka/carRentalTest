import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { MapPin, Plus, Pencil } from "lucide-react";
import type { Booking, Car } from "@/lib/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

async function DashboardContent() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) {
    redirect("/auth/login");
  }

  const userId = claims.claims.sub;

  const [{ data: bookings }, { data: myCars }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, cars(*, car_images(*))")
      .eq("renter_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("cars")
      .select("*, car_images(*)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      {/* My Trips */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">My Trips</h2>
        {!bookings || bookings.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-xl">
            <p>No trips yet.</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/cars">Browse cars to rent</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(bookings as Booking[]).map((booking) => {
              const car = booking.cars;
              if (!car) return null;
              const firstImage = car.car_images?.[0]?.url;
              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative w-full sm:w-40 h-32 sm:h-auto bg-muted flex-shrink-0">
                        {firstImage ? (
                          <Image src={firstImage} alt={`${car.make} ${car.model}`} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                        )}
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/cars/${car.id}`} className="font-semibold hover:underline">
                              {car.year} {car.make} {car.model}
                            </Link>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {car.location}
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusColors[booking.status] ?? ""}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {booking.start_date} → {booking.end_date}
                          </span>
                          <span className="font-semibold">${booking.total_price}</span>
                        </div>
                        {booking.status === "pending" && (
                          <CancelBookingButton bookingId={booking.id} />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* My Cars */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Cars</h2>
          <Button asChild size="sm">
            <Link href="/cars/new">
              <Plus className="h-4 w-4 mr-1" /> Add Car
            </Link>
          </Button>
        </div>
        {!myCars || myCars.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-xl">
            <p>You haven&apos;t listed any cars yet.</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/cars/new">List your first car</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(myCars as Car[]).map((car) => {
              const firstImage = car.car_images?.[0]?.url;
              return (
                <Card key={car.id} className="overflow-hidden">
                  <div className="relative h-36 bg-muted">
                    {firstImage ? (
                      <Image src={firstImage} alt={`${car.make} ${car.model}`} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{car.year} {car.make} {car.model}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{car.location}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">${car.price_per_day}/day</Badge>
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full mt-3">
                      <Link href={`/cars/${car.id}/edit`}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-xl" />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
