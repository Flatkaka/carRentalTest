"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface CancelBookingButtonProps {
  bookingId: string;
}

export function CancelBookingButton({ bookingId }: CancelBookingButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);
    setLoading(false);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10 self-start" onClick={handleCancel} disabled={loading}>
      {loading ? "Cancelling..." : "Cancel Booking"}
    </Button>
  );
}
