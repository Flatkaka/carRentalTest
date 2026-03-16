"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ResendConfirmationButton({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [cooldown, setCooldown] = useState(0);

  async function handleResend() {
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setStatus("error");
    } else {
      setStatus("sent");
      // 60 second cooldown
      let seconds = 60;
      setCooldown(seconds);
      const interval = setInterval(() => {
        seconds -= 1;
        setCooldown(seconds);
        if (seconds <= 0) {
          clearInterval(interval);
          setStatus("idle");
        }
      }, 1000);
    }
  }

  if (status === "sent" || cooldown > 0) {
    return (
      <p className="text-sm text-green-600">
        Email sent! You can resend in {cooldown}s.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {status === "error" && (
        <p className="text-sm text-destructive">Failed to resend. Please try again.</p>
      )}
      <Button variant="outline" className="w-full" onClick={handleResend} disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Resend confirmation email"}
      </Button>
    </div>
  );
}
