"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserProfile } from "@/lib/types";

interface ProfileFormProps {
  profile: UserProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [username, setUsername] = useState(profile.username ?? "");
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("users")
      .update({ username: username || null, full_name: fullName || null, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={profile.email ?? ""} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">Your email cannot be changed here.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="e.g. johndoe"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          type="text"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Profile updated successfully.</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
