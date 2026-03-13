import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { AcceptBookingButton } from "@/components/accept-booking-button";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { MapPin } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

async function BookingsContent() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) redirect("/auth/login");

  const userId = claims.claims.sub;

  // Get all bookings on cars owned by this user
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, cars!inner(id, make, model, year, location), renter:users(id, username, full_name, email)")
    .eq("cars.owner_id", userId)
    .order("created_at", { ascending: false });

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border rounded-xl">
        <p>No bookings on your cars yet.</p>
      </div>
    );
  }

  const pending = bookings.filter((b) => b.status === "pending");
  const others = bookings.filter((b) => b.status !== "pending");

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Pending Requests</h2>
          <div className="space-y-3">
            {pending.map((booking) => (
              <BookingRow key={booking.id} booking={booking} isOwner />
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">All Bookings</h2>
          <div className="space-y-3">
            {others.map((booking) => (
              <BookingRow key={booking.id} booking={booking} isOwner />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BookingRow({ booking, isOwner }: { booking: any; isOwner: boolean }) {
  const car = booking.cars;
  const renter = booking.renter;
  const renterName = renter?.username ?? renter?.full_name ?? renter?.email ?? "Unknown";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {car.year} {car.make} {car.model}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[booking.status] ?? ""}`}>
                {booking.status}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {car.location}
            </div>
            <p className="text-sm text-muted-foreground">
              Renter:{" "}
              {renter?.id ? (
                <Link href={`/users/${renter.id}`} className="text-foreground font-medium hover:underline">
                  {renterName}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{renterName}</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(booking.start_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              {" → "}
              {new Date(booking.end_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="font-bold text-lg">${booking.total_price}</span>
            {booking.status === "pending" && isOwner && (
              <div className="flex gap-2">
                <AcceptBookingButton bookingId={booking.id} />
                <CancelBookingButton bookingId={booking.id} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BookingsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <DashboardTabs />
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-xl" />}>
        <BookingsContent />
      </Suspense>
    </div>
  );
}
