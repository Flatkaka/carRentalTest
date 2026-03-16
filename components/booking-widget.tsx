"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Car } from "@/lib/types";

interface BookingWidgetProps {
  car: Car;
  userId: string | null;
}

function daysBetween(a: string, b: string) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

export function BookingWidget({ car, userId }: BookingWidgetProps) {
  const router = useRouter();
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const todayLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const days = from && to && to > from ? Math.ceil(daysBetween(from, to)) : 0;
  const total = days * car.price_per_day;

  async function handleBook() {
    if (!userId) {
      router.push("/auth/login");
      return;
    }
    if (!from || !to || to <= from) {
      setError("Please select valid dates.");
      return;
    }
    setLoading(true);
    setError("");

    const supabase = createClient();

    // Check against owner-blocked dates
    const fromDate = from.slice(0, 10);
    const toDate = to.slice(0, 10);
    const blocked = car.blocked_dates ?? [];
    const blockedOverlap = blocked.some((r) => fromDate <= r.end && toDate >= r.start);
    if (blockedOverlap) {
      setError("The owner has blocked this car during part of your selected dates.");
      setLoading(false);
      return;
    }

    // Check for overlapping bookings
    const { data: overlaps } = await supabase
      .from("bookings")
      .select("id")
      .eq("car_id", car.id)
      .neq("status", "cancelled")
      .lte("start_date", to)
      .gte("end_date", from);

    if (overlaps && overlaps.length > 0) {
      setError("These dates are already booked. Please choose different dates.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("bookings").insert({
      car_id: car.id,
      renter_id: userId,
      start_date: from,
      end_date: to,
      total_price: total,
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">${car.price_per_day}</span>
          <span className="text-muted-foreground text-base font-normal">/day</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="from-date" className="text-xs font-semibold uppercase tracking-wide">
              From
            </Label>
            <input
              id="from-date"
              type="datetime-local"
              value={from}
              min={todayLocal}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to-date" className="text-xs font-semibold uppercase tracking-wide">
              To
            </Label>
            <input
              id="to-date"
              type="datetime-local"
              value={to}
              min={from || todayLocal}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {days > 0 && (
          <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>${car.price_per_day} × {days} {days === 1 ? "day" : "days"}</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        <Button
          className="w-full"
          onClick={handleBook}
          disabled={loading || days === 0}
        >
          {loading ? "Booking..." : userId ? "Book Now" : "Sign in to Book"}
        </Button>

        {!userId && (
          <p className="text-center text-xs text-muted-foreground">
            You need an account to book this car.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
