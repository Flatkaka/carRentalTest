import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { MapPin, CalendarDays, CheckCircle2, Clock, XCircle, CircleDot } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: <Clock className="h-4 w-4" />,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: <XCircle className="h-4 w-4" />,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: <CircleDot className="h-4 w-4" />,
  },
};

async function TripsContent() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) redirect("/auth/login");

  const userId = claims.claims.sub;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, cars(id, make, model, year, location, price_per_day, car_images(url))")
    .eq("renter_id", userId)
    .order("created_at", { ascending: false });

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border rounded-xl">
        <p className="text-lg mb-2">No trips yet.</p>
        <Button asChild variant="link">
          <Link href="/cars">Browse cars to rent</Link>
        </Button>
      </div>
    );
  }

  const active = bookings.filter((b) => b.status === "pending" || b.status === "confirmed");
  const past = bookings.filter((b) => b.status === "cancelled" || b.status === "completed");

  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Active</h2>
          <div className="space-y-4">
            {active.map((booking) => (
              <TripCard key={booking.id} booking={booking} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Past</h2>
          <div className="space-y-4 opacity-75">
            {past.map((booking) => (
              <TripCard key={booking.id} booking={booking} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TripCard({ booking }: { booking: any }) {
  const car = booking.cars;
  const firstImage = car?.car_images?.[0]?.url;
  const status = statusConfig[booking.status];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Car image */}
          <div className="relative w-full sm:w-44 h-36 sm:h-auto bg-muted flex-shrink-0">
            {firstImage ? (
              <Image src={firstImage} alt={`${car.make} ${car.model}`} fill unoptimized className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-4 flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/cars/${car.id}`} className="font-semibold text-base hover:underline">
                  {car.year} {car.make} {car.model}
                </Link>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {car.location}
                </div>
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full capitalize whitespace-nowrap ${status?.color ?? ""}`}>
                {status?.icon}
                {status?.label}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <span>
                {new Date(booking.start_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                {" → "}
                {new Date(booking.end_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">${booking.total_price}</span>
              {booking.status === "pending" && (
                <CancelBookingButton bookingId={booking.id} />
              )}
            </div>

            {/* Status message */}
            {booking.status === "pending" && (
              <p className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
                Waiting for the owner to confirm your booking.
              </p>
            )}
            {booking.status === "confirmed" && (
              <p className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                Your booking is confirmed! Enjoy your trip.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TripsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <DashboardTabs />
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-xl" />}>
        <TripsContent />
      </Suspense>
    </div>
  );
}
