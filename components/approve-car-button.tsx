"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ApproveCarButton({ carId }: { carId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("cars").update({ status: "active" }).eq("id", carId);
    setLoading(false);
    router.refresh();
  }

  return (
    <Button size="sm" onClick={handleApprove} disabled={loading}>
      {loading ? "Approving..." : "Approve"}
    </Button>
  );
}

export function RejectCarButton({ carId }: { carId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReject() {
    if (!confirm("Reject this car listing?")) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("cars").update({ status: "rejected" }).eq("id", carId);
    setLoading(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant="destructive" onClick={handleReject} disabled={loading}>
      {loading ? "Rejecting..." : "Reject"}
    </Button>
  );
}
