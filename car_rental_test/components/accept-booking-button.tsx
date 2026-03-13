"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function AcceptBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);
    setLoading(false);
    router.refresh();
  }

  return (
    <Button size="sm" onClick={handleAccept} disabled={loading}>
      {loading ? "Accepting..." : "Accept"}
    </Button>
  );
}
